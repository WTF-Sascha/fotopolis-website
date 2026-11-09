#!/usr/bin/env node
/* Studio 9.5 public release gate, no network or visitor data. */
import assert from "node:assert/strict";
import {existsSync,readFileSync,readdirSync,statSync} from "node:fs";
import {join} from "node:path";

const base="preview-build";
const read=p=>readFileSync(join(base,p),"utf8");
const has=p=>existsSync(join(base,p));
const check=(ok,label)=>assert.ok(ok,label);
const routes=["index.html","fotobox/index.html","fotospiegel/index.html",
 "fotowohnwagen/index.html","pakete/index.html","galerie/index.html",
 "anlaesse/index.html","ueber-uns/index.html","faq/index.html",
 "kontakt/index.html","impressum/index.html","datenschutz/index.html",
 "designvorlagen/index.html","danke/index.html"];
let resolved=0;
for(const path of routes){
 const html=read(path);
 check(html.includes('<link rel="stylesheet" href="/brand-finish.css">'),path+": finish CSS absent");
 check(html.includes("/assets/fotopolis-goldmark.webp"),path+": wrong logo");
 check(html.includes("brand-gold.css"),path+": brand system missing");
 check(!/brand-photo\.css|fp-photo-mark/.test(html),path+": legacy overlays leaked");
 check((html.match(/<\/head>/g)||[]).length===1,path+": bad document head");
 check((html.match(/<\/main>/g)||[]).length===1,path+": invalid main");
 for(const m of html.matchAll(/\b(?:src|href)="(\/[^"#?]+)(?:\?[^"]*)?"/g)){
   const url=m[1];
   if(url==="/"||url.startsWith("//"))continue;
   if(url.endsWith("/")){
     check(has(url.slice(1)+"index.html"),"Missing local page "+url);
     continue;
   }
   if(/\.(?:css|js|svg|webp|png|jpg|jpeg|gif|ico|json|webmanifest)$/.test(url)){
     check(has(url.slice(1)),"Broken asset reference "+url);
     resolved++;
   }
 }
}
const catalogue=JSON.parse(read("assets/design-gallery-data.json"));
check(catalogue.length===44,"Expected 44 printer layouts");
check(new Set(catalogue.map(x=>x.id)).size===44,"Duplicate template ID");
const imgs=readdirSync(join(base,"assets/designvorlagen")).filter(x=>/^fp-\d{3}\.webp$/.test(x));
check(imgs.length===44,"Missing or extra design images");
for(const item of catalogue){
 check(item.image==="/assets/designvorlagen/"+item.id.toLowerCase()+".webp",item.id+": invalid artwork path");
 check(has(item.image.slice(1)),item.id+": missing design");
 check(statSync(join(base,item.image.slice(1))).size>1000,item.id+": empty artwork");
 check(item.pixelWidth===1772&&item.pixelHeight===1181&&item.dpi===300,item.id+": bad 15x10 cm print size or DPI");
 check(item.printOverlay==="/assets/designvorlagen/print/"+item.id.toLowerCase()+".png",item.id+": missing print overlay URL");
 check(has(item.printOverlay.slice(1))&&statSync(join(base,item.printOverlay.slice(1))).size>1000,item.id+": missing alpha PNG print overlay");
}
const printReport=JSON.parse(read("qa/photoprint-44-audit.json"));
check(printReport.candidateCount===44 && printReport.originalSourceDesignsPreserved===32 &&
      printReport.newDesigns===12 &&
      printReport.pixelSize[0]===1772 && printReport.pixelSize[1]===1181 &&
      printReport.dpi===300,"Print collection 15x10 cm format must be verified");
check(has("qa/photoprint-44-contact-sheet.webp"),"Missing photo-print review contact sheet");
check(has("qa/FOTOPOLIS_PhotoPrint_44_15x10_300dpi.zip")&&
      statSync(join(base,"qa/FOTOPOLIS_PhotoPrint_44_15x10_300dpi.zip")).size>100000,
      "Missing 44-design customer-facing print overlay package");
// Studio 11 Classics: originals must remain recognisable and independently
// source-traceable rather than being silently replaced by generic new layouts.
const classicItems=catalogue.slice(0,32);
const signatureItems=catalogue.slice(32);
check(classicItems.length===32&&classicItems.every(x=>
  x.collection==="classics"&&x.originalMotifPreserved===true&&
  x.legacyLogoReplaced===true&&x.logoMaster==="site/assets/fotopolis-goldmark.webp"),
  "FP-001–FP-032 must preserve every authentic design motif with a single master Goldmark");
check(signatureItems.length===12&&signatureItems.every(x=>x.collection==="signature"),
  "FP-033–FP-044 must remain separate Signature candidates");
const originalCatalog=JSON.parse(readFileSync("concepts/premium-v2/design-gallery-data.json","utf8"));
check(classicItems.every((x,i)=>x.id===originalCatalog[i].id&&
  x.name===originalCatalog[i].name&&
  x.photos===(x.id==="FP-017"?4:originalCatalog[i].photos)&&
  x.category===originalCatalog[i].category),
  "Original IDs, photo counts, occasion and recognisable design names changed");
check(has("qa/classics-32-source-vs-restored.webp")&&
  has("qa/classics-32-source-fidelity.json"),"Missing 32-authentic-motif before/after QA");
const classicFidelity=JSON.parse(read("qa/classics-32-source-fidelity.json"));
check(classicFidelity.length===32,"Missing individual original-motif trace for some designs");
const contact=read("kontakt/index.html");
check(contact.includes('name="fotopolis-studio9-anfrage"'),"Netlify contact form missing");
for(let n=1;n<=44;n++){
 const id="FP-"+String(n).padStart(3,"0");
 check(contact.includes('value="'+id+'"'),id+": not available in contact form");
}
for(const p of ["fotobox","fotospiegel","fotowohnwagen"]){
 const html=read(p+"/index.html");
 check(html.includes("data-product-request"),"Product form missing: "+p);
 check(html.includes("/designvorlagen/?produkt="),"Design picker crosslink missing: "+p);
}
for(const filename of ["fotopolis-touch-mirror.webp","fotopolis-touch-box.webp"]){
 const p="assets/branding/"+filename;
 check(has(p)&&statSync(join(base,p)).size>10000,"Missing screen asset "+p);
}
// Product-image QA is independent of web layout: the real original booth
// image must be reconstructed with the approved master logo at the display's
// geometric centre, and a reviewable before/after crop must exist.
check(has("qa/fotobox-logo-centering-before-after.webp") &&
      statSync(join(base,"qa/fotobox-logo-centering-before-after.webp")).size>10000,
      "Missing real source/derived Fotobox screen comparison");
check(has("qa/fotobox-device-branding-before-after.webp") &&
      statSync(join(base,"qa/fotobox-device-branding-before-after.webp")).size>10000,
      "Missing full-device before/after visual evidence");
const boxBrand=JSON.parse(read("qa/fotobox-logo-centering.json"));
check(boxBrand.outputOnly===true &&
      boxBrand.logoGeometricCentreX===boxBrand.screenGeometricCentreX &&
      boxBrand.buttonGeometricCentreX===boxBrand.screenGeometricCentreX &&
      boxBrand.brandAsset==="site/assets/fotopolis-goldmark.webp" &&
      boxBrand.logoBounds[2]-boxBrand.logoBounds[0]>=680 &&
      boxBrand.screenLogoIncreasePercent>=40 &&
      boxBrand.frontBadgeUsesOriginalGoldmark===true &&
      boxBrand.screenReferenceRect[2]===459 &&
      boxBrand.screenReferenceRect[3]===231 &&
      boxBrand.frontBadgeReferenceRect[0]===368 &&
      boxBrand.frontBadgeReferenceRect[1]===366 &&
      boxBrand.frontBadgeReferenceRect[3]===412 &&
      boxBrand.photoFiles.length===2,
      "Approved FOTOPOLIS brand logo must be physically centered in both generated Fotobox image sizes");
for(const filename of ["logo-detail-inspection.webp","all-32-templates.webp","studio95-audit.json"]){
 check(has("qa/"+filename),"Visual audit missing: "+filename);
}
for(const file of ["fotospiegel-hero-lossless.webp","fotobox-event-1672.webp","fotowohnwagen-gartenparty-1448.webp"]){
 check(has("assets/images/"+file),"Original product photo missing: "+file);
}
check(has("admin/login/index.html")&&has("admin/dashboard/index.html"),"Admin route unexpectedly absent");
console.log("PASS Studio 9.5: "+routes.length+" public pages, "+resolved+" resolved local assets, all 32 source designs, 3 enquiry flows, black-gold screens, image-zoom audit and admin route integrity.");


// Studio 10 structural QA. A successful automated gate does NOT replace
// Playwright/real-device testing or visual approval of the printed artwork.
const studio10CSS = read("studio10-premium.css");
check(studio10CSS.includes("--fp10-onyx") &&
      studio10CSS.includes("--fp10-gold") &&
      !/#071b30|#123b5c|#102d45/i.test(studio10CSS),
      "Studio 10 theme tokens must use new Black & Champagne palette");
for (const path of routes) {
  const html = read(path);
  check(html.includes('<link rel="stylesheet" href="/studio10-premium.css">'),
        path + ": Studio 10 theme missing");
  const studio11 = has("studio11-quiet-luxury.css");
  const expectedColor = studio11 ? "#181512" : "#15120f";
  check(html.includes('name="theme-color" content="' + expectedColor + '"'),
        path + ": current PWA theme colour missing");
  if (studio11) {
    check(html.includes('<link rel="stylesheet" href="/studio11-quiet-luxury.css">'),
          path + ": Quiet Luxury stylesheet absent");
    check(html.indexOf("/studio11-quiet-luxury.css") > html.indexOf("/studio10-premium.css"),
          path + ": Studio 11 must load after Studio 10");
  }
  check(html.indexOf("/studio10-premium.css") > html.indexOf("/brand-finish.css"),
        path + ": Studio 10 stylesheet order invalid");
}
const studio10Report = JSON.parse(read("qa/studio10-report.json"));
check(studio10Report.automated.templates === 32 &&
      studio10Report.templates.length === 32,
      "Studio 10 32-template audit missing");
check(studio10Report.visualReview === "pending" &&
      studio10Report.responsiveBrowserReview === "pending" &&
      studio10Report.formRegressionReview === "pending",
      "Automated test must not imply unperformed visual or browser tests passed");
check(has("qa/studio10-before-after.webp") &&
      has("qa/studio10-zoom-300pct.webp") &&
      has("qa/studio10-review.html"),
      "Studio 10 before/after review artifacts missing");
for (let i=1; i<=32; i++) {
  const id = "FP-" + String(i).padStart(3,"0");
  check(studio10Report.templates[i-1].id === id,
        id + ": audit report order incorrect");
  check(has("qa/zoom/fp-" + String(i).padStart(3,"0") + ".webp"),
        id + ": 300 percent source/candidate close-up missing");
}
const studio10SW = read("service-worker.js");
const studio11Enabled = has("studio11-quiet-luxury.css");
check(studio10SW.includes(studio11Enabled
        ? "fotopolis-studio-2026-11-09-v12-design-to-print-private-r1"
        : "fotopolis-studio-2026-11-08-v10-premium-candidate") &&
      studio10SW.includes("'/studio10-premium.css'") &&
      (!studio11Enabled || studio10SW.includes("'/studio11-quiet-luxury.css'")),
      "Installed PWA missing current candidate style cache");
if (studio11Enabled) {
  const css = read("studio11-quiet-luxury.css");
  check(css.includes("--fp11-obsidian") && css.includes("--fp11-champagne") &&
        css.includes("--fp11-display") && css.includes("prefers-reduced-motion"),
        "Studio 11 design system tokens and reduced-motion support missing");
  check(!/#071b30|#102d45|#123b5c/i.test(css),
        "Studio 11 public theme reintroduces legacy Navy hex values");
  check(read("index.html").includes('class="fp11-hero-link"'),
        "Single flagship discovery CTA missing");
  const pwaManifest = JSON.parse(read("manifest.webmanifest"));
  check(pwaManifest.theme_color.toLowerCase() === "#181512" &&
        pwaManifest.background_color.toLowerCase() === "#f7f3ec",
        "Installed PWA manifest must match Studio 11 Obsidian and Ivory palette");
  const audit = JSON.parse(read("qa/studio11-build-audit.json"));
  check(audit.publicRoutes === 14 && audit.unchangedOriginalDesigns === 32 &&
        audit.release.startsWith("NOT APPROVED"),
        "Studio 11 must protect all routes, artworks and release gate");
  console.log("PASS Studio 11 static QA: 14 public pages, immutable source originals, "
              + "dedicated Quiet Luxury tokens and PWA cache. Human review STILL REQUIRED.");
}
console.log("PASS Studio 10 structural QA: 14 public routes, CI token checks, 32 source-linked artwork comparisons and PWA updates. PENDING: human visual approval, responsive browser tests, live form regression.");
