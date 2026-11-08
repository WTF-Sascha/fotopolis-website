#!/usr/bin/env node
/* Studio 9.5 public release gate, no network or visitor data. */
import assert from "node:assert/strict";
import {existsSync,readFileSync,readdirSync,statSync} from "node:fs";
import {join} from "node:path";

const base="preview-build";
const read=p=>readFileSync(join(base,p),"utf8");
const has=p=>existsSync(join(base,p));
const check=(ok,label)=>assert.ok(ok,label);
const routes=["index.html","fotobox/index.html","fotospiegel/index.html",
 "fotowohnwagen/index.html","pakete/index.html","galerie/index.html",
 "anlaesse/index.html","ueber-uns/index.html","faq/index.html",
 "kontakt/index.html","impressum/index.html","datenschutz/index.html",
 "designvorlagen/index.html","danke/index.html"];
let resolved=0;
for(const path of routes){
 const html=read(path);
 check(html.includes('<link rel="stylesheet" href="/brand-finish.css">'),path+": finish CSS absent");
 check(html.includes("/assets/fotopolis-goldmark.webp"),path+": wrong logo");
 check(html.includes("brand-gold.css"),path+": brand system missing");
 check(!/brand-photo\.css|fp-photo-mark/.test(html),path+": legacy overlays leaked");
 check((html.match(/<\/head>/g)||[]).length===1,path+": bad document head");
 check((html.match(/<\/main>/g)||[]).length===1,path+": invalid main");
 for(const m of html.matchAll(/\b(?:src|href)="(\/[^"#?]+)(?:\?[^"]*)?"/g)){
   const url=m[1];
   if(url==="/"||url.startsWith("//"))continue;
   if(url.endsWith("/")){
     check(has(url.slice(1)+"index.html"),"Missing local page "+url);
     continue;
   }
   if(/\.(?:css|js|svg|webp|png|jpg|jpeg|gif|ico|json|webmanifest)$/.test(url)){
     check(has(url.slice(1)),"Broken asset reference "+url);
     resolved++;
   }
 }
}
const catalogue=JSON.parse(read("assets/design-gallery-data.json"));
check(catalogue.length===32,"Expected 32 printer layouts");
check(new Set(catalogue.map(x=>x.id)).size===32,"Duplicate template ID");
const imgs=readdirSync(join(base,"assets/designvorlagen")).filter(x=>/^fp-\d{3}\.webp$/.test(x));
check(imgs.length===32,"Missing or extra design images");
for(const item of catalogue){
 check(item.image==="/assets/designvorlagen/"+item.id.toLowerCase()+".webp",item.id+": invalid artwork path");
 check(has(item.image.slice(1)),item.id+": missing design");
 check(statSync(join(base,item.image.slice(1))).size>1000,item.id+": empty artwork");
}
const contact=read("kontakt/index.html");
check(contact.includes('name="fotopolis-studio9-anfrage"'),"Netlify contact form missing");
for(let n=1;n<=32;n++){
 const id="FP-"+String(n).padStart(3,"0");
 check(contact.includes('value="'+id+'"'),id+": not available in contact form");
}
for(const p of ["fotobox","fotospiegel","fotowohnwagen"]){
 const html=read(p+"/index.html");
 check(html.includes("data-product-request"),"Product form missing: "+p);
 check(html.includes("/designvorlagen/?produkt="),"Design picker crosslink missing: "+p);
}
for(const filename of ["fotopolis-touch-mirror.webp","fotopolis-touch-box.webp"]){
 const p="assets/branding/"+filename;
 check(has(p)&&statSync(join(base,p)).size>10000,"Missing screen asset "+p);
}
for(const filename of ["logo-detail-inspection.webp","all-32-templates.webp","studio95-audit.json"]){
 check(has("qa/"+filename),"Visual audit missing: "+filename);
}
for(const file of ["fotospiegel-hero-lossless.webp","fotobox-event-1672.webp","fotowohnwagen-gartenparty-1448.webp"]){
 check(has("assets/images/"+file),"Original product photo missing: "+file);
}
check(has("admin/login/index.html")&&has("admin/dashboard/index.html"),"Admin route unexpectedly absent");
console.log("PASS Studio 9.5: "+routes.length+" public pages, "+resolved+" resolved local assets, all 32 source designs, 3 enquiry flows, black-gold screens, image-zoom audit and admin route integrity.");
