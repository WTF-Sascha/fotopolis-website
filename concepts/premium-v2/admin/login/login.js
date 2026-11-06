import { createAuthClient } from "@neondatabase/auth";

// This is a PUBLIC auth endpoint, not a database password or service credential.
// All admin privileges are checked separately by the private Netlify endpoint.
const AUTH_URL="https://ep-withered-hat-b930f72a.neonauth.c-7.eu-central-1.aws.neon.tech/neondb/auth";
const client=createAuthClient(AUTH_URL);
const $=(s)=>document.querySelector(s);
const form=$("#auth-form"),email=$("#email"),otp=$("#otp"),area=$("#otp-area"),status=$("#status");
const button=$("#send-code"),confirm=$("#confirm-code"),sessionPanel=$("#session-panel");
const userInfo=$("#session-info"),accessInfo=$("#access-info"),calendarLink=$("#calendar-link");
const STEP={verify:{request:"Bestätigungscode senden",confirm:"E-Mail-Adresse bestätigen",text:"Nur für den ersten Zugriff: Zuerst die E-Mail-Adresse mit einem Code bestätigen."},signin:{request:"Anmeldecode senden",confirm:"Sicher anmelden",text:"Wenn die E-Mail-Adresse bereits bestätigt ist, kannst du dich mit einem neuen Einmalcode anmelden."}};
let mode="verify",busy=false;
function setMessage(message,kind=""){status.textContent=message;status.dataset.kind=kind}
function setBusy(value){busy=value;button.disabled=value;confirm.disabled=value;email.disabled=value;document.querySelectorAll("[data-mode]").forEach(b=>b.disabled=value)}
function getAddress(){const value=email.value.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))throw new Error("Bitte gib eine gültige E-Mail-Adresse ein.");return value}
function getCode(){const value=otp.value.trim();if(!/^\d{6,8}$/.test(value))throw new Error("Bitte gib den 6- bis 8-stelligen Einmalcode ein.");return value}
function friendly(error){const raw=(error?.message||error?.error?.message||"").toString();if(/TOO_MANY_ATTEMPTS|rate.limit|too.many.requests/i.test(raw))return "Zu viele Versuche. Bitte später erneut versuchen.";if(/expired|invalid|incorrect|verification/i.test(raw))return "Code ungültig oder abgelaufen. Bitte fordere einen neuen Code an.";if(/network|fetch failed/i.test(raw))return "Verbindung fehlgeschlagen. Bitte überprüfe die Internetverbindung.";return "Der Vorgang konnte nicht abgeschlossen werden. Bitte überprüfe dein Postfach und versuche es erneut."}
function unwrap(result){if(result?.error)throw result.error;return result?.data}
function showMode(next){mode=next;area.hidden=true;otp.value="";setMessage("");button.firstChild.textContent=STEP[mode].request+" ";confirm.textContent=STEP[mode].confirm;$("#step-explanation").textContent=STEP[mode].text;document.querySelectorAll("[data-mode]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.mode===mode)))}
async function checkBackend(){
  const session=unwrap(await client.getSession());
  if(!session?.user){sessionPanel.hidden=true;return}
  sessionPanel.hidden=false;
  userInfo.textContent="Angemeldet als "+session.user.email;
  calendarLink.hidden=true;
  accessInfo.textContent="Serverseitige Berechtigungsprüfung läuft …";
  try{
    const jwt=unwrap(await client.token());
    if(!jwt?.token){accessInfo.textContent="Sitzung vorhanden, aber kein gültiges Zugriffstoken. Melde dich bitte erneut an.";return}
    // JWT kept in memory. Never written to localStorage, HTML or URL.
    const res=await fetch("/api/fotopolis/admin/session",{
      method:"GET",headers:{Authorization:"Bearer "+jwt.token},credentials:"same-origin",cache:"no-store"
    });
    if(res.status===200){const data=await res.json();accessInfo.textContent="Administratorrolle serverseitig bestätigt: "+data.role+".";calendarLink.hidden=false}
    else if(res.status===403)accessInfo.textContent="E-Mail-Anmeldung erfolgreich. Die Administratorrolle ist noch nicht freigeschaltet.";
    else if(res.status===401)accessInfo.textContent="Das Zugriffstoken wurde nicht anerkannt. Bitte erneut anmelden.";
    else accessInfo.textContent="Die sichere Berechtigungsprüfung ist aktuell nicht verfügbar. Es werden keine Verwaltungsrechte erteilt.";
  }catch{accessInfo.textContent="Die Berechtigungsprüfung konnte nicht abgeschlossen werden. Der Verwaltungszugriff bleibt gesperrt."}
}
document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>{if(!busy)showMode(b.dataset.mode)}));
button.addEventListener("click",async()=>{
  if(busy)return;let address;try{address=getAddress()}catch(e){setMessage(e.message,"error");email.focus();return}
  setBusy(true);setMessage("Deine Anfrage wird geprüft …");
  try{unwrap(await client.emailOtp.sendVerificationOtp({email:address,type:mode==="verify"?"email-verification":"sign-in"}));
    area.hidden=false;setMessage("Falls die Adresse registriert ist, wurde ein Einmalcode an das Postfach gesendet. Bitte gib ihn unten ein.","success");otp.focus();
  }catch(e){setMessage(friendly(e),"error")}finally{setBusy(false)}
});
form.addEventListener("submit",async e=>{
  e.preventDefault();if(busy)return;let address,code;
  try{address=getAddress();code=getCode()}catch(e){setMessage(e.message,"error");return}
  setBusy(true);setMessage("Code wird sicher geprüft …");
  try{
    if(mode==="verify"){
      unwrap(await client.emailOtp.verifyEmail({email:address,otp:code}));
      setMessage("E-Mail-Adresse bestätigt. Fahre mit Schritt 2 fort und fordere einen neuen Anmeldecode an.","success");showMode("signin");
      setMessage("E-Mail-Adresse bestätigt. Fordere jetzt unter Schritt 2 deinen Anmeldecode an.","success");
    }else{
      unwrap(await client.signIn.emailOtp({email:address,otp:code}));
      setMessage("Anmeldung bestätigt. Deine Administratorrechte werden separat geprüft.","success");
      area.hidden=true;otp.value="";await checkBackend();
    }
  }catch(e){setMessage(friendly(e),"error")}finally{setBusy(false)}
});
$("#signout").addEventListener("click",async()=>{
  try{await client.signOut();sessionPanel.hidden=true;setMessage("Du wurdest sicher abgemeldet.","success")}
  catch{setMessage("Abmelden fehlgeschlagen. Bitte erneut versuchen.","error")}
});
showMode("verify");
checkBackend().catch(()=>{sessionPanel.hidden=true});
