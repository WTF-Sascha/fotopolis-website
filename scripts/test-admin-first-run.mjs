import test from "node:test";
import assert from "node:assert/strict";
import {studioReadiness} from "../concepts/premium-v2/admin/dashboard/first-run.js";
import {grantsReady} from "../netlify/functions/fotopolis-admin-health.mjs";

const roles=["inventory","blocks","reservations","calendar"];
const readyHealth={previewOnly:true,services:Object.fromEntries(roles.map(k=>[k,{connected:true,permissionsReady:true}]))};
const device={id:"00000000-0000-4000-8000-000000000001",product_type:"fotobox",resource_code:"BOX-01",display_name:"Physisches Testgerät",enabled:false};
const booking={id:"00000000-0000-4000-8000-000000000101",allocation_kind:"booking",allocation_state:"held",resource_id:device.id};
test("setup is visible only to owner; not to managers and viewers",()=>{
 for(const role of ["viewer","manager",null])assert.equal(studioReadiness({role}).visible,false);
 assert.equal(studioReadiness({role:"owner"}).visible,true);
});
test("new owner cannot claim inventory or health is complete before verification",()=>{
 const view=studioReadiness({role:"owner",loaded:false,resources:[device],allocations:[booking]});
 assert.equal(view.total,5);
 assert.equal(view.done,1);
 assert.equal(view.steps[1].complete,false);
 assert.equal(view.steps[2].complete,false);
});
test("health requires all four actual service statuses plus permissions",()=>{
 const base={role:"owner",loaded:true,resources:[],allocations:[]};
 assert.equal(studioReadiness({...base,health:readyHealth}).done,2);
 const partial={previewOnly:true,services:{...readyHealth.services,inventory:{connected:true,permissionsReady:false}}};
 assert.equal(studioReadiness({...base,health:partial}).done,1);
 assert.equal(studioReadiness({...base,health:{...readyHealth,previewOnly:false}}).done,1);
});
test("real stored device, activation and occupied schedule are independent steps",()=>{
 const base={role:"owner",loaded:true,health:readyHealth};
 assert.equal(studioReadiness({...base,resources:[device]}).done,3);
 assert.equal(studioReadiness({...base,resources:[{...device,enabled:true}]}).done,4);
 const complete=studioReadiness({...base,resources:[{...device,enabled:true}],allocations:[booking]});
 assert.equal(complete.done,5);
 assert.equal(complete.complete,true);
 const cancelled=studioReadiness({...base,resources:[{...device,enabled:true}],allocations:[{...booking,allocation_state:"cancelled"}]});
 assert.equal(cancelled.complete,false);
 assert.equal(cancelled.done,4);
});
test("health grant checks must use column privileges and include DB audit",()=>{
 const full={inventory_create:true,inventory_rename:true,inventory_activate:true,
  resource_select:true,allocation_create:true,allocation_update:true,allocation_select:true,
  allocation_audit:true,activity_audit:true};
 for(const role of roles)assert.equal(grantsReady(role,full),true,role);
 for(const role of roles)assert.equal(grantsReady(role,{}),false,role);
 assert.equal(grantsReady("inventory",{...full,inventory_activate:false}),false);
 assert.equal(grantsReady("blocks",{...full,allocation_audit:false}),false);
 assert.equal(grantsReady("reservations",{...full,activity_audit:false}),false);
 assert.equal(grantsReady("calendar",{...full,allocation_select:false}),false);
 assert.equal(grantsReady("unknown",full),false);
});
