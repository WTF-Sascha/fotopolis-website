"use strict";
/* Studio 12: an explicit click in the local editor may pass DESIGN METADATA,
   never guest photos. The form remains unsubmitted until user consents. */
document.addEventListener("DOMContentLoaded",()=>{
  const form=document.querySelector("[data-contact-flow]");
  if(!form)return;
  let info=null;
  try{info=JSON.parse(sessionStorage.getItem("fp12-request")||"null");}
  catch(error){return;}
  const query=new URLSearchParams(location.search);
  if(!info||!/^FP-0(?:[0-3]\d|4[0-4])$/.test(info.id||"")||
     info.id!==query.get("vorlage")||
     Date.now()-Number(info.created)>30*60*1000||
     Date.now()<Number(info.created)||
     !["Fotobox","Fotospiegel","Fotowohnwagen"].includes(info.product))return;
  const field=form.querySelector('[name="details"]');
  if(!field)return;
  const personalization=String(info.caption||"").replace(/[\u0000-\u001f\u007f]/g," ").slice(0,65);
  const intro=[
    "FOTOPOLIS Design Studio 12.0:",
    "Vorlage: "+info.id+" · Produkt: "+info.product,
    personalization?"Gewünschte Beschriftung: "+personalization:"",
    info.photosComplete?"Private Druckvorschau wurde lokal gestaltet.":"Fotodesign vorausgewählt.",
    "Die privaten Fotodateien wurden NICHT übertragen."
  ].filter(Boolean).join("\n");
  if(!field.value.trim())field.value=intro.slice(0,800);
  const note=document.createElement("p");
  note.className="design-selected-notice";
  note.textContent="Deine Studio-12-Gestaltung wurde übernommen: "+info.id+
    ". Es wurden keine Bilddateien übertragen; die Anfrage ist unverbindlich.";
  form.prepend(note);
  field.dispatchEvent(new Event("input",{bubbles:true}));
  form.dispatchEvent(new Event("studio9-design-change",{bubbles:true}));
});
