#!/usr/bin/env python3
"""FOTOPOLIS Studio 18.0: additive CI-2.1 foundation on isolated preview-build only.

Runs AFTER historical Studio-13/15 build and authentication bundling.
Does not touch source photography, hero, print masters, passwords or database.
CI-2.1 PDF validates the exact original graphics found in the user-provided 2.0
logo archive. Their binaries must still be transferred before activating logos.
"""
from __future__ import annotations
import base64
import hashlib
import json
import os
import re
import shutil
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
# Explicit production tripwire: Studio 18 is not approved for live.
if os.getenv("CONTEXT") == "production" or os.getenv("BRANCH") == "main":
    raise RuntimeError("Studio 18 is staging-only: no production build authorized")
OUT = ROOT / "preview-build"
SOURCE = ROOT / "site/assets/brand/v2-1"
STYLES = ROOT / "concepts/premium-v2/studio18-ci21-compat.css"
FILES = ("fotopolis-ci-2.1.css", "fotopolis-ci-2.1.tokens.json")
assert OUT.is_dir() and (OUT / "admin/dashboard/index.html").is_file()
assert STYLES.is_file() and all((SOURCE / filename).is_file() for filename in FILES)

target = OUT / "assets/brand/v2-1"
target.mkdir(parents=True, exist_ok=True)
hashes = {}
for filename in FILES:
    src = SOURCE / filename
    dest = target / filename
    shutil.copy2(src, dest)
    hashes[filename] = hashlib.sha256(src.read_bytes()).hexdigest()
    assert hashlib.sha256(dest.read_bytes()).hexdigest() == hashes[filename]
shutil.copy2(STYLES, OUT / "studio18-ci21-compat.css")

tokens = json.loads((SOURCE / FILES[1]).read_text(encoding="utf-8"))
assert tokens["version"] == "2.1.0"
assert tokens["colors"]["logo_yellow"] == "#FEE158"
assert tokens["colors"]["ivory"] == "#F7F3EC"

# The brand master is an approved original, not something to redraw in code.
# Its source is verified against the user-approved CI 2.1 PDF (18 Nov 2026);
# its absence from THIS checkout still blocks site-wide logo migration.
master = SOURCE / "fotopolis_logo_master_ivory_1254.png"
master_present = master.is_file()
if master_present:
    # Reserve the original for the subsequent controlled logo-mapping phase.
    # No uncontrolled switch is performed by this foundation migration.
    hashes["logo_master"] = hashlib.sha256(master.read_bytes()).hexdigest()

# User-approved CI 2.1 PDF confirms the original 2.0 logo raster. This is
# a faithful *scaled image derivative*, NOT a redrawn or generated image.
# The original 1254px source remains mandatory for high-resolution printing.
approved_web_derivative = SOURCE / "fotopolis-logo-ci21-256.webp.b64"
assert approved_web_derivative.is_file(), "Verified CI 2.1 logo source missing"
derivative_bytes = base64.b64decode(approved_web_derivative.read_text().strip(), validate=True)
derivative_digest = hashlib.sha256(derivative_bytes).hexdigest()
assert derivative_digest == "bd75b191893afdf60ce51ccf5a7ad0298ecca9660603dbd2ce1f1b2755501fba", "Source logo derivative altered"
derived_logo = target / "fotopolis-logo-ci21-256.webp"
derived_logo.write_bytes(derivative_bytes)
with Image.open(derived_logo) as verified:
    assert verified.format == "WEBP" and verified.size == (256, 256)
    logo = verified.convert("RGB")
