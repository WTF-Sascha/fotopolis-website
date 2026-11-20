#!/usr/bin/env node
/** FOTOPOLIS Studio 18.1 – real Chromium visual/brand smoke QA.
 * Reads only a LOCAL staging build. Never logs into admin or submits customer data.
 * Screenshots provide review artifacts, not a claim of full WCAG/E2E approval.
 */
import fs from "node:fs";
import path from "node:path";
import {chromium} from "playwright";

const BASE=process.env.SITE_BASE_URL||"http://127.0.0.1:8765";
const SHOTS=path.resolve("studio18-brand-screenshots");
fs.mkdirSync(SHOTS,{recursive:true});
const widths=[320,360,390,768,1024,1280,1440];
const routes=[
  {name:"home",path:"/"},
  {name:"fotobox",path:"/fotobox/"},
  {name:"fotospiegel",path:"/fotospiegel/"},
  {name:"fotowohnwagen",path:"/fotowohnwagen/"},
  {name:"designvorlagen",path:"/designvorlagen/"},
  {name:"kontakt",path:"/kontakt/"},
  {name:"login",path:"/admin/login/"}
];
const data={suite:"studio18-ci21-browser",timestamp:new Date().toISOString(),status:"REVIEW_REQUIRED",screens:[],issues:[],scope:"local build only; no authenticated E2E/real print hardware"};
const browser=await chromium.launch({headless:true});
try{
  for(const route of routes){
    for(const width of widths){
      const ctx=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,locale:"de-DE",reducedMotion:"reduce"});
      const page=await ctx.newPage();
      const id=route.name+"-"+width;
      try{
        const response=await page.goto(BASE+route.path,{waitUntil:"domcontentloaded",timeout:30000});
        if(!response||response.status()>=400)throw Error("HTTP "+(response?.status()??"NO_RESPONSE"));
        await page.waitForTimeout(200);
        const detail=await page.evaluate(()=>{
          const imgs=[...document.querySelectorAll("img")];
          const brand=imgs.filter(img=>img.getAttribute("src")?.includes("/assets/brand/v2-1/fotopolis-logo-ci21-round.webp"));
          const css=[...document.querySelectorAll('link[rel="stylesheet"]')].map(el=>el.getAttribute("href"));
          const visibleLogo=brand.filter(img=>{const r=img.getBoundingClientRect(),s=getComputedStyle(img);return r.width>0&&r.height>0&&s.visibility!=="hidden"&&s.display!=="none"}).length;
          return {
            title:document.title,
            hasBrandStyles:css.includes("/studio18-ci21-compat.css")&&css.includes("/assets/brand/v2-1/fotopolis-ci-2.1.css"),
            brandCount:brand.length,visibleLogo,
            logoComplete:brand.filter(img=>img.complete&&img.naturalWidth>0).length,
            oldBrandMarkup:document.documentElement.outerHTML.includes('src="/assets/fotopolis-goldmark.webp"'),
            headerCenterDeltaPx:(()=>{
              const h=document.querySelector(".studio-header .studio-identity");
              const outer=document.querySelector(".studio-header .studio-header-shell");
              if(!h||!outer)return null;
              const a=h.getBoundingClientRect(),b=outer.getBoundingClientRect();
              return Math.abs((a.left+a.width/2)-(b.left+b.width/2));
            })(),
            heroBrand:(()=>{
              const el=document.querySelector(".fp18-hero-brand");
              if(!el)return null;
              const box=el.getBoundingClientRect(),cs=getComputedStyle(el);
              return {src:el.getAttribute("src"),width:box.width,
                visible:box.width>100&&box.height>100&&cs.visibility!=="hidden"&&cs.display!=="none",
                loaded:el.complete&&el.naturalWidth>0,linked:!!el.closest("a")};
            })(),
            overflowPx:Math.max(0,document.documentElement.scrollWidth-window.innerWidth),
            background:getComputedStyle(document.body).backgroundColor
          };
        });
        const image=id+".png";
        await page.screenshot({path:path.join(SHOTS,image),fullPage:true,animations:"disabled",timeout:30000});
        data.screens.push({id,path:route.path,width,filename:image,...detail});
        if(!detail.hasBrandStyles)data.issues.push(id+": CI 2.1 stylesheet missing");
        if(detail.oldBrandMarkup)data.issues.push(id+": old goldmark markup active");
        if(detail.headerCenterDeltaPx!==null && detail.headerCenterDeltaPx>4)
          data.issues.push(id+": header brand not centered, delta="+detail.headerCenterDeltaPx);
        if(route.name==="home"&&(!detail.heroBrand||!detail.heroBrand.visible||!detail.heroBrand.loaded||detail.heroBrand.linked))
          data.issues.push(id+": visible unlinked round hero brand missing");
        if(detail.brandCount===0||detail.visibleLogo===0||detail.logoComplete===0)data.issues.push(id+": approved logo not visibly loaded");
        if(detail.overflowPx>2)data.issues.push(id+": horizontal overflow "+detail.overflowPx+"px");
      }catch(error){
        data.issues.push(id+": "+(error?.message||String(error)));
      }finally{await ctx.close()}
    }
  }
}finally{await browser.close()}
data.status=data.issues.length?"FAIL / NO-GO":"SMOKE PASS / FULL REVIEW PENDING";
fs.writeFileSync(path.join(SHOTS,"results.json"),JSON.stringify(data,null,2)+"\n","utf8");
console.log("STUDIO 18 Chromium:",data.status,"screenshots:",data.screens.length,"issues:",data.issues.length);
for(const issue of data.issues.slice(0,50))console.error("QA ISSUE",issue);
if(data.issues.length)process.exitCode=1;
