// FOTOPOLIS development-only read-only authorization gate.
// NEVER exposes booking records or mutates database state.
import { createRemoteJWKSet, jwtVerify } from "jose";
import { neon } from "@neondatabase/serverless";

const AUTH_BASE="https://ep-withered-hat-b930f72a.neonauth.c-7.eu-central-1.aws.neon.tech/neondb/auth";
const PREVIEW_ORIGIN="https://deploy-preview-2--fotopolis-preview.netlify.app";
const jwks=createRemoteJWKSet(new URL(AUTH_BASE+"/.well-known/jwks.json"),{timeoutDuration:5000});
const noCache={"Cache-Control":"no-store, max-age=0","Content-Type":"application/json; charset=utf-8"};
const response=(data,status)=>new Response(JSON.stringify(data),{status,headers:noCache});

export default async function handler(request,context){
  if(context?.deploy?.context!=="deploy-preview"||context?.deploy?.published===true){
    return response({error:"Not found"},404);
  }
  if(request.method!=="GET")return response({error:"Method not allowed"},405);
  const reqOrigin=request.headers.get("origin");
  if(reqOrigin&&reqOrigin!==PREVIEW_ORIGIN)return response({error:"Forbidden origin"},403);
  const header=request.headers.get("authorization")||"";
  const match=/^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.exec(header);
  if(!match||match[1].length>6000)return response({authenticated:false,error:"Unauthorized"},401);
  let userId;
  try{
    const {payload}=await jwtVerify(match[1],jwks,{
      issuer:new URL(AUTH_BASE).origin,
      audience:new URL(AUTH_BASE).origin,
      algorithms:["EdDSA"],
      clockTolerance:10
    });
    if(typeof payload.sub!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.sub)){
      return response({authenticated:false,error:"Invalid user"},401);
    }
    userId=payload.sub;
  }catch{
    return response({authenticated:false,error:"Invalid session"},401);
  }
  const dbUrl=Netlify.env.get("FOTOPOLIS_NEON_DEV_AUTH_READER_URL");
  if(!dbUrl)return response({error:"Authorization service not configured"},503);
  try{
    const sql=neon(dbUrl);
    const rows=await sql`SELECT admin_role, enabled FROM fotopolis.admin_members WHERE user_id = ${userId}::uuid LIMIT 1`;
    if(!rows.length||rows[0].enabled!==true)return response({authenticated:true,authorized:false,error:"Admin access pending"},403);
    if(!["owner","manager","viewer"].includes(rows[0].admin_role))return response({error:"Invalid role"},403);
    return response({authenticated:true,authorized:true,role:rows[0].admin_role},200);
  }catch{
    // No credentials, tokens, SQL errors or user information in public responses.
    return response({error:"Authorization service temporarily unavailable"},503);
  }
}
export const config={path:"/api/fotopolis/admin/session",method:["GET"]};
