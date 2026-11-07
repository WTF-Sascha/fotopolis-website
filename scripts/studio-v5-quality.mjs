import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

/* Premium Studio 5: layout geometry, nav UX, image integrity, route coverage.
   Runs against the *generated* isolated Netlify preview output. */
const base=process.env.SITE_BASE_URL||"http://127.0.0.1:8766/";
const out="concepts/premium-v2/qa-screenshots/studio-v5";
const routes=["","fotobox","fotospiegel","fotowohnwagen","pakete","galerie","anlaesse","ueber-uns","faq","kontakt","impressum","datenschutz"];
const widths=[320,375,430,768,1024,1440];
const issues=[],photos=[];
const check=(width,slug,name,condition,detail="")=>{
  if(!condition){const x={width,slug,name,detail};issues.push(x);console.error("STUDIO5_ISSUE",JSON.stringify(x).slice(0,850))}
};
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
for(const width of widths){
  const page=await browser.newPage({viewport:{width,height:width<760?820:950},deviceScaleFactor:1,reducedMotion:"reduce"});
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  for(const slug of routes){
    const url=new URL(slug?slug+"/":"",base).toString();
    const res=await page.goto(url,{waitUntil:"networkidle",timeout:40000});
    await page.evaluate(async()=>{for(const img of document.images)img.loading="eager";await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});
    const data=await page.evaluate(()=>{
      const $=q=>document.querySelector(q);
      const rect=el=>{if(!el)return null;const a=el.getBoundingClientRect();return {left:a.left,right:a.right,top:a.top,bottom:a.bottom,w:a.width,h:a.height}};
      const images=[...document.images].map(i=>({src:i.getAttribute("src"),ok:!!i.naturalWidth,fit:getComputedStyle(i).objectFit}));
      const header=rect($(".studio-header")),logo=rect($(".studio-identity img"));
      const title=rect($("main h1"));
      const brokenHeadings=[...document.querySelectorAll("main h1,main h2,main h3")].filter(e=>e.scrollWidth>e.clientWidth+3&&(getComputedStyle(e).overflowX==="hidden"||getComputedStyle(e).overflowX==="clip")).map(e=>e.textContent.trim().slice(0,70));
      return {
        width:document.documentElement.scrollWidth,innerWidth,
        hasStyle:!!$('link[href="/studio-v5.css"]'),hasScript:!!$('script[src="/studio-v5.js"]'),
        header,logo,title,h1s:document.querySelectorAll("main h1").length,
        curve:rect($(".studio-header-curve")),
        curvePresent:!!$(".studio-header-curve svg path.studio-header-curve-stroke"),
        curveStroke:$(".studio-header-curve-stroke")?getComputedStyle($(".studio-header-curve-stroke")).stroke:null,
        menuBarCount:document.querySelectorAll(".studio-menu-toggle span").length,
        overflowMedia:[...document.querySelectorAll(".studio-page-hero-media img,.product-stage-media img,.v4-product-photo img")].map(i=>({src:i.getAttribute("src"),fit:getComputedStyle(i).objectFit})),
        images,brokenHeadings,
        hasMedia:!!$(".studio-page-hero-media"),hasArt:!!$(".studio-page-hero-art"),
        asideCount:document.querySelectorAll(".page-aside").length,
        contactForm:!!$("[data-contact-flow]"),
        goldCTA:document.querySelectorAll('.v45-final-cta a.button[href="/kontakt/"]').length,
        menuVisible:!!$(".mobile-toggle")&&getComputedStyle($(".mobile-toggle")).display!=="none",
        cardOrder:[...document.querySelectorAll(".v4-product-card")].map(x=>x.id),
        noHeroCTA:document.querySelector(".v45-hero a")===null,
        bottomNavVisible:!!$(".v4-mobile-nav")&&getComputedStyle($(".v4-mobile-nav")).display!=="none"
      }
    });
    check(width,slug,"HTTP 200",res.status()===200,res.status());
    check(width,slug,"studio design loaded",data.hasStyle&&data.hasScript);
    check(width,slug,"single H1",data.h1s===1);
    check(width,slug,"viewport no horizontal overflow",data.width<=width+2,data.width);
    check(width,slug,"all images complete",data.images.every(i=>i.ok),data.images.filter(i=>!i.ok).map(x=>x.src));
    check(width,slug,"no clipped headings",data.brokenHeadings.length===0,data.brokenHeadings);
    check(width,slug,"equipment images not cropped",data.overflowMedia.every(i=>i.fit==="contain"),data.overflowMedia);
    check(width,slug,"prominent original logo",!!data.logo&&data.logo.w>=58,data.logo);
    check(width,slug,"reference curved divider mounted",data.curvePresent&&data.curve?.h>=20,{curve:data.curve});
    check(width,slug,"champagne separator stroke",!!data.curveStroke&&data.curveStroke!=="none",data.curveStroke);
    check(width,slug,"three golden hamburger strokes",data.menuBarCount===3,data.menuBarCount);
    check(width,slug,"responsive menu icon",data.menuVisible===(width<=1100));
    check(width,slug,"responsive quick nav",data.bottomNavVisible===(width<=760));
    check(width,slug,"no uncaught JavaScript error",errors.length===0,errors);
    if(slug===""){
      check(width,slug,"home has only one closing CTA",data.noHeroCTA&&data.goldCTA===1,data.goldCTA);
      check(width,slug,"correct product sequence",data.cardOrder.join(",")==="fotobox,fotospiegel,fotowohnwagen",data.cardOrder);
    }else{
      check(width,slug,"editorial route hero",data.hasMedia||data.hasArt);
      if(["fotobox","fotospiegel","fotowohnwagen","galerie"].includes(slug))check(width,slug,"photo-led product hero",data.hasMedia);
    }
    if(width<=1100){
      check(width,slug,"logo horizontally centered",!!data.header&&!!data.logo&&Math.abs((data.logo.left+data.logo.right)/2-(data.header.left+data.header.right)/2)<=3,{logo:data.logo,header:data.header});
    }
    if(slug==="kontakt")check(width,slug,"contact enquiry functional structure exists",data.contactForm);
    if(([375,1440].includes(width)&&["","fotobox","fotospiegel","fotowohnwagen","pakete","galerie","anlaesse","ueber-uns","faq","kontakt"].includes(slug))||(width===320&&slug==="")){
      const name=(slug||"home")+"-"+width+".png";
      await page.screenshot({path:path.join(out,name),fullPage:true,animations:"disabled"});
      photos.push(name);
    }
    errors.length=0;
  }
  // Reference-inspired top state and a compact sticky header after scrolling.
  await page.goto(base,{waitUntil:"networkidle"});
  await page.evaluate(()=>window.scrollTo(0,380));
  await page.waitForTimeout(130);
  check(width,"header","compact on scroll",await page.locator(".studio-header.is-scrolled").count()===1);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForTimeout(130);
  check(width,"header","restores reference size at top",await page.locator(".studio-header.is-scrolled").count()===0);
  // Real menu open/close, overlay behavior, ESC and page navigation.

  if(width<=1100){
    const toggle=page.locator("[data-menu-toggle]");
    await toggle.click();
    check(width,"menu","opens",await toggle.getAttribute("aria-expanded")==="true");
    const productMenu=page.locator('[aria-controls="nav-erlebnisse"]');
    await productMenu.click();
    check(width,"menu","product dropdown expands",await productMenu.getAttribute("aria-expanded")==="true");
    check(width,"menu","reveals Mirror detail link",await page.locator('#mainnav a[href="/fotospiegel/"]').isVisible());
    await page.keyboard.press("Escape");
    check(width,"menu","Escape closes subnavigation",await productMenu.getAttribute("aria-expanded")==="false");
    await page.keyboard.press("Escape");
    check(width,"menu","Escape closes main menu",await toggle.getAttribute("aria-expanded")==="false");
  }
  if(width<=760){
    const rail=page.locator("[data-v4-track]");
    const before=await rail.evaluate(e=>e.scrollLeft);
    await page.locator("[data-v4-next]").click();
    await page.waitForTimeout(120);
    const after=await rail.evaluate(e=>e.scrollLeft);
    check(width,"carousel","next moves forward",after>before,{before,after});
    await page.locator("[data-v4-prev]").click();
    await page.waitForTimeout(120);
    const back=await rail.evaluate(e=>e.scrollLeft);
    check(width,"carousel","prev moves backward",back<after,{back,after});
  }
  await page.close();
}
await browser.close();
const report={version:"studio-v5",routeCount:routes.length,breakpoints:widths,viewportPairs:routes.length*widths.length,totalIssues:issues.length,issues,screenshots:photos};
await fs.writeFile(path.join(out,"report.json"),JSON.stringify(report,null,2));
console.log("STUDIO5_QUALITY_SUMMARY",JSON.stringify({pairs:report.viewportPairs,issues:issues.length,screenshots:photos.length,byType:Object.fromEntries([...new Set(issues.map(x=>x.name))].map(k=>[k,issues.filter(x=>x.name===k).length]))}));
if(issues.length)process.exitCode=1;
