import test from "node:test";
import assert from "node:assert/strict";
import handler from "../netlify/functions/fotopolis-admin-session.mjs";

const ctx = { deploy: { context: "deploy-preview", published: false } };
const request = (opts={}) => handler(new Request("https://deploy-preview-2--fotopolis-preview.netlify.app/api/fotopolis/admin/session",opts),ctx);

test("anonymous is denied with no-store",async()=>{
  const res=await request();
  assert.equal(res.status,401);
  assert.equal(res.headers.get("cache-control"),"no-store, max-age=0");
});
test("fails closed for production contexts",async()=>{
  const r=await handler(new Request("https://fotopolis-preview.netlify.app/api/fotopolis/admin/session"),{deploy:{context:"production",published:true}});
  assert.equal(r.status,404);
});
test("non-GET methods and foreign origins rejected",async()=>{
  assert.equal((await request({method:"POST"})).status,405);
  assert.equal((await request({headers:{Origin:"https://untrusted.example"}})).status,403);
});
test("malformed bearer tokens are rejected before network access",async()=>{
  for(const value of ["Bearer invalid","Bearer x.y.z;invalid","Bearer "+"a".repeat(6500)]){
    const r=await request({headers:{Authorization:value}});
    assert.equal(r.status,401);
  }
});
