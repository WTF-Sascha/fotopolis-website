import {createAuthClient} from "@neondatabase/auth";

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
const today=new Date(),current=new Date(Date.UTC(today.getFullYear(),today.getMonth(),today.getDate(),12));
let cursor=current, selected=isoKey(current),view="month",resources=[],allocations=[],jwt="",busy=false;
const keyFromInstant=(timestamp)=>{
  const parts=keyFmt.formatToParts(new Date(timestamp));
  const p=Object.fromEntries(parts.filter(x=>["day","month","year"].includes(x.type)).map(x=>[x.type,x.value]));
  return p.year+"-"+p.month+"-"+p.day;
};
const isoKey=d=>[d.getUTCFullYear(),String(d.getUTCMonth()+1).padStart(2,"0"),String(d.getUTCDate()).padStart(2,"0")].join("-");
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
   row.append(num,desc,flag);list.append(row);
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
  const kind=a.allocation_kind==="booking"?"Buchung":a.allocation_kind==="maintenance"?"Wartung":"Interne Sperrzeit";
  return label+" · "+kind;
}
function renderDetails(){
  $("[data-day-title]").textContent=fmtDay.format(fromKey(selected));
  const target=$("[data-day-details]");target.replaceChildren();
  const items=entriesForDay(selected);
  if(!items.length){const p=document.createElement("p");p.textContent="Für diesen Tag liegen keine Belegungen im Entwicklungsbestand vor. Dies ist keine verbindliche Verfügbarkeitszusage.";target.append(p);return}
  items.forEach(a=>{
    const row=document.createElement("div");row.className="day-details-entry";
    const title=document.createElement("strong");title.textContent=description(a);
    const time=document.createElement("span");time.textContent=fmtTime.format(new Date(a.event_start_at))+" – "+fmtTime.format(new Date(a.event_end_at));
    row.append(title,time);target.append(row);
  });
}
function renderCalendar(){
 const days=visibleDays();
 $("[data-period]").textContent=view==="week"?fmtDay.format(days[0])+" – "+fmtDay.format(days[6]):fmtMonth.format(cursor);
 const grid=$("[data-calendar-grid]");grid.replaceChildren();
 const currentKey=isoKey(current);
 days.forEach(d=>{
   const key=isoKey(d),items=entriesForDay(key);
   const cell=document.createElement("button");cell.type="button";cell.className="day";
   cell.setAttribute("aria-label",fmtDay.format(d)+", "+items.length+" Belegungen");
   cell.setAttribute("aria-pressed",String(key===selected));
   if(view==="month"&&d.getUTCMonth()!==cursor.getUTCMonth())cell.classList.add("outside");
   if(key===selected)cell.classList.add("is-selected");
   if(key===currentKey)cell.classList.add("is-today");
   const num=document.createElement("span");num.className="day-number";num.textContent=String(d.getUTCDate());cell.append(num);
   items.slice(0,2).forEach(a=>{
     const mark=document.createElement("span");mark.className="day-entry "+(a.allocation_kind==="booking"?"booked":"blocked");
     mark.textContent=description(a);cell.append(mark);
   });
   if(items.length>2){const extra=document.createElement("span");extra.className="day-extra";extra.textContent="+"+(items.length-2);cell.append(extra)}
   cell.addEventListener("click",()=>{selected=key;renderCalendar();});
   grid.append(cell);
 });
 const inVisible=filteredAllocations().filter(a=>days.some(d=>{const k=isoKey(d);return k>=keyFromInstant(a.occupied_from)&&k<=keyFromInstant(new Date(a.occupied_until).getTime()-1)}));
 $("[data-count=bookings]").textContent=String(inVisible.filter(a=>a.allocation_kind==="booking"&&a.allocation_state!=="cancelled").length);
 $("[data-count=blocks]").textContent=String(inVisible.filter(a=>a.allocation_kind!=="booking"&&a.allocation_state!=="cancelled").length);
 renderDetails();
}
async function loadCalendar(){
  if(busy)return;busy=true;
  try{
    const days=visibleDays(),from=isoKey(addDays(days[0],-1)),to=isoKey(addDays(days[days.length-1],2));
    const response=await fetch("/api/fotopolis/admin/overview?from="+encodeURIComponent(from)+"&to="+encodeURIComponent(to),{
      method:"GET",headers:{Authorization:"Bearer "+jwt},cache:"no-store",credentials:"same-origin"
    });
    if(response.status===401||response.status===403){lock("Deine Sitzung hat keinen Zugriff mehr. Melde dich bitte erneut an.");return}
    if(!response.ok)throw Error("Übersicht aktuell nicht verfügbar ("+response.status+")");
    const data=await response.json();
    if(!data.readOnly||!Array.isArray(data.resources)||!Array.isArray(data.allocations))throw Error("Ungültige Serverantwort");
    resources=data.resources;allocations=data.allocations;
    $("[data-count=resources]").textContent=String(resources.length);
    renderInventory();renderCalendar();
  }catch(e){
    $("[data-period]").textContent="Laden fehlgeschlagen";
    const wrap=$("[data-day-details]");wrap.replaceChildren();
    const info=document.createElement("p");info.className="alert-inline";info.textContent="Die geschützten Kalenderdaten sind zurzeit nicht erreichbar. Bitte lade die Seite erneut.";wrap.append(info);
    $("[data-count=resources]").textContent="–";$("[data-count=bookings]").textContent="–";$("[data-count=blocks]").textContent="–";
  }finally{busy=false}
}
function lock(msg){
  app.hidden=true;gate.hidden=false;message.textContent=msg;loginBack.hidden=false;
  jwt="";resources=[];allocations=[];
}
async function authenticate(){
  try{
    const r=await client.getSession();
    if(r.error||!r.data?.user||!r.data?.session){location.replace("/admin/login/?next=dashboard");return}
    const t=await client.token();
    if(t.error||!t.data?.token){lock("Sitzung konnte nicht geprüft werden. Bitte erneut anmelden.");return}
    const resp=await fetch("/api/fotopolis/admin/session",{method:"GET",headers:{Authorization:"Bearer "+t.data.token},cache:"no-store"});
    if(resp.status===401||resp.status===403){lock("Dein Konto ist angemeldet, aber derzeit nicht für die Verwaltung freigeschaltet.");return}
    if(!resp.ok)throw Error("Berechtigung nicht prüfbar");
    const body=await resp.json();
    if(!body.authorized||!["owner","manager","viewer"].includes(body.role))throw Error("Berechtigung ungültig");
    jwt=t.data.token;
    $("[data-user-email]").textContent=r.data.user.email||"–";
    $("[data-user-role]").textContent=roleLabels[body.role];
    $("[data-role-label]").textContent=roleLabels[body.role];
    $("#top-role").textContent=roleLabels[body.role].toUpperCase();
    gate.hidden=true;app.hidden=false;
    await loadCalendar();
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
document.querySelectorAll("[data-signout]").forEach(b=>b.addEventListener("click",async()=>{
  try{await client.signOut()}finally{jwt="";location.replace("/admin/login/")}
}));
authenticate();
