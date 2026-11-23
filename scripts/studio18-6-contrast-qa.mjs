#!/usr/bin/env node
/**
 * Studio 18.6: deterministic contrast regression for selected small-text controls.
 * Checks approved CI 2.1 token use and the known source backgrounds.
 * This is a scoped code-level check, NOT a full WCAG 2.2 AA certification.
 */
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const tokens=read("site/assets/brand/v2-1/fotopolis-ci-2.1.css");
const login=read("concepts/premium-v2/admin/login/login.css");
const admin=read("concepts/premium-v2/admin/dashboard/command-center.css");
const token=name=>{
  const match=tokens.match(new RegExp("--"+name+"\\s*:\\s*(#[0-9A-Fa-f]{6})\\s*;"));
  assert.ok(match,"missing CI-2.1 token "+name);
  return match[1];
};
const luminance=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
  .map(value=>value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4)
  .reduce((sum,value,i)=>sum+value*[0.2126,0.7152,0.0722][i],0);
const contrast=(a,b)=>{
  const x=luminance(a),y=luminance(b);
  return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);
};
const declaration=(css,selector)=>{
  const start=css.indexOf(selector+"{");
  assert.ok(start>=0,"missing selector: "+selector);
  const end=css.indexOf("}",start);
  assert.ok(end>start,"unterminated selector: "+selector);
  return css.slice(start+selector.length+1,end);
};
assert.ok(declaration(login,".mode-tabs").includes("background:#e8ebe9"));
assert.ok(declaration(admin,".cc-panel").includes("background:#fbf8f2"));
assert.ok(declaration(admin,"#dashboard-app .fp16-area-switch").includes("background:#f1e9dc"));

const cases=[
  {file:login,selector:".eyebrow",token:"fp-warning",bg:"#F7F3EC"},
  {file:login,selector:".mode-tabs button",token:"fp-text-muted",bg:"#e8ebe9"},
  {file:login,selector:".footnote",token:"fp-text-muted",bg:"#F7F3EC"},
  {file:login,selector:".link-button",token:"fp-warning",bg:"#F7F3EC"},
  {file:admin,selector:".cc-eyebrow",token:"fp-warning",bg:"#fbf8f2"},
  {file:admin,selector:".cc-link",token:"fp-warning",bg:"#fbf8f2"},
  {file:admin,selector:"#dashboard-app .fp16-kicker",token:"fp-text-muted",bg:"#f1e9dc"}
];
for(const entry of cases){
  const rule=declaration(entry.file,entry.selector);
  assert.ok(rule.includes("color:var(--"+entry.token+","),
    entry.selector+": approved CI 2.1 color token not used");
  const ratio=contrast(token(entry.token),entry.bg);
  assert.ok(ratio>=4.5,entry.selector+": calculated text contrast below 4.5:1: "+ratio.toFixed(2));
  console.log("PASS",entry.selector,"contrast",ratio.toFixed(2)+":1");
}
console.log("Studio 18.6 scoped contrast contract: PASS ("+cases.length+" controls; browser/full WCAG review still required)");
