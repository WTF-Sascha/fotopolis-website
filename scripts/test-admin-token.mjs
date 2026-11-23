import test from "node:test";
import assert from "node:assert/strict";
import {readJwt,getAdminJwt} from "../concepts/premium-v2/admin/session-token.js";
const signed="header.payload.signature";
test("Neon session token takes precedence over fallback",async()=>{
 const t=await getAdminJwt({token:async()=>{throw Error("Should not be called")}}, {data:{session:{token:signed}}});
 assert.equal(t,signed);
});
test("opaque tokens are not sent as JWTs",()=>{
 assert.equal(readJwt({data:{session:{token:"opaque-secret"}}}),null);
 assert.equal(readJwt({data:{session:{token:"a.b.c.d"}}}),null);
});
test("fallback to provider signed token",async()=>{
 const t=await getAdminJwt({token:async()=>({data:{token:signed}})}, {data:{session:{token:"opaque"}}});
 assert.equal(t,signed);
});
test("forced refreshed session can recover signed token",async()=>{
 let forced=false;
 const t=await getAdminJwt({
   token:async()=>({error:{status:401}}),
   getSession:async(opts)=>{forced=opts?.fetchOptions?.headers?.["X-Force-Fetch"]==="true";return {data:{session:{token:signed}}}}
 },{data:{session:{token:"opaque"}}});
 assert.equal(t,signed);assert.equal(forced,true);
});
test("provider failure remains fail closed",async()=>{
 const t=await getAdminJwt({token:async()=>{throw Error("network")},getSession:async()=>{throw Error("network")}}, {data:{session:{token:"opaque"}}});
 assert.equal(t,null);
});

test("managed SDK JWT accessor recovers an opaque cookie session",async()=>{
  const token=await getAdminJwt({
    getJWTToken:async()=>signed,
    token:async()=>{throw Error("Legacy route must not run")}
  },{data:{session:{token:"opaque-cookie"}}});
  assert.equal(token,signed);
});
test("malformed managed SDK result is ignored and legacy JWT route remains available",async()=>{
  const token=await getAdminJwt({
    getJWTToken:async()=>"opaque-secret",
    token:async()=>({data:{token:signed}})
  },{data:{session:{token:"opaque-cookie"}}});
  assert.equal(token,signed);
});
test("managed SDK failure falls back safely to the existing signed-token route",async()=>{
  const token=await getAdminJwt({
    getJWTToken:async()=>{throw Error("temporary transport failure")},
    token:async()=>({data:{token:signed}})
  },{data:{session:{token:"opaque-cookie"}}});
  assert.equal(token,signed);
});
test("all JWT sources failing remains unauthorized without emitting a token",async()=>{
  const token=await getAdminJwt({
    getJWTToken:async()=>null,
    token:async()=>({data:{token:"not-a-jwt"}}),
    getSession:async()=>({data:{session:{token:"opaque-cookie"}}})
  },{data:{session:{token:"opaque-cookie"}}});
  assert.equal(token,null);
});
