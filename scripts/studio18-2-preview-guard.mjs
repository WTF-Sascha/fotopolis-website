#!/usr/bin/env node
/**
 * FOTOPOLIS Studio 18.2 — deployment-context interlock.
 * Only isolated Netlify previews are authorized to build this branch.
 * A local checkout without Netlify runtime may build offline for QA.
 */
const context=(process.env.CONTEXT||"").trim();
const isNetlify=process.env.NETLIFY==="true" || !!process.env.DEPLOY_ID || !!context;
const allowed=new Set(["deploy-preview","branch-deploy"]);
const expectedSite="653f790e-5476-4349-84d9-012adbeeb489";
const site=process.env.SITE_ID || process.env.NETLIFY_SITE_ID || "";
const fail=reason=>{
  console.error("FOTOPOLIS RELEASE NO-GO: "+reason);
  process.exit(1);
};
if(isNetlify){
  if(!allowed.has(context))fail("Netlify context "+JSON.stringify(context)+" is not an isolated preview");
  if(site && site!==expectedSite)fail("Unexpected Netlify site ID");
  console.log("FOTOPOLIS PREVIEW ONLY: "+context+"; no production release authorized");
}else{
  console.log("FOTOPOLIS LOCAL QA ONLY: no deployment context detected");
}
