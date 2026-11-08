import test from "node:test";
import assert from "node:assert/strict";
import handler from "../netlify/functions/fotopolis-admin-activity.mjs";
const preview="https://deploy-preview-2--fotopolis-preview.netlify.app";
test("activity timeline never returns data to anonymous requests",async()=>{
 const response=await handler(new Request(preview+"/api/fotopolis/admin/activity"),{deploy:{context:"deploy-preview",published:false}});
 assert.equal(response.status,401);assert.match(response.headers.get("cache-control"),/no-store/);
});
test("activity timeline is not available in published site",async()=>{
 const response=await handler(new Request("https://fotopolis-preview.netlify.app/api/fotopolis/admin/activity"),{deploy:{context:"production",published:true}});
 assert.equal(response.status,404);
});
