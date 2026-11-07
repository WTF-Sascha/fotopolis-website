"use strict";
/* FOTOPOLIS Studio Signature 5.0: progressive UX polish.
   Works with the existing tested nav, inquiry, gallery and carousel scripts. */
document.addEventListener("DOMContentLoaded",()=>{
  const header=document.querySelector("[data-studio-header]");
  if(header){
    const sync=()=>header.classList.toggle("is-scrolled",window.scrollY>18);
    sync();
    window.addEventListener("scroll",sync,{passive:true});
  }

  // Treat the product showcase as an accessible native horizontal carousel.
  const track=document.querySelector("[data-v4-track]");
  if(track){
    track.tabIndex=0;
    track.setAttribute("role","region");
    track.setAttribute("aria-roledescription","Karussell");
    track.setAttribute("aria-label","Unsere Fotoerlebnisse: Fotobox, Foto Mirror und Fotowohnwagen");
    const items=[...track.querySelectorAll(".v4-product-card")];
    items.forEach((item,index)=>item.setAttribute("aria-posinset",String(index+1)));
    items.forEach(item=>item.setAttribute("aria-setsize",String(items.length)));
    track.addEventListener("keydown",event=>{
      if(event.key!=="ArrowRight"&&event.key!=="ArrowLeft")return;
      if(window.matchMedia("(min-width: 761px)").matches)return;
      event.preventDefault();
      const origin=track.getBoundingClientRect().left;
      let nearest=0,dist=Infinity;
      items.forEach((item,index)=>{
        const d=Math.abs(item.getBoundingClientRect().left-origin);
        if(d<dist){dist=d;nearest=index}
      });
      const step=event.key==="ArrowRight"?1:-1;
      const destination=Math.max(0,Math.min(items.length-1,nearest+step));
      const x=items[destination].offsetLeft-items[0].offsetLeft;
      track.scrollTo({left:x,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
    });
  }

  // Distinctive active-state marker for the enclosing product menu on subpages.
  const current=location.pathname;
  if(/^\/(fotobox|fotospiegel|fotowohnwagen)\/$/.test(current)){
    const productTrigger=document.querySelector('[aria-controls="nav-erlebnisse"]');
    productTrigger?.classList.add("studio-current-section");
  }
});
