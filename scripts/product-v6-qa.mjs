import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

/* FOTOPOLIS Product Studio 6.0 acceptance suite
   The tests verify a real visitor flow, including validation and mailto contents.
   No actual email is sent; no reservation is claimed. */
const origin=process.env.SITE_BASE_URL||"http://127.0.0.1:8766/";
const products=[
 {slug:"fotobox",code:"Fotobox",display:"Fotobox",image:"fotobox-event-1672.webp"},
 {slug:"fotospiegel",code:"Fotospiegel",display:"Foto Mirror",image:"fotospiegel-hero-lossless.webp"},
 {slug:"fotowohnwagen",code:"Fotowohnwagen",display:"Fotowohnwagen",image:"fotowohnwagen-gartenparty-1448.webp"}
];
const widths=[320,375,430,768,1024,1440,1920];
const output="concepts/premium-v2/qa-screenshots/products-v6";
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const cases=[],shots=[];
const check=(width,slug,label,pass,detail="")=>{
 const ok=Boolean(pass);
 cases.push({width,slug,label,pass:ok,detail});
 if(!ok)console.error("PRODUCT_V6_FAIL",JSON.stringify({width,slug,label,detail}).slice(0,800));
};
for(const width of widths){
 const page=await browser.newPage({viewport:{width,height:width<=430?820:940},deviceScaleFactor:1,reducedMotion:"reduce"});
 const errors=[],writes=[];
 page.on("pageerror",e=>errors.push(e.message));
 page.on("request",r=>{if(!["GET","HEAD"].includes(r.method()))writes.push(r.method()+" "+r.url())});
 for(const product of products){
  const {slug,code,display,image}=product;
  const result=await page.goto(new URL(slug+"/",origin).toString(),{waitUntil:"networkidle",timeout:45000});
  await page.evaluate(async()=>{
    for(const img of document.images)img.loading="eager";
    await Promise.all([...document.images].map(x=>x.decode().catch(()=>{})));
  });
  const info=await page.evaluate(()=>{
    const $=q=>document.querySelector(q);
    const card=$(".product-enquiry");
    const form=$("[data-product-request]");
    const imgs=[...document.images];
    const formInputs=[...form?.querySelectorAll("input,select,textarea")||[]];
    const heroImg=$(".studio-page-hero-media img");
    const buttons=[...document.querySelectorAll(".s7-next-button,.product-request-submit,.product-request-copy")];
    const headings=[...document.querySelectorAll("h1,h2,h3")];
    const badHeaders=headings.filter(x=>x.clientWidth>0&&x.scrollWidth>x.clientWidth+3).map(x=>x.textContent.trim().slice(0,90));
    const mobileNav=$(".v4-mobile-nav");
    return {
      width:document.documentElement.scrollWidth,innerWidth,
      h1:document.querySelectorAll("main h1").length,
      formCount:document.querySelectorAll("[data-product-request]").length,
      sectionCount:document.querySelectorAll("#terminanfrage").length,
      heroLink:document.querySelector('.v4-page-actions a.button.gold')?.getAttribute("href"),
      navLinks:[...document.querySelectorAll(".studio-route-jumps a")].map(a=>a.getAttribute("href")),
      photo:heroImg?.getAttribute("src"),fit:heroImg?getComputedStyle(heroImg).objectFit:null,
      photoCount:imgs.filter(x=>x.src.includes("/assets/images/")).length,
      badPhotos:imgs.filter(x=>!x.complete||!x.naturalWidth).map(x=>x.getAttribute("src")),
      duplicateStage:document.querySelectorAll(".product-stage-media,.page-aside,.page-end").length,
      specCount:document.querySelectorAll(".s7-feature.product-spec").length,
      storyCount:document.querySelectorAll(".s7-story-layout").length,
      step:document.querySelector("#terminanfrage")?.dataset.currentStep,
      stepTwoHidden:document.querySelector('[data-product-step="2"]')?.hidden,
      faqCount:document.querySelectorAll(".page-body details").length,
      headlineOverflow:badHeaders,
      formProduct:form?.dataset.product,
      formDisplay:form?.dataset.displayProduct,
      hasDateRequired:!!form?.elements.namedItem("datum")?.required,
      hasEmailRequired:!!form?.elements.namedItem("email")?.required,
      hasNameRequired:!!form?.elements.namedItem("name")?.required,
      overflowInput:formInputs.filter(x=>x.scrollWidth>x.clientWidth+5&&x.tagName!=="TEXTAREA").map(x=>x.name),
      buttonHeights:buttons.filter(x=>x.getClientRects().length>0).map(x=>x.getBoundingClientRect().height),
      navVisible:mobileNav?getComputedStyle(mobileNav).display!=="none":false,
      formWithinViewport:!!card&&card.getBoundingClientRect().width<=innerWidth
    };
  });
  if([375,1440].includes(width)){
   await page.evaluate(()=>window.scrollTo({top:0,behavior:"instant"}));
   const filename=slug+"-"+width+"-hero.png";
   await page.screenshot({path:path.join(output,filename),animations:"disabled",fullPage:false});
   shots.push(filename);
  }
  check(width,slug,"HTTP 200",result.status()===200,result.status());
  check(width,slug,"premium story and highlights",info.specCount===3&&info.faqCount===3&&info.storyCount===1);
  check(width,slug,"one direct product request",info.formCount===1&&info.sectionCount===1);
  check(width,slug,"dedicated hero anchor",info.heroLink==="#terminanfrage");
  check(width,slug,"no redundant section pills",info.navLinks.length===0,info.navLinks);
   check(width,slug,"initial step 1 and hidden contact",info.step==="1"&&info.stepTwoHidden);
  check(width,slug,"no repetitive marketing blocks",info.duplicateStage===0,info.duplicateStage);
  check(width,slug,"hero uses original product image",info.photo?.includes(image)&&info.fit==="contain",info.photo);
  check(width,slug,"no duplicate product photo",info.photoCount===1,info.photoCount);
  check(width,slug,"real product identity",info.formProduct===code&&info.formDisplay===display,info);
  check(width,slug,"required date and contact",info.hasDateRequired&&info.hasEmailRequired&&info.hasNameRequired);
  check(width,slug,"responsive layout",info.width<=info.innerWidth+2&&info.formWithinViewport,{actual:info.width,expected:info.innerWidth});
  check(width,slug,"no clipped headers or fields",info.headlineOverflow.length===0&&info.overflowInput.length===0,info.headlineOverflow);
  check(width,slug,"form controls are touch sized",info.buttonHeights.every(h=>h>=44),info.buttonHeights);
  check(width,slug,"all images load",info.badPhotos.length===0,info.badPhotos);
  check(width,slug,"mobile navigation",info.navVisible===(width<=760));
  check(width,slug,"no runtime errors",errors.length===0,errors);
  const date=page.locator('[data-product-request] [name="datum"]');
  const next=page.locator("[data-product-next]");
  await next.click();
  check(width,slug,"missing date blocked",await date.getAttribute("aria-invalid")==="true");
  check(width,slug,"visible validation text",((await page.locator("[data-product-request-status]").textContent())||"").includes("Wunschtermin"));
  if(width<=760){
    await date.focus();
    check(width,slug,"mobile bottom bar hides while typing",await page.evaluate(()=>
      document.body.classList.contains("form-focus-active") &&
      getComputedStyle(document.querySelector(".v4-mobile-nav")).visibility==="hidden"));
    await date.evaluate(el=>el.blur());
    await page.waitForFunction(()=>!document.body.classList.contains("form-focus-active"));
    check(width,slug,"mobile bottom bar returns after input blur",await page.evaluate(()=>
      getComputedStyle(document.querySelector(".v4-mobile-nav")).visibility!=="hidden"));
  }
  const future=await page.evaluate(()=>{
    const dt=new Date();dt.setDate(dt.getDate()+18);
    return [dt.getFullYear(),String(dt.getMonth()+1).padStart(2,"0"),String(dt.getDate()).padStart(2,"0")].join("-");
  });
  await date.fill("2020-01-01");
  await next.click();
  check(width,slug,"past date blocked",await date.getAttribute("aria-invalid")==="true");
  await date.fill(future);
  await page.locator('[data-product-request] [name="tageszeit"]').selectOption("Abend");
  await page.locator('[data-product-request] [name="ort"]').fill("Ahlen");
  await page.locator('[data-product-request] [name="anlass"]').selectOption("Hochzeit");
  await next.click();
  const advanced=await page.evaluate(()=>({
    step:document.querySelector("#terminanfrage")?.dataset.currentStep,
    hiddenOne:document.querySelector('[data-product-step="1"]')?.hidden,
    visibleTwo:!document.querySelector('[data-product-step="2"]')?.hidden,
    selected:document.querySelector('[data-product-progress="2"]')?.getAttribute("aria-current")
  }));
  check(width,slug,"step 2 reached",advanced.step==="2"&&advanced.hiddenOne&&advanced.visibleTwo&&advanced.selected==="step",advanced);
  const mail=page.locator("[data-product-request-email]");
  await mail.click();
  check(width,slug,"missing name blocked",await page.locator('[data-product-request] [name="name"]').getAttribute("aria-invalid")==="true");
  check(width,slug,"second-step error remains visible",((await page.locator("[data-product-request-status]").textContent())||"").includes("Namen"));
  await page.locator('[data-product-request] [name="name"]').fill("Max Mustermann");
  await page.locator('[data-product-request] [name="email"]').fill("incorrect");
  await mail.click();
  check(width,slug,"invalid email blocked",await page.locator('[data-product-request] [name="email"]').getAttribute("aria-invalid")==="true");
  await page.locator('[data-product-request] [name="email"]').fill("max@example.org");
  await page.locator('[data-product-request] [name="notiz"]').fill("Bitte Druckoptionen prüfen.");
  await page.locator("[data-product-back]").click();
  check(width,slug,"back keeps date",await date.inputValue()===future);
  await next.click();
  check(width,slug,"forward retains email",await page.locator('[data-product-request] [name="email"]').inputValue()==="max@example.org");
  const infoAfter=await page.evaluate(()=>{
    const a=document.querySelector("[data-product-request-email]");
    const full=document.querySelector("[data-product-request-full]");
    const summary=document.querySelector("[data-product-summary-date]").textContent;
    return {mailto:a?.href,full:full?.getAttribute("href"),summary,bodyWidth:document.documentElement.scrollWidth};
  });
  const parsed=new URL(infoAfter.mailto);
  const subject=decodeURIComponent(parsed.searchParams.get("subject")||"");
  const message=decodeURIComponent(parsed.searchParams.get("body")||"");
  check(width,slug,"email addressed correctly",parsed.protocol==="mailto:"&&parsed.pathname==="kontakt@fotopolis-mieten.de");
  check(width,slug,"email includes only selected product",subject.includes(display)&&message.includes("FOTOERLEBNIS: "+display),subject);
  check(width,slug,"correct date, location and user details",message.includes(future.slice(0,4))&&message.includes("Ahlen")&&message.includes("max@example.org")&&message.includes("Bitte Druckoptionen prüfen."));
  check(width,slug,"explicit no-reservation disclaimer",message.includes("keine Buchung oder Reservierung"));
  check(width,slug,"date summary updates",infoAfter.summary.includes(future.slice(0,4)),infoAfter.summary);
  check(width,slug,"full enquiry link does not leak PII",!infoAfter.full.includes("Mustermann")&&!infoAfter.full.includes("example.org"));
  // Preserve product, date, time and place in the existing full contact wizard.
  await page.goto(new URL(infoAfter.full,origin).toString(),{waitUntil:"networkidle"});
  const prefilled=await page.evaluate(()=>({
    product:document.querySelector('[data-contact-flow] [name="produkt"]')?.value,
    date:document.querySelector('[data-contact-flow] [name="datum"]')?.value,
    time:document.querySelector('[data-contact-flow] [name="tageszeit"]')?.value,
    place:document.querySelector('[data-contact-flow] [name="ort"]')?.value,
    occasion:document.querySelector('[data-contact-flow] [name="anlass"]')?.value,
    details:document.querySelector('[data-contact-flow] [name="details"]')?.value
  }));
  check(width,slug,"detailed enquiry keeps all event details",
    prefilled.product===code&&prefilled.date===future&&prefilled.time==="Abend"&&prefilled.place==="Ahlen"&&prefilled.occasion==="Hochzeit"&&prefilled.details.includes("Druckoptionen"),prefilled);
  check(width,slug,"no visitor POST or PUT",writes.length===0,writes);
  if([320,375,430,1440].includes(width)){
   await page.goto(new URL(slug+"/",origin).toString(),{waitUntil:"networkidle"});
   await page.evaluate(()=>{
     document.querySelector("#terminanfrage")?.scrollIntoView({block:"start",behavior:"instant"});
   });
   const file=slug+"-"+width+"-request.png";
   await page.screenshot({path:path.join(output,file),animations:"disabled",fullPage:false});
   shots.push(file);
   const picDate=page.locator('[data-product-request] [name="datum"]');
   const picFuture=await page.evaluate(()=>{
     const d=new Date();d.setDate(d.getDate()+22);
     return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
   });
   await picDate.fill(picFuture);
   await page.locator("[data-product-next]").click();
   await page.locator("[data-product-request-email]").scrollIntoViewIfNeeded();
   const visible=await page.evaluate(()=>{
     const button=document.querySelector(".product-request-submit")?.getBoundingClientRect();
     const nav=document.querySelector(".v4-mobile-nav")?.getBoundingClientRect();
     return {buttonTop:button?.top,buttonBottom:button?.bottom,navTop:nav?.top};
   });
   if(width<=430)check(width,slug,"enquiry action not covered by bottom navigation",
     Number(visible.buttonTop)>=0&&Number(visible.buttonTop)<Number(visible.navTop),visible);
   const recapFile=slug+"-"+width+"-actions.png";
   await page.screenshot({path:path.join(output,recapFile),animations:"disabled",fullPage:false});
   shots.push(recapFile);
  }
  errors.length=0;
 }
 await page.close();
}
// No-JS fallback must offer a working human-operated email contact.
const noJs=await browser.newPage({viewport:{width:375,height:820},javaScriptEnabled:false});
for(const slug of ["fotobox","fotospiegel","fotowohnwagen"]){
  const resp=await noJs.goto(new URL(slug+"/",origin).toString(),{waitUntil:"domcontentloaded"});
  const fallback=noJs.locator(".s7-nojs a[href^='mailto:']");
  check(375,slug,"no JavaScript email fallback",resp.status()===200&&await fallback.count()===1&&await fallback.isVisible());
}
await noJs.close();
await browser.close();
const failed=cases.filter(x=>!x.pass);
const report={version:"7.0",pages:products.length,widths,checks:cases.length,passed:cases.length-failed.length,failed:failed.length,failures:failed,screenshots:shots};
await fs.writeFile(path.join(output,"report.json"),JSON.stringify(report,null,2));
console.log("PRODUCT_V7_QA",JSON.stringify({pages:report.pages,widths:widths.length,checks:report.checks,failed:report.failed,screenshots:shots.length}));
if(failed.length)process.exitCode=1;
