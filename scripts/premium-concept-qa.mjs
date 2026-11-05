import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
const base="http://127.0.0.1:8765/concepts/premium-v2/";
const out="concepts/premium-v2/qa-screenshots";
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const sizes=[["mobile-320",320,700],["mobile-375",375,812],["tablet-768",768,1024],["laptop-1024",1024,768],["desktop-1440",1440,900]];
const results=[];
function check(name,ok,info){results.push({name,passed:!!ok,info});console.log(ok?"PASS":"FAIL",name,info||"");}
for(const [label,width,height] of sizes){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,reducedMotion:"reduce"});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  const res=await page.goto(base,{waitUntil:"networkidle",timeout:40000});
  await page.screenshot({path:path.join(out,label+".png"),fullPage:true,animations:"disabled"});
  await page.screenshot({path:path.join(out,label+"-fold.png"),fullPage:false,animations:"disabled"});
  const info=await page.evaluate(()=>({
    pageWidth:document.documentElement.scrollWidth,
    viewport:window.innerWidth,
    allImages:[...document.images].map(x=>({src:x.getAttribute("src"),ok:x.complete&&x.naturalWidth>0})),
    headingCount:document.querySelectorAll("main h1").length,
    headline:document.querySelector("h1")?.innerText,
    heroImg:document.querySelector(".hero-photo img")?.getAttribute("src"),
    logo:document.querySelector(".identity img")?.getAttribute("src"),
    fonts:document.fonts.status,
    navWidth:document.querySelector(".nav-shell")?.getBoundingClientRect().width
  }));
  check(label+" HTTP",res?.status()===200,String(res?.status()));
  check(label+" no horizontal overflow",info.pageWidth<=width+2,info.pageWidth+" / "+width);
  check(label+" real images loaded",info.allImages.every(x=>x.ok),info.allImages.filter(x=>!x.ok).map(x=>x.src).join(", "));
  check(label+" approved logo",info.logo==="../../site/assets/fotopolis-logo-original.png",info.logo);
  check(label+" one H1",info.headingCount===1,String(info.headingCount));
  check(label+" JS runtime",errors.length===0,errors.join(" | "));
  if(width<=768){
    const toggle=page.locator("[data-menu-toggle]");
    check(label+" mobile toggle visible",await toggle.isVisible());
    await toggle.click();
    check(label+" menu opens",await toggle.getAttribute("aria-expanded")==="true");
    await page.keyboard.press("Escape");
    check(label+" menu escape",await toggle.getAttribute("aria-expanded")==="false");
  }
  await page.close();
}
await browser.close();
const failures=results.filter(x=>!x.passed);
await fs.writeFile(path.join(out,"report.json"),JSON.stringify({date:new Date().toISOString(),pass:results.length-failures.length,total:results.length,failures,results},null,2));
console.log("SUMMARY",JSON.stringify({total:results.length,passed:results.length-failures.length,failed:failures.length}));
if(failures.length)process.exitCode=1;