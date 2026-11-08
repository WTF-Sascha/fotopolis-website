import {chromium} from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const base=process.env.SITE_BASE_URL||"http://127.0.0.1:8766/";
const out="concepts/premium-v2/qa-screenshots/studio-3-review";
const widths=[320,375,430,768,1024,1280,1440,1920];
const capture=[320,768,1440];
const results=[],screenshots=[];
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const check=(label,pass,detail="")=>{
  const ok=!!pass;results.push({label,pass:ok,detail});
  if(!ok)console.error("STUDIO3_FAIL",label,detail);
};
for(const width of widths){
 const page=await browser.newPage({viewport:{width,height:900},reducedMotion:"reduce"});
 const errors=[],writes=[];
 page.on("pageerror",e=>errors.push(e.message));
 page.on("request",r=>{if(!["GET","HEAD"].includes(r.method()))writes.push(r.method()+" "+r.url());});
 const visit=async route=>page.goto(new URL(route,base).toString(),{waitUntil:"networkidle",timeout:40000});
 const facts=async()=>page.evaluate(()=>{
   const cards=[...document.querySelectorAll("h1,h2,h3")];
   return {
      overflow:document.documentElement.scrollWidth > innerWidth+2,
      clippedHeadings:cards.filter(x=>x.clientHeight>0&&x.scrollHeight>x.clientHeight+3)
        .map(x=>x.innerText.slice(0,55)),
      brokenImages:[...document.images].filter(x=>!x.complete||x.naturalWidth===0).map(x=>x.getAttribute("src")),
      noIndex:document.querySelector('meta[name="robots"]')?.content.includes("noindex"),
      css:!!document.querySelector('link[href="/studio-polish.css"]'),
      h1:document.querySelectorAll("main h1").length,
      logo:document.querySelector(".identity img")?.getAttribute("src")
   };
 });
 let res=await visit("");
 // A full-page visual audit must decode the existing lazy-loaded legacy gallery
 // thumbnails before assessing image integrity, including below-fold images.
 await page.evaluate(async()=>{
   for(const image of document.images)image.loading="eager";
   await Promise.all([...document.images].map(image=>image.decode().catch(()=>{})));
 });
 let d=await facts();
 check(width+" home 200",res.status()===200);
 check(width+" accessible hero and brand",d.h1===1&&d.logo==="/assets/fotopolis-logo-original.png");
 check(width+" new CSS and preview robots",d.css&&d.noIndex);
 check(width+" approved photo-led hero",await page.locator(".v4-hero img[src*=fotobox-event-1672]").count()===1);
 check(width+" collapsed redundant storytelling",await page.locator(".intro.section,.interlude.section").count()===0);
 check(width+" three original product scenes",await page.locator(".v4-product-card img").count()===3);
 check(width+" three direct product cards",await page.locator(".v4-product-card").count()===3);
 check(width+" product order",[...await page.locator(".v4-product-card").evaluateAll(nodes=>nodes.map(n=>n.id))].join(",")==="fotobox,fotospiegel,fotowohnwagen");
 check(width+" detail links",(await page.locator(".v4-product-card").evaluateAll(nodes=>nodes.every(n=>n.getAttribute("href")==="/"+n.id+"/"))));
 check(width+" no occasion advisor",await page.locator("#studio-berater,[data-advisor-occasion]").count()===0);
 check(width+" minimal home sections",await page.locator("main > section").count()===3);
 check(width+" final booking inquiry link",(await page.locator(".v45-final-cta a.button").getAttribute("href"))==="/kontakt/");
 d=await facts();
 check(width+" home no overflow/clipping",!d.overflow&&d.clippedHeadings.length===0,JSON.stringify(d));
 check(width+" home images loaded",d.brokenImages.length===0,d.brokenImages.join(","));
 check(width+" no duplicated home information",await page.locator(".home-trust,.v4-advantages,.v4-hero-meta,.v4-date-cta,main .gallery").count()===0);
 check(width+" direct product navigation accessible",await page.locator(".v4-product-card[aria-label]").count()===3);
 if(capture.includes(width)){
   await page.evaluate(async()=>{
     for(const img of document.images)img.loading="eager";
     await Promise.all([...document.images].map(x=>x.decode().catch(()=>{})));
     if(document.activeElement instanceof HTMLElement)document.activeElement.blur();
     window.scrollTo({top:0,behavior:"instant"});
   });
   await page.waitForFunction(()=>window.scrollY===0);
   for(const [type,opts] of [
     ["fold",{fullPage:false}],
     ["full",{fullPage:true}]
   ]){
     const filename="start-"+width+"-"+type+".png";
     await page.screenshot({path:path.join(out,filename),animations:"disabled",...opts});
     screenshots.push(filename);
   }
 }
 const mobile=width<=720;
 check(width+" unobstructed layout has no floating CTA",await page.locator(".mobile-quick-cta").count()===0);
 if(mobile){
   const toggle=page.locator("[data-menu-toggle]");
   await toggle.click();
   check(width+" menu state open",await toggle.getAttribute("aria-expanded")==="true");
   await page.keyboard.press("Escape");
   check(width+" menu closes accessibly",await toggle.getAttribute("aria-expanded")==="false");
 }
 // Route overview: essential links visible and detailed content accessible.
 for(const route of ["fotobox/","fotospiegel/","fotowohnwagen/","pakete/","galerie/","anlaesse/","ueber-uns/","kontakt/"]){
   res=await visit(route);
   d=await facts();
   check(width+" "+route+" 200",res.status()===200);
   check(width+" "+route+" design system",d.css&&d.noIndex&&d.h1===1);
   check(width+" "+route+" usable bounds",!d.overflow&&!d.clippedHeadings.length,JSON.stringify(d));
   check(width+" "+route+" images",!d.brokenImages.length,d.brokenImages.join(","));
   const jumps=await page.locator(".studio-route-jumps a").count();
   const isProduct=["fotobox/","fotospiegel/","fotowohnwagen/"].includes(route);
   check(width+" "+route+" context-appropriate navigation",
     (route==="kontakt/"||isProduct)?jumps===0:jumps>=2);
   if(isProduct){
     check(width+" "+route+" inline product enquiry",await page.locator("#terminanfrage [data-product-request]").count()===1);
     check(width+" "+route+" useful hero CTA",
       await page.locator('main .v4-page-actions a.button.gold[href="#terminanfrage"]').count()===1);
   }
   const paths=await page.locator('.studio-route-jumps a[href^="#"]').evaluateAll(nodes=>
      nodes.map(n=>n.getAttribute("href")).filter(h=>!document.getElementById(h.slice(1))));
   check(width+" "+route+" valid quicklinks",paths.length===0,paths.join(","));
   check(width+" "+route+" detailed disclosures",await page.locator(".studio-disclosure").count()>0);
   if(route==="kontakt/"){
     check(width+" contact has no obscuring overlay",await page.locator(".mobile-quick-cta").count()===0);
   }
 }
 // Existing direct product/occasion URLs on the contact page continue to work.
 await visit("kontakt/?produkt=Fotowohnwagen&anlass=Motto-%20%2F%20Gartenparty");
 check(width+" full context preselection",
   await page.locator('select[name="produkt"]').inputValue()==="Fotowohnwagen"&&
   await page.locator('select[name="anlass"]').inputValue()==="Motto- / Gartenparty");
 check(width+" zero browser JS errors",errors.length===0,errors.join("|"));
 check(width+" no background writes",writes.length===0,writes.join("|"));
 await page.close();
}
await browser.close();
const failures=results.filter(x=>!x.pass);
await fs.writeFile(path.join(out,"report.json"),JSON.stringify({
  total:results.length,passed:results.length-failures.length,failed:failures.length,
  screenshots,failures,requiresHumanScreenshotReview:true
},null,2));
console.log("STUDIO3_QA",JSON.stringify({total:results.length,passed:results.length-failures.length,failed:failures.length,screenshots:screenshots.length}));
if(failures.length)process.exitCode=1;
