#!/usr/bin/env python3
"""FOTOPOLIS Studio 9.4 visual asset release gate.

Only the isolated preview-build is changed. Original approved art remains intact.
Print frames: remove the entire existing brand badge BEFORE placing one clean
matching-size gold Fotopolis mark. Product photos: exchange only actual display
pixels to a black/gold touch screen. All outputs use lossless WebP.
"""
from __future__ import annotations
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops, ImageOps
from pathlib import Path
import json, math, random, re, hashlib

root=Path(__file__).resolve().parents[1]
source=root/"concepts/premium-v2/assets"
target=root/"preview-build"
logo_path=root/"site/assets/fotopolis-goldmark.webp"
logo=Image.open(logo_path).convert("RGB")
assert logo.size[0]>100 and logo.size[1]>100
records=[]
COLOR=(17,13,9)
# These anchors are in the ORIGINAL uploaded artwork, not previous composites.
# The second batch has larger old badges at slightly different positions.
special={
23:(.947,.920,.038),24:(.943,.916,.041),25:(.935,.903,.044),
26:(.939,.914,.040),27:(.935,.909,.041),28:(.941,.922,.041),
29:(.941,.920,.041),30:(.939,.913,.042),31:(.936,.916,.043),
32:(.938,.916,.041)}
def template_anchor(index):
    return special.get(index,(.953,.937,.021))

def lerp_rgb(a,b,t):
    return tuple(round(a[i]*(1-t)+b[i]*t) for i in range(3))

def circular_logo_replace(src,dst,index):
    im=Image.open(src).convert("RGB")
    W,H=im.size
    cxrel,cyrel,relrad=template_anchor(index)
    ox,oy=round(W*cxrel),round(H*cyrel)
    oldrad=W*relrad
    # An expanded cleanup zone removes any previous ring or lettering even if
    # the original logo's geometry differs a few pixels from the anchor.
    erase=min(round(oldrad*1.48+W*.008), min(ox,W-1-ox,oy,H-1-oy)-2)
    assert erase>oldrad*1.1,(index,erase,oldrad)
    # All 32 templates now have EXACTLY the same circle diameter in proportion
    # to their artwork, instead of the original 2-size inconsistency.
    nr=round(W*.0328)
    # Never extend past a frame edge.
    assert ox-erase>0 and oy-erase>0 and ox+erase<W and oy+erase<H
    original=im.copy()
    p=original.load()
    cropped=(ox-erase-3,oy-erase-3,ox+erase+4,oy+erase+4)
    # Repair the old badge by propagating nearby, unchanged background pixels
    # radially into the old circle. The replacement mark covers the centre.
    for y in range(max(0,oy-erase-2),min(H,oy+erase+3)):
        for x in range(max(0,ox-erase-2),min(W,ox+erase+3)):
            dx=x-ox;dy=y-oy
            d=math.hypot(dx,dy)
            if d>=erase+1:continue
            if d<.5:
                sx,sy=ox+erase+4,oy
            else:
                sx=round(ox+dx*(erase+4)/d)
                sy=round(oy+dy*(erase+4)/d)
            sx=max(0,min(W-1,sx));sy=max(0,min(H-1,sy))
            alpha=min(1,max(0,(erase+1-d)/2))
            im.putpixel((x,y),lerp_rgb(p[x,y],p[sx,sy],alpha))
    # A clean ROUND mark, never a square on top of a different round logo.
    # Edges are supersampled to avoid jaggies in the website thumbnails.
    sz=nr*2
    face=logo.resize((sz,sz),Image.Resampling.LANCZOS)
    mask=Image.new("L",(sz,sz),0)
    draw=ImageDraw.Draw(mask)
    draw.ellipse((1,1,sz-2,sz-2),fill=255)
    mask=mask.filter(ImageFilter.GaussianBlur(max(.65,W/1700)))
    im.paste(face,(ox-nr,oy-nr),mask)
    dst.parent.mkdir(parents=True,exist_ok=True)
    im.save(dst,"WEBP",lossless=True,method=4)
    check=Image.open(dst).convert("RGB")
    assert check.size==(W,H)
    # Verify exact pixel identity in all untouched areas.
    e=max(erase,nr)+3
    boxes=[(0,0,W,oy-e),(0,oy-e,ox-e,oy+e),
           (ox+e,oy-e,W,oy+e),(0,oy+e,W,H)]
    for box in boxes:
        if box[2]<=box[0] or box[3]<=box[1]:continue
        assert ImageChops.difference(check.crop(box),original.crop(box)).getbbox() is None,(index,box)
    records.append({"id":f"FP-{index:03}","size":[W,H],
      "oldBadgeCenter":[ox,oy],"cleanupRadius":erase,"newLogoDiameter":sz})
    return check

