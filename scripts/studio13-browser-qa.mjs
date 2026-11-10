#!/usr/bin/env node
// Studio 13 public/private boundary, 44-design gallery and responsive browser evidence.
import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
const origin=process.env.FOTOPOLIS_QA_URL||"http://127.0.0.1:8765";
const dest="studio13-browser-results";
await mkdir(dest,{recursive:true});
const results=[],errors=[];
const browser=await chromium.launch({headless:true});
try{
 for(const width of [360,390,430,768,1024,1440,1920]){
  const page=await browser.newPage({
   viewport:{width,height:width<600?844:900},deviceScaleFactor:1,serviceWorkers:"block"
  });
  const jsErrors=[];
  page.on("pageerror",e=>jsErrors.push(e.message));
  try{
   const response=await page.goto(origin+"/designvorlagen/",{waitUntil:"networkidle",timeout:65000});
   assert.equal(response.status(),200);
   await page.locator(".gl-card").first().waitFor({timeout:25000});
   const count=await page.locator(".gl-card").count();
   assert.equal(count,44,"All 44 public designs render");
   assert.equal(await page.locator('[data-modal-editor]').count(),0);
   assert.equal(await page.locator('[data-modal-print]').count(),0);
   const fullWidth=await page.evaluate(()=>document.documentElement.scrollWidth);
   assert.ok(fullWidth<=width+2,"Horizontal overflow at "+width+"px: "+fullWidth);
   assert.deepEqual(jsErrors,[]);
   if([390,1440].includes(width)){
    await page.screenshot({path:dest+"/collection-"+width+".png",animations:"disabled",fullPage:true});
   }
   const imageUrl=await page.locator(".gl-card img").first().getAttribute("src");
   assert.match(imageUrl,/^\/assets\/designvorlagen\/fp-\d{3}\.webp$/);
   await page.locator(".gl-preview").first().click();
   assert.equal(await page.locator("[data-gallery-modal]").isVisible(),true);
   assert.equal(await page.locator('[data-modal-link]').count(),1);
   results.push({width,designs:count,jsErrors:0,noEditorLinks:true,noPrintDownloads:true});
  }catch(err){errors.push({width,error:String(err.stack||err)});}
  finally{await page.close();}
 }
 const secure=await browser.newPage({serviceWorkers:"block"});
 try{
  await secure.route("**/*.neonauth.*",route=>route.abort());
  const page=await secure.goto(origin+"/admin/designstudio/",{waitUntil:"domcontentloaded",timeout:50000});
  assert.equal(page.status(),200);
  assert.equal(await secure.locator("#fp13-gate").count(),1);
  assert.equal(await secure.locator("[data-fp12-editor]").count(),0);
  const png=await secure.request.get(origin+"/assets/designvorlagen/print/fp-017.png");
  assert.equal(png.status(),404,"Print masters absent from CDN output");
  const archive=await secure.request.get(origin+"/qa/FOTOPOLIS_PhotoPrint_44_15x10_300dpi.zip");
  assert.equal(archive.status(),404,"Print archive absent");
  const oldEditor=await secure.request.get(origin+"/designstudio/");
  assert.equal(oldEditor.status(),404,"Obsolete public editor must not ship");
  results.push({security:"static build",privateEditorShell:true,printMaster404:true,archive404:true,publicEditor404:true});
 }catch(e){errors.push({step:"secure-boundary",error:String(e.stack||e)});}
 finally{await secure.close();}
}finally{await browser.close();}

for(const width of [390,768,1440]){
 const page=await chromium.launch({headless:true});
 try{
  const tab=await page.newPage({viewport:{width,height:900},deviceScaleFactor:1,serviceWorkers:"block"});
  await tab.route("**/admin/dashboard/dashboard-bundle.js",route=>route.abort());
  const res=await tab.goto(origin+"/admin/dashboard/",{waitUntil:"domcontentloaded",timeout:35000});
  assert.equal(res.status(),200);
  await tab.evaluate(()=>{
   document.getElementById("gate").hidden=true;
   document.getElementById("dashboard-app").hidden=false;
  });
  for(const id of ["analytics","eventanfragen","designstudio","designs","cms","medien","system"]){
   assert.equal(await tab.locator("#"+id).count(),1,"Missing gated admin panel "+id);
  }
  const scroll=await tab.evaluate(()=>document.documentElement.scrollWidth);
  assert.ok(scroll<=width+3,"Admin horizontal overflow "+width+" / "+scroll);
  await tab.screenshot({path:dest+"/admin-layout-synthetic-"+width+".png",animations:"disabled",fullPage:true});
  results.push({width,view:"admin static synthetic preview",panels:7,noOverflow:true,
    note:"Not a real authenticated administrator session"});
  await tab.close();
 }catch(e){errors.push({width,step:"admin-static-layout",error:String(e.stack||e)})}
 finally{await page.close();}
}
await writeFile(dest+"/results.json",JSON.stringify({results,errors,scope:"Studio 13 static browser and visual QA; authenticated Netlify function still needs live integration test"},null,2));
if(errors.length){
 console.error("STUDIO 13 BROWSER QA FAILED",JSON.stringify(errors,null,2));process.exitCode=1;
}else console.log("STUDIO 13 PUBLIC/PRIVATE BROWSER QA PASSED",JSON.stringify(results));
