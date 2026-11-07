import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
/* Reference Edition 4.0 browser QA: real renders, swipe, logo integrity, touch UX.
   The assertions intentionally test the approved new design, not the retired
   photo-free hero or editorial spotlight structure. */
const base=process.env.SITE_BASE_URL || "http://127.0.0.1:8765/concepts/premium-v2/";
const out=process.env.QA_OUT_DIR || "concepts/premium-v2/qa-screenshots";
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const sizes=[["mobile-320",320,700],["mobile-375",375,812],["tablet-768",768,1024],["laptop-1024",1024,768],["desktop-1440",1440,900]];
const checks=[];
function check(name,ok,info=""){checks.push({name,passed:!!ok,info});console.log(ok?"PASS":"FAIL",name,info)}
for(const [label,width,height] of sizes){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,reducedMotion:"reduce"});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 const response=await page.goto(base,{waitUntil:"networkidle",timeout:40000});
 await page.evaluate(()=>{for(const img of document.images)if(img.loading==="lazy")img.loading="eager"});
 await page.waitForFunction(()=>[...document.images].every(img=>img.complete),{timeout:20000});
 await page.evaluate(async()=>Promise.all([...document.images].map(x=>x.decode().catch(()=>{}))));
 await page.locator(".v4-product-card").last().scrollIntoViewIfNeeded();
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:path.join(out,label+"-fold.png"),fullPage:false,animations:"disabled"});
 await page.screenshot({path:path.join(out,label+".png"),fullPage:true,animations:"disabled"});
 const info=await page.evaluate(()=>{
  const cards=[...document.querySelectorAll(".v4-product-card")];
  const images=[...document.images];
  const hero=document.querySelector(".v4-hero");
  const track=document.querySelector(".v4-product-track");
  const rect=track?.getBoundingClientRect();
  return {
   pageWidth:document.documentElement.scrollWidth,viewport:innerWidth,
   logo:document.querySelector(".identity img")?.getAttribute("src"),
   h1:document.querySelectorAll("main h1").length,
   heroImage:hero?.querySelector("img")?.getAttribute("src"),
   heroHeight:hero?.getBoundingClientRect().height,
   heroCTAs:[...document.querySelectorAll(".v4-hero-actions a")].map(a=>a.getAttribute("href")),
   productCards:cards.map(card=>({id:card.id,href:card.getAttribute("href"),image:card.querySelector("img")?.getAttribute("src"),alt:card.querySelector("img")?.alt,status:card.getAttribute("data-asset-status")})),
   allImages:images.map(i=>({src:i.getAttribute("src"),valid:i.complete&&i.naturalWidth>0,filter:getComputedStyle(i).filter})),
   productFilters:cards.map(x=>getComputedStyle(x.querySelector("img")).filter),
   mobileNavCount:document.querySelectorAll(".v4-mobile-nav a").length,
   mobileNavVisible:document.querySelector(".v4-mobile-nav")?getComputedStyle(document.querySelector(".v4-mobile-nav")).display!=="none":false,
   railScrollable:track?.scrollWidth>track?.clientWidth+5,
   railBounds:{width:Math.round(rect?.width||0)},
   brokenAnchors:[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute("href")).filter(h=>h.length>1&&!document.getElementById(h.slice(1)))
  };
 });
 check(label+" HTTP",response?.status()===200,String(response?.status()));
 check(label+" no body overflow",info.pageWidth<=width+2,info.pageWidth+" / "+width);
 check(label+" original approved logo",["../../site/assets/fotopolis-logo-original.png","/assets/fotopolis-logo-original.png"].includes(info.logo),info.logo);
 check(label+" photographic hero",info.heroImage?.includes("fotobox-event-1672.webp"),info.heroImage);
 check(label+" two working hero CTAs",JSON.stringify(info.heroCTAs)===JSON.stringify(["/kontakt/","#erlebnisse"]),JSON.stringify(info.heroCTAs));
 check(label+" 3 product cards with real routes",JSON.stringify(info.productCards.map(x=>x.id))===JSON.stringify(["fotobox","fotospiegel","fotowohnwagen"])&&info.productCards.every(x=>x.href==="/"+x.id+"/"),JSON.stringify(info.productCards.map(x=>x.id)));
 check(label+" approved device images",info.productCards[0].image?.includes("fotobox-event-1672.webp")&&info.productCards[1].image?.includes("fotospiegel-hero-lossless.webp")&&info.productCards[2].image?.includes("fotowohnwagen-gartenparty-1448.webp"));
 check(label+" approved uploads unchanged",info.productCards[0].status==="approved-user-upload"&&info.productCards[2].status==="approved-user-upload");
 check(label+" imagery completely loaded",info.allImages.every(x=>x.valid),info.allImages.filter(x=>!x.valid).map(x=>x.src).join(","));
 check(label+" imagery not recolored",info.productFilters.every(x=>x==="none"));
 check(label+" descriptive alt for products",info.productCards.every(x=>x.alt?.length>22));
 check(label+" mobile navigation has 5 links",info.mobileNavCount===5);
 check(label+" mobile nav visibility",info.mobileNavVisible===(width<=760));
 check(label+" mobile product swipe",info.railScrollable===(width<=760));
 check(label+" no broken in-page anchors",info.brokenAnchors.length===0,info.brokenAnchors.join(","));
 check(label+" one real H1",info.h1===1,String(info.h1));
 check(label+" no uncaught JS errors",errors.length===0,errors.join(" | "));
 if(width>=1024)check(label+" hero balanced",info.heroHeight<=800,String(info.heroHeight));
 if(width<=760){
  const before=await page.locator(".v4-product-track").evaluate(el=>el.scrollLeft);
  await page.locator(".v4-product-track").evaluate(el=>{el.scrollLeft=Math.round(el.clientWidth*.9)});
  const after=await page.locator(".v4-product-track").evaluate(el=>el.scrollLeft);
  check(label+" rail actually moves with swipe equivalent",after>before,String(before)+" → "+after);
 }
 if(width<=1100){
  const toggle=page.locator("[data-menu-toggle]");
  check(label+" menu toggle visible",await toggle.isVisible());
  await toggle.click();
  check(label+" menu open",await toggle.getAttribute("aria-expanded")==="true");
  await page.keyboard.press("Escape");
  check(label+" menu closes by Escape",await toggle.getAttribute("aria-expanded")==="false");
 }
 await page.locator('.v4-hero-actions a[href="#erlebnisse"]').click();
 check(label+" hero discovery anchor",new URL(page.url()).hash==="#erlebnisse",page.url());
 if(width===1440){
  for(const id of ["fotobox","fotospiegel","fotowohnwagen"]){
   await page.locator(".v4-product-card#"+id).screenshot({path:path.join(out,"desktop-1440-product-"+id+".png"),animations:"disabled"});
  }
 }
 await page.close();
}
await browser.close();
const failures=checks.filter(x=>!x.passed);
await fs.writeFile(path.join(out,"report.json"),JSON.stringify({total:checks.length,passed:checks.length-failures.length,failures,checks},null,2));
console.log("SUMMARY",JSON.stringify({total:checks.length,passed:checks.length-failures.length,failed:failures.length}));
if(failures.length)process.exitCode=1;
