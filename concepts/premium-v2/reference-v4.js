"use strict";
/* Reference Edition 4.0: accessible product rail, truthful gallery filters,
   mobile navigation. No analytics, external calls or booking promises. */
document.addEventListener("DOMContentLoaded",()=>{
  const root=document.querySelector("[data-v4-product-rail]");
  if(root){
    const track=root.querySelector("[data-v4-track]");
    const items=[...track.querySelectorAll(".v4-product-card")];
    const prev=root.querySelector("[data-v4-prev]");
    const next=root.querySelector("[data-v4-next]");
    const count=root.querySelector("[data-v4-count]");
    const nearest=()=>{
      const x=track.scrollLeft;
      return items.reduce((best,item,i)=>Math.abs(item.offsetLeft-items[best].offsetLeft-x)<Math.abs(items[best].offsetLeft-items[best].offsetLeft-x)?i:best,0);
    };
    // On mobile the track is horizontally scrollable; on desktop it is a grid.
    const currentIndex=()=>{
      let best=0,dist=Infinity;
      items.forEach((item,i)=>{const d=Math.abs(item.getBoundingClientRect().left-track.getBoundingClientRect().left);if(d<dist){dist=d;best=i}});
      return best;
    };
    const sync=()=>{
      const index=currentIndex();
      if(count)count.textContent=(index+1)+" / "+items.length;
      if(prev)prev.disabled=index===0;
      if(next)next.disabled=index===items.length-1;
    };
    const move=direction=>{
      const i=Math.min(items.length-1,Math.max(0,currentIndex()+direction));
      items[i]?.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"nearest",inline:"start"});
    };
    prev?.addEventListener("click",()=>move(-1));
    next?.addEventListener("click",()=>move(1));
    track?.addEventListener("scroll",sync,{passive:true});
    window.addEventListener("resize",sync,{passive:true});
    sync();
  }
  const filters=[...document.querySelectorAll("[data-v4-gallery-filter]")];
  const gallery=[...document.querySelectorAll("[data-gallery-item][data-v4-product]")];
  if(filters.length&&gallery.length){
    filters.forEach(filter=>filter.addEventListener("click",()=>{
      const selected=filter.dataset.v4GalleryFilter;
      filters.forEach(f=>f.setAttribute("aria-pressed",String(f===filter)));
      gallery.forEach(item=>{item.hidden=selected!=="alle"&&item.dataset.v4Product!==selected});
    }));
  }
  // Non-promissory CTA: date selection happens in the existing enquiry flow.
  const path=location.pathname;
  const navItems=[
    {url:"/",label:"Start",icon:'<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>'},
    {url:"/#erlebnisse",label:"Produkte",icon:'<path d="m12 2 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 17l9 5 9-5"/>'},
    {url:"/kontakt/#contact-date",label:"Termin",icon:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M8 15h4"/>'},
    {url:"/galerie/",label:"Galerie",icon:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m21 16-5-5L5 21"/>'},
    {url:"/kontakt/",label:"Kontakt",icon:'<path d="M20.5 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.7 0-3.1-.4-4.3-1.1L3 21l1.7-4.8A8.5 8.5 0 1 1 20.5 11.5Z"/>'}
  ];
  const bar=document.createElement("nav");
  bar.className="v4-mobile-nav";
  bar.setAttribute("aria-label","Mobile Schnellnavigation");
  bar.innerHTML=navItems.map((item,i)=>'<a href="'+item.url+'"'+((path==="/"&&i===0)||(path.startsWith("/fotobox")&&i===1)||(path.startsWith("/fotospiegel")&&i===1)||(path.startsWith("/fotowohnwagen")&&i===1)||(path==="/galerie/"&&i===3)||(path==="/kontakt/"&&i===4&&location.hash!=="#contact-date")||(path==="/kontakt/"&&i===2&&location.hash==="#contact-date")?' aria-current="page"':"")+'><svg viewBox="0 0 24 24" aria-hidden="true">'+item.icon+'</svg><span>'+item.label+'</span></a>').join("");
  document.body.append(bar);
});
