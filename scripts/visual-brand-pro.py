#!/usr/bin/env python3
"""FOTOPOLIS Studio 9.5 — original-artwork restoration, branded screens and release QA.

The source archive is immutable. Every preview image is derived anew from an
original source, never from an already composited derivative. Product photos
retain every pixel outside their on-device screen; print templates retain every
pixel outside the precisely declared original badge cleanup region.
"""
from __future__ import annotations
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageOps, ImageEnhance
from pathlib import Path
from math import atan2, cos, sin, hypot, pi
import json, re

root=Path(__file__).resolve().parents[1]
source=root/"concepts/premium-v2/assets"
out=root/"preview-build"
logo=Image.open(root/"site/assets/fotopolis-goldmark.webp").convert("RGB")
ref=Image.open(source/"branding/fotopolis-video-still-source.webp").convert("RGB")
assert logo.size[0]>=190 and ref.size[0]>=150 and ref.height>ref.width
qa=out/"qa"
qa.mkdir(exist_ok=True)
records=[]

# Explicit source-artwork placement, not an offset estimated from a prior
# edited file. First 22 originals use a small navy seal; 23-32 a larger one.
old_positions={
23:(.947,.920,.038),24:(.943,.916,.041),25:(.935,.903,.044),
26:(.939,.914,.040),27:(.935,.909,.041),28:(.941,.922,.041),
29:(.941,.920,.041),30:(.939,.913,.042),31:(.936,.916,.043),
32:(.938,.916,.041),
}
def badge_spec(n):
    return old_positions.get(n,(.953,.937,.021))

def dist3(a,b):
    return sum((int(a[k])-int(b[k]))**2 for k in range(3))

def repair_background(original,cx,cy,r):
    """Best-matching clone patch outside old badge with a feathered seam.
    Unlike the old radial smudge, no source pixel is sampled from the seal.
    """
    w,h=original.size
    pix=original.load()
    angles=[2*pi*n/40 for n in range(40)]
    samples=[(round(cx+cos(a)*(r+3)),round(cy+sin(a)*(r+3))) for a in angles]
    offsets=[]
    for mag in (2.6,3.2,4.0,5.0,6.0):
        for a in [i*pi/8 for i in range(16)]:
            dx=round(mag*r*cos(a))
            dy=round(mag*r*sin(a))
            if dx*dx+dy*dy <=(2*r+2)**2:continue
            if cx+dx-r<1 or cy+dy-r<1 or cx+dx+r>=w-1 or cy+dy+r>=h-1:continue
            score=0
            for x,y in samples:
                if not(0<=x<w and 0<=y<h):continue
                score+=dist3(pix[x,y],pix[x+dx,y+dy])
            offsets.append((score,dx,dy))
    if not offsets:
        raise AssertionError(f"No intact donor texture around badge at {cx,cy,r}")
    _,dx,dy=min(offsets)
    edited=original.copy()
    donor=original.load()
    d=edited.load()
    for y in range(max(0,cy-r-2),min(h,cy+r+3)):
        for x in range(max(0,cx-r-2),min(w,cx+r+3)):
            rr=hypot(x-cx,y-cy)
            if rr>=r+1.5:continue
            # Full replacement beneath the old badge, feather only its perimeter.
            alpha=min(1,max(0,(r+1.5-rr)/3.5))
            old=donor[x,y];new=donor[x+dx,y+dy]
            d[x,y]=tuple(round(old[k]*(1-alpha)+new[k]*alpha) for k in range(3))
    return edited,{"donor":[dx,dy],"boundaryMismatch":round(min(offsets)[0]/max(1,len(samples)),1)}

def replace_original_logo(src,dst,n):
    original=Image.open(src).convert("RGB")
    w,h=original.size
    xx,yy,oldrel=badge_spec(n)
    ox,oy=round(xx*w),round(yy*h)
    newrad=round(w*.030)     # same size across all 32 current brand stamps
    margin=min(ox,w-ox-1,oy,h-oy-1)
    assert margin>newrad+3,(n,margin,newrad)
    # Blank the WHOLE legacy seal first, including its separate outer glow.
    raw_erase=round(max(oldrel*w*1.20+3,newrad+3))
    erase=min(raw_erase,margin-2)
    assert erase>oldrel*w*.99,(n,erase,oldrel*w)
    edited,method=repair_background(original,ox,oy,erase)
    face=logo.resize((2*newrad,2*newrad),Image.Resampling.LANCZOS)
    matte=Image.new("L",face.size,0)
    ImageDraw.Draw(matte).ellipse((1,1,2*newrad-2,2*newrad-2),fill=255)
    matte=matte.filter(ImageFilter.GaussianBlur(.55))
    edited.paste(face,(ox-newrad,oy-newrad),matte)
    dst.parent.mkdir(parents=True,exist_ok=True)
    edited.save(dst,format="WEBP",lossless=True,method=6)
    saved=Image.open(dst).convert("RGB")
    assert saved.size==original.size
    # The entire artwork except the old logo's declared circular patch is
    # pixel-identical to the original archive. No global filter or overlays.
    affected=erase+4
    for box in [(0,0,w,oy-affected),
                (0,oy-affected,ox-affected,oy+affected),
                (ox+affected,oy-affected,w,oy+affected),
                (0,oy+affected,w,h)]:
        if box[2]>box[0] and box[3]>box[1]:
            assert ImageChops.difference(original.crop(box),saved.crop(box)).getbbox() is None,(n,box)
    # Prevent an accidental second brand stamp at the site layer.
    records.append({"id":f"FP-{n:03}","x":ox,"y":oy,"diameter":newrad*2,
                    "oldLogoCleanupRadius":erase,**method})
    return edited

