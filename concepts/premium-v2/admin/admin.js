"use strict";
// Roadmap 7 Studio Demo. No fetch, DB, session storage, localStorage or secret.
document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, root=document) => root.querySelector(selector);
  const grid = $("[data-calendar-grid]");
  const period = $("[data-period]");
  const dayTitle = $("[data-selected-title]");
  const details = $("[data-day-details]");
  const demoCount = $("[data-demo-count]");
  const filter = $("[data-product-filter]");
  const dialog = $("[data-block-dialog]");
  const form = $("[data-block-form]");
  const error = $("[data-form-error]");
  const menu = $("[data-menu-toggle]");
  const mobile = $("#admin-mobile-menu");
  const TZ="Europe/Berlin";
  const labels={fotobox:"Fotobox",fotospiegel:"Fotospiegel",fotowohnwagen:"Fotowohnwagen"};
  const fmtDay=new Intl.DateTimeFormat("de-DE",{timeZone:TZ,day:"numeric",month:"long",year:"numeric"});
  const fmtMonth=new Intl.DateTimeFormat("de-DE",{month:"long",year:"numeric"});
  const today=new Date();
  let cursor=new Date(Date.UTC(today.getFullYear(),today.getMonth(),today.getDate(),12));
  let selected=toKey(cursor);
  let view="month";
  let entries=[];
  function toKey(d){return [d.getUTCFullYear(),String(d.getUTCMonth()+1).padStart(2,"0"),String(d.getUTCDate()).padStart(2,"0")].join("-")}
  function fromKey(key){const parts=key.split("-").map(Number);return new Date(Date.UTC(parts[0],parts[1]-1,parts[2],12))}
  function addDays(d,n){const x=new Date(d);x.setUTCDate(x.getUTCDate()+n);return x}
  function weekStart(d){return addDays(d,-((d.getUTCDay()+6)%7))}
  function html(str){return String(str).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]))}
  function filteredFor(key){return entries.filter(item=>item.day===key&&(filter.value==="all"||item.resource===filter.value))}
  function visibleDays(){
    if(view==="week"){const start=weekStart(cursor);return Array.from({length:7},(_,i)=>addDays(start,i))}
    const first=new Date(Date.UTC(cursor.getUTCFullYear(),cursor.getUTCMonth(),1,12));
    const start=weekStart(first);
    const final=new Date(Date.UTC(cursor.getUTCFullYear(),cursor.getUTCMonth()+1,0,12));
    const weeks=Math.ceil(((final-start)/86400000+1)/7);
    return Array.from({length:weeks*7},(_,i)=>addDays(start,i));
  }
  function renderDetails(){
    const day=fromKey(selected);
    dayTitle.textContent=fmtDay.format(day);
    const items=filteredFor(selected);
    details.replaceChildren();
    if(!items.length){const p=document.createElement("p");p.textContent="Für diesen Tag gibt es keine Demo-Einträge. Daraus lässt sich keine echte Verfügbarkeit ableiten.";details.append(p);return}
    const list=document.createElement("ul");list.className="detail-list";
    items.forEach(item=>{
      const li=document.createElement("li");
      const txt=document.createElement("span");
      const strong=document.createElement("strong");strong.textContent=labels[item.resource]+" · ";
      txt.append(strong,document.createTextNode(item.note));
      const remove=document.createElement("button");remove.type="button";remove.textContent="Entfernen";remove.setAttribute("aria-label","Demo-Sperrzeit "+item.note+" entfernen");
      remove.addEventListener("click",()=>{entries=entries.filter(x=>x.id!==item.id);render()});
      li.append(txt,remove);list.append(li);
    });details.append(list);
  }
  function render(){
    const days=visibleDays();
    const year=cursor.getUTCFullYear(),month=cursor.getUTCMonth();
    if(view==="month")period.textContent=fmtMonth.format(new Date(Date.UTC(year,month,1,12)));
    else period.textContent=fmtDay.format(days[0])+" – "+fmtDay.format(days[6]);
    grid.replaceChildren();
    days.forEach(date=>{
      const key=toKey(date),items=filteredFor(key);
      const cell=document.createElement("button");
      cell.type="button";cell.className="day";
      if(date.getUTCMonth()!==month&&view==="month")cell.classList.add("outside");
      if(key===selected)cell.classList.add("is-selected");
      if(key===toKey(new Date(Date.UTC(today.getFullYear(),today.getMonth(),today.getDate(),12))))cell.classList.add("is-today");
      cell.setAttribute("aria-pressed",String(key===selected));
      cell.setAttribute("aria-label",fmtDay.format(date)+(items.length?", "+items.length+" Demo-Sperrzeiten":""));
      const number=document.createElement("span");number.className="day-number";number.textContent=String(date.getUTCDate());cell.append(number);
      items.slice(0,2).forEach(item=>{const tag=document.createElement("span");tag.className="day-entry";tag.textContent=labels[item.resource]+": "+item.note;cell.append(tag)});
      if(items.length>2){const more=document.createElement("span");more.className="day-extra";more.textContent="+"+(items.length-2)+" weitere";cell.append(more)}
      cell.addEventListener("click",()=>{selected=key;render()});
      grid.append(cell);
    });
    demoCount.textContent=String(entries.length);
    renderDetails();
  }
  document.querySelectorAll("[data-view]").forEach(button=>button.addEventListener("click",()=>{
    view=button.dataset.view;
    document.querySelectorAll("[data-view]").forEach(b=>b.setAttribute("aria-pressed",String(b===button)));
    render();
  }));
  document.querySelectorAll("[data-nav]").forEach(button=>button.addEventListener("click",()=>{
    const action=button.dataset.nav;
    if(action==="today"){cursor=new Date(Date.UTC(today.getFullYear(),today.getMonth(),today.getDate(),12));selected=toKey(cursor)}
    else if(view==="week"){cursor=addDays(cursor,action==="next"?7:-7);selected=toKey(cursor)}
    else{cursor=new Date(Date.UTC(cursor.getUTCFullYear(),cursor.getUTCMonth()+(action==="next"?1:-1),1,12));selected=toKey(cursor)}
    render();
  }));
  filter.addEventListener("change",render);
  const noteInput=$('[name="note"]',form),dayInput=$('[name="day"]',form);
  function openDialog(){error.hidden=true;error.textContent="";form.reset();dayInput.value=selected;filter.value!=="all"&&(form.elements.resource.value=filter.value);dialog.showModal();noteInput.focus()}
  document.querySelectorAll("[data-open-block]").forEach(btn=>btn.addEventListener("click",openDialog));
  document.querySelectorAll("[data-close-dialog]").forEach(btn=>btn.addEventListener("click",()=>dialog.close()));
  dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close()});
  form.addEventListener("submit",e=>{
    e.preventDefault();error.hidden=true;
    const key=dayInput.value;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(key)||toKey(fromKey(key))!==key||!labels[form.elements.resource.value]||!noteInput.value.trim()){
      error.textContent="Bitte ein gültiges Datum, ein Fotoerlebnis und eine Notiz eingeben.";error.hidden=false;return;
    }
    entries.push({id:Date.now()+"-"+Math.random().toString(36).slice(2),day:key,resource:form.elements.resource.value,note:noteInput.value.trim().slice(0,100)});
    cursor=fromKey(key);selected=key;dialog.close();render();
  });
  if(menu&&mobile){
    menu.addEventListener("click",()=>{const expanded=menu.getAttribute("aria-expanded")==="true";menu.setAttribute("aria-expanded",String(!expanded));menu.setAttribute("aria-label",expanded?"Navigation öffnen":"Navigation schließen");mobile.hidden=expanded});
    mobile.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{mobile.hidden=true;menu.setAttribute("aria-expanded","false")}));
  }
  render();
});
