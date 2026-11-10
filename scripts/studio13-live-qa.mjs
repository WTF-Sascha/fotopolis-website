#!/usr/bin/env node
/* Studio 13 deployment health smoke: real Netlify preview APIs, no personal data. */
import assert from "node:assert/strict";
const origin=process.env.STUDIO13_TEST_ORIGIN||"https://deploy-preview-19--fotopolis-preview.netlify.app";
const states=[];
async function fetchChecked(path,options){
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),9000);
 try{return await fetch(origin+path,{...options,signal:controller.signal,redirect:"manual"})}
 finally{clearTimeout(timeout)}
}
async function probe(){
 const publicRes=await fetchChecked("/api/fotopolis/studio13/content",{method:"GET",headers:{Accept:"application/json"}});
 assert.equal(publicRes.status,200,"Published CMS endpoint must work on real Netlify");
 const pub=await publicRes.json();
 assert.equal(pub.previewOnly,true);
 assert.ok(typeof pub.content==="object");
 states.push({step:"live public content",status:publicRes.status,withoutPersonalData:true});
 const anonymous=await fetchChecked("/api/fotopolis/studio13/admin/inquiries");
 assert.equal(anonymous.status,401,"Real admin endpoint must reject anonymous requests");
 states.push({step:"real admin JWT gate",status:anonymous.status});
 const invalid=await fetchChecked("/api/fotopolis/studio13/metric",{
  method:"POST",headers:{"Content-Type":"application/json",Origin:origin},
  body:JSON.stringify({page:"/admin/login/",eventType:"seitenaufruf"})
 });
 assert.equal(invalid.status,400,"Invalid path must never enter analytics");
 states.push({step:"metric rejection",status:invalid.status});
 const valid=await fetchChecked("/api/fotopolis/studio13/metric",{
  method:"POST",headers:{"Content-Type":"application/json",Origin:origin},
  body:JSON.stringify({page:"/faq/",eventType:"seitenaufruf"})
 });
 assert.equal(valid.status,202,"Anonymized test event must be accepted on DEV preview");
 states.push({step:"preview-only aggregate event",status:valid.status});
 const customer=await fetchChecked("/api/fotopolis/studio13/enquiry",{
  method:"POST",headers:{"Content-Type":"application/json",Origin:origin},
  body:JSON.stringify({invalid:true})
 });
 assert.equal(customer.status,400,"Invalid customer payload must be rejected without storing PII");
 states.push({step:"invalid inquiry rejection",status:customer.status});
}
let lastError;
for(let n=1;n<=16;n++){
 try{await probe();lastError=null;break;}
 catch(error){lastError=error;if(n===16)break;await new Promise(r=>setTimeout(r,12000));states.length=0;}
}
if(lastError){console.error("STUDIO 13 REAL DEPLOY QA FAILED",String(lastError));process.exitCode=1;}
else console.log("STUDIO 13 REAL NETLIFY API SMOKE PASS",JSON.stringify(states));
