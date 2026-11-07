import test from "node:test";
import assert from "node:assert/strict";
import handler,{validateResourceDraft} from "../netlify/functions/fotopolis-admin-inventory.mjs";
const root="https://deploy-preview-2--fotopolis-preview.netlify.app";
const ctx={deploy:{context:"deploy-preview",published:false}};
const req=(method="POST",headers={})=>handler(new Request(root+"/api/fotopolis/admin/inventory",{method,headers:{...headers,"content-type":"application/json"},body:JSON.stringify({type:"fotobox",code:"BOX-001",name:"Event Box"})}),ctx);
test("invalid inventory resource types and extra fields fail",()=>{
 for(const value of [
  {type:"other",code:"BOX-001",name:"Name"},
  {type:"fotobox",code:"!",name:"Name"},
  {type:"fotobox",code:"BOX-001",name:"X"},
  {type:"fotobox",code:"BOX-001",name:"Name",enabled:true},
  {type:"fotobox",code:"BOX-001",name:"Name",role:"owner"},
 ]){
  assert.ok(validateResourceDraft(value,"POST").error);
 }
});
test("resource creation validates and normalizes while remaining inactive by server logic",()=>{
 assert.deepEqual(validateResourceDraft({type:"fotobox",code:"  box-001 ",name:" New Event Box "},"POST").value,{
  type:"fotobox",code:"BOX-001",name:"New Event Box"
 });
 assert.ok(validateResourceDraft({type:"fotospiegel",code:"MIRROR-001",name:"Mirror"},"POST").value);
 assert.ok(validateResourceDraft({type:"fotowohnwagen",code:"CAMPER-001",name:"Camper"},"POST").value);
});
test("resource update only permits id and name",()=>{
 assert.ok(validateResourceDraft({id:"00000000-0000-4000-8000-000000000001",name:"New Name"},"PATCH").value);
 assert.deepEqual(validateResourceDraft({id:"00000000-0000-4000-8000-000000000001",enabled:true},"PATCH").value,{id:"00000000-0000-4000-8000-000000000001",name:null,enabled:true});
 assert.ok(validateResourceDraft({id:"00000000-0000-4000-8000-000000000001",enabled:"true"},"PATCH").error);
 assert.ok(validateResourceDraft({id:"00000000-0000-4000-8000-000000000001",name:"New Name",admin_role:"owner"},"PATCH").error);
 assert.ok(validateResourceDraft({id:"bad",name:"New Name"},"PATCH").error);
});
test("anonymous cannot create or change inventory",async()=>{
 for(const method of ["POST","PATCH"]){
  const r=await req(method,{origin:root});
  assert.equal(r.status,401);
  assert.match(r.headers.get("cache-control"),/no-store/);
 }
});
test("production requests are always denied",async()=>{
 const response=await handler(new Request("https://fotopolis-preview.netlify.app/api/fotopolis/admin/inventory",{
  method:"POST",headers:{origin:"https://fotopolis-preview.netlify.app","content-type":"application/json"},body:"{}"
 }),{deploy:{context:"production",published:true}});
 assert.equal(response.status,404);
});
test("unsupported inventory methods are denied before touching database",async()=>{
 const r=await handler(new Request(root+"/api/fotopolis/admin/inventory",{method:"GET"}),ctx);
 assert.equal(r.status,405);
});
