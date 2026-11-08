"use strict";
/* FOTOPOLIS Studio 3.0 – progressive client-only enquiry wizard.
 * No persistence, APIs, tracking, background requests or automatic email.
 */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("[data-contact-flow]");
  if (!form) return;
  const selectedDesignRaw = new URLSearchParams(window.location.search).get("vorlage");
  const selectedDesign = /^FP-\d{3}$/.test(selectedDesignRaw || "") ? selectedDesignRaw : "";
  if (selectedDesign) {
    const notice=document.createElement("p");
    notice.className="design-selected-notice";
    notice.textContent="Gewählte Fotodesignvorlage: " + selectedDesign;
    form.prepend(notice);
  }
  const output = document.querySelector("[data-contact-summary]");
  const mailLink = document.querySelector("[data-contact-email]");
  const copy = document.querySelector("[data-contact-copy]");
  const status = document.querySelector("[data-contact-status]");
  const inlineStatus = document.querySelector("[data-contact-inline-status]");
  const steps = [...form.querySelectorAll("[data-contact-step]")];
  const progress = [...document.querySelectorAll("[data-contact-progress-step]")];
  const backButton = form.querySelector("[data-contact-back]");
  const nextButton = form.querySelector("[data-contact-next]");
  const preferredWay = form.querySelector('[name="kontaktweg"]');
  const phoneField = form.querySelector('[name="telefon"]');
  const phoneLabel = form.querySelector("[data-contact-phone-optional]");
  const phoneHint = form.querySelector("[data-contact-phone-hint]");
  function updateCallbackRequirement() {
    const callback = preferredWay?.value === "Telefon (Rückrufwunsch)";
    if (phoneField) {
      phoneField.required = callback;
      phoneField.setAttribute("aria-required", String(callback));
    }
    if (phoneLabel) phoneLabel.textContent = callback ? "(erforderlich für Rückruf)" : "(optional)";
    if (phoneHint) phoneHint.textContent = callback ?
      "Bitte gib für den gewünschten Rückruf eine Telefonnummer an." :
      "Nur nötig, wenn du einen Rückruf wünschst.";
  }
  const emailAddress = "kontakt@fotopolis-mieten.de";
  const safe = value => String(value || "").trim();

  const getData = () => {
    const d = new FormData(form);
    return {
      occasion: safe(d.get("anlass")), product: safe(d.get("produkt")),
      date: safe(d.get("datum")), time: safe(d.get("tageszeit")),
      location: safe(d.get("ort")).slice(0,120),
      guests: safe(d.get("gaeste")).slice(0,6),
      name: safe(d.get("name")).slice(0,100),
      email: safe(d.get("email")).slice(0,150),
      phone: safe(d.get("telefon")).slice(0,45),
      way: safe(d.get("kontaktweg")),
      wishes: d.getAll("wunsch").map(safe),
      message: safe(d.get("details")).slice(0,800)
    };
  };
  const text = d => [
    "Hallo FOTOPOLIS,", "",
    "ich möchte ein unverbindliches Angebot für mein Event anfragen.", "",
    "ANLASS", d.occasion || "noch offen",
    "FOTOERLEBNIS", d.product || "noch offen",
    "DESIGNVORLAGE", selectedDesign || "noch offen",
    "WUNSCHTERMIN", d.date || "noch offen",
    "TAGESZEIT", d.time || "noch offen",
    "VERANSTALTUNGSORT", d.location || "noch offen",
    "GÄSTEZAHL", d.guests || "noch offen", "",
    "MEINE KONTAKTDATEN",
    "Name: " + (d.name || "noch offen"),
    "E-Mail: " + (d.email || "noch offen"),
    "Telefon: " + (d.phone || "nicht angegeben"),
    "Bevorzugt: " + (d.way || "E-Mail"), "",
    "WUNSCHOPTIONEN", d.wishes.length ? d.wishes.map(x=>"- "+x).join("\n") : "noch offen", "",
    "WEITERE ANGABEN", d.message || "keine", "",
    "Bitte bestätigt Leistungsumfang, Verfügbarkeit, Preis und Logistik individuell.",
    "Mit dieser Anfrage ist noch keine Buchung oder Reservierung verbunden.", "",
    "Viele Grüße", d.name || ""
  ].join("\n");
  function update() {
    const d = getData();
    output.textContent = [
      "Anlass: " + (d.occasion || "bitte auswählen"),
      "Fotoerlebnis: " + d.product,
      "Designvorlage: " + (selectedDesign || "keine Vorauswahl"),
      "Termin: " + (d.date || "noch offen") + " · " + d.time,
      "Ort: " + (d.location || "noch offen"),
      "Gäste: " + (d.guests || "noch offen"),
      "Name: " + (d.name || "noch offen"),
      "E-Mail: " + (d.email || "noch offen"),
      "Kontakt: " + d.way + (d.phone ? " · " + d.phone : ""),
      "Extras: " + (d.wishes.length ? d.wishes.join(", ") : "noch offen"),
      "Details: " + (d.message || "–"),
      "Buchung: keine Reservierung · Preis auf Anfrage"
    ].join("\n");
    mailLink.href = "mailto:" + emailAddress +
      "?subject=" + encodeURIComponent("FOTOPOLIS – unverbindliche Eventanfrage") +
      "&body=" + encodeURIComponent(text(d));
    status.textContent = "";
  }
  // Native controls remain available without JS. Progressive reveal only runs
  // after DOMContentLoaded and never deletes form values from the DOM.
  let currentStep = 1;
  function showStep(step, focusField = false) {
    currentStep = Math.min(3, Math.max(1, step));
    for(const group of steps) {
      const active = Number(group.dataset.contactStep) === currentStep;
      group.hidden = !active;
    }
    for(const item of progress) {
      const index = Number(item.dataset.contactProgressStep);
      if(index === currentStep)item.setAttribute("aria-current","step");
      else item.removeAttribute("aria-current");
      item.classList.toggle("is-complete",index < currentStep);
    }
    backButton.hidden = currentStep === 1;
    nextButton.textContent = currentStep === 1 ? "Weiter zu Kontaktdaten →" :
      currentStep === 2 ? "Weiter zu deinen Wünschen →" : "Angaben prüfen →";
    if (focusField) {
      steps[currentStep-1]?.querySelector("select,input:not([type=checkbox]),textarea")?.focus();
    }
  }
  function firstInvalid() {
    // Check all steps, including those currently hidden, without letting native
    // validation attempt to focus an invisible input.
    for(const group of steps) {
      const fields = [...group.querySelectorAll("input,select,textarea")];
      const invalid = fields.find(control => !control.checkValidity());
      if(invalid)return {step:Number(group.dataset.contactStep),element:invalid};
    }
    return null;
  }
  function askForMissing(message) {
    const invalid = firstInvalid();
    if(!invalid)return false;
    showStep(invalid.step);
    const msg = message || "Bitte vervollständige zuerst die Pflichtfelder.";
    inlineStatus.textContent = msg;
    status.textContent = msg;
    invalid.element.focus();
    invalid.element.reportValidity();
    return true;
  }
  backButton.addEventListener("click",()=>{
    inlineStatus.textContent="";
    showStep(currentStep-1,true);
  });
  nextButton.addEventListener("click",()=>{
    inlineStatus.textContent="";
    if(currentStep < 3){
      const fields = [...steps[currentStep-1].querySelectorAll("input,select,textarea")];
      const invalid = fields.find(control=>!control.checkValidity());
      if(invalid){
        inlineStatus.textContent = "Bitte vervollständige die markierten Pflichtfelder.";
        invalid.focus(); invalid.reportValidity(); return;
      }
      showStep(currentStep+1,true);
    }else{
      if(askForMissing("Bitte prüfe noch deine Pflichtangaben."))return;
      const recap = document.querySelector(".contact-recap");
      recap?.scrollIntoView({behavior:"smooth",block:"nearest"});
      mailLink.focus({preventScroll:true});
    }
  });
  showStep(1);
  updateCallbackRequirement();
  preferredWay?.addEventListener("change", () => {
    updateCallbackRequirement();
    update();
  });
  form.addEventListener("input",update);
  form.addEventListener("change",update);
  form.addEventListener("input",()=>{inlineStatus.textContent="";});
  form.addEventListener("submit",event=>event.preventDefault());
  mailLink.addEventListener("click",event=>{
    if(askForMissing("Bitte fülle zuerst Anlass, Name und eine gültige E-Mail-Adresse aus.")){
      event.preventDefault();
    }
  });
  copy.addEventListener("click",async()=>{
    if(askForMissing("Bitte fülle zuerst die Pflichtfelder aus."))return;
    if(!navigator.clipboard?.writeText){
      status.textContent = "Kopieren ist im Browser nicht verfügbar. Nutze die E-Mail-Vorlage.";
      return;
    }
    try {
      await navigator.clipboard.writeText(text(getData()));
      status.textContent = "Angaben kopiert. Es wurde nichts automatisch gesendet.";
    } catch {
      status.textContent = "Die Zwischenablage ist gesperrt. Nutze die E-Mail-Vorlage.";
    }
  });
  // Product choice may arrive from product-detail or package links.
  const query = new URLSearchParams(window.location.search);
  const product = query.get("produkt");
  if(["Fotobox","Fotospiegel","Fotowohnwagen"].includes(product)) {
    const option=[...form.querySelectorAll('select[name="produkt"] option')]
      .find(x=>x.value===product);
    if(option)option.selected=true;
  }
  const occasion = query.get("anlass");
  if(occasion) {
    const option = [...form.querySelectorAll('select[name="anlass"] option')]
      .find(x=>x.value === occasion && x.value !== "");
    if(option)option.selected=true;
  }
  // Product-page Wunschtermin links populate the existing detailed wizard.
  // Keep personal contact information out of URL parameters.
  const date = query.get("datum");
  if(date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const field=form.querySelector('[name="datum"]');
    if(field) field.value=date;
  }
  const time=query.get("tageszeit");
  if(time) {
    const field=form.querySelector('[name="tageszeit"]');
    const option=[...field.options].find(x=>x.value===time);
    if(option)field.value=option.value;
  }
  const place=query.get("ort");
  if(place) {
    const field=form.querySelector('[name="ort"]');
    if(field)field.value=place.slice(0,120);
  }
  const details=query.get("details");
  if(details) {
    const field=form.querySelector('[name="details"]');
    if(field)field.value=details.slice(0,800);
  }
  update();
});
