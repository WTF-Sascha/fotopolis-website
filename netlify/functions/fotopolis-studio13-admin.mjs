// FOTOPOLIS Studio 13 – authenticated operational modules.
// Every request rechecks Neon Auth/JWT AND active base membership; scoped roles add module rights only.
import {neon} from "@neondatabase/serverless";
import {createHash} from "node:crypto";
import {authorizeAdmin,response,samePreviewOrigin} from "./fotopolis-admin-session.mjs";
const prefix="/api/fotopolis/studio13/admin/";
const idPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validKeys=new Set(["hero_note","contact_note","faq_intro","about_note"]);
const validStages=new Set(["unbearbeitet","in_pruefung","freigegeben"]);
const validStates=new Set(["neu","in_pruefung","angebot","abgeschlossen","abgesagt"]);
const roleSet=new Set(["designer","editor","eventmanager","analyst"]);
const capabilities={
 owner:{"analytics":["GET"],"inquiries":["GET","PATCH"],"cms":["GET","POST"],"media":["GET","POST","PATCH"],"designs":["GET","POST"],"roles":["GET","POST"],"audit":["GET"]},
 manager:{"analytics":["GET"],"inquiries":["GET","PATCH"],"cms":["GET","POST"],"media":["GET","POST","PATCH"],"designs":["GET","POST"],"audit":["GET"]},
 designer:{"media":["GET","POST","PATCH"],"designs":["GET","POST"]},
 editor:{"cms":["GET","POST"],"media":["GET"],"designs":["GET"]},
 eventmanager:{"inquiries":["GET","PATCH"]},
 analyst:{"analytics":["GET"]},
 viewer:{"analytics":["GET"]}
};
export const may=(role,module,method)=>!!capabilities[role]?.[module]?.includes(method);
const message=(msg,code=400)=>response({error:msg},code);
async function bodyJson(request,max=4096){
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type")||""))return null;
 const len=Number(request.headers.get("content-length"));
 if(Number.isFinite(len)&&len>max)return null;
 let raw;try{raw=await request.text()}catch{return null}
 if(raw.length>max)return null;
 try{const out=JSON.parse(raw);return out&&typeof out==="object"&&!Array.isArray(out)?out:null}catch{return null}
}
function fileType(data,mime){
 if(mime==="image/png")return data.length>=24&&data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 if(mime==="image/jpeg")return data.length>=4&&data[0]===255&&data[1]===216&&data[2]===255;
 if(mime==="image/webp")return data.length>=16&&data.toString("ascii",0,4)==="RIFF"&&data.toString("ascii",8,12)==="WEBP";
 return false;
}
async function scope(sql,auth){
 if(auth.role==="owner"||auth.role==="manager")return auth.role;
 const rows=await sql`SELECT role FROM fotopolis_studio13.staff_roles WHERE user_id=${auth.userId}::uuid AND active=true LIMIT 1`;
 return rows[0]?.role||"viewer";
}
async function log(sql,uid,action,type,target){
 await sql`INSERT INTO fotopolis_studio13.audit_events(user_id,action,target_type,target_id)
 VALUES (${uid}::uuid,${action},${type},${String(target||"").slice(0,80)})`;
}
export default async function handler(req,context){
 const auth=await authorizeAdmin(req,context,{methods:["GET","POST","PATCH"]});
 if(auth.denied)return auth.denied;
 const url=new URL(req.url),suffix=url.pathname.startsWith(prefix)?url.pathname.slice(prefix.length):"";
 const [module,id,...other]=suffix.split("/");
 if(!module||other.length||!capabilities.owner[module])return message("Not found",404);
 if(req.method!=="GET"&&!samePreviewOrigin(req))return message("Forbidden origin",403);
 const key=Netlify.env.get("FOTOPOLIS_STUDIO13_DEV_DB_URL");
 if(!key)return message("Studio 13 database not configured",503);
 try{
  const sql=neon(key),role=await scope(sql,auth);
  if(!may(role,module,req.method))return message("Keine Berechtigung für diesen Bereich",403);
  if(module==="analytics"){
   if(id)return message("Not found",404);
   const rows=await sql`SELECT event_date,page,event_type,hits FROM fotopolis_studio13.analytics_daily
     WHERE event_date >= ((now() AT TIME ZONE 'Europe/Berlin')::date - INTERVAL '30 days')
     ORDER BY event_date DESC,page,event_type LIMIT 500`;
   const total=rows.reduce((n,x)=>n+Number(x.hits||0),0);
   return response({rows,total,kind:"Gezählte Ereignisse – keine eindeutigen Besucher",days:30,source:"Studio-13-Preview, aggregiert ohne Cookies"},200);
  }
  if(module==="inquiries"){
   if(req.method==="GET"){
    if(id)return message("Not found",404);
    const rows=await sql`SELECT id,source,full_name,email,phone,product,event_date,event_location,template_id,
       notes,status,created_at,updated_at FROM fotopolis_studio13.inquiries ORDER BY created_at DESC LIMIT 100`;
    return response({rows,source:"Studio-13-Synchronisation; bestehende Netlify Forms sind gesondert zu prüfen"},200);
   }
   if(!idPattern.test(id||""))return message("Ungültige Anfrage-ID");
   const b=await bodyJson(req);
   if(!b||!validStates.has(b.status))return message("Ungültiger Bearbeitungsstatus");
   const changed=await sql`WITH updated AS (
       UPDATE fotopolis_studio13.inquiries SET status=${b.status},updated_at=now(),updated_by=${auth.userId}::uuid
       WHERE id=${id}::uuid RETURNING id,status
      ), history AS (
       INSERT INTO fotopolis_studio13.inquiry_history(inquiry_id,actor_id,action)
       SELECT id,${auth.userId}::uuid,'status_geaendert' FROM updated
      ) SELECT * FROM updated`;
   if(!changed.length)return message("Anfrage nicht gefunden",404);
   await log(sql,auth.userId,"inquiry_status","inquiry",id);
   return response({saved:true,item:changed[0]},200);
  }
  if(module==="cms"){
   if(id)return message("Not found",404);
   if(req.method==="GET"){
    const rows=await sql`SELECT content_key,draft_text,published_text,version,published_version,updated_at
      FROM fotopolis_studio13.cms_content ORDER BY content_key`;
    const versions=await sql`SELECT content_key,version,created_at FROM fotopolis_studio13.cms_history
       ORDER BY created_at DESC LIMIT 80`;
    return response({rows,versions,previewOnly:true},200);
   }
   const b=await bodyJson(req,5500);
   if(!b||!validKeys.has(b.key)||!["save","publish","rollback"].includes(b.action))return message("Ungültige CMS-Aktion");
   if(b.action==="save"){
    if(typeof b.text!=="string"||b.text.length>1200)return message("Text darf maximal 1.200 Zeichen enthalten");
    const rows=await sql`UPDATE fotopolis_studio13.cms_content SET draft_text=${b.text},version=version+1,
          updated_at=now(),updated_by=${auth.userId}::uuid WHERE content_key=${b.key}
          RETURNING content_key,version,draft_text`;
    await log(sql,auth.userId,"cms_draft","content",b.key);
    return response({saved:true,item:rows[0],published:false},200);
   }
   if(b.action==="publish"){
    if(!["owner","editor"].includes(role))return message("Veröffentlichungsrecht fehlt",403);
    const rows=await sql`WITH changed AS (
      UPDATE fotopolis_studio13.cms_content SET published_text=draft_text,published_version=version,
        updated_at=now(),updated_by=${auth.userId}::uuid WHERE content_key=${b.key}
      RETURNING content_key,published_text,published_version
      ), historic AS (
       INSERT INTO fotopolis_studio13.cms_history(content_key,version,published_text,actor_id)
       SELECT content_key,published_version,published_text,${auth.userId}::uuid FROM changed
      ) SELECT * FROM changed`;
    await log(sql,auth.userId,"cms_preview_publish","content",b.key);
    return response({saved:true,item:rows[0],previewOnly:true},200);
   }
   if(!["owner","editor"].includes(role)||!Number.isInteger(b.version)||b.version<0)return message("Rücksetzung nicht erlaubt",403);
   const history=await sql`SELECT published_text FROM fotopolis_studio13.cms_history
      WHERE content_key=${b.key} AND version=${b.version} ORDER BY id DESC LIMIT 1`;
   if(!history.length)return message("Version nicht gefunden",404);
   const rows=await sql`WITH changed AS (
     UPDATE fotopolis_studio13.cms_content SET draft_text=${history[0].published_text},published_text=${history[0].published_text},
       version=version+1,published_version=version+1,updated_at=now(),updated_by=${auth.userId}::uuid
     WHERE content_key=${b.key} RETURNING content_key,version,published_text
     ), historic AS (
       INSERT INTO fotopolis_studio13.cms_history(content_key,version,published_text,actor_id)
       SELECT content_key,version,published_text,${auth.userId}::uuid FROM changed
     ) SELECT * FROM changed`;
   await log(sql,auth.userId,"cms_rollback","content",b.key);
   return response({saved:true,item:rows[0]},200);
  }
  if(module==="designs"){
   if(req.method==="GET"){
    const rows=await sql`SELECT template_id,stage,review_note,updated_at
       FROM fotopolis_studio13.design_reviews ORDER BY template_id`;
    return response({rows,totalAssets:44,assetIntegrity:"Reference master remains immutable"},200);
   }
   if(!/^FP-0(?:[0-3][0-9]|4[0-4])$/.test(id||"")||id==="FP-000")return message("Ungültige Design-ID");
   const b=await bodyJson(req);
   if(!b||!validStages.has(b.stage)||typeof b.note!=="string"||b.note.length>600)return message("Ungültige Designprüfung");
   const rows=await sql`INSERT INTO fotopolis_studio13.design_reviews(template_id,stage,review_note,updated_by)
     VALUES (${id},${b.stage},${b.note},${auth.userId}::uuid)
     ON CONFLICT(template_id) DO UPDATE SET stage=EXCLUDED.stage,review_note=EXCLUDED.review_note,
       updated_by=EXCLUDED.updated_by,updated_at=now()
     RETURNING template_id,stage,review_note`;
   await log(sql,auth.userId,"design_review","design",id);
   return response({saved:true,item:rows[0],previewOnly:true},200);
  }
  if(module==="media"){
   if(req.method==="GET"&&id){
    if(!idPattern.test(id))return message("Invalid media ID");
    const rows=await sql`SELECT mime_type,encode(image_data,'base64') AS encoded
       FROM fotopolis_studio13.media_assets WHERE id=${id}::uuid AND state='privat' LIMIT 1`;
    if(!rows.length)return message("Media not found",404);
    return new Response(Buffer.from(rows[0].encoded,"base64"),{
      status:200,headers:{"Content-Type":rows[0].mime_type,"Cache-Control":"no-store",
          "X-Content-Type-Options":"nosniff","Content-Security-Policy":"default-src 'none'"}});
   }
   if(req.method==="GET"){
    const rows=await sql`SELECT id,filename,mime_type,file_bytes,sha256,alt_text,license_note,state,created_at
       FROM fotopolis_studio13.media_assets ORDER BY created_at DESC LIMIT 100`;
    return response({rows,privateOnly:true,maxFileBytes:2097152},200);
   }
   if(req.method==="PATCH"){
    if(!idPattern.test(id||""))return message("Ungültige Medien-ID");
    const b=await bodyJson(req);
    if(!b||b.action!=="archive")return message("Nur Archivierung möglich");
    const rows=await sql`UPDATE fotopolis_studio13.media_assets SET state='archiviert'
       WHERE id=${id}::uuid RETURNING id,state`;
    if(!rows.length)return message("Medium nicht gefunden",404);
    await log(sql,auth.userId,"media_archive","media",id);
    return response({saved:true,item:rows[0]},200);
   }
   if(id)return message("Not found",404);
   const b=await bodyJson(req,2950000);
   if(!b||typeof b.base64!=="string"||b.base64.length>2800000||!/^[A-Za-z0-9+/]+={0,2}$/.test(b.base64)||
      typeof b.filename!=="string"||b.filename.length>100||!/^[^\\/<>:\u0000-\u001f]+$/.test(b.filename)||
      typeof b.altText!=="string"||b.altText.trim().length<3||b.altText.length>200||
      typeof b.licenseNote!=="string"||b.licenseNote.trim().length<5||b.licenseNote.length>350)
      return message("Ungültige Mediendaten");
   const buffer=Buffer.from(b.base64,"base64");
   if(buffer.length<16||buffer.length>2097152||!fileType(buffer,b.mimeType))return message("Nur echte JPG-, PNG- und WebP-Bilder bis 2 MB erlaubt");
   const hash=createHash("sha256").update(buffer).digest("hex");
   const rows=await sql`INSERT INTO fotopolis_studio13.media_assets
     (filename,mime_type,image_data,file_bytes,sha256,alt_text,license_note,uploaded_by)
     VALUES (${b.filename},${b.mimeType},decode(${b.base64},'base64'),${buffer.length},${hash},
             ${b.altText.trim()},${b.licenseNote.trim()},${auth.userId}::uuid)
     RETURNING id,filename,mime_type,file_bytes,alt_text,license_note,state,created_at`;
   await log(sql,auth.userId,"media_upload","media",rows[0].id);
   return response({saved:true,item:rows[0],privateOnly:true},201);
  }
  if(module==="roles"){
   if(req.method==="GET"){
    const conn=Netlify.env.get("FOTOPOLIS_NEON_DEV_AUTH_READER_URL");
    if(!conn)return message("Mitgliederverzeichnis nicht erreichbar",503);
    const members=await neon(conn)`SELECT user_id,admin_role,enabled FROM fotopolis.admin_members ORDER BY created_at DESC LIMIT 50`;
    const scoped=await sql`SELECT user_id,role,active,updated_at FROM fotopolis_studio13.staff_roles`;
    const roles=new Map(scoped.map(x=>[x.user_id,x]));
    return response({rows:members.map(x=>({userId:x.user_id,baseRole:x.admin_role,enabled:x.enabled,
         scope:roles.get(x.user_id)?.role||null,scopeEnabled:roles.get(x.user_id)?.active||false}))},200);
   }
   const b=await bodyJson(req);
   if(!b||!idPattern.test(b.userId||"")||!roleSet.has(b.role)||typeof b.active!=="boolean")
     return message("Ungültige Rollenangaben");
   if(b.userId===auth.userId)return message("Eigene Rolle kann nicht überschrieben werden",403);
   const connection=Netlify.env.get("FOTOPOLIS_NEON_DEV_AUTH_READER_URL");
   if(!connection)return message("Mitgliederprüfung fehlt",503);
   const member=await neon(connection)`SELECT admin_role,enabled FROM fotopolis.admin_members
      WHERE user_id=${b.userId}::uuid LIMIT 1`;
   if(!member.length||!member[0].enabled||member[0].admin_role==="owner")return message("Kein freigeschalteter, zuweisbarer Benutzer",403);
   const rows=await sql`INSERT INTO fotopolis_studio13.staff_roles(user_id,role,active,assigned_by)
     VALUES (${b.userId}::uuid,${b.role},${b.active},${auth.userId}::uuid)
     ON CONFLICT(user_id) DO UPDATE SET role=EXCLUDED.role,active=EXCLUDED.active,
       assigned_by=EXCLUDED.assigned_by,updated_at=now() RETURNING user_id,role,active`;
   await log(sql,auth.userId,"role_assignment","staff",b.userId);
   return response({saved:true,item:rows[0]},200);
  }
  if(module==="audit"){
   const rows=await sql`SELECT action,target_type,target_id,created_at
      FROM fotopolis_studio13.audit_events ORDER BY created_at DESC LIMIT 80`;
   return response({rows},200);
  }
  return message("Not found",404);
 }catch{
  return message("Bereich derzeit nicht erreichbar",503);
 }
}
export const config={path:["/api/fotopolis/studio13/admin/:module","/api/fotopolis/studio13/admin/:module/:id"],method:["GET","POST","PATCH"]};
