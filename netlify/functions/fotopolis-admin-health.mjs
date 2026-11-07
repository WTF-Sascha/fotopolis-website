// FOTOPOLIS Studio 4.0 – private operational diagnostics.
// Tests database connections without exposing credentials, data or SQL errors.
import {neon} from "@neondatabase/serverless";
import {authorizeAdmin,response} from "./fotopolis-admin-session.mjs";
const services=[
 ["inventory","FOTOPOLIS_NEON_DEV_INVENTORY_WRITER_URL","fotopolis_admin_inventory_writer"],
 ["blocks","FOTOPOLIS_NEON_DEV_CALENDAR_WRITER_URL","fotopolis_admin_calendar_writer"],
 ["reservations","FOTOPOLIS_NEON_DEV_RESERVATION_WRITER_URL","fotopolis_admin_reservation_writer"],
 ["calendar","FOTOPOLIS_NEON_DEV_DASHBOARD_READER_URL","fotopolis_admin_dashboard_reader"]
];
export default async function handler(request,context){
 const auth=await authorizeAdmin(request,context);
 if(auth.denied)return auth.denied;
 if(auth.role!=="owner")return response({error:"Owner only"},403);
 const diagnostics={};
 await Promise.all(services.map(async ([name,key,expected])=>{
   const conn=Netlify.env.get(key);
   if(!conn){diagnostics[name]={configured:false,connected:false};return}
   try{
     const sql=neon(conn);
     const result=await sql`SELECT current_user::text AS role`;
     diagnostics[name]={configured:true,connected:result[0]?.role===expected};
   }catch{diagnostics[name]={configured:true,connected:false}}
 }));
 return response({previewOnly:true,checkedAt:new Date().toISOString(),services:diagnostics},200);
}
export const config={path:"/api/fotopolis/admin/health",method:["GET"]};
