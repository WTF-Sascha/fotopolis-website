#!/usr/bin/env python3
"""Faithful rebuild of the 32 FOTOPOLIS originals for actual 15x10 photo printing.

Never substitute generic newly drawn editorial templates for FP-001..FP-032.
Each original artwork remains visually intact: only the one legacy FOTOPOLIS
seal is superseded by the approved master logo, and the original grey photo
placeholders become true alpha windows in the PRINT overlay.  Web preview
retains the user's exact motif and its original placeholder composition.
"""
from __future__ import annotations

from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageChops
import hashlib

OLD_POSITIONS={
 23:(.947,.920,.038),24:(.943,.916,.041),25:(.935,.903,.044),
 26:(.939,.914,.040),27:(.935,.909,.041),28:(.941,.922,.041),
 29:(.941,.920,.041),30:(.939,.913,.042),31:(.936,.916,.043),
 32:(.938,.916,.041),
}

def is_photo_grey(rgb):
    r,g,b=rgb[:3]
    return 125<=r<=236 and abs(r-g)<=7 and abs(g-b)<=7 and abs(r-b)<=7

def find_original_photo_windows(source: Image.Image, expected_count: int):
    """Large uniform grey connected-components; never infer new layout geometry.

    Original FOTOPOLIS 32 image placeholders are grey and gold-framed. Detect
    their actual interior, not a generic predesigned grid. Small logoSlot
    square(s) remain separate when the artwork calls for them.
    """
    w,h=source.size
    factor=4
    small=source.resize((w//factor,h//factor),Image.Resampling.NEAREST)
    sw,sh=small.size
    pixels=list(small.getdata())
    good=bytearray(1 if is_photo_grey(rgb) else 0 for rgb in pixels)
    seen=bytearray(sw*sh)
    components=[]
    for start in range(sw*sh):
        if not good[start] or seen[start]:continue
        seen[start]=1
        stack=[start]
        size=0
        x0=y0=100000
        x1=y1=0
        while stack:
            k=stack.pop()
            yy,xx=divmod(k,sw)
            size+=1
            if xx<x0:x0=xx
            if yy<y0:y0=yy
            if xx>x1:x1=xx
            if yy>y1:y1=yy
            if xx>0 and good[k-1] and not seen[k-1]:
                seen[k-1]=1;stack.append(k-1)
            if xx+1<sw and good[k+1] and not seen[k+1]:
                seen[k+1]=1;stack.append(k+1)
            if yy>0 and good[k-sw] and not seen[k-sw]:
                seen[k-sw]=1;stack.append(k-sw)
            if yy+1<sh and good[k+sw] and not seen[k+sw]:
                seen[k+sw]=1;stack.append(k+sw)
        bw,bh=x1-x0+1,y1-y0+1
        if size>=max(360,sw*sh//250) and bw>=20 and bh>=20:
            components.append((size,(x0,y0,x1+1,y1+1)))
    components.sort(key=lambda x:x[0],reverse=True)
    chosen=components[:expected_count]
    assert len(chosen)==expected_count, (
        "Could not identify all authentic gold-framed photo windows",
        source.size,expected_count,components[:8])

    # Component bbox detection is 4px-based. Refine at full source resolution
    # against the source's genuine photo grey to avoid gold-frame clipping.
    full=source.load()
    def refine(box):
        sx0,sy0,sx1,sy1=box
        rough=(sx0*factor,sy0*factor,sx1*factor,sy1*factor)
        l,t,r,b=rough
        # Determine the grey boundary near multiple positions to avoid
        # the original placeholder's faint FOTO text.
        scan_ys=[t+(b-t)*q//5 for q in (1,2,4)]
        scan_xs=[l+(r-l)*q//5 for q in (1,2,4)]
        l_candidates=[]
        r_candidates=[]
        t_candidates=[]
        b_candidates=[]
        for y in scan_ys:
            y=min(h-1,max(0,y))
            left_xs=[x for x in range(max(0,l-9),min(w,l+23))
                if is_photo_grey(full[x,y])]
            right_xs=[x for x in range(max(0,r-23),min(w,r+9))
                if is_photo_grey(full[x,y])]
            if left_xs and right_xs:
                l_candidates.append(min(left_xs))
                r_candidates.append(max(right_xs)+1)
        for x in scan_xs:
            x=min(w-1,max(0,x))
            top_ys=[y for y in range(max(0,t-9),min(h,t+23))
                if is_photo_grey(full[x,y])]
            bottom_ys=[y for y in range(max(0,b-23),min(h,b+9))
                if is_photo_grey(full[x,y])]
            if top_ys and bottom_ys:
                t_candidates.append(min(top_ys))
                b_candidates.append(max(bottom_ys)+1)
        if not (l_candidates and r_candidates and t_candidates and b_candidates):
            return rough
        # Medians reject a single shifted scanline from drawn FOTO text.
        a=sorted(l_candidates)[len(l_candidates)//2]
        c=sorted(r_candidates)[len(r_candidates)//2]
        d=sorted(t_candidates)[len(t_candidates)//2]
        e=sorted(b_candidates)[len(b_candidates)//2]
        # Never eat into the gold photo borders. Sources are 3:2 landscape.
        return (a,d,c,e)
    windows=[refine(rect) for _,rect in chosen]
    windows.sort(key=lambda x:(x[1],x[0]))
    for l,t,r,b in windows:
        assert 0<=l<r<=w and 0<=t<b<=h and (r-l)>=50 and (b-t)>=50
        assert (r-l)*(b-t)>w*h*.014, ("Suspiciously tiny photo slot",windows)
    return windows, [dict(pixels=a,rect=list(b)) for a,b in components[:7]]

def faithful_original(item, original_dir:Path, master_logo:Image.Image,
                      print_dir:Path, preview_dir:Path,
                      width:int, height:int, dpi:int):
    number=int(item["id"].split("-")[1])
    assert 1<=number<=32
    name=f"fp-{number:03d}.webp"
    path=original_dir/name
    original=Image.open(path).convert("RGB")
    w,h=original.size
    assert abs(w/h-1.5)<.01, (item["id"],"Original not 3:2",original.size)
    desired_count=int(item["photos"])
    assert desired_count in (1,2,3)

    slots, components=find_original_photo_windows(original,desired_count)
    # True optical placement of the ORIGINAL seal, not a new footer in a
    # different aesthetic. A single, slightly larger opaque medal covers the
    # old seal and its gold rim: no layered logos, blur ghosts or clone seams.
    cx_rel,cy_rel,old_rel=OLD_POSITIONS.get(number,(.953,.937,.021))
    cx,cy=round(cx_rel*w),round(cy_rel*h)
    radius=round(w*old_rel*1.22+4)
    assert radius+2<min(cx,w-cx,cy,h-cy), (number,"logo lacks safe area")
    dial=radius*2
    art=original.convert("RGBA")
    logo=master_logo.convert("RGBA").resize((dial,dial),Image.Resampling.LANCZOS)
    mask=Image.new("L",(dial,dial),0)
    md=ImageDraw.Draw(mask)
    md.ellipse((0,0,dial-1,dial-1),fill=255)
    mask=mask.filter(ImageFilter.GaussianBlur(.55))
    art.paste(logo,(cx-radius,cy-radius),mask)

    target_size=(width,height)
    preview_original=art.resize(target_size,Image.Resampling.LANCZOS)
    overlay=preview_original.copy()
    overlay_draw=ImageDraw.Draw(overlay)
    scaled=[]
    # Real alpha cut-outs match the source photo areas, NOT the substitute
    # Studio 11 generic layout. Hairline original gilding remains outside.
    for left,top,right,bottom in slots:
        rect=(round(left*width/w),round(top*height/h),
              round(right*width/w),round(bottom*height/h))
        assert rect[0]<rect[2] and rect[1]<rect[3]
        overlay_draw.rectangle(rect,fill=(0,0,0,0))
        scaled.append(list(rect))

    outpath=print_dir/name.replace(".webp",".png")
    overlay.save(outpath,"PNG",dpi=(dpi,dpi),optimize=True)
    readback=Image.open(outpath)
    assert readback.size==target_size and readback.mode=="RGBA"
    assert all(299<=x<=301 for x in readback.info.get("dpi",(0,0)))
    img=readback.convert("RGBA")
    for l,t,r,b in scaled:
        assert img.getpixel(((l+r)//2,(t+b)//2))[3]==0, (
            item["id"],"photo opening not transparent")

    # Protect all real motifs and custom decorative elements outside the
    # original photo windows + original logo stamp. Compare to the master
    # image resampled to print size before stamping.
    untouched=original.resize(target_size,Image.Resampling.LANCZOS).convert("RGBA")
    allow=Image.new("L",target_size,0)
    allow_draw=ImageDraw.Draw(allow)
    for rect in scaled:
        allow_draw.rectangle(tuple(rect),fill=255)
    new_stamp=(round((cx-radius)*width/w)-3,
               round((cy-radius)*height/h)-3,
               round((cx+radius)*width/w)+3,
               round((cy+radius)*height/h)+3)
    allow_draw.rectangle(new_stamp,fill=255)
    dif=ImageChops.difference(untouched,img).convert("RGB")
    outside=Image.composite(dif,Image.new("RGB",target_size),Image.eval(allow,lambda p:255-p))
    assert outside.getbbox() is None, (
        item["id"],"original motif modified outside approved stamp and photo windows")

    # The gallery shows a faithful source-based artwork, with the corrected
    # authentic Goldmark; no newly invented ornamental elements.
    gallery=preview_original.resize((900,600),Image.Resampling.LANCZOS).convert("RGB")
    preview_path=preview_dir/name
    gallery.save(preview_path,"WEBP",quality=91,method=5)

    item.update({
        "image":f"/assets/designvorlagen/{name}",
        "printOverlay":f"/assets/designvorlagen/print/fp-{number:03d}.png",
        "format":"15 x 10 cm Querformat",
        "pixelWidth":width,"pixelHeight":height,"dpi":dpi,
        "collection":"classics",
        "originalMotifPreserved":True,
        "legacyLogoReplaced":True,
        "logoMaster":"site/assets/fotopolis-goldmark.webp",
        "photoRegions":scaled,
        "sourceOriginalSha256":hashlib.sha256(path.read_bytes()).hexdigest(),
        "sha256":hashlib.sha256(preview_path.read_bytes()).hexdigest(),
        "studio11PrintSha256":hashlib.sha256(outpath.read_bytes()).hexdigest(),
    })
    return (
        original.resize((900,600),Image.Resampling.LANCZOS),
        gallery,
        {"id":item["id"],"sourceSize":[w,h],"originalPhotoWindows":[list(x) for x in slots],
         "photoRegions":scaled,"logoCenter":[cx,cy],"legacyRadius":round(w*old_rel),
         "newRadius":radius,"sourceSha256":item["sourceOriginalSha256"],
         "printSha256":item["studio11PrintSha256"],
         "componentCandidates":components}
    )
