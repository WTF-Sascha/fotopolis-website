#!/usr/bin/env node
/* Real Chromium synthetic QA: private uploads, output PNG, enquiry and responsive UI. */
import {chromium} from "playwright";
import assert from "node:assert/strict";
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {deflateSync} from "node:zlib";

const origin=process.env.FOTOPOLIS_QA_URL||"http://127.0.0.1:8765";
const dir="studio12-browser-results";
await mkdir(dir,{recursive:true});
const failures=[],records=[],requests=[];
function crc(bytes){
  let n=0xffffffff;
  for(const b of bytes){n^=b;for(let i=0;i<8;i++)n=(n&1)?(n>>>1)^0xedb88320:n>>>1;}
  return(n^0xffffffff)>>>0;
}
function chunk(name,data){
  const type=Buffer.from(name),length=Buffer.alloc(4),sum=Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  sum.writeUInt32BE(crc(Buffer.concat([type,data])));
  return Buffer.concat([length,type,data,sum]);
}
function fixture(r=192,g=110,b=53){
  const width=1200,height=800;
  const rows=Buffer.alloc((width*4+1)*height);
  for(let y=0;y<height;y++){
    const start=y*(width*4+1);
    for(let x=0;x<width;x++){
      const i=start+1+x*4;
      rows[i]=Math.min(255,r+(x%91));rows[i+1]=Math.max(0,g-y%37);
      rows[i+2]=b;rows[i+3]=255;
    }
  }
  const hdr=Buffer.alloc(13);
  hdr.writeUInt32BE(width,0);hdr.writeUInt32BE(height,4);hdr[8]=8;hdr[9]=6;
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk("IHDR",hdr),chunk("IDAT",deflateSync(rows)),chunk("IEND",Buffer.alloc(0))
  ]);
}
function metadata(buffer){
  assert.equal(buffer.readUInt32BE(16),1772);
  assert.equal(buffer.readUInt32BE(20),1181);
  let offset=8,phys=[];
  while(offset+12<=buffer.length){
    const length=buffer.readUInt32BE(offset);
    const type=buffer.toString("ascii",offset+4,offset+8);
    const end=offset+length+12;
    assert.ok(end<=buffer.length,"PNG chunk boundaries valid");
    const chunkBytes=buffer.subarray(offset+4,end-4);
    assert.equal(buffer.readUInt32BE(end-4),crc(chunkBytes),"PNG CRC");
    if(type==="pHYs"){
      phys.push({x:buffer.readUInt32BE(offset+8),y:buffer.readUInt32BE(offset+12),
                 unit:buffer[offset+16]});
    }
    offset=end;
    if(type==="IEND")break;
  }
  assert.equal(phys.length,1,"exactly one DPI metadata block");
  assert.deepEqual(phys[0],{x:11811,y:11811,unit:1});
}
const browser=await chromium.launch({headless:true});
try{
  for(const width of [360,390,430,768,1024,1440,1920]){
    const page=await browser.newPage({
      viewport:{width,height:width<600?844:900},
      deviceScaleFactor:1,acceptDownloads:true,serviceWorkers:"block"
    });
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    page.on("request",r=>{if(r.method()!=="GET")requests.push({method:r.method(),url:r.url()});});
    try{
      const response=await page.goto(origin+"/designstudio/?vorlage=FP-017&produkt=Fotospiegel",
        {waitUntil:"networkidle",timeout:65000});
      assert.equal(response?.status(),200);
      await page.locator('[data-fp12-template]').waitFor();
      await page.waitForFunction(()=>{
        const root=document.querySelector("[data-fp12-editor]");
        return !!root?.querySelector('[data-fp12-slotlist] button[data-slot="3"]') &&
          document.querySelector('[data-fp12-status]')?.textContent.includes("geladen");
      },{timeout:35000});
      assert.equal(await page.locator('[data-fp12-slot]').count(),4);
      assert.equal(await page.locator('[data-fp12-template] option').count(),44);
      const state=await page.evaluate(()=>({
        scroll:document.documentElement.scrollWidth,
        viewport:window.innerWidth,
        canvas:[document.querySelector('[data-fp12-canvas]').width,
                document.querySelector('[data-fp12-canvas]').height],
        route:document.querySelector('main')?.dataset.fp12Editor!==undefined,
        title:document.title,
        disabled:document.querySelector('[data-fp12-download]').disabled
      }));
      assert.ok(state.route);
      assert.deepEqual(state.canvas,[1772,1181]);
      assert.ok(state.disabled,"export disabled until all photos filled");
      assert.ok(state.scroll<=width+2,"page overflow "+width+" / "+state.scroll);
      assert.deepEqual(errors,[]);
      if(width===390||width===1440){
        await page.screenshot({path:dir+"/fp17-"+width+"-empty.png",animations:"disabled"});
        await page.screenshot({path:dir+"/fp17-"+width+"-empty-full.png",animations:"disabled",fullPage:true});
      }
      if(width===390){
        const img=fixture();
        for(let i=0;i<4;i++){
          await page.locator('[data-slot="'+i+'"]').click();
          await page.locator("#fp12-photo").setInputFiles({
            name:"synthetic-"+i+".png",mimeType:"image/png",buffer:img
          });
          await page.waitForFunction(n=>{
            const el=document.querySelector('[data-slot="'+n+'"] small');
            return el?.textContent==="Bild eingefügt";
          },i,{timeout:20000});
        }
        await page.locator('[data-slot="0"]').click();
        await page.locator('[data-fp12-zoom]').evaluate(el=>{
          el.value="160";el.dispatchEvent(new Event("input",{bubbles:true}));
        });
        assert.equal(await page.locator('[data-fp12-zoom-label]').textContent(),"160 %");
        await page.locator('[data-fp12-center]').click();
        await page.locator('[data-fp12-caption]').fill("Anna & Max · Muster-Event");
        assert.equal(await page.locator('[data-fp12-download]').isDisabled(),false);
        await page.screenshot({path:dir+"/fp17-390-filled.png",animations:"disabled",fullPage:true});
        const [file]=await Promise.all([
          page.waitForEvent("download",{timeout:25000}),
          page.locator('[data-fp12-download]').click()
        ]);
        const raw=await readFile(await file.path());
        assert.ok(raw.byteLength>250000,"PNG export appears too small");
        metadata(raw);
        assert.match(file.suggestedFilename(),/^FP-017-FOTOPOLIS-15x10cm-300dpi\.png$/);
        await writeFile(dir+"/FP-017-synthetic-300dpi-print.png",raw);
        records.push({step:"print",bytes:raw.byteLength,photos:4,dimensions:[1772,1181],dpi:300});
        await Promise.all([
          page.waitForURL(/\/kontakt\/\?vorlage=FP-017/,{timeout:15000}),
          page.locator("[data-fp12-request]").click()
        ]);
        const selected=await page.locator('select[name="vorlage"]').inputValue();
        const details=await page.locator('textarea[name="details"]').inputValue();
        assert.equal(selected,"FP-017");
        assert.ok(details.includes("Anna & Max · Muster-Event"));
        assert.ok(details.includes("NICHT übertragen"));
        assert.equal(await page.locator('input[type="file"]').count(),0,"No photo upload in request form");
        records.push({step:"enquiry",template:selected,photosTransferred:false});
      }
      if(width===1440){
        await page.locator('[data-fp12-template]').selectOption("FP-033");
        await page.waitForFunction(()=>document.querySelectorAll("[data-fp12-slot]").length===1);
        assert.ok((await page.locator('[data-fp12-layout]').textContent()).includes("Signature"));
        await page.locator('[data-fp12-template]').selectOption("FP-008");
        await page.waitForFunction(()=>document.querySelectorAll("[data-fp12-slot]").length===2);
        await page.screenshot({path:dir+"/fp08-1440-studio12.png",animations:"disabled",fullPage:true});
        records.push({step:"template-switch",single:true,duo:true,classic:true});
      }
      records.push({width,route:"/designstudio/",ok:true});
    }catch(error){failures.push({width,step:"editor",message:String(error.stack||error)});}
    finally{await page.close();}
  }
  const gallery=await browser.newPage({viewport:{width:1440,height:900},serviceWorkers:"block"});
  try{
    await gallery.goto(origin+"/designvorlagen/",{waitUntil:"networkidle",timeout:45000});
    await gallery.locator(".gl-card").first().waitFor();
    await gallery.locator(".gl-preview").first().click();
    const href=await gallery.locator('[data-modal-editor]').getAttribute("href");
    assert.match(href,/^\/designstudio\/\?vorlage=FP-001&produkt=Fotobox$/);
    await gallery.locator("[data-modal-product]").selectOption("Fotospiegel");
    const updated=await gallery.locator('[data-modal-editor]').getAttribute("href");
    assert.ok(updated.includes("produkt=Fotospiegel"));
    records.push({step:"gallery-entry",href:updated});
  }catch(error){failures.push({step:"gallery-entry",message:String(error.stack||error)});}
  finally{await gallery.close();}
  assert.equal(requests.length,0,"No photo/network POST allowed in synthetic preview");
}finally{await browser.close();}
await writeFile(dir+"/results.json",JSON.stringify({
  scope:"Studio 12 real Chromium visual, print/pHYs, local photo and enquiry integration",
  results:records,failures,postedRequests:requests
},null,2));
if(failures.length){
  console.error("STUDIO 12 FAILURES",JSON.stringify(failures,null,2));
  process.exitCode=1;
}else console.log("STUDIO 12 BROWSER QA PASSED",JSON.stringify(records));
