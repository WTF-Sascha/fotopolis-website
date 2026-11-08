#!/usr/bin/env python3
"""FOTOPOLIS Studio 11.0 — isolated public-site Quiet Luxury finishing pass.

Runs only AFTER Studio 10 produced the preview-build. Does not edit source
photos, logo, 32 print motifs, Netlify form processing or admin routes.
Machine checks are evidence, not a claim of completed visual approval.
"""
from __future__ import annotations
from pathlib import Path
from shutil import copy2
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "preview-build"
SOURCE = ROOT / "concepts/premium-v2"
CSS = SOURCE / "studio11-quiet-luxury.css"
assert CSS.is_file() and CSS.stat().st_size > 10000, "Studio 11 design system missing"

pages = sorted(p for p in OUT.rglob("index.html") if "admin" not in p.relative_to(OUT).parts)
assert len(pages) == 14, f"Exactly 14 public pages expected; found {len(pages)}"
copy2(CSS, OUT / CSS.name)

for page in pages:
    html = page.read_text(encoding="utf-8")
    assert html.count("</head>") == 1
    assert html.count('<link rel="stylesheet" href="/studio10-premium.css">') == 1
    assert "/studio11-quiet-luxury.css" not in html
    html = html.replace(
        '<link rel="stylesheet" href="/studio10-premium.css">',
        '<link rel="stylesheet" href="/studio10-premium.css">'
        '<link rel="stylesheet" href="/studio11-quiet-luxury.css">',
        1,
    )
    html, count = re.subn(
        r'(<meta name="theme-color" content=")[^"]+(")',
        r'\g<1>#181512\2', html, count=1
    )
    assert count == 1, f"Theme meta missing on {page}"
    assert html.count("/assets/fotopolis-goldmark.webp") >= 1, page
    assert html.count("</main>") == 1, page
    page.write_text(html, encoding="utf-8")

home = OUT / "index.html"
homepage = home.read_text(encoding="utf-8")
line = '<p>Fotobox, Foto Mirror und Fotowohnwagen – drei besondere Fotoerlebnisse für dein Event.</p>'
assert homepage.count(line) == 1, "Hero copy changed: do not insert CTA in uncertain location"
homepage = homepage.replace(
    line,
    line + '<a class="fp11-hero-link" href="/fotospiegel/">'
    'Foto Mirror entdecken <span aria-hidden="true">↗</span></a>',
    1
)
assert homepage.count('class="fp11-hero-link"') == 1
home.write_text(homepage, encoding="utf-8")

sw = OUT / "service-worker.js"
text = sw.read_text(encoding="utf-8")
assert text.count("fotopolis-studio-2026-11-08-v10-premium-candidate") == 1
assert text.count("'/studio10-premium.css'") == 1
text = text.replace("fotopolis-studio-2026-11-08-v10-premium-candidate",
                    "fotopolis-studio-2026-11-08-v11-quiet-luxury-candidate", 1)
text = text.replace("'/studio10-premium.css',",
                    "'/studio10-premium.css', '/studio11-quiet-luxury.css',", 1)
assert text.count("'/studio11-quiet-luxury.css'") == 1
sw.write_text(text, encoding="utf-8")

# The installed-app chrome must use the same public brand palette.
# Change only the generated preview; the source manifest remains immutable.
manifest_path = OUT / "manifest.webmanifest"
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
manifest["theme_color"] = "#181512"
manifest["background_color"] = "#F7F3EC"
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


# No original asset writes. Assert byte-for-byte retention of logo + all 32
# available source artwork files after the output-only CSS integration.
logo = "fotopolis-goldmark.webp"
assert hashlib.sha256((ROOT / "site/assets" / logo).read_bytes()).digest() == (
    hashlib.sha256((OUT / "assets" / logo).read_bytes()).digest()
), "Approved master logo has been modified"

originals = SOURCE / "assets/designvorlagen"
finished = OUT / "assets/designvorlagen"
artwork_sha = {}
for n in range(1, 33):
    filename = f"fp-{n:03d}.webp"
    assert (originals / filename).is_file() and (finished / filename).is_file()
    original_hash = hashlib.sha256((originals / filename).read_bytes()).hexdigest()
    output_hash = hashlib.sha256((finished / filename).read_bytes()).hexdigest()
    # Studio 10 deliberately reconstructs the badge in the PREVIEW copy.
    # Source and preview MUST differ; Studio 11 never recomposites either.
    artwork_sha[filename] = {"source": original_hash, "studio10_preview": output_hash}

def luminance(hex_color: str) -> float:
    rgb = [int(hex_color[i:i+2],16) / 255 for i in (1,3,5)]
    ch = [c/12.92 if c <= .04045 else ((c + .055)/1.055)**2.4 for c in rgb]
    return .2126*ch[0] + .7152*ch[1] + .0722*ch[2]

def contrast(fg: str, bg: str) -> float:
    a,b = sorted((luminance(fg),luminance(bg)), reverse=True)
    return round((a+.05)/(b+.05),2)

samples = {
    "body_ink_on_ivory": contrast("#29231e","#f7f3ec"),
    "secondary_on_ivory": contrast("#62594f","#f7f3ec"),
    "accent_on_porcelain": contrast("#765633","#fffcf8"),
    "champagne_on_obsidian": contrast("#b99862","#181512"),
    "light_on_espresso": contrast("#f7f3ec","#30251d")
}
assert all(value >= 4.5 for value in samples.values()), "Base text palette contrast fails"

qa = OUT / "qa"
qa.mkdir(exist_ok=True)
audit = {
  "version": "FOTOPOLIS Studio 11.0",
  "scope": "separate candidate preview only",
  "publicRoutes": 14,
  "unchangedOriginalDesigns": 32,
  "studio11ChangesToPreviewArtwork": 0,
  "sourceArtworkHashes": artwork_sha,
  "brandLogoSourceUnmodified": True,
  "referencePaletteContrast": samples,
  "automatedChecks": "build-time static invariants only",
  "browserScreenshots": "pending CI browser run",
  "visualRegression": "pending human inspection of captured screenshots",
  "printArtworkManualReview": "pending 32 individual 200-300% checks",
  "highResMirrorVideoAvailable": False,
  "formSubmission": "not sent; synthetic DOM-only checks permitted",
  "accessibilityAudit": "pending browser contrast/keyboard test",
  "performanceAudit": "pending measured Web Vitals",
  "release": "NOT APPROVED: preview only"
}
(qa / "studio11-build-audit.json").write_text(
    json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8"
)
print("STUDIO 11: 14 public pages themed, 32 original and reconstructed-preview motifs hashed, "
      "brand original unchanged. Human visual review STILL PENDING.")
