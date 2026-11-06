import {chromium} from "playwright";
import {readFileSync,mkdirSync} from "node:fs";
import assert from "node:assert/strict";

const base=process.env.SITE_BASE_URL||"http://127.0.0.1:8766/";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
let checks=0;
try{
  const html=readFileSync("preview-build/admin/dashboard/index.html","utf8");
  const bundle=readFileSync("preview-build/admin/dashboard/dashboard-bundle.js","utf8");
  assert.match(html,/id="dashboard-app" hidden/);checks++;
  assert.match(html,/admin\/dashboard\/dashboard-bundle\.js/);checks++;
  assert.doesNotMatch(html,/postgresql:\/\/|DATABASE_URL|password=/i);checks++;
  assert.doesNotMatch(bundle,/postgresql:\/\/|FOTOPOLIS_NEON_DEV_.*_URL|service_role/);checks++;
  for(const width of [320,375,430,768,1440]){
    const context=await browser.newContext({viewport:{width,height:850},locale:"de-DE"});
    const page=await context.newPage();
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.route("**/*.neonauth.*",r=>r.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:'{"session":null,"user":null}'}));
    await page.goto(new URL("admin/dashboard/",base).href,{waitUntil:"domcontentloaded"});
    // We only validate anonymous behavior. Tests never mock a privileged
    // JWT or bypass the real server's authorization for data.
    await page.waitForTimeout(400);
    const url=page.url();
    if(url.includes("/admin/dashboard/")){
      assert.equal(await page.locator("#dashboard-app").isVisible(),false,"Anon dashboard must be concealed at "+width);checks++;
      assert.equal(await page.locator("#gate").isVisible(),true);checks++;
    }else{
      assert.ok(url.includes("/admin/login/"),"Anonymous must be redirected to login");checks+=2;
    }
    const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:window.innerWidth}));
    assert.ok(size.scroll<=size.width+2,"Mobile overflow "+width);checks++;
    assert.deepEqual(errors,[],"Browser JS errors "+width+": "+errors.join(";"));checks++;
    // Static VISUAL SHELL only. Never mocks an actual authorized JWT or
    // queries private data; this is an offline layout review of the UI.
    await page.goto(new URL("admin/dashboard/",base).href,{waitUntil:"domcontentloaded"});
    await page.evaluate(()=>{
      document.getElementById("gate").hidden=true;
      document.getElementById("dashboard-app").hidden=false;
      const grid=document.querySelector("[data-calendar-grid]");
      for(let i=0;i<35;i++){
        const d=document.createElement("button");d.type="button";d.className="day";
        const span=document.createElement("span");span.className="day-number";span.textContent=String(i%31+1);
        d.append(span);grid.append(d);
      }
    });
    const layout=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:window.innerWidth}));
    assert.ok(layout.scroll<=layout.width+2,"Protected dashboard visual shell overflow "+width+": "+JSON.stringify(layout));checks++;
    assert.equal(await page.locator(".account-card").isVisible(),true);checks++;
    if([320,430,1440].includes(width)){
      mkdirSync("concepts/premium-v2/qa-screenshots/admin-studio",{recursive:true});
      await page.screenshot({path:"concepts/premium-v2/qa-screenshots/admin-studio/dashboard-shell-"+width+".png",fullPage:true});
    }
    await context.close();
  }
  console.log("FOTOPOLIS PROTECTED DASHBOARD QA SUCCESS – "+checks+" anonymous-protection, static-secret and responsive tests.");
}finally{await browser.close()}
