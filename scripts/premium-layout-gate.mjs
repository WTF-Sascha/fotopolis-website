import {chromium} from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * FOTOPOLIS Roadmap Layout Gate: check every route against breakpoints and
 * fail on overlaps, clipping, missing media, broken navigation, or JS errors.
 * Screenshots are archived for compulsory human visual review before release.
 */
const base=process.env.SITE_BASE_URL || "http://127.0.0.1:8766/";
const routes=["","fotobox","fotospiegel","fotowohnwagen","pakete","galerie",
  "anlaesse","ueber-uns","faq","kontakt","impressum","datenschutz"];
const widths=[320,375,430,768,1024,1100,1280,1440,1920];
const screenshotWidths=new Set([320,768,1440]);
const screenshotPages=new Set(["","fotobox","fotospiegel","fotowohnwagen","pakete"]);
const out="concepts/premium-v2/qa-screenshots/layout-gate";
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const results=[];
const screenshots=[];
function check(name,pass,detail="") {
  results.push({name,pass:!!pass,detail});
  if(!pass)console.error("LAYOUT_FAIL",name,detail);
}
for(const width of widths) {
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:"reduce"});
  const errors=[];
  page.on("pageerror",err=>errors.push(err.message));
  for(const slug of routes) {
    const route=slug?slug+"/":"";
    const label=width+"px /"+route;
    const res=await page.goto(new URL(route,base).toString(),{waitUntil:"networkidle",timeout:35000});
    await page.evaluate(async()=>{
      for(const img of document.images)img.loading="eager";
      await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));
    });
    const facts=await page.evaluate(()=>{
      const rect=el=>{if(!el)return null;const b=el.getBoundingClientRect();return {x:b.x,y:b.y,r:b.right,b:b.bottom,w:b.width,h:b.height}};
      const overlaps=(a,b,pad=0)=>a&&b&&a.r>b.x+pad&&b.r>a.x+pad&&a.b>b.y+pad&&b.b>a.y+pad;
      const brand=rect(document.querySelector(".identity"));
      const nav=rect(document.querySelector(".mainnav"));
      const toggle=rect(document.querySelector(".mobile-toggle"));
      const navVisible=getComputedStyle(document.querySelector(".mainnav")).display!=="none";
      const toggleVisible=getComputedStyle(document.querySelector(".mobile-toggle")).display!=="none";
      const footer=document.querySelector(".footer-navigation");
      const footerGrid=document.querySelector(".footer-grid");
      const topItems=footerGrid?[...footerGrid.children].filter(x=>x!==footer):[];
      const firstTopMax=Math.max(...topItems.map(x=>x.getBoundingClientRect().bottom),0);
      const stage=document.querySelector(".s7-story-layout");
      const media=rect(document.querySelector(".s7-story-lead"));
      const copy=rect(document.querySelector(".s7-story-points"));
      const mediaImg=document.querySelector(".studio-page-hero-media img");
      const badControls=[...document.querySelectorAll(".button,.mobile-toggle,.nav-trigger")]
        .filter(el=>{const cs=getComputedStyle(el),r=el.getBoundingClientRect();return cs.display!=="none"&&r.width>0&&r.height>0&&r.height<42;})
        .map(el=>({label:el.textContent.trim().slice(0,45),height:Math.round(el.getBoundingClientRect().height)}));
      const cards=[...document.querySelectorAll(".product-spec,.package-card")];
      const overflowCards=cards.filter(el=>el.scrollWidth>el.clientWidth+3).map(x=>x.className);
      const badImages=[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(x=>x.getAttribute("src"));
      const rootH1=document.querySelectorAll("main h1").length;
      const comparison=document.querySelector(".compare-scroll");
      const table=document.querySelector(".compare-table");
      return {
        overflow:document.documentElement.scrollWidth>innerWidth+2,
        documentWidth:document.documentElement.scrollWidth,
        rootH1,navVisible,toggleVisible,brand,nav,toggle,
        overlapNav:innerWidth>1100&&navVisible&&overlaps(brand,nav,4),
        overlapToggle:innerWidth<=1100&&toggleVisible&&overlaps(brand,toggle,6),
        badControls,overflowCards,badImages,
        footerPresent:!!footer,
        footerOverlap:!!footer&&footer.getBoundingClientRect().top<firstTopMax-1,
        productMedia:!!stage&&!!media&&!!copy,
        stageOverlap:innerWidth>760&&media&&copy&&overlaps(media,copy,2),
        stageStackBad:innerWidth<=760&&media&&copy&&copy.y<media.b-2,
        mediaImg:mediaImg?{src:mediaImg.getAttribute("src"),alt:mediaImg.alt,fit:getComputedStyle(mediaImg).objectFit,filter:getComputedStyle(mediaImg).filter}:null,
        packageCards:document.querySelectorAll(".package-card").length,
        packageTable:!!comparison&&!!table,
        tableOverflow:!!comparison&&comparison.scrollWidth>comparison.clientWidth+2,
        compareAccessible:!comparison||comparison.getAttribute("tabindex")==="0",
        headingClipped:[...document.querySelectorAll("h1,h2,h3")].filter(el=>el.clientHeight>0&&el.scrollHeight>el.clientHeight+3).map(el=>el.textContent.trim().slice(0,55)),
        headerWithinViewport:!!brand&&brand.x>=-2&&brand.r<=innerWidth+2
      };
    });
    check(label+" HTTP",res?.status()===200,String(res?.status()));
    check(label+" no horizontal overflow",!facts.overflow,String(facts.documentWidth));
    check(label+" one H1",facts.rootH1===1,String(facts.rootH1));
    check(label+" header within viewport",facts.headerWithinViewport);
    check(label+" nav/brand do not overlap",!facts.overlapNav&&!facts.overlapToggle);
    check(label+" footer below brand row",facts.footerPresent&&!facts.footerOverlap);
    check(label+" valid image files",facts.badImages.length===0,facts.badImages.join(","));
    check(label+" no clipped headings",facts.headingClipped.length===0,facts.headingClipped.join(" | "));
    check(label+" no clipped card content",facts.overflowCards.length===0,facts.overflowCards.join(","));
    check(label+" touch targets",facts.badControls.length===0,JSON.stringify(facts.badControls));
    if(["fotobox","fotospiegel","fotowohnwagen"].includes(slug)) {
      check(label+" editorial product layout present",facts.productMedia&&!!facts.mediaImg);
      check(label+" approved image unchanged presentation",
        !!facts.mediaImg?.src?.startsWith("/assets/images/")&&facts.mediaImg.fit==="contain"&&facts.mediaImg.filter==="none");
      check(label+" editorial layout separation",!facts.stageOverlap&&!facts.stageStackBad);
    }
    if(slug==="pakete"){
      check(label+" three package profiles",facts.packageCards===3,String(facts.packageCards));
      check(label+" accessible responsive comparison",facts.packageTable&&facts.compareAccessible);
    }
    if(screenshotWidths.has(width)&&screenshotPages.has(slug)){
      const file=(slug||"home")+"-"+width+".png";
      await page.screenshot({path:path.join(out,file),fullPage:true,animations:"disabled"});
      screenshots.push(file);
    }
  }
  check(width+"px zero browser errors",errors.length===0,errors.join(" | "));
  await page.close();
}
await browser.close();
const failures=results.filter(r=>!r.pass);
const summary={gate:"roadmap-step-2",testedCommit:process.env.GITHUB_SHA||null,
  checkedWidths:widths,routeCount:routes.length,total:results.length,
  passed:results.length-failures.length,failed:failures.length,
  screenshots,failures,visualReview:"Screenshots require human visual sign-off before launch"};
await fs.writeFile(path.join(out,"report.json"),JSON.stringify(summary,null,2));
console.log("LAYOUT_GATE",JSON.stringify({total:summary.total,passed:summary.passed,
  failed:summary.failed,screenshots:screenshots.length}));
if(failures.length)process.exitCode=1;
