/* FOTOPOLIS Studio 17.0 – deliberately isolated, local-only UX prototype.
   ZERO API/fetch/DB calls, zero storage, zero real customer records.
   Refreshing the page resets all simulated actions. */
"use strict";

const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const safe=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const icon=(name)=>'<svg aria-hidden="true"><use href="#i-'+name+'"></use></svg>';
const routes=[
 ["uebersicht","Übersicht"],["anfragen","Anfragen"],["termine","Termine"],
 ["geraete","Geräte"],["designs","Designs"],["website","Website"]
];
const validRoutes=new Set([...routes.map(x=>x[0]),"einstellungen"]);
const requests=[
 {id:"DEMO-1001",title:"Musteranfrage 001",event:"Firmenfeier",product:"Fotospiegel",date:"2026-11-21",place:"Beispielstadt",status:"Neu",email:"demo-001@example.invalid"},
 {id:"DEMO-1002",title:"Musteranfrage 002",event:"Hochzeit",product:"Fotobox",date:"2026-11-27",place:"Musterort",status:"Neu",email:"demo-002@example.invalid"},
 {id:"DEMO-1003",title:"Musteranfrage 003",event:"Geburtstag",product:"Fotowohnwagen",date:"2026-12-05",place:"Beispielort",status:"Neu",email:"demo-003@example.invalid"},
 {id:"DEMO-1004",title:"Musteranfrage 004",event:"Jubiläum",product:"Fotobox",date:"2026-12-12",place:"Musterstadt",status:"In Prüfung",email:"demo-004@example.invalid"}
];
let devices=[
 {id:"GER-01",name:"Fotospiegel 01",type:"Fotospiegel",status:"In Vorbereitung",description:"LED-Fotospiegel"},
 {id:"GER-02",name:"Fotobox 01",type:"Fotobox",status:"Verfügbar",description:"Fotobox-System"},
 {id:"GER-03",name:"Fotowohnwagen 01",type:"Fotowohnwagen",status:"Gesperrt",description:"Mobiler Fotowohnwagen"}
];
const events=[
 {date:"2026-11-21",title:"Firmenfeier · Fotospiegel",type:"Termin",device:"Fotospiegel 01"},
 {date:"2026-11-27",title:"Hochzeit · Fotobox",type:"Termin",device:"Fotobox 01"},
 {date:"2026-12-05",title:"Geburtstag · Fotowohnwagen",type:"Termin",device:"Fotowohnwagen 01"}
];
const contentAreas=[
 {key:"start",name:"Startseite",note:"Begrüßung und Hauptaussage"},
 {key:"faq",name:"FAQ",note:"Häufig gestellte Fragen"},
 {key:"contact",name:"Kontakt",note:"Informationen zur Anfrage"},
 {key:"about",name:"Über uns",note:"Vorstellung der Marke"}
];
const sections=new Set(["uebersicht","anfragen","termine","geraete","designs","website","einstellungen"]);
let calendarMonth=new Date(Date.UTC(2026,10,1,12));
let selectedDay="2026-11-21";
let collection="alle",designPage=0,designFilter="";
let lastDrawerFocus=null;
let toastHide=null;

