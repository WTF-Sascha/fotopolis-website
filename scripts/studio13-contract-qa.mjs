#!/usr/bin/env node
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {join} from "node:path";
const root=process.cwd();
const read=path=>readFileSync(join(root,path),"utf8");
const admin=read("preview-build/admin/dashboard/index.html");
const css=read("preview-build/admin/dashboard/command-center.css");
const catalogue=JSON.parse(read("preview-build/assets/design-gallery-data.json"));
assert.equal(catalogue.length,44,"All approved templates must survive");
assert.equal(catalogue.filter(x=>x.collection==="classics").length,32);
assert.equal(catalogue.filter(x=>x.collection==="signature").length,12);
for(const id of ["overview","calendar","inventory","planning","bookings","activity","analytics","eventanfragen","designstudio","designs","cms","medien","system","account"]){
  assert.match(admin,new RegExp('id="'+id+'"'),"Missing admin section "+id);
}
for(const link of ["#analytics","#eventanfragen","#designstudio","#designs","#cms","#medien","#system"]){
  assert.ok(admin.includes('href="'+link+'"'),"Missing navigation "+link);
}
assert.ok(admin.includes('id="dashboard-app" hidden'),"Admin dashboard must stay gated");
for(const jsPath of ["preview-build/contact-flow.js","preview-build/product-enquiry-v6.js"]){
  const js=read(jsPath);
  assert.match(js,/await window\.fp13MirrorEnquiry\(form,/,
    "Wait for CRM mirror to finish before displaying final success state");
  assert.match(js,/if\(!studio14MirrorOk\).*Netlify Forms bleibt maßgeblich/,
    "Never hide failed internal CRM replication from the test UI");
}
for(const formPath of ["kontakt/index.html","fotobox/index.html",
  "fotospiegel/index.html","fotowohnwagen/index.html"]){
 const html=read("preview-build/"+formPath);
 assert.match(html,/name="fp_request_key" value=""/,
   "Shared request key must be declared in the final Netlify Forms build");
}
for(const jsPath of ["preview-build/contact-flow.js","preview-build/product-enquiry-v6.js"]){
 const js=read(jsPath);
 assert.ok(js.includes('form.elements.namedItem("fp_request_key")'),"Missing source key injection");
 assert.ok(js.includes("crypto.randomUUID()"),"Shared source key not generated before Netlify Forms");
}
const productJs=read("preview-build/product-enquiry-v6.js");
assert.ok(productJs.includes('payload.append("fp_request_key",studio14KeyField.value)'),
  "Product must submit the same reference key as the CRM mirror");
const mirror=read("preview-build/studio13-enquiry-mirror.js");
assert.ok(mirror.includes("keys=new WeakMap()"),"Mirror retries must reuse per-form UUID");
assert.ok(mirror.includes("attempt<2"),"Bounded retry missing");
assert.ok(!mirror.includes("localStorage"),"No personal data or synthetic success in local storage");

assert.ok(admin.includes("/admin/dashboard/dashboard-bundle.js"),"Existing auth bundle missing");
assert.ok(admin.includes("command-center.css"));
assert.ok(css.includes("@media(max-width:520px)"),"Mobile CSS missing");
assert.ok(!/\b(?:2024|12345)\s*(?:Besuche|Conversions)\b/.test(admin),"No fake KPIs");
const auth=read("netlify/functions/fotopolis-admin-session.mjs");
assert.ok(auth.includes("PREVIEW_HOST.test(url.hostname)"),"Preview host gate must be checked");
assert.ok(!auth.includes("const PREVIEW_ORIGIN"),"No fixed PR #2 origin");
assert.ok(auth.includes('context?.deploy?.context!=="deploy-preview"'));
assert.ok(existsSync(join(root,"docs/FOTOPOLIS_STUDIO_13_ARCHITECTURE_AND_RISKS.md")));
console.log("Studio 13 foundation contract: admin gating, route coverage, 44 templates, no fake analytics PASS");
