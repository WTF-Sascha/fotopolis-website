#!/usr/bin/env python3
"""Apply FOTOPOLIS Gold Signature to public preview output after Studio 9.
Approved original image remains in source; no live domain or admin screen touched.
"""
from pathlib import Path
from shutil import copy2
import re

root = Path(__file__).resolve().parents[1]
out = root / "preview-build"
source = root / "site/assets/fotopolis-goldmark.webp"
asset = out / "assets/fotopolis-goldmark.webp"
assert source.is_file() and source.stat().st_size > 4000, "Gold logo asset missing"
assert out.joinpath("kontakt/index.html").is_file(), "Studio 9 build must run first"
copy2(source, asset)
copy2(root / "concepts/premium-v2/brand-gold.css", out / "brand-gold.css")

pages = sorted(out.rglob("index.html"))
pages = [p for p in pages if "admin" not in p.relative_to(out).parts]
assert len(pages) >= 14, f"Public page count changed: {len(pages)}"
mark_count = 0
for path in pages:
    markup = path.read_text(encoding="utf-8")
    assert markup.count("</head>") == 1, path
    before = markup.count("/assets/fotopolis-logo-original.png")
    assert before >= 2, f"Missing shared header/footer logo on {path}"
    mark_count += before
    markup = markup.replace("/assets/fotopolis-logo-original.png", "/assets/fotopolis-goldmark.webp")
    markup = markup.replace('href="/favicon.ico"', 'href="/assets/fotopolis-goldmark.webp" type="image/webp"')
    markup = re.sub(r'(<meta name="theme-color" content=")[^"]+(")', r'\g<1>#18120e\2', markup)
    markup = markup.replace("</head>", '<link rel="stylesheet" href="/brand-gold.css"></head>', 1)
    if path == out / "index.html":
        assert 'id="hero-title"' in markup and "fotospiegel-hero-lossless.webp" in markup
    if path == out / "kontakt/index.html":
        assert 'name="fotopolis-studio9-anfrage"' in markup
    if path == out / "designvorlagen/index.html":
        assert "data-design-gallery" in markup
    path.write_text(markup, encoding="utf-8")

sw_path = out / "service-worker.js"
sw = sw_path.read_text(encoding="utf-8")
assert "fotopolis-studio-2026-11-08-v5" in sw
assert "'/assets/fotopolis-logo-original.png'," in sw
sw = sw.replace("fotopolis-studio-2026-11-08-v5", "fotopolis-studio-2026-11-08-v6-gold")
sw = sw.replace("'/assets/fotopolis-logo-original.png',", "'/assets/fotopolis-goldmark.webp', '/brand-gold.css',")
sw_path.write_text(sw, encoding="utf-8")
assert mark_count >= len(pages) * 2
assert "data-netlify" in (out / "kontakt/index.html").read_text()
print(f"FOTOPOLIS GOLD: branded {len(pages)} public routes, {mark_count} shared logo placements, updated PWA cache")
