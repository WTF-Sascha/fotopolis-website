#!/usr/bin/env node
/** Studio 18 CI-2.1 foundation contract (not visual, functional or print approval). */
import fs from "node:fs";
import {createHash} from "node:crypto";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const OUT=path.join(ROOT,"preview-build");
const read=(p)=>fs.readFileSync(path.join(OUT,p),"utf8");
const report=JSON.parse(read("qa/studio18-foundation.json"));
const token=JSON.parse(read("assets/brand/v2-1/fotopolis-ci-2.1.tokens.json"));
assert.equal(token.version,"2.1.0");
assert.equal(token.colors.logo_yellow,"#FEE158");
assert.equal(token.colors.ivory,"#F7F3EC");
assert.match(read("assets/brand/v2-1/fotopolis-ci-2.1.css"),/--fp-logo-yellow:\s*#FEE158/);
assert.match(read("studio18-ci21-compat.css"),/--fp-brand-accent:var\(--fp-logo-yellow\)/);
assert.equal(report.status,"PARTIAL / NO PRODUCTION APPROVAL");
assert.equal(report.approved_original_source_verified_against_ci21_pdf,true);
assert.equal(report.approved_original_source_master_sha256,"3aa473c6788beb52587a7c5c423cd83f05a44e356b51bcabbb5b6f7af6957a24");
assert.equal(report.approved_logo_switched,true);
assert.equal(report.old_icons_remaining,false);
assert.equal(report.logo_web_derivative_sha256,"bd75b191893afdf60ce51ccf5a7ad0298ecca9660603dbd2ce1f1b2755501fba");
assert.ok(fs.existsSync(path.join(OUT,"assets/brand/v2-1/fotopolis-logo-ci21-256.webp")));

const raster=fs.readFileSync(path.join(OUT,"assets/brand/v2-1/fotopolis-logo-ci21-256.webp"));
assert.equal(createHash("sha256").update(raster).digest("hex"),"bd75b191893afdf60ce51ccf5a7ad0298ecca9660603dbd2ce1f1b2755501fba");
assert.equal(raster.toString("ascii",0,4),"RIFF");
assert.equal(raster.toString("ascii",8,12),"WEBP");
for(const px of [16,32,48,64,180,192,512]){
  const png=fs.readFileSync(path.join(OUT,"icons","brand-"+px+".png"));
  assert.equal(png.toString("hex",0,8),"89504e470d0a1a0a");
  assert.equal(png.readUInt32BE(16),px);
  assert.equal(png.readUInt32BE(20),px);
}
for(const name of ["brand-maskable-512.png","icon-maskable-512.png"]){
  const png=fs.readFileSync(path.join(OUT,"icons",name));
  assert.equal(png.readUInt32BE(16),512);
  assert.equal(png.readUInt32BE(20),512);
}
const relLum=(hex)=>{
  const n=hex.replace("#","");
  const values=[0,2,4].map(i=>parseInt(n.slice(i,i+2),16)/255);
  return values.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4)
    .reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
};
const contrast=(a,b)=>{const l=[relLum(a),relLum(b)].sort((x,y)=>y-x);return (l[0]+.05)/(l[1]+.05)};
assert.ok(contrast(token.colors.logo_yellow,token.colors.obsidian)>=4.5,"Yellow/Obsidian primary CTA contrast");
assert.ok(contrast(token.colors.ivory,token.colors.obsidian)>=4.5,"Ivory/Obsidian body contrast");
assert.ok(contrast(token.colors.warm_white,token.colors.espresso)>=4.5,"Warm White/Espresso navigation contrast");

// HTML/icon migration alone is not an embedded-logo migration. Require real
// corrected WebP binaries, exact checksums, and elimination of stale image URLs.
assert.equal(report.embedded_image_branding_status,"PARTIAL / NO-GO");
assert.equal(report.embedded_old_logos_remaining,true,"video/device originals still need a source check");
assert.ok(report.embedded_logo_assets_to_remediate.length>=4);
const pending=report.embedded_logo_assets_to_remediate.filter(x=>x.status==="PENDING");
const corrected=report.embedded_logo_assets_to_remediate.filter(x=>x.status.startsWith("BUILD_CORRECTED"));
assert.equal(corrected.length,3);
assert.ok(pending.length>=1);
for(const asset of corrected){
  assert.ok(fs.existsSync(path.join(OUT,asset.preview)),asset.preview);
  assert.ok(!fs.existsSync(path.join(OUT,asset.preview.replace("-ci21.webp",".webp"))),
    asset.preview+": stale image still publicly shipped");
}
assert.ok(report.blocking_gates.some(x=>x.includes("video/other embedded old logos")));
const retouched=JSON.parse(read("qa/studio18-embedded-image-corrections.json"));
assert.equal(retouched.length,3);
for(const item of retouched){
  const data=fs.readFileSync(path.join(OUT,"assets/images",item.corrected));
  assert.equal(data.toString("ascii",0,4),"RIFF",item.corrected);
  assert.equal(data.toString("ascii",8,12),"WEBP",item.corrected);
  assert.equal(createHash("sha256").update(data).digest("hex"),item.corrected_sha256);
}
assert.ok(Object.values(report.corrected_image_references).reduce((a,b)=>a+b,0)>=3);
const oldImageNames=[
 "fotospiegel-hero-lossless.webp",
 "fotobox-event-1672.webp",
 "fotobox-event-800.webp"
];
function assertNoStaleImages(dir){
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
   const p=path.join(dir,entry.name);
   if(entry.isDirectory()){
     if(!["qa","node_modules"].includes(entry.name))assertNoStaleImages(p);
   }else if(/\.(html|css|js|json|webmanifest)$/.test(entry.name)){
     const source=fs.readFileSync(p,"utf8");
     for(const old of oldImageNames){
       assert.ok(!source.includes(old),path.relative(OUT,p)+": embedded old image path "+old);
     }
   }
 }
}
assertNoStaleImages(OUT);

