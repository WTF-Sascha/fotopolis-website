#!/usr/bin/env python3
"""Generate CI-2.1-branded WEBP product photos inside the isolated deploy output.

Only existing mirror/booth screen pixels are replaced; device hardware,
environment, approved hero composition, and source photographs stay unchanged.
The corrected responsive booth image derives from the corrected high-res photo.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops, ImageStat

IVORY=(247,243,236)
OBSIDIAN=(24,21,18)
ESPRESSO=(48,37,29)
YELLOW=(254,225,88)

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def font(size):
    for name in ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                 "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf"):
        if Path(name).is_file():
            return ImageFont.truetype(name,size)
    return ImageFont.load_default()

def centered(d, cx, y, label, face, fill):
    bb=d.textbbox((0,0),label,font=face)
    d.text((cx-(bb[2]-bb[0])/2,y),label,font=face,fill=fill)

def make_screen(size, logo, mode):
    w,h=size
    panel=Image.new("RGB",size,OBSIDIAN)
    pixels=panel.load()
    # Subtle warm glass gradient: no legacy blue or artificial gold panels.
    for y in range(h):
        for x in range(w):
            nx=(x-w*.54)/(w*.76)
            ny=(y-h*.32)/(h*.76)
            ambient=math.exp(-((nx*nx)*1.8+(ny*ny)*1.2))
            fraction=.12+.12*ambient+.035*math.sin((x/w)*math.pi)
            if mode=="mirror":
                fraction+=.055*math.exp(-((x/w-.08)/.12)**2)
            pixels[x,y]=tuple(round(OBSIDIAN[i]*(1-fraction)+ESPRESSO[i]*fraction) for i in range(3))
    diameter=min(round(w*(.83 if mode=="mirror" else .62)),
                 round(h*(.34 if mode=="mirror" else .69)))
    mark=logo.convert("RGBA").resize((diameter,diameter),Image.Resampling.LANCZOS)
    mask=Image.new("L",(diameter,diameter),0)
    ImageDraw.Draw(mask).ellipse((1,1,diameter-2,diameter-2),fill=255)
    mark.putalpha(mask)
    mx=(w-diameter)//2
    my=round(h*(.19 if mode=="mirror" else .07))
    if mode=="mirror":
        halo=Image.new("RGBA",size,(0,0,0,0))
        ImageDraw.Draw(halo).ellipse((mx-7,my-7,mx+diameter+7,my+diameter+7),fill=(*YELLOW,33))
        halo=halo.filter(ImageFilter.GaussianBlur(max(2,w//24)))
        panel=Image.alpha_composite(panel.convert("RGBA"),halo)
    else:
        panel=panel.convert("RGBA")
    panel.alpha_composite(mark,(mx,my))
    d=ImageDraw.Draw(panel)
    d.ellipse((mx,my,mx+diameter-1,my+diameter-1),
              outline=(*YELLOW,105),width=max(1,w//220))
    if mode=="mirror":
        yy=int(h*.74)
        d.ellipse((w//2-4,yy-22,w//2+4,yy-14),outline=(*YELLOW,190),width=2)
        centered(d,w//2,yy,"Bitte berühren zum Start",font(max(10,w//18)),IVORY+(255,))
        d.line((w*.34,h*.85,w*.66,h*.85),fill=(*YELLOW,145),width=max(1,w//200))
    else:
        centered(d,w//2,int(h*.83),"START",font(max(7,w//12)),IVORY+(240,))
    return panel.convert("RGB")


def remove_lower_cabinet_badge(image, cx, cy, radius):
    """Reconstruct the plain dark cabinet panel, without synthetic brand graphics.

    Interpolate nearby unbranded panel pixels in each scanline with a feathered
    circular edge, preserving the real cabinet, hardware and upper screen.
    """
    w,h=image.size
    r=radius*1.12
    feather=max(2.5,radius*.10)
    assert cx-r-feather-12>=0 and cx+r+feather+12<w
    assert cy-r-feather-3>=0 and cy+r+feather+3<h
    px=image.load()
    original=image.copy()
    orig=original.load()
    left_x=int(cx-r-10)
    right_x=int(cx+r+10)
    bbox=(max(0,int(cx-r-feather-2)),
          max(0,int(cy-r-feather-2)),
          min(w,int(cx+r+feather+3)),
          min(h,int(cy+r+feather+3)))
    for y in range(bbox[1],bbox[3]):
        ys=range(max(0,y-2),min(h,y+3))
        count=len(ys)
        left=tuple(sum(orig[left_x,j][k] for j in ys)/count for k in range(3))
        right=tuple(sum(orig[right_x,j][k] for j in ys)/count for k in range(3))
        for x in range(bbox[0],bbox[2]):
            d=math.hypot(x-cx,y-cy)
            if d>r+feather:
                continue
            t=max(0.0,min(1.0,(x-(cx-r))/(2*r)))
            restored=tuple(int(left[k]*(1-t)+right[k]*t) for k in range(3))
            weight=1.0 if d<=r else max(0.0,(r+feather-d)/feather)
            old=orig[x,y]
            px[x,y]=tuple(round(old[k]*(1-weight)+restored[k]*weight) for k in range(3))
    inner=image.crop((round(cx-radius*.68),round(cy-radius*.68),
                      round(cx+radius*.68),round(cy+radius*.68)))
    mean=sum(ImageStat.Stat(inner).mean)/3
    assert mean<90, f"Lower booth logo still visible/overbright: {mean:.1f}"
    return bbox,round(mean,2)

def compose(source, output, logo, mode):
    original=Image.open(source).convert("RGB")
    w,h=original.size
    if mode=="mirror":
        assert abs(w/h-.8)<.05, f"Unexpected mirror geometry: {original.size}"
        fractional=(.322,.138,.681,.798)
    else:
        assert abs(w/h-800/450)<.08, f"Unexpected booth geometry: {original.size}"
        fractional=(.448,.337,.557,.524)
    x0,y0,x1,y1=(round(fractional[i]*([w,h,w,h][i])) for i in range(4))
    sw,sh=x1-x0,y1-y0
    assert sw>=20 and sh>=20
    screen=make_screen((sw,sh),logo,mode)
    mult=3
    alpha=Image.new("L",(sw*mult,sh*mult),0)
    radius=max(4,round(min(sw,sh)*.036))*mult
    ImageDraw.Draw(alpha).rounded_rectangle((0,0,sw*mult-1,sh*mult-1),radius=radius,fill=255)
    alpha=alpha.resize((sw,sh),Image.Resampling.LANCZOS)
    alpha=alpha.filter(ImageFilter.GaussianBlur(max(.6,sw*.004)))
    revised=original.copy()
    revised.paste(screen,(x0,y0),alpha)
    permitted_rects=[(x0,y0,x1,y1)]
    # Studio 18.4: only ONE Fotopolis logo remains on the upper touchscreen.
    # Remove the lower brand seal and restore the unbranded cabinet surface.
    physical_badge_roi=None
    cabinet_center_luminance=None
    if mode=="booth":
        cx=round(w*.49)
        cy=round(h*.856)
        br=round(w*.0325)
        assert br>=15 and cx-br>0 and cy+br<h
        physical_badge_roi,cabinet_center_luminance=remove_lower_cabinet_badge(
            revised,cx,cy,br
        )
        permitted_rects.append(physical_badge_roi)
    # No background or other device pixels may change in the source compositor.
    checkoutside=revised.copy()
    for region in permitted_rects:
        checkoutside.paste(original.crop(region),region[:2])
    assert ImageChops.difference(checkoutside,original).getbbox() is None
    revised.save(output,"WEBP",quality=94,method=6,lossless=(mode=="mirror"))
    decoded=Image.open(output).convert("RGB")
    assert decoded.size==(w,h)
    margin=max(5,int(sw*.07))
    old=original.crop((x0+margin,y0+margin,x1-margin,y1-margin))
    new=decoded.crop((x0+margin,y0+margin,x1-margin,y1-margin))
    channel_differences=ImageStat.Stat(ImageChops.difference(old,new)).mean
    assert sum(channel_differences)/3>10, "Old display was not removed"
    return {"original":str(source.name),"corrected":str(output.name),
            "original_sha256":sha(source),"corrected_sha256":sha(output),
            "size":[w,h],"screen_roi":[x0,y0,x1,y1],
            "physical_badge_roi":list(physical_badge_roi) if physical_badge_roi else None,
            "physical_badge_action":"REMOVED / UNBRANDED CABINET RETOUCH" if mode=="booth" else "NOT_APPLICABLE",
            "lower_cabinet_mean_luminance":cabinet_center_luminance,
            "upper_screen_logo_preserved":True,
            "mean_screen_pixel_change_rgb":channel_differences,
            "unrelated_pixels_unchanged_before_encoding":True}

def main():
    args=argparse.ArgumentParser()
    args.add_argument("--root",required=True)
    args.add_argument("--logo",required=True)
    cfg=args.parse_args()
    root=Path(cfg.root).resolve()
    images=root/"assets/images"
    logo=Image.open(cfg.logo).convert("RGBA")
    reports=[]
    for stem,mode in (("fotospiegel-hero-lossless","mirror"),
                      ("fotobox-event-1672","booth")):
        original=images/(stem+".webp")
        assert original.is_file(), original
        reports.append(compose(original,images/(stem+"-ci21.webp"),logo,mode))
    source=Image.open(images/"fotobox-event-1672-ci21.webp").convert("RGB")
    previous=Image.open(images/"fotobox-event-800.webp")
    smaller=source.resize(previous.size,Image.Resampling.LANCZOS)
    target=images/"fotobox-event-800-ci21.webp"
    smaller.save(target,"WEBP",quality=91,method=6)
    reports.append({"original":"fotobox-event-800.webp",
                    "corrected":target.name,"size":list(smaller.size),
                    "source":"fotobox-event-1672-ci21.webp",
                    "corrected_sha256":sha(target),
                    "derived_from_corrected_high_resolution":True})
    (root/"qa").mkdir(exist_ok=True)
    (root/"qa/studio18-embedded-image-corrections.json").write_text(
        json.dumps(reports,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("STUDIO18.4 QA: upper touchscreen logo retained; lower cabinet logo removed; originals preserved")

if __name__=="__main__":
    main()
