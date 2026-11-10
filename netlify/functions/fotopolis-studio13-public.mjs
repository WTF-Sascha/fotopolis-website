// FOTOPOLIS Studio 13 / Preview-only public gateway.
// Individual enquiries contain customer data; metrics contain no IP/UA/cookies.
import {neon} from "@neondatabase/serverless";
import {response,samePreviewOrigin} from "./fotopolis-admin-session.mjs";
const previewHost=/^deploy-preview-[1-9][0-9]*--fotopolis-preview\.netlify\.app$/i;
const paths=new Set(["/","/fotobox/","/fotospiegel/","/fotowohnwagen/","/designvorlagen/","/kontakt/","/pakete/","/faq/","/anlaesse/","/ueber-uns/"]);
const metricTypes=new Set(["seitenaufruf","produktinteresse","designauswahl","anfrage_gesendet"]);
const sourceTypes=new Set(["website","product"]);
const productTypes=new Set(["Fotobox","Fotospiegel","Fotowohnwagen","Noch offen"]);
const day=/^\d{4}-\d{2}-\d{2}$/;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validDate=s=>{
 if(s===null||s==="")return true;
 if(typeof s!=="string"||!day.test(s))return false;
 const value=new Date(s+"T00:00:00Z");
 return Number.isFinite(value.getTime())&&value.toISOString().slice(0,10)===s;
};
const field=(s,max)=>typeof s==="string"&&s.trim().length<=max?s.trim():null;
export function validateEnquiry(v){
 if(!v||typeof v!=="object"||Array.isArray(v))return null;
 const name=field(v.fullName,100),email=field(v.email,254),phone=field(v.phone||"",45);
 const location=field(v.eventLocation||"",160),notes=field(v.notes||"",1500);
 const date=v.eventDate||null,template=v.templateId||null;
 if(!uuid.test(v.requestKey||"")||!sourceTypes.has(v.source)||!name||name.length<2||!email||
   !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)||phone===null||location===null||notes===null||
   !productTypes.has(v.product)||!validDate(date)||v.consentConfirmed!==true||
   (template!==null&&!/^FP-0(?:[0-3][0-9]|4[0-4])$/.test(template))||
   (v.website&&String(v.website).length>100))return null;
 return {key:v.requestKey,source:v.source,name,email,phone,product:v.product,
         date,location,template,notes,honeypot:!!v.website};
}
export function validateMetric(v){
 if(!v||typeof v!=="object"||Array.isArray(v))return null;
 if(!paths.has(v.page)||!metricTypes.has(v.eventType))return null;
 if(v.eventType==="produktinteresse"&&!["/fotobox/","/fotospiegel/","/fotowohnwagen/"].includes(v.page))return null;
 if(v.eventType==="designauswahl"&&v.page!=="/designvorlagen/")return null;
 return {page:v.page,event:v.eventType};
}
async function jsonBody(req,max){
 if(!/^application\/json(?:\s*;|$)/i.test(req.headers.get("content-type")||""))return null;
 const size=Number(req.headers.get("content-length"));
 if(Number.isFinite(size)&&size>max)return null;
 let raw;try{raw=await req.text()}catch{return null}
 if(raw.length>max)return null;
 try{return JSON.parse(raw)}catch{return null}
}
export default async function handler(req,context){
 const uri=new URL(req.url),path=uri.pathname;
 if(context?.deploy?.context!=="deploy-preview"||context?.deploy?.published===true||
    uri.protocol!=="https:"||!previewHost.test(uri.hostname))return response({error:"Not found"},404);
 if(!["/api/fotopolis/studio13/enquiry","/api/fotopolis/studio13/metric","/api/fotopolis/studio13/content"].includes(path))
   return response({error:"Not found"},404);
 if((path.endsWith("/content")?req.method!=="GET":req.method!=="POST"))
   return response({error:"Method not allowed"},405);
 if(req.method==="POST"&&!samePreviewOrigin(req))return response({error:"Origin denied"},403);
 const connection=Netlify.env.get("FOTOPOLIS_STUDIO13_DEV_DB_URL");
 if(!connection)return response({error:"Studio 13 data connection unavailable"},503);
 try{
   const sql=neon(connection);
   if(path.endsWith("/content")){
     const rows=await sql`SELECT content_key,published_text FROM fotopolis_studio13.cms_content WHERE published_text <> ''`;
     return response({content:Object.fromEntries(rows.map(r=>[r.content_key,r.published_text])),previewOnly:true},200);
   }
   const body=await jsonBody(req,path.endsWith("/metric")?512:8000);
   if(path.endsWith("/metric")){
     const m=validateMetric(body);
     if(!m)return response({error:"Invalid metric"},400);
     // Aggregate by Europe/Berlin's date without identifying the visitor.
     await sql`INSERT INTO fotopolis_studio13.analytics_daily(event_date,page,event_type,hits)
       VALUES ((CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Berlin')::date,${m.page},${m.event},1)
       ON CONFLICT(event_date,page,event_type) DO UPDATE SET hits=fotopolis_studio13.analytics_daily.hits+1`;
     return response({recorded:true},202);
   }
   const e=validateEnquiry(body);
   if(!e)return response({error:"Bitte Anfrage und Einwilligung prüfen."},400);
   if(e.honeypot)return response({accepted:true,notBooked:true},202);
   const rows=await sql`
      WITH saved AS (
        INSERT INTO fotopolis_studio13.inquiries
          (request_key,source,full_name,email,phone,product,event_date,event_location,template_id,notes,consent_confirmed)
        VALUES (${e.key}::uuid,${e.source},${e.name},${e.email},${e.phone},${e.product},
                ${e.date}::date,${e.location},${e.template},${e.notes},true)
        ON CONFLICT(request_key) DO NOTHING RETURNING id
      ), audit AS (
        INSERT INTO fotopolis_studio13.inquiry_history(inquiry_id,action)
        SELECT id,'eingegangen' FROM saved
      )
      SELECT id FROM saved
      UNION ALL SELECT id FROM fotopolis_studio13.inquiries WHERE request_key=${e.key}::uuid
      LIMIT 1`;
   if(!rows.length)return response({error:"Anfrage konnte nicht bestätigt werden"},503);
   return response({accepted:true,id:rows[0].id,notBooked:true},201);
 }catch{
   return response({error:"Dienst aktuell nicht erreichbar"},503);
 }
}
export const config={path:["/api/fotopolis/studio13/enquiry","/api/fotopolis/studio13/metric","/api/fotopolis/studio13/content"],method:["GET","POST"]};
