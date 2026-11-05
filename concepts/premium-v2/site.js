"use strict";
document.addEventListener("DOMContentLoaded",()=>{
  const button=document.querySelector("[data-menu-toggle]");
  const nav=document.getElementById("mainnav");
  if(!button||!nav)return;
  const close=()=>{nav.classList.remove("open");button.setAttribute("aria-expanded","false");button.setAttribute("aria-label","Menü öffnen");};
  button.addEventListener("click",()=>{
    const open=nav.classList.toggle("open");
    button.setAttribute("aria-expanded",String(open));
    button.setAttribute("aria-label",open?"Menü schließen":"Menü öffnen");
  });
  nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",close));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&nav.classList.contains("open")){close();button.focus();}});
  window.addEventListener("resize",()=>{if(window.innerWidth>900&&nav.classList.contains("open"))close();});
  document.addEventListener("click",e=>{if(!nav.contains(e.target)&&!button.contains(e.target))close()});
});
