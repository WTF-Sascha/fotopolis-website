// FOTOPOLIS Studio 4.2 – preview-only read-only occupancy preflight.
// This endpoint never writes allocations and never makes customer-facing
// availability promises. The PostgreSQL exclusion constraint remains final.
import {neon} from "@neondatabase/serverless";
import {authorizeAdmin,response} from "./fotopolis-admin-session.mjs";

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const utc=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
function parseUtc(text){
 if(typeof text!=="string"||!utc.test(text))return null;
 const date=new Date(text);
 return Number.isFinite(date.getTime())&&date.toISOString().slice(0,19)===text.slice(0,19)?date:null;
}
export function validateOccupancyQuery(searchParams){
 const params=searchParams instanceof URLSearchParams?searchParams:new URLSearchParams(searchParams);
 if([...params.keys()].length!==3||!["resourceId","occupiedFromUtc","occupiedUntilUtc"].every(k=>params.has(k)))return {error:"Unexpected occupancy query"};
 const resourceId=params.get("resourceId");
 const from=parseUtc(params.get("occupiedFromUtc")),until=parseUtc(params.get("occupiedUntilUtc"));
 if(!uuid.test(resourceId||""))return {error:"Invalid device identifier"};
 if(!from||!until||until-from<15*60000||until-from>14*86400000)return {error:"Invalid or oversized occupancy window"};
 return {value:{resourceId,occupiedFromUtc:from.toISOString(),occupiedUntilUtc:until.toISOString()}};
}
export default async function handler(request,context){
 const auth=await authorizeAdmin(request,context);
 if(auth.denied)return auth.denied;
 if(!["owner","manager"].includes(auth.role))return response({error:"Administrative permission required"},403);
 const parsed=validateOccupancyQuery(new URL(request.url).searchParams);
 if(parsed.error)return response({error:parsed.error},400);
 const connection=Netlify.env.get("FOTOPOLIS_NEON_DEV_DASHBOARD_READER_URL");
 if(!connection)return response({error:"Occupancy check not configured"},503);
 try{
   const sql=neon(connection);
   const {resourceId,occupiedFromUtc,occupiedUntilUtc}=parsed.value;
   const rows=await sql`
     SELECT r.id,r.enabled,
       EXISTS (
         SELECT 1 FROM fotopolis.allocations a
         WHERE a.resource_id=r.id
           AND a.allocation_state IN ('held','confirmed','blocked')
           AND a.occupied_from < ${occupiedUntilUtc}::timestamptz
           AND a.occupied_until > ${occupiedFromUtc}::timestamptz
       ) AS has_conflict
     FROM fotopolis.resources r
     WHERE r.id=${resourceId}::uuid
     LIMIT 1
   `;
   if(!rows.length)return response({error:"Device not registered"},404);
   const deviceActive=rows[0].enabled===true,hasConflict=rows[0].has_conflict===true;
   return response({
     previewOnly:true,readOnly:true,
     resourceId,occupiedFromUtc,occupiedUntilUtc,
     deviceActive,hasConflict,
     mayCreateInternalHold:deviceActive&&!hasConflict,
     checkedAt:new Date().toISOString(),
     note:"Snapshot only; database exclusion check decides on save."
   },200);
 }catch{
   return response({error:"Occupancy check temporarily unavailable"},503);
 }
}
export const config={path:"/api/fotopolis/admin/occupancy-check",method:["GET"]};
