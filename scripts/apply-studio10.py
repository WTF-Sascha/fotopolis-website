#!/usr/bin/env python3
"""Studio 10 candidate build: isolated premium theme and honest visual-asset evidence.

Runs after Studio 9.5 so approved source photographs, the goldmark and all
existing contact/admin workflows stay untouched. A programmatic image check
must never be reported as a completed HUMAN visual review.
"""
from __future__ import annotations

import hashlib
import json
import re
from html import escape
from pathlib import Path
from shutil import copy2

from PIL import Image, ImageOps, ImageDraw, ImageChops

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "preview-build"
SOURCE = ROOT / "concepts/premium-v2"
QA = OUT / "qa"
BRANCH_VERSION = "10.0-qa-candidate"
CSS = SOURCE / "studio10-premium.css"
assert CSS.is_file() and CSS.stat().st_size > 4500, "Studio 10 theme absent"
copy2(CSS, OUT / CSS.name)

pages = sorted(p for p in OUT.rglob("index.html")
               if "admin" not in p.relative_to(OUT).parts)
assert len(pages) == 14, f"Unexpected public page count: {len(pages)}"
for page in pages:
    html = page.read_text(encoding="utf-8")
    assert html.count("</head>") == 1, page
    assert '<link rel="stylesheet" href="/brand-finish.css">' in html, page
    assert html.count("/assets/fotopolis-goldmark.webp") >= 1, page
    assert "/studio10-premium.css" not in html, page
    html = html.replace("</head>", '<link rel="stylesheet" href="/studio10-premium.css"></head>', 1)
    html = re.sub(r'(<meta name="theme-color" content=")[^"]+(")',
                  r'\g<1>#15120f\2', html)
    if '<meta name="theme-color"' not in html:
        html = html.replace("<head>", '<head><meta name="theme-color" content="#15120f">', 1)
    assert html.count("/studio10-premium.css") == 1
    page.write_text(html, encoding="utf-8")

sw_path = OUT / "service-worker.js"
sw = sw_path.read_text(encoding="utf-8")
old_cache = "fotopolis-studio-2026-11-08-v10-finish"
new_cache = "fotopolis-studio-2026-11-08-v10-premium-candidate"
assert old_cache in sw and "/brand-finish.css" in sw
sw = sw.replace(old_cache, new_cache, 1)
sw = sw.replace("'/brand-finish.css',",
                "'/brand-finish.css', '/studio10-premium.css',", 1)
assert sw.count("/studio10-premium.css") == 1
sw_path.write_text(sw, encoding="utf-8")

source_designs = SOURCE / "assets/designvorlagen"
finished_designs = OUT / "assets/designvorlagen"
assert len(list(finished_designs.glob("fp-*.webp"))) == 32
audit_previous = json.loads((QA / "studio95-audit.json").read_text(encoding="utf-8"))
template_records = {x["id"]: x for x in audit_previous["items"] if "id" in x}
assert len(template_records) == 32
assert hashlib.sha256((OUT / "assets/fotopolis-goldmark.webp").read_bytes()).digest() == (
    hashlib.sha256((ROOT / "site/assets/fotopolis-goldmark.webp").read_bytes()).digest()
), "Master logo altered"

