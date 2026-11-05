#!/usr/bin/env python3
"""Build a self-contained, review-only FOTOPOLIS V2 deploy from the approved development branch.
No secrets, API calls, extra tracking, or deployment to the production website."""
from pathlib import Path
import re, shutil, hashlib

root = Path(__file__).resolve().parents[1]
source = root / "concepts/premium-v2"
target = root / "preview-build"
photos = ("LEG-060.webp", "LEG-073.webp", "LEG-046.webp")
product_photos = ["fotobox-event-1672.webp","fotobox-event-800.webp","fotowohnwagen-gartenparty-1448.webp","fotowohnwagen-gartenparty-760.webp"]
if target.exists():
    shutil.rmtree(target)
(target / "assets/images").mkdir(parents=True)
for name in ("styles.css", "site.js", "package-planner.js", "gallery-viewer.js"):
    shutil.copy2(source / name, target / name)
shutil.copy2(root / "site/assets/fotopolis-logo-original.png",
             target / "assets/fotopolis-logo-original.png")
shutil.copy2(root / "site/favicon.ico", target / "favicon.ico")
for name in photos:
    shutil.copy2(root / "review-assets/legacy" / name,
                 target / "assets/images" / name)
# SHA-256 verification of original uploads and precisely encoded WebP derivatives.
for name, expected_hash in {"upload-a.png":"7539ff8fb703d94f461b8a88f49059d236357ee31815e7e7a71a975c501e609b","upload-b.png":"9c77a0fb7d61b80a69c5dad885ed5f0e58324a1c0080c77882a71f518c10a3e4","upload-c.png":"8df769dc97ca651520991c6d53cad794daa2d3896bd7f6b87e85743a463b2ee1"}.items():
    assert hashlib.sha256((source / "assets/incoming" / name).read_bytes()).hexdigest() == expected_hash, f"Original PNG mismatch: {name}"
for name, expected_hash in {"fotobox-event-1672.webp":"ff7a1db74919e2d64f9919c4d82136357ae1b03b4347cab221a801811b8830d1","fotobox-event-800.webp":"6a23627fa229b91bccd6922bd1a16beb43ee8682de788e8e2e98f30e10274e80","fotowohnwagen-gartenparty-1448.webp":"056ed5c167fb2e1954d0ebf00747ecfd77a21588bd162ef861a8f37e3cf776cc","fotowohnwagen-gartenparty-760.webp":"67c11ea6edc7df2ba342e6c8c3054d8abb2ef384e06d9b638c161d8d0bb7b8c6"}.items():
    webp = source / "assets/products" / name
    assert hashlib.sha256(webp.read_bytes()).hexdigest() == expected_hash, f"Optimized product file mismatch: {name}"
    shutil.copy2(webp, target / "assets/images" / name)
shutil.copy2(source / "assets/fotospiegel-hero-lossless.webp",
             target / "assets/images/fotospiegel-hero-lossless.webp")
expected = "c9a493de7b479b13253e1c7ba91da6d8fc5cd775f918c84c5881a71efe640241"
actual = hashlib.sha256((target / "assets/images/fotospiegel-hero-lossless.webp").read_bytes()).hexdigest()
assert actual == expected, "User image checksum changed unexpectedly"
html = (source / "index.html").read_text(encoding="utf-8")
html = html.replace("../../site/assets/fotopolis-logo-original.png",
                    "/assets/fotopolis-logo-original.png")
html = html.replace("../../site/favicon.ico", "/favicon.ico")
html = html.replace("../../review-assets/legacy/", "/assets/images/")
html = html.replace("./assets/fotospiegel-hero-lossless.webp",
                    "/assets/images/fotospiegel-hero-lossless.webp")
html = html.replace("./assets/products/", "/assets/images/")
html = html.replace('<link rel="stylesheet" href="./styles.css">',
                    '<link rel="stylesheet" href="/styles.css">')
html = html.replace('<script defer src="./site.js"></script>',
                    '<script defer src="/site.js"></script>')
# Strictly forbid accidental publication of unreviewed paths or source-only links.
assert "../../" not in html
assert html.count("<h1") == 1
assert all(("/assets/images/" + name) in html for name in photos)
assert html.count("/assets/images/fotospiegel-hero-lossless.webp") == 1  # product card only
assert '<section class="hero hero-editorial"' in html and '<nav class="hero-guide"' in html, "Missing photo-free editorial hero"
assert "<img" not in html.split('<section class="hero hero-editorial"',1)[1].split("</section>",1)[0], "No images allowed in hero"
assert all('href="#'+a+'"' in html and 'id="'+a+'"' in html for a in ("fotobox","fotospiegel","fotowohnwagen")), "Hero guide anchors must match products"
assert "LEG-019.webp" not in html and "LEG-014.webp" not in html, "No misleading legacy product visuals"
assert "pending-approved-file" not in html and "legacy-reference" not in html, "Outdated placeholder"
assert html.count('data-asset-status="approved-user-upload"') == 2, "Both approved scenes needed"
assert all("/assets/images/" + name in html for name in product_photos), "Responsive assets not linked"
(target / "index.html").write_text(html, encoding="utf-8")
# Build dedicated editorial pages from a single, reviewed content manifest.
# This runs only for Netlify deploy-preview / branch-deploy contexts, never production.
from build_premium_pages import build_pages
routes = build_pages(source, target, html)
assert routes == [
    "fotobox","fotospiegel","fotowohnwagen","pakete","galerie",
    "anlaesse","ueber-uns","faq","kontakt","impressum","datenschutz"
], f"Unexpected route inventory: {routes}"

# Build QA: all referenced local assets must exist.
for match in re.finditer(r'srcset="([^"]+)"', html):
    for entry in match.group(1).split(","):
        ref = entry.strip().split()[0]
        assert ref.startswith("/assets/images/") and (target / ref.lstrip("/")).exists(), f"Missing srcset file {ref}"

for found in re.finditer(r'(?:src|href)="(/[^"#?]+)"', html):
    ref = found.group(1)
    assert (target / ref.lstrip("/")).exists(), f"Missing preview asset {ref}"
# No edits to the approved logo; exact copy verified byte-for-byte.
assert hashlib.sha256((target / "assets/fotopolis-logo-original.png").read_bytes()).digest() == hashlib.sha256((root / "site/assets/fotopolis-logo-original.png").read_bytes()).digest()
print(f"FOTOPOLIS V2.8: {len(routes)} editorial pages and accessible dropdown navigation; image-free hero and approved assets remain unchanged")
