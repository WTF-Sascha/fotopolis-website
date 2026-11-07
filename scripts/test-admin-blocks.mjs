import test from "node:test";
import assert from "node:assert/strict";
import handler,{validateCalendarChange} from "../netlify/functions/fotopolis-admin-blocks.mjs";
const id="00000000-0000-4000-8000-000000000001";
const startUtc="2026-12-01T12:00:00.000Z",endUtc="2026-12-01T13:00:00.000Z";
const payload={resourceId:id,kind:"internal_block",startUtc,endUtc};
const ctx={deploy:{context:"deploy-preview",published:false}};
const root="https://deploy-preview-2--fotopolis-preview.netlify.app";
test("only maintenance/internal blocks with exact UTC fields accepted",()=>{
 assert.deepEqual(validateCalendarChange(payload,"POST").value,payload);
 assert.ok(validateCalendarChange({...payload,kind:"booking"},"POST").error);
 assert.ok(validateCalendarChange({...payload,state:"confirmed"},"POST").error);
 assert.ok(validateCalendarChange({...payload,startUtc:"2026-12-01T13:30:00.000Z"},"POST").error);
 assert.ok(validateCalendarChange({...payload,endUtc:"2026-12-01T12:10:00.000Z"},"POST").error);
 assert.ok(validateCalendarChange({...payload,endUtc:"2027-01-01T12:00:00.000Z"},"POST").error);
 assert.ok(validateCalendarChange({...payload,resourceId:"not-a-uuid"},"POST").error);
});
test("block cancellation is explicit and cannot edit times or bookings",()=>{
 assert.deepEqual(validateCalendarChange({id,action:"cancel"},"PATCH").value,{id,action:"cancel"});
 assert.ok(validateCalendarChange({id,action:"cancel",kind:"booking"},"PATCH").error);
 assert.ok(validateCalendarChange({id,action:"update"},"PATCH").error);
});
test("unauthorized requests cannot create or cancel blocks",async()=>{
 for(const method of ["POST","PATCH"]){
   const req=new Request(root+"/api/fotopolis/admin/blocks",{
     method,headers:{origin:root,"content-type":"application/json"},
     body:JSON.stringify(method==="POST"?payload:{id,action:"cancel"})
   });
   const res=await handler(req,ctx);
   assert.equal(res.status,401);
   assert.match(res.headers.get("cache-control"),/no-store/);
 }
});
test("published environments and unsupported methods fail closed",async()=>{
 const request=new Request("https://fotopolis-preview.netlify.app/api/fotopolis/admin/blocks",{method:"POST",headers:{origin:"https://fotopolis-preview.netlify.app"}});
 assert.equal((await handler(request,{deploy:{context:"production",published:true}})).status,404);
 assert.equal((await handler(new Request(root+"/api/fotopolis/admin/blocks"),ctx)).status,405);
});
