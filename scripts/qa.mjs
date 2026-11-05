#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = path.join(root, "site");
const premium = process.argv.includes("--premium");
const failures = [];
const warnings = [];
const success = [];
const pages = [
  "index.html", "fotobox/index.html", "fotospiegel/index.html",
  "fotowohnwagen/index.html", "anlaesse/index.html", "leistungen/index.html",
  "faq/index.html", "ueber/index.html", "kontakt/index.html", "rechtliches/index.html"
];
const fail = (label) => failures.push(label);
const pass = (label) => success.push(label);
const warn = (label) => warnings.push(label);
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const exists = (p) => fs.existsSync(path.join(root, p));
function check(ok, label) { if(ok) pass(label); else fail(label); }
function imageDims(filepath) {
  const buf=fs.readFileSync(filepath);
  if(buf.subarray(0,8).toString("hex") !== "89504e470d0a1a0a") return null;
  return [buf.readUInt32BE(16),buf.readUInt32BE(20)];
}
let source = {};
for(const page of pages){
  const relative="site/"+page;
  if(!exists(relative)){fail("Fehlende Seite: "+relative);continue;}
  const html=read(relative);
  source[page]=html;
  check((html.match(/<h1\b/gi)||[]).length===1,"Eine H1: "+page);
  check(html.includes('<main id="main">') && html.includes("</main>"),"Main-Landmark: "+page);
  check(html.includes('class="skip-link"'),"Tastatur-Skip-Link: "+page);
  check(html.includes('src="/assets/fotopolis-logo-original.png"'),"Freigegebenes Logo eingebunden: "+page);
  check(html.includes('name="robots" content="noindex,nofollow"'),"Entwicklungsvorschau noindex: "+page);
  for(const m of html.matchAll(/(?:href|src)="(\/[^"]+)"/g)){
    const link=m[1].split(/[?#]/)[0];
    if(link==="/") continue;
    if(link.endsWith("/")){
      if(!exists("site"+link+"index.html"))fail(page+" -> fehlende Zielseite "+link);
    }else if(!exists("site"+link)){
      fail(page+" -> fehlende Datei "+link);
    }
  }
}
const expectedLogo="bc81e4d766d13ea08b62843b928b023b992ddfb8";
const logo="site/assets/fotopolis-logo-original.png";
if(exists(logo)){
  const buf=fs.readFileSync(path.join(root,logo));
  const gitHash=createHash("sha1").update("blob "+buf.length+"\0").update(buf).digest("hex");
  check(gitHash===expectedLogo,"Original-Logo unverändert (Git-Blob-SHA)");
}else fail("Freigegebenes Original-Logo fehlt");
const manifestPath="site/manifest.webmanifest";
if(exists(manifestPath)){
  try{
    const man=JSON.parse(read(manifestPath));
    check(man.display==="standalone","PWA standalone");
    check(typeof man.start_url==="string","PWA Start-URL");
    for(const icon of man.icons||[]){
      const rel="site"+icon.src;
      if(!exists(rel)){fail("PWA-Icon fehlt: "+icon.src);continue;}
      const dims=imageDims(path.join(root,rel));
      check(!!dims&&dims.join("x")===icon.sizes,"PWA-Icon-Maße: "+icon.src);
    }
  }catch(e){fail("Manifest ungültig: "+e.message)}
}else fail("Manifest fehlt");
for(const item of ["site/service-worker.js","site/assets/site.js","site/assets/styles.css","netlify.toml"]){
  check(exists(item),"Technische Datei vorhanden: "+item);
}
const allPages=Object.values(source);
const nonLogoImages=allPages.reduce((sum,html)=>sum+[...html.matchAll(/<img\b[^>]*src="([^"]+)"/g)].filter(m=>!m[1].includes("fotopolis-logo-original.png")).length,0);
if(nonLogoImages===0){
  const label="Keine echten Produkt-/Eventfotos: 0 Nicht-Logo-Bilder auf "+allPages.length+" Seiten";
  if(premium) fail(label); else warn(label);
}
const photoPages=["index.html","fotobox/index.html","fotospiegel/index.html","fotowohnwagen/index.html"];
for(const page of photoPages){
  if(!source[page])continue;
  const hasPhotos=[...source[page].matchAll(/<img\b[^>]*src="([^"]+)"/g)].some(m=>!m[1].includes("fotopolis-logo-original.png"));
  if(!hasPhotos&&premium) fail("Premium: echte Fotodarstellung fehlt: "+page);
}
if(!exists("site/galerie/index.html")){
  if(premium)fail("Premium: authentische Galerie fehlt");else warn("Authentische Galerie fehlt");
}
if(source["kontakt/index.html"]?.includes("data-enquiry-form")&&read("site/assets/site.js").includes("mailto:")){
  if(premium)fail("Premium: Kontaktprozess basiert nur auf mailto");else warn("Kontakt noch nur per mailto");
}
const css=exists("site/assets/styles.css")?read("site/assets/styles.css"):"";
if(!css.includes("@font-face")){
  if(premium)fail("Premium: Manrope/Inter nicht als Webfonts eingebunden");else warn("Manrope/Inter nicht explizit geladen");
}
if(source["rechtliches/index.html"]?.includes("noch in Vorbereitung")||source["rechtliches/index.html"]?.includes("werden ergänzt")){
  if(premium)fail("Premium: rechtliche Seiten noch nicht freigabefähig");else warn("Rechtliche Seiten nicht final");
}
const summary={mode:premium?"premium":"technical",passed:success.length,failed:failures.length,warnings:warnings.length,status:failures.length?"FAIL":"PASS"};
console.log("FOTOPOLIS QA\n"+JSON.stringify(summary,null,2));
for(const s of failures)console.error("FAIL",s);
for(const s of warnings)console.warn("WARN",s);
if(failures.length)process.exitCode=1;
