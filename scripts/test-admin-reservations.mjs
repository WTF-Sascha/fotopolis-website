import test from "node:test";
import assert from "node:assert/strict";
import handler,{validateHoldAction} from "../netlify/functions/fotopolis-admin-reservations.mjs";
import {prepareHold} from "../concepts/premium-v2/admin/dashboard/reservations-manager.js";
const id="00000000-0000-4000-8000-000000000001",base="https://deploy-preview-2--fotopolis-preview.netlify.app";
const device={id,enabled:true,display_name:"QA Fotobox",product_type:"fotobox"};
const payload={resourceId:id,eventStartUtc:"2026-12-01T11:00:00.000Z",eventEndUtc:"2026-12-01T13:00:00.000Z",occupiedFromUtc:"2026-12-01T10:00:00.000Z",occupiedUntilUtc:"2026-12-01T13:30:00.000Z"};
test("internal hold allows only exact bounded occupancy and active resource",()=>{
 assert.deepEqual(validateHoldAction(payload,"POST").value,payload);
 for(const bad of [
  {...payload,status:"confirmed"},
  {...payload,resourceId:"bad"},
  {...payload,occupiedFromUtc:"2026-12-01T12:00:00.000Z"},
  {...payload,occupiedUntilUtc:"2026-12-01T12:00:00.000Z"},
  {...payload,eventStartUtc:"no"},
  {...payload,eventEndUtc:"2026-12-01T11:10:00.000Z"}
 ])assert.ok(validateHoldAction(bad,"POST").error);
});
test("confirmation and cancellation only for valid ids",()=>{
 assert.deepEqual(validateHoldAction({id,action:"confirm"},"PATCH").value,{id,action:"confirm"});
 assert.ok(validateHoldAction({id,action:"reactivate"},"PATCH").error);
 assert.ok(validateHoldAction({id,action:"cancel",enabled:true},"PATCH").error);
});
test("browser explicitly supplies event buffers in Europe/Berlin",()=>{
 const p=prepareHold({resourceId:id,start:"2026-12-01T12:00",end:"2026-12-01T14:00",before:"60",after:"30"},[device]);
 assert.deepEqual(p.value,payload);
 assert.ok(prepareHold({resourceId:id,start:"2026-12-01T12:00",end:"2026-12-01T14:00",before:"",after:"0"},[device]).error);
 assert.ok(prepareHold({resourceId:id,start:"2026-12-01T12:00",end:"2026-12-01T14:00",before:"0",after:"0"},[{...device,enabled:false}]).error);
 assert.ok(prepareHold({resourceId:id,start:"2026-10-25T02:30",end:"2026-10-25T03:30",before:"0",after:"0"},[device]).error);
});
test("no anonymous writes, no production endpoint",async()=>{
 for(const method of ["POST","PATCH"]){
   const res=await handler(new Request(base+"/api/fotopolis/admin/reservations",{
     method,headers:{origin:base,"content-type":"application/json"},
     body:JSON.stringify(method==="POST"?payload:{id,action:"cancel"})
   }),{deploy:{context:"deploy-preview",published:false}});
   assert.equal(res.status,401);
 }
 const res=await handler(new Request("https://fotopolis-preview.netlify.app/api/fotopolis/admin/reservations",{
   method:"POST",headers:{origin:"https://fotopolis-preview.netlify.app"}
 }),{deploy:{context:"production",published:true}});
 assert.equal(res.status,404);
});
