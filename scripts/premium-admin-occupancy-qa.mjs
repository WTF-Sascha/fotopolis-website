import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdirSync} from "node:fs";
const base=process.env.SITE_BASE_URL||"http://127.0.0.1:8766/";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
let checks=0;
try{
 for(const width of [320,375,430,768,1440]){
   const context=await browser.newContext({viewport:{width,height:900},locale:"de-DE",timezoneId:"Europe/Berlin"});
   const page=await context.newPage(),writes=[],errors=[];
   page.on("request",request=>{if(request.url().includes("/api/fotopolis/")&&request.method()!=="GET")writes.push(request.url())});
   page.on("pageerror",error=>errors.push(error.message));
   await page.route("**/admin/dashboard/dashboard-bundle.js",route=>route.abort());
   await page.goto(new URL("admin/dashboard/",base).href,{waitUntil:"domcontentloaded"});
   await page.evaluate(()=>{document.getElementById("gate").hidden=true;document.getElementById("dashboard-app").hidden=false;});
   await page.addScriptTag({type:"module",content:`
     import {setupReservationsManager} from "/admin/dashboard/reservations-manager.js";
     window.qaChecks=0;window.qaConflict=false;
     window.qaBookings=setupReservationsManager({
       root:document.querySelector("[data-reservations-manager]"),
       getResources:()=>[{id:"00000000-0000-4000-8000-000000000001",resource_code:"BOX-01",display_name:"Testgerät",product_type:"fotobox",enabled:true}],
       getAllocations:()=>[],
       createHold:async()=>{throw Error("No write calls allowed in QA")},
       changeHold:async()=>{throw Error("No write calls allowed in QA")},
       checkOccupancy:async()=>{
         window.qaChecks++;
         return {previewOnly:true,readOnly:true,deviceActive:true,hasConflict:window.qaConflict};
       }
     });
   `});
   await page.locator("#bookings #reservations-manager > .plan-primary").click();
   await page.locator("#booking-device").selectOption("00000000-0000-4000-8000-000000000001");
   await page.locator("#booking-start").fill("2026-12-15T12:00");
   await page.locator("#booking-end").fill("2026-12-15T14:00");
   await page.locator("#booking-before").fill("30");
   await page.locator("#booking-after").fill("60");
   const preflight=page.locator("#bookings [data-occupancy-preflight]");
   const button=page.getByRole("button",{name:"Belegung vorab prüfen"});
   await button.click();
   await page.waitForFunction(()=>document.querySelector("[data-occupancy-preflight]")?.dataset.result==="clear");
   assert.match(await preflight.innerText(),/Kein Konflikt/);checks++;
   assert.equal(await page.evaluate(()=>window.qaChecks),1);checks++;
   await page.locator("#booking-before").fill("45");
   assert.equal(await preflight.innerText(),"");checks++;
   await page.evaluate(()=>window.qaConflict=true);
   await button.click();
   await page.waitForFunction(()=>document.querySelector("[data-occupancy-preflight]")?.dataset.result==="conflict");
   assert.match(await preflight.innerText(),/Konflikt/);checks++;
   await page.locator("#booking-before").fill("30");
   await page.locator("#booking-end").fill("2026-12-15T11:00");
   await button.click();
   assert.equal(await preflight.getAttribute("data-result"),"invalid");checks++;
   assert.equal(await page.evaluate(()=>window.qaChecks),2);checks++;
   const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
   assert.ok(dimensions.scroll<=dimensions.width+2,"Horizontal overflow "+width);checks++;
   assert.deepEqual(writes,[]);checks++;
   assert.deepEqual(errors,[]);checks++;
   if([320,1440].includes(width)){
     mkdirSync("concepts/premium-v2/qa-screenshots/admin-studio",{recursive:true});
     await page.locator("#bookings").screenshot({path:"concepts/premium-v2/qa-screenshots/admin-studio/preflight-"+width+".png"});
   }
   await context.close();
 }
 console.log("FOTOPOLIS STUDIO 4.2 PREFLIGHT UI QA SUCCESS – "+checks+" checks at 5 breakpoints, no real writes.");
}finally{await browser.close()}
