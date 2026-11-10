/* Existing Netlify Forms submission is the authoritative send.
   After success, a best-effort, idempotent copy is made to the isolated Neon DEV CRM.
   CRM sync failure cannot turn a delivered Netlify Form into a claimed failure.
*/
(()=>{
 if(!/^deploy-preview-\d+--fotopolis-preview\.netlify\.app$/.test(location.hostname))return;
 window.fp13MirrorEnquiry=async(form,source)=>{
  try{
   const data=new FormData(form);
   const read=n=>String(data.get(n)||"").trim();
   const product=read("produkt");
   const accepted=read("datenschutz_ok");
   if(!accepted) return false;
   const record={
    requestKey:crypto.randomUUID(),source:source==="product"?"product":"website",
    fullName:read("name").slice(0,100),email:read("email").slice(0,254),
    phone:read("telefon").slice(0,45),
    product:["Fotobox","Fotospiegel","Fotowohnwagen"].includes(product)?product:"Noch offen",
    eventDate:read("datum")||null,eventLocation:read("ort").slice(0,160),
    templateId:/^FP-0(?:[0-3][0-9]|4[0-4])$/.test(read("vorlage"))?read("vorlage"):null,
    notes:[read("notiz"),read("details")].filter(Boolean).join("\n").slice(0,1500),
    consentConfirmed:true,website:read("website")
   };
   const response=await fetch("/api/fotopolis/studio13/enquiry",{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(record),
    credentials:"same-origin",cache:"no-store",keepalive:false
   });
   if(!response.ok)throw new Error("CRM sync unavailable");
   window.dispatchEvent(new Event("fotopolis-studio13-enquiry"));
   return true;
  }catch{
   // Netlify already accepted the form; never misrepresent that as undelivered.
   return false;
  }
 };
})();
