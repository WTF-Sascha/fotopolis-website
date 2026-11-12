import {devDatabaseConnection} from "./fotopolis-admin-session.mjs";
// FOTOPOLIS Studio 4.3 – preview-only operational diagnostics.
// Verifies real PostgreSQL grants, not only connectivity. Owner-only.
import {neon} from "@neondatabase/serverless";
import {authorizeAdmin,response} from "./fotopolis-admin-session.mjs";
const services=[
 ["inventory","FOTOPOLIS_NEON_DEV_INVENTORY_WRITER_URL","fotopolis_admin_inventory_writer"],
 ["blocks","FOTOPOLIS_NEON_DEV_CALENDAR_WRITER_URL","fotopolis_admin_calendar_writer"],
 ["reservations","FOTOPOLIS_NEON_DEV_RESERVATION_WRITER_URL","fotopolis_admin_reservation_writer"],
 ["calendar","FOTOPOLIS_NEON_DEV_DASHBOARD_READER_URL","fotopolis_admin_dashboard_reader"]
];
// Static table/column names; no untrusted SQL identifiers or dynamic privileges.
// Column-level GRANTs intentionally do NOT imply has_table_privilege(...,'INSERT').
export function grantsReady(service,flags){
 if(!flags||typeof flags!=="object")return false;
 const required={
   inventory:["inventory_create","inventory_rename","inventory_activate","activity_audit","resource_select"],
   blocks:["allocation_create","allocation_update","allocation_audit","activity_audit","resource_select"],
   reservations:["allocation_create","allocation_update","allocation_audit","activity_audit","resource_select"],
   calendar:["resource_select","allocation_select"]
 };
 return (required[service]||[]).length>0&&required[service].every(key=>flags[key]===true);
}
export default async function handler(request,context){
 const auth=await authorizeAdmin(request,context);
 if(auth.denied)return auth.denied;
 if(auth.role!=="owner")return response({error:"Owner only"},403);
 const diagnostics={};
 await Promise.all(services.map(async ([name,key,expected])=>{
   const conn=devDatabaseConnection(key,context);
   if(!conn){diagnostics[name]={configured:false,connected:false,permissionsReady:false};return}
   try{
     const sql=neon(conn);
     const rows=await sql`
       SELECT current_user::text AS role,
         has_column_privilege('fotopolis.resources','resource_code','INSERT') AS inventory_create,
         has_column_privilege('fotopolis.resources','display_name','UPDATE') AS inventory_rename,
         has_column_privilege('fotopolis.resources','enabled','UPDATE') AS inventory_activate,
         has_column_privilege('fotopolis.resources','id','SELECT') AS resource_select,
         has_column_privilege('fotopolis.allocations','allocation_kind','INSERT') AS allocation_create,
         has_column_privilege('fotopolis.allocations','allocation_state','UPDATE') AS allocation_update,
         has_column_privilege('fotopolis.allocations','occupied_from','SELECT') AS allocation_select,
         has_column_privilege('fotopolis.allocation_audit','allocation_id','INSERT') AS allocation_audit,
         has_column_privilege('fotopolis.admin_activity','user_id','INSERT') AS activity_audit
     `;
     const connected=rows[0]?.role===expected;
     diagnostics[name]={
       configured:true,connected,
       permissionsReady:connected&&grantsReady(name,rows[0])
     };
   }catch{
     diagnostics[name]={configured:true,connected:false,permissionsReady:false};
   }
 }));
 return response({previewOnly:true,checkedAt:new Date().toISOString(),services:diagnostics},200);
}
export const config={path:"/api/fotopolis/admin/health",method:["GET"]};
