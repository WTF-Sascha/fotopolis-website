#!/usr/bin/env node
import assert from "node:assert/strict";
import {readFileSync,readdirSync,existsSync} from "node:fs";
const read=p=>readFileSync(p,"utf8");
const publicRoot="preview-build/",internal="private-design-assets/";
const list=JSON.parse(read(publicRoot+"assets/design-gallery-data.json"));
assert.equal(list.length,44);
assert.ok(list.every(x=>!Object.hasOwn(x,"printOverlay")&&!Object.hasOwn(x,"photoRegions")));
assert.equal(readdirSync(internal+"print").filter(x=>x.endsWith(".png")).length,44);
assert.ok(!existsSync(publicRoot+"assets/designvorlagen/print"));
assert.ok(!existsSync(publicRoot+"designstudio/index.html"));
assert.ok(!existsSync(publicRoot+"studio12-editor.js"));
assert.ok(!existsSync(publicRoot+"qa"));
assert.ok(existsSync(publicRoot+"admin/designstudio/index.html"));
const shell=read(publicRoot+"admin/designstudio/index.html");
assert.ok(!shell.includes("data-fp12-editor"),"Editor markup must be served only after bearer authorization");
const ed=read(publicRoot+"admin/designstudio/studio13-editor.js");
assert.ok(ed.includes("window.fp13Fetch"),"Editor must fetch protected assets");
assert.ok(!ed.includes('fetch("/assets/design-gallery-data.json"'));
const gallery=read(publicRoot+"designvorlagen/index.html");
assert.ok(!gallery.includes('data-modal-editor')&&!gallery.includes('data-modal-print'));
assert.ok(!gallery.includes('href="/designstudio/'));
const sw=read(publicRoot+"service-worker.js");
assert.ok(!sw.includes("'/designstudio/'"));
assert.ok(!sw.includes("'/studio12-editor.js'"));
assert.equal(JSON.parse(read(internal+"catalogue.json")).length,44);

for(const name of ["studio13-metrics.js","studio13-enquiry-mirror.js","studio13-public-content.js"]){
 assert.ok(existsSync(publicRoot+name),"Missing real Studio 13 public adapter "+name);
}
for(const path of ["index.html","fotobox/index.html","fotospiegel/index.html",
 "fotowohnwagen/index.html","designvorlagen/index.html","kontakt/index.html","faq/index.html"]){
 assert.ok(read(publicRoot+path).includes("/studio13-metrics.js"),"Missing metrics integration on "+path);
}
const contact=read(publicRoot+"contact-flow.js"),product=read(publicRoot+"product-enquiry-v6.js");
assert.match(contact,/await window\.fp13MirrorEnquiry\(form,"website"\)/,"Contact must await CRM mirror after Netlify accepts");
assert.match(product,/await window\.fp13MirrorEnquiry\(form,"product"\)/,"Product enquiry must await CRM mirror");
assert.ok(read(publicRoot+"datenschutz/index.html").includes("interne Verwaltungsdatenbank"),"Preview privacy disclosure missing");
assert.ok(read(publicRoot+"admin/dashboard/dashboard-bundle.js").includes("studio13/admin/"),"Studio 13 admin controls not compiled");
assert.ok(!read(publicRoot+"admin/dashboard/index.html").includes("postgresql://"),"Credentials leaked");

// Studio 13.1 complete design-system contracts.
const manifest=JSON.parse(read(publicRoot+"manifest.webmanifest"));
assert.equal(manifest.theme_color,"#211a15");
assert.equal(manifest.background_color,"#faf6ef");
assert.equal(manifest.id,"/");
assert.equal(manifest.icons.length,3);
assert.ok(manifest.icons.every(x=>x.src.includes("/icons/brand-")));
for(const i of manifest.icons)assert.ok(existsSync(publicRoot+i.src));
for(const size of [16,32,48,64,192,512])assert.ok(existsSync(publicRoot+"icons/brand-"+size+".png"));
assert.ok(existsSync(publicRoot+"icons/brand-180.png"));
assert.ok(existsSync(publicRoot+"favicon.ico"));
const unified=read(publicRoot+"studio13-unified-brand.css");
assert.ok(unified.includes("--fp-brand-dark:#211a15"));
assert.ok(unified.includes(".sidebar-nav a"));
assert.ok(unified.includes(".brand-panel"));
assert.ok(unified.includes("@media(max-width:540px)"));
for(const page of ["index.html","fotobox/index.html","fotospiegel/index.html","fotowohnwagen/index.html",
    "designvorlagen/index.html","kontakt/index.html","faq/index.html","datenschutz/index.html",
    "admin/login/index.html","admin/dashboard/index.html","admin/designstudio/index.html"]){
 const html=read(publicRoot+page);
 assert.equal((html.match(/studio13-unified-brand\.css/g)||[]).length,1,"Shared brand link missing or repeated on "+page);
 assert.ok(!html.includes("/assets/fotopolis-logo-original.png"),"Old logo reference: "+page);
 assert.ok(html.includes("/icons/brand-32.png"),"Outdated browser favicon on "+page);
}
const appAdmin=read(publicRoot+"admin/admin.css");
const appLogin=read(publicRoot+"admin/login/login.css");
assert.ok(!appAdmin.includes("#071b30")&&!appLogin.includes("#071b30"),"Legacy navy not purged from admin CSS");
assert.ok(read(publicRoot+"service-worker.js").includes("v14-print-clean-admin-portal-r1"),"PWA cache version not changed");
console.log("Studio 13.1 brand: all entries unified, 3 PWA icons, approved goldmark, warm admin and fresh cache PASS.");
console.log("Studio 13 P0/P1 secure assets and complete module hooks PASS; real role-authorized E2E remains distinct.");

