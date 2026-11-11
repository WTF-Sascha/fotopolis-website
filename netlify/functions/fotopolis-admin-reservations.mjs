// FOTOPOLIS Studio 4.0: isolated internal holds (NOT public customer bookings).
// No customer PII, payments, prices, emails, or public availability promises.
import {neon} from "@neondatabase/serverless";
import {authorizeAdmin,response,samePreviewOrigin} from "./fotopolis-admin-session.mjs";
const uuid=/^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
const utc=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
const exact=(v,keys)=>Object.keys(v).every(k=>keys.includes(k));
function moment(x){
 if(typeof x!=="string"||!utc.test(x))return null;
 const value=new Date(x);
 return Number.isFinite(value.getTime())&&value.toISOString().slice(0,19)===x.slice(0,19)?value:null;
}
export function validateHoldAction(value,method){
 if(!value||typeof value!=="object"||Array.isArray(value))return {error:"Invalid reservation payload"};
 if(method==="POST"){
   if(!exact(value,["resourceId","eventStartUtc","eventEndUtc","occupiedFromUtc","occupiedUntilUtc","inquiryId"])||!uuid.test(value.resourceId||""))return {error:"Invalid device or hold fields"};
   const inquiryId=Object.hasOwn(value,"inquiryId")?value.inquiryId:null;
   if(inquiryId!==null&&(typeof inquiryId!=="string"||!uuid.test(inquiryId)))return {error:"Invalid inquiry reference"};
   const dates=["eventStartUtc","eventEndUtc","occupiedFromUtc","occupiedUntilUtc"].map(k=>moment(value[k]));
   if(dates.some(d=>!d||!Number.isFinite(d.getTime())))return {error:"Valid UTC times required"};
   const [eventStart,eventEnd,from,until]=dates;
   if(from>eventStart||eventEnd>until||eventStart>=eventEnd||
       eventEnd-eventStart<15*60000||until-from>14*86400000||
       eventStart-from>24*3600000||until-eventEnd>24*3600000)return {error:"Invalid event window or logistics buffers"};
   return {value:{resourceId:value.resourceId,eventStartUtc:eventStart.toISOString(),
     eventEndUtc:eventEnd.toISOString(),occupiedFromUtc:from.toISOString(),
     occupiedUntilUtc:until.toISOString(),inquiryId}};
 }
 if(method==="PATCH"){
   if(!exact(value,["id","action"])||!uuid.test(value.id||"")||!["confirm","cancel"].includes(value.action))return {error:"Only booking confirmation or cancellation allowed"};
   return {value:{id:value.id,action:value.action}};
 }
 return {error:"Method not allowed"};
}
export default async function handler(request,context){
 const auth=await authorizeAdmin(request,context,{methods:["POST","PATCH"]});
 if(auth.denied)return auth.denied;
 if(!["owner","manager"].includes(auth.role))return response({error:"Admin permission required"},403);
 if(!samePreviewOrigin(request))return response({error:"Forbidden origin"},403);
 if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type")||""))return response({error:"JSON required"},415);
 let textValue;
 try{textValue=await request.text()}catch{return response({error:"Invalid request"},400)}
 if(textValue.length>4096)return response({error:"Request too large"},413);
 let body;try{body=JSON.parse(textValue)}catch{return response({error:"Invalid JSON"},400)}
 const parsed=validateHoldAction(body,request.method);
 if(parsed.error)return response({error:parsed.error},400);
 const conn=Netlify.env.get("FOTOPOLIS_NEON_DEV_RESERVATION_WRITER_URL");
 if(!conn)return response({error:"Internal reservations not configured"},503);
 try{
   const sql=neon(conn);let rows;
   if(request.method==="POST"){
     const {resourceId,eventStartUtc,eventEndUtc,occupiedFromUtc,occupiedUntilUtc,inquiryId}=parsed.value;
     rows=await sql`
       WITH held AS (
         INSERT INTO fotopolis.allocations(resource_id,allocation_kind,allocation_state,
           event_start_at,event_end_at,occupied_from,occupied_until,inquiry_id)
         SELECT r.id,'booking','held',${eventStartUtc}::timestamptz,
           ${eventEndUtc}::timestamptz,${occupiedFromUtc}::timestamptz,
           ${occupiedUntilUtc}::timestamptz,${inquiryId}::uuid
         FROM fotopolis.resources r
         WHERE r.id=${resourceId}::uuid AND r.enabled=true
           AND (${inquiryId}::uuid IS NULL OR EXISTS (
             SELECT 1 FROM fotopolis_studio13.inquiries i WHERE i.id=${inquiryId}::uuid
           ))
         RETURNING id,resource_id,allocation_kind,allocation_state,
           event_start_at,event_end_at,occupied_from,occupied_until,inquiry_id
       ), logged AS (
         INSERT INTO fotopolis.admin_activity(user_id,action,entity_id)
         SELECT ${auth.userId}::uuid,'create_booking',id FROM held
       ) SELECT * FROM held
     `;
   }else{
     const {id,action}=parsed.value;
     const next=action==="confirm"?"confirmed":"cancelled";
     const before=action==="confirm"?"held":null;
     rows=await sql`
       WITH updated AS (
         UPDATE fotopolis.allocations SET allocation_state=${next}
         WHERE id=${id}::uuid AND allocation_kind='booking'
           AND ( (${before}::text IS NOT NULL AND allocation_state=${before})
                 OR (${before}::text IS NULL AND allocation_state IN ('held','confirmed')) )
         RETURNING id,resource_id,allocation_kind,allocation_state,
           event_start_at,event_end_at,occupied_from,occupied_until
       ), logged AS (
         INSERT INTO fotopolis.admin_activity(user_id,action,entity_id)
         SELECT ${auth.userId}::uuid,${action==="confirm"?"update_booking":"cancel_booking"},id FROM updated
       ) SELECT * FROM updated
     `;
   }
   if(!rows.length)return response({error:"Active device, inquiry or reservation not found"},404);
   return response({saved:true,allocation:rows[0],previewOnly:true},request.method==="POST"?201:200);
 }catch(e){
   if(e?.code==="23P01")return response({error:"Device is already occupied in this window"},409);
   return response({error:"Internal reservation unavailable"},503);
 }
}
export const config={path:"/api/fotopolis/admin/reservations",method:["POST","PATCH"]};
