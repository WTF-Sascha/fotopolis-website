import {chromium} from "playwright";
import assert from "node:assert/strict";

const base=process.env.SITE_BASE_URL||"http://127.0.0.1:8766/";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
let checks=0;const check=(condition,label)=>{assert.ok(condition,label);checks++};
try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:"allow"});
  const page=await context.newPage();
  const res=await page.goto(base,{waitUntil:"networkidle",timeout:45000});
  check(res?.status()===200,"Installed app entry 200");
  const facts=await page.evaluate(async()=>{
    const manifestLink=document.querySelector('link[rel="manifest"]');
    const manifest=manifestLink?await fetch(manifestLink.href,{cache:"no-store"}).then(r=>r.json()):null;
    return {
      pageTitle:document.title,
      manifest,link:manifestLink?.href,
      hero:document.querySelector(".v45-hero img")?.getAttribute("src"),
      count:document.querySelectorAll(".v4-product-card").length,
      railControls:document.querySelectorAll(".v4-rail-controls").length,
      galleryTeasers:document.querySelectorAll("#design-teaser-title").length,
      pwaUpdater:!!document.querySelector('script[src="/pwa-update.js"]'),
    };
  });
  check(facts.manifest?.id==="/"&&facts.manifest?.start_url==="/","Stable installed-app identity");
  check(facts.manifest?.display==="standalone"&&facts.manifest?.scope==="/","Installable display/scope");
  check(facts.manifest?.icons?.some(i=>i.sizes==="192x192"),"192px icon");
  check(facts.manifest?.icons?.some(i=>i.sizes==="512x512"),"512px icon");
  check(facts.count===3&&facts.railControls===0,"Three products and no redundant button row");
  check(facts.galleryTeasers===1&&facts.hero?.includes("fotospiegel-hero"),"Premium product hero and gallery teaser");
  check(facts.pwaUpdater,"On-open app update included");
  const worker=await page.evaluate(async()=>{
    const reg=await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_,reject)=>setTimeout(()=>reject(new Error("SW not ready")),12000))
    ]);
    return reg.active?.scriptURL||"";
  });
  check(worker.endsWith("/service-worker.js"),"Service worker registered");
  await page.reload({waitUntil:"networkidle",timeout:45000});
  check(await page.evaluate(()=>!!navigator.serviceWorker.controller),"App controlled by updated service worker");
  const regUrl=await page.evaluate(async()=>{
    const reg=await navigator.serviceWorker.getRegistration("/");
    await reg.update();
    return reg.active?.scriptURL;
  });
  check(regUrl.endsWith("/service-worker.js"),"Worker update check successful");
  await context.setOffline(true);
  await page.goto(base,{waitUntil:"domcontentloaded",timeout:15000});
  check((await page.locator("#hero-title").textContent()).includes("Momente"),"Offline app shell opens latest homepage");
  await context.setOffline(false);
  await page.goto(new URL("designvorlagen/",base).toString(),{waitUntil:"networkidle",timeout:45000});
  await page.waitForFunction(()=>document.querySelectorAll("[data-gallery-grid] .gl-card").length===44);
  check(await page.locator("[data-gallery-grid] .gl-card").count()===44,"All 44 designs survive app update");
  console.log("PASS: "+checks+" PWA install, update, offline and duplicate navigation assertions.");
  await context.close();
}finally{
  await browser.close();
}
