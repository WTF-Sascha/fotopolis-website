// FOTOPOLIS Studio 3.8 – pure planning validation, local-only.
export const planningKinds=Object.freeze({internal_block:"Interne Sperre",maintenance:"Wartung"});
const fmt=new Intl.DateTimeFormat("sv-SE",{
  timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",hourCycle:"h23"
});
const stamp=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
function berlinParts(ms){
  const p=Object.fromEntries(fmt.formatToParts(new Date(ms))
    .filter(x=>["year","month","day","hour","minute"].includes(x.type))
    .map(x=>[x.type,x.value]));
  return p.year+"-"+p.month+"-"+p.day+"T"+p.hour+":"+p.minute;
}
// Browser timezone is irrelevant. Reject DST gaps AND ambiguous clock hours.
export function parseBerlinTime(value){
  if(typeof value!=="string"||!stamp.test(value))return null;
  const [date,time]=value.split("T"),[y,m,d]=date.split("-").map(Number),
    [h,min]=time.split(":").map(Number);
  const naive=Date.UTC(y,m-1,d,h,min);
  const candidates=[];
  for(let offset=-14*60;offset<=14*60;offset+=15){
    const candidate=naive-offset*60000;
    if(berlinParts(candidate)===value)candidates.push(candidate);
  }
  return candidates.length===1?new Date(candidates[0]):null;
}
export function localBerlinTime(date){
  return berlinParts(date instanceof Date?date.getTime():new Date(date).getTime());
}
export function windowsOverlap(aStart,aEnd,bStart,bEnd){
  return aStart<bEnd && bStart<aEnd;
}
export function validateBlockDraft(raw,{resources=[],deviceDrafts=[],allocations=[],drafts=[]}={}){
  const ref=String(raw?.resourceRef||"");
  const kind=String(raw?.kind||"");
  const note=String(raw?.note||"").trim();
  const startText=String(raw?.start||""),endText=String(raw?.end||"");
  const real=ref.startsWith("real:")?resources.find(x=>x.id===ref.slice(5)):null;
  const local=ref.startsWith("draft:")?deviceDrafts.find(x=>x.code===ref.slice(6)):null;
  if(!real&&!local)return {error:"Bitte ein vorhandenes Gerät oder einen lokalen Geräteentwurf wählen."};
  if(!Object.hasOwn(planningKinds,kind))return {error:"Bitte eine gültige Sperrzeit-Art auswählen."};
  if(note.length>100)return {error:"Die interne Notiz darf höchstens 100 Zeichen enthalten."};
  const start=parseBerlinTime(startText),end=parseBerlinTime(endText);
  if(!start||!end)return {error:"Ungültige Uhrzeit. Zeitumstellungsstunden müssen eindeutig sein (Europe/Berlin)."};
  if(end<=start)return {error:"Das Ende muss nach dem Beginn liegen."};
  if(end-start<15*60000||end-start>14*86400000)return {error:"Ein Planungsfenster muss zwischen 15 Minuten und 14 Tagen liegen."};
  const startIso=start.toISOString(),endIso=end.toISOString();
  if(real&&allocations.some(a=>a.resource_id===real.id && a.allocation_state!=="cancelled" &&
    windowsOverlap(start.getTime(),end.getTime(),new Date(a.occupied_from).getTime(),new Date(a.occupied_until).getTime())
  ))return {error:"Konflikt mit einer vorhandenen Belegung im geladenen Kalenderzeitraum."};
  if(drafts.some(a=>a.resourceRef===ref&&windowsOverlap(start.getTime(),end.getTime(),new Date(a.startUtc).getTime(),new Date(a.endUtc).getTime())
  ))return {error:"Dieses Gerät hat bereits einen überschneidenden Planungsentwurf."};
  return {value:{
    resourceRef:ref,kind,note,start:startText,end:endText,startUtc:startIso,endUtc:endIso,
    resourceName:real?real.display_name:local.name,resourceType:real?real.product_type:local.type,
    source:"local-planning-draft"
  }};
}
