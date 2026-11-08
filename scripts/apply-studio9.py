#!/usr/bin/env python3
"""Studio 9.0 HTML enhancement after the reviewed premium build.
Only the isolated FOTOPOLIS preview-build is changed. Fail on changed anchors.
Netlify parses the resulting STATIC form at deploy time; no visitor secrets in JS.
"""
from pathlib import Path
from html import escape
import json
import re
import shutil

root=Path(__file__).resolve().parents[1]
src=root/"concepts/premium-v2"
out=root/"preview-build"
designs=json.loads((src/"design-gallery-data.json").read_text(encoding="utf-8"))
assert len(designs)==32 and len({d["id"] for d in designs})==32
assert all(re.fullmatch(r"FP-\d{3}",d["id"]) for d in designs)
formname="fotopolis-studio9-anfrage"

def replace_one(text,old,new,label):
    count=text.count(old)
    assert count==1, f"Studio 9 expected exactly one {label}, got {count}"
    return text.replace(old,new,1)

def add_assets(path,js=None):
    html=path.read_text(encoding="utf-8")
    head='<link rel="stylesheet" href="/studio9.css">'
    if js: head+='<script defer src="/'+js+'"></script>'
    return replace_one(html,"</head>",head+"</head>","page head")

options='<option value="">Noch keine Vorlage ausgewählt</option>'+''.join(
    '<option value="'+escape(d["id"])+'">'+escape(d["id"]+" · "+d["name"])+'</option>'
    for d in designs
)
design_picker=(
    '<div class="studio9-design-field" data-studio9-design-picker>'
    '<label for="contact-design">Fotodesign aus 32 Vorlagen (optional)</label>'
    '<select id="contact-design" name="vorlage" data-studio9-design-select>'+options+'</select>'
    '<div class="studio9-design-info">'
    '<img data-studio9-design-preview alt="Vorschau des gewählten Fotodesigns" width="186" height="124" hidden>'
    '<div><p data-studio9-design-summary>Optional: Wähle einen individuellen Fotolook.</p>'
    '<a href="/designvorlagen/" data-studio9-design-gallery-link>Alle 32 Designs ansehen ↗</a></div>'
    '</div></div>'
)
privacy=(
    '<label class="studio9-privacy-accept"><input type="checkbox" name="datenschutz_ok" value="Ja" required>'
    '<span>Ich habe die <a href="/datenschutz/" target="_blank" rel="noopener">Datenschutzhinweise</a> zur Anfrageverarbeitung gelesen. *</span></label>'
)
honeypot=(
    '<p class="studio9-honeypot" aria-hidden="true">'
    '<label for="website-check">Dieses Feld bitte leer lassen</label>'
    '<input id="website-check" name="website" tabindex="-1" autocomplete="off"></p>'
)

contact=out/"kontakt/index.html"
s=add_assets(contact,"studio9-design.js")
s=replace_one(
    s,'data-contact-flow novalidate>',
    'id="studio9-contact-form" name="'+formname+'" data-netlify="true" netlify-honeypot="website" '
    'method="POST" action="/danke/" data-contact-flow novalidate>',
    "contact form Netlify declaration"
)
s=replace_one(s,'data-contact-flow novalidate>',
  'data-contact-flow novalidate>'
  '<input type="hidden" name="form-name" value="'+formname+'">'
  '<input type="hidden" name="notiz" value="">'
  +honeypot,"contact Netlify form fields")
s=replace_one(s,'<div class="contact-wishes">',design_picker+'<div class="contact-wishes">',"contact design chooser")
s=replace_one(s,'</textarea></fieldset>', '</textarea>'+privacy+'</fieldset>',"contact privacy acceptance")
s=replace_one(s,'<p class="contact-small">* Pflichtfeld. Du öffnest den E-Mail-Entwurf selbst.</p>',
  '<p class="contact-small">* Pflichtfeld. Die Anfrage wird sicher übermittelt; sie ist keine Buchung.</p>',"contact helper text")
s=replace_one(s,'<a class="button gold" data-contact-email ',
  '<button type="submit" form="studio9-contact-form" class="button gold studio9-submit" data-contact-submit>'
  'Anfrage sicher absenden <span aria-hidden="true">→</span></button>'
  '<a class="button studio9-email-fallback" data-contact-email ',"contact submit action")
s=replace_one(s,'E-Mail-Entwurf öffnen <span aria-hidden="true">↗</span></a>',
  'Alternativ per E-Mail <span aria-hidden="true">↗</span></a>',"contact fallback label")
s=replace_one(s,'<p class="contact-status" data-contact-status role="status"></p>',
  '<p class="contact-status" data-contact-status role="status" aria-live="polite"></p>'
  '<div class="studio9-success" data-studio9-success hidden role="status">'
  '<strong>Vielen Dank! Deine Anfrage wurde übermittelt.</strong>'
  '<p>FOTOPOLIS kann sie im geschützten Anfrage-Postfach prüfen. '
  'Dies ist noch keine Reservierung. Eine automatische Bestätigungs-E-Mail wird nicht versendet.</p>'
  '</div>',"contact confirmation UI")
s=replace_one(s,
  'Es wird nichts versendet oder reserviert.',
  'Erst mit „Anfrage sicher absenden“ werden die Angaben übertragen. Eine Reservierung erfolgt dadurch nicht.',
  "contact summary description")
assert s.count('name="vorlage"')==1 and s.count('name="datenschutz_ok"')==1
contact.write_text(s,encoding="utf-8")

