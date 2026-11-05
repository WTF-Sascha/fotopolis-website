"use strict";
/* FOTOPOLIS Studio Experience Guide 3.0
   Deterministic editorial guidance – no personalization, tracking or booking. */
document.addEventListener("DOMContentLoaded", () => {
  const root = document.querySelector("[data-studio-advisor]");
  if (!root) return;
  const buttons = [...root.querySelectorAll("[data-advisor-occasion]")];
  const title = root.querySelector("[data-advisor-title]");
  const description = root.querySelector("[data-advisor-description]");
  const detail = root.querySelector("[data-advisor-detail]");
  const enquiry = root.querySelector("[data-advisor-enquiry]");
  const alternatives = root.querySelector("[data-advisor-alternative]");
  const content = {
    hochzeit: {
      name: "Der Fotospiegel.",
      product: "Fotospiegel",
      path: "fotospiegel",
      text: "Ein interaktiver Blickfang für eure Feier, bei dem gemeinsame Erinnerungen im Mittelpunkt stehen.",
      alternatives: "Alternativen: Fotobox für spontane Gruppenbilder oder Fotowohnwagen als eigener Erlebnisort.",
      occasion: "Hochzeit"
    },
    geburtstag: {
      name: "Die Fotobox.",
      product: "Fotobox",
      path: "fotobox",
      text: "Gemeinsam ausprobieren, zusammen lachen und persönliche Fotomomente schaffen.",
      alternatives: "Alternativen: Fotospiegel für eine interaktive Inszenierung oder Fotowohnwagen mit besonderem Charakter.",
      occasion: "Geburtstag / Jubiläum"
    },
    business: {
      name: "Der Fotospiegel.",
      product: "Fotospiegel",
      path: "fotospiegel",
      text: "Ein interaktiver Treffpunkt, der Gäste und Teams für einen Moment zusammenbringt.",
      alternatives: "Alternative: Fotobox für unkomplizierte Gruppenmomente. Der genaue Leistungsumfang wird abgestimmt.",
      occasion: "Firmenfeier / Business"
    },
    party: {
      name: "Der Fotowohnwagen.",
      product: "Fotowohnwagen",
      path: "fotowohnwagen",
      text: "Ein eigenständiger Erlebnisraum mit besonderem Charakter – wenn Stellfläche und Zufahrt passen.",
      alternatives: "Alternativen: Fotobox oder Fotospiegel, je nach Platz, Gästen und gewünschter Atmosphäre.",
      occasion: "Motto- / Gartenparty"
    }
  };
  function choose(key) {
    const item = content[key];
    if (!item) return;
    for (const button of buttons) {
      button.setAttribute("aria-pressed", String(button.dataset.advisorOccasion === key));
    }
    title.textContent = item.name;
    description.textContent = item.text;
    alternatives.textContent = item.alternatives;
    detail.href = "/" + item.path + "/";
    enquiry.href = "/kontakt/?produkt=" + encodeURIComponent(item.product) +
                   "&anlass=" + encodeURIComponent(item.occasion);
    root.dataset.selectedOccasion = key;
  }
  const result = root.querySelector(".advisor-result");
  // On a narrow screen the result is below the choices. Bring it into view
  // and move keyboard focus there, so the selection has immediate feedback.
  buttons.forEach(button => button.addEventListener("click", () => {
    choose(button.dataset.advisorOccasion);
    if (window.matchMedia("(max-width: 900px)").matches && result) {
      result.tabIndex = -1;
      result.focus({preventScroll:true});
      result.scrollIntoView({
        block:"start",
        behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"
      });
    }
  }));
  const switchOccasion = root.querySelector("[data-advisor-reset]");
  switchOccasion?.addEventListener("click", () => {
    const selected = buttons.find(button => button.getAttribute("aria-pressed") === "true") || buttons[0];
    selected?.focus({preventScroll:true});
    root.querySelector(".advisor-choice")?.scrollIntoView({
      block:"center",
      behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"
    });
  });
  choose("hochzeit");
});
