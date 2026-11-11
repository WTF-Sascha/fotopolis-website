#!/usr/bin/env node
/* Studio 13.1 brand visual QA – all paths exercise the actual static build
   with no auth impersonation or production traffic. */
import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir,writeFile} from "node:fs/promises";
const base=process.env.FOTOPOLIS_QA_URL||"http://127.0.0.1:8765";
const out="studio13-brand-screenshots";
await mkdir(out,{recursive:true});
const cases=[],errors=[];
const browser=await chromium.launch({headless:true});
try{
  const manifestRes=await browser.newPage();
  const res=await manifestRes.request.get(base+"/manifest.webmanifest");
  assert.equal(res.status(),200);
  const manifest=await res.json();
  assert.equal(manifest.theme_color,"#211a15");
  assert.ok(manifest.icons.every(x=>x.src.includes("brand-")));
  for(const icon of manifest.icons){
    const test=await manifestRes.request.get(base+icon.src);
    assert.equal(test.status(),200,icon.src);
    assert.equal(test.headers()["content-type"]?.split(";")[0],"image/png",icon.src);
  }
  await manifestRes.close();
  for(const path of ["/","/fotobox/","/fotospiegel/","/fotowohnwagen/",
      "/designvorlagen/","/kontakt/","/pakete/","/faq/","/anlaesse/","/ueber-uns/"]){
    for(const width of [390,1440]){
      const page=await browser.newPage({viewport:{width,height:850},serviceWorkers:"block"});
      try{
        const resp=await page.goto(base+path,{waitUntil:"domcontentloaded",timeout:35000});
        assert.equal(resp.status(),200,path);
        const asset=page.locator('link[href="/studio13-unified-brand.css"]');
        assert.equal(await asset.count(),1,path+" theme link missing");
        const theme=await page.locator('meta[name="theme-color"]').getAttribute("content");
        assert.equal(theme,"#211a15");
        assert.equal(await page.locator('link[rel="apple-touch-icon"][href*="brand-180"]').count(),1);
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth);
        assert.ok(overflow<=width+3,path+" horizontal overflow "+width+"=>"+overflow);
        const teamEntry=page.locator('footer .fp14-admin-entry a');
        assert.equal(await teamEntry.count(),1,path+" lacks visible team management link");
        assert.equal(await teamEntry.getAttribute("href"),"/admin/");
        const teamEntryHeight=await teamEntry.evaluate(el=>el.getBoundingClientRect().height);
        assert.ok(teamEntryHeight>=42,path+" management link is too small to tap");
        const logo=await page.locator('header .studio-identity img').first().getAttribute("src").catch(()=>null);
        if(logo)assert.equal(logo,"/assets/fotopolis-goldmark.webp");
        if((path==="/"||path==="/kontakt/")&&(width===390||width===1440)){
          await page.screenshot({path:out+"/public-"+(path==="/"?"home":"contact")+"-"+width+".png",
            animations:"disabled",fullPage:true});
        }
        cases.push({route:path,width,overflow:false,theme,logo:logo||"header variant"});
      }catch(e){errors.push({route:path,width,error:String(e.stack||e)})}
      finally{await page.close();}
    }
  }
  // Studio 14: the actual administration landing is a navigable portal,
  // not a silent redirect. All destination pages retain their auth gates.
  for(const width of [390,768,1440]){
    const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:"block"});
    try{
      const response=await page.goto(base+"/admin/",{waitUntil:"domcontentloaded",timeout:35000});
      assert.equal(response.status(),200);
      assert.equal(new URL(page.url()).pathname,"/admin/","Admin landing must not redirect");
      assert.equal(await page.locator(".fp14-tiles article").count(),3);
      assert.equal(await page.locator('.fp14-cta[href="/admin/login/"]').count(),1);
      assert.equal(await page.locator('a[href="/admin/dashboard/"]').count(),1);
      assert.equal(await page.locator('a[href="/admin/designstudio/"]').count(),1);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth)<=width+3,
        "Admin landing horizontal overflow at "+width);
      await page.screenshot({path:out+"/admin-portal-"+width+".png",animations:"disabled",fullPage:true});
      cases.push({route:"/admin/",width,authenticated:false,
        note:"Landing only; protected endpoints not accessed"});
    }catch(e){errors.push({route:"/admin/",width,error:String(e.stack||e)})}
    finally{await page.close();}
  }
  for(const width of [390,768,1440]){
    const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:"block"});
    try{
      const res=await page.goto(base+"/admin/login/",{waitUntil:"domcontentloaded",timeout:35000});
      assert.equal(res.status(),200);
      assert.equal(await page.locator("link[href='/studio13-unified-brand.css']").count(),1);
      const panel=await page.locator(".brand-panel").evaluate(el=>getComputedStyle(el).backgroundColor);
      assert.equal(panel,"rgb(39, 31, 25)","Legacy blue login artwork has survived");
      assert.equal(await page.locator('.brand img').getAttribute("src"),"/assets/fotopolis-goldmark.webp");
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth)<=width+3,"Login horizontal overflow");
      await page.screenshot({path:out+"/admin-login-"+width+".png",animations:"disabled",fullPage:true});
      cases.push({route:"/admin/login/",width,panel});
    }catch(e){errors.push({route:"/admin/login/",width,error:String(e.stack||e)})}
    finally{await page.close();}
  }
  for(const width of [390,768,1440]){
    const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:"block"});
    try{
      await page.route("**/admin/dashboard/dashboard-bundle.js",route=>route.abort());
      const res=await page.goto(base+"/admin/dashboard/",{waitUntil:"domcontentloaded",timeout:35000});
      assert.equal(res.status(),200);
      await page.evaluate(()=>{
        document.getElementById("gate").hidden=true;
        document.getElementById("dashboard-app").hidden=false;
        if(innerWidth<=780)document.getElementById("dashboard-mobile-menu").hidden=false;
      });
      const color=await page.locator(".sidebar").evaluate(e=>getComputedStyle(e).backgroundColor);
      assert.equal(color,"rgb(33, 26, 21)","Legacy blue sidebar still visible");
      const topbar=await page.locator(".topbar").evaluate(e=>getComputedStyle(e).backgroundColor);
      assert.equal(topbar,"rgb(255, 250, 243)","Topbar visual language not unified");
      assert.equal(await page.locator('.brand img').getAttribute("src"),"/assets/fotopolis-goldmark.webp");
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth)<=width+3,"Dashboard horizontal overflow");
      await page.screenshot({path:out+"/admin-dashboard-layout-"+width+".png",animations:"disabled",fullPage:true});
      cases.push({route:"/admin/dashboard/",width,sidebar:color,topbar,
        note:"Layout mock only; positive real login not tested"});
    }catch(e){errors.push({route:"/admin/dashboard/",width,error:String(e.stack||e)})}
    finally{await page.close();}
  }
  const ed=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:"block"});
  try{
    await ed.route("**/admin/designstudio/boot-bundle.js",route=>route.abort());
    const resp=await ed.goto(base+"/admin/designstudio/",{waitUntil:"domcontentloaded"});
    assert.equal(resp.status(),200);
    assert.equal(await ed.locator("link[href='/studio13-unified-brand.css']").count(),1);
    const background=await ed.locator("body").evaluate(e=>getComputedStyle(e).backgroundColor);
    assert.equal(background,"rgb(33, 26, 21)");
    await ed.screenshot({path:out+"/private-editor-shell.png",animations:"disabled",fullPage:true});
    cases.push({route:"/admin/designstudio/",width:390,background,authNotBypassed:true});
  }catch(e){errors.push({route:"/admin/designstudio/",error:String(e.stack||e)})}
  finally{await ed.close();}
}finally{await browser.close()}
await writeFile(out+"/brand-qa.json",JSON.stringify({cases,errors,scope:"Generated source-based preview only, auth gate never bypassed on network"},null,2));
if(errors.length){console.error("STUDIO 13.1 BRAND VISUAL FAIL",JSON.stringify(errors,null,2));process.exitCode=1}
else console.log("STUDIO 13.1 BRAND VISUAL PASS",JSON.stringify({views:cases.length,publicRoutes:10,adminRoutes:3,approvedGoldmark:true,legacyBlueNavigation:false}));
