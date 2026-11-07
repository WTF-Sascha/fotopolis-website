import {chromium} from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
/* FOTOPOLIS V4.2: screenshot-reported beige-band regression.
   Layout logic is tested geometrically, not just by scrollWidth.
   All tests use the EXACT generated Netlify preview site. */
const BASE=process.env.SITE_BASE_URL||"http://127.0.0.1:8766/";
const OUT=process.env.QA_OUT_DIR||"concepts/premium-v2/qa-screenshots/mobile-band";
const widths=[320,360,375,390,412,430,600,760,768,900,1024,1100,1280,1440];
const checks=[],photos=[];
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const assertion=(width,name,valid,detail)=>{
 const ok=Boolean(valid);
 checks.push({width,name,passed:ok,detail});
 if(!ok)console.error("MOBILE_BAND_FAIL",width,name,JSON.stringify(detail).slice(0,500));
};
for(const width of widths){
 const mobile=width<=760;
 const page=await browser.newPage({viewport:{width,height:Math.max(740,Math.round(width*1.9))},deviceScaleFactor:1,reducedMotion:"reduce",isMobile:mobile,hasTouch:mobile});
 const errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 const response=await page.goto(BASE,{waitUntil:"networkidle",timeout:40000});
 await page.evaluate(async()=>{for(const i of document.images)i.loading="eager";await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));scrollTo(0,0)});
 const data=await page.evaluate(()=>{
  const $=q=>document.querySelector(q);
  const r=e=>{if(!e)return null;const b=e.getBoundingClientRect();return {x:b.left,y:b.top,right:b.right,bottom:b.bottom,width:b.width,height:b.height}};
  const b=$(".v4-hero-meta-inner");
  const cells=[...document.querySelectorAll(".v4-hero-meta-inner>*")];
  return {
   header:r($(".site-header")),hero:r($(".v4-hero")),heading:r($(".v4-hero h1")),
   meta:r($(".v4-hero-meta")),inner:r(b),
   box:r($(".v4-hero-meta-item--box")),
   mirror:r($(".v4-hero-meta-item--mirror")),
   camper:r($(".v4-hero-meta-item--camper")),
   claim:r($(".v4-hero-meta-claim")),
   activeGrid:b?getComputedStyle(b).gridTemplateAreas:null,
   display:b?getComputedStyle(b).display:null,
   caption:cells.map(c=>({tag:c.tagName,text:c.textContent.trim(),whiteSpace:getComputedStyle(c).whiteSpace,overflowWidth:c.scrollWidth-c.clientWidth,overflowHeight:c.scrollHeight-c.clientHeight})),
   horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
   heroH1:$(".v4-hero h1")?.textContent.trim(),
   actualViewport:innerWidth, actualScrollY:scrollY,
   links:cells.filter(c=>c.tagName==="A").map(c=>c.getAttribute("href")),
   bottomNav:document.querySelector(".v4-mobile-nav")?getComputedStyle(document.querySelector(".v4-mobile-nav")).display:null,
   headerPosition:getComputedStyle($(".site-header")).position
  };
 });
 const sameRow=(a,b,tolerance=5)=>a&&b&&Math.abs(a.y-b.y)<=tolerance;
 const below=(a,b)=>a&&b&&a.y>=b.bottom-3;
 assertion(width,"HTTP",response.status()===200,response.status());
 assertion(width,"real 4-item info band",data.caption.length===4,data.caption);
 assertion(width,"semantic working navigation",JSON.stringify(data.links)===JSON.stringify(["/fotobox/","/fotospiegel/","/fotowohnwagen/"]),data.links);
 assertion(width,"band uses grid",data.display==="grid",data.display);
 assertion(width,"all rectangles exist",!!(data.box&&data.mirror&&data.camper&&data.claim),data);
 assertion(width,"no whole-page sideways scroll",data.horizontalOverflow<=2,data.horizontalOverflow);
 assertion(width,"meta text fully fits",data.caption.every(c=>c.overflowHeight<=2&&c.overflowWidth<=2),data.caption);
 assertion(width,"mobile header precedes hero",data.hero&&data.header&&data.hero.y>=data.header.bottom-2,{header:data.header,hero:data.hero});
 assertion(width,"H1 begins visibly below hero start",data.heading&&data.hero&&data.heading.y>data.hero.y+20,{h1:data.heading,hero:data.hero});
 assertion(width,"H1 is entirely in hero",data.heading&&data.hero&&data.heading.bottom<data.hero.bottom-15,{h1:data.heading,hero:data.hero});
 assertion(width,"valid complete headline",data.heroH1?.includes("Premium")&&data.heroH1?.includes("für dein Event."),data.heroH1);
 assertion(width,"no uncaught runtime errors",errors.length===0,errors);
 if(width<=760){
  assertion(width,"box and mirror on same first row",sameRow(data.box,data.mirror),{box:data.box,mirror:data.mirror});
  assertion(width,"camper occupies its own row",below(data.camper,data.box)&&below(data.camper,data.mirror),{camper:data.camper,box:data.box,mirror:data.mirror});
  assertion(width,"claim is below camper",below(data.claim,data.camper),{claim:data.claim,camper:data.camper});
  assertion(width,"rows fully fit beige background",data.meta&&data.inner&&data.meta.bottom>=data.claim.bottom-2,{meta:data.meta,claim:data.claim});
  assertion(width,"mobile navigation present",data.bottomNav==="grid",data.bottomNav);
 }else if(width<=1100){
  assertion(width,"three products share first row",sameRow(data.box,data.mirror)&&sameRow(data.box,data.camper),{box:data.box,mirror:data.mirror,camper:data.camper});
  assertion(width,"claim occupies second row",below(data.claim,data.box),{box:data.box,claim:data.claim});
 }else{
  assertion(width,"four cells share one row",sameRow(data.box,data.mirror)&&sameRow(data.box,data.camper)&&sameRow(data.box,data.claim),{box:data.box,mirror:data.mirror,camper:data.camper,claim:data.claim});
 }
 if([320,375,412,760,768,1440].includes(width)){
  const name="home-"+width+".png";
  await page.screenshot({path:path.join(OUT,name),fullPage:true,animations:"disabled"});
  photos.push(name);
 }
 // A fixed mobile navigation can cover a correctly positioned band.
 // Scroll it into the usable viewport, check hit-testing, then screenshot.
 await page.evaluate(()=>{
  const band=document.querySelector(".v4-hero-meta");
  const header=document.querySelector(".site-header");
  const h=header?.getBoundingClientRect().height||0;
  const y=scrollY+band.getBoundingClientRect().top-h-16;
  window.scrollTo({top:Math.max(0,y),behavior:"instant"});
 });
 const inView=await page.evaluate(()=>{
  const el=document.querySelector(".v4-hero-meta-claim");
  const band=document.querySelector(".v4-hero-meta");
  const header=document.querySelector(".site-header");
  const fixed=document.querySelector(".v4-mobile-nav");
  const r=el.getBoundingClientRect();
  const br=band.getBoundingClientRect();
  const hr=header.getBoundingClientRect();
  const fixedVisible=fixed&&getComputedStyle(fixed).display!=="none";
  const nr=fixedVisible?fixed.getBoundingClientRect():null;
  const x=r.left+r.width/2,y=r.top+r.height/2;
  const atCenter=document.elementFromPoint(x,y);
  return {
   claimVisible:r.top>hr.bottom+4&&r.bottom<(nr?.top??innerHeight)-8,
   bandVisible:br.top>hr.bottom+4&&br.bottom<(nr?.top??innerHeight)-8,
   hitTest:atCenter===el||el.contains(atCenter),
   claim:{top:r.top,bottom:r.bottom},
   navTop:nr?.top??null,headerBottom:hr.bottom
  };
 });
 assertion(width,"entire band visible clear of sticky and bottom navigation",inView.bandVisible,inView);
 assertion(width,"claim visible without occlusion",inView.claimVisible&&inView.hitTest,inView);
 if([320,375,412,760,768,1440].includes(width)){
  const band="beige-band-"+width+".png";
  await page.locator(".v4-hero-meta").screenshot({path:path.join(OUT,band),animations:"disabled"});
  photos.push(band);
 }
 await page.close();
}
await browser.close();
const failed=checks.filter(x=>!x.passed);
const summary={viewportCount:widths.length,checked:checks.length,passed:checks.length-failed.length,failed:failed.length,failures:failed,screenshots:photos};
await fs.writeFile(path.join(OUT,"report.json"),JSON.stringify(summary,null,2));
console.log("V4_BEIGE_BAND_QA",JSON.stringify({widths:widths.length,checks:checks.length,failed:failed.length,screenshots:photos.length}));
if(failed.length)process.exitCode=1;
