// FOTOPOLIS Studio 4.1: deterministic, side-effect-free operations views.
// Derived information is based only on the authorized, currently loaded
// development calendar. Never invents inventory or public availability.
export const resourceTypes=Object.freeze({
  fotobox:"Fotobox",fotospiegel:"Fotospiegel",fotowohnwagen:"Fotowohnwagen"
});
export const occupancyLabels=Object.freeze({
  booking:"Interne Reservierung",internal_block:"Interne Sperrzeit",maintenance:"Wartung"
});
export function filterInventory(resources,{query="",type="all",state="all"}={}){
 const needle=String(query).trim().toLocaleLowerCase("de-DE");
 const allowedType=type==="all"||Object.hasOwn(resourceTypes,type);
 const allowedState=["all","active","inactive"].includes(state);
 if(!Array.isArray(resources)||!allowedType||!allowedState)return [];
 return resources.filter(r=>{
   if(type!=="all"&&r.product_type!==type)return false;
   if(state==="active"&&r.enabled!==true)return false;
   if(state==="inactive"&&r.enabled!==false)return false;
   const search=(String(r.display_name||"")+" "+String(r.resource_code||"")+" "+String(resourceTypes[r.product_type]||"")).toLocaleLowerCase("de-DE");
   return !needle||search.includes(needle);
 }).sort((a,b)=>{
   const t=(resourceTypes[a.product_type]||a.product_type||"").localeCompare(resourceTypes[b.product_type]||b.product_type||"","de");
   return t||String(a.resource_code||"").localeCompare(String(b.resource_code||""),"de",{numeric:true});
 });
}
// Only time windows returned by the authorized overview endpoint are eligible.
// There is deliberately no label implying a future interval is "available".
export function calendarAgenda(allocations,resources,{from=null,limit=6,product="all"}={}){
 if(!Array.isArray(allocations)||!Array.isArray(resources))return [];
 const deviceIndex=new Map(resources.map(r=>[r.id,r]));
 const reference=from==null?null:(from instanceof Date?from.getTime():Number.isFinite(new Date(from).getTime())?new Date(from).getTime():null);
 const result=[];
 for(const a of allocations){
   if(a?.allocation_state==="cancelled")continue;
   if(!Object.hasOwn(occupancyLabels,a?.allocation_kind))continue;
   const resource=deviceIndex.get(a.resource_id);
   if(!resource)continue;
   if(product!=="all"&&resource.product_type!==product)continue;
   const occupiedFrom=new Date(a.occupied_from).getTime();
   const occupiedUntil=new Date(a.occupied_until).getTime();
   const eventStart=new Date(a.event_start_at).getTime();
   if(!Number.isFinite(occupiedFrom)||!Number.isFinite(occupiedUntil)||!Number.isFinite(eventStart))continue;
   if(reference!==null&&occupiedUntil<=reference)continue;
   result.push({
     id:a.id,resourceId:a.resource_id,resourceName:resource.display_name,
     resourceCode:resource.resource_code,productType:resource.product_type,
     kind:a.allocation_kind,state:a.allocation_state,
     event_start_at:a.event_start_at,event_end_at:a.event_end_at,
     occupied_from:a.occupied_from,occupied_until:a.occupied_until
   });
 }
 result.sort((a,b)=>new Date(a.occupied_from)-new Date(b.occupied_from)||
   String(a.resourceCode).localeCompare(String(b.resourceCode),"de"));
 return result.slice(0,Math.max(1,Math.min(20,Math.trunc(limit)||6)));
}
