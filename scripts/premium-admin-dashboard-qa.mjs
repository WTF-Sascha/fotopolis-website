import {chromium} from "playwright";
import {readFileSync} from "node:fs";
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
    await context.close();
  }
  console.log("FOTOPOLIS PROTECTED DASHBOARD QA SUCCESS – "+checks+" anonymous-protection, static-secret and responsive tests.");
}finally{await browser.close()}
