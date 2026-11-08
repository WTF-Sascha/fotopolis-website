import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdirSync} from "node:fs";

const base=process.env.SITE_BASE_URL||"http://127.0.0.1:8766/";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const origin=new URL(base).origin;
const devices=[
 {id:"00000000-0000-4000-8000-000000000001",resource_code:"BOX-02",product_type:"fotobox",display_name:"Fotobox Premium",enabled:true},
 {id:"00000000-0000-4000-8000-000000000002",resource_code:"MIR-01",product_type:"fotospiegel",display_name:"Mirror Gold",enabled:true},
 {id:"00000000-0000-4000-8000-000000000003",resource_code:"CAMP-01",product_type:"fotowohnwagen",display_name:"Camper Garten",enabled:false}
];
const bookings=[
 {id:"00000000-0000-4000-8000-000000000101",resource_id:devices[0].id,allocation_kind:"booking",allocation_state:"held",event_start_at:"2026-12-16T15:00:00.000Z",event_end_at:"2026-12-16T19:00:00.000Z",occupied_from:"2026-12-16T13:00:00.000Z",occupied_until:"2026-12-16T20:00:00.000Z"},
 {id:"00000000-0000-4000-8000-000000000102",resource_id:devices[1].id,allocation_kind:"maintenance",allocation_state:"blocked",event_start_at:"2026-12-20T10:00:00.000Z",event_end_at:"2026-12-20T12:00:00.000Z",occupied_from:"2026-12-20T10:00:00.000Z",occupied_until:"2026-12-20T12:00:00.000Z"},
 {id:"00000000-0000-4000-8000-000000000103",resource_id:devices[2].id,allocation_kind:"booking",allocation_state:"cancelled",event_start_at:"2026-12-12T10:00:00.000Z",event_end_at:"2026-12-12T12:00:00.000Z",occupied_from:"2026-12-12T09:00:00.000Z",occupied_until:"2026-12-12T13:00:00.000Z"}
];
let checks=0;
try{
 for(const width of [320,375,430,768,1440]){
  const context=await browser.newContext({viewport:{width,height:900},locale:"de-DE",timezoneId:"Europe/Berlin"});
  const page=await context.newPage();const errors=[],writes=[];
  page.on("pageerror",err=>errors.push(err.message));
  page.on("request",req=>{if(req.url().includes("/api/fotopolis/")&&req.method()!=="GET")writes.push(req.url())});
  await page.route("**/*",async route=>{
   const req=route.request(),url=req.url(),pathname=new URL(url).pathname;
   if(url.includes(".neonauth.")){
     const headers={
       "access-control-allow-origin":origin,
       "access-control-allow-credentials":"true",
       "access-control-allow-methods":"GET,POST,OPTIONS",
       "access-control-allow-headers":"content-type,x-neon-auth-proxy,authorization,x-force-fetch"
     };
     if(req.method()==="OPTIONS")return route.fulfill({status:204,headers});
     if(pathname.endsWith("/get-session")){
       return route.fulfill({status:200,contentType:"application/json",headers,
        body:JSON.stringify({session:{id:"qa-session",token:"e30.e30.AA",userId:devices[0].id},user:{id:devices[0].id,email:"qa@example.invalid",name:"QA"}})});
     }
     return route.fulfill({status:200,contentType:"application/json",headers,body:'{"token":"e30.e30.AA"}'});
   }
   if(pathname.startsWith("/api/fotopolis/admin/")){
     if(pathname.endsWith("/session"))return route.fulfill({status:200,contentType:"application/json",body:'{"authenticated":true,"authorized":true,"role":"owner"}'});
     if(pathname.endsWith("/overview"))return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({readOnly:true,resources:devices,allocations:bookings})});
     if(pathname.endsWith("/activity"))return route.fulfill({status:200,contentType:"application/json",body:'{"readOnly":true,"records":[]}'});
     return route.fulfill({status:404});
   }
   return route.continue();
  });
  await page.goto(new URL("admin/dashboard/",base).href,{waitUntil:"domcontentloaded"});
  await page.locator("#dashboard-app").waitFor({state:"visible",timeout:15000});
  await page.locator("[data-agenda] .agenda-entry").first().waitFor();
  assert.equal(await page.locator("[data-agenda] .agenda-entry").count(),2);checks++;
  assert.equal(await page.locator("[data-inventory] .inventory-list-row").count(),3);checks++;
  assert.match(await page.locator("[data-agenda]").innerText(),/Fotobox Premium/);checks++;
  assert.doesNotMatch(await page.locator("[data-agenda]").innerText(),/Camper Garten/);checks++;
  await page.locator("[data-inventory-search]").fill("mirror");
  assert.equal(await page.locator("[data-inventory] .inventory-list-row").count(),1);checks++;
  await page.locator("[data-inventory-type]").selectOption("fotobox");
  assert.equal(await page.locator("[data-inventory] .inventory-list-row").count(),0);checks++;
  assert.match(await page.locator("[data-inventory]").innerText(),/Kein Gerät/);checks++;
  await page.locator("[data-inventory-type]").selectOption("all");
  await page.locator("[data-inventory-search]").fill("");
  await page.locator("[data-inventory-state]").selectOption("inactive");
  assert.equal(await page.locator("[data-inventory] .inventory-list-row").count(),1);checks++;
  assert.match(await page.locator("[data-inventory-results]").innerText(),/1 von 3/);checks++;
  await page.locator("[data-product-filter]").selectOption("fotobox");
  assert.equal(await page.locator("[data-agenda] .agenda-entry").count(),1);checks++;
  await page.locator("[data-agenda] button").first().click();
  await page.locator("#day-detail-dialog").waitFor({state:"visible",timeout:10000});
  assert.match(await page.locator("[data-dialog-day-title]").innerText(),/16. Dezember 2026/);checks++;
  assert.equal(await page.locator("[data-dialog-entries] .day-dialog-entry").count(),1);checks++;
  await page.locator("[data-reserve-selected]").click();
  assert.equal(await page.locator("#day-detail-dialog").isVisible(),false);checks++;
  assert.equal(await page.locator("#bookings .plan-form").isVisible(),true);checks++;
  assert.equal(await page.locator("#booking-start").inputValue(),"2026-12-16T12:00");checks++;
  assert.equal(await page.locator("#booking-end").inputValue(),"2026-12-16T14:00");checks++;
  assert.equal(await page.locator("#booking-before").inputValue(),"");checks++;
  assert.equal(await page.locator("#booking-after").inputValue(),"");checks++;
  const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
  assert.ok(dims.scroll<=dims.width+2,"Horizontal overflow at "+width);checks++;
  assert.deepEqual(writes,[]);checks++;
  assert.deepEqual(errors,[]);checks++;
  if([320,1440].includes(width)){
    mkdirSync("concepts/premium-v2/qa-screenshots/admin-studio",{recursive:true});
    await page.locator("#agenda").screenshot({path:"concepts/premium-v2/qa-screenshots/admin-studio/agenda-"+width+".png"});
  }
  await context.close();
 }
 console.log("FOTOPOLIS STUDIO 4.1 OPERATIONS QA SUCCESS – "+checks+" checks at 320,375,430,768,1440px; mock-only data; zero writes.");
}finally{await browser.close()}
