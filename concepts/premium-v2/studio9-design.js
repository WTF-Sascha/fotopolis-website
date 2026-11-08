"use strict";
/* FOTOPOLIS Studio 9.0: same 32 approved layout IDs from the static collection.
   Only existing local images are shown; no visitor data is persisted here. */
document.addEventListener("DOMContentLoaded",()=>{
  const params=new URLSearchParams(location.search);
  const candidate=params.get("vorlage");
  const desired=/^FP-0(?:0[1-9]|[12][0-9]|3[0-2])$/.test(candidate||"")?candidate:"";
  const fromGallery=params.get("produkt");
  for(const root of document.querySelectorAll("[data-studio9-design-picker]")){
    const select=root.querySelector("[data-studio9-design-select]");
    const image=root.querySelector("[data-studio9-design-preview]");
    const summary=root.querySelector("[data-studio9-design-summary]");
    const link=root.querySelector("[data-studio9-design-gallery-link]");
    if(!select||!image||!summary||!link)continue;
    if(desired&&[...select.options].some(x=>x.value===desired))select.value=desired;
    const form=select.closest("form");
    const product=form?.querySelector('[name="produkt"]');
    const productType=()=>{
      const name=product?.value||fromGallery||"";
      return ["Fotobox","Fotospiegel","Fotowohnwagen"].includes(name)?name:"";
    };
    const update=()=>{
      const id=select.value;
      if(/^FP-0(?:0[1-9]|[12][0-9]|3[0-2])$/.test(id)){
        image.src="/assets/designvorlagen/"+id.toLowerCase()+".webp";
        image.alt="Ausgewählte Designvorlage "+id;
        image.hidden=false;
        summary.textContent="Dein ausgewähltes Design: "+select.selectedOptions[0].textContent;
      }else{
        image.hidden=true;
        image.removeAttribute("src");
        summary.textContent="Wähle ein Design – du kannst dich auch später entscheiden.";
      }
      const p=productType();
      const query=new URLSearchParams();
      if(p)query.set("produkt",p);
      link.href="/designvorlagen/"+(query.size?"?"+query.toString():"");
      form?.dispatchEvent(new Event("studio9-design-change"));
    };
    select.addEventListener("change",update);
    product?.addEventListener("change",update);
    update();
  }
});
