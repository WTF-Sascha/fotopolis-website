#!/usr/bin/env node
/**
 * FOTOPOLIS presentation regression gate:
 * The 32-template collection must remain separate from the photo-first Studio 7 home.
 * Run after: python3 scripts/build-premium-preview.py
 */
import assert from "node:assert/strict";
import {existsSync, readFileSync, readdirSync} from "node:fs";
import {join} from "node:path";

const root="preview-build";
const read=(path)=>readFileSync(join(root,path),"utf8");
const exists=(path)=>existsSync(join(root,path));
const home=read("index.html");
const gallery=read("designvorlagen/index.html");
const data=JSON.parse(read("assets/design-gallery-data.json"));
const css=read("assets/design-gallery.css");
const galleryJs=read("assets/design-gallery.js");
const must=(condition,label)=>assert.ok(condition,label);
const index=(text,fragment)=>{const n=text.indexOf(fragment);must(n!==-1,"Missing "+fragment);return n};

must(home.includes("class=\"v45-home\""),"Studio 7 home identity lost");
must(home.includes("id=\"hero-title\""),"Premium hero lost");
must(home.includes("id=\"erlebnisse\""),"Product section lost");
must((home.match(/class="v4-product-card"/g)||[]).length===3,"Exactly three product cards required");
must(index(home,"id=\"erlebnisse\"")<index(home,"id=\"design-teaser-title\""),"Design section must follow products");
must(index(home,"id=\"design-teaser-title\"")<index(home,"class=\"v45-final-cta\""),"Design section must precede final CTA");
must(!home.includes("data-design-gallery"),"Full design gallery must not replace landing page");

for(const name of [
  "fotobox-event-1672.webp",
  "fotobox-event-800.webp",
  "fotospiegel-hero-lossless.webp",
  "fotowohnwagen-gartenparty-1448.webp",
  "fotowohnwagen-gartenparty-760.webp",
]){
  must(exists("assets/images/"+name),"Missing product photo: "+name);
}
for(const [slug,image] of [
  ["fotobox","fotobox-event-1672.webp"],
  ["fotospiegel","fotospiegel-hero-lossless.webp"],
  ["fotowohnwagen","fotowohnwagen-gartenparty-1448.webp"],
]){
  must(home.includes("/assets/images/"+image),"Product imagery lost on home: "+slug);
  const page=read(slug+"/index.html");
  must(page.includes("id=\"terminanfrage\""),"Direct enquiry lost: "+slug);
  must(page.includes("/designvorlagen/?produkt="),"Design gallery cross-link lost: "+slug);
  must(page.includes("data-product-request"),"Product enquiry widget lost: "+slug);
}
must(Array.isArray(data)&&data.length===32,"Exactly 32 unique templates required");
must(new Set(data.map(x=>x.id)).size===32,"Duplicate template IDs");
must(new Set(data.map(x=>x.sha256)).size===32,"Duplicate source designs");
const imageNames=readdirSync(join(root,"assets/designvorlagen")).filter(x=>/^fp-\d{3}\.webp$/.test(x));
must(imageNames.length===32,"Unexpected design preview count");
for(const item of data){
  must(/^FP-\d{3}$/.test(item.id),"Invalid template ID");
  must(item.image==="/assets/designvorlagen/"+item.id.toLowerCase()+".webp","Broken design route: "+item.id);
  must(exists(item.image.slice(1)),"Missing template asset: "+item.id);
  must([1,2,3].includes(item.photos),"Invalid collage count: "+item.id);
}
must(gallery.includes("data-design-gallery"),"Dedicated design gallery missing");
must(gallery.includes("/assets/design-gallery.js"),"Gallery interaction missing");
must(gallery.includes("/assets/design-gallery.css"),"Gallery styling missing");
must(gallery.includes("data-gallery-modal"),"Gallery detail dialog missing");
must(galleryJs.includes("data-gallery-search")&&galleryJs.includes("data-gallery-category"),"Gallery filters missing");
must(galleryJs.includes("fotopolis.gallery.favorites"),"Saved designs missing");
must(css.includes("scroll-snap-type:x mandatory"),"Mobile compact design preview missing");
must(home.includes("/designvorlagen/"),"Home gallery entry missing");
must(exists("galerie/index.html"),"Existing product/gallery imagery route lost");
must(exists("admin/login/index.html"),"Admin sign-in route lost");
must(exists("admin/dashboard/index.html"),"Operator dashboard route lost");
console.log("PASS: Studio hero, 3 product photos, 3 enquiries, 32 unique design templates, standalone gallery, mobile layout, administration.");
