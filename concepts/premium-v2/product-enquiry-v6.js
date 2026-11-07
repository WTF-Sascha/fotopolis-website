"use strict";
/* Product Studio 6.0 – honest, client-only appointment enquiries.
   No network requests, tracking, server writes, hold or availability claim.
   The visitor must explicitly send the prepared email in their own email app. */
document.addEventListener("DOMContentLoaded",()=>{
  const section=document.querySelector("[data-product-request-section]");
  const form=section?.querySelector("[data-product-request]");
  if(!form)return;

  const address="kontakt@fotopolis-mieten.de";
  const product=form.dataset.product;
  const display=form.dataset.displayProduct;
  const select=name=>form.elements.namedItem(name);
  const mail=section.querySelector("[data-product-request-email]");
  const copy=section.querySelector("[data-product-request-copy]");
  const full=section.querySelector("[data-product-request-full]");
  const status=section.querySelector("[data-product-request-status]");
  const summaryDate=section.querySelector("[data-product-summary-date]");
  const summaryTime=section.querySelector("[data-product-summary-time]");
  const summaryPlace=section.querySelector("[data-product-summary-place]");
  const today=new Date();
  const todayLocal=[
    String(today.getFullYear()),
    String(today.getMonth()+1).padStart(2,"0"),
    String(today.getDate()).padStart(2,"0")
  ].join("-");
  const dateControl=select("datum");
  dateControl.min=todayLocal;

  const read=()=>({
    product,
    display,
    date:dateControl.value,
    time:select("tageszeit").value,
    place:select("ort").value.trim().slice(0,120),
    occasion:select("anlass").value,
    name:select("name").value.trim().slice(0,100),
    email:select("email").value.trim().slice(0,150),
    notes:select("notiz").value.trim().slice(0,700)
  });
  const formatDate=value=>{
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return "Noch nicht gewählt";
    const [year,month,day]=value.split("-").map(Number);
    const parsed=new Date(Date.UTC(year,month-1,day));
    if(parsed.getUTCFullYear()!==year||parsed.getUTCMonth()!==month-1||parsed.getUTCDate()!==day)return value;
    return new Intl.DateTimeFormat("de-DE",{day:"2-digit",month:"long",year:"numeric",timeZone:"UTC"}).format(parsed);
  };
  const text=d=>[
    "Hallo FOTOPOLIS,","",
    "ich möchte den folgenden Wunschtermin unverbindlich anfragen.","",
    "FOTOERLEBNIS: "+d.display,
    "WUNSCHTERMIN: "+(d.date ? formatDate(d.date) : "noch offen"),
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
    "Viele Grüße",
    d.name||""
  ].join("\n");
  const emailHref=d=>"mailto:"+address+
    "?subject="+encodeURIComponent("FOTOPOLIS | Terminanfrage "+d.display+(d.date?" | "+d.date:""))+
    "&body="+encodeURIComponent(text(d));

  const update=()=>{
    const d=read();
    summaryDate.textContent=formatDate(d.date);
    summaryTime.textContent=d.time;
    summaryPlace.textContent=d.place||"Wird abgestimmt";
    mail.href=emailHref(d);
    const params=new URLSearchParams({produkt:d.product});
    if(d.date)params.set("datum",d.date);
    if(d.time&&d.time!=="Noch offen")params.set("tageszeit",d.time);
    if(d.place)params.set("ort",d.place);
    if(d.occasion&&d.occasion!=="Noch offen")params.set("anlass",d.occasion);
    if(d.notes)params.set("details",d.notes);
    full.href="/kontakt/?"+params.toString();
    status.textContent="";
    for(const element of form.querySelectorAll('[aria-invalid="true"]'))element.removeAttribute("aria-invalid");
  };

  const validate=()=>{
    const name=select("name");
    const email=select("email");
    const candidate=[dateControl,name,email].find(field=>!field.checkValidity()||
      (field===dateControl&&field.value<todayLocal)||
      (field!==dateControl&&!field.value.trim()));
    if(candidate){
      candidate.setAttribute("aria-invalid","true");
      const fields={
        datum:"Bitte wähle einen gültigen Wunschtermin ab heute.",
        name:"Bitte gib deinen Namen an.",
        email:"Bitte gib eine gültige E-Mail-Adresse an."
      };
      status.textContent=fields[candidate.name]||"Bitte vervollständige die Pflichtangaben.";
      candidate.focus();
      candidate.reportValidity();
      return false;
    }
    status.textContent="";
    return true;
  };
  form.addEventListener("input",update);
  form.addEventListener("change",update);
  form.addEventListener("submit",event=>event.preventDefault());
  mail.addEventListener("click",event=>{
    if(!validate()){event.preventDefault();return;}
    // Do not simulate successful dispatch. Opening the mail client is not sending.
    status.textContent="Dein E-Mail-Programm öffnet den Entwurf. Bitte sende die Nachricht dort selbst ab.";
  });
  copy.addEventListener("click",async()=>{
    if(!validate())return;
    if(!navigator.clipboard?.writeText){
      status.textContent="Dein Browser unterstützt die Zwischenablage nicht. Nutze bitte den E-Mail-Entwurf.";
      return;
    }
    try{
      await navigator.clipboard.writeText(text(read()));
      status.textContent="Der Anfragetext wurde kopiert. Noch wurde nichts verschickt.";
    }catch{
      status.textContent="Der Kopiervorgang wurde blockiert. Nutze bitte den E-Mail-Entwurf.";
    }
  });
  update();
});
