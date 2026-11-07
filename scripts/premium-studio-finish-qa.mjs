import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const base=process.env.SITE_BASE_URL||"http://127.0.0.1:8766/";
const widths=[320,375,430,768,900,1100,1440,1920];
const out="concepts/premium-v2/qa-screenshots/studio-finish";
const results=[],images=[];
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
function check(name,pass,details=""){
 const ok=!!pass;results.push({name,pass:ok,details});
 if(!ok)console.error("STUDIO_FINISH_FAIL",name,details);
}
for (const width of widths){
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:"reduce"});
 const errors=[],writes=[];
 page.on("pageerror",err=>errors.push(err.message));
 page.on("request",request=>{if(!["GET","HEAD"].includes(request.method())) writes.push(request.method()+" "+request.url());});
 const visit=route=>page.goto(new URL(route,base).toString(),{waitUntil:"networkidle",timeout:40000});
 await visit("");
 const home=await page.evaluate(()=>({
   heroCTAs:[...document.querySelectorAll(".v45-hero .v4-hero-actions a")].map(x=>x.getAttribute("href")),
   productOrder:[...document.querySelectorAll(".v4-product-card")].map(x=>x.id),
   productRoutes:[...document.querySelectorAll(".v4-product-card")].map(x=>x.getAttribute("href")),
   sections:document.querySelectorAll("main > section").length,
   deprecated:document.querySelectorAll("#studio-berater,.studio-advisor,.home-trust,.v4-hero-meta,.v4-advantages,.v4-date-cta,.gallery.section").length
 }));
 check(width+" no discovery CTA",home.heroCTAs.length===0);
 check(width+" products in approved order",home.productOrder.join(",")==="fotobox,fotospiegel,fotowohnwagen");
 check(width+" dedicated product routes",home.productRoutes.join(",")==="/fotobox/,/fotospiegel/,/fotowohnwagen/");
 check(width+" only three public home sections",home.sections===3&&home.deprecated===0);
 check(width+" bottom enquiry CTA",(await page.locator(".v45-final-cta a.button").getAttribute("href"))==="/kontakt/");
 // Contact must not repeat hero, route-jumps, and a second closing conversion card.
 const res=await visit("kontakt/?produkt=Fotowohnwagen&anlass=Motto-%20%2F%20Gartenparty");
 check(width+" contact HTTP 200",res.status()===200);
 const formFacts=await page.evaluate(()=>{
   const first=document.querySelector('[data-contact-step="1"]');
   const firstField=first?.querySelector("select");
   const r=firstField?.getBoundingClientRect();
   return {
     overflow:document.documentElement.scrollWidth>innerWidth+2,
     firstFieldTop:r?.top,
     sidebars:document.querySelectorAll(".page-aside").length,
     routeNav:document.querySelectorAll(".studio-route-jumps").length,
     closingSections:document.querySelectorAll(".page-end").length,
     wizardSteps:document.querySelectorAll("[data-contact-step]").length,
     version:document.querySelector(".review-bar")?.textContent||""
   };
 });
 check(width+" concise conversion page",formFacts.sidebars===0&&formFacts.routeNav===0&&formFacts.closingSections===0,JSON.stringify(formFacts));
 check(width+" contact no overflow",!formFacts.overflow);
 check(width+" three-step wizard intact",formFacts.wizardSteps===3);
 if(width<=430)check(width+" event form begins above first fold",formFacts.firstFieldTop<890,JSON.stringify(formFacts));
 check(width+" product preselected",await page.locator('select[name="produkt"]').inputValue()==="Fotowohnwagen");
 check(width+" occasion preselected",await page.locator('select[name="anlass"]').inputValue()==="Motto- / Gartenparty");
 await page.locator("[data-contact-next]").click();
 check(width+" step2 opened",await page.locator('[data-contact-step="2"]').isVisible());
 await page.locator('[name="name"]').fill("Testperson");
 await page.locator('[name="email"]').fill("test@example.org");
 await page.locator('[name="kontaktweg"]').selectOption("Telefon (Rückrufwunsch)");
 check(width+" callback phone becomes mandatory",await page.locator('[name="telefon"]').getAttribute("aria-required")==="true"&&
       await page.locator('[name="telefon"]').evaluate(el=>el.required));
 await page.locator("[data-contact-next]").click();
 check(width+" callback without number is blocked",await page.locator('[data-contact-step="2"]').isVisible()&&
       (await page.locator("[data-contact-inline-status]").innerText()).includes("Pflichtfelder"));
 await page.locator('[name="telefon"]').fill("02581 123456");
 await page.locator("[data-contact-next]").click();
 check(width+" callback with number advances",await page.locator('[data-contact-step="3"]').isVisible());
 const preview=await page.locator("[data-contact-summary]").innerText();
 check(width+" callback number in local summary",preview.includes("02581 123456"));
 check(width+" visitor data never transmitted",writes.length===0,writes.join("|"));
 if([320,768,1440].includes(width)){
  await page.evaluate(async()=>{
    for(const i of document.images)i.loading="eager";
    await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));
    if(document.activeElement instanceof HTMLElement)document.activeElement.blur();
    window.scrollTo({top:0,behavior:"instant"});
  });
  await page.waitForFunction(()=>window.scrollY===0);
  const filename="kontakt-"+width+".png";
  await page.screenshot({path:path.join(out,filename),fullPage:true,animations:"disabled"});
  images.push(filename);
 }
 // Repeated generic panels removed on nonproduct routes, still retained where relevant.
 for(const route of ["faq/","galerie/","anlaesse/","ueber-uns/","pakete/","datenschutz/","impressum/"]){
  await visit(route);
  const panels=await page.locator(".page-aside").count();
  const endings=await page.locator(".page-end").count();
  check(width+" "+route+" no repeated sidebar/end",panels===0&&endings===0);
  check(width+" "+route+" no fixed CTA occlusion",await page.locator(".mobile-quick-cta").count()===0);
  const bad=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
  check(width+" "+route+" no horizontal overflow",!bad);
  if(route==="faq/"&&[320,1440].includes(width)){
   const filename="faq-"+width+".png";
   await page.screenshot({path:path.join(out,filename),fullPage:true,animations:"disabled"});
   images.push(filename);
  }
 }
 for(const [route,label] of [["fotobox/","Fotobox"],["fotospiegel/","Fotospiegel"],["fotowohnwagen/","Fotowohnwagen"]]){
  await visit(route);
  check(width+" "+route+" no generic context panel",await page.locator(".page-aside,.page-end,.product-stage-media").count()===0);
  check(width+" "+route+" inline enquiry",(await page.locator("[data-product-request]").count())===1);
  check(width+" "+route+" correct product in request",(await page.locator("[data-product-request]").getAttribute("data-product"))===label);
  check(width+" "+route+" no floating CTA",await page.locator(".mobile-quick-cta").count()===0);
  check(width+" "+route+" hero request anchor",(await page.locator('.v4-page-actions .button.gold').getAttribute("href"))==="#terminanfrage");
  check(width+" "+route+" unique enquiry section",(await page.locator("#terminanfrage").count())===1);
 }
 check(width+" no JS runtime errors",errors.length===0,errors.join("|"));
 await page.close();
}
await browser.close();
const failed=results.filter(x=>!x.pass);
const report={total:results.length,passed:results.length-failed.length,failed:failed.length,failures:failed,screenshots:images,manualReview:true};
await fs.writeFile(path.join(out,"report.json"),JSON.stringify(report,null,2));
console.log("STUDIO_FINISH_QA",JSON.stringify({total:report.total,passed:report.passed,failed:report.failed,screenshots:images.length}));
if(failed.length)process.exitCode=1;
