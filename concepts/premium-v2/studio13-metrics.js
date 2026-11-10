/* FOTOPOLIS Studio 13: preview-only, first-party, cookie-free aggregate events.
   No identifiers, IP addresses, URLs with query strings or persistent visitor IDs. */
(()=>{
 const allowed=["/","/fotobox/","/fotospiegel/","/fotowohnwagen/","/designvorlagen/","/kontakt/","/pakete/","/faq/","/anlaesse/","/ueber-uns/"];
 const pathname=location.pathname;
 if(!allowed.includes(pathname)||!/^deploy-preview-\d+--fotopolis-preview\.netlify\.app$/.test(location.hostname))return;
 const push=(eventType,page=pathname)=>{
  if(!allowed.includes(page))return;
  try{void fetch("/api/fotopolis/studio13/metric",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({eventType,page}),credentials:"same-origin",cache:"no-store",keepalive:true
   }).catch(()=>{});}catch{}
 };
 // Counts preview impressions, not persons. Ignore known crawler UAs.
 if(!/bot|crawler|spider|lighthouse|headless/i.test(navigator.userAgent))push("seitenaufruf");
 if(["/fotobox/","/fotospiegel/","/fotowohnwagen/"].includes(pathname)){
  document.addEventListener("click",event=>{
   const link=event.target.closest?.("a[href]");
   if(link&&/terminanfrage/.test(link.hash||""))push("produktinteresse");
  });
 }
 if(pathname==="/designvorlagen/"){
  document.addEventListener("click",event=>{
   if(event.target.closest?.(".gl-preview,.gl-detail"))push("designauswahl");
  });
 }
 window.addEventListener("fotopolis-studio13-enquiry",()=>push("anfrage_gesendet","/kontakt/"));
})();
