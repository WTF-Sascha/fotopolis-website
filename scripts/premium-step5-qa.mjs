import {chromium} from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const base=process.env.SITE_BASE_URL||"http://127.0.0.1:8766/";
const widths=[320,375,430,768,1100,1440,1920];
const screenshots=new Set([320,768,1440]);
const out="concepts/premium-v2/qa-screenshots/contact-review";
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const results=[],saved=[];
function check(name,condition,detail=""){
  const pass=!!condition;results.push({name,pass,detail});
  if(!pass)console.error("STEP5_FAIL",name,detail);
}
for(const width of widths){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:"reduce"});
  const errors=[],networkWrites=[];
  page.on("pageerror",error=>errors.push(error.message));
  page.on("request",request=>{
    if(!["GET","HEAD"].includes(request.method()))networkWrites.push(request.method()+" "+request.url());
  });
  const response=await page.goto(new URL("kontakt/",base).toString(),{waitUntil:"networkidle",timeout:40000});
  const prefix=width+"px";
  const data=await page.evaluate(()=>{
    const form=document.querySelector("[data-contact-flow]");
    const recap=document.querySelector(".contact-recap");
    const fields=[...form.querySelectorAll("input:not([type=checkbox]),select,textarea")];
    const invalid=fields.filter(el=>el.required&&!el.checkValidity());
    return{
      h1:document.querySelectorAll("main h1").length,
      form:!!form, formAction:form.getAttribute("action"),
      recap:!!recap, overflow:document.documentElement.scrollWidth>innerWidth+2,
      badImages:[...document.images].filter(i=>!i.naturalWidth).map(x=>x.getAttribute("src")),
      clipped:[...document.querySelectorAll("h1,h2,h3")].filter(el=>el.scrollHeight>el.clientHeight+3).map(el=>el.textContent.trim().slice(0,50)),
      required:invalid.map(el=>el.name).sort(),
      totalFields:fields.length,
      wishes:document.querySelectorAll('.contact-wishes input[type="checkbox"]').length,
      script:!!document.querySelector('script[src="/contact-flow.js"]'),
      email:document.querySelector("[data-contact-email]")?.getAttribute("href"),
      summary:document.querySelector("[data-contact-summary]")?.textContent,
      passive:!document.querySelector("[data-contact-flow] button[type=submit]"),
      noindex:document.querySelector('meta[name=robots]')?.content.includes("noindex")
    };
  });
  check(prefix+" HTTP",response.status()===200);
  check(prefix+" page shell",data.h1===1&&data.form&&data.recap&&data.script);
  check(prefix+" form only local",data.formAction===null&&data.passive&&data.noindex);
  check(prefix+" content grid",data.totalFields>=9&&data.wishes===6);
  check(prefix+" required fields",JSON.stringify(data.required)===JSON.stringify(["anlass","email","name"]));
  check(prefix+" initial preview",data.summary.includes("keine Reservierung")||data.summary.includes("keine Reservierung".toLowerCase())||data.summary.includes("Buchung: keine Reservierung"));
  check(prefix+" no overflow / image errors",!data.overflow&&!data.badImages.length,JSON.stringify(data));
  check(prefix+" headings not clipped",data.clipped.length===0,data.clipped.join(";"));
  // If information is missing, no email client may be opened.
  await page.locator("[data-contact-email]").click();
  check(prefix+" missing fields blocked",(await page.locator("[data-contact-status]").textContent()).includes("Pflichtfeld")||(await page.locator("[data-contact-status]").textContent()).includes("Bitte fülle"));
  check(prefix+" remains on contact page",new URL(page.url()).pathname==="/kontakt/");
  await page.locator('select[name="anlass"]').selectOption("Hochzeit");
  await page.locator('select[name="produkt"]').selectOption("Fotospiegel");
  await page.locator('input[name="datum"]').fill("2027-08-14");
  await page.locator('select[name="tageszeit"]').selectOption("Abend");
  await page.locator('input[name="ort"]').fill("Ahlen");
  await page.locator('input[name="gaeste"]').fill("120");
  await page.locator('input[name="name"]').fill("Beispiel Gast");
  await page.locator('input[name="email"]').fill("gast@example.com");
  await page.locator('input[name="telefon"]').fill("012345678");
  await page.locator('input[name="wunsch"][value="Individuelles Fotolayout"]').check();
  await page.locator('textarea[name="details"]').fill("Bitte die Aufbauzeit vorher abstimmen.");
  check(prefix+" valid fields",await page.locator("[data-contact-flow]").evaluate(x=>x.checkValidity()));
  const summary=await page.locator("[data-contact-summary]").textContent();
  const mandatory=["Hochzeit","Fotospiegel","2027-08-14","Abend","Ahlen","120","Beispiel Gast","gast@example.com","Individuelles Fotolayout","Aufbauzeit"];
  check(prefix+" preview updates",mandatory.every(x=>summary.includes(x)),summary);
  const href=await page.locator("[data-contact-email]").getAttribute("href");
  check(prefix+" no automatic submission",href.startsWith("mailto:kontakt@fotopolis-mieten.de?"));
  const decoded=decodeURIComponent(href);
  check(prefix+" complete email",mandatory.every(x=>decoded.includes(x)),decoded.slice(0,500));
  check(prefix+" not a reservation",decoded.includes("keine Buchung oder Reservierung"));
  check(prefix+" zero network writes",networkWrites.length===0,networkWrites.join(";"));
  check(prefix+" zero JavaScript errors",errors.length===0,errors.join(";"));
  if(screenshots.has(width)){
    await page.evaluate(async()=>{
      for(const img of document.images)img.loading="eager";
      await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));
      if(document.activeElement instanceof HTMLElement)document.activeElement.blur();
      window.scrollTo(0,0);
    });
    await page.waitForFunction(()=>window.scrollY===0);
    const file="kontakt-"+width+".png";
    await page.screenshot({path:path.join(out,file),fullPage:true,animations:"disabled"});
    saved.push(file);
  }
  // URL pre-selection: product pages can hand off product interest without cookies.
  await page.goto(new URL("kontakt/?produkt=Fotowohnwagen",base),{waitUntil:"networkidle"});
  check(prefix+" query preselection",await page.locator('select[name="produkt"]').inputValue()==="Fotowohnwagen");
  await page.close();
}
await browser.close();
const failed=results.filter(x=>!x.pass);
await fs.writeFile(path.join(out,"report.json"),JSON.stringify({total:results.length,passed:results.length-failed.length,failed:failed.length,failures:failed,screenshots:saved},null,2));
console.log("STEP5_QA",JSON.stringify({total:results.length,passed:results.length-failed.length,failed:failed.length,screenshots:saved.length}));
if(failed.length)process.exitCode=1;
