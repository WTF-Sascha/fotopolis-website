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