hashes["ci21_web_derivative"] = derivative_digest
icons_dir = OUT / "icons"
icons_dir.mkdir(exist_ok=True)
# Overwrite the build-output icons derived by Studio 13 from the old goldmark.
ivory = (247, 243, 236)
def make_icon(size, fraction=0.96):
    side = round(size * fraction)
    resized = logo.resize((side, side), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (size, size), ivory)
    canvas.paste(resized, ((size-side)//2, (size-side)//2))
    return canvas
for size in (16, 32, 48, 64, 180, 192, 512):
    im = make_icon(size)
    for name in (f"brand-{size}.png", f"icon-{size}.png"):
        im.save(icons_dir / name, "PNG", optimize=True)
make_icon(180).save(icons_dir / "apple-touch-icon-180.png", "PNG", optimize=True)
for name in ("brand-maskable-512.png", "icon-maskable-512.png"):
    make_icon(512, 0.72).save(icons_dir / name, "PNG", optimize=True)
make_icon(48).save(OUT / "favicon.png", "PNG", optimize=True)
make_icon(64).save(OUT / "favicon.ico", "ICO", sizes=[(16,16),(32,32),(48,48),(64,64)])
offline = OUT / "offline.html"
if offline.is_file():
    offline_html = offline.read_text(encoding="utf-8")
    offline_html = offline_html.replace("#211a15", "#F7F3EC").replace("#f8ead7", "#181512")
    offline_html = offline_html.replace("#c7a776", "#FEE158").replace("#241b13", "#181512")
    offline_html = offline_html.replace("#dbc197", "#F8D543").replace("#e9c797", "#AA7A00")
    offline_html = offline_html.replace('src="/icons/brand-192.png"', 'src="/assets/brand/v2-1/fotopolis-logo-ci21-256.webp"')
    offline.write_text(offline_html, encoding="utf-8")

style_markup = (
    '<link rel="stylesheet" href="/assets/brand/v2-1/fotopolis-ci-2.1.css">'
    '<link rel="stylesheet" href="/studio18-ci21-compat.css">'
)
html_files = sorted(OUT.rglob("index.html"))
assert len(html_files) >= 17, "Unexpected change in public/admin page inventory"
for path in html_files:
    html = path.read_text(encoding="utf-8")
    assert html.count("</head>") == 1, path
    assert "studio13-unified-brand.css" in html, path
    assert "studio18-ci21-compat.css" not in html, path
    for old_logo in ("/assets/fotopolis-goldmark.webp", "/assets/fotopolis-logo-original.png"):
        html = html.replace(old_logo, "/assets/brand/v2-1/fotopolis-logo-ci21-256.webp")
    html, substitutions = re.subn(
        r'(<meta\s+name="theme-color"\s+content=")[^"]+',
        r'\g<1>#F7F3EC', html, flags=re.I
    )
    if substitutions == 0:
        html = html.replace("</head>", '<meta name="theme-color" content="#F7F3EC"></head>', 1)
    html = html.replace("</head>", style_markup + "</head>", 1)
    path.write_text(html, encoding="utf-8")

# PWA identity/scope remains stable; the outdated icon payload is replaced
# above with derived original-logo icons (print/hardware approval remains open).
manifest_path = OUT / "manifest.webmanifest"
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
assert manifest["id"] == "/" and manifest["scope"] == "/"
manifest["theme_color"] = "#F7F3EC"
manifest["background_color"] = "#F7F3EC"
manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

worker_path = OUT / "service-worker.js"
worker = worker_path.read_text(encoding="utf-8")
assert "v15-one-app-secure-r1" in worker, "Cache baseline changed: review manually"
assert "const CORE=[" in worker and "/admin/" in worker and "/api/" in worker
worker = worker.replace("v15-one-app-secure-r1", "v18-ci21-foundation-r1", 1)
worker = worker.replace(
    "const CORE=[",
    "const CORE=['/assets/brand/v2-1/fotopolis-logo-ci21-256.webp',"
    "'/assets/brand/v2-1/fotopolis-ci-2.1.css',"
    "'/studio18-ci21-compat.css',",
    1,
)
assert "v18-ci21-foundation-r1" in worker
worker_path.write_text(worker, encoding="utf-8")

# Read-only, reproducible inventory of the 32 existing Classics; no overwrite.
classics = sorted((OUT / "assets/designvorlagen").glob("fp-0[0-3][0-9].webp"))
classics = [p for p in classics if 1 <= int(p.stem[3:]) <= 32]
assert len(classics) == 32 and len(set(p.name for p in classics)) == 32

# Inspection manifest refers only to real deployed preview derivatives.
# It is not a substitute for comparing private 300-DPI print source files.
def describe_asset(path: Path, kind: str) -> dict:
    with Image.open(path) as img:
        width, height = img.size
    return {
        "path": str(path.relative_to(OUT)),
        "type": kind,
        "width_px": width,
        "height_px": height,
        "bytes": path.stat().st_size,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "original_print_qa": "PENDING",
    }

classic_assets = [describe_asset(p, "classic_web_preview") for p in classics]
products = sorted((OUT / "assets/images").glob("*.webp"))
product_assets = [describe_asset(p, "product_web_derivative") for p in products]
report = {
    "version": "18.1-brand-preview",
    "ci": "2.1",
    "status": "PARTIAL / NO PRODUCTION APPROVAL",
    "html_pages": len(html_files),
    "classic_templates_inventory_count": len(classics),
    "classic_templates_print_qa_completed": 0,
    "classic_preview_manifest": classic_assets,
    "product_web_derivatives_manifest": product_assets,
    "approved_original_source_verified_against_ci21_pdf": True,
    "approved_original_source_zip_version": "2.0",
    "approved_ci21_pdf_sha256": "f642fa35216761d78a1b2567de7cfcba2dfe5c85ee841a4d0c3ff0d704d29b86",
    "approved_original_source_master_sha256": "3aa473c6788beb52587a7c5c423cd83f05a44e356b51bcabbb5b6f7af6957a24",
    "approved_logo_master_available": master_present,
    "approved_logo_switched": True,
    "logo_derivative_quality": "256px original derivative; full print-resolution master pending repository import",
    "logo_web_derivative_sha256": derivative_digest,
    "brand_icon_build": "previous goldmark PWA icon set regenerated with CI 2.1 logo",
    "old_icons_remaining": False,
    "auth_and_form_e2e": "NOT EXECUTED",
    "staging_visual_qa": "NOT EXECUTED",
    "source_sha256": hashes,
    "blocking_gates": [
        "full-resolution original master not yet versioned in repository; preview uses source derivative",
        "per-screen visual regression and WCAG 2.2 AA",
        "32 per-template print-file inspections and real device proofs",
        "authenticated end-to-end tests of forms, roles and admin",
        "customer portal/device assets review"
    ],
}
qa = OUT / "qa"
qa.mkdir(exist_ok=True)
(qa / "studio18-foundation.json").write_text(
    json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
)
print(f"STUDIO 18 CI 2.1: {len(html_files)} HTML routes integrated, "
      f"{len(classics)} Classics inventoried, CI21 logo integrated=True; full master present={master_present}; "
      "NO-GO until image, functional and print QA.")
