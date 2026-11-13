/* FOTOPOLIS Studio 14 – reliable, preview-only CRM mirror.
 * Netlify Forms remains authoritative. Never persist personal data in the browser.
 * Retry the SAME key after ambiguous network failures to prevent duplicates.
 */
(()=>{
 "use strict";
 // Accept only the numbered PR preview or the canonical staging hostname; never main or arbitrary branches.
 const host=location.hostname.toLowerCase();
 if(!(/^deploy-preview-[1-9][0-9]*--fotopolis-preview\.netlify\.app$/.test(host)||
      host==="staging--fotopolis-preview.netlify.app"))return;
 const keys=new WeakMap();
 window.fp13MirrorEnquiry=async(form,source)=>{
  const signal=state=>window.dispatchEvent(new CustomEvent("fotopolis-studio14-sync",{detail:{state}}));
  try{
   const data=new FormData(form);
   const read=n=>String(data.get(n)||"").trim();
   // A honeypot entry is not an accepted customer request.
   if(!read("datenschutz_ok")||read("website")){signal("not-mirrored");return false;}
   // The key was already submitted in the accepted Netlify Forms payload.
   // Reuse it verbatim to make the two systems auditable against each other.
   const submittedKey=read("fp_request_key");
   if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submittedKey)){
    signal("needs-reconciliation");return false;
   }
   const product=read("produkt");
   if(!keys.has(form))keys.set(form,submittedKey);
   if(keys.get(form)!==submittedKey){signal("needs-reconciliation");return false;}
   const record={
    requestKey:keys.get(form),
    source:source==="product"?"product":"website",
    fullName:read("name").slice(0,100),email:read("email").slice(0,254),
    phone:read("telefon").slice(0,45),
    product:["Fotobox","Fotospiegel","Fotowohnwagen"].includes(product)?product:"Noch offen",
    eventDate:read("datum")||null,eventLocation:read("ort").slice(0,160),
    templateId:/^FP-0(?:[0-3][0-9]|4[0-4])$/.test(read("vorlage"))&&read("vorlage")!=="FP-000"?read("vorlage"):null,
    notes:[read("notiz"),read("details")].filter(Boolean).join("\n").slice(0,1500),
    consentConfirmed:true,website:""
   };
   const body=JSON.stringify(record);
   for(let attempt=0;attempt<2;attempt++){
    const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),4500);
    try{
     const response=await fetch("/api/fotopolis/studio13/enquiry",{
      method:"POST",headers:{"Content-Type":"application/json"},body,
      credentials:"same-origin",cache:"no-store",keepalive:false,signal:abort.signal
     });
     if(response.status===201){
      const result=await response.json();
      if(result.accepted===true&&result.notBooked===true&&typeof result.id==="string"){
       signal("mirrored");window.dispatchEvent(new Event("fotopolis-studio13-enquiry"));
       return true;
      }
     }
     // Validation and permission failures are not transient.
     if([400,401,403,404,429].includes(response.status))break;
    }catch{/* A network timeout may have persisted the request; keep its idempotency key. */}
    finally{clearTimeout(timeout);}
   }
  }catch{/* Customer's accepted Netlify submission must not be undone. */}
  signal("needs-reconciliation");
  return false;
 };
})();
