import {chromium} from "playwright";
import assert from "node:assert/strict";

const base=process.env.SITE_BASE_URL||"http://127.0.0.1:8766/";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const page=await browser.newPage({viewport:{width:430,height:900}});
const visited=[];
try{
  await page.route("**/*.neonauth.*",async route=>{
    const req=route.request();
    const path=new URL(req.url()).pathname;
    visited.push({path,method:req.method()});
    const origin="http://127.0.0.1:8766";
    const headers={"access-control-allow-origin":origin,"access-control-allow-credentials":"true","access-control-allow-headers":"content-type,x-neon-auth-proxy,authorization","access-control-allow-methods":"POST,GET,OPTIONS"};
    if(req.method()==="OPTIONS")return route.fulfill({status:204,headers});
    if(/get-session/.test(path))return route.fulfill({status:200,contentType:"application/json",headers,body:'{"session":null,"user":null}'});
    if(/email-otp\/(passcode)/.test(path))return route.fulfill({status:404,contentType:"application/json",headers,body:'{"error":"Not found"}'});
    return route.fulfill({status:200,contentType:"application/json",headers,body:'{"success":true}'});
  });
  await page.goto(new URL("admin/login/?mode=reset",base).href,{waitUntil:"domcontentloaded"});
  await page.locator("#email").fill("demo@example.invalid");
  await page.locator("#new-password").fill("This-is-a-preview-test-password-42!");
  await page.locator("#confirm-password").fill("This-is-a-preview-test-password-42!");
  await page.locator("#send-code").click();
  await page.waitForTimeout(650);
  assert.equal(await page.locator("#otp-fields").isVisible(),true,"Reset OTP can be requested");
  await page.locator("#otp").fill("123456");
  await page.locator("#submit").click();
  await page.waitForTimeout(650);
  const sent=visited.filter(r=>r.method==="POST").map(r=>r.path);
  assert.ok(sent.some(p=>p.includes("email-otp")||p.includes("forget")), "Neon Auth reset-OTP request dispatched");
  // SDK reset routes have changed in past releases; never report a password
  // as saved if the verified remote endpoint rejects it.
  const success=(await page.locator("#status").innerText()).includes("gespeichert");
  console.log("FOTOPOLIS password reset contract:",JSON.stringify({sentPaths:sent.map(x=>x.replace(/.*\/auth\//,"/auth/")),uiSuccess:success}));
  if(!success)throw Error("Password setup did not reach successful state in mocked Neon browser flow");
  console.log("FOTOPOLIS PASSWORD RESET CONTRACT QA SUCCESS");
}finally{await browser.close()}
