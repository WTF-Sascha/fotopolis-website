import {chromium} from "playwright";
import assert from "node:assert/strict";

const base=process.env.SITE_BASE_URL||"http://127.0.0.1:8766/";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const origin=new URL(base).origin;
let checks=0;
try{
 for(const width of [320,430,1440]){
  const context=await browser.newContext({viewport:{width,height:820},locale:"de-DE",timezoneId:"Europe/Berlin"});
  const page=await context.newPage();const unexpected=[],adminWrites=[];
  page.on("pageerror",error=>unexpected.push(error.message));
  await page.route("**/*",async route=>{
    const req=route.request(),url=req.url(),path=new URL(url).pathname;
    if(url.includes(".neonauth.")){
      const headers={
        "access-control-allow-origin":origin,
        "access-control-allow-credentials":"true",
        "access-control-allow-methods":"GET,POST,OPTIONS",
        "access-control-allow-headers":"content-type,x-neon-auth-proxy,authorization,x-force-fetch"
      };
      if(req.method()==="OPTIONS")return route.fulfill({status:204,headers});
      if(path.endsWith("/get-session")){
        return route.fulfill({status:200,contentType:"application/json",headers,body:JSON.stringify({
          session:{id:"qa-session",token:"e30.e30.AA",userId:"cab04f3d-8d22-4c1a-87c5-0d63a5711b72"},
          user:{id:"cab04f3d-8d22-4c1a-87c5-0d63a5711b72",email:"qa@example.invalid",name:"QA"}
        })});
      }
      return route.fulfill({status:200,contentType:"application/json",headers,body:'{"token":"e30.e30.AA"}'});
    }
    if(path.startsWith("/api/fotopolis/admin/")){
      if(req.method()!=="GET")adminWrites.push(path);
      if(path.endsWith("/session"))
        return route.fulfill({status:200,contentType:"application/json",body:'{"authenticated":true,"authorized":true,"role":"owner"}'});
      if(path.endsWith("/overview"))
        return route.fulfill({status:200,contentType:"application/json",body:'{"readOnly":true,"resources":[],"allocations":[]}')});
      return route.fulfill({status:404});
    }
    return route.continue();
  });
  await page.goto(new URL("admin/dashboard/",base).href,{waitUntil:"domcontentloaded"});
  await page.locator("#dashboard-app").waitFor({state:"visible",timeout:12000});
  assert.equal(await page.locator('[data-planning-manager] .plan-primary').count(),1);checks++;
  await page.locator("[data-calendar-grid] .day").first().click();
  assert.equal(await page.locator("#day-detail-dialog").isVisible(),true);checks++;
  const bounds=await page.locator("#day-detail-dialog").boundingBox();
  assert.ok(bounds && bounds.x>=0 && bounds.x+bounds.width<=width+1,"Dialog fits viewport "+width);checks++;
  await page.locator("[data-plan-selected]").click();
  assert.equal(await page.locator("#day-detail-dialog").isVisible(),false);checks++;
  assert.equal(await page.locator("#planning .plan-form").isVisible(),true);checks++;
  await page.locator("#planning .plan-form-buttons button.plan-secondary").click();
  await page.locator("#admin-jump-date").fill("2027-01-15");
  await page.locator("[data-date-go]").click();
  await page.locator("#day-detail-dialog").waitFor({state:"visible"});
  assert.match(await page.locator("[data-dialog-day-title]").innerText(),/15. Januar 2027/);checks++;
  await page.locator("[data-close-day]").click();
  assert.equal(await page.locator("#day-detail-dialog").isVisible(),false);checks++;
  await page.locator("[data-refresh-calendar]").click();
  await page.waitForFunction(()=>document.querySelector("[data-calendar-sync]")?.textContent?.includes("Mit Neon verbunden"));
  assert.match(await page.locator("[data-calendar-sync]").innerText(),/Mit Neon verbunden/);checks++;
  assert.deepEqual(adminWrites,[]);checks++;
  assert.deepEqual(unexpected,[]);checks++;
  await context.close();
 }
 console.log("FOTOPOLIS AUTHENTICATED ADMIN MODAL QA SUCCESS – "+checks+" checks at three breakpoints, mocked authorization only, no writes.");
}finally{await browser.close()}
