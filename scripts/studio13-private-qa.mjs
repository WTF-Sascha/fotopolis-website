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
assert.ok(contact.includes('fp13MirrorEnquiry?.(form,"website")'),"Contact not mirrored after Netlify success");
assert.ok(product.includes('fp13MirrorEnquiry?.(form,"product")'),"Product enquiries not mirrored after Netlify success");
assert.ok(read(publicRoot+"datenschutz/index.html").includes("interne Verwaltungsdatenbank"),"Preview privacy disclosure missing");
assert.ok(read(publicRoot+"admin/dashboard/dashboard-bundle.js").includes("studio13/admin/"),"Studio 13 admin controls not compiled");
assert.ok(!read(publicRoot+"admin/dashboard/index.html").includes("postgresql://"),"Credentials leaked");
console.log("Studio 13 P0/P1 secure assets and complete module hooks PASS; real role-authorized E2E remains distinct.");

