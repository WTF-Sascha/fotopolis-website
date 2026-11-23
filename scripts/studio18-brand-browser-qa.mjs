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
const widths=[320,360,375,390,430,768,1024,1280,1440,1920];
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
        // Capture a true visual baseline: Chromium full-page screenshots do not
        // reliably trigger offscreen lazy image downloads by themselves.
        if(route.name==="home"){
          await page.locator(".fpv2-preview-grid img").evaluateAll(async images=>{
            images.forEach(img=>{img.loading="eager"});
            await Promise.all(images.map(img=>img.decode().catch(()=>null)));
          });
        }
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
            headerLayout:(()=>{
              const header=document.querySelector(".studio-header");
              if(!header)return null;
              const outer=header.querySelector(".studio-header-shell");
              const nav=header.querySelector(".studio-mainnav");
              const toggle=header.querySelector(".studio-menu-toggle");
              if(!outer)return {error:"header shell missing"};
              const bounds=outer.getBoundingClientRect();
              const midpoint=bounds.left+bounds.width/2;
              const isDesktop=window.innerWidth>1100;
              const control=isDesktop?nav:toggle;
              const cs=control?getComputedStyle(control):null;
              const rect=control?.getBoundingClientRect();
              return {
                visibleNavigation:!!rect && rect.width>0 && rect.height>0
                  && cs?.display!=="none" && cs?.visibility!=="hidden",
                menuCenterDeltaPx:rect?Math.abs((rect.left+rect.width/2)-midpoint):null,
                headerBrandElements:header.querySelectorAll(".studio-identity,.brand-logo").length,
                headerBrandSources:[...header.querySelectorAll("img")].map(x=>x.getAttribute("src")),
                mobileMenuAccessible:!!toggle?.getAttribute("aria-controls"),
                hasStartLink:!!nav?.querySelector('a[href="/"]')
              };
            })(),
            heroBrand:(()=>{
              const el=document.querySelector(".fp18-hero-brand");
              if(!el)return null;
              const box=el.getBoundingClientRect(),cs=getComputedStyle(el);
              return {src:el.getAttribute("src"),width:box.width,
                visible:box.width>100&&box.height>100&&cs.visibility!=="hidden"&&cs.display!=="none",
                loaded:el.complete&&el.naturalWidth>0,linked:!!el.closest("a")};
            })(),
            galleryTeasers:(()=>{
              const images=[...document.querySelectorAll(".fpv2-preview-grid img")];
              return images.length?{count:images.length,
                loaded:images.filter(img=>img.complete&&img.naturalWidth>0).length}:null;
            })(),

            loginTextContrast:(()=>{
              const modes=document.querySelector(".mode-tabs");
              if(!modes)return null;
              const rgb=value=>{
                const m=value.match(/^rgba?\(([^)]+)\)$/);
                if(!m)return null;
                const v=m[1].split(",").map(Number);
                return v.length>=3?v:null;
              };
              const luminance=channels=>channels.slice(0,3).map(value=>{
                const v=value/255;
                return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;
              }).reduce((sum,value,index)=>sum+value*[0.2126,0.7152,0.0722][index],0);
              const background=element=>{
                for(let current=element;current;current=current.parentElement){
                  const v=rgb(getComputedStyle(current).backgroundColor);
                  if(v && (v.length<4 || v[3]>=0.999))return v;
                }
                return [255,255,255];
              };
              return [
                ["eyebrow",".form-shell > .eyebrow"],
                ["inactive-mode",".mode-tabs button[data-mode='otp']"],
                ["helper-action","#forgot"],
                ["footnote",".footnote"]
              ].map(([name,selector])=>{
                const element=document.querySelector(selector);
                if(!element)return {name,error:"missing target"};
                const foreground=rgb(getComputedStyle(element).color);
                const bg=background(element);
                if(!foreground)return {name,error:"unreadable color"};
                const a=luminance(foreground),b=luminance(bg);
                return {name,ratio:Math.round((Math.max(a,b)+0.05)/(Math.min(a,b)+0.05)*100)/100};
              });
            })(),
            loginModes:(()=>{
              const group=document.querySelector('.mode-tabs[role="group"]');
              if(!group)return null;
              const buttons=[...group.querySelectorAll('button[data-mode]')].map(button=>{
                const r=button.getBoundingClientRect(),style=getComputedStyle(button);
                return {name:button.dataset.mode,fontPx:parseFloat(style.fontSize),
                  width:r.width,height:r.height,left:r.left,right:r.right,
                  top:r.top,bottom:r.bottom,visible:style.display!=="none"};
              });
              const overlapping=buttons.some((a,i)=>buttons.slice(i+1).some(b=>
                Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 &&
                Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1));
              return {buttons,overlapping,groupOverflowPx:Math.max(0,group.scrollWidth-group.clientWidth)};
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
        if(detail.headerLayout){
          const h=detail.headerLayout;
          if(h.error||h.headerBrandElements>0||h.headerBrandSources.length>0)
            data.issues.push(id+": old header logo remains or header missing "+JSON.stringify(h));
          if(!h.visibleNavigation || h.menuCenterDeltaPx===null || h.menuCenterDeltaPx>5)
            data.issues.push(id+": navigation/menu not centered, delta="+h.menuCenterDeltaPx);
          if(!h.hasStartLink||!h.mobileMenuAccessible)
            data.issues.push(id+": navigation or accessible mobile menu missing");
        }
        if(route.name==="home"&&(!detail.heroBrand||!detail.heroBrand.visible||!detail.heroBrand.loaded||detail.heroBrand.linked))
          data.issues.push(id+": visible unlinked round hero brand missing");
        if(detail.brandCount===0||detail.visibleLogo===0||detail.logoComplete===0)data.issues.push(id+": approved logo not visibly loaded");
        if(route.name==="home"&&(!detail.galleryTeasers||
          detail.galleryTeasers.count!==3||detail.galleryTeasers.loaded!==3))
          data.issues.push(id+": design preview images are missing or have not loaded");
        if(route.name==="login"){
          const contrast=detail.loginTextContrast;
          if(!contrast||contrast.length!==4||contrast.some(item=>item.error||item.ratio<4.5))
            data.issues.push(id+": small-text contrast below WCAG AA 4.5:1 "+JSON.stringify(contrast));
          const tabs=detail.loginModes;
          if(!tabs||tabs.buttons.length!==3||tabs.overlapping||tabs.groupOverflowPx>2)
            data.issues.push(id+": login modes missing, overlapping or overflowing");
          if(tabs&&tabs.buttons.some(b=>!b.visible||b.height<43||b.left<0||b.right>width+1))
            data.issues.push(id+": login mode controls clipped or too small");
          if(width<=400&&tabs&&tabs.buttons.some(b=>b.fontPx<12))
            data.issues.push(id+": login mode typography below 12px on narrow screen");
        }
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
