#!/usr/bin/env node
/** Isolated, no-network tests for Studio 18.2 release gates. */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
const root=path.resolve(".");
const guard=path.join(root,"scripts/studio18-2-preview-guard.mjs");
const provenance=path.join(root,"scripts/studio18-2-build-provenance.mjs");
const neutralEnv={...process.env};
for(const key of ["CONTEXT","NETLIFY","DEPLOY_ID","SITE_ID","NETLIFY_SITE_ID","COMMIT_REF","BRANCH"]){
  delete neutralEnv[key];
}
function run(script,extra={},cwd=root){
  return spawnSync(process.execPath,[script],{cwd,encoding:"utf8",
    env:{...neutralEnv,...extra}});
}
test("local build reports offline mode but never production authorization",()=>{
  const r=run(guard);
  assert.equal(r.status,0,r.stderr);
  assert.match(r.stdout,/LOCAL QA ONLY/);
});
test("approved Netlify contexts pass only on expected site",()=>{
  for(const context of ["deploy-preview","branch-deploy"]){
    const r=run(guard,{NETLIFY:"true",CONTEXT:context,SITE_ID:"653f790e-5476-4349-84d9-012adbeeb489"});
    assert.equal(r.status,0,r.stderr);
    assert.match(r.stdout,/PREVIEW ONLY/);
  }
});
test("production, unknown context and unexpected site fail closed",()=>{
  for(const extra of [
    {NETLIFY:"true",CONTEXT:"production"},
    {NETLIFY:"true",CONTEXT:""},
    {NETLIFY:"true",CONTEXT:"deploy-preview",SITE_ID:"unrelated-site"}
  ]){
    const r=run(guard,extra);
    assert.notEqual(r.status,0,"must reject "+JSON.stringify(extra));
    assert.match(r.stderr,/RELEASE NO-GO/);
  }
});
test("manifest exposes provenance only in local fixture; no real admin or deploy",()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"fotopolis-studio18-release-"));
  try{
    for(const route of ["admin/login","admin/dashboard"]){
      const dir=path.join(tmp,"preview-build",route);
      fs.mkdirSync(dir,{recursive:true});
      fs.writeFileSync(path.join(dir,"index.html"),"<html><body><main>Test</main></body></html>");
    }
    const sha="a".repeat(40);
    const r=run(provenance,{NETLIFY:"true",CONTEXT:"deploy-preview",
      COMMIT_REF:sha,BRANCH:"feature/studio18-2-enterprise-quality-recovery",
      DEPLOY_ID:"example-deploy"},tmp);
    assert.equal(r.status,0,r.stderr);
    const data=JSON.parse(fs.readFileSync(path.join(tmp,"preview-build","studio18-release.json"),"utf8"));
    assert.equal(data.commit,sha);
    assert.equal(data.readiness,"NO-GO");
    assert.equal(data.context,"deploy-preview");
    for(const route of ["admin/login","admin/dashboard"]){
      const html=fs.readFileSync(path.join(tmp,"preview-build",route,"index.html"),"utf8");
      assert.match(html,/id="fp18-build-provenance"/);
      assert.match(html,/NICHT FREIGEGEBEN/);
      assert.match(html,/aaaaaaaaaaaa/);
    }
    const second=run(provenance,{CONTEXT:"deploy-preview"},tmp);
    assert.notEqual(second.status,0,"repeated injection must fail");
  }finally{
    fs.rmSync(tmp,{recursive:true,force:true});
  }
});
test("provenance build script refuses production even with valid fixtures",()=>{
  const r=run(provenance,{CONTEXT:"production"});
  assert.notEqual(r.status,0);
});
