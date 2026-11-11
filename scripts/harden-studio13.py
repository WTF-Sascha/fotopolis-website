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

<script type="module" src="/admin/designstudio/boot-bundle.js"></script></head>
<body class="fp13-body"><header class="fp13-top"><strong>FOTOPOLIS / INTERN</strong><a href="/admin/dashboard/#designstudio">Zur Verwaltung</a></header>
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

# Studio 14 correlation: the generated static Netlify Forms declaration and the
# product forms carry the SAME request UUID field submitted to Netlify and Neon.
# This is safe only in the isolated deploy-preview output, never in source originals.
for formpage in [OUT/"kontakt/index.html",*(OUT/slug/"index.html" for slug in ("fotobox","fotospiegel","fotowohnwagen"))]:
    html=formpage.read_text(encoding="utf-8")
    marker='<input type="hidden" name="form-name" value="fotopolis-studio9-anfrage">'
    assert html.count(marker)==1, formpage
    html=html.replace(marker,marker+'<input type="hidden" name="fp_request_key" value="">',1)
    formpage.write_text(html,encoding="utf-8")

# Studio 13 preview-only customer operations and publishing adapters.
for asset in ("studio13-metrics.js","studio13-enquiry-mirror.js","studio13-public-content.js"):
    shutil.copy2(ROOT/"concepts/premium-v2"/asset,OUT/asset)
# Only public website routes are instrumented; admin/auth and print files are excluded.
public_files = [
    OUT/"index.html",OUT/"fotobox/index.html",OUT/"fotospiegel/index.html",
    OUT/"fotowohnwagen/index.html",OUT/"designvorlagen/index.html",
    OUT/"kontakt/index.html",OUT/"pakete/index.html",OUT/"faq/index.html",
    OUT/"anlaesse/index.html",OUT/"ueber-uns/index.html"
]
for path in public_files:
    content=path.read_text(encoding="utf-8")
    assert content.count("</head>")==1
    scripts='<script defer src="/studio13-metrics.js"></script>'
    if path in (OUT/"index.html",OUT/"kontakt/index.html",OUT/"faq/index.html",OUT/"ueber-uns/index.html"):
        scripts+='<script defer src="/studio13-public-content.js"></script>'
        key={OUT/"index.html":"hero_note",OUT/"kontakt/index.html":"contact_note",
             OUT/"faq/index.html":"faq_intro",OUT/"ueber-uns/index.html":"about_note"}[path]
        insert='<aside class="studio13-public-note" data-studio13-content="'+key+'" hidden></aside>'
        assert content.count("</main>")==1
        content=content.replace("</main>",insert+"</main>",1)
    if path==OUT/"kontakt/index.html" or path.name=="index.html" and path.parent.name in ("fotobox","fotospiegel","fotowohnwagen"):
        scripts+='<script defer src="/studio13-enquiry-mirror.js"></script>'
    content=content.replace("</head>",scripts+"</head>",1)
    path.write_text(content,encoding="utf-8")
# Respect the existing successful Netlify Forms submission path. Mirror only AFTER it confirms acceptance.
for file,formtype in ((OUT/"contact-flow.js","website"),(OUT/"product-enquiry-v6.js","product")):
    js=file.read_text(encoding="utf-8")
    marker='if(!response.ok)throw Error("HTTP "+response.status);'
    assert js.count(marker)==1
    sync_line=('const studio14MirrorOk = typeof window.fp13MirrorEnquiry === "function" && '
               'await window.fp13MirrorEnquiry(form,"'+formtype+'");')
    js=js.replace(marker,marker+'\n      '+sync_line,1)
    # Populate form key BEFORE the Netlify payload is assembled; exactly the same key
    # is available when the follow-up mirror reads the source form's FormData.
    key_init=('const studio14KeyField=form.elements.namedItem("fp_request_key");'
              'if(!studio14KeyField)throw Error("Fehlende Formularreferenz");'
              'if(!studio14KeyField.value)studio14KeyField.value=crypto.randomUUID();')
    if formtype=="website":
        payload_marker='const data=new URLSearchParams(new FormData(form));'
        assert js.count(payload_marker)==1
        js=js.replace(payload_marker,key_init+'\n      '+payload_marker,1)
    else:
        payload_marker='const payload=new URLSearchParams();'
        assert js.count(payload_marker)==1
        js=js.replace(payload_marker,key_init+'\n    '+payload_marker,1)
        # Product payload is assembled manually and must include the registered key.
        append_marker='for(const [key,value] of Object.entries(fields))payload.append(key,value);'
        assert js.count(append_marker)==1
        js=js.replace(append_marker,append_marker+'\n    payload.append("fp_request_key",studio14KeyField.value);',1)
    success_text=(
        'status.textContent="Deine Anfrage wurde übermittelt. Eine Buchung ist dadurch nicht erfolgt.";'
        if formtype=="website" else
        'status.textContent="Vielen Dank! Deine unverbindliche Anfrage wurde übermittelt. Eine Buchung ist dadurch nicht erfolgt.";'
    )
    assert js.count(success_text)==1
    diagnostic=(' if(!studio14MirrorOk)status.textContent+=" Hinweis zur Testumgebung: '
                'Die interne Übernahme konnte nicht bestätigt werden. Netlify Forms bleibt maßgeblich.";')
    js=js.replace(success_text,success_text+'\n      '+diagnostic,1)
    file.write_text(js,encoding="utf-8")