const approvedPrintLogo="bd75b191893afdf60ce51ccf5a7ad0298ecca9660603dbd2ce1f1b2755501fba";
const printAudit=JSON.parse(read("qa/photoprint-44-audit.json"));
assert.equal(printAudit.masterCi21LogoSha256,approvedPrintLogo,
  "The 44 print originals must be built with CI 2.1, not the legacy goldmark");
assert.equal(printAudit.candidateCount,44);
assert.equal(printAudit.originalSourceDesignsPreserved,32);
assert.equal(printAudit.newDesigns,12);
for(let number=1;number<=44;number++){
  const name="fp-"+String(number).padStart(3,"0");
  assert.ok(fs.existsSync(path.join(OUT,"assets/designvorlagen",name+".webp")),name+": gallery");
  assert.ok(fs.existsSync(path.join(ROOT,"private-design-assets/print",name+".png")),name+": protected print");
}
assert.ok(!fs.existsSync(path.join(OUT,"assets/designvorlagen/print")),
  "Protected original print overlays cannot be published to the public CDN");

assert.equal(report.classic_templates_inventory_count,32);
assert.equal(report.classic_templates_print_qa_completed,0);
assert.ok(report.blocking_gates.length>=5);

let checked=0;
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const f=path.join(dir,entry.name);
    if(entry.isDirectory()){ if(!["node_modules","qa"].includes(entry.name))walk(f); }
    else if(entry.name==="index.html"){
      const text=fs.readFileSync(f,"utf8");
      const label=path.relative(OUT,f);
      for(const asset of [
        "/studio13-unified-brand.css",
        "/assets/brand/v2-1/fotopolis-ci-2.1.css",
        "/studio18-ci21-compat.css"
      ]){
        assert.equal(text.split('href="'+asset+'"').length-1,1,label+": "+asset);
      }
      const i0=text.indexOf("/studio13-unified-brand.css");
      const i1=text.indexOf("/assets/brand/v2-1/fotopolis-ci-2.1.css");
      const i2=text.indexOf("/studio18-ci21-compat.css");
      assert.ok(i0<i1 && i1<i2,label+": stylesheet cascade");
      assert.equal((text.match(/<\/head>/g)||[]).length,1,label);
      assert.ok(!text.includes("/assets/fotopolis-goldmark.webp"),label+": old logo reference");
      assert.ok(!text.includes("/assets/fotopolis-logo-original.png"),label+": old logo reference");
      checked++;
    }
  }
}
walk(OUT);
assert.equal(checked,report.html_pages);
assert.ok(checked>=17);
const manifest=JSON.parse(read("manifest.webmanifest"));
assert.equal(manifest.id,"/");
assert.equal(manifest.scope,"/");
assert.equal(manifest.theme_color,"#F7F3EC");
for(const icon of manifest.icons){assert.ok(fs.existsSync(path.join(OUT,icon.src.replace(/^\//,""))),icon.src);}
assert.ok(fs.existsSync(path.join(OUT,"favicon.ico")));
const sw=read("service-worker.js");
assert.match(sw,/v18-ci21-foundation-r1/);
assert.match(sw,/\/assets\/brand\/v2-1\/fotopolis-ci-2\.1\.css/);
assert.ok(sw.includes("/assets/brand/v2-1/fotopolis-logo-ci21-256.webp"),"PWA offline logo precache");
assert.match(sw,/\/admin\//);
assert.match(sw,/\/api\//);
for(let n=1;n<=32;n++){
  const f="assets/designvorlagen/fp-"+String(n).padStart(3,"0")+".webp";
  assert.ok(fs.existsSync(path.join(OUT,f)),f);
}
console.log("STUDIO 18 FOUNDATION QA PASS: "+checked+" pages, 32 Classics, tokens and PWA references. RELEASE: NO-GO; corrected mirror/booth rasters generated; video, visual review, print and E2E pending.");
