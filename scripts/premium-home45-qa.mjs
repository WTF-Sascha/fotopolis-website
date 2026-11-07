import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

// FOTOPOLIS Update 4.5 - isolated, responsive homepage regression gate.
// This replaces the retired "beige info band" check: the band should not exist.
const base=process.env.SITE_BASE_URL||"http://127.0.0.1:8766/";
const out="concepts/premium-v2/qa-screenshots/home45";
const widths=[320,360,375,390,412,430,600,760,768,900,1024,1100,1280,1440,1920];
const shots=[320,375,430,768,1440,1920];
const results=[],screenshots=[];
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const check=(width,label,pass,detail="")=>{
 const ok=Boolean(pass);
 results.push({width,label,pass:ok,detail});
 if(!ok)console.error("HOME45_FAIL",width,label,JSON.stringify(detail).slice(0,600));
};
for(const width of widths){
 const page=await browser.newPage({
  viewport:{width,height:width<=430?800:920},deviceScaleFactor:1,reducedMotion:"reduce",
  isMobile:width<=760,hasTouch:width<=760
 });
 const errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 const res=await page.goto(base,{waitUntil:"networkidle",timeout:40000});
 await page.evaluate(async()=>{
  for(const img of document.images)img.loading="eager";
  await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));
  document.documentElement.style.scrollBehavior="auto";
  scrollTo(0,0);
 });
 const facts=await page.evaluate(()=>{
  const rect=el=>{
   if(!el)return null;
   const r=el.getBoundingClientRect();
   return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height};
  };
  const header=rect(document.querySelector(".site-header"));
  const hero=rect(document.querySelector(".v45-hero"));
  const h1=rect(document.querySelector(".v45-hero h1"));
  const cards=[...document.querySelectorAll(".v4-product-card")];
  const nav=document.querySelector(".v4-mobile-nav");
  const links=[...document.querySelectorAll(".v45-hero .v4-hero-actions a")].map(a=>a.getAttribute("href"));
  const productItems=cards.map(c=>{
   const image=c.querySelector("img"),title=c.querySelector("h3");
   return {
    id:c.id,href:c.getAttribute("href"),aria:c.getAttribute("aria-label"),
    image:image?.getAttribute("src"),alt:image?.alt,naturalWidth:image?.naturalWidth,
    fit:image?getComputedStyle(image).objectFit:null,filter:image?getComputedStyle(image).filter:null,
    title:title?.textContent.trim(),textH:title?.getBoundingClientRect().height,
    titleScroll:title?.scrollHeight,cardWidth:c.getBoundingClientRect().width,
    cardOverflow:c.scrollWidth-c.clientWidth
   };
  });
  const anchors=[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute("href")).filter(x=>x.length>1&&!document.getElementById(x.slice(1)));
  const final=document.querySelector(".v45-final-cta");
  return {
   scrollWidth:document.documentElement.scrollWidth,innerWidth,
   sections:document.querySelectorAll("main > section").length,
   h1s:document.querySelectorAll("main h1").length,
   header,hero,h1,heroHeadline:document.querySelector(".v45-hero h1")?.textContent,
   heroLinks:links,bodyExists:!!final,
   legacy:document.querySelectorAll(".studio-advisor,#studio-berater,.v4-hero-meta,.v4-advantages,.v4-date-cta,.home-trust,main > .gallery").length,
   legacyJS:!!document.querySelector('script[src*="studio-guide"]'),
   order:productItems.map(c=>c.id),cards:productItems,
   navVisible:nav?getComputedStyle(nav).display!=="none":false,
   brokenImages:[...document.images].filter(img=>!img.complete||img.naturalWidth===0).map(i=>i.getAttribute("src")),
   badAnchors:anchors,
   closingHref:final?.querySelector("a.button")?.getAttribute("href")
  };
 });
 check(width,"HTTP 200",res.status()===200,res.status());
 check(width,"three page sections",facts.sections===3,facts.sections);
 check(width,"only one hero action",JSON.stringify(facts.heroLinks)===JSON.stringify(["#erlebnisse"]),facts.heroLinks);
 check(width,"headline fully starts below sticky header",facts.h1&&facts.hero&&facts.header&&facts.h1.top>facts.hero.top+24&&facts.hero.top>=facts.header.bottom-2&&facts.h1.bottom<facts.hero.bottom-20,{hero:facts.hero,h1:facts.h1,header:facts.header});
 check(width,"one visible H1",facts.h1s===1&&facts.heroHeadline?.includes("Momente,"));
 check(width,"deleted recommendation and duplicate sections",facts.legacy===0&&!facts.legacyJS,facts.legacy);
 check(width,"correct order",facts.order.join(",")==="fotobox,fotowohnwagen,fotospiegel",facts.order);
 check(width,"direct product detail routes",facts.cards.every(x=>x.href==="/"+x.id+"/"));
 check(width,"all product media loaded",facts.cards.every(x=>x.naturalWidth>0)&&facts.brokenImages.length===0,facts.brokenImages);
 check(width,"equipment photos never cropped or recolored",facts.cards.every(x=>x.fit==="contain"&&x.filter==="none"),facts.cards);
 check(width,"product titles fit cards",facts.cards.every(x=>x.cardOverflow<=3&&x.titleScroll<=x.textH+3),facts.cards);
 check(width,"product cards accessible",facts.cards.every(x=>x.aria&&x.alt&&x.title));
 check(width,"no body horizontal overflow",facts.scrollWidth<=facts.innerWidth+2,facts.scrollWidth);
 check(width,"working in-page anchors",facts.badAnchors.length===0,facts.badAnchors);
 check(width,"single final contact CTA",facts.bodyExists&&facts.closingHref==="/kontakt/");
 check(width,"mobile nav responsive",facts.navVisible===(width<=760));
 check(width,"no runtime errors",errors.length===0,errors);
 if(shots.includes(width)){
  await page.evaluate(()=>window.scrollTo({top:0,behavior:"instant"}));
  const fold="home45-"+width+"-fold.png";
  const full="home45-"+width+"-full.png";
  await page.screenshot({path:path.join(out,fold),fullPage:false,animations:"disabled"});
  await page.screenshot({path:path.join(out,full),fullPage:true,animations:"disabled"});
  screenshots.push(fold,full);
 }
 if(width<=760){
  const rail=page.locator("[data-v4-track]");
  const next=page.locator("[data-v4-next]");
  const prev=page.locator("[data-v4-prev]");
  check(width,"rail has overflow",await rail.evaluate(el=>el.scrollWidth>el.clientWidth+5));
  const before=await rail.evaluate(el=>el.scrollLeft);
  await next.click();
  await page.waitForTimeout(100);
  const after=await rail.evaluate(el=>el.scrollLeft);
  check(width,"next button scrolls",after>before,{before,after});
  await prev.click();
  await page.waitForTimeout(100);
  const back=await rail.evaluate(el=>el.scrollLeft);
  check(width,"previous button scrolls back",back<after,{after,back});
 }
 await page.locator(".v45-hero .v4-hero-actions a").click();
 check(width,"hero CTA jumps to products",new URL(page.url()).hash==="#erlebnisse",page.url());
 const visible=await page.evaluate(()=>{
  const title=document.querySelector("#experiences-title")?.getBoundingClientRect();
  const header=document.querySelector(".site-header")?.getBoundingClientRect();
  return !!title&&title.top>=header.bottom-14&&title.top<innerHeight-50;
 });
 check(width,"product heading accessible after jump",visible);
 await page.locator(".v45-final-cta a.button").click();
 check(width,"bottom CTA opens contact page",new URL(page.url()).pathname==="/kontakt/",page.url());
 if([375,1024].includes(width)){
  for(const slug of ["fotobox","fotowohnwagen","fotospiegel"]){
   await page.goto(base,{waitUntil:"networkidle"});
   await page.locator('.v4-product-card#'+slug).click();
   check(width,slug+" card routes to detail",new URL(page.url()).pathname==="/"+slug+"/",page.url());
  }
 }
 await page.close();
}
await browser.close();
const failures=results.filter(x=>!x.pass);
const report={version:"4.5",viewportCount:widths.length,total:results.length,passed:results.length-failures.length,failed:failures.length,failures,screenshots,requiresHumanScreenshotReview:true};
await fs.writeFile(path.join(out,"report.json"),JSON.stringify(report,null,2));
console.log("HOME45_QA",JSON.stringify({widths:widths.length,total:report.total,failed:report.failed,screenshots:screenshots.length}));
if(failures.length)process.exitCode=1;
