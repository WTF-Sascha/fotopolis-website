/* FOTOPOLIS Studio 13 Command Center – actual, authenticated Neon DEV management.
   No fake KPIs, no raw HTML from content, no client-side security decisions. */
const labels={hero_note:"Startseite · Hinweis",contact_note:"Kontaktseite · Hinweis",
 faq_intro:"FAQ · Hinweis",about_note:"Über uns · Hinweis"};
const stages={unbearbeitet:"Unbearbeitet",in_pruefung:"In Prüfung",freigegeben:"Freigegeben"};
const statuses={neu:"Neu",in_pruefung:"In Prüfung",angebot:"Angebot erstellt",
 abgeschlossen:"Abgeschlossen",abgesagt:"Abgesagt"};
const date=v=>v?new Intl.DateTimeFormat("de-DE",{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Berlin"}).format(new Date(v)):"–";
function el(tag,text,className){
 const item=document.createElement(tag);
 if(text!==undefined&&text!==null)item.textContent=String(text);
 if(className)item.className=className;
 return item;
}
function field(parent,title,tag="input",props={}){
 const box=el("label",null,"cc-field");
 box.append(el("span",title));
 const control=document.createElement(tag);
 Object.assign(control,props);
 box.append(control);parent.append(box);return control;
}
function select(parent,title,options,value){
 const e=field(parent,title,"select");
 for(const [key,label] of options){const o=el("option",label);o.value=key;e.add(o);}
 if(value!==undefined)e.value=value;
 return e;
}
function panel(id){
 const root=document.querySelector("#"+id);
 if(!root)return null;
 let holder=root.querySelector(".cc-live");
 if(!holder){holder=el("div",null,"cc-live");root.append(holder);}
 const status=el("p","Bereich wird geladen …","cc-result");status.setAttribute("role","status");
 holder.append(status);return {root,holder,status};
}
function setStatus(p,msg,error=false){p.status.textContent=msg;p.status.dataset.error=String(error);}
function button(target,label,fn){
 const b=el("button",label,"cc-control-button");b.type="button";target.append(b);
 b.addEventListener("click",async()=>{
  b.disabled=true;
  try{await fn()}catch(err){const status=target.closest(".cc-live")?.querySelector(".cc-result");
   if(status){status.dataset.error="true";status.textContent=err.message||"Aktion fehlgeschlagen";}}
  finally{b.disabled=false;}
 });
 return b;
}
export function setupCommandCenter({getToken,role}){
 async function request(module,opts={}){
  const token=await getToken();
  if(!token)throw Error("Sitzung abgelaufen – bitte erneut anmelden.");
  const res=await fetch("/api/fotopolis/studio13/admin/"+module,{
    method:opts.method||"GET",
    headers:{Authorization:"Bearer "+token,...(opts.body?{"Content-Type":"application/json"}:{})},
    body:opts.body?JSON.stringify(opts.body):undefined,
    credentials:"same-origin",cache:"no-store"
  });
  let data;
  try{data=await res.json()}catch{throw Error("Ungültige Serverantwort");}
  if(!res.ok)throw Error((data.error||"Fehler")+" (HTTP "+res.status+")");
  return data;
 }
 async function analytics(){
  const p=panel("analytics");if(!p)return;
  try{
   const data=await request("analytics"),rows=data.rows||[];
   const metrics=rows.reduce((out,r)=>{out[r.event_type]=(out[r.event_type]||0)+Number(r.hits);return out;},{});
   const views=metrics.seitenaufruf||0,enq=metrics.anfrage_gesendet||0;
   const mirrored=Number(data.crm?.mirroredCount||0);
   const kpi=p.root.querySelector(".cc-kpis");
   if(kpi){kpi.replaceChildren();
    for(const [heading,value] of [["Gezählte Seitenaufrufe",views],
      ["Produktinteraktionen",metrics.produktinteresse||0],
      ["Designauswahlen",metrics.designauswahl||0],
      ["Gemessene Anfrageaktionen",enq],
      ["In Neon erfasste Anfragen",mirrored]]){
     const row=el("div");row.append(el("dt",heading),el("dd",value));kpi.append(row);
    }
   }
   setStatus(p,(rows.length?"Gezählte Ereignisse der letzten 30 Kalendertage. ":"Keine aggregierten Ereignisse in dieser Testumgebung. ")
     +"Neon-Anfragen sind zusätzliche Verwaltungskopien; Netlify Forms bleibt für tatsächlich eingegangene Formulare maßgeblich. Keine eindeutigen Besucher oder belastbare Conversion-Zahl.");
   const list=el("div",null,"cc-data-list");
   rows.slice(0,50).forEach(r=>list.append(el("p",r.event_date+" · "+r.page+" · "+r.event_type+" · "+r.hits)));
   const prior=p.holder.querySelector(".cc-data-list");if(prior)prior.remove();p.holder.append(list);
  }catch(e){setStatus(p,e.message,true);}
 }
 async function inquiries(){
  const p=panel("eventanfragen");if(!p)return;
  const toolbar=el("div",null,"cc-controls");
  button(toolbar,"Anfragen aktualisieren",draw);
  p.holder.append(toolbar);
  async function draw(){
   const old=p.holder.querySelector(".cc-records");old?.remove();
   try{
    const data=await request("inquiries"),list=el("div",null,"cc-records");
    setStatus(p,data.rows?.length?data.rows.length+" im Studio 13 erfasste Anfragen. Netlify Forms bei Bedarf separat kontrollieren.":"Noch keine mit Studio 13 synchronisierten Eventanfragen. Die bisherigen Netlify-Forms-Eingänge bleiben separat bestehen.");
    for(const r of data.rows||[]){
     const row=el("article",null,"cc-record");
     row.append(el("strong",r.full_name+" · "+r.product+" · "+(r.event_date||"Termin offen")));
     row.append(el("small",date(r.created_at)+" · "+r.source+" · "+(r.template_id||"ohne Vorlage")));
     row.append(el("p","Kontakt: "+r.email+(r.phone?" · "+r.phone:"")));
     row.append(el("p","Ort: "+(r.event_location||"offen")+" · Wunsch: "+(r.notes||"keine Angaben")));
     const selected=select(row,"Bearbeitungsstatus",Object.entries(statuses),r.status);
     button(row,"Status speichern",async()=>{
      await request("inquiries/"+r.id,{method:"PATCH",body:{status:selected.value}});
      setStatus(p,"Anfrage aktualisiert – keine Buchung erzeugt.");await draw();
     });
     list.append(row);
    }
    p.holder.append(list);
   }catch(e){setStatus(p,e.message,true)}
  }
  await draw();
 }
 async function cms(){
  const p=panel("cms");if(!p)return;
  const area=el("div",null,"cc-editor");
  const choice=select(area,"Inhaltsbereich",Object.entries(labels));
  const text=field(area,"Textentwurf – ohne HTML, maximal 1.200 Zeichen","textarea",{maxLength:1200,rows:4});
  const detail=el("p","","cc-hint");area.append(detail);
  const actions=el("div",null,"cc-controls");area.append(actions);
  const previous=select(area,"Veröffentlichte Version für Rollback",[]);
  p.holder.append(area);
  let records=[],versions=[];
  async function refresh(){
   try{
    const payload=await request("cms");records=payload.rows||[];versions=payload.versions||[];
    const value=records.find(x=>x.content_key===choice.value);
    text.value=value?.draft_text||"";
    detail.textContent="Entwurfsrevision "+(value?.version||0)+" · veröffentlichte Revision "+
       (value?.published_version||0)+". Veröffentlichung ausschließlich in dieser Test-Preview.";
    previous.replaceChildren();
    for(const v of versions.filter(x=>x.content_key===choice.value)){
     const option=el("option","Version "+v.version+" · "+date(v.created_at));option.value=v.version;previous.append(option);
    }
    setStatus(p,"Vier kontrollierte Textbereiche verfügbar. Das freigegebene Design und Logo werden nicht überschrieben.");
   }catch(e){setStatus(p,e.message,true)}
  }
  choice.addEventListener("change",()=>void refresh());
  button(actions,"Entwurf speichern",async()=>{
   await request("cms",{method:"POST",body:{key:choice.value,action:"save",text:text.value}});
   setStatus(p,"Entwurf versioniert gespeichert. Noch nicht öffentlich.");await refresh();
  });
  button(actions,"In Preview veröffentlichen",async()=>{
   const result=await request("cms",{method:"POST",body:{key:choice.value,action:"publish"}});
   setStatus(p,result.previewOnly?"Nur in der Testvorschau veröffentlicht.":"Speicherung bestätigt.");await refresh();
  });
  button(actions,"Version zurücksetzen",async()=>{
   if(!previous.value)throw Error("Keine frühere Veröffentlichung vorhanden");
   await request("cms",{method:"POST",body:{key:choice.value,action:"rollback",version:Number(previous.value)}});
   setStatus(p,"Vorheriger Stand in der Testvorschau wiederhergestellt.");await refresh();
  });
  await refresh();
 }
 async function designs(){
  const p=panel("designs");if(!p)return;
  const area=el("div",null,"cc-editor");
  const options=Array.from({length:44},(_,i)=>{const x="FP-"+String(i+1).padStart(3,"0");return [x,x]});
  const which=select(area,"Druckvorlage",options);
  const stage=select(area,"Qualitätsstatus",Object.entries(stages));
  const note=field(area,"Prüfnotiz","textarea",{rows:3,maxLength:600});
  p.holder.append(area);
  const actions=el("div",null,"cc-controls");p.holder.append(actions);
  let state=new Map();
  function update(){
   const saved=state.get(which.value);
   stage.value=saved?.stage||"unbearbeitet";
   note.value=saved?.review_note||"";
  }
  async function load(){
   try{
    const payload=await request("designs");
    state=new Map((payload.rows||[]).map(x=>[x.template_id,x]));
    update();
    const released=(payload.rows||[]).filter(x=>x.stage==="freigegeben").length;
    setStatus(p,released+" von 44 Vorlagen intern geprüft und freigegeben. Diese Stati ändern keine Originaldateien oder öffentlichen Vorlagen.");
   }catch(e){setStatus(p,e.message,true)}
  }
  which.addEventListener("change",update);
  button(actions,"Prüfung speichern",async()=>{
   await request("designs/"+which.value,{method:"POST",body:{stage:stage.value,note:note.value}});
   await load();
  });
  button(actions,"Aktualisieren",load);
  await load();
 }
 async function media(){
  const p=panel("medien");if(!p)return;
  const area=el("div",null,"cc-editor");
  const file=field(area,"Privates Bild (JPG, PNG, WebP · max. 2 MB)","input",{type:"file",accept:"image/jpeg,image/png,image/webp"});
  const alt=field(area,"Bildbeschreibung / Alternativtext","input",{type:"text",maxLength:200});
  const rights=field(area,"Nutzungsrechte / Herkunft dokumentieren","input",{type:"text",maxLength:350});
  p.holder.append(area);
  const actions=el("div",null,"cc-controls");p.holder.append(actions);
  const cards=el("div",null,"cc-records");p.holder.append(cards);
  let currentUrl=null;
  async function refresh(){
   try{
    const data=await request("media");cards.replaceChildren();
    setStatus(p,(data.rows||[]).length+" private Medien in der Entwicklung. Keine automatische Veröffentlichung.");
    for(const x of data.rows||[]){
     const row=el("article",null,"cc-record");
     row.append(el("strong",x.filename+" · "+Math.ceil(x.file_bytes/1024)+" KB"));
     row.append(el("small",x.state+" · "+x.mime_type+" · "+date(x.created_at)));
     row.append(el("p",x.alt_text+" · Rechte: "+x.license_note));
     if(x.state==="privat"){
      button(row,"Vorschau",async()=>{
       const token=await getToken();
       const res=await fetch("/api/fotopolis/studio13/admin/media/"+x.id,{
        headers:{Authorization:"Bearer "+token},credentials:"same-origin",cache:"no-store"});
       if(!res.ok)throw Error("Medienzugriff nicht gestattet");
       if(currentUrl)URL.revokeObjectURL(currentUrl);
       currentUrl=URL.createObjectURL(await res.blob());
       let image=row.querySelector("img");if(!image){image=el("img");image.className="cc-media-thumb";row.append(image)}
       image.src=currentUrl;image.alt=x.alt_text;
      });
      button(row,"Archivieren",async()=>{
       await request("media/"+x.id,{method:"PATCH",body:{action:"archive"}});
       await refresh();
      });
     }
     cards.append(row);
    }
   }catch(e){setStatus(p,e.message,true)}
  }
  button(actions,"Privates Bild hochladen",async()=>{
   const f=file.files?.[0];
   if(!f||f.size>2097152||f.size<16)throw Error("Bitte ein Bild mit höchstens 2 MB wählen.");
   if(!alt.value.trim()||!rights.value.trim())throw Error("Alt-Text und Nutzungsrechte sind erforderlich.");
   const buffer=await f.arrayBuffer(),bytes=new Uint8Array(buffer);let b64="";
   for(let offset=0;offset<bytes.length;offset+=16384){
    b64+=String.fromCharCode(...bytes.subarray(offset,offset+16384));
   }
   const body={filename:f.name,mimeType:f.type,base64:btoa(b64),
               altText:alt.value.trim(),licenseNote:rights.value.trim()};
   await request("media",{method:"POST",body});
   file.value="";alt.value="";rights.value="";await refresh();
  });
  button(actions,"Medienliste aktualisieren",refresh);
  await refresh();
 }
 async function roles(){
  const p=panel("system");if(!p)return;
  const area=el("div",null,"cc-editor");p.holder.append(area);
  if(role!=="owner"){setStatus(p,"Mitarbeiterrollen können nur durch den Hauptadministrator zugewiesen werden.");return;}
  const user=select(area,"Bereits aktiviertes Mitglied",[]);
  const effective=select(area,"Zusatzrolle",[["designer","Design"],["editor","Redaktion"],
    ["eventmanager","Eventmanagement"],["analyst","Analytics"]]);
  const active=field(area,"Rolle aktivieren","input",{type:"checkbox",checked:true});
  const actions=el("div",null,"cc-controls");area.append(actions);
  async function refresh(){
   try{
    const res=await request("roles");
    user.replaceChildren();
    for(const x of res.rows||[]){
     if(x.baseRole==="owner")continue;
     const o=el("option",x.userId+" · "+x.baseRole+(x.scope?" · "+x.scope:""));
     o.value=x.userId;o.dataset.scope=x.scope||"designer";o.dataset.active=String(x.scopeEnabled);
     if(!x.enabled)o.disabled=true;
     user.append(o);
    }
    if(user.selectedOptions[0]){effective.value=user.selectedOptions[0].dataset.scope;active.checked=user.selectedOptions[0].dataset.active==="true";}
    setStatus(p,(res.rows||[]).length+" bestehende Mitglieder. Neue Personen werden hier nicht registriert; eine aktive Neon-Auth-Mitgliedschaft ist Voraussetzung.");
   }catch(e){setStatus(p,e.message,true)}
  }
  user.addEventListener("change",()=>{const o=user.selectedOptions[0];
   if(o){effective.value=o.dataset.scope;active.checked=o.dataset.active==="true"}
  });
  button(actions,"Zusatzrolle zuweisen",async()=>{
   if(!user.value)throw Error("Kein zuweisbares Mitglied");
   await request("roles",{method:"POST",body:{userId:user.value,role:effective.value,active:active.checked}});
   await refresh();
  });
  await refresh();
  const audit=el("div",null,"cc-records");area.append(audit);
  async function loadAudit(){
   try{
    const data=await request("audit");audit.replaceChildren();
    for(const x of data.rows||[])audit.append(el("p",date(x.created_at)+" · "+x.action+" · "+x.target_type));
   }catch(e){setStatus(p,e.message,true)}
  }
  button(actions,"Studio-Audit anzeigen",loadAudit);
 }
 // Each module fails independently – calendar and existing admin tools keep working.
 for(const fn of [analytics,inquiries,cms,designs,media,roles]){
  Promise.resolve().then(fn).catch(()=>{});
 }
}
