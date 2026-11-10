#!/usr/bin/env python3
"""Studio 13: harden generated Studio 12 preview into a separate public/private architecture.
Called AFTER baseline print QA and BEFORE Netlify deploy packaging.
All protected originals remain outside the Netlify publish directory.
"""
import json
import re
import shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"preview-build"
PRIVATE=ROOT/"private-design-assets"
CAT=OUT/"assets/design-gallery-data.json"
assert OUT.is_dir() and CAT.is_file(),"Run Studio 12 preview build first"
catalogue=json.loads(CAT.read_text(encoding="utf-8"))
assert len(catalogue)==44
assert sum(x.get("collection")=="classics" for x in catalogue)==32
assert sum(x.get("collection")=="signature" for x in catalogue)==12
printdir=OUT/"assets/designvorlagen/print"
assert printdir.is_dir()
expected={x["id"].lower()+".png" for x in catalogue}
assert expected=={p.name for p in printdir.glob("*.png")},"44 expected protected originals"
if PRIVATE.exists(): shutil.rmtree(PRIVATE)
PRIVATE.mkdir()
shutil.move(str(printdir),str(PRIVATE/"print"))
(PRIVATE/"catalogue.json").write_text(json.dumps(catalogue,ensure_ascii=False),encoding="utf-8")
main=(ROOT/"concepts/premium-v2/studio12-editor-main.html").read_text(encoding="utf-8")
main=main.replace("DESIGN-TO-PRINT STUDIO 12.0","BUSINESS COMMAND CENTER / DESIGN STUDIO 13.0")
main=main.replace("Dein Design. <em>Deine Geschichte.</em>","Präzision im Druck. <em>Liebe zum Detail.</em>")
main=main.replace("Wähle eine der 44 Original- und Signature-Vorlagen, füge deine Fotos ein und gestalte deine persönliche Druckvorschau. Deine Bilder bleiben auf diesem Gerät.","Interner Druckarbeitsplatz für alle 44 FOTOPOLIS-Vorlagen. Fotoimporte und PNG-Exporte bleiben browserlokal. Druckoriginale werden nur nach erfolgreicher Anmeldung geladen.")
(PRIVATE/"editor.html").write_text(main,encoding="utf-8")
public=[]
for item in catalogue:
    clean={k:v for k,v in item.items() if k not in ("printOverlay","photoRegions")}
    public.append(clean)
CAT.write_text(json.dumps(public,ensure_ascii=False),encoding="utf-8")

# Reuse the proven Studio-12 editor without leaking a public URL for raw print masters.
editor=(ROOT/"concepts/premium-v2/studio12-editor.js").read_text(encoding="utf-8")
old='''    const filepath=item.printOverlay;
    if(!/^\/assets\/designvorlagen\/print\/fp-0\d{2}\.png$/.test(filepath||"")){say("Ungültiger Vorlagenpfad.");return;}
    try{
      const result=await loadImage(filepath);'''
new='''    const filepath="/api/fotopolis/admin/design/print/"+item.id;
    try{
      const file=await window.fp13Fetch(filepath);
      if(!file.ok)throw new Error("Privates Druckoriginal nicht erreichbar");
      const objectURL=URL.createObjectURL(await file.blob());
      let result;
      try{result=await loadImage(objectURL);}
      finally{URL.revokeObjectURL(objectURL);}'''
assert old in editor,"Studio-12 overlay loader changed; do not weaken protection"
editor=editor.replace(old,new,1)
oldfetch='await fetch("/assets/design-gallery-data.json",{cache:"no-store",credentials:"same-origin"})'
assert oldfetch in editor
editor=editor.replace(oldfetch,'await window.fp13Fetch("/api/fotopolis/admin/design/catalog")',1)
ed=OUT/"admin/designstudio"
ed.mkdir(parents=True,exist_ok=True)
(ed/"studio13-editor.js").write_text(editor,encoding="utf-8")

# Unauthenticated shell has no editor content, no template data and no print files.
(ed/"index.html").write_text("""<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive">
<meta name="referrer" content="no-referrer"><meta name="theme-color" content="#151c23">
<title>Internes Design Studio | FOTOPOLIS</title>
<link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/studio12-editor.css">
<link rel="stylesheet" href="/admin/dashboard/command-center.css">
<style>body{background:#151c23;color:#f4e9d9}.fp13-top{padding:15px clamp(15px,3vw,50px);display:flex;gap:22px;align-items:center;border-bottom:1px solid #725f42}.fp13-top a{color:#e6c588}.fp13-gate{max-width:820px;margin:10vh auto;padding:35px;background:#273029;border-radius:15px}.fp13-gate a{color:#f1cf89}</style>
<script type="module" src="/admin/designstudio/boot-bundle.js"></script></head>
<body><header class="fp13-top"><strong>FOTOPOLIS / INTERN</strong><a href="/admin/dashboard/#designstudio">Zur Verwaltung</a></header>
<div id="fp13-gate" class="fp13-gate" role="status" aria-live="polite"><h1>Design Studio wird geprüft.</h1>
<p id="fp13-message">Authentifizierung und Berechtigungen werden geprüft …</p>
<a href="/admin/login/" id="fp13-login" hidden>Zur geschützten Anmeldung</a></div>
<div id="fp13-editor" hidden></div></body></html>""",encoding="utf-8")

gallery=OUT/"designvorlagen/index.html"
html=gallery.read_text(encoding="utf-8")
html,n=re.subn(r'<a\b[^>]*\bdata-modal-editor\b[^>]*>.*?</a>',"",html,count=1,flags=re.S)
assert n==1,"Public editor CTA still present or markup changed"
html,n=re.subn(r'<a\b[^>]*\bdata-modal-print\b[^>]*>.*?</a>',"",html,count=1,flags=re.S)
assert n==1,"Public print download still present or markup changed"
html=html.replace('<a class="gl-secondary" href="/designstudio/">Fotoeditor öffnen ↗</a>',
'<a class="gl-secondary" href="/kontakt/">Persönliche Gestaltung anfragen ↗</a>')
assert 'href="/designstudio/' not in html and 'data-modal-print' not in html
gallery.write_text(html,encoding="utf-8")
shutil.rmtree(OUT/"designstudio")
assert not (OUT/"designstudio").exists()
(OUT/"studio12-editor.js").unlink()
# Print bundles in QA may contain the same protected artwork. They must never ship on CDN.
qa=OUT/"qa"
assert (qa/"FOTOPOLIS_PhotoPrint_44_15x10_300dpi.zip").exists()
shutil.rmtree(qa)
worker=OUT/"service-worker.js"
sw=worker.read_text(encoding="utf-8")
sw=sw.replace("v12-design-to-print-private-r1","v13-admin-secure-r1")
sw=sw.replace(" '/studio12-editor.css', '/studio12-editor.js', '/studio12-contact-transfer.js', '/designstudio/',",
" '/studio12-editor.css', '/studio12-contact-transfer.js',")
assert "/designstudio/" not in sw and "/studio12-editor.js" not in sw
worker.write_text(sw,encoding="utf-8")
assert len(list((PRIVATE/"print").glob("*.png")))==44
assert not any((OUT/p).exists() for p in ["assets/designvorlagen/print","designstudio/index.html","qa/FOTOPOLIS_PhotoPrint_44_15x10_300dpi.zip"])
print("STUDIO 13: Public previews only, 44 private print masters, auth-gated editor and zero public print archives")
