import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdirSync} from "node:fs";

const base=process.env.SITE_BASE_URL||"http://127.0.0.1:8766/";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
let checks=0;
try{
 for(const width of [320,375,430,768,1440]){
  const ctx=await browser.newContext({viewport:{width,height:920},acceptDownloads:true,locale:"de-DE"});
  const page=await ctx.newPage();const posts=[];
  page.on("request",r=>{if(r.method()!=="GET"&&r.url().includes("/api/fotopolis/"))posts.push(r.url())});
  await page.route("**/admin/dashboard/dashboard-bundle.js",r=>r.abort());
  async function mount(){
    await page.goto(new URL("admin/dashboard/",base).href,{waitUntil:"domcontentloaded"});
    await page.evaluate(()=>{
      document.getElementById("gate").hidden=true;
      document.getElementById("dashboard-app").hidden=false;
    });
    await page.addScriptTag({type:"module",content:`
     import {setupPlanningManager} from "/admin/dashboard/planning-manager.js";
     const known=[{code:"BOX-QA",name:"Fotobox QA",type:"fotobox"}];
     window.testPlanner=setupPlanningManager({
       root:document.querySelector("[data-planning-manager]"),
       getResources:()=>[],getInventoryDrafts:()=>known,
       getAllocations:()=>[],onChange:()=>{}
     });
    `});
    await page.locator(".plan-primary").first().waitFor({state:"visible"});
  }
  await mount();
  assert.ok(await page.locator('#day-detail-dialog').count());checks++;
  await page.locator(".plan-primary").first().click();
  await page.locator("#block-resource").selectOption("draft:BOX-QA");
  await page.locator("#block-start").fill("2026-11-09T12:00");
  await page.locator("#block-end").fill("2026-11-09T14:00");
  await page.locator('.plan-form button[type="submit"]').click();
  assert.equal(await page.locator(".plan-entry").count(),1);checks++;
  assert.match(await page.locator(".plan-entry").innerText(),/Nicht gespeichert/);checks++;
  await page.locator(".plan-primary").first().click();
  await page.locator("#block-resource").selectOption("draft:BOX-QA");
  await page.locator("#block-start").fill("2026-11-09T13:00");
  await page.locator("#block-end").fill("2026-11-09T15:00");
  await page.locator('.plan-form button[type="submit"]').click();
  assert.match(await page.locator(".plan-error").innerText(),/überschneidenden/);checks++;
  await page.locator(".plan-form-buttons .plan-secondary").click();
  const downloaded=page.waitForEvent("download");
  await page.locator(".plan-export button").first().click();
  assert.equal((await downloaded).suggestedFilename(),"fotopolis-planungsentwuerfe.json");checks++;
  const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
  assert.ok(dimensions.scroll<=dimensions.width+2,"Horizontal overflow "+width);checks++;
  if([320,430,1440].includes(width)){
   mkdirSync("concepts/premium-v2/qa-screenshots/admin-studio",{recursive:true});
   await page.locator("#planning").screenshot({path:"concepts/premium-v2/qa-screenshots/admin-studio/planning-"+width+".png"});
  }
  await page.reload({waitUntil:"domcontentloaded"});
  await page.evaluate(()=>{
    document.getElementById("gate").hidden=true;
    document.getElementById("dashboard-app").hidden=false;
  });
  await page.addScriptTag({type:"module",content:`
    import {setupPlanningManager} from "/admin/dashboard/planning-manager.js";
    window.testPlanner=setupPlanningManager({
     root:document.querySelector("[data-planning-manager]"),
     getResources:()=>[],getInventoryDrafts:()=>[],getAllocations:()=>[],onChange:()=>{}
    });
  `});
  await page.locator(".plan-primary").first().waitFor({state:"visible"});
  assert.equal(await page.locator(".plan-entry").count(),0);checks++;
  assert.deepEqual(posts,[],"No admin write calls");checks++;
  await ctx.close();
 }
 console.log("FOTOPOLIS ADMIN PLANNING BROWSER QA SUCCESS – "+checks+" checks, five breakpoints, no persisted data.");
}finally{await browser.close()}
