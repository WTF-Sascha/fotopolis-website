"use strict";
/* FOTOPOLIS Studio 12.0 — LOCAL-ONLY Design-to-Print.
   No remote images, analytics, network photo upload, persistence or automatic booking.
   1772x1181 photo compositing using exactly the print overlay's original source windows. */
(() => {
  const host=document.querySelector("[data-fp12-editor]");
  if(!host)return;
  const W=1772,H=1181,PRINT_DPI=300,MAX_IMAGE_BYTES=16*1024*1024;
  const q=(selector)=>host.querySelector(selector);
  const canvas=q("[data-fp12-canvas]"),ctx=canvas.getContext("2d",{alpha:false});
  const selector=q("[data-fp12-template]"),product=q("[data-fp12-product]");
  const photoInput=q("[data-fp12-photo]"),slots=q("[data-fp12-slotlist]");
  const zoom=q("[data-fp12-zoom]"),zoomLabel=q("[data-fp12-zoom-label]");
  const caption=q("[data-fp12-caption]"),download=q("[data-fp12-download]");
  const go=q("[data-fp12-request]"),resolution=q("[data-fp12-resolution]");
  const completeness=q("[data-fp12-completeness]"),status=q("[data-fp12-status]");
  const center=q("[data-fp12-center]"),remove=q("[data-fp12-remove]");
  const supportedTypes=new Set(["image/jpeg","image/png","image/webp"]);
  let catalogue=[],current=null,overlay=null,photos=[],selected=0;
  let drag=null,version=0,paintPending=false,exporting=false;

  function say(message){status.textContent=message;}
  function guardedID(value){return /^FP-0(?:[0-3]\d|4[0-4])$/.test(value||"")?value:"";}
  function getSlot(i){return current?.photoRegions?.[i]||null;}
  function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
  function fit(photo,rect){
    const w=rect[2]-rect[0],h=rect[3]-rect[1];
    const base=Math.max(w/photo.image.naturalWidth,h/photo.image.naturalHeight);
    const scale=base*photo.zoom;
    const dw=photo.image.naturalWidth*scale,dh=photo.image.naturalHeight*scale;
    const maxX=Math.max(0,(dw-w)/2),maxY=Math.max(0,(dh-h)/2);
    photo.dx=clamp(photo.dx,-maxX,maxX);photo.dy=clamp(photo.dy,-maxY,maxY);
    return {dw,dh,scale,upscale:scale>1.05};
  }
  function roundedRect(x,y,w,h,r){
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);
  }
  function imageCover(photo,rect){
    const [l,t,r,b]=rect;
    const {dw,dh}=fit(photo,rect);
    ctx.save();
    ctx.beginPath();ctx.rect(l,t,r-l,b-t);ctx.clip();
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";
    ctx.drawImage(photo.image,(l+r-dw)/2+photo.dx,(t+b-dh)/2+photo.dy,dw,dh);
    ctx.restore();
  }
  function placeholder(rect,index){
    const [l,t,r,b]=rect;
    ctx.fillStyle="#e7ddd0";ctx.fillRect(l,t,r-l,b-t);
    ctx.save();
    ctx.beginPath();ctx.rect(l,t,r-l,b-t);ctx.clip();
    ctx.strokeStyle="#c5b59b";ctx.lineWidth=2;
    for(let x=l-500;x<r+300;x+=130){
      ctx.beginPath();ctx.moveTo(x,t);ctx.lineTo(x+(b-t),b);ctx.stroke();
    }
    ctx.fillStyle="#5b4c3d";ctx.font="600 34px sans-serif";
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillText("FOTO "+(index+1),(l+r)/2,(t+b)/2,Math.max(60,r-l-25));
    ctx.restore();
  }
  function personalise(){
    const label=caption.value.trim();
    if(!label)return;
    ctx.save();
    ctx.font="600 35px system-ui,sans-serif";
    let text=label;
    const maxWidth=920;
    while(ctx.measureText(text).width>maxWidth&&text.length>4)text=text.slice(0,-2)+"…";
    const measured=Math.min(maxWidth,ctx.measureText(text).width);
    const px=75,py=H-87,pw=Math.max(220,measured+64),ph=58;
    ctx.fillStyle="rgba(39,29,21,.93)";
    roundedRect(px,py,pw,ph,7);ctx.fill();
    ctx.lineWidth=2;ctx.strokeStyle="#bc965f";ctx.stroke();
    ctx.fillStyle="#fff3e5";ctx.textAlign="left";ctx.textBaseline="middle";
    ctx.fillText(text,px+30,py+ph/2,maxWidth);
    ctx.restore();
  }
  function draw(preview=true){
    if(!current||!overlay)return;
    ctx.save();
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle="#e9dfd3";ctx.fillRect(0,0,W,H);
    current.photoRegions.forEach((rect,index)=>{
      const photo=photos[index];
      if(photo?.image)imageCover(photo,rect);
      else if(preview)placeholder(rect,index);
    });
    // The approved source overlay contains the genuine FOTOPOLIS master mark.
    // No brand graphics or old logos are ever generated within this editor.
    ctx.drawImage(overlay,0,0,W,H);
    personalise();
    if(preview){
      const rect=getSlot(selected);
      if(rect){
        ctx.strokeStyle="#e7b974";ctx.lineWidth=8;
        ctx.strokeRect(rect[0]+4,rect[1]+4,rect[2]-rect[0]-8,rect[3]-rect[1]-8);
      }
    }
    ctx.restore();
  }
  function paint(){if(paintPending)return;paintPending=true;requestAnimationFrame(()=>{paintPending=false;draw(true);});}
  function refresh(){
    const has=!!current;
    const chosen=photos[selected];
    zoom.disabled=!chosen?.image;
    center.disabled=!chosen?.image;
    remove.disabled=!chosen?.image;
    zoom.value=String(Math.round((chosen?.zoom||1)*100));
    zoomLabel.textContent=zoom.value+" %";
    slots.replaceChildren();
    if(has)current.photoRegions.forEach((rect,index)=>{
      const control=document.createElement("button");
      control.type="button";control.className="fp12-slot";
      control.dataset.slot=String(index);control.dataset.fp12Slot=String(index);
      control.setAttribute("aria-pressed",String(index===selected));
      const header=document.createElement("strong");header.textContent="Foto "+(index+1);
      const descr=document.createElement("small");
      descr.textContent=photos[index]?.image?"Bild eingefügt":"Bild fehlt";
      control.append(header,descr);
      control.addEventListener("click",()=>select(index));
      slots.append(control);
    });
    const filled=photos.filter(p=>p?.image).length;
    const required=current?.photoRegions.length||0;
    completeness.textContent=required?
      filled+"/"+required+" Fotofelder gefüllt"+(filled===required?" · Export bereit":" · weitere Fotos ergänzen"):
      "Vorlage auswählen, um loszulegen.";
    download.disabled=!required||filled!==required||exporting;
    const low=photos.flatMap((p,i)=>{
      if(!p?.image)return [];
      const r=current.photoRegions[i];return fit(p,r).upscale?[i+1]:[];
    });
    resolution.textContent=low.length?
      "Qualitätshinweis: Foto "+low.join(", ")+" wird für den 300-DPI-Druck vergrößert. Ein Bild in höherer Auflösung wäre besser.":
      "Bildauflösung: "+(filled? "Die geladenen Fotos können ohne starke Hochskalierung platziert werden. ":"Noch keine Fotos eingesetzt. ")+"Die Bilddateien verlassen den Browser nicht.";
  }
  function select(i){
    if(!current||!getSlot(i))return;
    selected=i;photoInput.value="";refresh();paint();
  }
  async function loadImage(url){
    return new Promise((resolve,reject)=>{
      const img=new Image();
      img.onload=()=>resolve(img);
      img.onerror=()=>reject(new Error("Das Bild konnte nicht dekodiert werden."));
      img.src=url;
    });
  }
  async function loadTemplate(id){
    const item=catalogue.find(x=>x.id===id);
    if(!item||!Array.isArray(item.photoRegions)||item.photoRegions.length!==item.photos){
      say("Die Vorlage hat keine gültigen Fotofelder.");return;
    }
    const job=++version;
    say("Vorlage wird geladen …");
    const filepath=item.printOverlay;
    if(!/^\/assets\/designvorlagen\/print\/fp-0\d{2}\.png$/.test(filepath||"")){say("Ungültiger Vorlagenpfad.");return;}
    try{
      const result=await loadImage(filepath);
      if(job!==version)return;
      if(result.naturalWidth!==W||result.naturalHeight!==H)
        throw new Error("Druckoverlay hat falsche Maße");
      current=item;overlay=result;photos=item.photoRegions.map(()=>({image:null,zoom:1,dx:0,dy:0}));
      selected=0;selector.value=id;
      q("[data-fp12-layout]").textContent=
        item.collection==="classics"?"FOTOPOLIS Classics · "+item.photos+" Foto"+(item.photos===1?"":"s")+" · 15 × 10 cm":
        "Signature · "+item.photos+" Foto"+(item.photos===1?"":"s")+" · 15 × 10 cm";
      refresh();paint();
      say("Vorlage "+item.id+" – "+item.name+" geladen. Wähle ein Fotofeld und füge ein Bild ein.");
    }catch(error){if(job===version)say("Vorlage konnte nicht geöffnet werden: "+error.message);}
  }
  async function filePicked(){
    const file=photoInput.files?.[0];
    if(!file||!current)return;
    if(!supportedTypes.has(file.type)){say("Bitte nur JPG, PNG oder WebP verwenden.");photoInput.value="";return;}
    if(file.size>MAX_IMAGE_BYTES){say("Das Bild ist größer als 16 MB. Bitte wähle eine kleinere Datei.");photoInput.value="";return;}
    const index=selected,job=version;
    const url=URL.createObjectURL(file);
    try{
      const image=await loadImage(url);
      if(job!==version||index>=photos.length)return;
      if(image.naturalWidth<64||image.naturalHeight<64)throw new Error("Bildauflösung zu gering.");
      if(image.naturalWidth>10000||image.naturalHeight>10000||image.naturalWidth*image.naturalHeight>30000000)
        throw new Error("Bild hat zu viele Pixel. Bitte auf maximal 30 Megapixel verkleinern.");
      photos[index]={image,dx:0,dy:0,zoom:1};
      say("Foto "+(index+1)+" geladen. Verschiebe es in der Vorschau oder passe den Zoom an.");
      refresh();paint();
    }catch(error){say("Bildimport fehlgeschlagen: "+error.message);}
    finally{URL.revokeObjectURL(url);photoInput.value="";}
  }
  function pickPoint(event){
    const r=canvas.getBoundingClientRect();
    return {x:(event.clientX-r.left)*W/r.width,y:(event.clientY-r.top)*H/r.height};
  }
  function nudge(direction){
    const p=photos[selected];if(!p?.image)return;
    const step=30;
    if(direction==="left")p.dx-=step;
    if(direction==="right")p.dx+=step;
    if(direction==="up")p.dy-=step;
    if(direction==="down")p.dy+=step;
    fit(p,getSlot(selected));refreshResolutionOnly();paint();
  }
  host.querySelectorAll("[data-fp12-nudge]").forEach(button=>
    button.addEventListener("click",()=>nudge(button.dataset.fp12Nudge))
  );
  canvas.addEventListener("keydown",event=>{
    const key={"ArrowLeft":"left","ArrowRight":"right","ArrowUp":"up","ArrowDown":"down"}[event.key];
    if(!key)return;
    event.preventDefault();nudge(key);
  });
  canvas.addEventListener("pointerdown",event=>{
    if(!current||event.button>0)return;
    const p=pickPoint(event);
    const i=current.photoRegions.findIndex(r=>p.x>=r[0]&&p.x<=r[2]&&p.y>=r[1]&&p.y<=r[3]);
    if(i<0)return;
    select(i);
    if(!photos[i]?.image)return;
    drag={id:event.pointerId,slot:i,x:p.x,y:p.y,dx:photos[i].dx,dy:photos[i].dy};
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove",event=>{
    if(!drag||drag.id!==event.pointerId||!current)return;
    const p=pickPoint(event),photo=photos[drag.slot];
    if(!photo?.image)return;
    photo.dx=drag.dx+(p.x-drag.x);photo.dy=drag.dy+(p.y-drag.y);
    fit(photo,getSlot(drag.slot));refreshResolutionOnly();paint();
  });
  const endDrag=event=>{if(drag?.id===event.pointerId)drag=null;};
  canvas.addEventListener("pointerup",endDrag);
  canvas.addEventListener("pointercancel",endDrag);
  function refreshResolutionOnly(){
    const lows=photos.flatMap((p,i)=>(p?.image&&fit(p,current.photoRegions[i]).upscale)?[i+1]:[]);
    resolution.textContent=lows.length?
      "Qualitätshinweis: Foto "+lows.join(", ")+" muss hochskaliert werden. Größere Bilder liefern bessere Druckergebnisse.":
      "Deine Fotos werden lokal verarbeitet und nicht an FOTOPOLIS hochgeladen.";
  }
  zoom.addEventListener("input",()=>{
    const p=photos[selected];if(!p?.image)return;
    p.zoom=Number(zoom.value)/100;fit(p,getSlot(selected));
    zoomLabel.textContent=zoom.value+" %";refreshResolutionOnly();paint();
  });
  center.addEventListener("click",()=>{const p=photos[selected];if(!p?.image)return;p.dx=p.dy=0;paint();});
  remove.addEventListener("click",()=>{if(!photos[selected]?.image)return;photos[selected]={image:null,zoom:1,dx:0,dy:0};refresh();paint();});
  photoInput.addEventListener("change",filePicked);
  caption.addEventListener("input",paint);
  selector.addEventListener("change",()=>loadTemplate(selector.value));
  function pngCRC(bytes){
    let crc=0xffffffff;
    for(const value of bytes){
      crc^=value;
      for(let j=0;j<8;j++)crc=(crc&1)?(crc>>>1)^0xedb88320:crc>>>1;
    }
    return (crc^0xffffffff)>>>0;
  }
  function printPng300dpi(bytes){
    // PNG pHYs chunk: 11,811 pixels per metre => ~300 pixels per inch.
    const signature=[137,80,78,71,13,10,26,10];
    if(bytes.length<45||signature.some((b,i)=>b!==bytes[i])||
       String.fromCharCode(...bytes.slice(12,16))!=="IHDR")
      throw new Error("Ungültige PNG-Datei");
    const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
    if(view.getUint32(16)!==W||view.getUint32(20)!==H)
      throw new Error("PNG-Größe entspricht nicht dem Druckformat");
    // Browsers usually produce canvas PNGs at 96 dpi, including pHYs.
    // Remove any existing pHYs and insert precisely one 300-dpi chunk.
    const parts=[],chunk=new Uint8Array(21),meta=new DataView(chunk.buffer);
    meta.setUint32(0,9);chunk.set([112,72,89,115],4);
    meta.setUint32(8,11811);meta.setUint32(12,11811);chunk[16]=1;
    meta.setUint32(17,pngCRC(chunk.subarray(4,17)));
    parts.push(bytes.subarray(0,33));parts.push(chunk);
    let offset=33;
    while(offset+12<=bytes.length){
      const len=view.getUint32(offset);
      const end=offset+len+12;
      if(end>bytes.length)throw new Error("PNG-Struktur fehlerhaft");
      const name=String.fromCharCode(...bytes.subarray(offset+4,offset+8));
      if(name!=="pHYs")parts.push(bytes.subarray(offset,end));
      offset=end;
      if(name==="IEND")break;
    }
    if(offset!==bytes.length)throw new Error("PNG-Struktur unvollständig");
    return new Blob(parts,{type:"image/png"});
  }
  download.addEventListener("click",async()=>{
    if(exporting||!current||!photos.every(p=>p?.image))return;
    exporting=true;download.disabled=true;say("Druckdatei wird lokal erstellt …");
    try{
      draw(false);
      const blob=await new Promise((resolve,reject)=>{
        canvas.toBlob(b=>b?resolve(b):reject(new Error("Canvas konnte nicht exportiert werden")),"image/png");
      });
      const png=printPng300dpi(new Uint8Array(await blob.arrayBuffer()));
      const name=current.id+"-FOTOPOLIS-15x10cm-300dpi.png";
      const url=URL.createObjectURL(png);
      const a=document.createElement("a");a.href=url;a.download=name;
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),10000);
      say("Druckdatei "+name+" wurde zum Download bereitgestellt. Bitte Beschnitt und Druckerprofil vor dem produktiven Druck prüfen.");
    }catch(error){say("Export nicht möglich: "+error.message);}
    finally{exporting=false;refresh();paint();}
  });
  go.addEventListener("click",()=>{
    if(!current)return;
    // No images, bytes, object URLs or base64 cross this boundary.
    const payload={id:current.id,product:product.value,caption:caption.value.trim().slice(0,65),created:Date.now(),photosComplete:photos.filter(p=>p?.image).length===photos.length};
    try{sessionStorage.setItem("fp12-request",JSON.stringify(payload));}
    catch(error){say("Die Gestaltungsauswahl wird per Link übernommen; private Zusatzangaben bitte im Anfrageformular eintragen.");}
    location.assign("/kontakt/?"+new URLSearchParams({vorlage:current.id,produkt:product.value}).toString());
  });
  async function init(){
    try{
      const result=await fetch("/assets/design-gallery-data.json",{cache:"no-store",credentials:"same-origin"});
      if(!result.ok)throw new Error("Vorlagenliste nicht erreichbar");
      const data=await result.json();
      if(!Array.isArray(data)||data.length!==44)throw new Error("44 Vorlagen fehlen");
      catalogue=data.filter(x=>guardedID(x.id)&&x.pixelWidth===W&&x.pixelHeight===H&&x.dpi===PRINT_DPI&&Array.isArray(x.photoRegions));
      if(catalogue.length!==44)throw new Error("Druckdaten nicht vollständig");
      selector.replaceChildren();
      for(const item of catalogue){
        const option=document.createElement("option");option.value=item.id;
        option.textContent=item.id+" · "+item.name+" ("+(item.collection==="classics"?"Classic":"Signature")+")";
        selector.appendChild(option);
      }
      const query=new URLSearchParams(location.search);
      const selected=guardedID(query.get("vorlage"));
      const p=query.get("produkt");
      if(["Fotobox","Fotospiegel","Fotowohnwagen"].includes(p))product.value=p;
      await loadTemplate(selected&&catalogue.some(x=>x.id===selected)?selected:"FP-001");
    }catch(error){
      selector.replaceChildren();
      const opt=document.createElement("option");opt.value="";opt.textContent="Vorlagen nicht verfügbar";selector.append(opt);
      say("Der Editor konnte nicht gestartet werden: "+error.message);
    }
  }
  init();
})();
