// FOTOPOLIS Studio 3.8 – local-only blocking planner. No network writes.
import {planningKinds,validateBlockDraft,localBerlinTime} from "./planning-logic.js";

function node(tag,cls,text){
 const e=document.createElement(tag);
 if(cls)e.className=cls;
 if(text!==undefined)e.textContent=text;
 return e;
}
function button(text,cls="plan-secondary"){
 const e=node("button",cls,text);e.type="button";return e;
}
export function setupPlanningManager({root,getResources,getInventoryDrafts,getAllocations,onChange,createBlock,cancelBlock}){
 if(!root)throw Error("Planning root missing");
 const plans=[];
 const persistent=typeof createBlock==="function";
 const heading=node("div","plan-header");
 const message=node("p","plan-help",persistent?"Plane Wartungen und interne Sperrzeiten für einzelne Mietgeräte. Überschneidungen mit bestehenden Belegungen werden beim Speichern verhindert.":"Sperrzeiten und Wartungen vorbereiten. Nicht gespeicherte Einträge beeinflussen keine bestehenden Termine.");
 const inventoryLink=node("a","plan-inventory-link","Noch kein Gerät erfasst? Zuerst Geräte-Entwurf vorbereiten ↗");
 inventoryLink.href="#inventory";
 const info=node("span","plan-nonpersistent",persistent?"INTERNE GERÄTESPERRZEITEN":"LOKALE PLANUNG · NICHT GESPEICHERT");
 const create=button("+ Sperrzeit planen","plan-primary");
 heading.append(create,info);
 const status=node("p","plan-status","");
 status.setAttribute("role","status");status.setAttribute("aria-live","polite");
 const savedRows=node("div","plan-list");
 const rows=node("div","plan-list");
 const form=node("form","plan-form");
 form.hidden=true;form.noValidate=true;
 const title=node("h3",null,"Neue Sperrzeit vorbereiten");
 const help=node("p","plan-help",persistent?"Alle Uhrzeiten beziehen sich auf Europe/Berlin. Gespeicherte Sperren verhindern weitere Belegungen des Geräts für denselben Zeitraum.":"Die Zeiten gelten für Europe/Berlin. Eine Sperre ist erst nach gesonderter Datenbankfreigabe wirksam.");
 function field(labelText,input,id){
   const label=node("label",null,labelText);input.id=id;label.htmlFor=id;
   label.append(input);return label;
 }
 const select=document.createElement("select");select.required=true;
 const kind=document.createElement("select");kind.required=true;
 for(const [value,label] of Object.entries(planningKinds)){
   const option=node("option",null,label);option.value=value;kind.append(option);
 }
 const start=document.createElement("input");start.type="datetime-local";start.required=true;start.step=900;
 const end=document.createElement("input");end.type="datetime-local";end.required=true;end.step=900;
 const note=document.createElement("input");note.type="text";note.maxLength=100;note.placeholder="Interner Hinweis (optional)";
 const feedback=node("p","plan-error","");
 feedback.setAttribute("role","status");feedback.setAttribute("aria-live","polite");
 const buttons=node("div","plan-form-buttons");
 const save=node("button","plan-primary",persistent?"Sperrzeit speichern":"Entwurf hinzufügen");save.type="submit";
 const cancel=button("Abbrechen");
 buttons.append(save,cancel);
 const hint=node("p","plan-help",persistent?"Die Datenbank führt eine eigene Konfliktprüfung aus. Existierende Buchungen werden nicht verändert.":"Konflikte werden nur gegen aktuell geladene Kalenderdaten und lokale Entwürfe geprüft. Das ist keine verbindliche Verfügbarkeitszusage.");
 form.append(title,help,field("Mietgerät",select,"block-resource"),
   field("Grund",kind,"block-kind"),field("Beginn",start,"block-start"),
   field("Ende",end,"block-end"),field("Interne Notiz",note,"block-note"),
   feedback,buttons,hint);
 const exports=node("div","plan-export");
 const download=button("Planungsentwürfe als JSON exportieren");
 download.disabled=true;
 const clear=button("Alle Entwürfe verwerfen");clear.disabled=true;
 exports.append(download,clear);
 root.replaceChildren(message,inventoryLink,heading,form,status,savedRows,rows,exports);
 function choices(){
   const previously=select.value;
   select.replaceChildren();
   const placeholder=node("option",null,"Gerät auswählen");placeholder.value="";select.append(placeholder);
   for(const device of getResources()){
     const option=node("option",null,device.display_name+" · "+device.resource_code+" · Gerätebestand");
     option.value="real:"+device.id;select.append(option);
   }
   for(const device of getInventoryDrafts()){
     const option=node("option",null,device.name+" · "+device.code+" · Nur Entwurf");
     option.value="draft:"+device.code;select.append(option);
   }
   if([...select.options].some(option=>option.value===previously))select.value=previously;
   else select.value="";
 }
 function notify(){onChange?.(getDrafts());}
 function getDrafts(){return plans.map(p=>({...p}));}
 function refresh(){
   choices();
   savedRows.replaceChildren();
   if(persistent){
     const loaded=getAllocations().filter(a=>["internal_block","maintenance"].includes(a.allocation_kind)&&a.allocation_state==="blocked");
     const title=node("h3","plan-list-heading","Gespeicherte Sperrzeiten im Kalender ("+loaded.length+")");
     savedRows.append(title);
     if(!loaded.length)savedRows.append(node("p","plan-empty","Keine aktiven Sperrzeiten im aktuell geladenen Kalenderzeitraum."));
     for(const a of loaded){
       const dev=getResources().find(r=>r.id===a.resource_id);
       const row=node("article","plan-entry");
       const body=node("div");
       body.append(node("strong",null,(dev?.display_name||"Gerät")+" · "+planningKinds[a.allocation_kind]),
         node("p",null,localBerlinTime(a.event_start_at).replace("T"," ")+" bis "+localBerlinTime(a.event_end_at).replace("T"," ")+" Uhr"),
         node("small",null,"Gespeichert · Gerät gesperrt"));
       const cancelSaved=button("Sperre aufheben");
       cancelSaved.setAttribute("aria-label","Gespeicherte Sperre für "+(dev?.display_name||"Gerät")+" aufheben");
       cancelSaved.addEventListener("click",async()=>{
         if(!window.confirm("Diese gespeicherte Sperrzeit wirklich aufheben?"))return;
         cancelSaved.disabled=true;status.textContent="Änderung wird gespeichert …";
         try{await cancelBlock(a.id);status.textContent="Die Sperrzeit wurde dauerhaft aufgehoben.";}catch(e){status.textContent=e?.message||"Aufheben nicht möglich.";cancelSaved.disabled=false;}
       });
       row.append(body,cancelSaved);savedRows.append(row);
     }
   }
   rows.replaceChildren();
   download.disabled=plans.length===0;clear.disabled=plans.length===0;
   if(plans.length===0){
     rows.append(node("p","plan-empty","Noch keine Planungsentwürfe erstellt. Reale Termine werden separat im Kalender angezeigt."));
     return;
   }
   const heading=node("h3","plan-list-heading","Vorgemerkte Planungen ("+plans.length+")");
   rows.append(heading);
   for(const plan of [...plans].sort((a,b)=>a.startUtc.localeCompare(b.startUtc))){
     const row=node("article","plan-entry");
     const body=node("div");
     body.append(node("strong",null,plan.resourceName+" · "+planningKinds[plan.kind]),
       node("p",null,plan.start.replace("T"," ")+" bis "+plan.end.replace("T"," ")+" Uhr"),
       node("small",null,(plan.note?plan.note+" · ":"")+"Nicht gespeichert · keine wirksame Sperre"));
     const remove=button("Verwerfen");
     remove.setAttribute("aria-label","Sperrzeitentwurf für "+plan.resourceName+" verwerfen");
     remove.addEventListener("click",()=>{
       const index=plans.indexOf(plan);
       if(index>=0)plans.splice(index,1);
       refresh();notify();
     });
     row.append(body,remove);rows.append(row);
   }
 }
 function openForDate(day){
   choices();
   feedback.textContent="";form.hidden=false;
   const initial=typeof day==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(day)?day:localBerlinTime(new Date()).slice(0,10);
   start.value=initial+"T12:00";end.value=initial+"T14:00";
   form.scrollIntoView({block:"nearest",behavior:"smooth"});
   select.focus();
 }
 create.addEventListener("click",()=>openForDate());
 cancel.addEventListener("click",()=>{form.hidden=true;feedback.textContent="";create.focus()});
 form.addEventListener("submit",async event=>{
   event.preventDefault();
   const checked=validateBlockDraft({
     resourceRef:select.value,kind:kind.value,note:note.value,start:start.value,end:end.value
   },{resources:getResources(),deviceDrafts:getInventoryDrafts(),allocations:getAllocations(),drafts:plans});
   if(checked.error){feedback.textContent=checked.error;return}
   if(persistent){
     if(!checked.value.resourceRef.startsWith("real:")){feedback.textContent="Bitte dieses Gerät zuerst dauerhaft in der Geräteverwaltung speichern.";return}
     save.disabled=true;feedback.textContent="Prüfe Belegung und speichere die Sperre …";
     try{
       await createBlock({resourceId:checked.value.resourceRef.slice(5),kind:checked.value.kind,startUtc:checked.value.startUtc,endUtc:checked.value.endUtc});
       feedback.textContent="";status.textContent="Die Sperrzeit wurde gespeichert.";
       form.hidden=true;notify();create.focus();
     }catch(e){feedback.textContent=e?.message||"Die Sperrzeit konnte nicht gespeichert werden.";}
     finally{save.disabled=false;}
     return;
   }
   if(plans.length>=30){feedback.textContent="Maximal 30 gleichzeitige Planungsentwürfe.";return}
   plans.push(checked.value);
   form.hidden=true;status.textContent="Entwurf vorgemerkt. Keine echte Termin- oder Datenbankänderung.";
   refresh();notify();create.focus();
 });
 download.addEventListener("click",()=>{
   if(!plans.length)return;
   // Explicit user action. Download is local only, never uploads to FOTOPOLIS.
   const content=JSON.stringify({
     format:"fotopolis-local-planning-draft",schemaVersion:1,
     timezone:"Europe/Berlin",savedToDatabase:false,plans:getDrafts()
   },null,2);
   const url=URL.createObjectURL(new Blob([content],{type:"application/json"}));
   const anchor=document.createElement("a");
   anchor.href=url;anchor.download="fotopolis-planungsentwuerfe.json";
   anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   status.textContent="Planungsdatei lokal exportiert. Sie ist keine gespeicherte Buchung.";
 });
 clear.addEventListener("click",()=>{
   if(!plans.length||!window.confirm("Alle ungespeicherten Sperrzeitentwürfe verwerfen?"))return;
   plans.splice(0);refresh();notify();
   status.textContent="Alle Entwürfe verworfen.";
 });
 if(persistent){exports.hidden=true;}
 refresh();
 return {refresh,openForDate,getDrafts};
}
