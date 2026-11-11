#!/usr/bin/env python3
"""FOTOPOLIS Studio 12.0 — strictly isolated Design-to-Print build integration.

Run AFTER the Studio 11.2 original-artwork build and its 44 print overlays.
Only preview-build is modified. The Studio 11.2 source, 44 print assets,
admin/login, main, and original product imagery remain immutable.
"""
from __future__ import annotations
from pathlib import Path
from shutil import copy2
import hashlib
import json
import re

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"preview-build"
SRC=ROOT/"concepts/premium-v2"
CAT=OUT/"assets/design-gallery-data.json"
catalogue=json.loads(CAT.read_text(encoding="utf-8"))
assert len(catalogue)==44
assert len([x for x in catalogue if x["collection"]=="classics"])==32
assert len([x for x in catalogue if x["collection"]=="signature"])==12
assert all(x["pixelWidth"]==1772 and x["pixelHeight"]==1181 and x["dpi"]==300 for x in catalogue)
for item in catalogue:
    assert len(item["photoRegions"])==item["photos"]
    assert item["printOverlay"].startswith("/assets/designvorlagen/print/")
    assert (OUT/item["printOverlay"].lstrip("/")).is_file()

logo=ROOT/"site/assets/fotopolis-goldmark.webp"
logo_hash=hashlib.sha256(logo.read_bytes()).hexdigest()
assets=("studio12-editor.css","studio12-editor.js","studio12-contact-transfer.js")
for name in assets:
    copy2(SRC/name,OUT/name)

# Own public /designstudio/ route uses the existing premium header, footer,
# legal links, theme, and PWA registration. No new anonymous service or API.
gallery=OUT/"designvorlagen/index.html"
html=gallery.read_text(encoding="utf-8")
markup=(SRC/"studio12-editor-main.html").read_text(encoding="utf-8").strip()
assert markup.startswith('<main id="content"') and markup.endswith('</main>')
pattern=r'<main id="content" data-design-gallery>.*?</main>'
editor,count=re.subn(pattern,lambda _:markup,html,count=1,flags=re.S)
assert count==1,"Gallery layout/landmark changed"
editor=editor.replace("<title>Premium-Designvorlagen | FOTOPOLIS</title>",
  "<title>Design-to-Print Studio 12.0 | FOTOPOLIS</title>",1)
editor=editor.replace('<script defer src="/assets/design-gallery.js"></script>',"",1)
editor=editor.replace("</head>",
   '<link rel="stylesheet" href="/studio12-editor.css">'
   '<script defer src="/studio12-editor.js"></script></head>',1)
editor=editor.replace('Designvorschau · Keine Live-Buchung',
                      'Fotoeditor-Vorschau · Keine Live-Buchung')
assert editor.count("<main")==1 and editor.count("data-fp12-editor")==1
assert editor.count("/studio12-editor.js")==1
route=OUT/"designstudio"
route.mkdir(exist_ok=True)
(route/"index.html").write_text(editor,encoding="utf-8")

# Design gallery opens current product/template in the new local-only editor;
# retain the historic 15×10cm overlay download and enquiry buttons.
gallery_new=html
anchor='<a class="gl-action" data-modal-link href="/kontakt/">Diese Vorlage anfragen ↗</a>'
assert gallery_new.count(anchor)==1
gallery_new=gallery_new.replace(anchor,
 '<a class="gl-action" data-modal-editor href="/designstudio/">'
 'Mit eigenen Fotos gestalten ↗</a>'
 '<a class="gl-secondary" data-modal-link href="/kontakt/">'
 'Diese Vorlage anfragen ↗</a>',1)
hero_anchor='<a class="gl-secondary" href="/kontakt/">Persönliche Gestaltung anfragen ↗</a>'
assert gallery_new.count(hero_anchor)==1
gallery_new=gallery_new.replace(hero_anchor,
 '<a class="gl-secondary" href="/designstudio/">Fotoeditor öffnen ↗</a>',1)
gallery.write_text(gallery_new,encoding="utf-8")

# Existing Netlify form and accessibility/wizard remain unchanged. A separate,
# optional script transfers only explicit design details from sessionStorage.
contact=OUT/"kontakt/index.html"
existing=contact.read_text(encoding="utf-8")
assert existing.count("</head>")==1 and "data-contact-flow" in existing
existing=existing.replace("</head>",
    '<script defer src="/studio12-contact-transfer.js"></script></head>',1)
contact.write_text(existing,encoding="utf-8")

# The PWA must revalidate the new route, scripts and style assets on update.
sw=OUT/"service-worker.js"
worker=sw.read_text(encoding="utf-8")
old="fotopolis-studio-2026-11-09-v11-classics32-faithful-r2"
new="fotopolis-studio-2026-11-09-v12-design-to-print-private-r1"
assert worker.count(old)==1
worker=worker.replace(old,new,1)
anchor="'/studio11-quiet-luxury.css',"
assert worker.count(anchor)==1
worker=worker.replace(anchor,anchor+
 " '/studio12-editor.css', '/studio12-editor.js',"
 " '/studio12-contact-transfer.js', '/designstudio/',",1)
sw.write_text(worker,encoding="utf-8")

assert hashlib.sha256(logo.read_bytes()).hexdigest()==logo_hash
assert not any(x in editor for x in ("https://cdn.", "https://analytics.",'type="file" name="'))
assert (OUT/"admin/login/index.html").exists()
qa=OUT/"qa"
qa.mkdir(exist_ok=True)
report={
 "version":"FOTOPOLIS Studio 12.0",
 "release":"ISOLATED PR PREVIEW; NO MAIN OR PRODUCTION",
 "base":"Studio 11.2 44 actual source-based print overlays",
 "totalLayouts":len(catalogue),"classicMotifs":32,"signatureMotifs":12,
 "preservedSourceGoldmarkSha256":logo_hash,
 "editorRoute":"/designstudio/",
 "formIntegration":"/kontakt/ and sessionStorage metadata only",
 "photos":"Browser-only File API, object URL revoked after decode",
 "exportSize":[1772,1181],
 "dpi":300,
 "dpiSerialization":"Client PNG pHYs chunk at 11811 pixels-per-meter",
 "originalPrintOverlaysUnmodified":True,
 "manualPrintApproval":"PENDING physical original-printer proof",
 "browserInteractionTests":"REQUIRED before release"
}
(qa/"studio12-build-audit.json").write_text(json.dumps(report,indent=2,ensure_ascii=False),encoding="utf-8")
print("STUDIO 12: 44 source-faithful print layouts, new private designstudio route, unchanged Netlify form and original source assets")
