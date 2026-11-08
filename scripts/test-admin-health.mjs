import test from "node:test";
import assert from "node:assert/strict";
import handler from "../netlify/functions/fotopolis-admin-health.mjs";
const preview="https://deploy-preview-2--fotopolis-preview.netlify.app";
test("unauthenticated callers cannot inspect database health",async()=>{
 const response=await handler(new Request(preview+"/api/fotopolis/admin/health"),{deploy:{context:"deploy-preview",published:false}});
 assert.equal(response.status,401);assert.match(response.headers.get("cache-control"),/no-store/);
});
test("production website has no diagnostic endpoint",async()=>{
 const r=await handler(new Request("https://fotopolis-preview.netlify.app/api/fotopolis/admin/health"),{deploy:{context:"production",published:true}});
 assert.equal(r.status,404);
});
