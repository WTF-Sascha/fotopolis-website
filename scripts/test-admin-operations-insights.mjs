import test from "node:test";
import assert from "node:assert/strict";
import {filterInventory,calendarAgenda,occupancyLabels} from "../concepts/premium-v2/admin/dashboard/operations-insights.js";

const devices=[
 {id:"a",resource_code:"BOX-10",product_type:"fotobox",display_name:"Premium Eventbox",enabled:true},
 {id:"b",resource_code:"BOX-2",product_type:"fotobox",display_name:"Eventbox Classic",enabled:false},
 {id:"c",resource_code:"MIR-1",product_type:"fotospiegel",display_name:"Mirror One",enabled:true},
 {id:"d",resource_code:"CAMP-1",product_type:"fotowohnwagen",display_name:"Wohnwagen",enabled:false}
];
const timeA="2026-11-14T17:00:00.000Z";
const allocation=(id,resource_id,kind,state,occupied_from,occupied_until,at=occupied_from)=>({
  id,resource_id,allocation_kind:kind,allocation_state:state,
  event_start_at:at,event_end_at:occupied_until,occupied_from,occupied_until
});
test("inventory matches names and codes without changing source order",()=>{
 const original=JSON.stringify(devices);
 assert.deepEqual(filterInventory(devices,{query:"eventBOX"}).map(r=>r.id),["b","a"]);
 assert.deepEqual(filterInventory(devices,{query:"box-2"}).map(r=>r.id),["b"]);
 assert.equal(JSON.stringify(devices),original);
});
test("filters product and availability state independently of backend resources",()=>{
 assert.deepEqual(filterInventory(devices,{type:"fotospiegel",state:"active"}).map(r=>r.id),["c"]);
 assert.deepEqual(filterInventory(devices,{type:"fotobox",state:"inactive"}).map(r=>r.id),["b"]);
 assert.deepEqual(filterInventory(devices,{state:"active"}).map(r=>r.id),["b","a","c"].filter(x=>x!=="b"));
 assert.deepEqual(filterInventory(devices,{type:"invalid"}),[]);
 assert.deepEqual(filterInventory(devices,{state:"invalid"}),[]);
 assert.deepEqual(filterInventory(null),[]);
});
test("agenda includes only actual non-cancelled allocations whose device exists",()=>{
 const records=[
   allocation("late","c","maintenance","blocked","2026-11-20T11:00:00Z","2026-11-20T12:00:00Z"),
   allocation("early","a","booking","held",timeA,"2026-11-14T21:00:00Z"),
   allocation("gone","b","booking","cancelled","2026-11-14T09:00:00Z","2026-11-14T12:00:00Z"),
   allocation("orphan","missing","booking","confirmed","2026-11-13T08:00:00Z","2026-11-13T12:00:00Z"),
   allocation("broken","a","maintenance","blocked","bad","2026-11-14T12:00:00Z"),
 ];
 assert.deepEqual(calendarAgenda(records,devices).map(x=>x.id),["early","late"]);
 assert.equal(calendarAgenda(records,devices,{product:"fotobox"}).length,1);
 assert.equal(calendarAgenda(records,devices,{product:"fotospiegel"}).length,1);
});
test("agenda uses occupied-until filtering for active ongoing events",()=>{
 const records=[
   allocation("old","a","booking","held","2026-11-13T08:00:00Z","2026-11-13T10:00:00Z"),
   allocation("current","a","booking","confirmed","2026-11-14T11:00:00Z","2026-11-14T18:00:00Z"),
   allocation("next","b","internal_block","blocked","2026-11-15T11:00:00Z","2026-11-15T18:00:00Z")
 ];
 assert.deepEqual(calendarAgenda(records,devices,{from:"2026-11-14T12:00:00Z"}).map(x=>x.id),["current","next"]);
 assert.deepEqual(calendarAgenda(records,devices,{from:"2026-11-15T18:00:00Z"}).map(x=>x.id),[]);
});
test("agenda display does not imply availability and uses a firm visible-row limit",()=>{
 const records=Array.from({length:30},(_,i)=>allocation(String(i),"a","booking","held",new Date(Date.UTC(2026,10,15,0,i)).toISOString(),new Date(Date.UTC(2026,10,15,2,i)).toISOString()));
 assert.equal(calendarAgenda(records,devices,{limit:6}).length,6);
 assert.equal(calendarAgenda(records,devices,{limit:100}).length,20);
 assert.equal(occupancyLabels.maintenance,"Wartung");
 assert.ok(!JSON.stringify(calendarAgenda(records,devices)).includes("verfügbar"));
});
