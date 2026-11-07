import {createAuthClient} from "@neondatabase/auth";
import {getAdminJwt} from "../session-token.js";
import {setupInventoryManager} from "./inventory-manager.js";
import {setupPlanningManager} from "./planning-manager.js";
import {setupReservationsManager} from "./reservations-manager.js";
import {downloadCsv} from "./csv-export.js";

const AUTH_URL="https://ep-withered-hat-b930f72a.neonauth.c-7.eu-central-1.aws.neon.tech/neondb/auth";
const client=createAuthClient(AUTH_URL);
const $=(s)=>document.querySelector(s);
const gate=$("#gate"),message=$("#gate-message"),app=$("#dashboard-app"),loginBack=$("#login-back");
const fmtDay=new Intl.DateTimeFormat("de-DE",{day:"numeric",month:"long",year:"numeric",timeZone:"Europe/Berlin"});
const fmtMonth=new Intl.DateTimeFormat("de-DE",{month:"long",year:"numeric",timeZone:"Europe/Berlin"});
const fmtTime=new Intl.DateTimeFormat("de-DE",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Berlin"});
const keyFmt=new Intl.DateTimeFormat("en-GB",{year:"numeric",month:"2-digit",day:"2-digit",timeZone:"Europe/Berlin"});
const types={fotobox:"Fotobox",fotospiegel:"Fotospiegel",fotowohnwagen:"Fotowohnwagen"};
const roleLabels={owner:"Hauptadministrator",manager:"Koordinator",viewer:"Betrachter"};
const today=new Date();
const keyFromInstant=(timestamp)=>{
  const parts=keyFmt.formatToParts(new Date(timestamp));
  const p=Object.fromEntries(parts.filter(x=>["day","month","year"].includes(x.type)).map(x=>[x.type,x.value]));
  return p.year+"-"+p.month+"-"+p.day;
};
const isoKey=d=>[d.getUTCFullYear(),String(d.getUTCMonth()+1).padStart(2,"0"),String(d.getUTCDate()).padStart(2,"0")].join("-");
const current=new Date(keyFromInstant(today)+"T12:00:00.000Z");
let cursor=current, selected=isoKey(current),view="month",resources=[],allocations=[],jwt="",busy=false;
let inventoryManager=null,planningManager=null,reservationsManager=null,loadPending=false,adminRole="viewer";
const fromKey=s=>new Date(s+"T12:00:00.000Z");
const addDays=(d,n)=>{const x=new Date(d);x.setUTCDate(x.getUTCDate()+n);return x};
const startOfWeek=d=>addDays(d,-((d.getUTCDay()+6)%7));
function visibleDays(){
  if(view==="week"){const first=startOfWeek(cursor);return Array.from({length:7},(_,i)=>addDays(first,i))}
  const first=new Date(Date.UTC(cursor.getUTCFullYear(),cursor.getUTCMonth(),1,12));
  const end=new Date(Date.UTC(cursor.getUTCFullYear(),cursor.getUTCMonth()+1,0,12));
  const start=startOfWeek(first);
  const weekCount=Math.ceil(((end-start)/86400000+1)/7);
  return Array.from({length:weekCount*7},(_,i)=>addDays(start,i));
}
function renderInventory(){
 const list=$("[data-inventory]");list.replaceChildren();
 if(!resources.length){const p=document.createElement("p");p.className="no-inventory";p.textContent="Noch keine Geräte registriert. Sobald der tatsächliche FOTOPOLIS-Bestand freigegeben ist, erscheinen die Geräte hier.";list.append(p);return}
 resources.forEach(r=>{
   const row=document.createElement("div");row.className="inventory-list-row";
   const num=document.createElement("span");num.className="inventory-icon";num.textContent="◈";
   const desc=document.createElement("div");
   const name=document.createElement("strong");name.textContent=r.display_name;
   const sub=document.createElement("div");sub.className="inventory-label";sub.textContent=(types[r.product_type]||r.product_type)+" · "+r.resource_code;
   desc.append(name,sub);
   const flag=document.createElement("span");flag.className="not-configured";flag.textContent=r.enabled?"Aktiv":"Deaktiviert";
   row.append(num,desc,flag);
   if(["owner","manager"].includes(adminRole)){
     const action=document.createElement("button");action.type="button";action.className="inventory-edit-button";
     action.textContent="Bearbeiten";action.setAttribute("aria-label",r.display_name+" bearbeiten");
     action.addEventListener("click",()=>inventoryManager?.editSaved(r));row.append(action);
   }
   list.append(row);
 });
}
function filteredAllocations(){
  const kind=$("[data-product-filter]").value;
  return allocations.filter(a=>{
    if(kind==="all")return true;
    const res=resources.find(r=>r.id===a.resource_id);
    return res?.product_type===kind;
  });
}
function entriesForDay(key){
  return filteredAllocations().filter(a=>{
    const start=keyFromInstant(a.occupied_from);
    const end=keyFromInstant(new Date(a.occupied_until).getTime()-1);
    return key>=start&&key<=end&&a.allocation_state!=="cancelled";
  });
}
function description(a){
  const r=resources.find(x=>x.id===a.resource_id);
  const label=r?r.display_name:"Unbekanntes Gerät";
  const kind=a.allocation_kind==="booking"?"Interne Reservierung":a.allocation_kind==="maintenance"?"Wartung":"Interne Sperrzeit";
  return label+" · "+kind;
}
function plannedForDay(key){
 const product=$("[data-product-filter]").value;
 return (planningManager?.getDrafts()||[]).filter(p=>{
   if(product!=="all"&&p.resourceType!==product)return false;
   const first=keyFromInstant(p.startUtc);
   const last=keyFromInstant(new Date(p.endUtc).getTime()-1);
   return key>=first&&key<=last;
 });
}
function fillEntries(target,real,planned){
 target.replaceChildren();
 if(!real.length&&!planned.length){
   const p=document.createElement("p");p.className="day-dialog-empty";
   p.textContent="Für diesen Tag sind im geladenen Entwicklungszeitraum keine Belegungen hinterlegt. Das ist keine verbindliche Verfügbarkeitszusage.";
   target.append(p);return;
 }
 for(const a of real){
   const row=document.createElement("article");row.className="day-dialog-entry";
   const title=document.createElement("strong");title.textContent=description(a);
   const meta=document.createElement("p");
   meta.textContent=fmtTime.format(new Date(a.event_start_at))+" – "+fmtTime.format(new Date(a.event_end_at))+" · In Neon hinterlegt";
   row.append(title,meta);target.append(row);
 }
 for(const p of planned){
   const row=document.createElement("article");row.className="day-dialog-entry";
   row.dataset.draft="true";
   const title=document.createElement("strong");
   title.textContent=p.resourceName+" · "+(p.kind==="maintenance"?"Wartung":"Interne Sperrzeit");
   const meta=document.createElement("p");
   meta.textContent=p.start.replace("T"," ")+" bis "+p.end.replace("T"," ")+" Uhr · Nur Entwurf, keine wirksame Sperre";
   row.append(title,meta);target.append(row);
 }
}
function renderDetails(){
 const day=fmtDay.format(fromKey(selected));
 $("[data-day-title]").textContent=day;
 fillEntries($("[data-day-details]"),entriesForDay(selected),plannedForDay(selected));
 const dialog=$("#day-detail-dialog");
 if(dialog.open){
   $("[data-dialog-day-title]").textContent=day;
   fillEntries($("[data-dialog-entries]"),entriesForDay(selected),plannedForDay(selected));
 }
}
function openDayDialog(){
 const dialog=$("#day-detail-dialog");
 $("[data-dialog-day-title]").textContent=fmtDay.format(fromKey(selected));
 fillEntries($("[data-dialog-entries]"),entriesForDay(selected),plannedForDay(selected));
 if(typeof dialog.showModal==="function")dialog.showModal();
}
function renderCalendar(){
 const days=visibleDays();
 $("[data-period]").textContent=view==="week"?fmtDay.format(days[0])+" – "+fmtDay.format(days[6]):fmtMonth.format(cursor);
 const grid=$("[data-calendar-grid]");grid.replaceChildren();
 const currentKey=isoKey(current);
 days.forEach(d=>{
   const key=isoKey(d),items=entriesForDay(key),plans=plannedForDay(key);
   const cell=document.createElement("button");cell.type="button";cell.className="day";
   cell.setAttribute("aria-label",fmtDay.format(d)+", "+items.length+" reale Belegungen, "+plans.length+" Planungsentwürfe");
   cell.setAttribute("aria-pressed",String(key===selected));
   if(view==="month"&&d.getUTCMonth()!==cursor.getUTCMonth())cell.classList.add("outside");
   if(key===selected)cell.classList.add("is-selected");
   if(key===currentKey)cell.classList.add("is-today");
   const num=document.createElement("span");num.className="day-number";num.textContent=String(d.getUTCDate());cell.append(num);
   items.slice(0,2).forEach(a=>{
     const mark=document.createElement("span");mark.className="day-entry "+(a.allocation_kind==="booking"?"booked":"blocked");
     mark.textContent=description(a);cell.append(mark);
   });
   if(plans.length){const draft=document.createElement("span");draft.className="day-entry blocked";draft.textContent="Entwurf ("+plans.length+")";draft.title="Nur lokale Planung, nicht gespeichert";draft.dataset.localDraft="true";cell.append(draft)}
   if(items.length>2){const extra=document.createElement("span");extra.className="day-extra";extra.textContent="+"+(items.length-2);cell.append(extra)}
   cell.addEventListener("click",()=>{selected=key;renderCalendar();openDayDialog()});
   grid.append(cell);
 });
 const inVisible=filteredAllocations().filter(a=>days.some(d=>{const k=isoKey(d);return k>=keyFromInstant(a.occupied_from)&&k<=keyFromInstant(new Date(a.occupied_until).getTime()-1)}));
 $("[data-count=bookings]").textContent=String(inVisible.filter(a=>a.allocation_kind==="booking"&&a.allocation_state!=="cancelled").length);
 $("[data-count=blocks]").textContent=String(inVisible.filter(a=>a.allocation_kind!=="booking"&&a.allocation_state!=="cancelled").length);
 renderDetails();
}
async function loadCalendar(){
  if(busy){loadPending=true;return}
  busy=true;
  $("[data-calendar-sync]").textContent="Geschützte Kalenderdaten werden aktualisiert …";
  try{
    jwt=await getAdminJwt(client,await client.getSession());
    if(!jwt){lock("Dein Sitzungsschlüssel konnte nicht geladen werden. Bitte melde dich erneut an.");return}
    const days=visibleDays(),from=isoKey(addDays(days[0],-1)),to=isoKey(addDays(days[days.length-1],2));
    const response=await fetch("/api/fotopolis/admin/overview?from="+encodeURIComponent(from)+"&to="+encodeURIComponent(to),{
      method:"GET",headers:{Authorization:"Bearer "+jwt},cache:"no-store",credentials:"same-origin"
    });
    if(response.status===401||response.status===403){lock("Deine Sitzung hat keinen Zugriff mehr. Melde dich bitte erneut an.");return}
    if(!response.ok)throw Error("Übersicht aktuell nicht verfügbar ("+response.status+")");
    const data=await response.json();
    if(!data.readOnly||!Array.isArray(data.resources)||!Array.isArray(data.allocations))throw Error("Ungültige Serverantwort");
    resources=data.resources;allocations=data.allocations;
    $("#setup-assistant").hidden=resources.length>0||adminRole==="viewer";
    $("[data-export-inventory]").disabled=!["owner","manager"].includes(adminRole)||resources.length===0;
    $("[data-export-calendar]").disabled=!["owner","manager"].includes(adminRole)||allocations.length===0;
    $("[data-count=resources]").textContent=String(resources.length);
    renderInventory();inventoryManager?.refresh();planningManager?.refresh();reservationsManager?.refresh();renderCalendar();
    $("[data-calendar-sync]").textContent="Mit Neon verbunden · Aktualisiert "+new Intl.DateTimeFormat("de-DE",{timeZone:"Europe/Berlin",hour:"2-digit",minute:"2-digit"}).format(new Date())+" Uhr · Nur Entwicklungsdaten";
  }catch(e){
    resources=[];allocations=[];
    $("#setup-assistant").hidden=true;
    $("[data-export-inventory]").disabled=true;$("[data-export-calendar]").disabled=true;
    renderInventory();inventoryManager?.refresh();planningManager?.refresh();reservationsManager?.refresh();renderCalendar();
    $("[data-calendar-sync]").textContent="Kalenderdaten nicht verfügbar · Keine Verfügbarkeitsaussage möglich";
    $("[data-period]").textContent="Laden fehlgeschlagen";
    const wrap=$("[data-day-details]");wrap.replaceChildren();
    const info=document.createElement("p");info.className="alert-inline";info.textContent="Die geschützten Kalenderdaten sind zurzeit nicht erreichbar. Bitte lade die Seite erneut.";wrap.append(info);
    $("[data-count=resources]").textContent="–";$("[data-count=bookings]").textContent="–";$("[data-count=blocks]").textContent="–";
  }finally{
    busy=false;
    if(loadPending){loadPending=false;void loadCalendar()}
  }
}
function lock(msg){
  app.hidden=true;gate.hidden=false;message.textContent=msg;loginBack.hidden=false;
  jwt="";resources=[];allocations=[];
}
async function saveInventory(method,payload){
  const session=await client.getSession();
  const token=await getAdminJwt(client,session);
  if(!token)throw Error("Die Anmeldung muss erneuert werden. Bitte melde dich erneut an.");
  let res;
  try{
    res=await fetch("/api/fotopolis/admin/inventory",{
      method,headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},
      credentials:"same-origin",cache:"no-store",body:JSON.stringify(payload)
    });
  }catch{throw Error("Verbindungsfehler beim Speichern. Bitte Internetverbindung prüfen.")}
  let result={};try{result=await res.json()}catch{}
  if(!res.ok){
    const messages={
      400:"Bitte Geräteeingaben prüfen.",401:"Deine Sitzung ist abgelaufen. Bitte neu anmelden.",
      403:"Für diese Aktion fehlt die Administratorberechtigung.",
      404:"Gerät nicht gefunden.",409:"Diese Gerätekennung ist bereits vergeben.",
      503:"Die Datenbank-Speicherung ist zurzeit nicht verfügbar."
    };
    throw Error(messages[res.status]||"Speichern fehlgeschlagen (HTTP "+res.status+").");
  }
  if(!result.saved||!result.resource)throw Error("Die Datenbank hat die Speicherung nicht bestätigt.");
  await loadCalendar();
  void loadActivity();
  return result.resource;
}
async function saveBlock(method,payload){
  const token=await getAdminJwt(client,await client.getSession());
  if(!token)throw Error("Anmeldung abgelaufen. Bitte melde dich erneut an.");
  let res;
  try{
    res=await fetch("/api/fotopolis/admin/blocks",{
      method,headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},
      credentials:"same-origin",cache:"no-store",body:JSON.stringify(payload)
    });
  }catch{throw Error("Verbindung zur Terminverwaltung unterbrochen.")}
  let answer={};try{answer=await res.json()}catch{}
  if(!res.ok){
    const messages={
      400:"Bitte gültiges Gerät und gültigen Zeitraum auswählen.",
      401:"Anmeldung abgelaufen. Bitte erneut anmelden.",
      403:"Dir fehlen die benötigten Administratorrechte.",
      404:"Gerät oder aktive Sperrzeit nicht gefunden.",
      409:"Für dieses Gerät besteht bereits eine überschneidende Belegung.",
      503:"Der Datenbank-Terminservice ist nicht verfügbar."
    };
    throw Error(messages[res.status]||"Terminänderung fehlgeschlagen (HTTP "+res.status+").");
  }
  if(!answer.saved||!answer.allocation)throw Error("Der Server hat die Änderung nicht bestätigt.");
  if(method==="POST"){selected=keyFromInstant(payload.startUtc);cursor=fromKey(selected);}
  await loadCalendar();
  void loadActivity();
  return answer.allocation;
}
async function saveReservation(method,payload){
 const token=await getAdminJwt(client,await client.getSession());
 if(!token)throw Error("Anmeldung abgelaufen. Bitte melde dich erneut an.");
 let res;
 try{
   res=await fetch("/api/fotopolis/admin/reservations",{
     method,headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},
     cache:"no-store",credentials:"same-origin",body:JSON.stringify(payload)
   });
 }catch{throw Error("Verbindung zur internen Terminverwaltung unterbrochen.")}
 let answer={};try{answer=await res.json()}catch{}
 if(!res.ok){
   const errors={400:"Bitte Gerät, Veranstaltungszeit und beide Logistikpuffer prüfen.",
     401:"Deine Anmeldung ist abgelaufen.",403:"Für diese Aktion fehlen Administratorrechte.",
     404:"Das aktive Gerät oder die Vormerkung wurde nicht gefunden.",
     409:"Das Gerät ist im gewählten Belegungsfenster bereits belegt.",
     503:"Der Reservierungsdienst ist vorübergehend nicht erreichbar."};
   throw Error(errors[res.status]||"Interne Vormerkung fehlgeschlagen (HTTP "+res.status+").");
 }
 if(!answer.saved||!answer.allocation)throw Error("Keine Speicherbestätigung erhalten.");
 if(method==="POST"){selected=keyFromInstant(payload.eventStartUtc);cursor=fromKey(selected);}
 await loadCalendar();
 void loadActivity();
 return answer.allocation;
}
async function loadActivity(){
 const target=$("[data-activity-list]");
 if(!target)return;
 target.replaceChildren();
 if(!["owner","manager"].includes(adminRole)){
   target.textContent="Änderungsprotokolle sind nur für die Administration sichtbar.";return;
 }
 try{
   const token=await getAdminJwt(client,await client.getSession());
   if(!token)throw Error("session");
   const response=await fetch("/api/fotopolis/admin/activity",{
     method:"GET",headers:{"Authorization":"Bearer "+token},
     credentials:"same-origin",cache:"no-store"
   });
   if(!response.ok)throw Error("fetch");
   const data=await response.json();
   if(!data.readOnly||!Array.isArray(data.records))throw Error("invalid response");
   if(!data.records.length){
     const p=document.createElement("p");p.className="plan-empty";
     p.textContent="Noch keine Änderungen im Entwicklungsbestand protokolliert.";target.append(p);return;
   }
   const labels={create_booking:"Interne Vormerkung angelegt",update_booking:"Vormerkung bestätigt",
     cancel_booking:"Vormerkung storniert",create_block:"Sperrzeit angelegt",
     remove_block:"Sperrzeit aufgehoben",change_resource:"Mietgerät geändert"};
   const format=new Intl.DateTimeFormat("de-DE",{timeZone:"Europe/Berlin",
     day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
   for(const record of data.records){
     const line=document.createElement("div");line.className="activity-entry";
     const name=document.createElement("strong");name.textContent=labels[record.action]||"Verwaltungsänderung";
     const date=document.createElement("time");date.textContent=format.format(new Date(record.created_at));
     line.append(name,date);target.append(line);
   }
 }catch{target.textContent="Das Änderungsprotokoll ist momentan nicht erreichbar. Die übrige Verwaltung bleibt verfügbar."}
}
async function authenticate(){
  try{
    const r=await client.getSession();
    if(r.error||!r.data?.user||!r.data?.session){location.replace("/admin/login/?next=dashboard");return}
    const token=await getAdminJwt(client,r);
    if(!token){lock("Neon hat keinen gültigen Sitzungsschlüssel geliefert. Bitte melde dich erneut an.");return}
    const resp=await fetch("/api/fotopolis/admin/session",{method:"GET",headers:{Authorization:"Bearer "+token},cache:"no-store",credentials:"same-origin"});
    if(resp.status===401){lock("Anmeldenachweis abgelehnt (401). Bitte melde dich erneut an.");return}
    if(resp.status===403){lock("Administratorrolle abgelehnt (403). Bitte kontaktiere die Administration.");return}
    if(resp.status===503){lock("Der Berechtigungsdienst ist vorübergehend nicht erreichbar (503).");return}
    if(!resp.ok)throw Error("Berechtigung nicht prüfbar");
    const body=await resp.json();
    if(!body.authorized||!["owner","manager","viewer"].includes(body.role))throw Error("Berechtigung ungültig");
    jwt=token;adminRole=body.role;
    $("[data-health-check]").hidden=body.role!=="owner";
    $("[data-user-email]").textContent=r.data.user.email||"–";
    $("[data-user-role]").textContent=roleLabels[body.role];
    $("[data-role-label]").textContent=roleLabels[body.role];
    $("#top-role").textContent=roleLabels[body.role].toUpperCase();
    gate.hidden=true;app.hidden=false;
    inventoryManager ||= setupInventoryManager({
      root:$("[data-inventory-manager]"),getResources:()=>resources,
      onChange:()=>{planningManager?.refresh();renderCalendar()},
      createResource:body.role==="viewer"?undefined:(record)=>saveInventory("POST",record),
      updateResource:body.role==="viewer"?undefined:(patch)=>saveInventory("PATCH",patch),
      canActivate:body.role==="owner"
    });
    planningManager ||= setupPlanningManager({
      root:$("[data-planning-manager]"),getResources:()=>resources,
      getInventoryDrafts:()=>inventoryManager?.getDrafts()||[],getAllocations:()=>allocations,
      onChange:()=>renderCalendar(),
      createBlock:body.role==="viewer"?undefined:(data)=>saveBlock("POST",data),
      cancelBlock:body.role==="viewer"?undefined:(id)=>saveBlock("PATCH",{id,action:"cancel"})
    });
    reservationsManager ||= setupReservationsManager({
      root:$("[data-reservations-manager]"),getResources:()=>resources,
      getAllocations:()=>allocations,
      createHold:body.role==="viewer"?undefined:(payload)=>saveReservation("POST",payload),
      changeHold:body.role==="viewer"?undefined:(id,action)=>saveReservation("PATCH",{id,action})
    });
    await loadCalendar();
    await loadActivity();
    updateNavigation();
    const anchor=location.hash&&document.querySelector(location.hash);
    if(anchor)requestAnimationFrame(()=>anchor.scrollIntoView({block:"start"}));
  }catch(e){lock("Die geschützte Verwaltung ist aktuell nicht erreichbar. Deine Daten bleiben gesperrt.")}
}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",async()=>{
  view=b.dataset.view;
  document.querySelectorAll("[data-view]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
  await loadCalendar();
}));
document.querySelectorAll("[data-nav]").forEach(b=>b.addEventListener("click",async()=>{
 const action=b.dataset.nav;
 if(action==="today"){cursor=current;selected=isoKey(current)}
 else if(view==="week"){cursor=addDays(cursor,action==="next"?7:-7);selected=isoKey(cursor)}
 else{cursor=new Date(Date.UTC(cursor.getUTCFullYear(),cursor.getUTCMonth()+(action==="next"?1:-1),1,12));selected=isoKey(cursor)}
 await loadCalendar();
}));
$("[data-product-filter]").addEventListener("change",renderCalendar);
const menu=$("[data-menu-toggle]"),mobile=$("#dashboard-mobile-menu");
menu.addEventListener("click",()=>{const open=menu.getAttribute("aria-expanded")!=="true";menu.setAttribute("aria-expanded",String(open));menu.setAttribute("aria-label",open?"Menü schließen":"Menü öffnen");mobile.hidden=!open});
mobile.querySelectorAll("a").forEach(x=>x.addEventListener("click",()=>{mobile.hidden=true;menu.setAttribute("aria-expanded","false")}));
// Keep context visible on mobile and desktop. Navigation is never an auth bypass.
function updateNavigation(){
 const target=location.hash||"#overview";
 const labels={"#overview":"Übersicht","#calendar":"Terminplaner","#inventory":"Gerätebestand","#planning":"Sperrzeiten","#bookings":"Vormerkungen","#activity":"Änderungsprotokoll","#account":"Mein Konto"};
 $(".crumbs strong").textContent=labels[target]||"Übersicht";
 for(const a of document.querySelectorAll('.sidebar-nav a, #dashboard-mobile-menu a')){
   const isActive=a.getAttribute("href")===target;
   a.classList.toggle("active",isActive);
   if(isActive)a.setAttribute("aria-current","page");
   else a.removeAttribute("aria-current");
 }
}
window.addEventListener("hashchange",updateNavigation);
$("[data-health-check]").addEventListener("click",async()=>{
 if(adminRole!=="owner")return;
 const button=$("[data-health-check]"),target=$("[data-health-status]");
 button.disabled=true;target.textContent="Verbindungen werden serverseitig geprüft …";
 try{
   const token=await getAdminJwt(client,await client.getSession());
   if(!token)throw Error("session");
   const response=await fetch("/api/fotopolis/admin/health",{
     method:"GET",headers:{"Authorization":"Bearer "+token},
     cache:"no-store",credentials:"same-origin"
   });
   if(!response.ok)throw Error("unavailable");
   const body=await response.json();
   if(!body.previewOnly||!body.services)throw Error("unexpected");
   const names={inventory:"Geräte",blocks:"Sperrzeiten",reservations:"Vormerkungen",calendar:"Kalender"};
   target.replaceChildren();
   for(const [name,label] of Object.entries(names)){
     const data=body.services[name];
     const line=document.createElement("div");line.className="health-row";
     const title=document.createElement("span");title.textContent=label;
     const state=document.createElement("strong");
     state.textContent=data?.connected?"Verbunden":data?.configured?"Verbindung gestört":"Nicht konfiguriert";
     state.dataset.ok=String(data?.connected===true);
     line.append(title,state);target.append(line);
   }
 }catch{target.textContent="Die Systemdiagnose ist aktuell nicht erreichbar."}
 finally{button.disabled=false}
});
$("[data-refresh-calendar]").addEventListener("click",()=>void loadCalendar());
$("[data-export-inventory]").addEventListener("click",()=>{
 if(!["owner","manager"].includes(adminRole)||!resources.length)return;
 downloadCsv("fotopolis-geraetebestand.csv",["Gerätekennung","Gerätename","Produktart","Status"],resources.map(r=>
  [r.resource_code,r.display_name,types[r.product_type]||r.product_type,r.enabled?"Aktiv":"Deaktiviert"]));
});
$("[data-export-calendar]").addEventListener("click",()=>{
 if(!["owner","manager"].includes(adminRole)||!allocations.length)return;
 const entries=filteredAllocations();
 const category={booking:"Interne Reservierung",internal_block:"Sperrzeit",maintenance:"Wartung"};
 const state={held:"Vorgemerkt",confirmed:"Bestätigt",blocked:"Gesperrt",cancelled:"Storniert"};
 const dt=v=>keyFromInstant(v)+" "+fmtTime.format(new Date(v));
 downloadCsv("fotopolis-terminuebersicht-"+selected.slice(0,7)+".csv",
  ["Gerät","Kategorie","Status","Veranstaltung Beginn","Veranstaltung Ende","Belegt ab","Belegt bis"],
  entries.map(a=>{
    const r=resources.find(r=>r.id===a.resource_id);
    return [r?.display_name||"Unbekanntes Gerät",category[a.allocation_kind]||a.allocation_kind,
      state[a.allocation_state]||a.allocation_state,dt(a.event_start_at),
      dt(a.event_end_at),dt(a.occupied_from),dt(a.occupied_until)];
  }));
});

