#!/usr/bin/env node
// FOTOPOLIS persistent staging guard. No real authentication and no DB I/O.
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validDevDeploy,samePreviewOrigin} from "../netlify/functions/fotopolis-admin-session.mjs";
const read=p=>readFileSync(p,"utf8");
const host="https://staging--fotopolis-preview.netlify.app";
const ctx={deploy:{context:"branch-deploy",published:false}};
const previewCtx={deploy:{context:"deploy-preview",published:false}};
const productionCtx={deploy:{context:"production",published:true}};
const url=new Request(host+"/api/fotopolis/admin/session");
assert.equal(validDevDeploy(url,ctx),true);
assert.equal(validDevDeploy(url,previewCtx),false);
assert.equal(validDevDeploy(url,productionCtx),false);
assert.equal(validDevDeploy(new Request("https://fotopolis-preview.netlify.app/api/fotopolis/admin/session"),ctx),false);
assert.equal(validDevDeploy(new Request("https://other--fotopolis-preview.netlify.app/api/fotopolis/admin/session"),ctx),false);
assert.equal(validDevDeploy(new Request("https://staging--fotopolis-preview.netlify.app.evil.test/api/fotopolis/admin/session"),ctx),false);
assert.equal(samePreviewOrigin(new Request(host+"/api/fotopolis/studio13/enquiry",{
  method:"POST",headers:{Origin:host}})),true);
assert.equal(samePreviewOrigin(new Request(host+"/api/fotopolis/studio13/enquiry",{
  method:"POST",headers:{Origin:"https://fotopolis-preview.netlify.app"}})),false);

const gate=read("netlify/functions/fotopolis-admin-session.mjs");
assert.ok(gate.includes('context?.deploy?.context==="branch-deploy"'),"Staging branch context must be explicit");
assert.ok(gate.includes('url.hostname===STAGING_HOST'),"Only exact staging host may reach auth");
assert.ok(gate.includes('return Netlify.env.get(key.replace(/^FOTOPOLIS_/,"FOTOPOLIS_STAGING_"));'),
  "Staging must resolve separate least-privileged DB aliases");
const guarded=[
 "fotopolis-admin-session.mjs","fotopolis-admin-overview.mjs",
 "fotopolis-admin-inventory.mjs","fotopolis-admin-activity.mjs",
 "fotopolis-admin-health.mjs","fotopolis-admin-occupancy-check.mjs",
 "fotopolis-admin-blocks.mjs","fotopolis-admin-reservations.mjs",
 "fotopolis-studio13-admin.mjs","fotopolis-studio13-public.mjs",
 "fotopolis-design-private.mjs"
];
for(const f of guarded){
 const script=read("netlify/functions/"+f);
 assert.ok(script.includes("devDatabaseConnection("),"Missing staging DB adapter: "+f);
 assert.ok(!/Netlify\.env\.get\("FOTOPOLIS_NEON_DEV_/.test(script),"Preview-only DB key accessed directly: "+f);
}
const blocks=read("netlify/functions/fotopolis-admin-blocks.mjs");
assert.ok(blocks.includes("samePreviewOrigin(request)"),
 "Block mutations must accept only the current, exact same origin");
assert.ok(!blocks.includes('const origin="https://deploy-preview-2--'),
 "Legacy hard-coded preview origin would block production-quality staging tests");
const publicGateway=read("netlify/functions/fotopolis-studio13-public.mjs");
assert.ok(publicGateway.includes("validDevDeploy(req,context)"),"Public staging API must validate deployment host and context");
const netlify=read("netlify.toml");
assert.ok(netlify.includes("[context.branch-deploy]"),"Branch deploy build contract missing");
assert.ok(netlify.includes('X-Robots-Tag = "noindex, nofollow"'),
  "Persistent test address must stay out of search indexes");
console.log("FOTOPOLIS STAGING SECURITY QA PASS: exact host, isolated secrets, non-production context and server roles.");
