// FOTOPOLIS Studio 3.7 inventory drafting interface.
// No persistence: drafts exist only in memory for the current page lifetime.
export const allowedTypes=Object.freeze({
  fotobox:"Fotobox",
  fotospiegel:"Fotospiegel",
  fotowohnwagen:"Fotowohnwagen"
});
export function validateInventoryDraft(candidate,known=[]){
  const type=String(candidate.type||"");
  const code=String(candidate.code||"").trim().toUpperCase();
  const name=String(candidate.name||"").trim();
  if(!Object.hasOwn(allowedTypes,type))return {error:"Bitte eine gültige Produktart wählen."};
  if(!/^[A-Z0-9][A-Z0-9_-]{2,59}$/.test(code))return {error:"Gerätekennung: 3–60 Zeichen, nur Buchstaben, Zahlen, Unterstrich oder Bindestrich."};
  if(name.length<2||name.length>100)return {error:"Der Gerätename muss zwischen 2 und 100 Zeichen lang sein."};
  if(known.some(entry=>String(entry.resource_code||entry.code||"").trim().toUpperCase()===code)){
    return {error:"Diese Gerätekennung wird bereits verwendet."};
  }
  return {value:{type,code,name}};
}
function el(tag,css,text){
  const element=document.createElement(tag);
  if(css)element.className=css;
  if(text!==undefined)element.textContent=text;
  return element;
}
export function setupInventoryManager({root,getResources}){
  if(!root)throw Error("Missing inventory editor root");
  const drafts=[];
  const lead=el("p","inventory-manager-lead","Geräte als lokale Entwürfe vorbereiten. Es wird noch nichts in Neon gespeichert oder zur Buchung freigegeben.");
  const actions=el("div","inventory-manager-actions");
  const newButton=el("button","inventory-manager-primary","+ Gerät vorbereiten");
  newButton.type="button";
  const status=el("span","inventory-manager-state","ENTWURF · NICHT GESPEICHERT");
  actions.append(newButton,status);
  const draftList=el("div","inventory-manager-list");
  draftList.setAttribute("aria-live","polite");
  const form=el("form","inventory-manager-form");
  form.noValidate=true;form.hidden=true;
  const title=el("h3",null,"Gerät als Entwurf anlegen");
  const intro=el("p","inventory-manager-explainer","Jede Kennung steht für ein eigenständiges physisches Mietgerät.");
  function field(id,labelText,control){
    const label=el("label",null,labelText);
    label.htmlFor=id;control.id=id;label.append(control);
    return label;
  }
  const type=document.createElement("select");
  type.required=true;
  for(const [value,label] of Object.entries(allowedTypes)){
    const option=el("option",null,label);option.value=value;type.append(option);
  }
  const code=document.createElement("input");
  code.type="text";code.autocomplete="off";code.required=true;code.maxLength=60;
  code.placeholder="Beispiel: BOX-001";
  const name=document.createElement("input");
  name.type="text";name.autocomplete="off";name.required=true;name.maxLength=100;
  name.placeholder="Beispiel: Fotobox Event";
  const feedback=el("p","inventory-manager-feedback","");
  feedback.setAttribute("role","status");
  const formActions=el("div","inventory-manager-form-actions");
  const submit=el("button","inventory-manager-primary","Entwurf übernehmen");
  submit.type="submit";
  const cancel=el("button","inventory-manager-secondary","Abbrechen");
  cancel.type="button";
  formActions.append(submit,cancel);
  form.append(title,intro,field("inventory-type","Produktart",type),
    field("inventory-code","Interne Gerätekennung",code),
    field("inventory-name","Gerätename",name),
    feedback,formActions,
    el("p","inventory-manager-explainer","Beim Neuladen verschwinden sämtliche Entwürfe. Keine Buchungen, keine Datenbankänderungen."));
  root.replaceChildren(lead,actions,draftList,form);
  function render(){
    draftList.replaceChildren();
    if(!drafts.length)return;
    const heading=el("h3","inventory-manager-drafts-title",`Entwürfe (${drafts.length})`);
    draftList.append(heading);
    for(const item of drafts){
      const row=el("div","inventory-manager-draft");
      const details=el("div");
      details.append(el("strong",null,item.name),el("p",null,`${allowedTypes[item.type]} · ${item.code} · Nur Vorschau`));
      const remove=el("button","inventory-manager-secondary","Verwerfen");
      remove.type="button";
      remove.setAttribute("aria-label",`Entwurf ${item.code} verwerfen`);
      remove.addEventListener("click",()=>{
        const index=drafts.indexOf(item);
        if(index>=0)drafts.splice(index,1);
        render();
      });
      row.append(details,remove);
      draftList.append(row);
    }
  }
  newButton.addEventListener("click",()=>{
    feedback.textContent="";
    form.reset();form.hidden=false;
    form.scrollIntoView({block:"nearest",behavior:"smooth"});
    type.focus();
  });
  cancel.addEventListener("click",()=>{form.hidden=true;feedback.textContent="";newButton.focus();});
  form.addEventListener("submit",event=>{
    event.preventDefault();
    const result=validateInventoryDraft({
      type:type.value,code:code.value,name:name.value
    },[...getResources(),...drafts]);
    if(result.error){feedback.textContent=result.error;return}
    if(drafts.length>=20){feedback.textContent="Maximal 20 gleichzeitige Vorschauentwürfe.";return}
    drafts.push(result.value);
    render();
    form.hidden=true;
    newButton.focus();
  });
  return {refresh:render,getDraftCount:()=>drafts.length};
}
