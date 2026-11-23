#!/usr/bin/env node
/** FOTOPOLIS Studio 18.2 — non-sensitive preview provenance. */
import fs from "node:fs";
import path from "node:path";
import {execFileSync} from "node:child_process";

const out=path.resolve("preview-build");
if(!fs.statSync(out,{throwIfNoEntry:false})?.isDirectory())
  throw Error("Missing preview-build; provenance requires a completed preview build");
const context=process.env.CONTEXT||"local";
if(context==="production")throw Error("Refusing to generate Studio 18.2 production provenance");

const sha=/^[0-9a-f]{40}$/i.test(process.env.COMMIT_REF||"")
  ?process.env.COMMIT_REF.toLowerCase():null;
const safe=(input,max=100)=>String(input||"").replace(/[^a-zA-Z0-9_.\/-]/g,"").slice(0,max);
const branch=safe(process.env.BRANCH||"local");
const deployId=safe(process.env.DEPLOY_ID||"",60)||null;
const metadata={
  project:"FOTOPOLIS",
  release:"Studio 18.2",
  readiness:"NO-GO",
  mode:"ISOLATED_PREVIEW",
  context:safe(context,40),
  branch,
  commit:sha,
  deployId,
  generatedAt:new Date().toISOString(),
  verification:"build provenance only; no authenticated E2E, real print or product release certification"
};
fs.writeFileSync(path.join(out,"studio18-release.json"),JSON.stringify(metadata,null,2)+"\n");
const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));
const badgeText="FOTOPOLIS Studio 18.2 · "+(sha?sha.slice(0,12):"lokaler Build")+
  " · "+context+" · NICHT FREIGEGEBEN";
const targets=["admin/dashboard/index.html","admin/login/index.html"];
let updated=0;
for(const relative of targets){
  const file=path.join(out,relative);
  if(!fs.existsSync(file))throw Error("Expected internal test route missing: "+relative);
  let html=fs.readFileSync(file,"utf8");
  if(!/<\/body>/i.test(html))throw Error("Invalid HTML: "+relative);
  if(html.includes('id="fp18-build-provenance"'))
    throw Error("Duplicate provenance marker: "+relative);
  const element='<aside id="fp18-build-provenance" aria-label="Entwicklungsversion" '+
    'style="position:fixed;bottom:0;left:0;z-index:9999;max-width:100%;'+
    'padding:6px 10px;background:#181512;color:#F7F3EC;font:11px Manrope,Arial,sans-serif;'+
    'border-top:2px solid #FEE158;pointer-events:none">'+
    escapeHtml(badgeText)+'</aside>';
  html=html.replace(/<\/body>/i,element+"</body>");
  fs.writeFileSync(file,html);
  updated++;
}
console.log("FOTOPOLIS 18.2 PROVENANCE:",metadata.context,metadata.commit||"local",
  "internal routes",updated,"status NO-GO");
