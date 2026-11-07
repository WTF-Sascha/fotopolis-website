import {createAuthClient} from "@neondatabase/auth";
import {getAdminJwt} from "../session-token.js";

// Public provider URL, never a database password. Credentials are handled by Neon Auth.
const AUTH_URL="https://ep-withered-hat-b930f72a.neonauth.c-7.eu-central-1.aws.neon.tech/neondb/auth";
const client=createAuthClient(AUTH_URL);
const $=(s)=>document.querySelector(s);
const email=$("#email"),password=$("#login-password"),fresh=$("#new-password"),repeat=$("#confirm-password"),otp=$("#otp");
const submit=$("#submit"),send=$("#send-code"),status=$("#status"),panel=$("#session-panel");
const passwordFields=$("#password-fields"),resetFields=$("#reset-fields"),otpFields=$("#otp-fields");
const modes={
  password:{title:"Melde dich mit E-Mail-Adresse und deinem persönlichen Passwort an.",submit:"Mit Passwort anmelden",request:null},
  otp:{title:"Alternative Anmeldung mit einem Einmalcode aus deinem Postfach.",submit:"Mit Einmalcode anmelden",request:"Anmeldecode senden"},
  reset:{title:"Lege einmalig ein eigenes Passwort fest oder setze es später zurück.",submit:"Neues Passwort speichern",request:"Passwort-Code anfordern"},
  verify:{title:"Bestätige deine E-Mail-Adresse mit einem einmaligen Sicherheitscode.",submit:"E-Mail-Adresse bestätigen",request:"Bestätigungscode senden"}
};
let mode=new URL(location.href).searchParams.get("mode")==="reset"?"reset":"password";
let busy=false,codeRequested=false;
function message(text,kind=""){status.textContent=text;status.dataset.kind=kind}
function busyState(flag){
  busy=flag;
  for(const input of [email,password,fresh,repeat,otp])input.disabled=flag;
  submit.disabled=flag;send.disabled=flag;
  document.querySelectorAll("[data-mode]").forEach(b=>b.disabled=flag);
}
function address(){const a=email.value.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a))throw Error("Bitte gib eine gültige E-Mail-Adresse ein.");return a}
function getCode(){const c=otp.value.trim();if(!/^\d{6,8}$/.test(c))throw Error("Bitte gib den 6- bis 8-stelligen Sicherheitscode ein.");return c}
function newPassword(){
  const val=fresh.value;
  if(val.length<12||val.length>128)throw Error("Dein Passwort muss zwischen 12 und 128 Zeichen lang sein.");
  if(val!==repeat.value)throw Error("Die beiden Passwörter stimmen nicht überein.");
  return val;
}
function errorText(error){
 const text=(error?.message||"").toString();
 if(/TOO_MANY_ATTEMPTS|rate.limit|too.many.requests/i.test(text))return "Zu viele Anfragen. Bitte später erneut versuchen.";
 if(/invalid|expired|incorrect|verification/i.test(text))return "Code oder Zugangsdaten ungültig. Bitte prüfe die Eingabe.";
 if(/password/i.test(text))return "Passwort konnte nicht verarbeitet werden. Bitte verwende mindestens 12 Zeichen.";
 return "Die Anfrage konnte nicht abgeschlossen werden. Bitte versuche es erneut.";
}
function unwrap(r){if(r?.error)throw r.error;return r?.data}
// Neon Auth SDK versions differ in their email-OTP reset endpoint mapping.
// First attempt the documented SDK. A confirmed missing-route error falls
// back to the actual Better Auth OTP reset endpoint on the SAME trusted
// managed-auth origin. No password is logged, stored or sent to Netlify.
async function savePasswordWithOtp(address,code,pwd){
  try{
    const result=await client.emailOtp.resetPassword({email:address,otp:code,password:pwd});
    if(!result?.error)return;
    const status=result.error.status||result.error.statusCode;
    const msg=(result.error.message||"")+" "+(result.error.code||"");
    if(status!==404&&!/NOT_FOUND|404|passcode|endpoint not found/i.test(msg))throw result.error;
  }catch(e){
    const msg=String(e?.message||e);
    if(!/not a function|undefined|NOT_FOUND|404|passcode|endpoint not found/i.test(msg))throw e;
  }
  const res=await fetch(AUTH_URL+"/email-otp/reset-password",{
    method:"POST",mode:"cors",credentials:"include",cache:"no-store",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({email:address,otp:code,password:pwd})
  });
  if(!res.ok)throw new Error("Der Passwortdienst hat die Änderung nicht bestätigt.");
}