for slug,prod in [("fotobox","Fotobox"),("fotospiegel","Fotospiegel"),("fotowohnwagen","Fotowohnwagen")]:
    page=out/slug/"index.html"
    s=add_assets(page,"studio9-design.js")
    pattern=re.compile(r'<form class="product-request-form" data-product-request data-product="([^"]+)" data-display-product="([^"]+)" novalidate>')
    found=pattern.search(s)
    assert found and found.group(1)==prod, f"Product form changed: {slug}"
    replacement=(
      '<form class="product-request-form" data-product-request data-product="'+prod+'" '
      'data-display-product="'+found.group(2)+'" method="POST" action="/kontakt/" novalidate>'
      '<input type="hidden" name="form-name" value="'+formname+'">'
      '<input type="hidden" name="produkt" value="'+prod+'">'
      '<p class="studio9-honeypot" aria-hidden="true"><label>Dieses Feld bitte leer lassen'
      '<input name="website" tabindex="-1" autocomplete="off"></label></p>'
    )
    s=s[:found.start()]+replacement+s[found.end():]
    picker=(
      '<div class="studio9-design-field" data-studio9-design-picker>'
      '<label for="studio9-'+slug+'-design">Fotodesign auswählen (optional)</label>'
      '<select id="studio9-'+slug+'-design" name="vorlage" data-studio9-design-select>'+options+'</select>'
      '<div class="studio9-design-info">'
      '<img data-studio9-design-preview alt="Vorschau der gewählten Designvorlage" width="130" height="86" hidden>'
      '<div><p data-studio9-design-summary>Individuelle Gestaltung aus 32 Vorlagen.</p>'
      '<a href="/designvorlagen/?produkt='+prod+'" data-studio9-design-gallery-link>Alle Fotodesigns ansehen ↗</a>'
      '</div></div></div>'
    )
    s=replace_one(s,'<button class="s7-primary-action s7-next-button"',
      picker+'<button class="s7-primary-action s7-next-button"',"product design chooser")
    s=replace_one(s,'<div class="s7-submit-row">',
      privacy+'<div class="s7-submit-row">'
      '<button class="s7-primary-action studio9-product-submit" type="submit" data-studio9-product-submit>'
      'Anfrage direkt senden <span aria-hidden="true">→</span></button>',"product submit action")
    s=replace_one(s,
      'Die Anfrage wird erst versendet, wenn du den Entwurf in deinem E-Mail-Programm selbst abschickst. ',
      'Mit „Anfrage direkt senden“ werden die Angaben über die Website übermittelt. '
      'Der E-Mail-Entwurf bleibt als Alternative verfügbar. ',
      "product disclosure")
    assert s.count('data-studio9-design-picker')==1 and s.count('name="vorlage"')==1
    page.write_text(s,encoding="utf-8")

# Privacy source text is now updated in pages.json and built into /datenschutz/.

# Fully built standalone non-JS success route, preserving approved branding.
home=(out/"index.html").read_text(encoding="utf-8")
header=re.search(r'<header class="site-header[^"]*"[^>]*>.*?</header>',home,re.S)
footer=re.search(r'<footer class="footer[^"]*"[^>]*>.*?</footer>',home,re.S)
ribbon=re.search(r'<div class="review-bar">.*?</div></div>',home,re.S)
assert header and footer and ribbon
thank=out/"danke"
thank.mkdir(exist_ok=True)
(thank/"index.html").write_text(
    '<!doctype html><html lang="de"><head><meta charset="utf-8">'
    '<meta name="viewport" content="width=device-width,initial-scale=1">'
    '<meta name="robots" content="noindex,nofollow">'
    '<meta name="theme-color" content="#071B30">'
    '<title>Anfrage übermittelt | FOTOPOLIS</title>'
    '<link rel="icon" href="/favicon.ico">'
    '<link rel="stylesheet" href="/styles.css">'
    '<link rel="stylesheet" href="/studio-polish.css">'
    '<link rel="stylesheet" href="/reference-v4.css">'
    '<link rel="stylesheet" href="/studio-v5.css">'
    '<link rel="stylesheet" href="/studio9.css">'
    '<script defer src="/site.js"></script>'
    '<script defer src="/studio-v5.js"></script>'
    '</head><body class="route-danke">'
    +ribbon.group(0)+header.group(0)
    +'<main id="content"><section class="studio9-thanks"><div class="inner">'
    +'<span class="kicker">FOTOPOLIS · EVENTANFRAGE</span>'
    +'<h1>Vielen Dank für deine Anfrage.</h1>'
    +'<p>Falls du das Formular gerade abgeschickt hast, wurde es zur Verarbeitung '
    'übergeben. FOTOPOLIS prüft den Wunschtermin und meldet sich persönlich. '
    'Eine verbindliche Reservierung wurde nicht vorgenommen.</p>'
    +'<a class="button gold" href="/">Zur Startseite zurück →</a>'
    +'</div></section></main>'+footer.group(0)+'</body></html>',
    encoding="utf-8")

# The contact form is the only Netlify Forms registration for the site;
# product forms submit the same field schema directly to /kontakt/.
assert s is not None
all_html=(out/"kontakt/index.html").read_text(encoding="utf-8")
assert 'data-netlify="true"' in all_html
assert 'name="form-name" value="'+formname+'"' in all_html
assert all('value="'+d["id"]+'"' in all_html for d in designs)
for slug in ("fotobox","fotospiegel","fotowohnwagen"):
    check=(out/slug/"index.html").read_text(encoding="utf-8")
    assert 'data-netlify="true"' not in check
    assert 'data-studio9-product-submit' in check

for filename in ("studio9.css","studio9-design.js"):
    shutil.copy2(src/filename,out/filename)
print("STUDIO 9: Netlify Forms registration, 32 template choices, product/contact enquiries, thank-you route, privacy information and mobile styling built.")
