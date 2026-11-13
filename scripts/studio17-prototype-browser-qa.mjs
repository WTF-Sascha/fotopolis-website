#!/usr/bin/env node
/* Studio 17 real Chromium UX acceptance – exclusively synthetic browser data.
   No real login, form POST, DB write, production website or administrative API.
*/
import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir,writeFile} from "node:fs/promises";
const base=(process.env.STUDIO17_BASE_URL||"http://127.0.0.1:8765").replace(/\/$/,"");
const widths=[320,390,768,1440];
const sections=["uebersicht","anfragen","termine","geraete","designs","website"];
const evidence="studio17-prototype-browser-results";
await mkdir(evidence,{recursive:true});
const results=[],errors=[];
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
 for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:850},locale:"de-DE",serviceWorkers:"block"});
  const page=await context.newPage();
  const exceptions=[],writes=[],apiCalls=[];
  page.on("pageerror",e=>exceptions.push(e.message));
  page.on("request",req=>{
   if(req.method()!=="GET")writes.push(req.method()+" "+req.url());
   if(new URL(req.url()).pathname.startsWith("/api/"))apiCalls.push(req.url());
  });
  let checks=0;
  async function navigate(name){
   if(width<=760){
    await page.locator("#menu-trigger").click();
    assert.equal(await page.locator("#sidebar").evaluate(e=>e.classList.contains("open")),true);
   }
   await page.locator('[data-nav="'+name+'"]').click();
   await page.waitForFunction(route=>location.hash==="#"+route,name);
   await page.locator('#screen-'+name).waitFor({state:"visible",timeout:5000});checks++;
   assert.equal(await page.locator(".screen.active").count(),1);checks++;
  }
  try{
   const resp=await page.goto(base+"/studio17-konzept/",{waitUntil:"domcontentloaded",timeout:40000});
   assert.equal(resp?.status(),200);
   await page.locator("#priority-list .priority-item").first().waitFor();
   assert.equal(await page.locator("#main-navigation .nav-link").count(),6);checks++;
   const logo=page.locator(".brand img");
   assert.equal(await logo.getAttribute("src"),"/assets/fotopolis-goldmark.webp");checks++;
   assert.ok(await logo.evaluate(e=>e.complete&&e.naturalWidth>=180),"Original approved goldmark loads");checks++;
   for(const id of sections)assert.equal(await page.locator('[data-screen="'+id+'"]').count(),1);
   if(width===390||width===1440){
    await page.screenshot({path:evidence+"/overview-"+width+".png",fullPage:true,animations:"disabled"});
   }
   await navigate("anfragen");
   assert.equal(await page.locator("#inquiry-list .record-row").count(),4);checks++;
   await page.locator("#inquiry-search").fill("Fotospiegel");
   assert.equal(await page.locator("#inquiry-list .record-row").count(),1);checks++;
   await page.locator("#inquiry-search").fill("");
   await page.locator('#inquiry-list [data-inquiry="DEMO-1001"]').click();
   assert.equal(await page.locator("#detail-drawer").isVisible(),true);checks++;
   await page.locator("#request-stage").selectOption("In Prüfung");
   await page.locator("#save-request-stage").click();
   assert.equal(await page.locator("#detail-drawer").isVisible(),false);checks++;
   assert.equal(await page.locator("#metric-inquiries").textContent(),"2");checks++;
   await page.locator('#inquiry-list [data-inquiry="DEMO-1001"]').click();
   await page.locator("#handoff-request").click();
   await page.locator("#screen-termine").waitFor({state:"visible",timeout:5000});checks++;
   assert.match(await page.locator("#selected-day-label").innerText(),/21\. November 2026/);checks++;
   await page.locator("#add-block").click();
   await page.locator("#block-reason").fill("Testwartung");
   await page.locator("#block-form button[type=submit]").click();
   assert.match(await page.locator("#selected-day-list").innerText(),/Testwartung/);checks++;
   await page.locator("#month-next").click();
   assert.match(await page.locator("#calendar-title").innerText(),/Dezember 2026/);checks++;
   await page.locator("#month-prev").click();
   assert.match(await page.locator("#calendar-title").innerText(),/November 2026/);checks++;
   await navigate("geraete");
   assert.equal(await page.locator(".device-card").count(),3);checks++;
   await page.locator("#device-search").fill("Fotobox");
   assert.equal(await page.locator(".device-card").count(),1);checks++;
   await page.locator("#device-search").fill("");
   await page.locator("#device-add").click();
   await page.locator("#new-device-name").fill("Testgerät UX");
   await page.locator("#new-device-form button[type=submit]").click();
   assert.equal(await page.locator(".device-card").count(),4);checks++;
   await navigate("designs");
   assert.equal(await page.locator(".design-item").count(),8);checks++;
   await page.locator('[data-collection="signature"]').click();
   assert.equal(await page.locator(".design-item").count(),8);checks++;
   await page.locator("#design-next").click();
   assert.equal(await page.locator(".design-item").count(),4);checks++;
   await page.locator(".design-item").first().click();
   await page.locator("#design-stage").selectOption("In Prüfung");
   await page.locator("#design-status-save").click();
   assert.equal(await page.locator("#detail-drawer").isVisible(),false);checks++;
   await navigate("website");
   assert.equal(await page.locator('#content-list button').count(),4);checks++;
   await page.locator('[data-content="faq"]').click();
   await page.locator("#content-draft").fill("Nur Konzeptinhalt");
   await page.locator("#save-content-demo").click();
   assert.equal(await page.locator("#detail-drawer").isVisible(),false);checks++;
   await navigate("einstellungen");
   assert.equal(await page.locator('#screen-einstellungen').isVisible(),true);checks++;
   await page.locator('[data-settings="Mein Konto"]').click();
   assert.equal(await page.locator("#demo-dialog").isVisible(),true);checks++;
   await page.locator("#dialog-dismiss").click();
   if(width===390||width===1440){
    await navigate("anfragen");
    await page.screenshot({path:evidence+"/inquiries-"+width+".png",fullPage:true,animations:"disabled"});
   }
   const size=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
   assert.ok(size.scroll<=size.width+3,"Horizontal overflow at "+width+": "+size.scroll);checks++;
   assert.deepEqual(writes,[],"No POST / PATCH requests from concept");checks++;
   assert.deepEqual(apiCalls,[],"No real administrative API requests");checks++;
   assert.deepEqual(exceptions,[],"No browser JS exceptions");checks++;
   results.push({width,checks,status:"pass",noRequests:true,approvedLogo:true});
  }catch(err){
   errors.push({width,error:String(err.stack||err)});
  }finally{await context.close()}
 }
}finally{await browser.close()}
await writeFile(evidence+"/results.json",JSON.stringify({results,errors,scope:"UX demo only; manual visual signoff pending"},null,2));
if(errors.length){
 console.error("STUDIO17 BROWSER QA FAILED",JSON.stringify(errors,null,2));process.exitCode=1;
}else console.log("STUDIO17 BROWSER QA PASS",JSON.stringify(results));
