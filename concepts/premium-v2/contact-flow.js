"use strict";
/* FOTOPOLIS 2.9 – client-side enquiry draft, never a live submission.
 * No persistence, APIs, tracking, background requests or automatic email.
 */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("[data-contact-flow]");
  if (!form) return;
  const output = document.querySelector("[data-contact-summary]");
  const mailLink = document.querySelector("[data-contact-email]");
  const copy = document.querySelector("[data-contact-copy]");
  const status = document.querySelector("[data-contact-status]");
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
  form.addEventListener("input",update);
  form.addEventListener("change",update);
  form.addEventListener("submit",event=>event.preventDefault());
  mailLink.addEventListener("click",event=>{
    if(!form.checkValidity()){
      event.preventDefault();
      form.reportValidity();
      status.textContent = "Bitte fülle zuerst Anlass, Name und eine gültige E-Mail-Adresse aus.";
    }
  });
  copy.addEventListener("click",async()=>{
    if(!form.checkValidity()){
      form.reportValidity();
      status.textContent = "Bitte fülle zuerst die Pflichtfelder aus.";
      return;
    }
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
  update();
});
