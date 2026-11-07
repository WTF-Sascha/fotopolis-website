import {chromium} from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const base=process.env.SITE_BASE_URL || "http://127.0.0.1:8766/";
const out="concepts/premium-v2/qa-screenshots/package-review";
const widths=[320,375,768,1100,1440,1920];
const results=[];
const screenshots=[];
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
function check(label,value,details=""){
  const pass=!!value;
  results.push({label,pass,details});
  if(!pass)console.error("PACKAGE_QA_FAIL",label,details);
}
for(const width of widths){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:"reduce"});
  const errors=[],writes=[];
  page.on("pageerror",err=>errors.push(err.message));
  page.on("request",req=>{
    if(!["GET","HEAD"].includes(req.method()))writes.push(req.method()+" "+req.url());
  });
  const response=await page.goto(new URL("pakete/",base).toString(),{waitUntil:"networkidle",timeout:40000});
  const facts=await page.evaluate(()=>{
    const rect=selector=>{const element=document.querySelector(selector);if(!element)return null;const r=element.getBoundingClientRect();return{x:r.x,y:r.y,r:r.right,b:r.bottom,w:r.width,h:r.height};};
    const a=rect(".planner-form .planner-fieldset");
    const b=rect(".planner-result");
    const overlap=(a,b)=>a&&b&&a.r>b.x+1&&b.r>a.x+1&&a.b>b.y+1&&b.b>a.y+1;
    const interactive=[...document.querySelectorAll('.package-planner input,.package-planner select,.package-planner textarea,.planner-actions .button')];
    return {
      heading:document.querySelectorAll("main h1").length,
      cards:document.querySelectorAll(".package-card").length,
      services:document.querySelectorAll(".service-panel").length,
      rows:document.querySelectorAll(".compare-table tbody tr").length,
      radio:document.querySelectorAll(".planner-product input[type=radio]").length,
      wishes:document.querySelectorAll(".planner-wish input[type=checkbox]").length,
      summary:document.querySelector("[data-planner-summary]")?.textContent||"",
      visible:!!document.querySelector("[data-package-planner]"),
      script:!!document.querySelector('script[src="/package-planner.js"]'),
      overflow:document.documentElement.scrollWidth > innerWidth+2,
      layoutOverlap:innerWidth>850&&overlap(a,b),
      clipping:[...document.querySelectorAll(".service-panel,.planner-result,.planner-wish,.planner-product,.package-card")].filter(x=>x.scrollWidth>x.clientWidth+3).map(x=>x.className),
      smallTargets:interactive.filter(x=>{const r=x.getBoundingClientRect();return r.height>0&&r.height<18}).map(x=>x.outerHTML.slice(0,70)),
      footer:!!document.querySelector(".footer-navigation"),
      noPricePromise:!document.querySelector(".package-card [data-price]")
    };
  });
  const prefix=width+"px";
  check(prefix+" HTTP",response?.status()===200,String(response?.status()));
  check(prefix+" structured catalogue",facts.heading===1&&facts.cards===3&&facts.services===5&&facts.rows===5,JSON.stringify(facts));
  check(prefix+" planner inputs",facts.visible&&facts.script&&facts.radio===3&&facts.wishes===6);
  check(prefix+" no overflow",!facts.overflow);
  check(prefix+" no overlap",!facts.layoutOverlap);
  check(prefix+" no clipped content",facts.clipping.length===0,facts.clipping.join(", "));
  check(prefix+" summary seeded",facts.summary.includes("Fotoerlebnis: Fotobox"));
  check(prefix+" no fictitious prices",facts.noPricePromise);
  check(prefix+" footer",facts.footer);
  check(prefix+" form has no action",await page.locator("[data-package-planner]").getAttribute("action")===null);
  await page.locator('input[name="produkt"][value="Fotospiegel"]').check();
  check(prefix+" radio changes summary",(await page.locator("[data-planner-summary]").innerText()).includes("Fotoerlebnis: Fotospiegel"));
  await page.locator('select[name="dauer"]').selectOption("4–6 Stunden gewünscht");
  await page.locator('input[name="datum"]').fill("2027-05-09");
  await page.locator('input[name="ort"]').fill("Ahlen");
  await page.locator('input[name="wunsch"][value="Fotodruck prüfen"]').check();
  await page.locator('textarea[name="nachricht"]').fill("Layout passend zum Event");
  const summary=await page.locator("[data-planner-summary]").innerText();
  check(prefix+" requested fields reflected",
    ["Fotospiegel","4–6 Stunden","2027-05-09","Ahlen","Fotodruck prüfen","Layout passend zum Event"].every(x=>summary.includes(x)),summary);
  const href=await page.locator("[data-planner-email]").getAttribute("href");
  check(prefix+" email contains encoded selection",
    href?.startsWith("mailto:kontakt@fotopolis-mieten.de?")&&
    decodeURIComponent(href).includes("Fotospiegel")&&decodeURIComponent(href).includes("2027-05-09"));
  check(prefix+" email does not confirm reservation",decodeURIComponent(href||"").includes("keine Reservierung"));
  check(prefix+" no data sent",writes.length===0,writes.join(", "));
  check(prefix+" no script errors",errors.length===0,errors.join(", "));
  // Selecting a profile must preselect the matching product without navigation.
  await page.locator('[data-package-choice="Fotowohnwagen"]').click();
  check(prefix+" package CTA preselects camper",
    await page.locator('input[name="produkt"][value="Fotowohnwagen"]').isChecked());
  check(prefix+" CTA stays on packages page",new URL(page.url()).pathname==="/pakete/");
  if([320,768,1440].includes(width)){
    const file="pakete-2_7-"+width+".png";
    await page.screenshot({path:path.join(out,file),fullPage:true,animations:"disabled"});
    screenshots.push(file);
  }
  await page.close();
}
await browser.close();
const failures=results.filter(x=>!x.pass);
await fs.writeFile(path.join(out,"report.json"),JSON.stringify({
  widthCount:widths.length,checks:results.length,passed:results.length-failures.length,
  failures,screenshots,requiredHumanReview:true
},null,2));
console.log("PACKAGE_QA",JSON.stringify({checks:results.length,passed:results.length-failures.length,failed:failures.length,screenshots:screenshots.length}));
if(failures.length)process.exitCode=1;
