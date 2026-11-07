// FOTOPOLIS Studio 4.0 – private change log, without email or staff identifiers.
import {neon} from "@neondatabase/serverless";
import {authorizeAdmin,response} from "./fotopolis-admin-session.mjs";
export default async function handler(request,context){
 const auth=await authorizeAdmin(request,context);
 if(auth.denied)return auth.denied;
 if(!["owner","manager"].includes(auth.role))return response({error:"Admin permission required"},403);
 const dbUrl=Netlify.env.get("FOTOPOLIS_NEON_DEV_DASHBOARD_READER_URL");
 if(!dbUrl)return response({error:"Activity log not configured"},503);
 try{
   const sql=neon(dbUrl);
   const records=await sql`
     SELECT action,entity_id,created_at
     FROM fotopolis.admin_activity
     ORDER BY created_at DESC LIMIT 50
   `;
   return response({records,readOnly:true},200);
 }catch{return response({error:"Activity log unavailable"},503)}
}
export const config={path:"/api/fotopolis/admin/activity",method:["GET"]};
