// FOTOPOLIS presentation gate: /admin/ must lead to secure sign-in only.
import {chromium} from "playwright";
import {readFileSync,mkdirSync} from "node:fs";
import path from "node:path";
const base=process.env.SITE_BASE_URL||"http://127.0.0.1:8766/";
const dest="concepts/premium-v2/qa-screenshots/admin-studio";
mkdirSync(dest,{recursive:true});
const html=readFileSync("preview-build/admin/index.html","utf8");
if(!html.includes('url=/admin/login/'))throw Error("Legacy admin route must direct to real login");
if(/data-block-dialog|STUDIO REVIEW|DEMO-SPERRZEIT/i.test(html))throw Error("Old admin demo unexpectedly published");
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
let checks=0;
try{
 for(const width of [320,375,430,768,1024,1440,1920]){
   const context=await browser.newContext({viewport:{width,height:870},locale:"de-DE"});
   const page=await context.newPage();
   const errors=[],writes=[];
   page.on("pageerror",e=>errors.push(e.message));
   page.on("request",r=>{if(r.url().includes("/api/fotopolis/admin/")&&r.method()!=="GET")writes.push(r.url())});
   await page.route("**/*.neonauth.*",r=>r.fulfill({status:200,contentType:"application/json",
     headers:{"access-control-allow-origin":"*"},body:'{"session":null,"user":null}'}));
   await page.goto(new URL("admin/",base).href,{waitUntil:"domcontentloaded"});
   await page.waitForURL("**/admin/login/",{timeout:10000});
   if(!(await page.title()).includes("FOTOPOLIS"))throw Error("Missing branded login title at "+width);checks++;
   if(await page.locator("form#auth-form").count()!==1)throw Error("Protected login form missing "+width);checks++;
   if(await page.locator('[data-demo-count],[data-block-dialog]').count())throw Error("Legacy demo still exposed "+width);checks++;
   if(await page.locator('meta[name="robots"][content*="noindex"]').count()!==1)throw Error("Indexing not disabled "+width);checks++;
   const dims=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
   if(dims.scroll>dims.width+2)throw Error("Horizontal overflow "+width);checks++;
   if(errors.length||writes.length)throw Error("Unexpected browser requests or errors "+width);checks++;
   if([320,1440].includes(width))await page.screenshot({path:path.join(dest,"presentation-login-"+width+".png"),fullPage:true});
   await context.close();
 }
 console.log("PRESENTATION ADMIN ROUTING QA PASS – "+checks+" checks, secure login only, zero writes.");
}finally{await browser.close()}
