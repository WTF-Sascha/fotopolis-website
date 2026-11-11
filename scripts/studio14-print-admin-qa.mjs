#!/usr/bin/env node
/* Studio 14: approve no catalog-title injection into Signature print assets and
   explicit, secure discoverability of the preview-only internal administration.
   Never infer that baked-in typography of the 32 classic source images is clean.
*/
import assert from "node:assert/strict";
import {readFileSync,existsSync,readdirSync} from "node:fs";
import {join} from "node:path";

const root=process.cwd(),built=join(root,"preview-build");
const read=relative=>readFileSync(join(root,relative),"utf8");
const catalogue=JSON.parse(read("preview-build/assets/design-gallery-data.json"));
assert.equal(catalogue.length,44);
const signature=catalogue.filter(x=>x.collection==="signature");
const classics=catalogue.filter(x=>x.collection==="classics");
assert.equal(signature.length,12);
assert.equal(classics.length,32);
assert.ok(signature.every(x=>x.printIncludesTemplateTitle===false),
  "Signature prints must explicitly omit catalog titles");
const printer=read("scripts/build-photo-print-collection.py");
const header=printer.split("def header(draw,item,text,gold):")[1]?.split("\nclassic_records=[]")[0];
assert.ok(header,"The signature-print header must be inspectable");
assert.doesNotMatch(header,/draw\.text\s*\(/,
  "Do not burn signature catalogue names or category names into print files");
assert.ok(signature.every(x=>!/^FP-/.test(x.name)),"Keep display labels outside print graphics");

for(let i=1;i<=44;i++){
 const name="fp-"+String(i).padStart(3,"0")+".png";
 assert.ok(existsSync(join(root,"private-design-assets/print",name)),name+" is missing");
}
assert.equal(readdirSync(join(root,"private-design-assets/print")).filter(x=>x.endsWith(".png")).length,44);
assert.ok(!existsSync(join(built,"assets/designvorlagen/print")),
  "Print production masters must remain outside the public CDN");

const admin=read("preview-build/admin/index.html");
assert.ok(admin.includes("Interne Verwaltung") && admin.includes("MANAGEMENT STUDIO"),
  "Admin landing must have a branded, named entry point");
assert.ok(admin.includes('href="/admin/login/"'),"Missing login entry");
assert.ok(admin.includes('href="/admin/dashboard/"'),"Missing dashboard");
assert.ok(admin.includes('href="/admin/designstudio/"'),"Missing private editor");
assert.ok(!/http-equiv=["']refresh["']/i.test(admin),"Admin entrance must not auto-redirect");

const publicPages=readdirSync(built,{withFileTypes:true});
let linked=0;
for(const dir of ["","fotobox","fotospiegel","fotowohnwagen","designvorlagen","kontakt",
                   "pakete","faq","anlaesse","ueber-uns"]){
 const html=read("preview-build/"+(dir?dir+"/":"")+"index.html");
 assert.match(html,/href="\/admin\/">Interne Verwaltung/,
  "The internal access link is missing in "+(dir||"start"));
 assert.equal((html.match(/fp14-admin-entry/g)||[]).length,1,"Duplicate admin link in "+dir);
 assert.match(html,/<nav[^>]*id="mainnav"[^>]*>[\s\S]*?class="fp15-staff-nav" href="\/admin\/"/,
   "The team administration link must be visible in the primary navigation on "+(dir||"start"));
 assert.equal((html.match(/class="fp15-staff-nav"/g)||[]).length,1,
   "No duplicated team action in "+(dir||"start"));
 linked++;
}
const css=read("preview-build/studio13-unified-brand.css");
assert.ok(css.includes(".fp14-admin-entry"),"Team entry must match the approved color system");
assert.ok(css.includes(".studio-mainnav a.fp15-staff-nav"),
 "Primary navigation team entry must match quiet-luxury design tokens");
// Studio 15 contract: customer and employee routes share one installable ID.
// The protected routes remain network-only and are never PWA cached.
const publicManifest=JSON.parse(read("preview-build/manifest.webmanifest"));
assert.equal(publicManifest.id,"/");
assert.equal(publicManifest.start_url,"/");
assert.equal(publicManifest.scope,"/");
assert.equal(publicManifest.display,"standalone");
assert.ok(!existsSync(join(built,"admin/manifest.webmanifest")),
  "A second staff manifest would create a competing app identity");
for(const shortcut of ["/admin/","/admin/dashboard/#eventanfragen",
                       "/admin/dashboard/#calendar","/admin/designstudio/"]){
 assert.ok(publicManifest.shortcuts.some(x=>x.url===shortcut),
   "Missing unified app shortcut "+shortcut);
}
for(const icon of publicManifest.icons){
 assert.ok(icon.src.startsWith("/icons/brand-"),"Only approved goldmark icons");
 assert.ok(existsSync(join(built,icon.src.slice(1))),"Missing approved app icon "+icon.src);
}
for(const pagePath of ["admin/index.html","admin/login/index.html",
                       "admin/dashboard/index.html","admin/designstudio/index.html"]){
 const page=read("preview-build/"+pagePath);
 assert.ok(page.includes('href="/manifest.webmanifest"'),
   "Canonical manifest missing in "+pagePath);
 assert.ok(page.includes('src="/pwa-update.js"'),
   "Unified update registration missing in "+pagePath);
 assert.equal((page.match(/rel="manifest"/g)||[]).length,1,
   "Duplicate manifest in "+pagePath);
 assert.ok(!page.includes('href="/admin/manifest.webmanifest"'),
   "Competing staff manifest in "+pagePath);
}
const worker=read("preview-build/service-worker.js");
assert.ok(worker.includes("url.pathname.startsWith('/admin/')"),
  "Public service worker must never cache private staff routes");
assert.ok(admin.includes('href="/admin/dashboard/#eventanfragen"'),"Missing direct private inbox");
assert.ok(admin.includes('href="/admin/dashboard/#calendar"'),"Missing private calendar");
assert.ok(admin.includes('href="/admin/dashboard/#inventory"'),"Missing private equipment management");

const login=read("preview-build/admin/login/index.html");
assert.ok(login.includes("login-bundle.js"),"Real Neon Auth login must stay active");
const secured=read("preview-build/admin/designstudio/index.html");
assert.ok(secured.includes("boot-bundle.js"),"Private editor must stay behind auth bootstrap");
console.log("STUDIO 14 PRINT + ADMIN QA: "+signature.length+" signatures without embedded generated titles, "+
  classics.length+" classics source-preserved (manual baked-text review needed), 44 protected print masters, "+
  linked+" public entry links, unified public-and-admin PWA, real private management entry PASS.");
