import {readFileSync,existsSync} from "node:fs";
import assert from "node:assert/strict";
import path from "node:path";
/* Inspect user-visible text in the exact generated staging build.
   Keep robots noindex, image rights, login and the real enquiry behavior. */
const root="preview-build";
const routes=["","fotobox","fotospiegel","fotowohnwagen","pakete","galerie","anlaesse","ueber-uns","faq","kontakt","impressum","datenschutz"];
const forbidden=[
  /bisherig(?:e|en|er|es)?\s+(?:website|webseite|auftritt|produktbeschreibung)/i,
  /früher(?:e|en|er)?\s+(?:website|webseite|auftritt|produktbeschreibung|beschreibung)/i,
  /ursprünglich(?:e|en|er)?\s+(?:website|webseite|seite)/i,
  /(?:alten|alte|alter)\s+(?:website|webseite|seite)/i,
  /original(?:en|e|er)?\s+(?:website|webseite|seite)/i,
  /bestandsangabe|auf der bisherigen website beschrieben/i,
  /angaben in vorbereitung|noch in vorbereitung/i,
  /designvorschau|entwicklungsvorschau|entwicklungsstand/i,
  /interne[sr]?\s+(?:studio[- ]?)?review|studio development/i,
  /produktvisualisierung\s*[·:]\s*illustrative/i,
  /freigegeben(?:e|en|er)?\s+(?:studio[- ]?)?produktvisualisierung/i
];
function visibleText(html){
 return html
  .replace(/<!--[\s\S]*?-->/g," ")
  .replace(/<(script|style|svg|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi," ")
  .replace(/<[^>]*>/g," ")
  .replace(/&(?:nbsp|amp|lt|gt|quot|#39);/g," ")
  .replace(/\s+/g," ").trim();
}
let checks=0;
for(const route of routes){
 const name=route||"startseite";
 const file=path.join(root,route,"index.html");
 assert.ok(existsSync(file),"Missing page: "+file);checks++;
 const raw=readFileSync(file,"utf8");
 const text=visibleText(raw);
 assert.ok(text.length>100,name+" is empty");checks++;
 for(const phrase of forbidden){
  assert.doesNotMatch(text,phrase,name+": source or preview message");checks++;
 }
 assert.match(raw,/<meta name="robots" content="noindex,nofollow"/i,name+": keep preview noindex");checks++;
}
for(const slug of ["fotobox","fotospiegel","fotowohnwagen"]){
 const text=visibleText(readFileSync(path.join(root,slug,"index.html"),"utf8"));
 assert.doesNotMatch(text,/technische angaben basieren auf|bestandsangabe|vor angebot bestätigen/i);checks++;
}
const imprint=visibleText(readFileSync(root+"/impressum/index.html","utf8"));
assert.match(imprint,/Anna Maria Elisabeth Förster und Max Petter GbR/);checks++;
assert.match(imprint,/Sperlingsweg 4/);checks++;
assert.match(imprint,/02382 8889483/);checks++;
const privacy=visibleText(readFileSync(root+"/datenschutz/index.html","utf8"));
assert.match(privacy,/Verantwortliche Stelle/);checks++;
assert.match(privacy,/Kontaktaufnahme und Eventanfragen/);checks++;
assert.match(privacy,/Hosting/);checks++;
const faq=visibleText(readFileSync(root+"/faq/index.html","utf8"));
assert.match(faq,/individuelle Layouts und Designs/);checks++;
const gallery=visibleText(readFileSync(root+"/galerie/index.html","utf8"));
assert.match(gallery,/FOTOERLEBNIS/);checks++;
const admin=readFileSync(root+"/admin/index.html","utf8");
assert.ok(admin.includes('url=/admin/login/'),"Legacy admin must continue redirecting to login");checks++;
assert.ok(!existsSync(root+"/admin/admin.js"),"Legacy browser-only admin remains unpublished");checks++;
const dashboard=visibleText(readFileSync(root+"/admin/dashboard/index.html","utf8"));
for(const phrase of forbidden){assert.doesNotMatch(dashboard,phrase);checks++}
console.log("STANDALONE_BRAND_QA",JSON.stringify({routes:routes.length,checks,issues:0,imprint:"present",privacy:"present",admin:"protected"}));
