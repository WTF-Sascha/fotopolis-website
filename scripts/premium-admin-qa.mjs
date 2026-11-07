// FOTOPOLIS Step 7 – only QA of the public, non-persistent Admin Studio demo.
// The test must NEVER use a connection string or create any real DB records.
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";

const base = process.env.SITE_BASE_URL || "http://127.0.0.1:8766/";
const output = "concepts/premium-v2/qa-screenshots/admin-studio";
mkdirSync(output, { recursive: true });
const browser=await chromium.launch({ headless:true, args:["--no-sandbox"] });
let checks=0;const assert=(condition,message)=>{if(!condition)throw Error(message);checks++};
try{
  for(const width of [320,375,430,768,1024,1440,1920]){
    const context=await browser.newContext({viewport:{width,height:870},deviceScaleFactor:1,locale:"de-DE",timezoneId:"Europe/Berlin"});
    const page=await context.newPage();
    const failures=[],requests=[];
    page.on("pageerror",e=>failures.push(e.message));
    page.on("request",r=>{if(/neon\.tech|supabase\.co|\/api\/|\.netlify\/functions\//i.test(r.url()))requests.push(r.url())});
    await page.goto(new URL("admin/",base).href,{waitUntil:"networkidle"});
    assert((await page.title()).includes("Admin-Kalender"),"Admin Studio title "+width);
    assert(await page.locator('meta[name="robots"][content*="noindex"]').count()===1,"Noindex admin "+width);
    assert(await page.locator("[data-calendar-grid] .day").count()>=7,"Day grid visible "+width);
    assert(await page.locator("[data-demo-count]").innerText()==="0","Zero demo entries initial "+width);
    assert((await page.locator("body").innerText()).includes("keine echten Buchungen"),"Demo banner "+width);
    assert(await page.locator("main h1").count()===1,"Single h1 "+width);
    const overflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:window.innerWidth}));
    assert(overflow.scroll<=overflow.viewport+2,"Horizontal document overflow "+width+": "+JSON.stringify(overflow));
    assert(failures.length===0,"Browser errors "+width+": "+failures.join(";"));
    assert(requests.length===0,"Forbidden API/network request "+width+": "+requests.join(";"));
    // Verify view toggle, navigation, resource filters and keyboard-safe selection.
    const month=await page.locator("[data-period]").innerText();
    await page.locator('[data-view="week"]').click();
    assert((await page.locator("[data-calendar-grid] .day").count())===7,"Week shows exactly 7 days "+width);
    assert(await page.locator('[data-view="week"]').getAttribute("aria-pressed")==="true","Week pressed "+width);
    await page.locator('[data-nav="next"]').click();
    const next=await page.locator("[data-period]").innerText();
    assert(next!==month,"Navigation changes period "+width);
    await page.locator('[data-view="month"]').click();
    assert((await page.locator("[data-calendar-grid] .day").count())>=28,"Month shows grid "+width);
    await page.locator('[data-product-filter]').selectOption("fotospiegel");
    assert(await page.locator('[data-product-filter]').inputValue()==="fotospiegel","Filter selectable "+width);
    // Create synthetic browser-only demo block, verify day details, remove it.
    await page.locator(".intro-action [data-open-block]").click();
    assert(await page.locator("[data-block-dialog]").evaluate(el=>el.open),"Dialog opens "+width);
    await page.locator('[data-block-form] [name="day"]').fill("2027-06-14");
    await page.locator('[data-block-form] [name="note"]').fill("Test-Wartung – rein lokal");
    await page.locator('[data-block-form] [name="resource"]').selectOption("fotospiegel");
    await page.locator('[data-block-form] button[type="submit"]').click();
    assert(await page.locator("[data-demo-count]").innerText()==="1","Demo block created "+width);
    assert((await page.locator("[data-day-details]").innerText()).includes("Test-Wartung"),"Day details update "+width);
    await page.locator(".detail-list button").click();
    assert(await page.locator("[data-demo-count]").innerText()==="0","Demo block removable "+width);
    // Reload must erase in-memory data; nothing gets persisted to Neon.
    await page.locator(".intro-action [data-open-block]").click();
    await page.locator('[data-block-form] [name="day"]').fill("2027-06-14");
    await page.locator('[data-block-form] [name="note"]').fill("Session only");
    await page.locator('[data-block-form] button[type="submit"]').click();
    assert(await page.locator("[data-demo-count]").innerText()==="1","Second demo block "+width);
    await page.reload({waitUntil:"networkidle"});
    assert(await page.locator("[data-demo-count]").innerText()==="0","No persistence after reload "+width);
    assert(requests.length===0,"No backend calls even after interactions "+width);
    assert(failures.length===0,"No JS errors after interactions "+width);
    if(width<=430){
      const calendarWidth=await page.locator("[data-calendar-grid]").evaluate(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,viewport:window.innerWidth}));
      assert(calendarWidth.left>=-1 && calendarWidth.right<=calendarWidth.viewport+1,"Mobile must show all 7 days without horizontal swipe "+width+": "+JSON.stringify(calendarWidth));
      const toggle=page.locator("[data-menu-toggle]");
      await toggle.click();
      assert(await toggle.getAttribute("aria-expanded")==="true","Mobile menu opens "+width);
      assert(await page.locator("#admin-mobile-menu").isVisible(),"Mobile menu visible "+width);
      await toggle.click();
      assert(await toggle.getAttribute("aria-expanded")==="false","Mobile menu closes "+width);
    }
    if([320,375,768,1440].includes(width)){
      await page.locator('[data-view="month"]').click();
      await page.screenshot({path:path.join(output,"admin-"+width+".png"),fullPage:true});
    }
    await context.close();
  }
  const js=readFileSync("preview-build/admin/admin.js","utf8");
  const html=readFileSync("preview-build/admin/index.html","utf8");
  for(const pattern of [/fetch\s*\(/i,/localStorage/i,/sessionStorage/i,/service_role/i,/database_url/i,/neon\.tech/i,/supabase\.co/i]){
    assert(!pattern.test(js), "Forbidden API/secret in demo JS: "+pattern);
    assert(!pattern.test(html), "Forbidden API/secret in demo HTML: "+pattern);
  }
  console.log("FOTOPOLIS Step 7 Admin Studio QA SUCCESS – "+checks+" checks across 7 widths. Browser-only demo; zero network bookings.");
}finally{await browser.close()}