comparison = Image.new("RGB", (1600, 8 * 310), (24, 20, 16))
zoom_sheet = Image.new("RGB", (1600, 8 * 330), (24, 20, 16))
drawer = ImageDraw.Draw(comparison)
zoom_drawer = ImageDraw.Draw(zoom_sheet)
results = []
for index in range(1, 33):
    ident = f"FP-{index:03d}"
    name = f"fp-{index:03d}.webp"
    original = Image.open(source_designs / name).convert("RGB")
    processed = Image.open(finished_designs / name).convert("RGB")
    record = template_records[ident]
    assert original.size == processed.size, ident + " dimensions changed"
    cx, cy = record["x"], record["y"]
    erased = record["oldLogoCleanupRadius"]
    # The old badge region is the only permitted changed portion. Our prior
    # stage also checks this in detail. This repeated check guards regressions.
    width, height = original.size
    outside_boxes = (
        (0, 0, width, max(0, cy-erased-4)),
        (0, max(0, cy-erased-4), max(0, cx-erased-4), min(height, cy+erased+4)),
        (min(width, cx+erased+4), max(0, cy-erased-4), width, min(height, cy+erased+4)),
        (0, min(height, cy+erased+4), width, height),
    )
    for bounds in outside_boxes:
        if bounds[2] > bounds[0] and bounds[3] > bounds[1]:
            assert ImageChops.difference(original.crop(bounds), processed.crop(bounds)).getbbox() is None, (
                ident, "unexpected alterations outside badge area", bounds)
    col = (index-1) % 4
    row = (index-1) // 4
    x0, y0 = col*400, row*310
    for side, picture in enumerate((original, processed)):
        thumb = ImageOps.contain(picture, (191, 256))
        comparison.paste(thumb, (x0 + side*198 + (194-thumb.width)//2, y0 + 26))
    drawer.text((x0+15,y0+7), f"{ident} | Original / Kandidat", fill=(237,204,152))
    # Enlarged before-and-after real raster crops at 300%; never upsample the master.
    crop_radius = min(max(erased+12, 60), cx, cy, width-cx, height-cy)
    crop_box = (cx-crop_radius, cy-crop_radius, cx+crop_radius, cy+crop_radius)
    for side, picture in enumerate((original, processed)):
        patch = picture.crop(crop_box)
        enlarged = patch.resize((190, 276), Image.Resampling.NEAREST)
        zoom_sheet.paste(enlarged, (x0+side*198+4, y0+27))
    zoom_drawer.text((x0+12,y0+8), ident + " · 300%-Ansicht (Ausschnitt)", fill=(237,204,152))
    results.append({
        "id": ident,
        "source": f"concepts/premium-v2/assets/designvorlagen/{name}",
        "processed": f"assets/designvorlagen/{name}",
        "size": list(original.size),
        "sourcePreservedOutsideBadge": True,
        "programmaticValidation": "passed",
        "manualLogoRetouchReview": "pending",
        "manualReviewNote": "Check seams, legacy seal remnants, edge clearance and text legibility at 200%+.",
    })

QA.mkdir(parents=True, exist_ok=True)
comparison.save(QA / "studio10-before-after.webp", "WEBP", quality=87, method=5)
zoom_sheet.save(QA / "studio10-zoom-300pct.webp", "WEBP", quality=91, method=5)
report = {
    "version": BRANCH_VERSION,
    "releaseStatus": "NOT APPROVED - human visual review and browser tests outstanding",
    "sourceSafety": "Original artworks and approved brand logo preserved in repository",
    "automated": {"templates": 32, "publicPages": len(pages), "imageRegionsPreserved": True},
    "visualReview": "pending",
    "responsiveBrowserReview": "pending",
    "formRegressionReview": "pending",
    "templates": results,
}
(QA / "studio10-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2),
                                          encoding="utf-8")
cards = "".join(
    f'<li><strong>{escape(item["id"])}</strong> – Technische Prüfung bestanden; '
    f'<em>manuelle Retuschefreigabe offen</em></li>'
    for item in results
)
review_html = f"""<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="robots" content="noindex,nofollow">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Studio 10 · Interne visuelle Abnahme</title>
<style>body{{margin:0;background:#15120f;color:#f8f4ec;font:16px/1.6 system-ui,sans-serif}}
main{{max-width:1280px;margin:auto;padding:clamp(20px,4vw,60px)}}
h1{{font:500 clamp(34px,5vw,62px) Georgia,serif}}
strong{{color:#eed2a0}}img{{max-width:100%;height:auto;display:block;border:1px solid #6c5332}}
section{{margin-block:40px}}a{{color:#eed2a0}}li{{padding:4px}}.warning{{border-left:3px solid #d8b678;padding:14px;background:#2c241b}}
</style></head><body><main><h1>Studio 10.0 – interne Bildabnahme</h1>
<p class="warning"><strong>Keine visuelle Freigabe.</strong> Automatische Pixelprüfungen
belegen keine professionelle Retusche. Alle 32 Logos und 3 Produktgeräte benötigen
eine manuelle Einzelabnahme, bevor die Haupt-Testwebsite aktualisiert werden darf.</p>
<section><h2>Original/Kandidat – 32 Vorlagen</h2>
<img src="/qa/studio10-before-after.webp" alt="Vergleichsübersicht aller 32 Layouts"></section>
<section><h2>Vergrößerte Logos</h2>
<img src="/qa/studio10-zoom-300pct.webp" alt="Original und Kandidat in 300-Prozent-Ausschnitten"></section>
<section><h2>Einzelstatus</h2><ol>{cards}</ol></section>
<p><a href="/qa/studio10-report.json">Maschinenlesbares Auditprotokoll</a></p>
</main></body></html>"""
(QA / "studio10-review.html").write_text(review_html, encoding="utf-8")
print(f"STUDIO 10 CANDIDATE: {len(pages)} public pages themed; 32 template "
      "source/target pairs checked; review assets generated. HUMAN QA STILL REQUIRED.")
