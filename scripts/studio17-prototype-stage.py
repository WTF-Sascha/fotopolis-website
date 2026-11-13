#!/usr/bin/env python3
"""Stage Studio-17 *UX only* in an isolated Netlify Deploy Preview.
No mutations to the real admin application, API, PWA or production database.
Must run AFTER the current published preview build and brand pass.
"""
from __future__ import annotations
import hashlib
import os
import shutil
from pathlib import Path

root=Path(__file__).resolve().parents[1]
source=root/"concepts/studio17-prototype"
target=root/"preview-build/studio17-konzept"
if os.environ.get("CONTEXT")=="production":
    raise SystemExit("NO-GO: Studio 17 concept must never be published in production")
names=("index.html","studio17.css","studio17.js")
for name in names:
    if not (source/name).is_file():
        raise SystemExit(f"Missing Studio 17 source: {name}")
if not (root/"preview-build/admin/dashboard/index.html").is_file():
    raise SystemExit("Build/harden existing admin first; concept is not a replacement")
if not (root/"preview-build/assets/fotopolis-goldmark.webp").is_file():
    raise SystemExit("Exact approved FOTOPOLIS master not available")
target.mkdir(parents=True,exist_ok=True)
for name in names:
    shutil.copy2(source/name,target/name)
    assert hashlib.sha256((source/name).read_bytes()).digest()==hashlib.sha256((target/name).read_bytes()).digest()
html=(target/"index.html").read_text(encoding="utf-8")
assert '<meta name="robots" content="noindex,nofollow,noarchive">' in html
assert 'DEMODATEN · KEINE SPEICHERUNG' in html
assert html.count('data-screen=')==7, "Exactly six main areas and settings required"
assert html.count('data-nav=')==7, "Exactly six nav options and settings required"
print("FOTOPOLIS STUDIO 17: isolated clickable UX concept staged at /studio17-konzept/; live admin unaffected")
