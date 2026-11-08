import {chromium} from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
/* V4 deep visual/functional audit. Goes beyond HTTP and page overflow:
   records actual text clipping, collateral overlaps, product image cropping,
   edge cut-offs, tap targets and mobile navigation across 12 routes. */
const BASE=process.env.SITE_BASE_URL||"http://127.0.0.1:8766/";
const OUT=process.env.QA_OUT_DIR||"concepts/premium-v2/qa-screenshots/reference-v4-audit";
const widths=[320,360,375,390,412,430,600,760,768,900,1024,1100,1280,1440,1920];
const routes=["","fotobox","fotospiegel","fotowohnwagen","pakete","galerie","anlaesse","ueber-uns","faq","kontakt","impressum","datenschutz"];
await fs.mkdir(OUT,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const issues=[],metrics=[],screenshots=[],interactions=[];
const labelOf=(width,route)=>width+"px "+(route?"/"+route+"/":"/");
const check=(kind,label,passed,detail="")=>{
 interactions.push({kind,label,passed:!!passed,detail});
 if(!passed)console.log("FUNCTION_ISSUE",kind,label,String(detail).slice(0,230));
};
for (const width of widths){
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:"reduce",deviceScaleFactor:1});
 const runtime=[];
 page.on("pageerror",error=>runtime.push(error.message));
 for (const slug of routes) {
  const label=labelOf(width,slug);
  const res=await page.goto(new URL(slug?slug+"/":"",BASE).toString(),{waitUntil:"networkidle",timeout:40000});
  await page.evaluate(async()=>{for(const img of document.images)img.loading="eager";await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})))});
  const info=await page.evaluate(()=>{
   const visible=el=>{let s=getComputedStyle(el),r=el.getBoundingClientRect();return r.width>1&&r.height>1&&!["none","hidden"].includes(s.display)&&s.visibility!=="hidden"&&s.opacity!=="0"};
   const short=el=>(el.tagName.toLowerCase()+(el.id?"#"+el.id:"")+("."+[...el.classList].slice(0,3).join(".")).replace(/\.$/,"")).slice(0,92);
   const samples=[];
   const boxBugs=[];
   // Conventional clipping is only a bug when content is intentionally non-scrollable.
   for(const el of document.querySelectorAll("h1,h2,h3,h4,p,small,figcaption,summary,.v4-product-body,.v4-advantage,.v4-date-cta,.page-hero .inner,.v4-hero-content,.v4-hero-actions,.v4-product-tag,.product-stage-copy,.contact-form label,.contact-step-controls,.v4-mobile-nav a")){
    if(!visible(el)||el.closest(".sr-only,[hidden],[aria-hidden=true]"))continue;
    const cs=getComputedStyle(el);
    const overflowV=el.scrollHeight-el.clientHeight;
    const overflowH=el.scrollWidth-el.clientWidth;
    const clipV=["hidden","clip"].includes(cs.overflowY);
    const clipH=["hidden","clip"].includes(cs.overflowX);
    if((overflowV>3&&clipV)||(overflowH>3&&clipH)){
      boxBugs.push({target:short(el),v:overflowV,h:overflowH,text:el.textContent.trim().slice(0,77)});
    }
    if(["H1","H2","H3","H4"].includes(el.tagName)&&overflowV>4&&cs.overflowY!=="visible")
      boxBugs.push({target:short(el),v:overflowV,h:overflowH,text:el.textContent.trim().slice(0,77),reason:"heading"});
   }
   const crop=[];
   for(const img of document.querySelectorAll(".v4-product-card img,.product-stage-media img,.curated-open img")){
    if(!visible(img)||!img.naturalWidth||!img.naturalHeight)continue;
    const cs=getComputedStyle(img),b=img.getBoundingClientRect(),s=Math.max(b.width/img.naturalWidth,b.height/img.naturalHeight);
    const visibleFraction=Math.min(1,(b.width/s)*(b.height/s)/(img.naturalWidth*img.naturalHeight));
    if(cs.objectFit==="cover"&&visibleFraction<.92)crop.push({target:short(img.parentElement),src:img.getAttribute("src"),pct:Math.round(100*visibleFraction),fit:cs.objectFit});
   }
   const blocked=[];
   for(const [a,b] of [
      [document.querySelector(".identity"),document.querySelector(".mobile-toggle")],
      [document.querySelector(".v4-date-cta h2"),document.querySelector(".v4-date-cta a")],
      [document.querySelector(".v4-product-body h3"),document.querySelector(".v4-product-arrow")]
   ]){
     if(!a||!b||!visible(a)||!visible(b))continue;
     const r=a.getBoundingClientRect(),s=b.getBoundingClientRect();
     const x=Math.max(0,Math.min(r.right,s.right)-Math.max(r.left,s.left)),y=Math.max(0,Math.min(r.bottom,s.bottom)-Math.max(r.top,s.top));
     if(x>4&&y>4)blocked.push({a:short(a),b:short(b),overlap:[Math.round(x),Math.round(y)]});
   }
   const invisibleActions=[];
   for(const el of document.querySelectorAll("main a.button,.v4-mobile-nav a,.v4-rail-buttons button,.v4-gallery-filters button")){
    if(!visible(el)||getComputedStyle(el).display==="none")continue;
    const r=el.getBoundingClientRect();
    if(r.height<42||r.width<40)invisibleActions.push({target:short(el),w:Math.round(r.width),h:Math.round(r.height)});
   }
   const imgBugs=[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.getAttribute("src"));
   return {
     overflow:document.documentElement.scrollWidth-innerWidth,
     headings:[...document.querySelectorAll("h1,h2,h3")].filter(visible).map(x=>({name:short(x),text:x.textContent.trim().slice(0,37),h:Math.round(x.getBoundingClientRect().height),sh:x.scrollHeight})),
     crop,boxBugs,blocked,invisibleActions,imgBugs,
     heroCss:!!document.querySelector(".v4-hero"),
     interactiveImages:[...document.querySelectorAll(".v4-product-card img")].map(x=>({objectFit:getComputedStyle(x).objectFit,src:x.getAttribute("src")})),
     navPresent:document.querySelectorAll(".v4-mobile-nav a").length===5,
     visibleNav:document.querySelector(".v4-mobile-nav")?getComputedStyle(document.querySelector(".v4-mobile-nav")).display!=="none":false
   };
  });
  if(res.status()!==200)issues.push({width,slug,type:"http",data:res.status()});
  if(info.overflow>2)issues.push({width,slug,type:"horizontal-overflow",data:info.overflow});
  if(info.boxBugs.length)issues.push({width,slug,type:"clipped-text",data:info.boxBugs.slice(0,12)});
  if(info.crop.length)issues.push({width,slug,type:"product-image-crop",data:info.crop});
  if(info.blocked.length)issues.push({width,slug,type:"element-overlap",data:info.blocked});
  if(info.invisibleActions.length)issues.push({width,slug,type:"touch-target",data:info.invisibleActions.slice(0,6)});
  if(info.imgBugs.length)issues.push({width,slug,type:"broken-image",data:info.imgBugs});
  if(info.visibleNav!==(width<=760))issues.push({width,slug,type:"mobile-nav",data:info.visibleNav});
  if(info.headings.some(h=>h.sh>h.h+4))issues.push({width,slug,type:"heading-scroll-height",data:info.headings.filter(h=>h.sh>h.h+4)});
  metrics.push({width,slug,overflow:info.overflow,imageCrop:info.crop.length,boxBugs:info.boxBugs.length,overlap:info.blocked.length});
  if([375,768,1440].includes(width)&&["","fotobox","fotospiegel","fotowohnwagen","galerie","kontakt"].includes(slug)){
    const target=(slug||"home")+"-"+width+".png";
    await page.screenshot({path:path.join(OUT,target),fullPage:true,animations:"disabled"});
    screenshots.push(target);
  }
 }
 // Functional interactions, mobile and desktop.
 await page.goto(BASE,{waitUntil:"networkidle"});
 const t=page.locator("[data-v4-track]");
 if(width<=760){
  let initial=await t.evaluate(el=>el.scrollLeft);
  await page.locator("[data-v4-next]").click();
  let next=await t.evaluate(el=>el.scrollLeft);
  check("rail",width+"px home: next",next>initial,initial+"->"+next);
  await page.locator("[data-v4-prev]").click();
  let prev=await t.evaluate(el=>el.scrollLeft);
  check("rail",width+"px home: previous",prev<next,next+"->"+prev);
  const mobile=page.locator(".v4-mobile-nav");
  check("mobile-nav",width+"px home 5 actions",await mobile.locator("a").count()===5);
 }
 if(width<=1100){
  const menu=page.locator("[data-menu-toggle]");
  await menu.click();
  check("menu",width+"px menu opens",(await menu.getAttribute("aria-expanded"))==="true");
  await page.keyboard.press("Escape");
  check("menu",width+"px escape closes",(await menu.getAttribute("aria-expanded"))==="false");
 }
 await page.goto(new URL("galerie/",BASE).toString(),{waitUntil:"networkidle"});
 const filters=page.locator("[data-v4-gallery-filter]");
 const three=await page.locator("[data-gallery-item]:visible").count();
 await filters.nth(2).click();
 check("gallery",width+"px filter shows only mirror",(await page.locator("[data-gallery-item]:visible").count())===1);
 await page.locator("[data-gallery-open]:visible").first().click();
 check("gallery",width+"px modal",(await page.locator("[data-gallery-dialog]").evaluate(el=>el.open))===true);
 await page.keyboard.press("Escape");
 check("gallery",width+"px modal escape",(await page.locator("[data-gallery-dialog]").evaluate(el=>el.open))===false);
 await filters.first().click();
 check("gallery",width+"px all restored",(await page.locator("[data-gallery-item]:visible").count())===three);
 if(runtime.length)issues.push({width,slug:"*",type:"js-error",data:runtime});
 await page.close();
}
await browser.close();
const uniq=new Map();
for(const issue of issues){const key=issue.type+"|"+issue.slug+"|"+JSON.stringify(issue.data);if(!uniq.has(key))uniq.set(key,{...issue,widths:[issue.width]});else uniq.get(key).widths.push(issue.width);}
const output={testedRoutes:routes.length,testedWidths:widths,routeViewportPairs:routes.length*widths.length,uniqueIssues:[...uniq.values()],rawIssueCount:issues.length,interactionTotal:interactions.length,interactionFailed:interactions.filter(x=>!x.passed),screenshots,metrics};
await fs.writeFile(path.join(OUT,"report.json"),JSON.stringify(output,null,2));
console.log("DEEP_AUDIT_SUMMARY",JSON.stringify({pairs:output.routeViewportPairs,rawIssues:issues.length,unique:uniq.size,byType:Object.fromEntries([...new Set(issues.map(x=>x.type))].map(t=>[t,issues.filter(x=>x.type===t).length])),interactionTotal:interactions.length,interactionFailed:output.interactionFailed.length}));
for(const issue of [...uniq.values()].slice(0,90))console.log("DEEP_AUDIT_ISSUE",JSON.stringify(issue).slice(0,650));
for(const issue of output.interactionFailed)console.log("DEEP_AUDIT_INTERACTION_FAIL",JSON.stringify(issue));
if(process.env.QA_STRICT==="1"&&(issues.length||output.interactionFailed.length))process.exitCode=1;
