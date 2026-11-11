import {createAuthClient} from "@neondatabase/auth";
import {getAdminJwt} from "../session-token.js";
const client=createAuthClient("https://ep-withered-hat-b930f72a.neonauth.c-7.eu-central-1.aws.neon.tech/neondb/auth");
const gate=document.getElementById("fp13-gate"), message=document.getElementById("fp13-message");
const login=document.getElementById("fp13-login"),mount=document.getElementById("fp13-editor");
function fail(text){message.textContent=text;login.hidden=false;mount.hidden=true;}
async function authorizedFetch(path){
 const jwt=await getAdminJwt(client,await client.getSession());
 if(!jwt)throw new Error("Sitzung nicht vorhanden");
 return fetch(path,{method:"GET",headers:{"Authorization":"Bearer "+jwt},
                  cache:"no-store",credentials:"same-origin"});
}
(async()=>{
 try{
  const status=await authorizedFetch("/api/fotopolis/admin/session");
  if(status.status!==200){fail("Kein aktiver Administratorzugang. Bitte anmelden.");return;}
  const member=await status.json();
  // The server verifies the active designer scope; client-side base roles are not proof of permission.
  if(!["owner","manager","viewer"].includes(member.role)){fail("Keine Berechtigung für das interne Design Studio.");return;}
  const view=await authorizedFetch("/api/fotopolis/admin/design/editor");
  if(view.status===403){fail("Deine aktive Rolle ist nicht für das interne Design Studio freigeschaltet.");return;}
  if(!view.ok)throw new Error("Editor nicht erreichbar ("+view.status+")");
  const markup=await view.text();
  if(!markup.startsWith("<main id=\"content\"")||!markup.includes("data-fp12-editor"))throw Error("Invalid editor markup");
  mount.innerHTML=markup;
  window.fp13Fetch=authorizedFetch;
  mount.hidden=false;gate.hidden=true;
  const script=document.createElement("script");
  script.src="/admin/designstudio/studio13-editor.js";
  script.defer=true;document.body.append(script);
 }catch(error){fail("Geschützter Designarbeitsplatz nicht verfügbar. Erneut anmelden oder Verbindung prüfen.");}
})();
