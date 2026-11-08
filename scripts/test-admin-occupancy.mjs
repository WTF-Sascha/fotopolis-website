import test from "node:test";
import assert from "node:assert/strict";
import handler,{validateOccupancyQuery} from "../netlify/functions/fotopolis-admin-occupancy-check.mjs";

const preview="https://deploy-preview-2--fotopolis-preview.netlify.app";
const ctx={deploy:{context:"deploy-preview",published:false}};
const id="00000000-0000-4000-8000-000000000001";
function query(overrides={}){
 return new URLSearchParams({
   resourceId:id,
   occupiedFromUtc:"2026-12-15T09:30:00.000Z",
   occupiedUntilUtc:"2026-12-15T15:00:00.000Z",
   ...overrides
 });
}
test("occupancy query accepts real UTC window of bounded duration",()=>{
 const r=validateOccupancyQuery(query());
 assert.deepEqual(r.value,{
   resourceId:id,
   occupiedFromUtc:"2026-12-15T09:30:00.000Z",
   occupiedUntilUtc:"2026-12-15T15:00:00.000Z"
 });
});
test("excessive, zero-length, inverted or non-existent ranges are denied",()=>{
 for(const bad of [
   {resourceId:"unknown"},
   {occupiedFromUtc:"2026-12-15T15:00:00.000Z"},
   {occupiedUntilUtc:"2026-12-15T09:30:00.000Z"},
   {occupiedUntilUtc:"2026-12-15T09:35:00.000Z"},
   {occupiedUntilUtc:"2026-12-30T15:00:00.000Z"},
   {occupiedFromUtc:"2026-02-30T09:30:00.000Z"},
   {occupiedUntilUtc:"2026-12-15T15:00:00+01:00"},
   {occupiedUntilUtc:"invalid"}
 ]){
   assert.ok(validateOccupancyQuery(query(bad)).error);
 }
 assert.ok(validateOccupancyQuery(new URLSearchParams({resourceId:id})).error);
 const extra=query();extra.append("showCustomers","true");
 assert.ok(validateOccupancyQuery(extra).error);
 const duplicated=query();duplicated.append("resourceId",id);
 assert.ok(validateOccupancyQuery(duplicated).error);
});
test("internal occupancy preflight is not a publicly callable API",async()=>{
 const request=new Request(preview+"/api/fotopolis/admin/occupancy-check?"+query().toString());
 const anonymous=await handler(request,ctx);
 assert.equal(anonymous.status,401);
 assert.match(anonymous.headers.get("cache-control"),/no-store/);
 const production=await handler(new Request("https://fotopolis-preview.netlify.app/api/fotopolis/admin/occupancy-check?"+query()),{deploy:{context:"production",published:true}});
 assert.equal(production.status,404);
 const unsupported=await handler(new Request(preview+"/api/fotopolis/admin/occupancy-check",{method:"POST"}),ctx);
 assert.equal(unsupported.status,405);
});
