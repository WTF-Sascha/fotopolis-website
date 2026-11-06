import { chromium } from "playwright";
import assert from "node:assert/strict";
const base=process.env.SITE_BASE_URL||"http://127.0.0.1:8766/";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
let checks=0;
try{
  for(const width of [320,375,430,768,1440]){
    const context=await browser.newContext({viewport:{width,height:850},locale:"de-DE"});
    const page=await context.newPage();
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.route("**/*.neonauth.*",r=>r.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:'{"session":null,"user":null}'}));
    await page.goto(new URL("admin/login/",base).href,{waitUntil:"domcontentloaded"});
    await page.locator("#email").waitFor({state:"visible"});
    assert.match(await page.title(),/FOTOPOLIS/);checks++;
    assert.equal(await page.locator('meta[name="robots"][content*="noindex"]').count(),1);checks++;
    assert.equal(await page.locator("[data-mode]").count(),2);checks++;
    assert.equal(await page.locator("#otp-area").isVisible(),false);checks++;
    await page.locator('[data-mode="signin"]').click();
    assert.equal(await page.locator('[data-mode="signin"]').getAttribute("aria-pressed"),"true");checks++;
    assert.match(await page.locator("#send-code").innerText(),/Anmeldecode/);checks++;
    await page.locator('[data-mode="verify"]').click();
    assert.match(await page.locator("#send-code").innerText(),/Bestätigungscode/);checks++;
    const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:window.innerWidth}));
    assert.ok(size.scroll<=size.width+2,"Unexpected horizontal overflow at "+width);checks++;
    assert.deepEqual(errors,[],"JavaScript error at "+width+": "+errors.join(";"));checks++;
    await context.close();
  }
  console.log("FOTOPOLIS ADMIN LOGIN SMOKE SUCCESS – "+checks+" layout and mode checks. No real mail sent.");
}finally{await browser.close()}
