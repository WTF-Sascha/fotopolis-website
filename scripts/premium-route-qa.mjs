import {chromium} from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const base=process.env.SITE_BASE_URL || "http://127.0.0.1:8766/";
const routes=["fotobox","fotospiegel","fotowohnwagen","pakete","galerie","anlaesse","ueber-uns","faq","kontakt","impressum","datenschutz"];
const output="concepts/premium-v2/qa-screenshots/route-review";
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const results=[];
const check=(name,pass,detail="")=>{results.push({name,pass:!!pass,detail});console.log(pass?"PASS":"FAIL",name,detail);};
for(const width of [375,1440]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:"reduce"});
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  for(const slug of routes){
    const response=await page.goto(new URL(slug+"/",base).toString(),{waitUntil:"networkidle",timeout:30000});
    await page.evaluate(()=>{for(const img of document.images)img.loading="eager"});
    await page.waitForFunction(()=>[...document.images].every(x=>x.complete),{timeout:15000});
    const data=await page.evaluate(()=>({
      h1:document.querySelectorAll("main h1").length,
      page:!!document.querySelector(".page-hero"),
      logo:document.querySelector(".identity img")?.getAttribute("src"),
      overflow:document.documentElement.scrollWidth > innerWidth+2,
      broken:[...document.images].filter(x=>!x.naturalWidth).map(x=>x.getAttribute("src")),
      path:location.pathname,
      placeholder:document.body.innerText.includes("Hier entsteht die Seite")
    }));
    check(width+" "+slug+" HTTP 200",response?.status()===200,String(response?.status()));
    check(width+" "+slug+" valid page shell",data.h1===1&&data.page&&data.path==="/"+slug+"/",JSON.stringify(data));
    check(width+" "+slug+" original logo",data.logo==="/assets/fotopolis-logo-original.png");
    check(width+" "+slug+" no overflow",!data.overflow);
    check(width+" "+slug+" images decode",data.broken.length===0,data.broken.join(","));
    check(width+" "+slug+" real content",!data.placeholder);
    if(["fotobox","fotowohnwagen","faq","kontakt"].includes(slug))
      await page.screenshot({path:path.join(output,slug+"-"+width+".png"),fullPage:true,animations:"disabled"});
  }
  await page.goto(base,{waitUntil:"domcontentloaded"});
  const toggle=page.locator("[data-menu-toggle]");
  const trigger=page.locator(".nav-trigger").first();
  if(width<=1100){
    check(width+" hamburger visible",await toggle.isVisible());
    await toggle.click();
    check(width+" mobile nav opens",await toggle.getAttribute("aria-expanded")==="true");
  }else{
    check(width+" desktop menu visible",await trigger.isVisible());
  }
  await trigger.click();
  check(width+" submenu expands",await trigger.getAttribute("aria-expanded")==="true");
  check(width+" dropdown visible",await page.locator("#nav-erlebnisse a").first().isVisible());
  await page.keyboard.press("Escape");
  check(width+" Escape closes submenu",await trigger.getAttribute("aria-expanded")==="false");
  check(width+" focus returns to trigger",await trigger.evaluate(el=>document.activeElement===el));
  if(width<=1100){
    await page.keyboard.press("Escape");
    check(width+" Escape closes mobile nav",await toggle.getAttribute("aria-expanded")==="false");
    check(width+" focus returns to hamburger",await toggle.evaluate(el=>document.activeElement===el));
  }
  check(width+" zero JS errors",errors.length===0,errors.join("; "));
  await page.close();
}
await browser.close();
const failures=results.filter(x=>!x.pass);
await fs.writeFile(path.join(output,"report.json"),JSON.stringify({total:results.length,passed:results.length-failures.length,failures},null,2));
console.log("ROUTE_QA",JSON.stringify({total:results.length,failures:failures.length}));
if(failures.length)process.exitCode=1;
