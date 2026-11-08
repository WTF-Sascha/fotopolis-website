#!/usr/bin/env node
/**
 * Browser-based visual/functional smoke test for the combined presentation.
 * Serve preview-build at SITE_BASE_URL before running.
 */
import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const base=process.env.SITE_BASE_URL || "http://127.0.0.1:8766/";
const widths=[375,768,1440];
const output="qa-gallery-screenshots";
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
let total=0;
const ok=(condition,message)=>{assert.ok(condition,message);total++};
const serverUrl=(p="")=>new URL(p,base).toString();
try{
  for(const width of widths){
    const page=await browser.newPage({
      viewport:{width,height:width<=375?812:930},
      deviceScaleFactor:1,reducedMotion:"reduce",
      isMobile:width<=768,hasTouch:width<=768
    });
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    page.on("response",r=>{
      if(r.url().startsWith(base)&&r.status()>=400)errors.push("HTTP "+r.status()+" "+r.url());
    });
    let response=await page.goto(serverUrl(),{waitUntil:"networkidle",timeout:45000});
    ok(response?.status()===200,"Home did not return 200 at "+width);
    await page.evaluate(async()=>{
      for(const img of document.images)img.loading="eager";
      await Promise.all([...document.images].map(img=>img.decode().catch(()=>{})));
    });
    const home=await page.evaluate(()=>{
      const hero=document.querySelector(".v45-hero .v4-hero-visual img");
      const cards=[...document.querySelectorAll(".v4-product-card")];
      const images=cards.map(c=>c.querySelector("img"));
      return {
        heroWidth:hero?.naturalWidth??0,
        cards:cards.map(c=>c.id),
        productPhotoWidths:images.map(i=>i?.naturalWidth??0),
        broken:images.filter(i=>!i||!i.complete||!i.naturalWidth).map(i=>i?.src),
        sections:[...document.querySelectorAll("main > section")].map(s=>s.className),
        isPhotoFirst:(document.querySelector("#erlebnisse")?.compareDocumentPosition(document.querySelector("#design-teaser-title"))&Node.DOCUMENT_POSITION_FOLLOWING)!==0,
        fullCatalogOnHome:!!document.querySelector("[data-design-gallery]"),
        overflow:document.documentElement.scrollWidth>innerWidth+2,
      };
    });
    ok(home.heroWidth>200,"Hero image missing at "+width);
    ok(home.cards.join(",")==="fotobox,fotospiegel,fotowohnwagen","Products reordered at "+width);
    ok(home.productPhotoWidths.every(x=>x>200),"One or more product images not loaded at "+width);
    ok(home.isPhotoFirst&&!home.fullCatalogOnHome,"Gallery displaced photo-first home at "+width);
    ok(!home.overflow,"Home horizontal overflow at "+width);
    await page.screenshot({path:output+"/homepage-"+width+".png",fullPage:true,animations:"disabled"});
    response=await page.goto(serverUrl("designvorlagen/"),{waitUntil:"networkidle",timeout:45000});
    ok(response?.status()===200,"Design route HTTP error at "+width);
    await page.waitForFunction(()=>document.querySelectorAll("[data-gallery-grid] .gl-card").length===32,{timeout:20000});
    ok(await page.locator("[data-gallery-grid] .gl-card").count()===32,"32 cards not rendered at "+width);
    ok(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)),"Design gallery overflow at "+width);
    await page.screenshot({path:output+"/designgallery-"+width+".png",fullPage:true,animations:"disabled"});
    await page.locator('[data-gallery-category="hochzeit"]').click();
    const filtered=await page.locator("[data-gallery-grid] .gl-card").count();
    ok(filtered>0&&filtered<32,"Wedding filter failed at "+width);
    await page.locator(".gl-preview").first().click();
    ok(await page.locator("[data-gallery-modal]").isVisible(),"Template detail did not open at "+width);
    const link=await page.locator("[data-modal-link]").getAttribute("href");
    ok(link?.includes("vorlage=FP-")&&link?.includes("produkt=Fotobox"),"Template enquiry handoff missing at "+width);
    await page.keyboard.press("Escape");
    ok(!(await page.locator("[data-gallery-modal]").isVisible()),"Escape did not close gallery detail at "+width);
    response=await page.goto(serverUrl("fotospiegel/"),{waitUntil:"networkidle",timeout:45000});
    ok(response?.status()===200,"Photo mirror detail unavailable at "+width);
    ok(await page.locator("#terminanfrage").count()===1,"Mirror direct enquiry missing at "+width);
    ok(await page.locator('a[href*="/designvorlagen/?produkt=Fotospiegel"]').count()>0,"Product to design link missing at "+width);
    ok(errors.length===0,"Browser errors at "+width+": "+JSON.stringify(errors));
    await page.close();
  }
  console.log("PASS: "+total+" cross-device checks for 3 product photos, studio home, 32 templates, filtering, modal, enquiry, routes and overflow.");
}finally{
  await browser.close();
}
