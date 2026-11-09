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
        heroSrc:hero?.getAttribute("src")??"",
        heroFit:hero?getComputedStyle(hero).objectFit:"",
        heroVisualPosition:document.querySelector(".v45-hero .v4-hero-visual")?getComputedStyle(document.querySelector(".v45-hero .v4-hero-visual")).position:"",
        originalKicker:document.querySelector(".v45-hero .v4-hero-kicker")?.textContent??"",
        heroBounds:hero?{w:hero.getBoundingClientRect().width,h:hero.getBoundingClientRect().height}:null,
        heroSectionHeight:document.querySelector(".v45-hero")?.getBoundingClientRect().height??0,
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
    ok(home.heroSrc.includes("fotospiegel-hero-lossless.webp")&&home.heroFit==="contain","Flagship Foto Mirror not fully visible at "+width);
    ok(home.heroVisualPosition==="absolute"&&home.originalKicker.includes("PREMIUM FOTOERLEBNISSE"),"Original background hero not restored at "+width);
    ok((home.heroBounds?.h??0)>240&&home.heroSectionHeight<850,"Hero scale or excess vertical whitespace at "+width);
    ok(home.cards.join(",")==="fotobox,fotospiegel,fotowohnwagen","Products reordered at "+width);
    ok(home.productPhotoWidths.every(x=>x>200),"One or more product images not loaded at "+width);
    ok(home.isPhotoFirst&&!home.fullCatalogOnHome,"Gallery displaced photo-first home at "+width);
    ok(!home.overflow,"Home horizontal overflow at "+width);
    await page.screenshot({path:output+"/homepage-"+width+".png",fullPage:true,animations:"disabled"});
    // All arrow icons must be consistently aligned to the label text.
    if(width<=768){
      await page.locator("[data-menu-toggle]").click();
      ok(await page.locator("#mainnav").isVisible(),"Mobile menu failed to open at "+width);
    }
    const navIcons=await page.evaluate(()=>{
      const triggers=[...document.querySelectorAll(".studio-mainnav .nav-trigger")];
      const cta=document.querySelector(".studio-mainnav .nav-cta");
      const measure=(el,svg)=>{
        if(!el||!svg)return false;
        const range=document.createRange();
        range.selectNodeContents(el.firstChild);
        const textRect=range.getBoundingClientRect();
        const iconRect=svg.getBoundingClientRect();
        return iconRect.width>=10 && iconRect.height>=10 &&
          Math.abs((iconRect.top+iconRect.height/2)-(textRect.top+textRect.height/2))<6;
      };
      return {
        count:triggers.length,
        uniform:triggers.every(btn=>btn.querySelectorAll("svg.nav-chevron").length===1),
        aligned:triggers.every(btn=>measure(btn,btn.querySelector("svg.nav-chevron"))),
        noOldGlyph:!triggers.some(btn=>btn.textContent.includes("⌄")),
        ctaAligned:measure(cta,cta?.querySelector("svg.nav-cta-arrow"))
      };
    });
    ok(navIcons.count===2&&navIcons.uniform&&navIcons.noOldGlyph,"Missing matching dropdown chevrons at "+width);
    ok(navIcons.aligned&&navIcons.ctaAligned,"Menu chevrons are not vertically aligned at "+width);
    await page.locator(".studio-mainnav .nav-trigger").first().click();
    ok(await page.locator(".studio-mainnav .nav-trigger").first().getAttribute("aria-expanded")==="true","First dropdown did not open at "+width);
    await page.locator(".studio-mainnav .nav-trigger").last().click();
    ok(await page.locator(".studio-mainnav .nav-trigger").first().getAttribute("aria-expanded")==="false"&&await page.locator(".studio-mainnav .nav-trigger").last().getAttribute("aria-expanded")==="true","Dropdown synchronization failed at "+width);

    response=await page.goto(serverUrl("designvorlagen/"),{waitUntil:"networkidle",timeout:45000});
    ok(response?.status()===200,"Design route HTTP error at "+width);
    await page.waitForFunction(()=>document.querySelectorAll("[data-gallery-grid] .gl-card").length===44,{timeout:20000});
    ok(await page.locator("[data-gallery-grid] .gl-card").count()===44,"44 cards not rendered at "+width);
    ok(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2)),"Design gallery overflow at "+width);
    await page.screenshot({path:output+"/designgallery-"+width+".png",fullPage:true,animations:"disabled"});
    await page.locator('[data-gallery-category="hochzeit"]').click();
    const filtered=await page.locator("[data-gallery-grid] .gl-card").count();
    ok(filtered>0&&filtered<44,"Wedding filter failed at "+width);
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
  console.log("PASS: "+total+" cross-device checks for 3 product photos, studio home, 44 templates, filtering, modal, enquiry, routes and overflow.");
}finally{
  await browser.close();
}
