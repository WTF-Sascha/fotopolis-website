#!/usr/bin/env node
// FOTOPOLIS welcome-only hero: rendered responsive and semantic checks.
// Public homepage is tested against a local built preview, no private data.
import assert from "node:assert/strict";
import {chromium} from "playwright";
const base=process.env.SITE_BASE_URL||"http://127.0.0.1:8765/";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try{
 for(const width of [320,375,430,768,1440]){
  const context=await browser.newContext({viewport:{width,height:850},locale:"de-DE"});
  const page=await context.newPage();
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  await page.goto(new URL("/",base).href,{waitUntil:"domcontentloaded"});
  const hero=page.locator("#start.fp17-welcome-hero");
  assert.equal(await hero.count(),1,"Welcome hero missing at "+width);
  assert.equal(await hero.locator("h1").count(),1,"Single H1 in welcome hero");
  assert.equal(await hero.locator("a,button,[role=button]").count(),0,
    "No product or contact links in welcome hero");
  assert.equal(await hero.locator("img,picture,video").count(),0,
    "Hero is decorative and never singles out a product photo");
  const text=await hero.innerText();
  assert.match(text,/WILLKOMMEN BEI FOTOPOLIS/);
  assert.doesNotMatch(text,/(Fotospiegel|Foto Mirror|Fotobox|Fotowohnwagen|Produkt entdecken)/i);
  assert.equal(await page.locator(".v4-product-card").count(),3,
    "Three original product entries must remain below the greeting");
  const layout=await page.evaluate(()=>{
    const hero=document.querySelector("#start"),title=hero.querySelector("h1");
    const h=hero.getBoundingClientRect(),t=title.getBoundingClientRect();
    const style=getComputedStyle(hero);
    return {documentWidth:document.documentElement.scrollWidth,viewport:innerWidth,
      heroHeight:h.height,titleRight:t.right,visible:style.display!=="none",titleLeft:t.left};
  });
  assert.ok(layout.visible&&layout.heroHeight>=410,"Welcome hero occupies a readable area "+width);
  assert.ok(layout.documentWidth<=layout.viewport+2,"Horizontal overflow "+width);
  assert.ok(layout.titleLeft>=0&&layout.titleRight<=width+2,
    "Welcome title must fit viewport "+width);
  assert.deepEqual(errors,[],"No JS exceptions at "+width);
  await context.close();
 }
 console.log("FOTOPOLIS WELCOME HERO QA PASS: product-neutral greeting, accessibility and five breakpoints.");
}finally{await browser.close()}