function notify(message){
 const node=$("#toast");
 node.textContent=message;node.hidden=false;
 clearTimeout(toastHide);
 toastHide=setTimeout(()=>{node.hidden=true},4300);
}
function demoDialog(title,message){
 $("#dialog-title").textContent=title;$("#dialog-message").textContent=message;
 $("#demo-dialog").showModal();
}
function setNavOpen(open){
 $("#sidebar").classList.toggle("open",open);
 $("#nav-backdrop").hidden=!open;
 $("#menu-trigger").setAttribute("aria-expanded",String(open));
 $("#menu-trigger").setAttribute("aria-label",open?"Navigation schließen":"Navigation öffnen");
}
function closeDrawer(){
 const drawer=$("#detail-drawer");
 drawer.hidden=true;$("#drawer-backdrop").hidden=true;
 if(lastDrawerFocus?.isConnected)lastDrawerFocus.focus({preventScroll:true});
}
function openDrawer(content){
 lastDrawerFocus=document.activeElement;
 $("#drawer-content").innerHTML=content;
 $("#detail-drawer").hidden=false;$("#drawer-backdrop").hidden=false;
 $("#drawer-close").focus();
}
function route(){
 const key=decodeURIComponent(location.hash.replace(/^#/,""));
 return validRoutes.has(key)?key:"uebersicht";
}
function switchRoute(){
 const active=route();
 $$("[data-screen]").forEach(node=>{
  node.classList.toggle("active",node.dataset.screen===active);
 });
 $$("[data-nav]").forEach(button=>{
  const on=button.dataset.nav===active;
  button.classList.toggle("active",on);
  if(on)button.setAttribute("aria-current","page");else button.removeAttribute("aria-current");
 });
 $("#breadcrumb").textContent=active==="einstellungen"?"Einstellungen":routes.find(x=>x[0]===active)?.[1]||"Übersicht";
 setNavOpen(false);
 closeDrawer();
 window.scrollTo(0,0);
}
function go(name){
 if(!validRoutes.has(name))return;
 if(location.hash==="#"+name)switchRoute();
 else location.hash=name;
}
window.addEventListener("hashchange",switchRoute);

function fmtDate(value,{short=false}={}){
 const d=new Date(value+"T12:00:00Z");
 return new Intl.DateTimeFormat("de-DE",short?{day:"2-digit",month:"2-digit",timeZone:"UTC"}:
  {day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(d);
}
function badge(status){
 const color=status==="Neu"?"new":status==="In Prüfung"?"review":"held";
 return '<span class="chip '+color+'">'+safe(status)+'</span>';
}
function renderOverview(){
 const open=requests.filter(r=>r.status==="Neu");
 $("#metric-inquiries").textContent=String(open.length);
 $(".nav-counter").textContent=String(open.length);
 $("#priority-list").innerHTML=requests.slice(0,3).map(r=>
  '<button type="button" class="priority-item" data-inquiry="'+safe(r.id)+'"><span class="priority-dot"></span><span class="priority-content"><strong>'+
  safe(r.title)+' · '+safe(r.event)+'</strong><small>'+safe(r.product)+' · '+fmtDate(r.date)+'</small></span>'+
  badge(r.status)+icon("chevron")+'</button>').join("");
 $("#upcoming-list").innerHTML=events.slice(0,3).map(e=>{
  const d=new Date(e.date+"T12:00:00Z");
  const day=String(d.getUTCDate()).padStart(2,"0");
  const month=new Intl.DateTimeFormat("de-DE",{month:"short",timeZone:"UTC"}).format(d);
  return '<button class="upcoming-item" data-calendar-day="'+safe(e.date)+'" type="button"><span class="date-tile"><strong>'+day+
   '</strong><small>'+month.toUpperCase()+'</small></span><span class="upcoming-content"><strong>'+safe(e.title)+
   '</strong><small>'+safe(e.device)+'</small></span>'+icon("chevron")+'</button>';
 }).join("");
}
function renderInquiries(){
 const text=$("#inquiry-search").value.toLowerCase().trim();
 const filter=$("#inquiry-status").value;
 const list=requests.filter(r=>(filter==="alle"||r.status===filter)&&
  [r.id,r.title,r.event,r.product,r.place].some(v=>v.toLowerCase().includes(text)));
 $("#inquiry-list").innerHTML=list.map(r=>
  '<button type="button" class="record-row" data-inquiry="'+safe(r.id)+'">'+
  '<span class="record-primary"><strong>'+safe(r.title)+' · '+safe(r.event)+'</strong><small>'+safe(r.id)+' · '+safe(r.product)+'</small></span>'+
  '<span class="record-date">'+fmtDate(r.date)+'</span>'+badge(r.status)+icon("chevron")+'</button>').join("");
 $("#inquiry-empty").hidden=list.length>0;
}
function inquiryDetails(id){
 const r=requests.find(v=>v.id===id);if(!r)return;
 openDrawer('<h2>'+safe(r.title)+'</h2><p>'+safe(r.event)+' · Unverbindliche Eventanfrage mit Beispieldaten.</p>'+
  badge(r.status)+'<dl class="drawer-fields"><div><dt>Anfrage-ID</dt><dd>'+safe(r.id)+'</dd></div>'+
  '<div><dt>Produkt</dt><dd>'+safe(r.product)+'</dd></div><div><dt>Wunschtermin</dt><dd>'+fmtDate(r.date)+'</dd></div>'+
  '<div><dt>Veranstaltungsort</dt><dd>'+safe(r.place)+'</dd></div><div><dt>Kontakt (Demo)</dt><dd>'+safe(r.email)+'</dd></div></dl>'+
  '<label class="drawer-label" for="request-stage">Bearbeitungsstatus simulieren</label><select class="drawer-select" id="request-stage">'+
  ["Neu","In Prüfung","Vorgemerkt"].map(s=>'<option value="'+s+'"'+(r.status===s?" selected":"")+'>'+s+'</option>').join("")+
  '</select><div class="drawer-actions"><button id="save-request-stage" type="button" class="button-outline">Status für diese Demo ändern</button>'+
  '<button id="handoff-request" type="button" class="button-primary">'+icon("calendar")+' Zur Terminplanung</button></div>'+
  '<p class="below-note">Diese Ansicht ist ausschließlich ein UX-Prototyp. Keine E-Mail, kein CRM-Speichern, keine Buchung.</p>');
 $("#save-request-stage").addEventListener("click",()=>{
  r.status=$("#request-stage").value;
  renderOverview();renderInquiries();closeDrawer();
  notify("Demo-Status angepasst. Beim Neuladen wird alles zurückgesetzt.");
 });
 $("#handoff-request").addEventListener("click",()=>{
  selectedDay=r.date;
  calendarMonth=new Date(r.date+"T12:00:00Z");calendarMonth.setUTCDate(1);
  renderCalendar();go("termine");
  notify("Demo-Übergabe: Wunschtermin geöffnet. Es wurde keine Reservierung erstellt.");
 });
}
function calendarMonthTitle(){
 return new Intl.DateTimeFormat("de-DE",{month:"long",year:"numeric",timeZone:"UTC"}).format(calendarMonth);
}
function renderCalendar(){
 $("#calendar-title").textContent=calendarMonthTitle();
 const year=calendarMonth.getUTCFullYear(),month=calendarMonth.getUTCMonth();
 const first=new Date(Date.UTC(year,month,1,12));
 const shift=(first.getUTCDay()+6)%7;
 const start=new Date(Date.UTC(year,month,1-shift,12));
 const cells=[];
 for(let i=0;i<42;i++){
  const d=new Date(start.getTime()+i*86400000);
  const date=d.toISOString().slice(0,10);
  const matches=events.filter(e=>e.date===date);
  const classes=["day-cell",d.getUTCMonth()!==month?"other-month":"",date===selectedDay?"selected":"",matches.length?"has-entry":""].filter(Boolean).join(" ");
  cells.push('<button type="button" class="'+classes+'" data-day="'+date+'" aria-label="'+
   fmtDate(date)+(matches.length?", "+matches.length+" Demo-Termin":"")+'" aria-pressed="'+String(date===selectedDay)+'">'+
   '<span class="day-number">'+d.getUTCDate()+'</span>'+matches.slice(0,2).map(e=>
   '<span class="event-mark'+(e.type==="Sperrzeit"?" block":"")+'">'+safe(e.type==="Sperrzeit"?"Sperrzeit":e.title)+'</span>').join("")+'</button>');
 }
 $("#calendar-grid").innerHTML=cells.join("");
 $("#selected-day-label").textContent=fmtDate(selectedDay);
 const dayEvents=events.filter(e=>e.date===selectedDay);
 $("#selected-day-list").innerHTML=dayEvents.length?dayEvents.map(e=>
  '<div class="day-event"><span class="date-tile">'+icon(e.type==="Sperrzeit"?"clock":"calendar")+'</span><div><strong>'+
   safe(e.title)+'</strong><p>'+safe(e.type)+' · '+safe(e.device)+'</p></div></div>').join(""):
  '<p class="below-note">Für diesen Tag liegen in der Demo keine Termine vor.</p>';
}
function blockDraft(){
 openDrawer('<h2>Neue Sperrzeit</h2><p>So könnte eine interne Sperrzeit in der späteren Verwaltung angelegt werden.</p>'+
 '<form id="block-form" class="drawer-actions"><label class="drawer-label" for="block-date">Datum</label>'+
 '<input required class="drawer-select" id="block-date" type="date" value="'+safe(selectedDay)+'">'+
 '<label class="drawer-label" for="block-reason">Bezeichnung</label>'+
 '<input required class="drawer-select" id="block-reason" maxlength="40" value="Wartung (Demo)">'+
 '<button type="submit" class="button-primary">Nur im Prototyp anzeigen</button></form>'+
 '<p class="below-note">Keine DB-Aktion, kein realer Gerätestatus, keine Buchungswirkung.</p>');
 $("#block-form").addEventListener("submit",e=>{
  e.preventDefault();
  const date=$("#block-date").value,reason=$("#block-reason").value.trim();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!reason)return;
  events.push({date,title:reason,type:"Sperrzeit",device:"Keine Gerätezuordnung (Demo)"});
  selectedDay=date;calendarMonth=new Date(date+"T12:00:00Z");calendarMonth.setUTCDate(1);
  renderCalendar();closeDrawer();notify("Demo-Sperrzeit im Kalender angezeigt. Keine Speicherung.");
 });
}
function renderDevices(){
 const q=$("#device-search").value.toLowerCase().trim(),type=$("#device-type").value;
 const filtered=devices.filter(d=>(type==="alle"||d.type===type)&&
 [d.id,d.name,d.description].some(v=>v.toLowerCase().includes(q)));
 $("#device-grid").innerHTML=filtered.length?filtered.map(d=>
 '<article class="device-card"><div class="device-visual">'+icon("camera")+'</div><div><span class="chip '+(d.status==="Verfügbar"?"held":"review")+'">'+
 safe(d.status)+'</span><br><strong>'+safe(d.name)+'</strong><p>'+safe(d.description)+' · '+safe(d.id)+'</p>'+
 '<button type="button" class="button-outline" data-device="'+safe(d.id)+'">Gerät ansehen '+icon("arrow")+'</button></div></article>').join(""):
 '<p class="empty-state">Keine passenden Beispielgeräte.</p>';
}
function deviceDetails(id){
 const d=devices.find(x=>x.id===id);if(!d)return;
 openDrawer('<h2>'+safe(d.name)+'</h2><p>'+safe(d.description)+'</p><dl class="drawer-fields">'+
 '<div><dt>Kennung</dt><dd>'+safe(d.id)+'</dd></div><div><dt>Geräteart</dt><dd>'+safe(d.type)+'</dd></div>'+
 '<div><dt>Status</dt><dd>'+safe(d.status)+'</dd></div></dl>'+
 '<label class="drawer-label" for="device-stage">Status nur in der Demo ändern</label>'+
 '<select id="device-stage" class="drawer-select">'+["Verfügbar","In Vorbereitung","Gesperrt"].map(s=>
 '<option'+(s===d.status?" selected":"")+'>'+s+'</option>').join("")+'</select>'+
 '<div class="drawer-actions"><button type="button" id="device-stage-save" class="button-primary">Demo-Status übernehmen</button></div>'+
 '<p class="below-note">Keine Aktivierung, Sperrung oder Wartungsänderung an realen Mietgeräten.</p>');
 $("#device-stage-save").addEventListener("click",()=>{
  d.status=$("#device-stage").value;renderDevices();closeDrawer();
  notify("Demostatus angepasst. Reale Geräte bleiben unverändert.");
 });
}
function deviceDraft(){
 openDrawer('<h2>Gerät hinzufügen</h2><p>Formular zur Bewertung des vorgeschlagenen Ablaufs. Es werden ausschließlich lokale Demogeräte erzeugt.</p>'+
 '<form id="new-device-form" class="drawer-actions">'+
 '<label class="drawer-label" for="new-device-type">Geräteart</label>'+
 '<select id="new-device-type" class="drawer-select"><option>Fotobox</option><option>Fotospiegel</option><option>Fotowohnwagen</option></select>'+
 '<label class="drawer-label" for="new-device-name">Bezeichnung</label>'+
 '<input id="new-device-name" required maxlength="50" class="drawer-select" placeholder="z. B. Fotobox Testgerät">'+
 '<button class="button-primary" type="submit">Demogerät anlegen</button></form>');
 $("#new-device-form").addEventListener("submit",e=>{
  e.preventDefault();const name=$("#new-device-name").value.trim(),type=$("#new-device-type").value;
  if(!name)return;
  devices.push({id:"DEMO-GER-"+String(devices.length+1),name,type,status:"In Vorbereitung",description:"Neu hinzugefügtes Demogerät"});
  renderDevices();closeDrawer();notify("Demogerät hinzugefügt – nur bis zum Neuladen.");
 });
}
const designs=Array.from({length:44},(_,i)=>({
 id:"FP-"+String(i+1).padStart(3,"0"),
 collection:i<32?"classics":"signature",
 image:i<32?"/assets/designvorlagen/fp-"+String(i+1).padStart(3,"0")+".webp":null
}));
const designStages=new Map();
function filteredDesigns(){
 return designs.filter(d=>(collection==="alle"||d.collection===collection)&&
 d.id.toLowerCase().includes(designFilter));
}
function designArt(d,forDrawer=false){
 if(d.image)return '<img src="'+d.image+'" alt="Bestehende öffentliche Vorschau '+d.id+'" loading="lazy">';
 return '<span class="placeholder-shape" aria-label="Konzeptplatzhalter für Signature-Vorlage"><i></i><i></i></span>';
}
function renderDesigns(){
 $$("[data-collection]").forEach(x=>{const selected=x.dataset.collection===collection;x.classList.toggle("selected",selected);x.setAttribute("aria-pressed",String(selected))});
 const items=filteredDesigns(),pageSize=8;
 const pages=Math.max(1,Math.ceil(items.length/pageSize));
 designPage=Math.min(designPage,pages-1);
 const slice=items.slice(designPage*pageSize,(designPage+1)*pageSize);
 $("#design-grid").innerHTML=slice.length?slice.map(d=>
 '<button type="button" data-design="'+d.id+'" class="design-item"><span class="design-art'+(d.image?"":" placeholder")+'">'+designArt(d)+'</span>'+
 '<span class="design-details"><strong>'+d.id+'</strong><span>'+(d.collection==="classics"?"Classic · Bestandsmotiv":"Signature · Konzeptplatzhalter")+
 '</span><span>'+safe(designStages.get(d.id)||"Prüfung offen")+'</span></span></button>').join(""):
 '<p class="empty-state">Keine passende Vorlage gefunden.</p>';
 $("#design-count").textContent=items.length?"Einträge "+(designPage*pageSize+1)+"–"+
 Math.min((designPage+1)*pageSize,items.length)+" von "+items.length:"0 von 0";
 $("#design-prev").disabled=designPage===0;
 $("#design-next").disabled=designPage>=pages-1;
}
function designDetails(id){
 const d=designs.find(v=>v.id===id);if(!d)return;
 openDrawer('<h2>'+safe(d.id)+'</h2><p>'+(d.collection==="classics"?
 "Vorschau des vorhandenen Classic-Motivs. Das Original wird nicht verändert.":
 "Signature-Karte als Konzeptplatzhalter. Die echten Druckdateien werden hier nicht dargestellt.")+'</p>'+
 '<div class="drawer-preview"><div class="design-art'+(d.image?"":" placeholder")+'">'+designArt(d,true)+'</div></div>'+
 '<label class="drawer-label" for="design-stage">Interne Prüfung simulieren</label>'+
 '<select id="design-stage" class="drawer-select">'+["Prüfung offen","In Prüfung","Konzeptionell freigegeben"].map(s=>
 '<option'+((designStages.get(id)||"Prüfung offen")===s?" selected":"")+'>'+s+'</option>').join("")+'</select>'+
 '<div class="drawer-actions"><button type="button" class="button-primary" id="design-status-save">Demo-Prüfstatus übernehmen</button>'+
 '<button type="button" class="button-outline" id="prototype-editor">Fotoeditor-Ablauf ansehen '+icon("arrow")+'</button></div>'+
 '<p class="below-note">Keine Druckfreigabe, kein Live-Upload und kein Zugriff auf private Originale.</p>');
 $("#design-status-save").addEventListener("click",()=>{
  designStages.set(id,$("#design-stage").value);renderDesigns();closeDrawer();
  notify("Design-Demostatus aktualisiert. Die reale Designfreigabe bleibt unverändert.");
 });
 $("#prototype-editor").addEventListener("click",()=>demoDialog("Fotoeditor · Ablaufkonzept",
  "Die Detailansicht soll später direkt in den geschützten Editor für die ausgewählte Vorlage führen. Phase 1 zeigt den Übergang, bearbeitet jedoch keine Druckdaten."));
}
function renderWebsite(){
 $("#content-list").innerHTML=contentAreas.map(item=>
 '<button type="button" data-content="'+item.key+'"><span>'+safe(item.name)+
 '<small>'+safe(item.note)+'</small></span>'+icon("chevron")+'</button>').join("");
}
function contentDetail(key){
 const item=contentAreas.find(x=>x.key===key);if(!item)return;
 openDrawer('<h2>'+safe(item.name)+'</h2><p>'+safe(item.note)+'</p>'+
 '<label class="drawer-label" for="content-draft">Beispieltext (lokal)</label>'+
 '<textarea id="content-draft" rows="6" class="drawer-select" maxlength="500" placeholder="Hier könnte ein redaktioneller Entwurf stehen."></textarea>'+
 '<div class="drawer-actions"><button type="button" id="save-content-demo" class="button-primary">Entwurf nur im Prototyp übernehmen</button></div>'+
 '<p class="below-note">Keine Verbindung zum CMS und keine Veröffentlichung auf der Website.</p>');
 $("#save-content-demo").addEventListener("click",()=>{
  closeDrawer();notify("Nur die Interaktion wurde simuliert. Website-Inhalte wurden nicht geändert.");
 });
}
function installHandlers(){
 $$("[data-nav],[data-go]").forEach(button=>button.addEventListener("click",()=>go(button.dataset.nav||button.dataset.go)));
 $("#menu-trigger").addEventListener("click",()=>setNavOpen(!$("#sidebar").classList.contains("open")));
 $("#nav-backdrop").addEventListener("click",()=>setNavOpen(false));
 $("#drawer-close").addEventListener("click",closeDrawer);
 $("#drawer-backdrop").addEventListener("click",closeDrawer);
 document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){
   if(!$("#detail-drawer").hidden)closeDrawer();
   if($("#sidebar").classList.contains("open"))setNavOpen(false);
  }
 });
 $("#main").addEventListener("click",e=>{
  const inquiry=e.target.closest("[data-inquiry]");
  const calendar=e.target.closest("[data-calendar-day]");
  const device=e.target.closest("[data-device]");
  const design=e.target.closest("[data-design]");
  const content=e.target.closest("[data-content]");
  const setting=e.target.closest("[data-settings]");
  const day=e.target.closest("[data-day]");
  if(inquiry)return inquiryDetails(inquiry.dataset.inquiry);
  if(calendar){
   selectedDay=calendar.dataset.calendarDay;
   calendarMonth=new Date(selectedDay+"T12:00:00Z");calendarMonth.setUTCDate(1);
   renderCalendar();go("termine");return;
  }
  if(device)return deviceDetails(device.dataset.device);
  if(design)return designDetails(design.dataset.design);
  if(content)return contentDetail(content.dataset.content);
  if(setting)return demoDialog(setting.dataset.settings,
   "Dieser Verwaltungsbereich ist im Konzept eingeordnet. Nutzerrechte, Authentifizierung und Systemprotokolle werden in Phase 1 nicht verändert.");
  if(day){
   selectedDay=day.dataset.day;renderCalendar();return;
  }
 });
 $("#inquiry-search").addEventListener("input",renderInquiries);
 $("#inquiry-status").addEventListener("change",renderInquiries);
 $("#inquiry-help").addEventListener("click",()=>demoDialog("Anfrage → Termin → Auftrag",
  "Eine Anfrage kommt an, wird geprüft und bleibt unverbindlich. Erst nach bewusster Zuordnung von Gerät, Zeitfenster und Puffer kann im späteren Backend eine Vormerkung entstehen. Keine automatische Buchung."));
 $("#month-prev").addEventListener("click",()=>{calendarMonth.setUTCMonth(calendarMonth.getUTCMonth()-1);renderCalendar()});
 $("#month-next").addEventListener("click",()=>{calendarMonth.setUTCMonth(calendarMonth.getUTCMonth()+1);renderCalendar()});
 $("#month-today").addEventListener("click",()=>{calendarMonth=new Date(Date.UTC(2026,10,1,12));selectedDay="2026-11-21";renderCalendar()});
 $("#add-block").addEventListener("click",blockDraft);
 $("#device-search").addEventListener("input",renderDevices);
 $("#device-type").addEventListener("change",renderDevices);
 $("#device-add").addEventListener("click",deviceDraft);
 $$("[data-collection]").forEach(button=>button.addEventListener("click",()=>{
  collection=button.dataset.collection;designPage=0;renderDesigns();
 }));
 $("#design-search").addEventListener("input",e=>{designFilter=e.target.value.trim().toLowerCase();designPage=0;renderDesigns()});
 $("#design-prev").addEventListener("click",()=>{if(designPage>0)designPage--;renderDesigns()});
 $("#design-next").addEventListener("click",()=>{designPage++;renderDesigns()});
 $("#media-manage").addEventListener("click",()=>demoDialog("Medienbibliothek",
  "Hier werden nach der Freigabe Medien, Bildrechte und Voransichten einheitlich verwaltet. Phase 1 enthält keine Upload-Funktion und keine privaten Fotos."));
}
installHandlers();
renderOverview();renderInquiries();renderCalendar();renderDevices();renderDesigns();renderWebsite();switchRoute();
