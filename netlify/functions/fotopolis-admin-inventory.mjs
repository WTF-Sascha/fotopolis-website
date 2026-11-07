// FOTOPOLIS Studio 3.7 – future resource writer, locked until preview-scoped
// least-privilege database grants and deployment secret are independently verified.
import {neon} from "@neondatabase/serverless";
import {authorizeAdmin,response} from "./fotopolis-admin-session.mjs";
const TYPES=new Set(["fotobox","fotospiegel","fotowohnwagen"]);
const previewOrigin="https://deploy-preview-2--fotopolis-preview.netlify.app";
const allowedKeys=["type","code","name"];
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function validateResourceDraft(value,method){
  if(!value||typeof value!=="object"||Array.isArray(value))return {error:"Invalid resource payload"};
  const keys=Object.keys(value);
  if(method==="POST"){
    if(keys.some(key=>!allowedKeys.includes(key)))return {error:"Unexpected resource field"};
    const type=value.type;
    const code=typeof value.code==="string"?value.code.trim().toUpperCase():"";
    const name=typeof value.name==="string"?value.name.trim():"";
    if(!TYPES.has(type)||!/^[A-Z0-9][A-Z0-9_-]{2,59}$/.test(code)||name.length<2||name.length>100){
      return {error:"Invalid resource type, code or name"};
    }
    return {value:{type,code,name}};
  }
  if(method==="PATCH"){
    if(keys.some(key=>!["id","name","enabled"].includes(key)))return {error:"Unexpected resource field"};
    const id=value.id;
    if(typeof id!=="string"||!uuid.test(id))return {error:"Invalid resource ID"};
    const hasName=Object.hasOwn(value,"name"),hasEnabled=Object.hasOwn(value,"enabled");
    if(!hasName&&!hasEnabled)return {error:"No resource changes provided"};
    const name=hasName&&typeof value.name==="string"?value.name.trim():null;
    if(hasName&&(name===null||name.length<2||name.length>100))return {error:"Invalid resource name"};
    if(hasEnabled&&typeof value.enabled!=="boolean")return {error:"Invalid enabled status"};
    return {value:{id,name,enabled:hasEnabled?value.enabled:null}};
  }
  return {error:"Method not allowed"};
}
export default async function handler(request,context){
  const authorized=await authorizeAdmin(request,context,{methods:["POST","PATCH"]});
  if(authorized.denied)return authorized.denied;
  if(!["owner","manager"].includes(authorized.role))return response({error:"Manager permission required"},403);
  // Browsers always send Origin for JSON mutation requests. Cross-origin and
  // non-browser requests are blocked even when bearer authentication succeeded.
  if(request.headers.get("origin")!==previewOrigin)return response({error:"Forbidden origin"},403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get("content-type")||"")){
    return response({error:"JSON content type required"},415);
  }
  let text;
  try{text=await request.text()}catch{return response({error:"Unable to read body"},400)}
  if(text.length>4096)return response({error:"Resource request too large"},413);
  let payload;
  try{payload=JSON.parse(text)}catch{return response({error:"Invalid JSON"},400)}
  const parsed=validateResourceDraft(payload,request.method);
  if(parsed.error)return response({error:parsed.error},400);
  if(request.method==="PATCH"&&parsed.value.enabled!==null&&authorized.role!=="owner")return response({error:"Owner role required to change device activation"},403);
  const connection=Netlify.env.get("FOTOPOLIS_NEON_DEV_INVENTORY_WRITER_URL");
  if(!connection)return response({error:"Resource changes are not enabled in this preview"},503);
  try{
    const sql=neon(connection);
    let rows;
    if(request.method==="POST"){
      const {type,code,name}=parsed.value;
      // A single statement either inserts both the inactive resource AND the
      // activity record, or rolls the operation back on a permission failure.
      rows=await sql`
        WITH inserted AS (
          INSERT INTO fotopolis.resources(resource_code,product_type,display_name,enabled)
          VALUES (${code},${type},${name},false)
          RETURNING id,resource_code,product_type,display_name,enabled
        ), recorded AS (
          INSERT INTO fotopolis.admin_activity(user_id,action,entity_id)
          SELECT ${authorized.userId}::uuid,'change_resource',id FROM inserted
        ) SELECT inserted.* FROM inserted
      `;
    }else{
      const {id,name,enabled}=parsed.value;
      rows=await sql`
        WITH changed AS (
          UPDATE fotopolis.resources SET
            display_name=COALESCE(${name}::text,display_name),
            enabled=COALESCE(${enabled}::boolean,enabled)
          WHERE id=${id}::uuid
          RETURNING id,resource_code,product_type,display_name,enabled
        ), recorded AS (
          INSERT INTO fotopolis.admin_activity(user_id,action,entity_id)
          SELECT ${authorized.userId}::uuid,'change_resource',id FROM changed
        ) SELECT changed.* FROM changed
      `;
    }
    if(!rows.length)return response({error:"Resource not found"},404);
    return response({resource:rows[0],saved:true},request.method==="POST"?201:200);
  }catch(error){
    // No queries, credentials or identifiers in the response or logs.
    if(error?.code==="23505")return response({error:"Resource code already exists"},409);
    return response({error:"Resource changes unavailable"},503);
  }
}
export const config={path:"/api/fotopolis/admin/inventory",method:["POST","PATCH"]};
