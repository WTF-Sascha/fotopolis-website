"use strict";
// FOTOPOLIS Website 2.7 – local-only wish planner. No APIs, tracking, storage,
// availability checks, bookings or automatic email dispatch.
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("[data-package-planner]");
  if (!form) return;
  const summary = form.querySelector("[data-planner-summary]");
  const email = form.querySelector("[data-planner-email]");
  const copy = form.querySelector("[data-planner-copy]");
  const status = form.querySelector("[data-planner-status]");
  const baseEmail = "kontakt@fotopolis-mieten.de";

  function selectedData() {
    const data = new FormData(form);
    const product = String(data.get("produkt") || "Noch offen");
    const duration = String(data.get("dauer") || "noch offen");
    const date = String(data.get("datum") || "").slice(0, 10);
    const location = String(data.get("ort") || "").trim().slice(0, 120);
    const message = String(data.get("nachricht") || "").trim().slice(0, 500);
    const wishes = data.getAll("wunsch").map(value => String(value));
    return {product, duration, date, location, message, wishes};
  }
  function textFor({product, duration, date, location, message, wishes}) {
    return [
      "Hallo FOTOPOLIS,",
      "",
      "ich möchte ein unverbindliches Angebot für mein Event anfragen.",
      "Fotoerlebnis: " + product,
      "Gewünschte Mietdauer: " + duration,
      "Wunschtermin: " + (date || "noch offen"),
      "Veranstaltungsort: " + (location || "noch offen"),
      "Zu prüfende Leistungen: " + (wishes.length ? wishes.join(", ") : "noch offen"),
      "Besondere Wünsche: " + (message || "keine weiteren Angaben"),
      "",
      "Bitte bestätigt die tatsächliche Verfügbarkeit, Leistungen,",
      "ggf. Druckkontingente, Anlieferung, Auf- und Abbau und",
      "den Gesamtpreis individuell.",
      "Mir ist bewusst, dass hiermit keine Reservierung erfolgt.",
      "",
      "Viele Grüße"
    ].join("\n");
  }
  function update() {
    const data = selectedData();
    const text = textFor(data);
    // textContent prevents dynamic user input from becoming markup.
    summary.textContent = [
      "Fotoerlebnis: " + data.product,
      "Mietdauer (Wunsch): " + data.duration,
      "Wunschtermin: " + (data.date || "noch offen"),
      "Ort: " + (data.location || "noch offen"),
      "Wunschleistungen: " + (data.wishes.length ? data.wishes.join(" · ") : "noch offen"),
      "Zusatzinfo: " + (data.message || "–"),
      "Preis & Verfügbarkeit: werden erst im Angebot bestätigt"
    ].join("\n");
    const query = "subject=" + encodeURIComponent("FOTOPOLIS – unverbindliche Eventanfrage")
      + "&body=" + encodeURIComponent(text);
    email.href = "mailto:" + baseEmail + "?" + query;
    email.setAttribute("aria-label", "Unverbindliche E-Mail-Anfrage im E-Mail-Programm vorbereiten");
    status.textContent = "";
  }
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  form.addEventListener("submit", event => event.preventDefault());
  document.querySelectorAll("[data-package-choice]").forEach(link => {
    link.addEventListener("click", () => {
      const input = [...form.querySelectorAll('input[name="produkt"]')]
        .find(option => option.value === link.dataset.packageChoice);
      if (input) { input.checked = true; update(); }
    });
  });
  copy?.addEventListener("click", async () => {
    const value = textFor(selectedData());
    if (!navigator.clipboard?.writeText) {
      status.textContent = "Kopieren ist hier nicht verfügbar. Bitte den Text in der Zusammenfassung markieren.";
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      status.textContent = "Auswahl kopiert. Es wurde keine Anfrage versendet.";
    } catch {
      status.textContent = "Kopieren ist in diesem Browser gesperrt. Du kannst die E-Mail-Vorlage öffnen.";
    }
  });
  update();
});
