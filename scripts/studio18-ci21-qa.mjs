#!/usr/bin/env node
/** Studio 18 CI-2.1 foundation contract (not visual, functional or print approval). */
import fs from "node:fs";
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
assert.equal(report.approved_original_source_verified_against_ci21_pdf,true);\nassert.equal(report.approved_original_source_master_sha256,"3aa473c6788beb52587a7c5c423cd83f05a44e356b51bcabbb5b6f7af6957a24");\nassert.equal(report.approved_logo_switched,true);
assert.equal(report.old_icons_remaining,false);
assert.equal(report.logo_web_derivative_sha256,"bd75b191893afdf60ce51ccf5a7ad0298ecca9660603dbd2ce1f1b2755501fba");
assert.ok(fs.existsSync(path.join(OUT,"assets/brand/v2-1/fotopolis-logo-ci21-256.webp")));
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
      assert.equal((text.match(/<\\/head>/g)||[]).length,1,label);
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
for(const icon of manifest.icons){assert.ok(fs.existsSync(path.join(OUT,icon.src.replace(/^\\//,""))),icon.src);}
assert.ok(fs.existsSync(path.join(OUT,"favicon.ico")));
const sw=read("service-worker.js");
assert.match(sw,/v18-ci21-foundation-r1/);
assert.match(sw,/\/assets\/brand\/v2-1\/fotopolis-ci-2\.1\.css/);
assert.match(sw,/\/admin\//);
assert.match(sw,/\/api\//);
for(let n=1;n<=32;n++){
  const f="assets/designvorlagen/fp-"+String(n).padStart(3,"0")+".webp";
  assert.ok(fs.existsSync(path.join(OUT,f)),f);
}
console.log("STUDIO 18 FOUNDATION QA PASS: "+checked+" pages, 32 Classics, tokens and PWA references. RELEASE: NO-GO; preview logo/icons integrated, full-resolution brand master, print, screenshots and E2E pending.");
