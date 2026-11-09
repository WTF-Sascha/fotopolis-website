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
    # A small circle was technically centered but unreadable on the real
    # 800px mobile source at its normal CSS display size. Increase the approved
    # source artwork by 44%, not the physical device or event photograph.
    dark=(17,14,12)
    screen=Image.new("RGB",(w,h),dark)
    ambient=Image.new("RGBA",(w,h),(0,0,0,0))
    glow=ImageDraw.Draw(ambient)
    glow.ellipse((250,38,950,755),fill=(197,141,70,164))
    ambient=ambient.filter(ImageFilter.GaussianBlur(105))
    screen=Image.alpha_composite(screen.convert("RGBA"),ambient).convert("RGB")
    size=690
    logo_left=(w-size)//2
    logo_top=29
    assert logo_left+size//2==w//2
    assert size>=660 and logo_top>15
    draw=ImageDraw.Draw(screen)
    draw.ellipse((logo_left-8,logo_top-8,logo_left+size+8,logo_top+size+8),
                 outline=(196,157,103),width=5)
    # Logo master pixels stay untouched apart from proportional resampling.
    face=logo.resize((size,size),Image.Resampling.LANCZOS)
    mask=Image.new("L",(size,size),0)
    ImageDraw.Draw(mask).ellipse((1,1,size-2,size-2),fill=255)
    mask=mask.filter(ImageFilter.GaussianBlur(0.55))
    screen.paste(face,(logo_left,logo_top),mask)
    draw=ImageDraw.Draw(screen)
    button=(263,757,937,831)
    assert (button[0]+button[2])//2==w//2
    draw.rounded_rectangle(button,radius=35,fill=(17,14,12),
                           outline=(205,171,117),width=4)
    try:
        from PIL import ImageFont
        font=ImageFont.truetype("DejaVuSans.ttf",40)
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
        # Approved Mirror photo remains a screen-only edit.
        box=(265,137,575,855)
        refsize=(840,1050)
    else:
        box=(337,137,459,226)
        refsize=(800,450)
    def scale(rect):
        return tuple(round(c*(w/refsize[0] if i%2==0 else h/refsize[1]))
                     for i,c in enumerate(rect))
    l,t,r,b=scale(box)
    assert 0<l<r<w and 0<t<b<h
    edited=original.copy()
    art=ImageOps.fit(wallpaper,(r-l,b-t),method=Image.Resampling.LANCZOS)
    matte=Image.new("L",art.size,0)
    ImageDraw.Draw(matte).rounded_rectangle((1,1,art.width-2,art.height-2),
        radius=max(3,round(min(art.size)*.028)),fill=255)
    matte=matte.filter(ImageFilter.GaussianBlur(.65))
    edited.paste(art,(l,t),matte)
    modified_regions=[(l,t,r,b)]
    case_badge=None
    if kind=="box":
        # Exact lower black panel interior; visual close-up QA required a
        # smaller, lower mask to keep the goldmark wholly clear of silver rails.
        # Do not alter locks, metal framing, event decor or device geometry.
        pl,pt,pr,pb=scale((368,368,414,414))
        assert 0<pl<pr<w and 0<pt<pb<h and pr-pl==pb-pt, (w,h,pl,pt,pr,pb)
        badge_size=(pr-pl,pb-pt)
        face=logo.resize(badge_size,Image.Resampling.LANCZOS)
        badge_mask=Image.new("L",badge_size,0)
        ImageDraw.Draw(badge_mask).ellipse((1,1,badge_size[0]-2,badge_size[1]-2),fill=255)
        badge_mask=badge_mask.filter(ImageFilter.GaussianBlur(.45))
        edited.paste(face,(pl,pt),badge_mask)
        modified_regions.append((pl,pt,pr,pb))
        case_badge=[pl,pt,pr,pb]

    dst.parent.mkdir(parents=True,exist_ok=True)
    edited.save(dst,"WEBP",lossless=True,method=5)
    chk=Image.open(dst).convert("RGB")
    # Independent mask-based pixel comparison against the actual source. Only
    # the approved screen and, for the box, the lower face emblem may change.
    unchanged=Image.new("L",(w,h),255)
    allowed=ImageDraw.Draw(unchanged)
    for x1,y1,x2,y2 in modified_regions:
        allowed.rectangle((x1,y1,x2-1,y2-1),fill=0)
    delta=ImageChops.difference(original,chk)
    outside=Image.composite(delta,Image.new("RGB",(w,h)),unchanged)
    assert outside.getbbox() is None,(kind,src,"unexpected photo modification")
    # Verify a brand-mark-sized amount of visual difference; this guards
    # against a nearly invisible 1px/low-opacity badge in the build output.
    if kind=="box":
        screen_delta=ImageChops.difference(original.crop((l,t,r,b)),chk.crop((l,t,r,b)))
        badge_delta=ImageChops.difference(original.crop(tuple(case_badge)),chk.crop(tuple(case_badge)))
        assert screen_delta.getbbox() is not None
        assert badge_delta.getbbox() is not None
        assert sum(1 for px in badge_delta.convert("L").getdata() if px>25) > (pr-pl)*(pb-pt)*.09, (
            "Lower flightcase logo has insufficient pixel contrast",src)
    records.append({"product":kind,"file":src.name,"screen":[l,t,r,b],
                    "frontBadge":case_badge,"outsideLogoAreas":"pixel-identical"})

