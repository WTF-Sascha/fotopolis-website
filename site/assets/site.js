"use strict";
document.documentElement.classList.add("js");
document.addEventListener("DOMContentLoaded",()=>{
  const menu=document.querySelector("[data-menu-button]");
  const nav=document.querySelector("[data-navigation]");
  if(menu&&nav){
    function closeMenu(){nav.classList.remove("is-open");menu.setAttribute("aria-expanded","false");menu.setAttribute("aria-label","Menü öffnen");document.body.classList.remove("menu-open")}
    menu.addEventListener("click",()=>{const opened=nav.classList.toggle("is-open");menu.setAttribute("aria-expanded",String(opened));menu.setAttribute("aria-label",opened?"Menü schließen":"Menü öffnen");document.body.classList.toggle("menu-open",opened)});
    nav.querySelectorAll("a").forEach(el=>el.addEventListener("click",closeMenu));
    document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeMenu();menu.focus()}});
    document.addEventListener("click",e=>{if(nav.classList.contains("is-open")&&!nav.contains(e.target)&&!menu.contains(e.target))closeMenu()});
    window.addEventListener("resize",()=>{if(window.innerWidth>900)closeMenu()});
  }
  const occasions={
    hochzeit:{title:"Euer Tag. Eure Geschichte.",desc:"Für den Tag voller persönlicher Momente: Entdeckt Fotobox, Fotospiegel und Fotowohnwagen und findet gemeinsam das Erlebnis, das zu eurer Feier passt.",label:"Hochzeit"},
    geburtstag:{title:"Zusammen feiern. Zusammen lachen.",desc:"Vom runden Geburtstag bis zur kleinen Lieblingsrunde: Ein Fotoerlebnis bringt Gäste zusammen und macht den Abend ein Stück unvergesslicher.",label:"Geburtstag"},
    firma:{title:"Menschen verbinden. Eindrücke behalten.",desc:"Für Firmenfeiern, Team-Events oder andere geschäftliche Anlässe: Wir stimmen das Fotoerlebnis auf Format, Atmosphäre und Rahmenbedingungen ab.",label:"Firmenevent"},
    jubilaeum:{title:"Besondere Jahre verdienen besondere Bilder.",desc:"Ein Jubiläum ist der perfekte Anlass, Erinnerungen mit den Menschen festzuhalten, die dazu gehören.",label:"Jubiläum"}
  };
  const occasionTabs=document.querySelectorAll("[data-occasion]");
  const occasionTitle=document.querySelector("[data-occasion-title]");
  const occasionCopy=document.querySelector("[data-occasion-copy]");
  const occasionLink=document.querySelector("[data-occasion-link]");
  if(occasionTabs.length&&occasionTitle&&occasionCopy&&occasionLink){
    occasionTabs.forEach(tab=>tab.addEventListener("click",()=>{
      const item=occasions[tab.dataset.occasion];if(!item)return;
      occasionTabs.forEach(t=>t.setAttribute("aria-pressed",String(t===tab)));
      occasionTitle.textContent=item.title;
      occasionCopy.textContent=item.desc;
      occasionLink.href="/kontakt/?anlass="+encodeURIComponent(item.label);
    }));
  }
  const form=document.querySelector("[data-enquiry-form]");
  if(form){
    const occasionSelect=form.querySelector("[name=anlass]");
    const params=new URLSearchParams(location.search);
    const chosenDesign=/^FP-\d{3}$/.test(params.get("vorlage")||"")?params.get("vorlage"):"";
    if(chosenDesign){const note=document.createElement("p");note.className="notice";note.textContent="Ausgewählte Designvorlage: "+chosenDesign;form.prepend(note)}
    const requested=params.get("anlass");
    if(requested&&occasionSelect&&[...occasionSelect.options].some(o=>o.value===requested))occasionSelect.value=requested;
    const productSelect=form.querySelector("[name=produkt]");
    const product=params.get("produkt");
    if(product&&productSelect&&[...productSelect.options].some(o=>o.value===product))productSelect.value=product;
    form.addEventListener("submit",event=>{
      event.preventDefault();
      if(!form.reportValidity())return;
      const data=new FormData(form);
      const body=[
        "Hallo FOTOPOLIS,",
        "",
        "ich interessiere mich für ein Fotoerlebnis:",
        "Anlass: "+(data.get("anlass")||"Noch offen"),
        "Fotoerlebnis: "+(data.get("produkt")||"Noch offen"),
        "Designvorlage: "+(chosenDesign||"Keine Vorauswahl"),
        "Eventdatum: "+(data.get("datum")||"Noch offen"),
        "Veranstaltungsort: "+(data.get("ort")||"Noch offen"),
        "",
        "Weitere Informationen:",
        String(data.get("nachricht")||"Keine Angaben"),
        "",
        "Bitte meldet euch mit weiteren Informationen.",
        "Viele Grüße",
        String(data.get("name")||"")
      ].join("\n");
      const url="mailto:kontakt@fotopolis-mieten.de?subject="+encodeURIComponent("FOTOPOLIS – Eventanfrage")+"&body="+encodeURIComponent(body);
      window.location.href=url;
      const status=form.querySelector("[data-form-status]");
      if(status)status.textContent="Dein E-Mail-Programm wurde angefordert. Bitte prüfe die Nachricht und sende sie dort selbst ab. Es wurde nichts automatisch versendet.";
    });
  }
  if("IntersectionObserver" in window&&!matchMedia("(prefers-reduced-motion: reduce)").matches){
    const elements=[...document.querySelectorAll("[data-reveal]")];
    const obs=new IntersectionObserver((entries)=>{
      for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add("is-visible");obs.unobserve(entry.target)}
    },{rootMargin:"0px 0px -30px 0px",threshold:.08});
    for(const el of elements){el.classList.add("reveal");obs.observe(el)}
  }
});
if("serviceWorker" in navigator&&window.isSecureContext){
  window.addEventListener("load",()=>navigator.serviceWorker.register("/service-worker.js").catch(err=>console.warn("Service Worker:",err)));
}