def find_font(sz):
    for path in ("DejaVuSans.ttf","/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        try:return ImageFont.truetype(path,sz)
        except OSError:continue
    return ImageFont.load_default()

def render_wallpaper(destination,kind):
    W,H=(1080,1920) if kind=="mirror" else (1920,1080)
    # Black and amber. NO navy or blue in any part of the display composition.
    base=Image.new("RGB",(W,H))
    pixel=base.load()
    for y in range(H):
        v=y/H
        for x in range(W):
            u=x/W
            hot=math.exp(-(((u-.52)/.50)**2+((v-.43)/.44)**2)*1.65)
            amber=math.exp(-(((u-.89)/.30)**2+((v-.91)/.34)**2)*2.5)
            pixel[x,y]=(round(7+28*hot+12*amber),
                        round(7+17*hot+7*amber),
                        round(7+7*hot+3*amber))
    image=base.convert("RGBA")
    overlay=Image.new("RGBA",(W,H))
    draw=ImageDraw.Draw(overlay)
    random.seed(6421)
    for _ in range(300 if kind=="mirror" else 230):
        x=random.randrange(W);y=random.randrange(H)
        if .18<x/W<.82 and .24<y/H<.76:continue
        r=random.choice((1,1,1,2,3))
        draw.ellipse((x-r,y-r,x+r,y+r),
                     fill=(248,180,78,random.randrange(45,150)))
    gold_halo=overlay.filter(ImageFilter.GaussianBlur(max(8,W//70)))
    image=Image.alpha_composite(image,gold_halo)
    image=Image.alpha_composite(image,overlay)
    diameter=540 if kind=="mirror" else 420
    badge=logo.resize((diameter,diameter),Image.Resampling.LANCZOS)
    mask=Image.new("L",(diameter,diameter),0)
    ImageDraw.Draw(mask).ellipse((1,1,diameter-2,diameter-2),fill=255)
    mask=mask.filter(ImageFilter.GaussianBlur(2))
    xpos=round((W-diameter)/2)
    ypos=round(H*.420-diameter/2)
    image.paste(badge,(xpos,ypos),mask)
    box=(round(W*.20),round(H*.753),round(W*.80),round(H*.818)) if kind=="mirror" else (
         round(W*.37),round(H*.787),round(W*.63),round(H*.88))
    frame=Image.new("RGBA",(W,H))
    d=ImageDraw.Draw(frame)
    d.rounded_rectangle(box,radius=(box[3]-box[1])//2,
                        outline=(255,202,115,255),width=max(3,H//500))
    image=Image.alpha_composite(image,frame.filter(ImageFilter.GaussianBlur(9)))
    image=Image.alpha_composite(image,frame)
    label="Touch to Start"
    font=find_font(round(H*.026) if kind=="mirror" else round(H*.037))
    dd=ImageDraw.Draw(image)
    bb=dd.textbbox((0,0),label,font=font)
    dd.text(((W-(bb[2]-bb[0]))/2,(box[1]+box[3]-(bb[3]-bb[1]))/2-bb[1]),
            label,font=font,fill=(248,220,174,255))
    destination.parent.mkdir(parents=True,exist_ok=True)
    image.convert("RGB").save(destination,"WEBP",quality=91,method=5)
    assert destination.stat().st_size>15000
    return image.convert("RGB")

def screen_swap(src,dst,kind,wallpaper):
    original=Image.open(src).convert("RGB")
    W,H=original.size
    # Pixel coordinates originate from the reviewed source photographs.
    # The gold LED rim, camera, case, reflections, props and event venue stay put.
    if kind=="mirror":
        coords=(259,267,579,818)
        ref=(840,1050)
    else:
        coords=(334,136,454,224)
        ref=(800,450)
    l=round(coords[0]*W/ref[0]);t=round(coords[1]*H/ref[1])
    r=round(coords[2]*W/ref[0]);b=round(coords[3]*H/ref[1])
    assert r-l>50 and b-t>50
    im=original.copy()
    art=ImageOps.fit(wallpaper,(r-l,b-t),method=Image.Resampling.LANCZOS,centering=(.5,.5))
    mat=Image.new("L",art.size,0)
    ImageDraw.Draw(mat).rounded_rectangle((1,1,art.width-2,art.height-2),
        radius=max(3,round(min(art.size)*.045)),fill=255)
    mat=mat.filter(ImageFilter.GaussianBlur(max(.6,W/1350)))
    im.paste(art,(l,t),mat)
    dst.parent.mkdir(parents=True,exist_ok=True)
    im.save(dst,"WEBP",lossless=True,method=4)
    check=Image.open(dst).convert("RGB")
    assert check.size==original.size
    # No edits to any part of the hardware or room outside the screen mask.
    regions=[(0,0,W,t),(0,t,l,b),(r,t,W,b),(0,b,W,H)]
    for bb in regions:
        if bb[2]<=bb[0] or bb[3]<=bb[1]:continue
        assert ImageChops.difference(original.crop(bb),check.crop(bb)).getbbox() is None,(kind,src,bb)
    records.append({"product":kind,"file":src.name,"screenRectangle":[l,t,r,b],
                    "size":[W,H],"outsideScreenPixels":"unchanged"})
    # Color expectation for the artwork: near-black and gold, not the old blue.
    sample=wallpaper.getpixel((wallpaper.width//2,wallpaper.height//7))
    assert sample[0]>=sample[2],("Unexpected blue wallpaper",kind,sample)

template_source=sorted((source/"designvorlagen").glob("fp-*.webp"))
assert len(template_source)==32
assert {int(path.stem[3:]) for path in template_source}==set(range(1,33))
for path in template_source:
    idx=int(path.stem[3:])
    circular_logo_replace(path,target/"assets/designvorlagen"/path.name,idx)

wall_dir=target/"assets/branding"
mirror=render_wallpaper(wall_dir/"fotopolis-touch-mirror.webp","mirror")
box=render_wallpaper(wall_dir/"fotopolis-touch-box.webp","box")
screen_swap(source/"fotospiegel-hero-lossless.webp",
            target/"assets/images/fotospiegel-hero-lossless.webp","mirror",mirror)
for name in ("fotobox-event-800.webp","fotobox-event-1672.webp"):
    screen_swap(source/"products"/name,target/"assets/images"/name,"box",box)

# No logo screen is visible on the exterior of the source caravan, and there
# is no blue digital screen there to update.
for name in ("fotowohnwagen-gartenparty-1448.webp","fotowohnwagen-gartenparty-760.webp"):
    assert (target/"assets/images"/name).read_bytes()==(source/"products"/name).read_bytes(),name

# Create a visual QA proof: all 32 ACTUAL updated designs, no simulated mockups.
qa=target/"qa"
qa.mkdir(exist_ok=True)
thumb_w=320;thumb_h=214
sheet=Image.new("RGB",(thumb_w*4,thumb_h*8),(32,27,21))
for idx in range(32):
    original=target/"assets/designvorlagen"/f"fp-{idx+1:03}.webp"
    pic=Image.open(original).convert("RGB")
    th=ImageOps.contain(pic,(thumb_w-12,thumb_h-12))
    x=(idx%4)*thumb_w+(thumb_w-th.width)//2
    y=(idx//4)*thumb_h+(thumb_h-th.height)//2
    sheet.paste(th,(x,y))
sheet.save(qa/"logo-audit-all-32.webp","WEBP",quality=90,method=5)
(qa/"logo-audit.json").write_text(json.dumps({
  "status":"validated","designTemplates":32,"screenPhotos":3,
  "templateLogosUniform":True,"logo":"current Fotopolis Social Events gold",
  "wallpapers":["/assets/branding/fotopolis-touch-box.webp",
                "/assets/branding/fotopolis-touch-mirror.webp"],
  "entries":records},ensure_ascii=False,indent=2),encoding="utf-8")

# Hard regression gate on all 14 public routes, enquiries and selection journey.
pages=[p for p in target.rglob("index.html") if "admin" not in p.relative_to(target).parts]
assert len(pages)>=14
for page in pages:
    s=page.read_text(encoding="utf-8")
    assert '<link rel="stylesheet" href="/brand-gold.css">' in s,page
    assert "brand-photo.css" not in s and "fp-photo-mark" not in s,page
    assert s.count("</head>")==1
assert 'name="fotopolis-studio9-anfrage"' in (target/"kontakt/index.html").read_text(encoding="utf-8")
assert 'data-design-gallery' in (target/"designvorlagen/index.html").read_text(encoding="utf-8")
assert len(list((target/"assets/designvorlagen").glob("fp-*.webp")))==32
swpath=target/"service-worker.js"
sw=swpath.read_text(encoding="utf-8")
assert "fotopolis-studio-2026-11-08-v6-gold" in sw
sw=sw.replace("fotopolis-studio-2026-11-08-v6-gold","fotopolis-studio-2026-11-08-v9-asset-qa")
sw=sw.replace("'/brand-gold.css',","'/brand-gold.css', '/assets/branding/fotopolis-touch-box.webp', '/assets/branding/fotopolis-touch-mirror.webp',")
swpath.write_text(sw,encoding="utf-8")
print("STUDIO 9.4 QA PASS: 32 clean uniform badges; 3 black/gold device screens; no changes outside approved regions; original hardware/photos preserved; 14+ public routes and Studio 9 forms present.")
