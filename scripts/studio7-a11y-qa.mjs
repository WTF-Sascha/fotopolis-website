import {chromium} from "playwright";
import fs from "node:fs/promises";

const base=process.env.SITE_BASE_URL||"http://127.0.0.1:8766/";
const routes=["","fotobox","fotospiegel","fotowohnwagen","pakete","galerie","anlaesse","ueber-uns","faq","kontakt","impressum","datenschutz"];
const widths=[320,375,430,768,1024,1440];
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const results=[];
const check=(route,width,label,passed,detail="")=>{
  const value=!!passed;
  results.push({route:route||"start",width,label,passed:value,detail:value?"":detail});
  if(!value)console.error("ACCESSIBILITY_ISSUE",JSON.stringify({route,width,label,detail}).slice(0,900));
};
for(const width of widths){
  const page=await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1,reducedMotion:"reduce"});
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  for(const route of routes){
    const response=await page.goto(new URL(route?route+"/":"",base).toString(),{waitUntil:"networkidle",timeout:40000});
    const info=await page.evaluate(()=>{
      const visible=el=>{
        const s=getComputedStyle(el),r=el.getBoundingClientRect();
        return s.visibility!=="hidden"&&s.display!=="none"&&r.width>1&&r.height>1;
      };
      const idCounts=new Map();
      document.querySelectorAll("[id]").forEach(el=>idCounts.set(el.id,(idCounts.get(el.id)||0)+1));
      const duplicateIds=[...idCounts].filter(([id,n])=>id&&n>1);
      const inputs=[...document.querySelectorAll("input,select,textarea")]
        .filter(el=>el.type!=="hidden"&&visible(el));
      const missingLabels=inputs.filter(el=>!el.labels?.length&&!el.hasAttribute("aria-label")&&!el.hasAttribute("aria-labelledby"))
        .map(el=>el.name||el.id||el.tagName);
      const unlabelledButtons=[...document.querySelectorAll("button")]
        .filter(visible).filter(el=>!el.textContent?.trim()&&!el.getAttribute("aria-label")&&!el.getAttribute("title")&&!el.getAttribute("aria-labelledby"))
        .map(el=>el.outerHTML.slice(0,130));
      const unlabelledLinks=[...document.querySelectorAll("a[href]")]
        .filter(visible).filter(el=>!el.textContent?.trim()&&!el.getAttribute("aria-label")&&!el.querySelector("img[alt]:not([alt=''])"))
        .map(el=>el.getAttribute("href"));
      const unlabelledImages=[...document.images].filter(el=>!el.hasAttribute("alt")).map(el=>el.getAttribute("src"));
      const invalidAnchors=[...document.querySelectorAll('a[href^="#"]')]
        .filter(el=>{
          const href=el.getAttribute("href");
          return href&&href.length>1&&!document.getElementById(decodeURIComponent(href.slice(1)));
        }).map(el=>el.getAttribute("href"));
      const nav=document.querySelector(".v4-mobile-nav");
      const fields=[...document.querySelectorAll('input[required],select[required],textarea[required]')];
      return {
        htmlLang:document.documentElement.getAttribute("lang"),
        title:document.title,
        mainCount:document.querySelectorAll("main").length,
        h1s:document.querySelectorAll("main h1").length,
        docWidth:document.documentElement.scrollWidth,
        viewport:innerWidth,
        duplicateIds,missingLabels,unlabelledButtons,unlabelledLinks,unlabelledImages,invalidAnchors,
        requiredWithoutLabel:fields.filter(el=>!el.labels?.length).map(el=>el.name),
        bottomNavHeight:nav?.getBoundingClientRect().height||0,
        brokenImages:[...document.images].filter(el=>el.complete&&!el.naturalWidth).map(el=>el.src)
      };
    });
    check(route,width,"HTTP 200",response.status()===200,response.status());
    check(route,width,"document language and descriptive title",info.htmlLang==="de"&&info.title.length>=12,{lang:info.htmlLang,title:info.title});
    check(route,width,"single main and H1",info.mainCount===1&&info.h1s===1,{main:info.mainCount,h1:info.h1s});
    check(route,width,"no horizontal overflow",info.docWidth<=width+2,info.docWidth);
    check(route,width,"unique HTML IDs",info.duplicateIds.length===0,info.duplicateIds);
    check(route,width,"visible form controls labelled",info.missingLabels.length===0,info.missingLabels);
    check(route,width,"buttons with accessible names",info.unlabelledButtons.length===0,info.unlabelledButtons);
    check(route,width,"links with accessible names",info.unlabelledLinks.length===0,info.unlabelledLinks);
    check(route,width,"images have alt attribute",info.unlabelledImages.length===0,info.unlabelledImages);
    check(route,width,"in-page anchors resolve",info.invalidAnchors.length===0,info.invalidAnchors);
    check(route,width,"required controls have labels",info.requiredWithoutLabel.length===0,info.requiredWithoutLabel);
    check(route,width,"no failed image downloads",info.brokenImages.length===0,info.brokenImages);
    check(route,width,"no uncaught JS errors",errors.length===0,errors);
    errors.length=0;
  }
  await page.close();
}
await browser.close();
const problems=results.filter(x=>!x.passed);
const report={version:"7.1",routes:routes.length,widths,checks:results.length,passed:results.length-problems.length,failed:problems.length,issues:problems};
await fs.mkdir("concepts/premium-v2/qa-screenshots/studio7-a11y",{recursive:true});
await fs.writeFile("concepts/premium-v2/qa-screenshots/studio7-a11y/report.json",JSON.stringify(report,null,2));
console.log("STUDIO7_ACCESSIBILITY_SUMMARY",JSON.stringify({routes:report.routes,widths:report.widths.length,checks:report.checks,failed:report.failed}));
if(problems.length)process.exitCode=1;
