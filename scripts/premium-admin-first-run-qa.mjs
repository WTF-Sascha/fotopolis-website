import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdirSync} from "node:fs";

const base=process.env.SITE_BASE_URL||"http://127.0.0.1:8766/";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
let checks=0;
try{
 for(const width of [320,375,430,768,1440]){
  const ctx=await browser.newContext({viewport:{width,height:900},locale:"de-DE"});
  const page=await ctx.newPage(),written=[],errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  page.on("request",req=>{if(req.url().includes("/api/fotopolis/")&&req.method()!=="GET")written.push(req.url())});
  await page.route("**/admin/dashboard/dashboard-bundle.js",route=>route.abort());
  await page.goto(new URL("admin/dashboard/",base).href,{waitUntil:"domcontentloaded"});
  await page.evaluate(()=>{document.getElementById("gate").hidden=true;document.getElementById("dashboard-app").hidden=false});
  await page.addScriptTag({type:"module",content:`
    import {setupFirstRun} from "/admin/dashboard/first-run.js";
    window.qaState={role:"owner",loaded:true,resources:[],allocations:[],health:null};
    window.qaFirstRun=setupFirstRun({
      root:document.querySelector("#setup-assistant"),
      onHealthCheck:async()=>({previewOnly:true,services:{
        inventory:{connected:true,permissionsReady:true},
        blocks:{connected:true,permissionsReady:true},
        reservations:{connected:true,permissionsReady:true},
        calendar:{connected:true,permissionsReady:true}
      }})
    });
    window.qaFirstRun.refresh(window.qaState);
  `});
  await page.locator("#setup-assistant").waitFor({state:"visible"});
  assert.match(await page.locator("[data-setup-progress]").innerText(),/1 von 5/);checks++;
  assert.equal(await page.locator(".setup-step[data-complete=true]").count(),1);checks++;
  const next=page.locator("[data-setup-next]");
  assert.equal(await next.isVisible(),false);checks++;
  await page.locator("[data-setup-health-check]").click();
  await page.waitForFunction(()=>document.querySelector("[data-setup-progress]")?.textContent?.includes("2 von 5"));
  assert.equal(await page.locator(".setup-step[data-complete=true]").count(),2);checks++;
  await page.evaluate(()=>{
    window.qaFirstRun.refresh({resources:[{
      id:"00000000-0000-4000-8000-000000000001",resource_code:"BOX-01",
      product_type:"fotobox",display_name:"Echtes Gerät",enabled:false
    }]});
  });
  assert.match(await page.locator("[data-setup-progress]").innerText(),/3 von 5/);checks++;
  assert.match(await next.innerText(),/Gerät aktivieren/);checks++;
  await page.evaluate(()=>window.qaFirstRun.refresh({resources:[{
    id:"00000000-0000-4000-8000-000000000001",resource_code:"BOX-01",
    product_type:"fotobox",display_name:"Echtes Gerät",enabled:true
  }]}));
  assert.match(await page.locator("[data-setup-progress]").innerText(),/4 von 5/);checks++;
  await page.evaluate(()=>window.qaFirstRun.refresh({allocations:[{
    id:"00000000-0000-4000-8000-000000000111",allocation_kind:"booking",allocation_state:"held",
    resource_id:"00000000-0000-4000-8000-000000000001"
  }]}));
  assert.match(await page.locator("[data-setup-progress]").innerText(),/5 von 5/);checks++;
  assert.equal(await page.locator("#setup-assistant.is-complete").count(),1);checks++;
  const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth}));
  assert.ok(dimensions.scroll<=dimensions.inner+2,"Viewport overflow at "+width);checks++;
  assert.deepEqual(written,[]);checks++;
  assert.deepEqual(errors,[]);checks++;
  if([320,430,1440].includes(width)){
    mkdirSync("concepts/premium-v2/qa-screenshots/admin-studio",{recursive:true});
    await page.locator("#setup-assistant").screenshot({path:"concepts/premium-v2/qa-screenshots/admin-studio/first-run-"+width+".png"});
  }
  await page.evaluate(()=>window.qaFirstRun.refresh({role:"viewer"}));
  assert.equal(await page.locator("#setup-assistant").isVisible(),false);checks++;
  await ctx.close();
 }
 console.log("STUDIO 4.3 FIRST-RUN QA SUCCESS – "+checks+" checks, 5 viewport widths, mocked data only, zero writes.");
}finally{await browser.close()}
