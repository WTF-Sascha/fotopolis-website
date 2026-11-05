import {chromium} from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const base=process.env.SITE_BASE_URL || "http://127.0.0.1:8766/";
const out="concepts/premium-v2/qa-screenshots/step4-review";
const widths=[320,375,768,1100,1440,1920];
const snapshots=new Set([320,768,1440]);
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const results=[],screenshots=[];
const check=(name,passed,detail="")=>{
 const pass=!!passed;results.push({name,pass,detail});
 if(!pass)console.error("STEP4_FAIL",name,detail);
};
for(const width of widths){
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:"reduce"});
 const errors=[],writes=[];
 page.on("pageerror",e=>errors.push(e.message));
 page.on("request",request=>{
   if(!["GET","HEAD"].includes(request.method()))writes.push(request.method()+" "+request.url());
 });
 const visit=async(slug)=>page.goto(new URL(slug,base).toString(),{waitUntil:"networkidle",timeout:35000});
 const facts=async()=>page.evaluate(()=>({
   overflow:document.documentElement.scrollWidth>innerWidth+2,
   brokenImages:[...document.images].filter(img=>!img.complete||!img.naturalWidth).map(img=>img.getAttribute("src")),
   headingsClipped:[...document.querySelectorAll("h1,h2,h3")].filter(el=>el.clientHeight>0&&el.scrollHeight>el.clientHeight+3).map(el=>el.textContent.slice(0,50)),
   logo:document.querySelector(".identity img")?.getAttribute("src"),
   noindex:document.querySelector('meta[name="robots"]')?.content.includes("noindex")
 }));
 // Occasions: complete actionable editorial navigation, never promised bookings.
 let response=await visit("anlaesse/");
 let data=await facts();
 check(width+" occasions HTTP",response.status()===200);
 check(width+" four distinct occasion chapters",await page.locator(".occasion-card").count()===4);
 check(width+" occasion planning steps",await page.locator(".occasion-step").count()===3);
 check(width+" occasion product links",await page.locator(".occasion-card-links a").count()===8);
 check(width+" occasion links destinations",
   (await page.locator(".occasion-card-links a").evaluateAll(nodes=>nodes.every(x=>/^\/(fotobox|fotospiegel|fotowohnwagen)\/$/.test(x.getAttribute("href"))))));
 check(width+" occasion layout and assets",!data.overflow&&!data.brokenImages.length&&!data.headingsClipped.length,JSON.stringify(data));
 check(width+" no availability promise on occasions",
   (await page.locator(".occasion-disclaimer").first().innerText()).includes("keine konkreten"));
 if(snapshots.has(width)){
  const p="anlaesse-"+width+".png";await page.screenshot({path:path.join(out,p),fullPage:true,animations:"disabled"});screenshots.push(p);
 }
 // Gallery: 3 existing event photos with review-only status + 3 approved product scenes.
 response=await visit("galerie/");
 data=await facts();
 check(width+" gallery HTTP",response.status()===200);
 check(width+" gallery six labelled images",await page.locator(".curated-item").count()===6);
 check(width+" event source class",await page.locator('[data-gallery-kind="moments"]').count()===3);
 check(width+" approved product source class",await page.locator('[data-gallery-kind="products"]').count()===3);
 check(width+" source notes exist",await page.locator(".curated-item figcaption small").count()===6);
 check(width+" photo rights warning",(await page.locator("[data-gallery-rights]").innerText()).includes("nicht für den Live-Einsatz"));
 check(width+" gallery images intact",!data.brokenImages.length&&data.logo==="/assets/fotopolis-logo-original.png",data.brokenImages.join(" | "));
 check(width+" gallery no overflow/clipped headings",!data.overflow&&!data.headingsClipped.length,JSON.stringify(data));
 check(width+" preview robots noindex",data.noindex);
 await page.locator('[data-gallery-filter="moments"]').click();
 check(width+" moments filter active",await page.locator('[data-gallery-filter="moments"]').getAttribute("aria-pressed")==="true");
 check(width+" moments filter count",await page.locator(".curated-item:visible").count()===3);
 check(width+" filter hides products",await page.locator('[data-gallery-kind="products"]:visible').count()===0);
 await page.locator('[data-gallery-filter="products"]').click();
 check(width+" product filter count",await page.locator('[data-gallery-kind="products"]:visible').count()===3);
 check(width+" filter hides unverified person photos",await page.locator('[data-gallery-kind="moments"]:visible').count()===0);
 const opener=page.locator('[data-gallery-kind="products"] [data-gallery-open]').first();
 await opener.click();
 check(width+" accessible dialog open",await page.locator("[data-gallery-dialog]").evaluate(x=>x.open));
 const before=await page.locator("[data-gallery-large]").getAttribute("src");
 check(width+" dialog shows unchanged local product image",before==="/assets/images/fotobox-event-1672.webp",String(before));
 await page.keyboard.press("ArrowRight");
 const after=await page.locator("[data-gallery-large]").getAttribute("src");
 check(width+" keyboard next photo",after==="/assets/images/fotospiegel-hero-lossless.webp",String(after));
 await page.keyboard.press("ArrowLeft");
 check(width+" keyboard previous photo",(await page.locator("[data-gallery-large]").getAttribute("src"))===before);
 await page.keyboard.press("Escape");
 check(width+" Escape closes dialog",!(await page.locator("[data-gallery-dialog]").evaluate(x=>x.open)));
 check(width+" focus restored",await opener.evaluate(x=>document.activeElement===x));
 await page.locator('[data-gallery-filter="all"]').click();
 check(width+" all images restored",await page.locator(".curated-item:visible").count()===6);
 data=await facts();
 check(width+" no broken assets after modal cycle",data.brokenImages.length===0,data.brokenImages.join("|"));
 if(snapshots.has(width)){
  // Browser may have auto-scrolled to restore focus after closing the dialog.
  // Capture only a settled top-of-page state; otherwise sticky navigation and
  // lazily decoded images can appear displaced or blank in full-page screenshots.
  await page.evaluate(async()=>{
    document.documentElement.style.scrollBehavior="auto";
    for(const image of document.images)image.loading="eager";
    await Promise.all([...document.images].map(image=>image.decode().catch(()=>{})));
    if(document.activeElement instanceof HTMLElement)document.activeElement.blur();
    window.scrollTo(0,0);
  });
  await page.waitForFunction(()=>window.scrollY===0);
  check(width+" gallery screenshot starts at top",await page.evaluate(()=>window.scrollY===0));
  check(width+" gallery screenshot assets decoded",
    await page.evaluate(()=>[...document.images].every(x=>x.complete&&x.naturalWidth>0)));
  const p="galerie-"+width+".png";
  await page.screenshot({path:path.join(out,p),fullPage:true,animations:"disabled"});screenshots.push(p);
 }
 // Trust page: actual offer and process, no fabricated customer ratings.
 response=await visit("ueber-uns/");
 data=await facts();
 check(width+" about HTTP",response.status()===200);
 check(width+" exactly four trust facts",await page.locator(".trust-fact").count()===4);
 check(width+" exactly three process steps",await page.locator(".trust-step").count()===3);
 check(width+" explicit no fabricated testimonials",(await page.locator(".trust-review-policy").innerText()).includes("keine Sternebewertungen"));
 check(width+" trust page stable",!data.overflow&&!data.brokenImages.length&&!data.headingsClipped.length,JSON.stringify(data));
 if(snapshots.has(width)){
  const p="ueber-uns-"+width+".png";
  await page.screenshot({path:path.join(out,p),fullPage:true,animations:"disabled"});screenshots.push(p);
 }
 // Home includes new cross-link to occasions and transparent trust component.
 response=await visit("");
 data=await facts();
 check(width+" home HTTP",response.status()===200);
 check(width+" home trust strip",await page.locator(".home-trust-grid article").count()===3);
 check(width+" home occasion and about crosslinks",
   await page.locator('.home-trust-links a[href="/anlaesse/"]').count()===1&&
   await page.locator('.home-trust-links a[href="/ueber-uns/"]').count()===1);
 check(width+" hero remains image-free",await page.locator(".hero.hero-editorial img").count()===0);
 check(width+" home stable",!data.overflow&&!data.brokenImages.length&&!data.headingsClipped.length,JSON.stringify(data));
 check(width+" no unexpected data writes",writes.length===0,writes.join("|"));
 check(width+" zero browser JS errors",errors.length===0,errors.join("|"));
 await page.close();
}
await browser.close();
const failed=results.filter(x=>!x.pass);
const report={total:results.length,passed:results.length-failed.length,failed:failed.length,
 screenshots,failures:failed,sourcePolicy:"Legacy image rights pending; product imagery is original and unchanged",
 humanVisualReviewRequired:true};
await fs.writeFile(path.join(out,"report.json"),JSON.stringify(report,null,2));
console.log("STEP4_QA",JSON.stringify({total:report.total,passed:report.passed,failed:report.failed,screenshots:screenshots.length}));
if(failed.length)process.exitCode=1;
