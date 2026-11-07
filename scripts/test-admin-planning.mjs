import test from "node:test";
import assert from "node:assert/strict";
import {parseBerlinTime,localBerlinTime,windowsOverlap,validateBlockDraft} from "../concepts/premium-v2/admin/dashboard/planning-logic.js";

const device={id:"cab04f3d-8d22-4c1a-87c5-0d63a5711b72",resource_code:"BOX-001",display_name:"Fotobox Test",product_type:"fotobox"};
const localDevice={code:"BOX-DRAFT",name:"Fotobox Entwurf",type:"fotobox"};
const input={resourceRef:"real:"+device.id,kind:"internal_block",start:"2026-11-09T12:00",end:"2026-11-09T14:00",note:"Logistik"};
const context={resources:[device],deviceDrafts:[localDevice],allocations:[],drafts:[]};
test("time conversion is Berlin-based independent of browser timezone",()=>{
 assert.equal(parseBerlinTime("2026-01-15T12:00")?.toISOString(),"2026-01-15T11:00:00.000Z");
 assert.equal(parseBerlinTime("2026-07-15T12:00")?.toISOString(),"2026-07-15T10:00:00.000Z");
 assert.equal(localBerlinTime("2026-11-09T11:00:00.000Z"),"2026-11-09T12:00");
});
test("DST gaps, duplicate hours and invalid dates cannot create blocks",()=>{
 assert.equal(parseBerlinTime("2026-03-29T02:30"),null);
 assert.equal(parseBerlinTime("2026-10-25T02:30"),null);
 assert.equal(parseBerlinTime("2026-02-30T12:00"),null);
 assert.equal(parseBerlinTime("bad"),null);
});
test("valid real and local inventory proposals have explicit draft provenance",()=>{
 const real=validateBlockDraft(input,context);
 assert.equal(real.value?.source,"local-planning-draft");
 assert.equal(real.value?.resourceName,"Fotobox Test");
 assert.equal(real.value?.startUtc,"2026-11-09T11:00:00.000Z");
 const draft=validateBlockDraft({...input,resourceRef:"draft:BOX-DRAFT",kind:"maintenance"},context);
 assert.equal(draft.value?.resourceName,"Fotobox Entwurf");
});
test("invalid durations, resource references and types are denied",()=>{
 for(const variant of [
  {resourceRef:"real:unknown"},
  {resourceRef:"draft:UNKNOWN"},
  {kind:"booking"},
  {end:"2026-11-09T11:59"},
  {end:"2026-11-09T12:10"},
  {end:"2026-12-02T12:00"},
  {note:"x".repeat(101)}
 ]){
  assert.ok(validateBlockDraft({...input,...variant},context).error);
 }
});
test("half open scheduling allows adjacent windows but rejects overlapping ones",()=>{
 assert.equal(windowsOverlap(0,10,10,20),false);
 assert.equal(windowsOverlap(0,11,10,20),true);
 const existing=validateBlockDraft(input,context).value;
 assert.match(validateBlockDraft({...input,start:"2026-11-09T13:00",end:"2026-11-09T15:00"},
  {...context,drafts:[existing]}).error,/überschneidenden/);
 assert.ok(validateBlockDraft({...input,start:"2026-11-09T14:00",end:"2026-11-09T16:00"},
  {...context,drafts:[existing]}).value);
});
test("real allocations block only corresponding resource, ignoring cancelled",()=>{
 const allocation={resource_id:device.id,allocation_state:"confirmed",occupied_from:"2026-11-09T11:30:00Z",occupied_until:"2026-11-09T15:30:00Z"};
 const denied=validateBlockDraft(input,{...context,allocations:[allocation]});
 assert.match(denied.error,/Konflikt/);
 assert.ok(validateBlockDraft(input,{...context,allocations:[{...allocation,allocation_state:"cancelled"}]}).value);
 assert.ok(validateBlockDraft({...input,resourceRef:"draft:BOX-DRAFT"},{...context,allocations:[allocation]}).value);
});
