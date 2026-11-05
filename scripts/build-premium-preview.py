#!/usr/bin/env python3
"""Build a self-contained, review-only FOTOPOLIS V2 deploy from the approved development branch.
No secrets, API calls, extra tracking, or deployment to the production website."""
from pathlib import Path
import re, shutil

root = Path(__file__).resolve().parents[1]
source = root / "concepts/premium-v2"
target = root / "preview-build"
photos = ("LEG-068.webp", "LEG-014.webp", "LEG-019.webp",
          "LEG-060.webp", "LEG-073.webp", "LEG-046.webp")
if target.exists():
    shutil.rmtree(target)
(target / "assets/images").mkdir(parents=True)
for name in ("styles.css", "site.js"):
    shutil.copy2(source / name, target / name)
shutil.copy2(root / "site/assets/fotopolis-logo-original.png",
             target / "assets/fotopolis-logo-original.png")
shutil.copy2(root / "site/favicon.ico", target / "favicon.ico")
for name in photos:
    shutil.copy2(root / "review-assets/legacy" / name,
                 target / "assets/images" / name)
html = (source / "index.html").read_text(encoding="utf-8")
html = html.replace("../../site/assets/fotopolis-logo-original.png",
                    "/assets/fotopolis-logo-original.png")
html = html.replace("../../site/favicon.ico", "/favicon.ico")
html = html.replace("../../review-assets/legacy/", "/assets/images/")
html = html.replace('<link rel="stylesheet" href="./styles.css">',
                    '<link rel="stylesheet" href="/styles.css">')
html = html.replace('<script defer src="./site.js"></script>',
                    '<script defer src="/site.js"></script>')
# Strictly forbid accidental publication of unreviewed paths or source-only links.
assert "../../" not in html
assert html.count("<h1") == 1
assert all(("/assets/images/" + name) in html for name in photos)
(target / "index.html").write_text(html, encoding="utf-8")
# Build QA: all referenced local assets must exist.
for found in re.finditer(r'(?:src|href)="(/[^"#?]+)"', html):
    ref = found.group(1)
    assert (target / ref.lstrip("/")).exists(), f"Missing preview asset {ref}"
print("FOTOPOLIS V2 Deploy Preview prepared: 1 HTML, CSS, JS, approved logo, favicon, 6 curated review photographs")
