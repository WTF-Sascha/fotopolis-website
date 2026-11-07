import {chromium} from "playwright";
import assert from "node:assert/strict";

const base=process.env.SITE_BASE_URL||"http://127.0.0.1:8766/";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
let checks=0;
try{
  for(const width of [320,375,430,768,1440]){
    const context=await browser.newContext({viewport:{width,height:850},locale:"de-DE"});
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.route("**/*.neonauth.*",r=>r.fulfill({status:200,contentType:"application/json",headers:{"access-control-allow-origin":"*"},body:'{"session":null,"user":null}'}));
    await page.goto(new URL("admin/login/",base).href,{waitUntil:"domcontentloaded"});
    await page.locator("#email").waitFor({state:"visible"});
    assert.match(await page.title(),/FOTOPOLIS/);checks++;
    assert.equal(await page.locator('meta[name="robots"][content*="noindex"]').count(),1);checks++;
    assert.equal(await page.locator("[data-mode]").count(),3);checks++;
    assert.equal(await page.locator('#password-fields').isVisible(),true);checks++;
    assert.equal(await page.locator('#reset-fields').isVisible(),false);checks++;
    await page.locator('[data-mode="reset"]').click();
    assert.equal(await page.locator('[data-mode="reset"]').getAttribute("aria-pressed"),"true");checks++;
    assert.equal(await page.locator('#reset-fields').isVisible(),true);checks++;
    assert.match(await page.locator("#send-code").innerText(),/Passwort-Code/);checks++;
    await page.locator('[data-mode="otp"]').click();
    assert.equal(await page.locator('#reset-fields').isVisible(),false);checks++;
    assert.match(await page.locator("#send-code").innerText(),/Anmeldecode/);checks++;
    await page.locator('[data-mode="password"]').click();
    await page.locator("#login-password").fill("test-no-real-password");
    await page.locator('[data-reveal="login-password"]').click();
    assert.equal(await page.locator('#login-password').getAttribute("type"),"text");checks++;
    await page.locator('[data-reveal="login-password"]').click();
    assert.equal(await page.locator('#login-password').getAttribute("type"),"password");checks++;
    const sz=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:window.innerWidth}));
    assert.ok(sz.scroll<=sz.width+2,"Horizontal page overflow at "+width);checks++;
    assert.deepEqual(errors,[],"JavaScript error at "+width+": "+errors.join(";"));checks++;
    await page.goto(new URL("admin/login/?mode=reset",base).href,{waitUntil:"domcontentloaded"});
    assert.equal(await page.locator('#reset-fields').isVisible(),true);checks++;
    await context.close();
  }
  console.log("FOTOPOLIS ADMIN PASSWORD LOGIN QA SUCCESS – "+checks+" checks over five viewports. Zero real emails.");
}finally{await browser.close()}