apply_device_screen(source/"fotospiegel-hero-lossless.webp",
                    out/"assets/images/fotospiegel-hero-lossless.webp","mirror",mirror_art)
for name in ("fotobox-event-800.webp","fotobox-event-1672.webp"):
    apply_device_screen(source/"products"/name,out/"assets/images"/name,"box",box_art)
# Real-source visual evidence for the actual in-device screen, not a screenshot
# pasted into another card. Both exported responsive sizes are reworked.
def photo_screen_crop(im):
    w,h=im.size
    ref_w,ref_h=800,450
    bounds=(337,137,459,226)
    pad=12
    l=round((bounds[0]-pad)*w/ref_w)
    t=round((bounds[1]-pad)*h/ref_h)
    r=round((bounds[2]+pad)*w/ref_w)
    b=round((bounds[3]+pad)*h/ref_h)
    return im.crop((l,t,r,b))
source_box=Image.open(source/"products/fotobox-event-1672.webp").convert("RGB")
updated_box=Image.open(out/"assets/images/fotobox-event-1672.webp").convert("RGB")
preview_before=photo_screen_crop(source_box)
preview_after=photo_screen_crop(updated_box)
preview_w,preview_h=690,520
compare=Image.new("RGB",(preview_w*2,preview_h+48),(24,21,18))
for index,sample in enumerate((preview_before,preview_after)):
    tile=ImageOps.contain(sample,(preview_w-18,preview_h-16),
                          method=Image.Resampling.LANCZOS)
    compare.paste(tile,(preview_w*index+(preview_w-tile.width)//2,
                        (preview_h-tile.height)//2))
draw=ImageDraw.Draw(compare)
draw.text((30,preview_h+12),"VORHER: vorhandenes Bildschirmmotiv",fill=(245,229,209))
draw.text((preview_w+30,preview_h+12),"NACHHER: freigegebenes, zentriertes Original-Logo",fill=(245,229,209))
# A second contact sheet shows the full on-device branding, including
# the previously unbranded lower case; crop only the existing device.
def full_device_crop(image):
    w,h=image.size
    rect=(298,83,480,439)
    return image.crop(tuple(round(v*(w/800 if i%2==0 else h/450))
                            for i,v in enumerate(rect)))
whole=Image.new("RGB",(1020,1040),(23,19,16))
for index,im in enumerate((source_box,updated_box)):
    sample=ImageOps.contain(full_device_crop(im),(480,945),
                            method=Image.Resampling.LANCZOS)
    whole.paste(sample,(index*510+(510-sample.width)//2,24))
whole_draw=ImageDraw.Draw(whole)
whole_draw.text((20,1000),"VORHER: Originalgeraet",fill=(242,220,191))
whole_draw.text((530,1000),"NACHHER: zentrierte Logo-Brandings",fill=(242,220,191))
whole.save(qa/"fotobox-device-branding-before-after.webp","WEBP",quality=94,method=6)
compare.save(qa/"fotobox-logo-centering-before-after.webp",
             format="WEBP",quality=93,method=6)
import hashlib
(qa/"fotobox-logo-centering.json").write_text(json.dumps({
    "scope":"Fotobox screen plus lower existing front-face badge; photo and hardware outside both masks pixel-identical",
    "screenReferenceRect":[337,137,459,226],
    "brandAsset":"site/assets/fotopolis-goldmark.webp",
    "brandAssetSha256":hashlib.sha256((root/"site/assets/fotopolis-goldmark.webp").read_bytes()).hexdigest(),
    "screenArtwork":[1200,900],
    "logoBounds":[255,29,945,719],
    "logoGeometricCentreX":600,
    "screenGeometricCentreX":600,
    "touchButtonBounds":[263,757,937,831],
    "frontBadgeReferenceRect":[368,368,414,414],
    "screenLogoIncreasePercent":44,
    "frontBadgeUsesOriginalGoldmark":True,
    "buttonGeometricCentreX":600,
    "photoFiles":["fotobox-event-1672.webp","fotobox-event-800.webp"],
    "outputOnly":True,
    "manualDesignApproval":"PENDING"
},ensure_ascii=False,indent=2),encoding="utf-8")

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
 "fotoboxDisplay":"Approved master goldmark scaled 44 percent larger, centered in display and second badge on lower face",
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
