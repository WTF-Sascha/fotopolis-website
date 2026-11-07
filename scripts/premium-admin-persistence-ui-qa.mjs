import {chromium} from "playwright";
import assert from "node:assert/strict";

const base=process.env.SITE_BASE_URL||"http://127.0.0.1:8766/";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
let checks=0;
try{
 for(const width of [375,1440]){
  const ctx=await browser.newContext({viewport:{width,height:900},timezoneId:"Europe/Berlin",locale:"de-DE"});
  const page=await ctx.newPage(),writes=[],errors=[];
  page.on("request",r=>{if(r.method()!=="GET"&&r.url().includes("/api/fotopolis/"))writes.push(r.url())});
  page.on("pageerror",e=>errors.push(e.message));
  page.on("dialog",d=>d.accept());
  await page.route("**/admin/dashboard/dashboard-bundle.js",r=>r.abort());
  await page.goto(new URL("admin/dashboard/",base).href,{waitUntil:"domcontentloaded"});
  await page.evaluate(()=>{document.getElementById("gate").hidden=true;document.getElementById("dashboard-app").hidden=false});
  await page.addScriptTag({type:"module",content:`
    import {setupInventoryManager} from "/admin/dashboard/inventory-manager.js";
    import {setupPlanningManager} from "/admin/dashboard/planning-manager.js";
    import {setupReservationsManager} from "/admin/dashboard/reservations-manager.js";
    const id="cba04f3d-8d22-4c1a-87c5-0d63a5711b72";
    window.qaDevices=[];window.qaBlocks=[];window.qaHolds=[];
    window.qaInventory=setupInventoryManager({
      root:document.querySelector("[data-inventory-manager]"),
      getResources:()=>window.qaDevices,
      canActivate:true,
      createResource:async x=>{
        const r={id,resource_code:x.code,product_type:x.type,display_name:x.name,enabled:false};
        window.qaDevices.push(r);return r;
      },
      updateResource:async x=>{Object.assign(window.qaDevices[0],{...("name" in x?{display_name:x.name}:{}),...("enabled" in x?{enabled:x.enabled}:{})});return window.qaDevices[0]}
    });
    window.qaPlanner=setupPlanningManager({
      root:document.querySelector("[data-planning-manager]"),
      getResources:()=>window.qaDevices,getInventoryDrafts:()=>[],getAllocations:()=>window.qaBlocks,
      createBlock:async x=>{
        window.qaBlocks.push({id:"bc204f3d-8d22-4c1a-87c5-0d63a5711b71",resource_id:x.resourceId,
          allocation_kind:x.kind,allocation_state:"blocked",
          occupied_from:x.startUtc,occupied_until:x.endUtc,event_start_at:x.startUtc,event_end_at:x.endUtc});
      },
      cancelBlock:async id=>{window.qaBlocks[0].allocation_state="cancelled"}
    });
    window.qaReservations=setupReservationsManager({
      root:document.querySelector("[data-reservations-manager]"),
      getResources:()=>window.qaDevices,getAllocations:()=>window.qaHolds,
      createHold:async x=>{
        window.qaHolds.push({id:"ac204f3d-8d22-4c1a-87c5-0d63a5711b70",
          resource_id:x.resourceId,allocation_kind:"booking",allocation_state:"held",
          event_start_at:x.eventStartUtc,event_end_at:x.eventEndUtc,
          occupied_from:x.occupiedFromUtc,occupied_until:x.occupiedUntilUtc});
      },
      changeHold:async(id,action)=>{window.qaHolds[0].allocation_state=action==="confirm"?"confirmed":"cancelled"}
    });
  `});
  await page.locator(".inventory-manager-primary").first().waitFor({state:"visible"});
  await page.locator(".inventory-manager-primary").first().click();
  await page.locator("#inventory-code").fill("BOX-001");
  await page.locator("#inventory-name").fill("Fotobox Premium");
  await page.locator('.inventory-manager-form button[type="submit"]').click();
  await page.waitForFunction(()=>window.qaDevices?.length===1);
  assert.equal(await page.evaluate(()=>window.qaDevices[0].enabled),false);checks++;
  await page.evaluate(()=>window.qaInventory.editSaved(window.qaDevices[0]));
  await page.locator(".inventory-manager-toggle-label input").check();
  await page.locator(".inventory-manager-saved-editor button[type=submit]").click();
  await page.waitForFunction(()=>window.qaDevices[0].enabled===true);
  checks++;
  await page.evaluate(()=>window.qaPlanner.refresh());
  await page.locator("#planning .plan-header button").click();
  await page.locator("#block-resource").selectOption("real:cba04f3d-8d22-4c1a-87c5-0d63a5711b72");
  await page.locator("#block-start").fill("2026-12-02T12:00");
  await page.locator("#block-end").fill("2026-12-02T13:00");
  await page.locator("#planning .plan-form button[type=submit]").click();
  await page.waitForFunction(()=>window.qaBlocks.length===1);checks++;
  await page.evaluate(()=>window.qaPlanner.refresh());
  assert.match(await page.locator("#planning .plan-list").first().innerText(),/Gespeicherte Sperrzeiten/);checks++;
  await page.locator("#bookings > #reservations-manager > button.plan-primary").click();
  await page.locator("#booking-device").selectOption("cba04f3d-8d22-4c1a-87c5-0d63a5711b72");
  await page.locator("#booking-start").fill("2026-12-03T12:00");
  await page.locator("#booking-end").fill("2026-12-03T14:00");
  await page.locator("#booking-before").fill("30");
  await page.locator("#booking-after").fill("60");
  await page.locator("#bookings .plan-form button[type=submit]").click();
  await page.waitForFunction(()=>window.qaHolds.length===1);checks++;
  await page.evaluate(()=>window.qaReservations.refresh());
  await page.locator("#bookings .reservation-entry .plan-primary").click();
  await page.waitForFunction(()=>window.qaHolds[0].allocation_state==="confirmed");checks++;
  assert.deepEqual(writes,[]);checks++;
  assert.deepEqual(errors,[]);checks++;
  await ctx.close();
 }
 console.log("STUDIO 4.0 PERSISTENCE UI CONTRACT SUCCESS – "+checks+" checks across mobile and desktop, mock callbacks and zero real mutations.");
}finally{await browser.close()}