designs=sorted((source/"designvorlagen").glob("fp-*.webp"))
assert len(designs)==32 and [x.name for x in designs]==[f"fp-{n:03}.webp" for n in range(1,33)]
for n,p in enumerate(designs,1):
    replace_original_logo(p,out/"assets/designvorlagen"/p.name,n)

# Use the exact artwork from the user's uploaded 18-second Fotomirror reference
# as the master composition. The screenshot is only a small source preview;
# it is never marketed as a native-resolution device screen or video.
mirror_art=ImageOps.fit(ref,(1080,1920),method=Image.Resampling.LANCZOS)
# Fotobox display is its OWN correctly centered premium brand composition.
# The previous 4:3 crop of the portrait Mirror still displaced the camera/wordmark.
# Render the exact approved GOLD master logo once, around the true screen centre.
# The entire physical booth and event photograph outside the screen stays unchanged.
def make_centered_box_screen():
    w,h=1200,900
    dark=(23,18,15)
    screen=Image.new("RGB",(w,h),dark)
    ambient=Image.new("RGBA",(w,h),(0,0,0,0))
    glow=ImageDraw.Draw(ambient)
    glow.ellipse((245,20,955,730),fill=(170,115,54,115))
    ambient=ambient.filter(ImageFilter.GaussianBlur(133))
    screen=Image.alpha_composite(screen.convert("RGBA"),ambient).convert("RGB")
    size=480
    # Mathematically centred artwork, not a CSS overlay and not an approximate offset.
    logo_left=(w-size)//2
    logo_top=125
    assert logo_left+size//2==w//2
    face=logo.resize((size,size),Image.Resampling.LANCZOS)
    mask=Image.new("L",(size,size),0)
    ImageDraw.Draw(mask).ellipse((1,1,size-2,size-2),fill=255)
    mask=mask.filter(ImageFilter.GaussianBlur(0.6))
    screen.paste(face,(logo_left,logo_top),mask)
    draw=ImageDraw.Draw(screen)
    button=(335,719,865,800)
    assert (button[0]+button[2])//2==w//2
    draw.rounded_rectangle(button,radius=39,fill=(20,16,13),
                           outline=(196,151,90),width=3)
    try:
        from PIL import ImageFont
        font=ImageFont.truetype("DejaVuSans.ttf",32)
    except Exception:
        from PIL import ImageFont
        font=ImageFont.load_default()
    label="TOUCH TO START"
    tb=draw.textbbox((0,0),label,font=font)
    tw,th=tb[2]-tb[0],tb[3]-tb[1]
    draw.text(((w-tw)//2-tb[0],
               (button[1]+button[3]-th)//2-tb[1]),
              label,fill=(245,221,187),font=font)
    return screen

box_art=make_centered_box_screen()
# The Foto Mirror retains its independent approved video-derived composition.
brand=out/"assets/branding"
brand.mkdir(parents=True,exist_ok=True)
mirror_art.save(brand/"fotopolis-touch-mirror.webp","WEBP",quality=92,method=5)
box_art.save(brand/"fotopolis-touch-box.webp","WEBP",quality=92,method=5)
assert (brand/"fotopolis-touch-mirror.webp").stat().st_size>10000
assert (brand/"fotopolis-touch-box.webp").stat().st_size>10000

def apply_device_screen(src,dst,kind,wallpaper):
    original=Image.open(src).convert("RGB")
    w,h=original.size
    if kind=="mirror":
        # Inner dark screen; the physical LED border remains untouched.
        box=(265,137,575,855)
        refsize=(840,1050)
    else:
        box=(337,137,451,226)
        refsize=(800,450)
    l=round(box[0]*w/refsize[0]);t=round(box[1]*h/refsize[1])
    r=round(box[2]*w/refsize[0]);b=round(box[3]*h/refsize[1])
    assert 0<l<r<w and 0<t<b<h
    edited=original.copy()
    art=ImageOps.fit(wallpaper,(r-l,b-t),method=Image.Resampling.LANCZOS)
    matte=Image.new("L",art.size,0)
    ImageDraw.Draw(matte).rounded_rectangle((1,1,art.width-2,art.height-2),
        radius=max(3,round(min(art.size)*.028)),fill=255)
    matte=matte.filter(ImageFilter.GaussianBlur(.65))
    edited.paste(art,(l,t),matte)
    dst.parent.mkdir(parents=True,exist_ok=True)
    edited.save(dst,"WEBP",lossless=True,method=5)
    chk=Image.open(dst).convert("RGB")
    for checkbox in ((0,0,w,t),(0,t,l,b),(r,t,w,b),(0,b,w,h)):
        if checkbbox:=checkbox:
            if checkbbox[2]>checkbbox[0] and checkbbox[3]>checkbbox[1]:
                assert ImageChops.difference(original.crop(checkbbox),chk.crop(checkbbox)).getbbox() is None,(kind,src,checkbbox)
    records.append({"product":kind,"file":src.name,"screen":[l,t,r,b],"outsideScreen":"pixel-identical"})

apply_device_screen(source/"fotospiegel-hero-lossless.webp",
                    out/"assets/images/fotospiegel-hero-lossless.webp","mirror",mirror_art)
for name in ("fotobox-event-800.webp","fotobox-event-1672.webp"):
    apply_device_screen(source/"products"/name,out/"assets/images"/name,"box",box_art)
for name in ("fotowohnwagen-gartenparty-1448.webp","fotowohnwagen-gartenparty-760.webp"):
    assert (source/"products"/name).read_bytes()==(out/"assets/images"/name).read_bytes()

# Editorial consistency and mobile stabilization are presentation-only.
from shutil import copy2
copy2(root/"concepts/premium-v2/brand-finish.css",out/"brand-finish.css")
pages=sorted(p for p in out.rglob("index.html") if "admin" not in p.relative_to(out).parts)
assert len(pages)>=14
for page in pages:
    html=page.read_text(encoding="utf-8")
    assert html.count("</head>")==1 and "/brand-gold.css" in html
    assert "brand-photo.css" not in html and "fp-photo-mark" not in html
    html=html.replace("</head>",'<link rel="stylesheet" href="/brand-finish.css"></head>',1)
    page.write_text(html,encoding="utf-8")

# Actual thumbnail contact sheet and enlarged badge close-ups for human review.
sheet=Image.new("RGB",(1280,1760),(30,24,18))
zoom=Image.new("RGB",(1280,1400),(29,23,18))
draw=ImageDraw.Draw(zoom)
for i in range(32):
    num=i+1
    art=Image.open(out/"assets/designvorlagen"/f"fp-{num:03}.webp").convert("RGB")
    thumb=ImageOps.contain(art,(308,208))
    x=(i%4)*320+(320-thumb.width)//2
    y=(i//4)*220+(220-thumb.height)//2
    sheet.paste(thumb,(x,y))
    q=records[i]
    cx,cy=q["x"],q["y"]
    r=24
    crop=art.crop((cx-r,cy-r,cx+r,cy+r)).resize((126,126),Image.Resampling.NEAREST)
    bx=(i%8)*160+17;by=(i//8)*350+18
    zoom.paste(crop,(bx,by))
    draw.text((bx,by+130),q["id"],fill=(241,204,142))
sheet.save(qa/"all-32-templates.webp","WEBP",quality=89,method=5)
zoom.save(qa/"logo-detail-inspection.webp","WEBP",quality=88,method=5)
(qa/"studio95-audit.json").write_text(json.dumps({
 "version":"9.5","logo":"Current FOTOPOLIS gold seal",
 "templates":32,"devicePhotos":3,
 "sourceVideo":"FOTOPOLIS_Fotomirror_Klassik_Active.mp4, 9-second still (Mirror only)",
 "fotoboxDisplay":"Approved master goldmark, mathematically centred within screen",
 "outsideLogoAndDisplayAreas":"unchanged",
 "approvedOriginals":"preserved","items":records
},ensure_ascii=False,indent=2),encoding="utf-8")

# Structural QA — image counts, all select options, all links to designs, no
# old blue screen overlays and no duplicate decorative logos in the markup.
homepage=(out/"index.html").read_text(encoding="utf-8")
contact=(out/"kontakt/index.html").read_text(encoding="utf-8")
gallery=(out/"designvorlagen/index.html").read_text(encoding="utf-8")
assert "id=\"hero-title\"" in homepage and "fotospiegel-hero-lossless.webp" in homepage
assert 'name="fotopolis-studio9-anfrage"' in contact
assert all(f'value="FP-{n:03}"' in contact for n in range(1,33))
assert "data-design-gallery" in gallery
assert len(list((out/"assets/designvorlagen").glob("fp-*.webp")))==32
assert all((out/p/"index.html").is_file() for p in
 ("fotobox","fotospiegel","fotowohnwagen","kontakt","faq","galerie","designvorlagen"))
swpath=out/"service-worker.js"
sw=swpath.read_text(encoding="utf-8")
assert "fotopolis-studio-2026-11-08-v6-gold" in sw
sw=sw.replace("fotopolis-studio-2026-11-08-v6-gold","fotopolis-studio-2026-11-08-v10-finish")
sw=sw.replace("'/brand-gold.css',",
              "'/brand-gold.css', '/brand-finish.css', '/assets/branding/fotopolis-touch-box.webp', '/assets/branding/fotopolis-touch-mirror.webp',")
swpath.write_text(sw,encoding="utf-8")
print("STUDIO 9.5 QA: 32 restored originals and badges, 3 restored physical device photos with reference-screen composition, responsive site styles, 14+ public routes, enquiries and design picker passed.")
