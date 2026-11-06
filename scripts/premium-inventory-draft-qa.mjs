import {chromium} from "playwright";
import assert from "node:assert/strict";
import {mkdirSync} from "node:fs";
import {validateInventoryDraft} from "../concepts/premium-v2/admin/dashboard/inventory-manager.js";

const base=process.env.SITE_BASE_URL||"http://127.0.0.1:8766/";
assert.ok(validateInventoryDraft({type:"fotobox",code:"BOX-001",name:"Fotobox Event"}).value);
assert.ok(validateInventoryDraft({type:"fotospiegel",code:"MIRROR-001",name:"Spiegel"}).value);
assert.ok(validateInventoryDraft({type:"fotowohnwagen",code:"CAMPER-001",name:"Wohnwagen"}).value);
assert.match(validateInventoryDraft({type:"fotobox",code:"!invalid",name:"Test"}).error,/Gerätekennung/);
assert.match(validateInventoryDraft({type:"fotobox",code:"box-001",name:"Name"},[{resource_code:"BOX-001"}]).error,/bereits/);
assert.match(validateInventoryDraft({type:"unknown",code:"BOX-002",name:"Name"}).error,/Produktart/);

const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
let completed=0;
try{
 for(const width of [320,375,430,768,1440]){
  const context=await browser.newContext({viewport:{width,height:920},locale:"de-DE"});
  const page=await context.newPage(),written=[];
  page.on("request",request=>{
   if(request.method()!=="GET"&&request.url().includes("/api/fotopolis/"))written.push(request.url());
  });
  await page.route("**/admin/dashboard/dashboard-bundle.js",route=>
    route.fulfill({status:200,contentType:"text/javascript",body:"// QA: do not initialize live auth"}));
  const visit=async()=>{
   await page.goto(new URL("admin/dashboard/",base).href,{waitUntil:"domcontentloaded"});
   await page.evaluate(()=>{
     document.getElementById("gate").hidden=true;
     document.getElementById("dashboard-app").hidden=false;
   });
   await page.addScriptTag({type:"module",content:`
     import {setupInventoryManager} from "/admin/dashboard/inventory-manager.js";
     window.__qaInventory=setupInventoryManager({
       root:document.querySelector("[data-inventory-manager]"),
       getResources:()=>[{resource_code:"BOX-EXIST",product_type:"fotobox",display_name:"Known device"}]
     });
   `});
   await page.locator(".inventory-manager-primary").first().waitFor({state:"visible"});
  };
  await visit();
  assert.equal(await page.locator(".inventory-manager-draft").count(),0);
  await page.locator(".inventory-manager-primary").first().click();
  await page.locator("#inventory-code").fill("!");
  await page.locator("#inventory-name").fill("Fotobox Preview");
  await page.locator('.inventory-manager-form button[type="submit"]').click();
  assert.match(await page.locator(".inventory-manager-feedback").innerText(),/Gerätekennung/);completed++;
  await page.locator("#inventory-code").fill("BOX-EXIST");
  await page.locator('.inventory-manager-form button[type="submit"]').click();
  assert.match(await page.locator(".inventory-manager-feedback").innerText(),/bereits/);completed++;
  await page.locator("#inventory-code").fill("BOX-001");
  await page.locator('.inventory-manager-form button[type="submit"]').click();
  assert.equal(await page.locator(".inventory-manager-draft").count(),1);completed++;
  assert.match(await page.locator(".inventory-manager-draft").innerText(),/Nicht|Nur Vorschau/i);completed++;
  if([320,430,1440].includes(width)){
    mkdirSync("concepts/premium-v2/qa-screenshots/admin-studio",{recursive:true});
    await page.locator("#inventory").screenshot({path:"concepts/premium-v2/qa-screenshots/admin-studio/inventory-preview-"+width+".png"});
  }
  const docWidth=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth}));
  assert.ok(docWidth.scroll<=docWidth.inner+2,"Viewport overflow "+width);completed++;
  await page.reload({waitUntil:"domcontentloaded"});
  // No stored draft is resurrected after reload.
  await page.evaluate(()=>{
    document.getElementById("gate").hidden=true;
    document.getElementById("dashboard-app").hidden=false;
  });
  await page.addScriptTag({type:"module",content:`
    import {setupInventoryManager} from "/admin/dashboard/inventory-manager.js";
    window.__qaInventory=setupInventoryManager({root:document.querySelector("[data-inventory-manager]"),getResources:()=>[]});
  `});
  await page.locator(".inventory-manager-primary").first().waitFor({state:"visible"});
  assert.equal(await page.locator(".inventory-manager-draft").count(),0);completed++;
  assert.deepEqual(written,[]);completed++;
  await context.close();
 }
 console.log("FOTOPOLIS INVENTORY DRAFT QA SUCCESS: "+completed+" checks across 5 screen widths, zero database writes.");
}finally{await browser.close()}
