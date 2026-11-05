import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
const base=process.env.SITE_BASE_URL || "http://127.0.0.1:8765/concepts/premium-v2/";
const out=process.env.QA_OUT_DIR || "concepts/premium-v2/qa-screenshots";
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const sizes=[["mobile-320",320,700],["mobile-375",375,812],["tablet-768",768,1024],["laptop-1024",1024,768],["desktop-1440",1440,900]];
const results=[];
function check(name,ok,info){results.push({name,passed:!!ok,info});console.log(ok?"PASS":"FAIL",name,info||"");}
for(const [label,width,height] of sizes){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,reducedMotion:"reduce"});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  const res=await page.goto(base,{waitUntil:"networkidle",timeout:40000});
  // Force lazy gallery images to load before full-page screenshot and integrity checks.
  await page.evaluate(()=>{for(const img of document.images)if(img.loading==="lazy")img.loading="eager"});
  await page.waitForFunction(()=>[...document.images].every(img=>img.complete),{timeout:20000});
  // Browser-level decode and real scroll are necessary for reliable screenshots
  // of lazy-loaded product imagery (network completion alone is insufficient).
  await page.evaluate(async()=>{await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})))});
  for(const target of [".spotlight-image img","[data-product-image='fotobox']",".mirror-card-photo img"]){
    await page.locator(target).scrollIntoViewIfNeeded();
  }
  await page.evaluate(async()=>{await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})))});
  await page.evaluate(()=>window.scrollTo(0,0));
  // Capture the first viewport before fullPage screenshot scrolls the browser internally.
  await page.screenshot({path:path.join(out,label+"-fold.png"),fullPage:false,animations:"disabled"});
  await page.screenshot({path:path.join(out,label+".png"),fullPage:true,animations:"disabled"});
  if(width===1440){
    for(const [name,selector] of [
      ["desktop-1440-product-spotlight",".spotlight"],
      ["desktop-1440-product-fotobox","[data-product='fotobox']"],
      ["desktop-1440-product-fotospiegel",".duo .experience-card:nth-child(2)"]]){
      await page.locator(selector).screenshot({path:path.join(out,name+".png"),animations:"disabled"});
    }
  }

  const info=await page.evaluate(()=>({
    pageWidth:document.documentElement.scrollWidth,
    viewport:window.innerWidth,
    allImages:[...document.images].map(x=>({src:x.getAttribute("src"),ok:x.complete&&x.naturalWidth>0})),
    headingCount:document.querySelectorAll("main h1").length,
    headline:document.querySelector("h1")?.innerText,
    heroImageCount:document.querySelectorAll(".hero img").length,
    heroGuideLinks:[...document.querySelectorAll(".hero-guide-link")].map(x=>x.getAttribute("href")),
    heroCTAs:[...document.querySelectorAll(".hero-buttons a")].map(x=>x.getAttribute("href")),
    heroStyle:getComputedStyle(document.querySelector(".hero")).backgroundImage,
    logo:document.querySelector(".identity img")?.getAttribute("src"),
    fonts:document.fonts.status,
    navWidth:document.querySelector(".nav-shell")?.getBoundingClientRect().width,
    heroHeight:document.querySelector(".hero")?.getBoundingClientRect().height,
    mirrorObjectFit:getComputedStyle(document.querySelector(".mirror-card-photo img")).objectFit,
    mirrorFilter:getComputedStyle(document.querySelector(".mirror-card-photo img")).filter,
    wohnwagenObjectFit:getComputedStyle(document.querySelector(".spotlight-image img")).objectFit,
    wohnwagenFilter:getComputedStyle(document.querySelector(".spotlight-image img")).filter,
    wohnwagenStatus:document.querySelector("[data-product-image='fotowohnwagen']")?.getAttribute("data-asset-status"),
    fotoboxCardStatus:document.querySelector("[data-product='fotobox']")?.getAttribute("data-asset-status"),
    fotoboxHasWrongLegacyImage:!!document.querySelector("[data-product='fotobox'] img[src*='LEG-019']"),
    fotoboxHasUnknownImage:!!document.querySelector("[data-product='fotobox'] img"),
    fotoboxSrc:document.querySelector("[data-product-image='fotobox']")?.getAttribute("src"),
    fotoboxAlt:document.querySelector("[data-product-image='fotobox']")?.getAttribute("alt"),
    fotoboxSrcset:document.querySelector("[data-product-image='fotobox']")?.getAttribute("srcset"),
    fotoboxObjectFit:document.querySelector("[data-product-image='fotobox']")?getComputedStyle(document.querySelector("[data-product-image='fotobox']")).objectFit:null,
    fotoboxFilter:document.querySelector("[data-product-image='fotobox']")?getComputedStyle(document.querySelector("[data-product-image='fotobox']")).filter:null,
    productRenderMetrics:[...document.querySelectorAll("[data-product-image]")].map(img=>({
      type:img.getAttribute("data-product-image"),
      width:Math.round(img.getBoundingClientRect().width),
      height:Math.round(img.getBoundingClientRect().height),
      naturalWidth:img.naturalWidth,
      naturalHeight:img.naturalHeight,
      currentSrc:img.currentSrc,
      visible:getComputedStyle(img).visibility==="visible"&&getComputedStyle(img).opacity==="1"
    })),
    wohnwagenSrc:document.querySelector("[data-product-image='fotowohnwagen']")?.getAttribute("src"),
    wohnwagenSrcset:document.querySelector("[data-product-image='fotowohnwagen']")?.getAttribute("srcset"),
    brokenAnchors:[...document.querySelectorAll('a[href^="#"]')].map(a=>a.getAttribute("href")).filter(h=>h.length>1&&!document.getElementById(h.slice(1)))
  }));
  check(label+" HTTP",res?.status()===200,String(res?.status()));
  check(label+" no horizontal overflow",info.pageWidth<=width+2,info.pageWidth+" / "+width);
  check(label+" real images loaded",info.allImages.every(x=>x.ok),info.allImages.filter(x=>!x.ok).map(x=>x.src).join(", "));
  check(label+" approved logo",["../../site/assets/fotopolis-logo-original.png","/assets/fotopolis-logo-original.png"].includes(info.logo),info.logo);
  check(label+" hero contains no photo",info.heroImageCount===0,String(info.heroImageCount));
  check(label+" text-only hero with CSS color treatment",info.heroStyle.includes("gradient"),info.heroStyle.slice(0,75));
  check(label+" hero three working product shortcuts",JSON.stringify(info.heroGuideLinks)===JSON.stringify(["#fotowohnwagen","#fotobox","#fotospiegel"]),JSON.stringify(info.heroGuideLinks));
  check(label+" primary and secondary CTAs",JSON.stringify(info.heroCTAs)===JSON.stringify(["#erlebnisse","#kontakt"]),JSON.stringify(info.heroCTAs));
  check(label+" preserve full Fotospiegel product",info.mirrorObjectFit==="contain",info.mirrorObjectFit);
  check(label+" Fotospiegel no CSS colour filter",info.mirrorFilter==="none",info.mirrorFilter);
  check(label+" Wohnwagen original full image",info.wohnwagenObjectFit==="contain"&&info.wohnwagenFilter==="none",info.wohnwagenObjectFit+"/"+info.wohnwagenFilter);
  check(label+" Wohnwagen approved upload",info.wohnwagenStatus==="approved-user-upload"&&info.wohnwagenSrc?.endsWith("fotowohnwagen-gartenparty-1448.webp"),info.wohnwagenSrc);
  check(label+" Wohnwagen responsive sources",info.wohnwagenSrcset?.includes("760.webp 760w")&&info.wohnwagenSrcset?.includes("1448.webp 1448w"),info.wohnwagenSrcset);
  check(label+" Fotobox approved image not guests",!info.fotoboxHasWrongLegacyImage&&info.fotoboxHasUnknownImage&&info.fotoboxCardStatus==="approved-user-upload"&&info.fotoboxSrc?.endsWith("fotobox-event-1672.webp"),info.fotoboxSrc);
  check(label+" Fotobox responsive sources",info.fotoboxSrcset?.includes("800.webp 800w")&&info.fotoboxSrcset?.includes("1672.webp 1672w"),info.fotoboxSrcset);
  check(label+" Fotobox contains and has no filter",info.fotoboxObjectFit==="contain"&&info.fotoboxFilter==="none",info.fotoboxObjectFit+"/"+info.fotoboxFilter);
  check(label+" Fotobox descriptive alt",info.fotoboxAlt?.includes("Fotobox")&&info.fotoboxAlt?.includes("Touchscreen"),info.fotoboxAlt);
  check(label+" product images have rendered bounds",info.productRenderMetrics.length===3&&info.productRenderMetrics.every(p=>p.width>100&&p.height>100&&p.naturalWidth>0&&p.naturalHeight>0&&p.visible),JSON.stringify(info.productRenderMetrics));
  check(label+" no broken internal anchors",info.brokenAnchors.length===0,info.brokenAnchors.join(", "));
  if(width>=1024)check(label+" balanced hero height",info.heroHeight<=790,String(Math.round(info.heroHeight))+"px");
  check(label+" one H1",info.headingCount===1,String(info.headingCount));
  check(label+" JS runtime",errors.length===0,errors.join(" | "));
  await page.locator(".hero-guide-link").first().click();
  check(label+" hero Wohnwagen shortcut works",new URL(page.url()).hash==="#fotowohnwagen",page.url());
  if(width<=768){
    const toggle=page.locator("[data-menu-toggle]");
    check(label+" mobile toggle visible",await toggle.isVisible());
    await toggle.click();
    check(label+" menu opens",await toggle.getAttribute("aria-expanded")==="true");
    await page.keyboard.press("Escape");
    check(label+" menu escape",await toggle.getAttribute("aria-expanded")==="false");
    check(label+" menu keyboard focus restored",await toggle.evaluate(el=>el===document.activeElement));
  }
  await page.close();
}
await browser.close();
const failures=results.filter(x=>!x.passed);
await fs.writeFile(path.join(out,"report.json"),JSON.stringify({date:new Date().toISOString(),pass:results.length-failures.length,total:results.length,failures,results},null,2));
console.log("SUMMARY",JSON.stringify({total:results.length,passed:results.length-failures.length,failed:failures.length}));
if(failures.length)process.exitCode=1;