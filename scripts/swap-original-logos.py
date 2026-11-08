#!/usr/bin/env python3
"""Surgical FOTOPOLIS logo swap in the approved *existing* WebP artwork.

Do not regenerate, recolor, crop or redesign any original frame or product.
The archived source assets stay byte-identical; only the public build's copies
are updated. Output is LOSSLESS WebP: decoded pixels outside the logo patches
must match the original exactly, checked for every generated image.
"""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageFilter
import re

root=Path(__file__).resolve().parents[1]
source=root/"concepts/premium-v2/assets"
out=root/"preview-build"
logo_file=root/"site/assets/fotopolis-goldmark.webp"
assert logo_file.exists()
logo=Image.open(logo_file).convert("RGB")
assert logo.width>40 and logo.height>40

# Proportions based on the *existing* logo in each original design.
# The small badge in 001–022 and the larger badge in 023–032 are deliberately
# kept in their original size and original lower-right position.
badge_positions = {
 23:(.940,.909,.0378),24:(.939,.910,.0390),
 25:(.931,.894,.0445),26:(.939,.905,.0398),
 27:(.936,.900,.0410),28:(.940,.911,.0390),
 29:(.941,.911,.0395),30:(.937,.906,.0405),
 31:(.941,.904,.0400),32:(.941,.918,.0395),
}
for i in range(1,23):
    badge_positions[i]=(.952,.935,.0240)

# Screen positions in the *existing* Fotobox and Mirror photography; source
# camera, device, people, decor and background are not touched.
product_badges={
 "fotobox-event-1672.webp":(.501,.412,.0435),
 "fotobox-event-800.webp":(.501,.412,.0435),
 "fotospiegel-hero-lossless.webp":(.501,.400,.1840),
}
changed=[]
def replace_badge(input_path:Path,output_path:Path,loc:tuple[float,float,float]):
    assert input_path.is_file(),input_path
    original=Image.open(input_path).convert("RGB")
    w,h=original.size
    cx,cy,relradius=loc
    radius=max(8,round(w*relradius))
    # Only the pixel-disk occupied by the former round logo is replaced.
    center_x=round(w*cx);center_y=round(h*cy)
    left=center_x-radius;top=center_y-radius
    diameter=radius*2
    assert left>=0 and top>=0 and left+diameter<=w and top+diameter<=h,input_path
    badge=logo.resize((diameter,diameter),Image.Resampling.LANCZOS)
    alpha=Image.new("L",(diameter,diameter),0)
    dr=ImageDraw.Draw(alpha)
    dr.ellipse((0,0,diameter-1,diameter-1),fill=255)
    # A one-pixel antialiased perimeter (at thumbnail size) prevents square
    # edges and does not alter any pixels outside the logo disk.
    alpha=alpha.filter(ImageFilter.GaussianBlur(max(.7,diameter/180)))
    edited=original.copy()
    edited.paste(badge,(left,top),alpha)
    output_path.parent.mkdir(parents=True,exist_ok=True)
    edited.save(output_path,format="WEBP",lossless=True,method=4)
    check=Image.open(output_path).convert("RGB")
    assert check.size==(w,h)
    # Explicit regression: all pixels OUTSIDE the exact logo bounding box
    # are identical after encoding, not merely visually similar.
    for area in [(0,0,w,top),
                 (0,top,left,top+diameter),
                 (left+diameter,top,w,top+diameter),
                 (0,top+diameter,w,h)]:
        if area[0]>=area[2] or area[1]>=area[3]:continue
        assert ImageChops.difference(original.crop(area),check.crop(area)).getbbox() is None, (input_path,area)
    changed.append((input_path.name,w,h,diameter))

templates=sorted((source/"designvorlagen").glob("fp-*.webp"))
assert len(templates)==32
assert {int(p.stem[3:]) for p in templates}==set(range(1,33))
for f in templates:
    number=int(f.stem[3:])
    replace_badge(f,out/"assets/designvorlagen"/f.name,badge_positions[number])

for name,where in product_badges.items():
    path=(source/"assets" / name) if False else None
    if name=="fotospiegel-hero-lossless.webp":
        original=source/name
    else:
        original=source/"products"/name
    replace_badge(original,out/"assets/images"/name,where)

# The camper photo contains an ornamental FOTOPOLIS pennant, not a round
# logo. Do NOT paint over physical props or invent a new sign.
for name in ("fotowohnwagen-gartenparty-1448.webp","fotowohnwagen-gartenparty-760.webp"):
    source_bytes=(source/"products"/name).read_bytes()
    assert (out/"assets/images"/name).read_bytes()==source_bytes, "Unbranded camper photo must not change"

# PREVIOUS overlay-based image styling must not leak back into the published
# pages. We operate on source pixels only and leave all gallery HTML intact.
for page in out.rglob("index.html"):
    if "admin" in page.relative_to(out).parts:continue
    html=page.read_text(encoding="utf-8")
    assert '<link rel="stylesheet" href="/brand-gold.css">' in html
    assert "brand-photo.css" not in html
    assert "fp-photo-mark" not in html
assert len(changed)==35,changed
swpath=out/"service-worker.js"
sw=swpath.read_text(encoding="utf-8")
assert "fotopolis-studio-2026-11-08-v6-gold" in sw
sw=sw.replace("fotopolis-studio-2026-11-08-v6-gold","fotopolis-studio-2026-11-08-v8-logo-only")
swpath.write_text(sw,encoding="utf-8")
print(f"LOGO ONLY: replaced {len(templates)} template logos and {len(product_badges)} product-screen logos; verified lossless pixels outside every original badge; camper photography unchanged.")
