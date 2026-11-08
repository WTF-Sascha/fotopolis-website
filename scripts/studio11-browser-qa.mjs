#!/usr/bin/env node
/* Studio 11 visual + functional laboratory QA.
 * Studio 10 is served separately at FOTOPOLIS_BASELINE_URL; Studio 11 at
 * FOTOPOLIS_QA_URL. Browser screenshots are NOT human art-direction approval.
 * All interactions are local; no form POST and no admin endpoint requests.
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const candidateURL = process.env.FOTOPOLIS_QA_URL || "http://127.0.0.1:8765";
const baselineURL = process.env.FOTOPOLIS_BASELINE_URL || "http://127.0.0.1:8764";
const outputDir = "studio11-browser-results";
const widths = [360,390,430,768,1024,1440,1920];
const routes = [
  "/", "/fotobox/", "/fotospiegel/", "/fotowohnwagen/",
  "/pakete/", "/galerie/", "/anlaesse/", "/ueber-uns/",
  "/faq/", "/kontakt/", "/impressum/", "/datenschutz/",
  "/designvorlagen/", "/danke/"
];
const checkWidths = new Set([390,1440]);
await mkdir(outputDir,{recursive:true});
const browser=await chromium.launch({headless:true});
const errors=[],records=[],contrasts=[];

function luminance(rgb) {
  const a=(rgb.match(/[\d.]+/g)||[]).slice(0,3).map(v=>Number(v)/255);
  if(a.length!==3||a.some(v=>!Number.isFinite(v)))return null;
  const x=a.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return x[0]*.2126+x[1]*.7152+x[2]*.0722;
}
function contrastRatio(a,b) {
  const l1=luminance(a),l2=luminance(b);
  if(l1===null||l2===null)return null;
  const hi=Math.max(l1,l2),lo=Math.min(l1,l2);
  return Number(((hi+.05)/(lo+.05)).toFixed(2));
}
const keyOf=(route,width)=>(route==="/"?"home":route.replaceAll("/",""))+"-"+width;

async function prepare(page,url,route){
  const response=await page.goto(url+route,{waitUntil:"networkidle",timeout:45000});
  if(!response||response.status()!==200)
    throw new Error("Navigation HTTP "+(response?.status()??"no response")+" "+url+route);
  await page.evaluate(()=>document.fonts.ready);
  // Actual scroll and decode; a not-yet-loaded lazy image is not declared broken.
  await page.evaluate(async()=>{
    document.documentElement.style.scrollBehavior="auto";
    document.body.style.scrollBehavior="auto";
    window.scrollTo({top:0,behavior:"instant"});
    const h=Math.max(document.documentElement.scrollHeight,window.innerHeight);
    const step=Math.max(500,Math.floor(window.innerHeight*.8));
    for(let y=0;y<h;y+=step){
      window.scrollTo(0,y);
      await new Promise(resolve=>setTimeout(resolve,35));
    }
    for(const image of document.images){
      if(image.closest("[hidden]"))continue;
      if(image.loading==="lazy")image.loading="eager";
    }
    await Promise.all([...document.images].filter(img=>!img.closest("[hidden]"))
      .map(img=>img.decode().catch(()=>undefined)));
    window.scrollTo({top:0,left:0,behavior:"instant"});
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  });
  await page.waitForFunction(()=>window.scrollY===0,{timeout:5000});
  await page.waitForTimeout(120);
}
async function shot(page,key,version) {
  await page.screenshot({path:join(outputDir,key+"-"+version+"-fold.png"),animations:"disabled"});
  await page.screenshot({path:join(outputDir,key+"-"+version+"-full.png"),fullPage:true,animations:"disabled"});
}
async function initialPage(width){
  return browser.newPage({
    viewport:{width,height:width<600?844:900},deviceScaleFactor:1,
    isMobile:width<600,hasTouch:width<600,serviceWorkers:"block"
  });
}

try {
  for(const width of widths){
    for(const route of routes){
      const key=keyOf(route,width),page=await initialPage(width);
      const jsErrors=[],httpErrors=[];
      page.on("pageerror",e=>jsErrors.push(String(e.message)));
      page.on("response",res=>{
        if(res.status()>=400&&res.url().startsWith(candidateURL))
          httpErrors.push(res.status()+" "+res.url());
      });
      const problems=[];
      try{
        if(checkWidths.has(width)){
          const before=await initialPage(width);
          try{await prepare(before,baselineURL,route);await shot(before,key,"studio10")}
          finally{await before.close()}
        }
        await prepare(page,candidateURL,route);
        const data=await page.evaluate(()=>{
          const header=document.querySelector(".studio-header");
          const img=header?.querySelector("img");
          const nav=header?.querySelector(".studio-mainnav");
          const menu=header?.querySelector("[data-menu-toggle]");
          const rect=element=>{
            if(!element)return null;
            const v=element.getBoundingClientRect();
            return {left:v.left,top:v.top,width:v.width,height:v.height,
                    midY:v.top+v.height/2};
          };
          const candidates=[...document.images].filter(x=>!x.closest("[hidden]")&&x.getAttribute("src"));
          const eligible=candidates.filter(img=>img.complete&&img.naturalWidth===0)
            .map(img=>img.currentSrc||img.src);
          const summarize=selector=>{
            const el=document.querySelector(selector);
            if(!el)return null;
            const st=getComputedStyle(el);
            return {foreground:st.color,background:st.backgroundColor,
                    visible:el.getBoundingClientRect().width>0&&el.getBoundingClientRect().height>0};
          };
          return {
            scrollWidth:document.documentElement.scrollWidth,
            bodyWidth:document.body.scrollWidth,
            viewport:window.innerWidth,
            title:document.title,
            headerLogo:img?.getAttribute("src")||"",
            logoLoaded:!!img?.naturalWidth,
            headerRect:rect(header),logoRect:rect(img),navRect:rect(nav),
            menuRect:rect(menu),
            plannerLabel:document.querySelector(".planner-meta-grid label")
              ? {foreground:getComputedStyle(document.querySelector(".planner-meta-grid label")).color,
                 background:getComputedStyle(document.querySelector(".planner-form")).backgroundColor}
              : null,
            theme:document.querySelector('meta[name="theme-color"]')?.content||"",
            themeLoaded:!!document.querySelector('link[href="/studio11-quiet-luxury.css"]'),
            mainCount:document.querySelectorAll("main").length,
            brokenImages:eligible,
            imageCount:candidates.length,
            body: summarize("body"),
            contactRecap: summarize(".contact-recap"),
            darkProductRecap: summarize(".s7-request-summary"),
            layoutGrid: summarize(".gl-grid")
          };
        });
        if(!data.themeLoaded||data.theme.toLowerCase()!=="#181512")
          problems.push("Studio 11 theme or PWA color missing");
        if(data.mainCount!==1)problems.push("Expected one main landmark");
        if(!data.logoLoaded||!data.headerLogo.includes("fotopolis-goldmark.webp"))
          problems.push("Approved logo absent or failed to load");
        if(data.scrollWidth>width+2||data.bodyWidth>width+2)
          problems.push("Horizontal overflow "+Math.max(data.scrollWidth,data.bodyWidth)+"px");
        if(width>1100&&data.headerRect&&data.logoRect&&data.navRect){
          if(data.headerRect.height>100 ||
             Math.abs(data.logoRect.midY-data.navRect.midY)>20 ||
             data.logoRect.left>width*.30)
            problems.push("Header is not one-line, compact and left-branded");
        }
        if(width<=1100&&data.headerRect&&data.logoRect){
          if(data.headerRect.height>95||data.logoRect.left>width*.30)
            problems.push("Mobile header oversized or logo not left-aligned");
        }
        if(route==="/pakete/"&&data.plannerLabel){
          const c=contrastRatio(data.plannerLabel.foreground,data.plannerLabel.background);
          if(c!==null&&c<4.5)problems.push("Package planner label contrast "+c+" <4.5");
        }
        if(data.brokenImages.length)
          problems.push("Image decode failed after actual scroll: "+data.brokenImages.join(", "));
        if(jsErrors.length)problems.push("Browser exceptions: "+jsErrors.join(" | "));
        if(httpErrors.length)problems.push("HTTP errors: "+httpErrors.join(" | "));

        if(route==="/"){
          const hero=await page.locator(".v45-hero .v4-hero-visual img").evaluate(
            el=>({src:el.getAttribute("src"),loaded:el.naturalWidth>0})
          );
          if(!hero.loaded||!hero.src.includes("fotospiegel-hero-lossless.webp"))
            problems.push("Approved Mirror hero photo missing");
          if(await page.locator(".v4-product-card").count()!==3)
            problems.push("Product rail not exactly three items");
          if(await page.locator(".fp11-hero-link").count()!==1)
            problems.push("Single Mirror hero action missing");
        }
        if(route==="/kontakt/"){
          if(await page.locator('form[name="fotopolis-studio9-anfrage"]').count()!==1)
            problems.push("Real Netlify request form missing");
          if(await page.locator('select[name="vorlage"] option').count()!==33)
            problems.push("Contact picker does not offer 32 artworks");
          if(await page.locator('input[name="datenschutz_ok"]').count()!==1)
            problems.push("Consent control missing");
        }
        if(["/fotobox/","/fotospiegel/","/fotowohnwagen/"].includes(route)){
          if(await page.locator("[data-product-request]").count()!==1)
            problems.push("Inline request flow missing");
          if(await page.locator('select[name="vorlage"] option').count()!==33)
            problems.push("Product design picker incomplete");
        }
        if(route==="/designvorlagen/"){
          const gallery=await page.evaluate(async()=>{
            const res=await fetch("/assets/design-gallery-data.json");
            return res.ok?(await res.json()).length:-1;
          });
          if(gallery!==32)problems.push("Gallery manifest not 32 designs");
          const badGalleryImages=await page.locator(".gl-preview img").evaluateAll(images=>
            images.filter(el=>!el.complete||el.naturalWidth===0).map(el=>el.src));
          if(badGalleryImages.length)
            problems.push("Unloaded 32-design preview(s): "+badGalleryImages.join(", "));
        }
        // Exercise the actual gallery UI, not just its static manifest and image tags.
        // Restrict to the mobile representative viewport to keep CI deterministic.
        if(route==="/designvorlagen/"&&width===390){
          const cards=page.locator(".gl-card");
          if(await cards.count()!==32)
            problems.push("Expected 32 rendered gallery cards before interaction");
          else {
            const first=page.locator(".gl-preview").first();
            await first.click();
            const modal=page.locator("[data-gallery-modal]");
            if(!await modal.isVisible())
              problems.push("Gallery detail modal did not open");
            else {
              const close=page.locator("[data-modal-close]");
              if(!await close.evaluate(el=>document.activeElement===el))
                problems.push("Gallery modal failed to focus its close button");
              const href=await page.locator("[data-modal-link]").getAttribute("href");
              if(!href||!href.includes("vorlage=FP-"))
                problems.push("Gallery detail did not pass artwork to inquiry link");
              await page.keyboard.press("Escape");
              if(await modal.isVisible())
                problems.push("Escape did not close gallery modal");
              if(!await first.evaluate(el=>document.activeElement===el))
                problems.push("Gallery modal failed to restore focus to triggering card");
            }
            const search=page.locator("[data-gallery-search]");
            await search.fill("___no_matching_design___");
            if(await cards.count()!==0||!await page.locator("[data-gallery-empty]").isVisible())
              problems.push("Gallery empty search state did not render");
            await search.fill("");
            await page.locator('[data-gallery-category="hochzeit"]').click();
            const weddingCount=await cards.count();
            if(weddingCount<1||weddingCount>=32)
              problems.push("Gallery category filter did not narrow artwork results");
            await page.locator('[data-gallery-category="alle"]').click();
            if(await cards.count()!==32)
              problems.push("Gallery could not restore all 32 artwork cards");
          }
        }
        if(width===390){
          const menu=page.locator("[data-menu-toggle]");
          if(await menu.count()===1){
            await menu.click();
            if(await menu.getAttribute("aria-expanded")!=="true")
              problems.push("Mobile menu did not open");
            if(await page.locator(".studio-mainnav").isVisible()!==true)
              problems.push("Mobile navigation invisible after opening");
            await menu.click();
          }else problems.push("Mobile menu trigger missing");
        }
        for(const [label,sample] of [
          ["contact_recap",data.contactRecap],
          ["dark_product_recap",data.darkProductRecap]
        ]){
          if(sample&&sample.visible){
            const ratio=contrastRatio(sample.foreground,sample.background);
            contrasts.push({key,label,...sample,ratio});
            // Only checks direct host text color against directly opaque surface.
            if(ratio!==null&&ratio<4.5)
              problems.push(label+" calculated contrast "+ratio+" < 4.5");
          }
        }
        if(checkWidths.has(width))await shot(page,key,"studio11");
        records.push({route,width,status:problems.length?"fail":"pass",...data,problems});
        errors.push(...problems.map(x=>key+": "+x));
      }catch(e){
        errors.push(key+": "+e.message);
        records.push({route,width,status:"error",error:e.message});
        try{await page.screenshot({path:join(outputDir,key+"-failure.png"),fullPage:true})}
        catch{}
      }finally{await page.close()}
    }
  }
}finally{await browser.close()}
const report={
  version:"Studio 11.0",createdAt:new Date().toISOString(),
  baseline:"Studio 10.0 fixed git commit f689a209929e25bdd6b6d8717675277d0ec52eb8",
  candidate:"Studio 11.0 separate branch",
  scope:"98 viewport/route checks; 14x2 first-fold/fullpage screenshot pairs; mobile gallery filter/modal/focus regression",
  routes,widths,checked:records.length,failures:errors.length,
  forms:"synthetic DOM and UX only; no POST/no client data",
  visualApproval:"PENDING human screenshot and artwork inspection",
  coreWebVitals:"NOT MEASURED: no field/lab LCP or CLS claims",
  contrastSamples:contrasts,
  results:records,errors
};
await writeFile(join(outputDir,"report.json"),JSON.stringify(report,null,2));
console.log("STUDIO 11 browser QA: "+records.length+" combinations, "+errors.length+" failures.");
if(errors.length){console.error(errors.slice(0,45).join("\n"));process.exitCode=1}
