#!/usr/bin/env node
/* Current FOTOPOLIS release candidate: 14 real public routes x 7 widths.
 * No authenticated impersonation, no HTTP POST, no customer data or DB writes.
 * Replaces the obsolete Studio-11 test contract requiring a Mirror CTA in Hero.
 */
import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir,writeFile} from "node:fs/promises";

const base=process.env.FOTOPOLIS_QA_URL||"http://127.0.0.1:8765";
const paths=[
 "/", "/fotobox/", "/fotospiegel/", "/fotowohnwagen/", "/pakete/",
 "/galerie/", "/anlaesse/", "/ueber-uns/", "/faq/", "/kontakt/",
 "/impressum/", "/datenschutz/", "/designvorlagen/", "/danke/"
];
const widths=[360,390,430,768,1024,1440,1920];
const output="studio15-release-browser-results";
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const results=[],failures=[];
try{
 for(const width of widths){
  const context=await browser.newContext({
   viewport:{width,height:width<600?844:900},locale:"de-DE",
   deviceScaleFactor:1,serviceWorkers:"block"
  });
  try{
   for(const path of paths){
    const page=await context.newPage();
    const errors=[],writes=[];
    page.on("pageerror",error=>errors.push(error.message));
    page.on("request",request=>{
     if(!["GET","HEAD"].includes(request.method()))writes.push(request.method()+" "+request.url());
    });
    try{
     const response=await page.goto(new URL(path,base).href,{
      waitUntil:"domcontentloaded",timeout:40000
     });
     assert.equal(response?.status(),200,path+" HTTP status");
     await page.evaluate(()=>document.fonts.ready);
     const layout=await page.evaluate(()=>{
      const logo=document.querySelector('header .studio-identity img');
      return {
       viewport:innerWidth,
       width:document.documentElement.scrollWidth,
       mainCount:document.querySelectorAll("main").length,
       logo:logo?.getAttribute("src")||null,
       theme:document.querySelector('meta[name="theme-color"]')?.content||null
      };
     });
     assert.ok(layout.width<=width+3,path+" horizontal overflow "+layout.width+"/"+width);
     assert.equal(layout.mainCount,1,path+" must have one main landmark");
     assert.equal(layout.theme,"#211a15",path+" wrong current brand theme");
     if(layout.logo)assert.equal(layout.logo,"/assets/fotopolis-goldmark.webp");
     if(path==="/"){
      const hero=page.locator("#start.fp17-welcome-hero");
      assert.equal(await hero.count(),1,"Approved welcome hero missing");
      assert.equal(await hero.locator("a,button,[role=button]").count(),0,
       "Welcome hero must not advertise a product or contain a CTA");
      assert.equal(await page.locator(".v4-product-card").count(),3,
       "All three products must remain selectable below Hero");
     }
     if(path==="/kontakt/"){
      assert.equal(await page.locator('form[name="fotopolis-studio9-anfrage"]').count(),1);
      assert.equal(await page.locator('input[name="datenschutz_ok"]').count(),1);
     }
     if(path==="/designvorlagen/"){
      await page.locator(".gl-card").first().waitFor({timeout:20000});
      assert.equal(await page.locator(".gl-card").count(),44);
     }
     if(width===390||width===1440){
      const key=(path==="/"? "home":path.replaceAll("/",""))+"-"+width;
      await page.screenshot({path:output+"/"+key+".png",animations:"disabled"});
     }
     assert.deepEqual(errors,[],path+" JavaScript errors");
     assert.deepEqual(writes,[],path+" QA must never submit forms or write data");
     results.push({path,width,status:"pass"});
    }catch(error){
     failures.push({path,width,error:String(error.stack||error)});
    }finally{await page.close()}
   }
  }finally{await context.close()}
 }
}finally{await browser.close()}
await writeFile(output+"/results.json",JSON.stringify({
 scope:"Static release candidate, public pages only; not an auth, form, mail or print proof",
 checked:results.length,expected:paths.length*widths.length,failures,results
},null,2));
if(failures.length){
 console.error("FOTOPOLIS RELEASE BROWSER QA FAILED",JSON.stringify(failures,null,2));
 process.exitCode=1;
}else{
 console.log("FOTOPOLIS RELEASE BROWSER QA PASSED: "+results.length+
 " public route/viewport combinations, welcome-only Hero, no writes.");
}
