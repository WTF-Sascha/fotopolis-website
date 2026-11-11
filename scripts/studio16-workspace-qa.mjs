#!/usr/bin/env node
/* Studio 16 – authenticated-looking browser UI test with fixture requests only.
   No real user credentials, no real JWT, no external mail and no database writes. */
import assert from "node:assert/strict";
import {chromium} from "playwright";

const base=process.env.SITE_BASE_URL||"http://127.0.0.1:8765/";
const origin=new URL(base).origin;
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
let checks=0;
const modules=["overview","calendar","inventory","planning","bookings","activity",
 "analytics","eventanfragen","designstudio","designs","cms","medien","system","account"];
try{
 for(const width of [320,430,1440]){
  const context=await browser.newContext({viewport:{width,height:850},locale:"de-DE",timezoneId:"Europe/Berlin"});
  const page=await context.newPage();
  const unexpected=[],writes=[];
  page.on("pageerror",e=>unexpected.push(e.message));
  await page.route("**/*",async route=>{
   const req=route.request(),url=req.url(),path=new URL(url).pathname;
   if(url.includes(".neonauth.")){
    const headers={
     "access-control-allow-origin":origin,"access-control-allow-credentials":"true",
     "access-control-allow-methods":"GET,POST,OPTIONS",
     "access-control-allow-headers":"content-type,x-neon-auth-proxy,authorization,x-force-fetch"
    };
    if(req.method()==="OPTIONS")return route.fulfill({status:204,headers});
    if(path.endsWith("/get-session")){
     return route.fulfill({status:200,contentType:"application/json",headers,
      body:JSON.stringify({
       session:{id:"qa-session",token:"e30.e30.AA",userId:"cab04f3d-8d22-4c1a-87c5-0d63a5711b72"},
       user:{id:"cab04f3d-8d22-4c1a-87c5-0d63a5711b72",email:"qa@example.invalid",name:"QA"}
      })});
    }
    return route.fulfill({status:200,contentType:"application/json",headers,body:'{"token":"e30.e30.AA"}'});
   }
   if(path.startsWith("/api/fotopolis/")){
    if(req.method()!=="GET")writes.push(path);
    let content={rows:[],total:0};
    if(path.endsWith("/admin/session"))content={authenticated:true,authorized:true,role:"owner"};
    else if(path.endsWith("/admin/overview"))content={readOnly:true,resources:[],allocations:[]};
    else if(path.includes("/studio13/admin/"))content={rows:[],crm:{mirroredCount:0},versions:[]};
    else if(path.endsWith("/admin/activity"))content={readOnly:true,records:[]};
    else return route.fulfill({status:404,contentType:"application/json",body:'{}'});
    return route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(content)});
   }
   return route.continue();
  });
  await page.goto(new URL("admin/dashboard/#eventanfragen",base).href,{waitUntil:"domcontentloaded"});
  await page.locator("#dashboard-app").waitFor({state:"visible",timeout:15000});
  const dropdown=page.locator("#fp16-area-select");
  assert.equal(await dropdown.inputValue(),"eventanfragen");checks++;
  assert.equal(await page.locator("#eventanfragen").isVisible(),true);checks++;
  assert.equal(await page.locator("#analytics").isVisible(),false);checks++;
  assert.equal(await page.locator("#calendar").isVisible(),false);checks++;
  assert.equal(await dropdown.locator("option").count(),modules.length);checks++;
  await dropdown.selectOption("calendar");
  assert.ok(page.url().endsWith("#calendar"));checks++;
  assert.equal(await page.locator("#calendar").isVisible(),true);checks++;
  assert.equal(await page.locator(".bottom-grid > .detail-card").isVisible(),true);checks++;
  assert.equal(await page.locator("#inventory").isVisible(),false);checks++;
  await dropdown.selectOption("inventory");
  assert.equal(await page.locator("#inventory").isVisible(),true);checks++;
  assert.equal(await page.locator("#calendar").isVisible(),false);checks++;
  const inventory=await page.locator("#inventory").boundingBox();
  const main=await page.locator("#main").boundingBox();
  assert.ok(inventory&&main&&inventory.width>main.width*.72,
   "Selected inventory must have full workspace width at "+width);checks++;
  await dropdown.selectOption("designstudio");
  assert.equal(await page.locator("#designstudio").isVisible(),true);checks++;
  assert.equal(await page.locator("#designs").isVisible(),false);checks++;
  assert.equal(await page.locator('#designstudio a[href="/admin/designstudio/"]').count(),1);checks++;
  await dropdown.selectOption("overview");
  assert.equal(await page.locator("#overview").isVisible(),true);checks++;
  assert.equal(await page.locator(".metrics").isVisible(),true);checks++;
  assert.equal(await page.locator("#eventanfragen").isVisible(),false);checks++;
  await page.goBack({waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>document.querySelector("#fp16-area-select")?.value==="designstudio");
  assert.equal(await page.locator("#designstudio").isVisible(),true);checks++;
  await page.evaluate(()=>window.dispatchEvent(new CustomEvent("fotopolis:show-area",{detail:{area:"bookings"}})));
  assert.equal(await dropdown.inputValue(),"bookings");checks++;
  assert.equal(await page.locator("#bookings").isVisible(),true);checks++;
  assert.equal(await page.locator("#inventory").isVisible(),false);checks++;
  const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
  assert.ok(size.scroll<=size.width+2,"No horizontal overflow at "+width);checks++;
  assert.equal(await page.locator(".fp16-area-tools [data-signout]").isVisible(),true);checks++;
  assert.deepEqual(writes,[],"QA must not issue admin writes");checks++;
  assert.deepEqual(unexpected,[],"No JS exceptions at "+width);checks++;
  await context.close();
 }
 console.log("STUDIO 16 WORKSPACE QA PASS: "+checks+" checks across 320/430/1440px, deep links, one visible module, no writes.");
}finally{await browser.close()}
