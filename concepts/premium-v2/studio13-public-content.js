/* Reviewed public preview content from the restricted CMS. Never render user HTML. */
(()=>{
 const allowed={"/":"hero_note","/kontakt/":"contact_note","/faq/":"faq_intro","/ueber-uns/":"about_note"};
 const key=allowed[location.pathname];
 if(!key||!/^deploy-preview-\d+--fotopolis-preview\.netlify\.app$/.test(location.hostname))return;
 document.addEventListener("DOMContentLoaded",async()=>{
  const note=document.querySelector("[data-studio13-content]");
  if(!note)return;
  try{
   const res=await fetch("/api/fotopolis/studio13/content",{cache:"no-store",credentials:"same-origin"});
   if(!res.ok)return;
   const data=await res.json();
   const value=data?.content?.[key];
   if(typeof value==="string"&&value.trim()){
    note.textContent=value.trim();
    note.hidden=false;
   }
  }catch{}
 });
})();
