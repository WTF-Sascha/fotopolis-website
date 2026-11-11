import test from "node:test";
import assert from "node:assert/strict";
import handler from "../netlify/functions/fotopolis-admin-session.mjs";
import dashboard from "../netlify/functions/fotopolis-admin-overview.mjs";

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

test("dashboard endpoint denies anonymous access before any database query",async()=>{
  const r=await dashboard(new Request("https://deploy-preview-2--fotopolis-preview.netlify.app/api/fotopolis/admin/overview?from=2026-11-01&to=2026-12-01"),ctx);
  assert.equal(r.status,401);
  assert.equal(r.headers.get("cache-control"),"no-store, max-age=0");
});
test("dashboard endpoint never serves published Netlify deploys",async()=>{
  const r=await dashboard(new Request("https://fotopolis-preview.netlify.app/api/fotopolis/admin/overview?from=2026-11-01&to=2026-12-01"),{deploy:{context:"production",published:true}});
  assert.equal(r.status,404);
});

test("any exact same-origin deploy-preview is accepted up to authorization",async()=>{
  for(const id of [2,18,19,130]){
    const url="https://deploy-preview-"+id+"--fotopolis-preview.netlify.app/api/fotopolis/admin/session";
    const r=await handler(new Request(url,{headers:{Origin:new URL(url).origin}}),ctx);
    assert.equal(r.status,401,"Preview "+id+" must reach JWT gate");
  }
});
test("host confusion, alternate sites, and cross-preview origins fail closed",async()=>{
  const bad=[
    "https://fotopolis-preview.netlify.app/api/fotopolis/admin/session",
    "https://deploy-preview-19--other-site.netlify.app/api/fotopolis/admin/session",
    "https://deploy-preview-19--fotopolis-preview.netlify.app.evil.example/api/fotopolis/admin/session"
  ];
  for(const url of bad){
    const r=await handler(new Request(url),ctx);
    assert.equal(r.status,404);
  }
  const r=await handler(new Request("https://deploy-preview-19--fotopolis-preview.netlify.app/api/fotopolis/admin/session",{
    headers:{Origin:"https://deploy-preview-18--fotopolis-preview.netlify.app"}
  }),ctx);
  assert.equal(r.status,403);
});

test("private design API rejects anonymous access and published contexts",async()=>{
  const {default:design}=await import("../netlify/functions/fotopolis-design-private.mjs");
  const urls=[
    "https://deploy-preview-19--fotopolis-preview.netlify.app/api/fotopolis/admin/design/catalog",
    "https://deploy-preview-19--fotopolis-preview.netlify.app/api/fotopolis/admin/design/editor",
    "https://deploy-preview-19--fotopolis-preview.netlify.app/api/fotopolis/admin/design/print/FP-017"
  ];
  for(const url of urls){
    const response=await design(new Request(url),ctx);
    assert.equal(response.status,401,"Anonymous must never retrieve "+url);
    assert.equal(response.headers.get("cache-control"),"no-store, max-age=0");
    const production=await design(new Request(url),{deploy:{context:"production",published:true}});
    assert.equal(production.status,404);
  }
});
