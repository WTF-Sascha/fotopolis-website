#!/usr/bin/env python3
"""FOTOPOLIS Gold photography layer after Brand Gold and Studio 9.
No source photography modifications, no generated substitute equipment.
Legacy on-screen brand artwork is overprinted with the supplied gold logo.
"""
from pathlib import Path
from shutil import copy2
import re

root = Path(__file__).resolve().parents[1]
source = root / "concepts/premium-v2"
target = root / "preview-build"
assets = source / "assets/branding"
out_assets = target / "assets/branding"
out_assets.mkdir(parents=True,exist_ok=True)

for name in ("fp-box-screen-overlay.svg", "fp-mirror-screen-overlay.svg"):
    copy2(assets/name,out_assets/name)
copy2(source / "brand-photo.css",target/"brand-photo.css")
copy2(source / "brand-photo-lightbox.js",target/"brand-photo-lightbox.js")

counts={"hero":0,"cards":0,"detail":0,"gallery":0}
def branded_img(img_markup):
    src=re.search(r'\bsrc="([^"]+)"',img_markup)
    assert src, img_markup[:100]
    src=src.group(1)
    if "fotospiegel-hero-lossless.webp" in src:
        product="mirror"
    elif "fotobox-event-1672.webp" in src or "fotobox-event-800.webp" in src:
        product="box"
    else:
        return ""
    return (
        '<img class="fp-photo-mark" src="/assets/branding/fp-'+product+
        '-screen-overlay.svg" alt="" aria-hidden="true" '
        'loading="eager" decoding="async" width="'+("840" if product=="mirror" else "800")+
        '" height="'+("1050" if product=="mirror" else "450")+'">'
    )

def inject(match,section):
    # First capture contains parent opening and its first image.
    markup=match.group(0)
    img=re.search(r'<img\b[^>]*>',markup)
    assert img
    overlay=branded_img(img.group(0))
    if overlay:
        counts[section]+=1
    return markup+overlay

pages=sorted(p for p in target.rglob("index.html") if "admin" not in p.relative_to(target).parts)
assert len(pages)>=14
for page in pages:
    s=page.read_text(encoding="utf-8")
    assert '<link rel="stylesheet" href="/brand-gold.css">' in s, page
    s=s.replace('</head>','<link rel="stylesheet" href="/brand-photo.css"></head>',1)
    if page==target/"index.html":
        s=re.sub(r'<div class="v4-hero-visual">\s*<img\b[^>]*>',lambda m:inject(m,"hero"),s,count=1)
        s=re.sub(r'<div class="v4-product-photo">\s*<img\b[^>]*>',lambda m:inject(m,"cards"),s)
    s=re.sub(r'<figure class="studio-page-hero-media">.*?<img\b[^>]*>',lambda m:inject(m,"detail"),s,flags=re.S)
    s=re.sub(r'<button class="curated-open"[^>]*>\s*<img\b[^>]*>',lambda m:inject(m,"gallery"),s)
    if page==target/"galerie/index.html":
        assert '<div class="gallery-dialog-media"><img data-gallery-large ' in s
        s=s.replace('</head>','<script defer src="/brand-photo-lightbox.js"></script></head>',1)
        pat=r'(<div class="gallery-dialog-media"><img data-gallery-large[^>]*>)'
        s,n=re.subn(pat,lambda m:m.group(1)+'<img class="fp-photo-mark" data-photo-large-overprint src="/assets/branding/fp-box-screen-overlay.svg" alt="" aria-hidden="true" decoding="async">',s,count=1)
        assert n==1
    page.write_text(s,encoding="utf-8")

assert counts["hero"]==1,counts
assert counts["cards"]==2,counts
assert counts["detail"]>=3,counts
assert counts["gallery"]>=2,counts
assert "fp-photo-mark" in (target/"fotospiegel/index.html").read_text(encoding="utf-8")
assert "fp-photo-mark" in (target/"fotobox/index.html").read_text(encoding="utf-8")
assert 'name="fotopolis-studio9-anfrage"' in (target/"kontakt/index.html").read_text(encoding="utf-8")
assert "data-design-gallery" in (target/"designvorlagen/index.html").read_text(encoding="utf-8")
swpath=target/"service-worker.js"
sw=swpath.read_text(encoding="utf-8")
assert "fotopolis-studio-2026-11-08-v6-gold" in sw
sw=sw.replace("fotopolis-studio-2026-11-08-v6-gold","fotopolis-studio-2026-11-08-v7-gold-photos")
sw=sw.replace("'/brand-gold.css',","'/brand-gold.css', '/brand-photo.css', '/assets/branding/fp-box-screen-overlay.svg', '/assets/branding/fp-mirror-screen-overlay.svg',")
sw=sw.replace("'/brand-photo.css',","'/brand-photo.css', '/brand-photo-lightbox.js',")
swpath.write_text(sw,encoding="utf-8")
print(f"PHOTO BRAND: {len(pages)} public pages; screen overprints {counts}; original equipment media preserved.")