function setMode(next){
 if(!modes[next])return;
 mode=next;codeRequested=false;
 passwordFields.hidden=next!=="password";
 resetFields.hidden=next!=="reset";
 otpFields.hidden=true;otp.value="";
 send.hidden=next==="password";
 send.textContent=modes[next].request||"";
 submit.textContent=modes[next].submit;
 $("#intro").textContent=modes[next].title;
 document.querySelectorAll("[data-mode]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.mode===next)));
 $("#forgot").hidden=next==="reset";
 $("#verify-email").hidden=next==="verify";
 message("");
}
async function getAccess(){
 const session=await client.getSession();
 if(session.error||!session.data?.user||!session.data?.session)return {status:0,stage:"session",user:null};
 const token=await getAdminJwt(client,session);
 if(!token)return {status:0,stage:"jwt",user:session.data.user};
 try{
   const r=await fetch("/api/fotopolis/admin/session",{method:"GET",headers:{Authorization:"Bearer "+token},cache:"no-store",credentials:"same-origin"});
   return {status:r.status,stage:"gateway",user:session.data.user,details:r.status===200?await r.json():null};
 }catch{return {status:0,stage:"network",user:session.data.user}}
}
async function finishLogin(){
 const result=await getAccess();
 if(!result.user){
   panel.hidden=true;
   message("Es besteht noch keine gültige Sitzung. Bitte melde dich erneut an.","error");
   return;
 }
 panel.hidden=false;
 $("#session-info").textContent="Angemeldet als "+(result.user.email||"Administrator");
 $("#calendar-link").hidden=true;
 if(result.status===200&&result.details?.authorized){
   $("#access-info").textContent="Dein Administratorkonto ist bestätigt. Dein Dashboard wird geöffnet.";
   message("Anmeldung und Berechtigungen erfolgreich bestätigt.","success");
   $("#calendar-link").hidden=false;
   location.replace("/admin/dashboard/");
   return;
 }
 const errors={
   401:"Der Sitzungsschlüssel wurde vom Server abgelehnt (401). Melde dich bitte erneut an.",
   403:"Dein Konto ist angemeldet, aber die Administratorrolle wurde abgelehnt (403).",
   404:"Der Verwaltungsdienst ist derzeit nicht erreichbar (404).",
   503:"Die Berechtigungsprüfung ist vorübergehend nicht erreichbar (503)."
 };
 $("#access-info").textContent=result.stage==="jwt"
    ?"Der Sitzungsschlüssel konnte nicht überprüft werden. Bitte melde dich erneut an."
    :result.stage==="network"
    ?"Die Verwaltungs-API ist aufgrund eines Verbindungsproblems nicht erreichbar."
    :errors[result.status]||"Berechtigungsprüfung nicht abgeschlossen (HTTP "+result.status+").";
 message("Dashboard-Zugriff noch nicht bestätigt"+(result.status?" · Fehlercode "+result.status:"")+".","error");
}
send.addEventListener("click",async()=>{
  if(busy||mode==="password")return;
  let a;try{a=address()}catch(e){message(e.message,"error");email.focus();return}
  busyState(true);message("Der Code wird angefordert …");
  try{
    if(mode==="reset")unwrap(await client.forgetPassword.emailOtp({email:a}));
    else unwrap(await client.emailOtp.sendVerificationOtp({email:a,type:mode==="verify"?"email-verification":"sign-in"}));
    otpFields.hidden=false;codeRequested=true;
    message("Wenn dieses Postfach für den Zugang hinterlegt ist, wurde ein Code versendet. Bitte gib ihn unten ein.","success");
    otp.focus();
  }catch(e){message(errorText(e),"error")}
  finally{busyState(false)}
});
$("#auth-form").addEventListener("submit",async e=>{
  e.preventDefault();if(busy)return;
  let a,p,c;
  try{
    a=address();
    if(mode==="password"){p=password.value;if(!p)throw Error("Bitte gib dein Passwort ein.")}
    if(mode==="reset")p=newPassword();
    if(mode!=="password"&&!codeRequested)throw Error("Fordere zuerst einen Sicherheitscode an.");
    if(mode!=="password")c=getCode();
  }catch(e){message(e.message,"error");return}
  busyState(true);message("Deine Angaben werden sicher geprüft …");
  try{
    if(mode==="password"){
      unwrap(await client.signIn.email({email:a,password:p}));
      password.value="";
      message("Anmeldung erfolgreich. Dashboard-Berechtigung wird geprüft …");
      await finishLogin();
    }else if(mode==="otp"){
      unwrap(await client.signIn.emailOtp({email:a,otp:c}));
      otp.value="";
      message("Einmalcode angenommen. Dashboard-Berechtigung wird geprüft …");
      await finishLogin();
    }else if(mode==="reset"){
      await savePasswordWithOtp(a,c,p);
      fresh.value="";repeat.value="";otp.value="";
      // Neon revokes existing sessions after password reset.
      setMode("password");
      message("Dein persönliches Passwort wurde gespeichert. Melde dich jetzt damit an.","success");
      password.focus();
    }else{
      unwrap(await client.emailOtp.verifyEmail({email:a,otp:c}));
      setMode("password");
      message("E-Mail erfolgreich bestätigt. Du kannst jetzt ein Passwort festlegen.","success");
      setMode("reset");
      message("E-Mail bestätigt. Fordere jetzt deinen einmaligen Passwort-Code an.","success");
    }
  }catch(e){message(errorText(e),"error")}
  finally{busyState(false)}
});
document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>{if(!busy)setMode(b.dataset.mode)}));
$("#forgot").addEventListener("click",()=>{if(!busy)setMode("reset")});
$("#verify-email").addEventListener("click",()=>{if(!busy)setMode("verify")});
document.querySelectorAll("[data-reveal]").forEach(btn=>btn.addEventListener("click",()=>{
 const input=document.getElementById(btn.dataset.reveal);
 const reveal=input.type==="password";input.type=reveal?"text":"password";
 btn.textContent=reveal?"Verbergen":"Anzeigen";
 btn.setAttribute("aria-label",reveal?"Passwort verbergen":"Passwort anzeigen");
}));
$("#signout").addEventListener("click",async()=>{
  try{await client.signOut();panel.hidden=true;message("Du hast dich abgemeldet.","success")}
  catch{message("Abmeldung fehlgeschlagen.","error")}
});
setMode(mode);
if(mode!=="reset"){finishLogin().catch(()=>{panel.hidden=true})}