$("[data-date-go]").addEventListener("click",async()=>{
 const date=$("#admin-jump-date").value;
 if(!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date))return;
 const parsed=fromKey(date);
 if(!Number.isFinite(parsed.getTime())||isoKey(parsed)!==date)return;
 cursor=parsed;selected=date;
 await loadCalendar();
 $("#calendar")?.scrollIntoView({block:"start",behavior:"smooth"});
 openDayDialog();
});
$("[data-plan-day]").addEventListener("click",()=>{
 $("#planning")?.scrollIntoView({block:"start",behavior:"smooth"});
 planningManager?.openForDate(selected);
});
$("[data-close-day]").addEventListener("click",()=>$("#day-detail-dialog").close());
$("[data-plan-selected]").addEventListener("click",()=>{
 $("#day-detail-dialog").close();
 $("#planning")?.scrollIntoView({block:"start",behavior:"smooth"});
 planningManager?.openForDate(selected);
});
$("#day-detail-dialog").addEventListener("click",event=>{
 if(event.target.id==="day-detail-dialog")event.currentTarget.close();
});
document.querySelectorAll("[data-signout]").forEach(b=>b.addEventListener("click",async()=>{
  try{await client.signOut()}finally{jwt="";location.replace("/admin/login/")}
}));
authenticate();
