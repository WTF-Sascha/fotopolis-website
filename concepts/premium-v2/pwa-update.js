/* FOTOPOLIS: single-origin installed app update coordinator. */
"use strict";
if("serviceWorker" in navigator && window.isSecureContext){
  let reloading=false;
  navigator.serviceWorker.addEventListener("controllerchange",()=>{
    if(reloading||!navigator.serviceWorker.controller)return;
    reloading=true;
    window.location.reload();
  });
  window.addEventListener("load",async()=>{
    try{
      const registration=await navigator.serviceWorker.register("/service-worker.js",{
        scope:"/",updateViaCache:"none"
      });
      // Fetch a fresh worker script whenever the installed app opens.
      await registration.update();
      document.addEventListener("visibilitychange",()=>{
        if(!document.hidden)registration.update().catch(()=>{});
      });
    }catch(err){
      console.warn("FOTOPOLIS App Update:",err);
    }
  });
}
