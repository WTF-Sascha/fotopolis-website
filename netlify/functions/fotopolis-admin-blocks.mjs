// FOTOPOLIS Studio 4.0 preview-only: private internal block persistence.
// Server verified Neon Auth JWT, RBAC and least-privilege PostgreSQL role.
import {neon} from "@neondatabase/serverless";
import {authorizeAdmin,response} from "./fotopolis-admin-session.mjs";
const origin="https://deploy-preview-2--fotopolis-preview.netlify.app";
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const kinds=new Set(["internal_block","maintenance"]);
const iso=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const hasOnly=(value,keys)=>Object.keys(value).every(k=>keys.includes(k));
export function validateCalendarChange(value,method){
 if(!value||typeof value!=="object"||Array.isArray(value))return {error:"Invalid request"};
 if(method==="POST"){
   if(!hasOnly(value,["resourceId","kind","startUtc","endUtc"])||
      !uuid.test(value.resourceId||"")||!kinds.has(value.kind)||
      typeof value.startUtc!=="string"||typeof value.endUtc!=="string"||
      !iso.test(value.startUtc)||!iso.test(value.endUtc))return {error:"Invalid block information"};
   const start=new Date(value.startUtc),end=new Date(value.endUtc);
   if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||
       end-start<15*60000||end-start>14*86400000)return {error:"Time window must be between 15 minutes and 14 days"};
   return {value:{resourceId:value.resourceId,kind:value.kind,startUtc:start.toISOString(),endUtc:end.toISOString()}};
 }
 if(method==="PATCH"){
   if(!hasOnly(value,["id","action"])||!uuid.test(value.id||"")||value.action!=="cancel")return {error:"Only explicit block cancellation is allowed"};
   return {value:{id:value.id,action:"cancel"}};
 }
 return {error:"Method not allowed"};
}
export default async function handler(request,context){
 const auth=await authorizeAdmin(request,context,{methods:["POST","PATCH"]});
 if(auth.denied)return auth.denied;
 if(!["owner","manager"].includes(auth.role))return response({error:"Admin permission required"},403);
 if(request.headers.get("origin")!==origin)return response({error:"Forbidden origin"},403);
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type")||""))return response({error:"JSON required"},415);
 let textValue;
 try{textValue=await request.text()}catch{return response({error:"Invalid request"},400)}
 if(textValue.length>4096)return response({error:"Request too large"},413);
 let body;
 try{body=JSON.parse(textValue)}catch{return response({error:"Invalid JSON"},400)}
 const parsed=validateCalendarChange(body,request.method);
 if(parsed.error)return response({error:parsed.error},400);
 const url=Netlify.env.get("FOTOPOLIS_NEON_DEV_CALENDAR_WRITER_URL");
 if(!url)return response({error:"Calendar storage not configured"},503);
 try{
   const sql=neon(url);
   let result;
   if(request.method==="POST"){
     const {resourceId,kind,startUtc,endUtc}=parsed.value;
     result=await sql`
       WITH created AS (
         INSERT INTO fotopolis.allocations(
           resource_id,allocation_kind,allocation_state,event_start_at,
           event_end_at,occupied_from,occupied_until
         )
         SELECT r.id,${kind},'blocked',${startUtc}::timestamptz,
           ${endUtc}::timestamptz,${startUtc}::timestamptz,${endUtc}::timestamptz
         FROM fotopolis.resources r WHERE r.id=${resourceId}::uuid
         RETURNING id,resource_id,allocation_kind,allocation_state,
           event_start_at,event_end_at,occupied_from,occupied_until
       ), logged AS (
         INSERT INTO fotopolis.admin_activity(user_id,action,entity_id)
         SELECT ${auth.userId}::uuid,'create_block',id FROM created
       ) SELECT * FROM created
     `;
   }else{
     const {id}=parsed.value;
     result=await sql`
       WITH cancelled AS (
         UPDATE fotopolis.allocations SET allocation_state='cancelled'
         WHERE id=${id}::uuid
           AND allocation_kind IN ('internal_block','maintenance')
           AND allocation_state='blocked'
         RETURNING id,resource_id,allocation_kind,allocation_state,
           event_start_at,event_end_at,occupied_from,occupied_until
       ), logged AS (
         INSERT INTO fotopolis.admin_activity(user_id,action,entity_id)
         SELECT ${auth.userId}::uuid,'remove_block',id FROM cancelled
       ) SELECT * FROM cancelled
     `;
   }
   if(result.length===0)return response({error:"Resource or active block not found"},404);
   return response({saved:true,allocation:result[0]},request.method==="POST"?201:200);
 }catch(e){
   if(e?.code==="23P01")return response({error:"Time window conflicts with another booking or block"},409);
   if(e?.code==="23503")return response({error:"Resource unavailable"},404);
   return response({error:"Calendar write temporarily unavailable"},503);
 }
}
export const config={path:"/api/fotopolis/admin/blocks",method:["POST","PATCH"]};
