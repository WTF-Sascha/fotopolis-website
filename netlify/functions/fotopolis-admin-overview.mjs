// FOTOPOLIS private, read-only admin calendar data. Preview only.
// Each request validates signed Neon Auth JWT and active role BEFORE database access.
import {neon} from "@neondatabase/serverless";
import {authorizeAdmin,response} from "./fotopolis-admin-session.mjs";

function validDate(value){return typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&new Date(value+"T00:00:00Z").toISOString().slice(0,10)===value}
export default async function handler(request,context){
  const auth=await authorizeAdmin(request,context);
  if(auth.denied)return auth.denied;
  const url=new URL(request.url);
  const from=url.searchParams.get("from"),to=url.searchParams.get("to");
  if(!validDate(from)||!validDate(to))return response({error:"Bitte gültigen Datumsbereich wählen."},400);
  const fromTime=new Date(from+"T00:00:00Z"),toTime=new Date(to+"T00:00:00Z");
  const days=(toTime-fromTime)/86400000;
  if(days<=0||days>45)return response({error:"Datumsbereich auf maximal 45 Tage begrenzen."},400);
  const connection=Netlify.env.get("FOTOPOLIS_NEON_DEV_DASHBOARD_READER_URL");
  if(!connection)return response({error:"Datenansicht derzeit nicht konfiguriert"},503);
  try{
    const db=neon(connection);
    const [resources,allocations]=await Promise.all([
      db`SELECT id,resource_code,product_type,display_name,enabled
         FROM fotopolis.resources ORDER BY product_type,resource_code LIMIT 100`,
      db`SELECT id,resource_id,allocation_kind,allocation_state,event_start_at,event_end_at,occupied_from,occupied_until,inquiry_id
         FROM fotopolis.allocations
         WHERE occupied_until >= ${fromTime.toISOString()}::timestamptz
           AND occupied_from < ${toTime.toISOString()}::timestamptz
         ORDER BY occupied_from LIMIT 200`
    ]);
    return response({resources,allocations,range:{from,to},readOnly:true,role:auth.role},200);
  }catch{
    return response({error:"Kalenderdaten derzeit nicht verfügbar"},503);
  }
}
export const config={path:"/api/fotopolis/admin/overview",method:["GET"]};
