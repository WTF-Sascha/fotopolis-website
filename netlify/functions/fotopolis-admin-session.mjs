// FOTOPOLIS development preview: JWT + private Neon membership authorization.
// No permissions are inferred from client-side role flags. No booking writes.
import { createRemoteJWKSet, jwtVerify } from "jose";
import { neon } from "@neondatabase/serverless";

const AUTH_BASE="https://ep-withered-hat-b930f72a.neonauth.c-7.eu-central-1.aws.neon.tech/neondb/auth";
const PREVIEW_ORIGIN="https://deploy-preview-2--fotopolis-preview.netlify.app";
const jwks=createRemoteJWKSet(new URL(AUTH_BASE+"/.well-known/jwks.json"),{timeoutDuration:5000});
export const noCache={"Cache-Control":"no-store, max-age=0","Content-Type":"application/json; charset=utf-8"};
export const response=(data,status)=>new Response(JSON.stringify(data),{status,headers:noCache});

export async function authorizeAdmin(request,context){
  if(context?.deploy?.context!=="deploy-preview"||context?.deploy?.published===true){
    return {denied:response({error:"Not found"},404)};
  }
  if(request.method!=="GET")return {denied:response({error:"Method not allowed"},405)};
  const origin=request.headers.get("origin");
  if(origin&&origin!==PREVIEW_ORIGIN)return {denied:response({error:"Forbidden origin"},403)};
  const header=request.headers.get("authorization")||"";
  const match=/^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.exec(header);
  if(!match||match[1].length>6000)return {denied:response({authenticated:false,error:"Unauthorized"},401)};
  let userId;
  try{
    const {payload}=await jwtVerify(match[1],jwks,{
      issuer:new URL(AUTH_BASE).origin,
      audience:new URL(AUTH_BASE).origin,
      algorithms:["EdDSA"],
      clockTolerance:10
    });
    if(typeof payload.sub!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.sub)){
      return {denied:response({authenticated:false,error:"Invalid user"},401)};
    }
    userId=payload.sub;
  }catch{
    return {denied:response({authenticated:false,error:"Invalid session"},401)};
  }
  const dbUrl=Netlify.env.get("FOTOPOLIS_NEON_DEV_AUTH_READER_URL");
  if(!dbUrl)return {denied:response({error:"Authorization service not configured"},503)};
  try{
    const sql=neon(dbUrl);
    const rows=await sql`SELECT admin_role, enabled FROM fotopolis.admin_members WHERE user_id = ${userId}::uuid LIMIT 1`;
    if(!rows.length||rows[0].enabled!==true)return {denied:response({authenticated:true,authorized:false,error:"Admin access pending"},403)};
    if(!["owner","manager","viewer"].includes(rows[0].admin_role))return {denied:response({error:"Invalid role"},403)};
    return {userId,role:rows[0].admin_role};
  }catch{
    return {denied:response({error:"Authorization service temporarily unavailable"},503)};
  }
}

export default async function handler(request,context){
  const result=await authorizeAdmin(request,context);
  if(result.denied)return result.denied;
  return response({authenticated:true,authorized:true,role:result.role},200);
}
export const config={path:"/api/fotopolis/admin/session",method:["GET"]};
