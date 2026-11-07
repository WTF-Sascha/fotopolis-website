"use strict";
document.addEventListener("DOMContentLoaded",()=>{
  const button=document.querySelector("[data-menu-toggle]");
  const nav=document.getElementById("mainnav");
  const groups=[...document.querySelectorAll("[data-nav-group]")];
  if(!button||!nav)return;

  const closeSubmenus=(except=null)=>{
    for(const group of groups){
      if(group===except)continue;
      group.classList.remove("is-expanded");
      group.querySelector(".nav-trigger")?.setAttribute("aria-expanded","false");
    }
  };
  const closeMenu=()=>{
    document.body.classList.remove("menu-open");
    nav.classList.remove("open");
    button.setAttribute("aria-expanded","false");
    button.setAttribute("aria-label","Menü öffnen");
    closeSubmenus();
  };
  button.addEventListener("click",()=>{
    const open=nav.classList.toggle("open");
    document.body.classList.toggle("menu-open",open);
    button.setAttribute("aria-expanded",String(open));
    button.setAttribute("aria-label",open?"Menü schließen":"Menü öffnen");
    if(!open)closeSubmenus();
  });

  groups.forEach(group=>{
    const trigger=group.querySelector(".nav-trigger");
    const panel=group.querySelector(".nav-panel");
    if(!trigger||!panel)return;
    trigger.addEventListener("click",()=>{
      const open=trigger.getAttribute("aria-expanded")!=="true";
      closeSubmenus(group);
      group.classList.toggle("is-expanded",open);
      trigger.setAttribute("aria-expanded",String(open));
    });
    group.addEventListener("focusout",event=>{
      if(!group.contains(event.relatedTarget)){
        group.classList.remove("is-expanded");
        trigger.setAttribute("aria-expanded","false");
      }
    });
  });
  // Expose the actual location to assistive technology on all 12 routes.
  nav.querySelectorAll('a[href^="/"]').forEach(link => {
    if (link.hash) return;
    if (new URL(link.href).pathname === location.pathname) {
      link.setAttribute("aria-current", "page");
    }
  });
  nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",closeMenu));
  document.addEventListener("keydown",event=>{
    if(event.key!=="Escape")return;
    const openGroup=groups.find(g=>g.classList.contains("is-expanded"));
    if(openGroup){
      closeSubmenus();
      openGroup.querySelector(".nav-trigger")?.focus();
      event.stopPropagation();
    } else if(nav.classList.contains("open")){
      closeMenu();
      button.focus();
    }
  });
  document.addEventListener("click",event=>{
    if(!nav.contains(event.target)&&!button.contains(event.target))closeMenu();
  });
  window.addEventListener("resize",()=>{
    if(window.innerWidth>1100&&nav.classList.contains("open"))closeMenu();
  });
});