# Explicit team entry point: only the isolated built preview gets these links.
# Public customers see no protected data or admin features; SSO and JWT gates remain.
public_admin_pages=0
for page in sorted(OUT.rglob("index.html")):
    if "admin" in page.relative_to(OUT).parts:
        continue
    html=page.read_text(encoding="utf-8")
    assert html.count("</footer>")==1, f"Missing footer in {page}"
    assert "fp14-admin-entry" not in html, f"Duplicate management entry in {page}"
    link=('<nav class="fp14-admin-entry" aria-label="Interner Mitarbeiterzugang">'
          '<a href="/admin/">Interne Verwaltung <span aria-hidden="true">↗</span></a>'
          '</nav>')
    html=html.replace("</footer>",link+"</footer>",1)
    page.write_text(html,encoding="utf-8")
    public_admin_pages+=1
assert public_admin_pages==14, f"Expected 14 public preview entries, got {public_admin_pages}"

# Disclosure visible on the exact test data collection site – no legal assessment implied.
privacy=OUT/"datenschutz/index.html"
page=privacy.read_text(encoding="utf-8")
assert page.count("</main>")==1
notice=(
    '<section class="studio13-privacy-addendum" aria-label="Entwicklungsumgebung">'
    '<h2>FOTOPOLIS Studio 13 – Testumgebung</h2>'
    '<p>Auf dieser separat gekennzeichneten Netlify-Testwebsite werden freiwillig abgesendete '
    'Eventanfragen weiterhin über Netlify Forms übertragen. Nach bestätigtem Versand versucht '
    'das System zusätzlich, die Angaben in die interne Verwaltungsdatenbank (Neon, Entwicklungsbranch) '
    'zu übernehmen. Diese Kopie ist ausschließlich berechtigten Mitarbeitenden zugänglich. '
    'Ein erfolgreicher Formularversand ist keine Buchungsbestätigung.</p>'
    '<p>Die Testwebsite zählt zusätzlich rein aggregierte Seitenaufrufe und ausgewählte '
    'Interaktionen. Es werden dafür keine Cookies, dauerhaften Besucherkennungen oder '
    'persönlichen Browserprofile angelegt. Die angezeigten Zahlen sind keine eindeutigen Besucher. '
    'Die rechtliche Einordnung und die endgültigen Aufbewahrungsfristen sind vor einem '
    'produktiven Start gesondert zu prüfen.</p></section>'
)
page=page.replace("</main>",notice+"</main>",1)
privacy.write_text(page,encoding="utf-8")
# Do not build the addon into PWA cache; no sensitive requests may be handled by the worker.
assert "studio13-metrics.js" not in worker.read_text(encoding="utf-8")
# Editorial notices appear ONLY when approved CMS text is present.
public_css=OUT/"styles.css"
public_css.write_text(public_css.read_text(encoding="utf-8")+"""
.studio13-public-note:not([hidden]){display:block;margin:clamp(24px,5vw,65px) auto;
max-width:940px;padding:clamp(22px,3vw,40px);border:1px solid #c4ab7a;
border-radius:14px;background:#f7f2e9;color:#332f2a;font-size:clamp(15px,1.5vw,18px);
line-height:1.8;white-space:pre-line}
.studio13-privacy-addendum{max-width:960px;margin:40px auto;padding:26px;
background:#f8f2e7;color:#312b24;border-left:3px solid #ab8253;border-radius:8px}
.studio13-privacy-addendum p{line-height:1.7}
""",encoding="utf-8")

print("STUDIO 13: Public previews only, 44 private print masters, auth-gated editor and zero public print archives")
