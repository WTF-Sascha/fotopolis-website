// Private FOTOPOLIS Studio 13 design resources. No CORS, no cookies, preview-only.
import {readFile} from "node:fs/promises";
import {join} from "node:path";
import {authorizeAdmin,response} from "./fotopolis-admin-session.mjs";

const root=join(process.cwd(),"private-design-assets");
const headers={
 "Cache-Control":"private, no-store, max-age=0",
 "X-Content-Type-Options":"nosniff",
 "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'",
 "Referrer-Policy":"no-referrer"
};
export default async function handler(request,context){
 const auth=await authorizeAdmin(request,context);
 if(auth.denied)return auth.denied;
 if(!["owner","manager"].includes(auth.role))return response({error:"Keine Designberechtigung"},403);
 const path=new URL(request.url).pathname;
 try{
  if(path==="/api/fotopolis/admin/design/catalog"){
   const raw=await readFile(join(root,"catalogue.json"),"utf8");
   return new Response(raw,{status:200,headers:{...headers,"Content-Type":"application/json; charset=utf-8"}});
  }
  if(path==="/api/fotopolis/admin/design/editor"){
   const raw=await readFile(join(root,"editor.html"),"utf8");
   return new Response(raw,{status:200,headers:{...headers,"Content-Type":"text/html; charset=utf-8"}});
  }
  const match=/^\/api\/fotopolis\/admin\/design\/print\/(FP-\d{3})$/.exec(path);
  if(match){
   const id=match[1];
   const catalogue=JSON.parse(await readFile(join(root,"catalogue.json"),"utf8"));
   if(!catalogue.some(x=>x.id===id))return response({error:"Vorlage nicht gefunden"},404);
   const png=await readFile(join(root,"print",id.toLowerCase()+".png"));
   return new Response(png,{status:200,headers:{...headers,"Content-Type":"image/png"}});
  }
  return response({error:"Not found"},404);
 }catch{
  return response({error:"Privates Designsystem nicht verfügbar"},503);
 }
}
export const config={path:[
 "/api/fotopolis/admin/design/catalog",
 "/api/fotopolis/admin/design/editor",
 "/api/fotopolis/admin/design/print/:id"
],method:["GET"]};
