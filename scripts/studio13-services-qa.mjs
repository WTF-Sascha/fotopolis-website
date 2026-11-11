#!/usr/bin/env node
/* Studio 13: enforce preview-only server contracts before any external data access. */
import test from "node:test";
import assert from "node:assert/strict";
import publicHandler,{validateMetric,validateEnquiry} from "../netlify/functions/fotopolis-studio13-public.mjs";
import adminHandler,{may,mayPublishCms} from "../netlify/functions/fotopolis-studio13-admin.mjs";
import {mayAccessDesign} from "../netlify/functions/fotopolis-design-private.mjs";
import {samePreviewOrigin} from "../netlify/functions/fotopolis-admin-session.mjs";
const host="https://deploy-preview-19--fotopolis-preview.netlify.app";
const preview={deploy:{context:"deploy-preview",published:false}};
const live={deploy:{context:"production",published:true}};
const base={requestKey:"11111111-1111-4111-8111-111111111111",source:"website",
 fullName:"Preview Test",email:"studio13@example.invalid",phone:"",
 product:"Fotobox",eventDate:"2027-07-07",eventLocation:"Ahlen",
 templateId:"FP-017",notes:"Nur synthetischer Test",consentConfirmed:true,website:""};
test("strict incoming enquiry validation incl consent, length and invalid date",()=>{
 assert.ok(validateEnquiry(base));
 assert.equal(validateEnquiry({...base,consentConfirmed:false}),null);
 assert.equal(validateEnquiry({...base,email:"invalid"}),null);
 assert.equal(validateEnquiry({...base,eventDate:"2026-99-99"}),null);
 assert.equal(validateEnquiry({...base,templateId:"FP-999"}),null);
 assert.equal(validateEnquiry({...base,templateId:"FP-000"}),null);
 assert.equal(validateEnquiry({...base,notes:"x".repeat(1501)}),null);
 assert.equal(validateEnquiry({...base,source:"unknown"}),null);
});
test("metric schema has bounded event classes and routes",()=>{
 assert.deepEqual(validateMetric({page:"/",eventType:"seitenaufruf"}),{page:"/",event:"seitenaufruf"});
 assert.equal(validateMetric({page:"https://evil.example",eventType:"seitenaufruf"}),null);
 assert.equal(validateMetric({page:"/admin/login/",eventType:"seitenaufruf"}),null);
 assert.equal(validateMetric({page:"/",eventType:"produktinteresse"}),null);
 assert.equal(validateMetric({page:"/fotobox/",eventType:"designauswahl"}),null);
});
test("stable capability matrix limits sensitive operations",()=>{
 assert.equal(may("owner","roles","POST"),true);
 assert.equal(may("manager","roles","POST"),false);
 assert.equal(may("viewer","media","POST"),false);
 assert.equal(may("eventmanager","inquiries","PATCH"),true);
 assert.equal(may("analyst","analytics","GET"),true);
 assert.equal(may("analyst","inquiries","GET"),false);
 assert.equal(may("designer","designs","POST"),true);
 assert.equal(may("editor","media","POST"),false);
 assert.equal(mayPublishCms("manager"),true);
 assert.equal(mayPublishCms("editor"),true);
 assert.equal(mayPublishCms("viewer"),false);
});
test("private print assets allow only base managers/owners or active designer scope",()=>{
 assert.equal(mayAccessDesign("owner",null,false),true);
 assert.equal(mayAccessDesign("manager",null,false),true);
 assert.equal(mayAccessDesign("viewer","designer",true),true);
 assert.equal(mayAccessDesign("viewer","designer",false),false);
 assert.equal(mayAccessDesign("viewer","editor",true),false);
 assert.equal(mayAccessDesign("viewer","eventmanager",true),false);
 assert.equal(mayAccessDesign("viewer",null,false),false);
});
test("cross-preview mutations are rejected without leaking data",()=>{
 const a=new Request(host+"/api/fotopolis/studio13/metric",{method:"POST",headers:{Origin:host}});
 const b=new Request(host+"/api/fotopolis/studio13/metric",{method:"POST",headers:{Origin:"https://other.example"}});
 assert.equal(samePreviewOrigin(a),true);
 assert.equal(samePreviewOrigin(b),false);
});
test("non-preview and production endpoints are closed",async()=>{
 const p=await publicHandler(new Request(host+"/api/fotopolis/studio13/content"),live);
 assert.equal(p.status,404);
 const admin=await adminHandler(new Request(host+"/api/fotopolis/studio13/admin/inquiries"),live);
 assert.equal(admin.status,404);
});
test("admin modules reject anonymous before DB",async()=>{
 for(const module of ["inquiries","cms","media","analytics","designs","roles","audit"]){
  const r=await adminHandler(new Request(host+"/api/fotopolis/studio13/admin/"+module),preview);
  assert.equal(r.status,401,module);
 }
});
test("public API rejects forged origin before DB",async()=>{
 const r=await publicHandler(new Request(host+"/api/fotopolis/studio13/metric",{
  method:"POST",headers:{"Content-Type":"application/json",Origin:"https://wrong.example"},
  body:JSON.stringify({page:"/",eventType:"seitenaufruf"})}),preview);
 assert.equal(r.status,403);
});
