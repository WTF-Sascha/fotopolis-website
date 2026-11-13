#!/usr/bin/env node
/* Static isolation and source contract: no API, storage, customer or auth access. */
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {createHash} from "node:crypto";
const read=x=>readFileSync(x,"utf8");
const orig="concepts/studio17-prototype/",staged="preview-build/studio17-konzept/";
const files=["index.html","studio17.css","studio17.js"];
for(const f of files){
 assert.ok(existsSync(orig+f)&&existsSync(staged+f),"Missing prototype "+f);
 const digest=p=>createHash("sha256").update(readFileSync(p)).digest("hex");
 assert.equal(digest(orig+f),digest(staged+f),"Unexpected transformed concept output "+f);
}
const html=read(staged+"index.html");
const js=read(staged+"studio17.js");
const css=read(staged+"studio17.css");
assert.ok(html.includes("/assets/fotopolis-goldmark.webp"),"Approved logo reference absent");
assert.ok(existsSync("preview-build/assets/fotopolis-goldmark.webp"),"Approved logo file absent");
assert.match(html,/<meta name="robots" content="noindex,nofollow,noarchive">/);
assert.match(html,/DEMODATEN · KEINE SPEICHERUNG/);
const ids=["uebersicht","anfragen","termine","geraete","designs","website"];
for(const id of ids){
 assert.ok(html.includes('data-screen="'+id+'"'),"Missing screen "+id);
 assert.ok(html.includes('data-nav="'+id+'"'),"Missing main navigation item "+id);
}
assert.equal((html.match(/class="nav-link(?: active)?"/g)||[]).length,6,
 "Exactly six visible main navigation options are required");
assert.ok(html.includes('data-screen="einstellungen"')&&html.includes('data-nav="einstellungen"'));
assert.ok(!html.includes("name=\"password\""),"No sign-in/password fields in concept");
assert.ok(!html.includes("service-worker")&&!html.includes('rel="manifest"'),
 "The demo must not install over the actual FOTOPOLIS PWA");
assert.ok(js.includes("const requests=")&&js.includes("const devices="));
assert.doesNotMatch(js,/\bfetch\s*\(|\bXMLHttpRequest\b|\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|\bnavigator\.sendBeacon\b|\bWebSocket\b/,
 "The UX concept must never reach the network or persist actions");
assert.doesNotMatch(html,/<a[^>]+href="https?:\/\/|<form[^>]+action=/i,
 "The prototype must not link or submit to external production endpoints");
assert.doesNotMatch(css,/#0[a-f0-9]{5}\b|#00[a-f0-9]{4}\b/i, "Unexpected raw blue palette");
assert.ok(existsSync("preview-build/admin/dashboard/index.html"),
 "Existing admin remains present and is not replaced");
console.log("STUDIO 17 STATIC UX CONTRACT PASS: six areas, one settings panel, approved logo, no network, no storage, existing admin intact.");
