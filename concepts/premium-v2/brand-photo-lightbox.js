"use strict";
/* Keep the branded digital screen in sync when visitors advance the existing
   approved product gallery. Purely presentational; does not alter gallery logic. */
document.addEventListener("DOMContentLoaded",()=>{
 const dialog=document.querySelector("[data-gallery-dialog]");
 if(!dialog)return;
 const large=dialog.querySelector("[data-gallery-large]");
 const mark=dialog.querySelector("[data-photo-large-overprint]");
 if(!large||!mark)return;
 const sync=()=>{
  const src=large.getAttribute("src")||"";
  const overlay=src.includes("fotospiegel-hero-lossless.webp")
     ?"/assets/branding/fp-mirror-screen-overlay.svg"
     :src.includes("fotobox-event-")
     ?"/assets/branding/fp-box-screen-overlay.svg"
     :"";
  if(overlay){if(mark.getAttribute("src")!==overlay)mark.setAttribute("src",overlay);mark.hidden=false}
  else{mark.hidden=true;mark.removeAttribute("src")}
 };
 new MutationObserver(sync).observe(large,{attributes:true,attributeFilter:["src"]});
 sync();
});