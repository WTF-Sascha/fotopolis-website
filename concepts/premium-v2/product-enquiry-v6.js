"use strict";
/* FOTOPOLIS Studio Edition 7.0 – accessible two-step enquiry.
   A visitor explicitly sends their prepared email; the website does not
   transmit, promise availability or reserve a date. */
document.addEventListener("DOMContentLoaded", () => {
  const section=document.querySelector("[data-product-request-section]");
  const form=section?.querySelector("[data-product-request]");
  if(!form)return;
  const product=form.dataset.product;
  const display=form.dataset.displayProduct;
  const field=name=>form.elements.namedItem(name);
  const emailLink=section.querySelector("[data-product-request-email]");
  const copyButton=section.querySelector("[data-product-request-copy]");
  const extended=section.querySelector("[data-product-request-full]");
  const status=section.querySelector("[data-product-request-status]");
  const dateDisplay=section.querySelector("[data-product-summary-date]");
  const timeDisplay=section.querySelector("[data-product-summary-time]");
  const placeDisplay=section.querySelector("[data-product-summary-place]");
  const steps=[...section.querySelectorAll("[data-product-step]")];
  const indicators=[...section.querySelectorAll("[data-product-progress]")];
  const next=section.querySelector("[data-product-next]");
  const back=section.querySelector("[data-product-back]");
  const stepCount=section.querySelector("[data-step-current]");
  const dateField=field("datum");
  const now=new Date();
  const pad=n=>String(n).padStart(2,"0");
  const minDate=[now.getFullYear(),pad(now.getMonth()+1),pad(now.getDate())].join("-");
  dateField.min=minDate;

  const formatDate=value=>{
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return "Noch nicht gewählt";
    const [year,month,day]=value.split("-").map(Number);
    const parsed=new Date(Date.UTC(year,month-1,day));
    if(parsed.getUTCFullYear()!==year||parsed.getUTCMonth()!==month-1||parsed.getUTCDate()!==day)return value;
    return new Intl.DateTimeFormat("de-DE",{
      year:"numeric",month:"long",day:"2-digit",timeZone:"UTC"
    }).format(parsed);
  };
  const read=()=>({
    product,display,
    date:dateField.value,
    time:field("tageszeit").value,
    place:field("ort").value.trim().slice(0,120),
    occasion:field("anlass").value,
    name:field("name").value.trim().slice(0,100),
    email:field("email").value.trim().slice(0,150),
    notes:field("notiz").value.trim().slice(0,700),
    design:field("vorlage")?.value||""
  });
  const content=d=>[
    "Hallo FOTOPOLIS,","",
    "ich möchte den folgenden Wunschtermin unverbindlich anfragen.","",
    "FOTOERLEBNIS: "+d.display,
    "FOTODESIGN: "+(d.design||"Noch offen"),
    "WUNSCHTERMIN: "+(d.date?formatDate(d.date):"noch offen"),
    "TAGESZEIT: "+d.time,
    "ANLASS: "+d.occasion,
    "VERANSTALTUNGSORT: "+(d.place||"noch offen"),"",
    "KONTAKTDATEN",
    "Name: "+(d.name||"noch nicht angegeben"),
    "E-Mail: "+(d.email||"noch nicht angegeben"),"",
    "WEITERE WÜNSCHE",
    d.notes||"keine","",
    "Bitte prüft die Verfügbarkeit und erstellt mir ein persönliches Angebot.",
    "Mir ist bewusst, dass dies noch keine Buchung oder Reservierung ist.","",
    "Viele Grüße",d.name||""
  ].join("\n");
  const emailHref=d=>"mailto:kontakt@fotopolis-mieten.de"+
    "?subject="+encodeURIComponent("FOTOPOLIS | Terminanfrage "+d.display+(d.date?" | "+d.date:""))+
    "&body="+encodeURIComponent(content(d));

  const update=()=>{
    const d=read();
    dateDisplay.textContent=formatDate(d.date);
    timeDisplay.textContent=d.time;
    placeDisplay.textContent=d.place||"Wird abgestimmt";
    emailLink.href=emailHref(d);
    const params=new URLSearchParams({produkt:d.product});
    if(d.date)params.set("datum",d.date);
    if(d.time&&d.time!=="Noch offen")params.set("tageszeit",d.time);
    if(d.design)params.set("vorlage",d.design);
    if(d.occasion&&d.occasion!=="Noch offen")params.set("anlass",d.occasion);
    // Do not leak free-form personal messages or location into URLs.
    extended.href="/kontakt/?"+params.toString();
    for(const invalid of form.querySelectorAll('[aria-invalid="true"]'))invalid.removeAttribute("aria-invalid");
    status.textContent="";
  };

  const setStep=(n,focus=false)=>{
    const number=n===2?2:1;
    section.dataset.currentStep=String(number);
    steps.forEach(step=>{step.hidden=Number(step.dataset.productStep)!==number});
    indicators.forEach(item=>{
      const active=Number(item.dataset.productProgress)===number;
      item.classList.toggle("is-active",active);
      if(active)item.setAttribute("aria-current","step");
      else item.removeAttribute("aria-current");
    });
    stepCount.textContent=number===1?"01":"02";
    status.textContent="";
    if(focus){
      const first=number===1?dateField:field("name");
      first.focus({preventScroll:true});
      section.querySelector(".s7-request-card")?.scrollIntoView({
        block:"start",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"
      });
    }
  };
  const fail=(input,message)=>{
    // Change to the appropriate step *before* writing the error.
    // setStep() clears old status; previously it also hid a fresh error.
    const n=["name","email","notiz"].includes(input.name)?2:1;
    if(Number(section.dataset.currentStep)!==n)setStep(n);
    input.setAttribute("aria-invalid","true");
    status.textContent=message;
    input.focus({preventScroll:false});
    input.reportValidity();
    return false;
  };
  const eventValid=()=>{
    if(!dateField.value||!dateField.checkValidity()||dateField.value<minDate)
      return fail(dateField,"Bitte wähle einen gültigen Wunschtermin ab heute.");
    return true;
  };
  const allValid=()=>{
    if(!eventValid())return false;
    if(!field("name").value.trim()||!field("name").checkValidity())
      return fail(field("name"),"Bitte gib deinen Namen an.");
    if(!field("email").value.trim()||!field("email").checkValidity())
      return fail(field("email"),"Bitte gib eine gültige E-Mail-Adresse an.");
    status.textContent="";
    return true;
  };
  next.addEventListener("click",()=>{
    if(eventValid())setStep(2,true);
  });
  back.addEventListener("click",()=>setStep(1,true));
  form.addEventListener("input",update);
  form.addEventListener("change",update);
  form.addEventListener("studio9-design-change",update);
  form.addEventListener("submit",event=>event.preventDefault());

  emailLink.addEventListener("click",event=>{
    if(!allValid()){event.preventDefault();return;}
    status.textContent="Der Entwurf öffnet sich im E-Mail-Programm. Bitte dort selbst abschicken.";
  });
  copyButton.addEventListener("click",async()=>{
    if(!allValid())return;
    if(!navigator.clipboard?.writeText){
      status.textContent="Die Zwischenablage ist nicht verfügbar. Nutze den E-Mail-Entwurf.";
      return;
    }
    try{
      await navigator.clipboard.writeText(content(read()));
      status.textContent="Anfragetext kopiert. Es wurde nichts verschickt.";
    }catch{
      status.textContent="Kopieren wurde blockiert. Nutze stattdessen den E-Mail-Entwurf.";
    }
  });

  // Always start on the clearly labelled first step. Never silently submit.
  setStep(1);
  update();
});
