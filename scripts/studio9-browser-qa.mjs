#!/usr/bin/env node
/** Studio 9.0 real-browser acceptance. HTTP submissions are intercepted:
 * no real visitor information, test email or dummy requests are sent to Netlify.
 */
import {chromium} from "playwright";
import assert from "node:assert/strict";
const base=process.env.SITE_BASE_URL||"http://127.0.0.1:8766/";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
let total=0;
const check=(value,name)=>{assert.ok(value,name);total++};
const widths=[375,768,1440];
try{
 for(const width of widths){
  const context=await browser.newContext({viewport:{width,height:width<=375?812:930},reducedMotion:"reduce",serviceWorkers:"block"});
  const page=await context.newPage();
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto(new URL("kontakt/?vorlage=FP-028&produkt=Fotospiegel",base).toString(),{waitUntil:"networkidle"});
  const f=page.locator('form[name="fotopolis-studio9-anfrage"]');
  check(await f.count()===1,"Static Netlify form missing at "+width);
  check(await f.getAttribute("data-netlify")==="true","Server-side form detection absent at "+width);
  check(await f.locator('select[name="vorlage"] option').count()===45,"44 templates not connected to contact at "+width);
  check(await f.locator('[name="vorlage"]').inputValue()==="FP-028","Gallery design handoff failed at "+width);
  check(await f.locator('[name="produkt"]').inputValue()==="Fotospiegel","Product handoff failed at "+width);
  check((await page.locator("[data-studio9-template-image]").getAttribute("src"))?.includes("fp-028.webp"),"Design image did not load at "+width);
  check(await page.locator("[data-contact-submit]").count()===1,"Direct submit button not found at "+width);
  check(await page.locator('[name="datenschutz_ok"]').count()===1,"Privacy acknowledgement missing at "+width);
  check(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)),"Contact overflows viewport at "+width);
  await f.locator('[name="anlass"]').selectOption("Hochzeit");
  await f.locator('[name="datum"]').fill("2026-12-12");
  await page.locator("[data-contact-next]").click();
  check(!(await f.locator('[data-contact-step="2"]').isHidden()),"Contact step 2 did not open at "+width);
  await f.locator('[name="name"]').fill("Studio Beispiel");
  await f.locator('[name="email"]').fill("beispiel@invalid.example");
  await page.locator("[data-contact-next]").click();
  check(!(await f.locator('[data-contact-step="3"]').isHidden()),"Contact step 3 did not open at "+width);
  let posts=0,captured=null;
  await page.route("**/kontakt/",async route=>{
    if(route.request().method()!=="POST")return route.continue();
    captured=new URLSearchParams(route.request().postData());
    posts++;
    await route.fulfill({status:posts===1?503:200,contentType:"text/html",body:posts===1?"temporarily unavailable":"ok"});
  });
  await page.locator("[data-contact-submit]").click();
  check(posts===0,"Contact submit bypassed privacy validation at "+width);
  await f.locator('[name="datenschutz_ok"]').check();
  await page.locator("[data-contact-submit]").click();
  await page.waitForFunction(()=>document.querySelector("[data-contact-status]")?.textContent.includes("nicht erfolgreich"));
  check(posts===1&&await f.locator('[name="email"]').inputValue()==="beispiel@invalid.example","Failed network must preserve contact fields at "+width);
  await page.locator("[data-contact-submit]").click();
  await page.waitForFunction(()=>document.querySelector("[data-studio9-success]")?.hidden===false);
  check(posts===2&&captured?.get("form-name")==="fotopolis-studio9-anfrage","Contact POST was not URL encoded for Netlify at "+width);
  check(captured?.get("vorlage")==="FP-028"&&captured?.get("produkt")==="Fotospiegel","Contact POST lost design or product at "+width);
  check(captured?.get("datenschutz_ok")==="Ja"&&captured?.get("email")==="beispiel@invalid.example","Contact POST dropped privacy/contact fields at "+width);
  check(await page.locator("[data-contact-submit]").isDisabled(),"Success must prevent duplicate submits at "+width);
  await page.goto(new URL("fotospiegel/",base).toString(),{waitUntil:"networkidle"});
  const pf=page.locator("form[data-product-request]");
  check(await pf.count()===1,"Product inline form missing at "+width);
  check(await pf.locator('[name="vorlage"] option').count()===45,"44 designs not in product form at "+width);
  await pf.locator('[name="vorlage"]').selectOption("FP-009");
  await pf.locator('[name="datum"]').fill("2026-12-20");
  await page.locator("[data-product-next]").click();
  await pf.locator('[name="name"]').fill("Studio Beispiel");
  await pf.locator('[name="email"]').fill("beispiel@invalid.example");
  await pf.locator('[name="datenschutz_ok"]').check();
  captured=null;posts=0;
  await page.route("**/kontakt/",async route=>{
    if(route.request().method()!=="POST")return route.continue();
    captured=new URLSearchParams(route.request().postData());posts++;
    await route.fulfill({status:200,contentType:"text/html",body:"ok"});
  });
  await page.locator("[data-studio9-product-submit]").click();
  await page.waitForFunction(()=>document.querySelector("[data-product-request-status]")?.getAttribute("data-studio9-sent")==="true");
  check(posts===1&&captured?.get("form-name")==="fotopolis-studio9-anfrage","Inline product request not submitted at "+width);
  check(captured?.get("produkt")==="Fotospiegel"&&captured?.get("vorlage")==="FP-009","Product design not retained in submitted enquiry at "+width);
  check(!captured?.get("password")&&!captured?.get("authorization"),"Unexpected hidden credentials in form payload at "+width);
  check(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)),"Product form overflow at "+width);
  await page.goto(new URL("designvorlagen/?produkt=Fotospiegel",base).toString(),{waitUntil:"networkidle"});
  await page.locator(".gl-preview").first().click();
  check(await page.locator("[data-modal-product]").inputValue()==="Fotospiegel","Gallery did not retain product filter at "+width);
  const destination=await page.locator("[data-modal-link]").getAttribute("href");
  check(destination?.includes("produkt=Fotospiegel")&&destination.includes("vorlage=FP-"),"Gallery choice did not link to live enquiry at "+width);
  check(errors.length===0,"Browser console errors at "+width+": "+JSON.stringify(errors));
  await context.close();
 }
 console.log("PASS: "+total+" Studio 9.0 checks: real form markup, gallery preselection, 44 templates, validation, error recovery, POST payload, mobile layout and product-to-gallery navigation.");
}finally{await browser.close()}
