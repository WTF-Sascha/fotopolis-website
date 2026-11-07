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
export function setupInventoryManager({root,getResources,onChange,createResource,updateResource,canActivate=false}){
  if(!root)throw Error("Missing inventory editor root");
  const drafts=[];
  const persistent=typeof createResource==="function";
  const lead=el("p","inventory-manager-lead",persistent?"Lege deine Mietgeräte einzeln an. Neue Geräte bleiben zunächst deaktiviert und können anschließend für die interne Disposition freigegeben werden.":"Du kannst Geräte zunächst lokal planen. Einträge werden erst nach erfolgreichem Speichern übernommen.");
  const actions=el("div","inventory-manager-actions");
  const newButton=el("button","inventory-manager-primary",persistent?"+ Mietgerät anlegen":"+ Gerät vorbereiten");
  newButton.type="button";
  const status=el("span","inventory-manager-state",persistent?"GESCHÜTZTE GERÄTEVERWALTUNG":"ENTWURF · NICHT GESPEICHERT");
  actions.append(newButton,status);
  const operationStatus=el("p","inventory-manager-feedback","");
  operationStatus.setAttribute("role","status");operationStatus.setAttribute("aria-live","polite");
  const draftList=el("div","inventory-manager-list");
  draftList.setAttribute("aria-live","polite");
  const form=el("form","inventory-manager-form");
  form.noValidate=true;form.hidden=true;
  const title=el("h3",null,persistent?"Neues Mietgerät anlegen":"Gerät als Entwurf anlegen");
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
  const submit=el("button","inventory-manager-primary",persistent?"Gerät sicher speichern":"Entwurf übernehmen");
  submit.type="submit";
  const cancel=el("button","inventory-manager-secondary","Abbrechen");
  cancel.type="button";
  formActions.append(submit,cancel);
  form.append(title,intro,field("inventory-type","Produktart",type),
    field("inventory-code","Interne Gerätekennung",code),
    field("inventory-name","Gerätename",name),
    feedback,formActions,
    el("p","inventory-manager-explainer",persistent?"Das neue Gerät wird dauerhaft gespeichert und zunächst als deaktiviert geführt.":"Beim Neuladen verschwinden sämtliche Entwürfe. Keine Buchungen, keine Datenbankänderungen."));
  const editor=el("div","inventory-manager-saved-editor");
  root.replaceChildren(lead,actions,operationStatus,editor,draftList,form);
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
        render();onChange?.();
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
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    const result=validateInventoryDraft({
      type:type.value,code:code.value,name:name.value
    },[...getResources(),...drafts]);
    if(result.error){feedback.textContent=result.error;return}
    if(persistent){
      submit.disabled=true;feedback.textContent="Gerät wird gespeichert …";
      try{
        await createResource(result.value);
        feedback.textContent="";operationStatus.textContent="Gerät dauerhaft gespeichert. Es ist bis zur Aktivierung nicht buchbar.";
        form.hidden=true;onChange?.();newButton.focus();
      }catch(err){feedback.textContent=err?.message||"Das Gerät konnte nicht gespeichert werden.";}
      finally{submit.disabled=false;}
      return;
    }
    if(drafts.length>=20){feedback.textContent="Maximal 20 gleichzeitige Vorschauentwürfe.";return}
    drafts.push(result.value);
    render();onChange?.();
    form.hidden=true;
    newButton.focus();
  });
  function editSaved(device){
    if(typeof updateResource!=="function")return;
    editor.replaceChildren();
    const panel=el("form","inventory-manager-form");
    panel.noValidate=true;
    const heading=el("h3",null,"Mietgerät bearbeiten · "+device.resource_code);
    const nameLabel=el("label",null,"Gerätename");
    const rename=document.createElement("input");rename.type="text";rename.maxLength=100;
    rename.value=device.display_name;rename.required=true;
    nameLabel.append(rename);
    const statusLabel=el("label","inventory-manager-toggle-label","Aktiv für interne Disposition");
    const activation=document.createElement("input");activation.type="checkbox";activation.checked=device.enabled;
    activation.disabled=!canActivate;
    statusLabel.prepend(activation);
    if(!canActivate)statusLabel.append(el("small",null,"Nur Hauptadministratoren dürfen den Aktivierungsstatus ändern."));
    const note=el("p","inventory-manager-explainer","Änderungen werden im Admin-Protokoll erfasst. Eine Aktivierung öffnet noch keine öffentliche Kundenbuchung.");
    const warn=el("p","inventory-manager-feedback","");warn.setAttribute("role","status");
    const controls=el("div","inventory-manager-form-actions");
    const save=el("button","inventory-manager-primary","Änderungen speichern");save.type="submit";
    const cancel=el("button","inventory-manager-secondary","Schließen");cancel.type="button";
    controls.append(save,cancel);
    panel.append(heading,nameLabel,statusLabel,note,warn,controls);
    editor.append(panel);editor.scrollIntoView({block:"nearest",behavior:"smooth"});
    cancel.addEventListener("click",()=>editor.replaceChildren());
    panel.addEventListener("submit",async event=>{
      event.preventDefault();
      const name=rename.value.trim();
      if(name.length<2||name.length>100){warn.textContent="Gerätename: 2–100 Zeichen erforderlich.";return}
      const patch={id:device.id};
      if(name!==device.display_name)patch.name=name;
      if(canActivate&&activation.checked!==device.enabled){
        if(activation.checked&&!window.confirm("Gerät '"+device.resource_code+"' für die interne Disposition aktivieren? Es wird dadurch noch nicht öffentlich buchbar."))return;
        patch.enabled=activation.checked;
      }
      if(Object.keys(patch).length===1){warn.textContent="Keine Änderungen vorhanden.";return}
      save.disabled=true;warn.textContent="Änderungen werden geprüft und gespeichert …";
      try{
        await updateResource(patch);
        operationStatus.textContent="Änderungen gespeichert und protokolliert.";
        editor.replaceChildren();onChange?.();
      }catch(err){warn.textContent=err?.message||"Die Änderung konnte nicht gespeichert werden.";}
      finally{save.disabled=false}
    });
    rename.focus();
  }
  return {refresh:render,getDraftCount:()=>drafts.length,getDrafts:()=>drafts.map(x=>({...x})),editSaved};
}
