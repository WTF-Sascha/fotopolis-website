import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
const base=process.env.SITE_BASE_URL || "http://127.0.0.1:8765";
const outDir="qa-artifacts";
await fs.mkdir(outDir,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const results=[];
const pages=["/","/fotobox/","/fotospiegel/","/fotowohnwagen/","/anlaesse/","/leistungen/","/faq/","/ueber/","/kontakt/","/rechtliches/"];
const viewports=[{label:"mobile-320",width:320,height:760},{label:"mobile-375",width:375,height:812},{label:"tablet-768",width:768,height:1024},{label:"desktop-1440",width:1440,height:900}];
let failCount=0;
async function check(name,ok,details=""){
  results.push({name,status:ok?"PASS":"FAIL",details});
  if(!ok){failCount++;console.error("FAIL",name,details)}else console.log("PASS",name);
}
const context=await browser.newContext({deviceScaleFactor:1});
for(const viewport of viewports){
  const page=await context.newPage();
  await page.setViewportSize({width:viewport.width,height:viewport.height});
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  const targets=viewport.label==="mobile-375"||viewport.label==="desktop-1440"?pages:["/","/kontakt/"];
  for(const route of targets){
    let response;
    try{response=await page.goto(base+route,{waitUntil:"networkidle",timeout:30000})}
    catch(error){await check(viewport.label+" "+route+" navigation",false,error.message);continue}
    const name=route==="/"? "home":route.slice(1,-1);
    await check(viewport.label+" "+route+" status",response?.status()===200,String(response?.status()));
    await page.screenshot({path:path.join(outDir,name+"-"+viewport.label+".png"),fullPage:true,animations:"disabled"});
    const info=await page.evaluate(()=>({
      scrollWidth:document.documentElement.scrollWidth,
      viewport:innerWidth,
      brokenImages:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.getAttribute("src")),
      headingCount:document.querySelectorAll("main h1").length
    }));
    await check(viewport.label+" "+route+" no-overflow",info.scrollWidth<=info.viewport+2,info.scrollWidth+" / "+info.viewport);
    await check(viewport.label+" "+route+" images",info.brokenImages.length===0,info.brokenImages.join(","));
    await check(viewport.label+" "+route+" h1",info.headingCount===1,String(info.headingCount));
  }
  if(viewport.width<=768){
    await page.goto(base+"/",{waitUntil:"domcontentloaded"});
    const toggle=page.locator("[data-menu-button]");
    await check(viewport.label+" menu-visible",await toggle.isVisible());
    await toggle.click();
    await check(viewport.label+" menu-open",await toggle.getAttribute("aria-expanded")==="true");
    await page.keyboard.press("Escape");
    await check(viewport.label+" menu-escape",await toggle.getAttribute("aria-expanded")==="false");
  }
  await check(viewport.label+" JS-errors",errors.length===0,errors.join(" | "));
  await page.close();
}
const page=await context.newPage();
await page.goto(base+"/",{waitUntil:"domcontentloaded"});
await page.locator("[data-occasion='firma']").click();
await check("occasion-title",await page.locator("[data-occasion-title]").innerText()==="Menschen verbinden. Eindrücke behalten.");
await check("occasion-link",String(await page.locator("[data-occasion-link]").getAttribute("href")).includes("Firmenevent"));
await page.goto(base+"/faq/",{waitUntil:"domcontentloaded"});
await page.locator("details summary").first().click();
await check("faq-expand",await page.locator("details").first().getAttribute("open")!==null);
await page.goto(base+"/kontakt/?produkt=Fotobox&anlass=Hochzeit",{waitUntil:"domcontentloaded"});
await check("contact-product",await page.locator("[name=produkt]").inputValue()==="Fotobox");
await check("contact-occasion",await page.locator("[name=anlass]").inputValue()==="Hochzeit");
await check("form-no-network-submit",!await page.locator("[data-enquiry-form]").getAttribute("action"));
const manifest=await page.request.get(base+"/manifest.webmanifest");
await check("manifest-status",manifest.ok(),String(manifest.status()));
if(manifest.ok()){
  const data=await manifest.json();
  for(const icon of data.icons || []){
    const r=await page.request.get(base+icon.src);
    await check("icon "+icon.sizes+" "+icon.purpose,r.ok(),String(r.status()));
  }
}
await page.close();
await browser.close();
const report={generatedAt:new Date().toISOString(),testedURL:base,total:results.length,failures:failCount,status:failCount===0?"PASS":"FAIL",results};
await fs.writeFile(path.join(outDir,"report.json"),JSON.stringify(report,null,2));
await fs.writeFile(path.join(outDir,"SUMMARY.md"),"# Browser QA\n\nResult: "+report.status+" — "+report.total+" checks, "+failCount+" failures.\nScreenshots require human visual review, not just successful test assertions.\n");
if(failCount>0)process.exitCode=1;
