// FOTOPOLIS Studio 4.0 – internal scheduling, no customer PII or public booking.
import {parseBerlinTime,localBerlinTime} from "./planning-logic.js";
const el=(tag,text,cls)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(text!==undefined)x.textContent=text;return x};
const button=(label,cls="plan-secondary")=>{const x=el("button",label,cls);x.type="button";return x};
export function prepareHold(input,devices,existing=[]){
 const device=devices.find(x=>x.id===input.resourceId&&x.enabled);
 if(!device)return {error:"Bitte ein aktiviertes Mietgerät auswählen."};
 const start=parseBerlinTime(input.start),end=parseBerlinTime(input.end);
 if(!start||!end||end<=start||end-start<15*60000)return {error:"Gültigen Beginn und ein späteres Ende eingeben (Europe/Berlin)."};
 const before=Number(input.before),after=Number(input.after);
 if(input.before===""||input.after===""||!Number.isInteger(before)||!Number.isInteger(after)||
  before<0||after<0||before>1440||after>1440)return {error:"Aufbau-/Anfahrt- und Abbau-/Rückfahrtpuffer jeweils ausdrücklich zwischen 0 und 1440 Minuten festlegen."};
 const occupiedFrom=new Date(start.getTime()-before*60000),occupiedUntil=new Date(end.getTime()+after*60000);
 if(occupiedUntil-occupiedFrom>14*86400000)return {error:"Das gesamte Belegungsfenster darf 14 Tage nicht überschreiten."};
 if(existing.some(x=>x.resource_id===device.id&&x.allocation_state!=="cancelled" &&
   occupiedFrom.getTime()<new Date(x.occupied_until).getTime() &&
   new Date(x.occupied_from).getTime()<occupiedUntil.getTime())){
   return {error:"Dieses Gerät ist in der geladenen Kalenderübersicht bereits belegt. Bitte anderen Zeitraum wählen."};
 }
 return {value:{resourceId:device.id,eventStartUtc:start.toISOString(),
   eventEndUtc:end.toISOString(),occupiedFromUtc:occupiedFrom.toISOString(),
   occupiedUntilUtc:occupiedUntil.toISOString()}};
}
export function setupReservationsManager({root,getResources,getAllocations,createHold,changeHold}){
 if(!root)throw Error("Reservation area missing");
 const allowed=typeof createHold==="function";
 const lead=el("p","Erfasse interne Vormerkungen ohne Kundendaten, E-Mail-Versand oder öffentliche Buchungsfreigabe. Jede Vormerkung blockiert das Gerät inklusive ausdrücklich festgelegter Logistikpuffer.","plan-help");
 const status=el("p","", "plan-status");status.setAttribute("role","status");
 const list=el("div",undefined,"reservation-list");
 const action=button("+ Interne Vormerkung anlegen","plan-primary");
 action.hidden=!allowed;
 const form=el("form",undefined,"plan-form");form.hidden=true;form.noValidate=true;
 function field(name,input,id){const lab=el("label",name);lab.htmlFor=id;input.id=id;lab.append(input);return lab}
 const device=document.createElement("select");
 const start=document.createElement("input");start.type="datetime-local";start.step=900;start.required=true;
 const end=document.createElement("input");end.type="datetime-local";end.step=900;end.required=true;
 const before=document.createElement("input");before.type="number";before.min=0;before.max=1440;before.step=15;before.required=true;before.placeholder="0";
 const after=document.createElement("input");after.type="number";after.min=0;after.max=1440;after.step=15;after.required=true;after.placeholder="0";
 const error=el("p","", "plan-error");error.setAttribute("role","status");
 const controls=el("div",undefined,"plan-form-buttons");
 const submit=el("button","Vormerkung verbindlich speichern","plan-primary");submit.type="submit";
 const cancel=button("Abbrechen");controls.append(submit,cancel);
 form.append(el("h3","Neue interne Reservierung"),
   el("p","Das Start-/Endfenster beschreibt die Veranstaltungszeit. Beide Pufferfelder sind Pflicht – auch wenn 0 Minuten richtig sind.","plan-help"),
   field("Aktiviertes Mietgerät",device,"booking-device"),field("Beginn (Ortszeit)",start,"booking-start"),
   field("Ende (Ortszeit)",end,"booking-end"),
   field("Vorlauf: Anfahrt / Aufbau in Minuten",before,"booking-before"),
   field("Nachlauf: Abbau / Rückfahrt in Minuten",after,"booking-after"),
   error,controls,
   el("p","Dies ist eine interne Vormerkung ohne Kundenbezug. Verbindliche Außenbuchungen werden erst separat freigegeben.","plan-help")
 );
 root.replaceChildren(lead,action,status,form,list);
 function choices(){
   const prior=device.value;device.replaceChildren();
   const placeholder=el("option","Aktives Gerät auswählen");placeholder.value="";device.append(placeholder);
   for(const r of getResources().filter(x=>x.enabled)){
     const opt=el("option",r.display_name+" · "+r.resource_code);opt.value=r.id;device.append(opt);
   }
   if([...device.options].some(x=>x.value===prior))device.value=prior;else device.value="";
 }
 function refresh(){
   choices();list.replaceChildren();
   const bookings=getAllocations().filter(x=>x.allocation_kind==="booking"&&x.allocation_state!=="cancelled");
   list.append(el("h3","Interne Vormerkungen im Kalender ("+bookings.length+")","plan-list-heading"));
   if(!bookings.length)list.append(el("p","Im geladenen Kalenderzeitraum liegen noch keine internen Reservierungen vor.","plan-empty"));
   for(const booking of bookings){
     const resource=getResources().find(r=>r.id===booking.resource_id);
     const item=el("article",undefined,"reservation-entry");
     const info=el("div");
     info.append(el("strong",(resource?.display_name||"Unbekanntes Gerät")+" · "+(booking.allocation_state==="confirmed"?"Bestätigte interne Reservierung":"Vormerkung")),
       el("p",localBerlinTime(booking.event_start_at).replace("T"," ")+" bis "+localBerlinTime(booking.event_end_at).replace("T"," ")+" Uhr","reservation-date"),
       el("small","Belegt inkl. Logistikpuffer: "+localBerlinTime(booking.occupied_from).replace("T"," ")+" bis "+localBerlinTime(booking.occupied_until).replace("T"," ")+" Uhr"));
     item.append(info);
     if(allowed){
       const actions=el("div",undefined,"reservation-actions");
       if(booking.allocation_state==="held"){
         const confirm=button("Bestätigen","plan-primary");
         confirm.addEventListener("click",async()=>{
           confirm.disabled=true;status.textContent="Bestätigung wird gespeichert …";
           try{await changeHold(booking.id,"confirm");status.textContent="Interne Reservierung bestätigt."}
           catch(e){status.textContent=e?.message||"Bestätigung fehlgeschlagen";confirm.disabled=false}
         });actions.append(confirm);
       }
       const remove=button("Stornieren");
       remove.addEventListener("click",async()=>{
         if(!window.confirm("Diese interne Reservierung stornieren und das Belegungsfenster freigeben?"))return;
         remove.disabled=true;status.textContent="Stornierung wird gespeichert …";
         try{await changeHold(booking.id,"cancel");status.textContent="Interne Reservierung storniert."}
         catch(e){status.textContent=e?.message||"Stornierung fehlgeschlagen";remove.disabled=false}
       });actions.append(remove);item.append(actions);
     }
     list.append(item);
   }
 }
 function openForDate(day){
   choices();form.reset();error.textContent="";form.hidden=false;
   const chosen=typeof day==="string"&&/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(day)
     ?day:localBerlinTime(new Date()).slice(0,10);
   start.value=chosen+"T12:00";end.value=chosen+"T14:00";
   // Buffers are deliberately empty: a real operator must choose both.
   before.value="";after.value="";
   form.scrollIntoView({block:"nearest",behavior:"smooth"});device.focus();
 }
 action.addEventListener("click",()=>openForDate());
 cancel.addEventListener("click",()=>{form.hidden=true;error.textContent="";action.focus()});
 form.addEventListener("submit",async event=>{
   event.preventDefault();
   const check=prepareHold({resourceId:device.value,start:start.value,end:end.value,
     before:before.value,after:after.value},getResources(),getAllocations());
   if(check.error){error.textContent=check.error;return}
   submit.disabled=true;error.textContent="Prüfe verfügbare Zeit und speichere …";
   try{await createHold(check.value);form.hidden=true;error.textContent="";status.textContent="Interne Vormerkung gespeichert. Sie blockiert das Gerät.";action.focus()}
   catch(e){error.textContent=e?.message||"Vormerkung konnte nicht angelegt werden."}
   finally{submit.disabled=false}
 });
 refresh();
 return {refresh,openForDate};
}
