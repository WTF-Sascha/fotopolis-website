// FOTOPOLIS Studio 4.3 – first-run operational acceptance guide.
// All stages derive from authorized API data. Never use fake resources,
// unverified DB writes or a stored "done" toggle.
export function studioReadiness({role,loaded,resources=[],allocations=[],health=null}={}){
 if(role!=="owner")return {visible:false,done:0,total:5,steps:[]};
 const devices=loaded&&Array.isArray(resources)?resources:[];
 const bookings=loaded&&Array.isArray(allocations)?allocations:[];
 const services=["inventory","blocks","reservations","calendar"];
 const healthVerified=health?.previewOnly===true
   &&services.every(key=>health?.services?.[key]?.connected===true&&health?.services?.[key]?.permissionsReady===true);
 const deviceCount=devices.length;
 const activeCount=devices.filter(x=>x.enabled===true).length;
 const occupiedCount=bookings.filter(x=>["held","confirmed","blocked"].includes(x.allocation_state)
   &&["booking","internal_block","maintenance"].includes(x.allocation_kind)).length;
 const steps=[
   {id:"account",title:"Administratorzugang bestätigt",complete:true,detail:"Anmeldung und Owner-Berechtigung wurden geprüft",target:"#account"},
   {id:"system",title:"Systemrechte geprüft",complete:healthVerified,
     detail:healthVerified?"Alle vier Systemdienste und Berechtigungen geprüft":
       health===null?"Datenbankverbindungen und Schreibrechte noch nicht geprüft":
       "Mindestens ein Dienst ist nicht vollständig eingerichtet oder nicht erreichbar",target:"#account"},
   {id:"devices",title:"Echtes Mietgerät gespeichert",complete:loaded&&deviceCount>0,
     detail:!loaded?"Geschützter Gerätebestand wird geladen":deviceCount+" Geräte im Bestand",target:"#inventory"},
   {id:"active",title:"Mietgerät ausdrücklich aktiviert",complete:loaded&&activeCount>0,
     detail:!loaded?"Gerätestatus wird geladen":activeCount+" aktive Mietgeräte",target:"#inventory"},
   {id:"schedule",title:"Erste interne Belegung gespeichert",complete:loaded&&occupiedCount>0,
     detail:!loaded?"Geschützter Kalender wird geladen":
       occupiedCount+" aktive Sperrzeiten oder interne Vormerkungen im geladenen Zeitraum",
     target:"#bookings"}
 ];
 const done=steps.filter(x=>x.complete).length;
 return {visible:true,done,total:steps.length,complete:done===steps.length,steps};
}
const create=(tag,cls,text)=>{
 const element=document.createElement(tag);
 if(cls)element.className=cls;
 if(text!==undefined)element.textContent=text;
 return element;
};
export function setupFirstRun({root,onHealthCheck}){
 if(!root)throw Error("Setup root is missing");
 const progress=root.querySelector("[data-setup-progress]");
 const stepsTarget=root.querySelector("[data-setup-steps]");
 const message=root.querySelector("[data-setup-status]");
 const check=root.querySelector("[data-setup-health-check]");
 const next=root.querySelector("[data-setup-next]");
 if(!progress||!stepsTarget||!message||!check||!next)throw Error("Setup view incomplete");
 let current={role:"viewer",loaded:false,resources:[],allocations:[],health:null};
 let checking=false;
 function refresh(nextState={}){
   current={...current,...nextState};
   const view=studioReadiness(current);
   root.hidden=!view.visible;
   if(!view.visible)return;
   root.classList.toggle("is-complete",view.complete);
   progress.textContent=view.done+" von "+view.total+" Schritten bestätigt";
   stepsTarget.replaceChildren();
   for(const stage of view.steps){
     const row=create("li","setup-step");
     row.dataset.complete=String(stage.complete);
     const mark=create("span","setup-step-mark",stage.complete?"✓":"○");
     mark.setAttribute("aria-hidden","true");
     const inner=create("div","setup-step-content");
     const title=create("strong",null,stage.title);
     const detail=create("p",null,stage.detail);
     inner.append(title,detail);row.append(mark,inner);
     stepsTarget.append(row);
   }
   const first=view.steps.find(stage=>!stage.complete);
   next.hidden=!first||first.id==="system";
   if(first&&first.id!=="system"){
     next.href=first.target;
     next.textContent=first.id==="devices"?"Echtes Mietgerät anlegen":
       first.id==="active"?"Gerät aktivieren":"Interne Terminverwaltung öffnen";
   }
   check.disabled=checking;
   check.textContent=checking?"Prüfe Entwicklungsdienste …":
     current.health?"Systemrechte erneut prüfen":"Systemrechte prüfen";
   if(view.complete)message.textContent="Dein interner Arbeitsbereich ist eingerichtet. Alle fünf Einrichtungsschritte wurden überprüft.";
 }
 check.addEventListener("click",async()=>{
   if(checking||current.role!=="owner")return;
   checking=true;message.textContent="Prüfe die geschützten Systemdienste und Zugriffsrechte …";
   refresh();
   try{
     const health=await onHealthCheck();
     if(health?.previewOnly!==true||!health.services)throw Error("Ungültiger Prüfbericht");
     current.health=health;
     const okay=studioReadiness(current).steps.find(x=>x.id==="system").complete;
     message.textContent=okay?"Alle vier Dienste mit den erforderlichen Berechtigungen erreichbar.":
       "Mindestens ein Systemdienst ist noch nicht vollständig bereit. Prüfe den Status unter „Mein Konto & Sicherheit“.";
   }catch{
     current.health={previewOnly:true,services:{}};
     message.textContent="Die Prüfung ist nicht möglich. Es wurden keine Daten oder Geräte geändert.";
   }finally{checking=false;refresh()}
 });
 refresh();
 return {refresh};
}
