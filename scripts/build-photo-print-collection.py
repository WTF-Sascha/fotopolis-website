#!/usr/bin/env python3
"""FOTOPOLIS Studio 11 PhotoPrint Collection, isolated preview only.

True 15 x 10 cm landscape photo templates at 300 DPI (1772 x 1181 px).
Source 32 artworks and the approved goldmark are never overwritten. Every
print PNG has transparent photo openings; WebP thumbnails are display previews.
"""
from __future__ import annotations

import hashlib
import json
import math
import random
import re
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
import runpy

ROOT = Path(__file__).resolve().parents[1]
faithful_original = runpy.run_path(str(ROOT / "scripts/classics-original-preserve.py"))["faithful_original"]
SOURCE = ROOT / "concepts/premium-v2"
OUT = ROOT / "preview-build"
TARGET = OUT / "assets/designvorlagen"
PRINT = TARGET / "print"
QA = OUT / "qa"
PRINT.mkdir(parents=True, exist_ok=True)
QA.mkdir(parents=True, exist_ok=True)
W,H = 1772,1181
DPI = 300
ORIGINAL = SOURCE / "assets/designvorlagen"
OLD = json.loads((SOURCE / "design-gallery-data.json").read_text(encoding="utf-8"))
assert len(OLD) == 32 and [x["id"] for x in OLD] == [f"FP-{i:03d}" for i in range(1,33)]
source_hashes = {
    f"fp-{i:03d}.webp": hashlib.sha256((ORIGINAL/f"fp-{i:03d}.webp").read_bytes()).hexdigest()
    for i in range(1,33)
}
MASTER = ROOT / "site/assets/fotopolis-goldmark.webp"
master_hash = hashlib.sha256(MASTER.read_bytes()).hexdigest()
logo = Image.open(MASTER).convert("RGB")
assert logo.width >= 190 and logo.height >= 190

MORE = [
 ("Ivory Editorial", "elegant", "ivory", 1, "Ruhiges Editorial-Layout mit großem Einzelbild"),
 ("Espresso Signature", "elegant", "espresso", 2, "Zwei klare Bildflächen in tiefem Espresso"),
 ("Whispered Vows", "hochzeit", "blush", 3, "Romantische Hochzeit mit drei Fotofeldern"),
 ("Champagne Wedding", "hochzeit", "sand", 2, "Sanfte Champagnertöne für besondere Ja-Momente"),
 ("Golden Birthday", "geburtstag", "ivory", 3, "Lebendiger Geburtstag mit eleganter Collage"),
 ("Birthday Nocturne", "geburtstag", "noir", 2, "Abendliche Geburtstagsparty in warmem Schwarz"),
 ("Corporate Atelier", "firma", "espresso", 1, "Zurückhaltendes Corporate-Keyvisual mit Fotobereich"),
 ("Modern Gala", "firma", "sand", 3, "Geometrische Dreiercollage für anspruchsvolle Events"),
 ("Winter Ivory", "weihnachten", "ivory", 2, "Festliche Winterästhetik mit warmen Naturtönen"),
 ("Midnight Celebration", "weihnachten", "noir", 3, "Silvester und Festmomente in Schwarz und Gold"),
 ("Boho Roadtrip", "hochzeit", "sage", 2, "Natürliche Boho-Farbwelt passend zum Camper"),
 ("Simply Timeless", "elegant", "sand", 1, "Minimalistische Signature Edition für jeden Anlass"),
]
assert len(MORE) == 12
catalogue = [dict(x) for x in OLD]
for i,(name,category,palette,photos,description) in enumerate(MORE,33):
    catalogue.append({"id":f"FP-{i:03d}","name":name,"category":category,
                      "palette":palette,"photos":photos,"logoSlot":False,
                      "description":description,
                      "image":f"/assets/designvorlagen/fp-{i:03d}.webp",
                      "source":"Studio 11 procedural original; print overlay in /print"})
for item in catalogue[:32]:
    # The user expressly requires all authentic original motifs, names,
    # palettes and photo-window geometries to stay intact. Only original
    # FOTOPOLIS seals are replaced and original photo holes cut transparent.
    item["collection"]="classics"
    if item["id"]=="FP-017":
        # Verified against the archived original raster: 4 golden windows.
        # Historical catalogue mistakenly said 3, so correct the metadata.
        item["photos"]=4
        item["description"]="Vier ursprüngliche Goldrahmen für vier separate Fotos"
    else:
        item["description"]="Originalmotiv fachgerecht restauriert · "+item["description"]
for item in catalogue[32:]:
    item["collection"]="signature"
    item["originalMotifPreserved"]=False
assert len(catalogue) == 44 and len({x["id"] for x in catalogue}) == 44

PALETTES = {
  "ivory":((249,246,240),(45,37,29),(180,141,89)),
  "sand":((235,222,203),(49,37,27),(165,127,77)),
  "blush":((247,235,230),(68,43,42),(174,132,104)),
  "sage":((230,232,222),(49,56,47),(153,127,86)),
  "espresso":((49,39,32),(246,238,224),(203,167,112)),
  "noir":((25,22,20),(250,243,231),(196,153,97)),
}
def font(size,serif=True):
    file = ("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf" if serif
            else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
    try: return ImageFont.truetype(file,size)
    except OSError: return ImageFont.load_default(size=size)

def mix(a,b,t):
    return tuple(round(a[k]*(1-t)+b[k]*t) for k in range(3))
def lighten(rgb,portion):
    return mix(rgb,(255,255,255),portion)
def darken(rgb,portion):
    return mix(rgb,(0,0,0),portion)

def rects(count,variant):
    # All windows leave a safe headline zone above and the original-logo zone below.
    if count==1:
        return [(92,253,1680,980)] if variant%2 else [(112,253,1657,980)]
    if count==2:
        if variant%2:
            return [(92,249,861,980),(894,249,1680,980)]
        return [(94,253,1677,610),(94,641,1677,980)]
    if variant%3==0:
        return [(92,252,1033,980),(1067,252,1680,612),(1067,642,1680,980)]
    if variant%3==1:
        return [(94,252,590,980),(622,252,1162,980),(1194,252,1680,980)]
    return [(94,252,1678,606),(94,640,870,980),(903,640,1678,980)]

def graphic(draw,kind,n,bg,accent):
    rng=random.Random(n*193)
    # Restrained editorial frame and corner motifs; none touches a photo window.
    draw.rectangle((35,34,W-35,H-32),outline=(*accent,150),width=2)
    for idx in range(3):
        y = 46 + idx*9
        draw.line((46+idx*16,y,360+idx*22,y),fill=(*accent,90-idx*17),width=2)
    if kind=="hochzeit":
        for side in (-1,1):
            x0=72 if side==-1 else W-72
            for j in range(6):
                y=56+j*17
                x=x0+(j*7 if side==-1 else -j*7)
                draw.line((x,y,x+(24 if side==-1 else -24),y+30),
                          fill=(*accent,92),width=2)
                draw.ellipse((x-7,y+9,x+7,y+23),outline=(*accent,100),width=2)
    elif kind=="weihnachten":
        for side in (0,1):
            x0=95 if not side else W-95
            draw.line((x0,44,x0+(46 if not side else -46),166),
                      fill=(*accent,110),width=3)
            for j in range(4):
                y=75+j*23
                x=x0+(j*8 if not side else -j*8)
                draw.line((x,y,x+(31 if not side else -31),y+14),
                          fill=(*accent,85),width=2)
    elif kind=="geburtstag":
        for j in range(13):
            x=rng.choice([rng.randrange(45,350),rng.randrange(1450,1710)])
            y=rng.randrange(55,218)
            r=rng.randrange(2,6)
            draw.ellipse((x-r,y-r,x+r,y+r),fill=(*accent,rng.randrange(80,150)))
    elif kind=="firma":
        for t in (0,22,44):
            draw.line((W-375+t,53,W-65+t,183),fill=(*accent,90-t),width=2)
    else:
        draw.arc((W-330,17,W-70,225),20,140,fill=(*accent,110),width=2)
        draw.arc((W-350,14,W-90,228),200,330,fill=(*accent,75),width=2)

def header(draw,item,text,gold):
    """Print-only editorial ornament. The design's catalogue NAME is metadata.

    Never typeset a template name, category label or collection label on an
    event photo print. The customer receives an unbranded-title photo frame;
    the FOTOPOLIS brand seal is added separately at the lower right.
    """
    # Preserve the intentional, refined top margin without printing
    # "Ivory Editorial", "Wedding Edition" or similar internal catalogue IDs.
    y=166
    draw.line((99,y,403,y),fill=(*gold,155),width=2)
    draw.line((W-403,y,W-99,y),fill=(*gold,155),width=2)
    for x in (89,W-89):
        draw.ellipse((x-3,y-3,x+3,y+3),fill=(*gold,170))


classic_records=[]
classic_pairs=[]
def make(item):
    n=int(item["id"][-3:])
    if n<=32:
        before,after,rec=faithful_original(item,ORIGINAL,logo,PRINT,TARGET,W,H,DPI)
        classic_records.append(rec)
        classic_pairs.append((before,after))
        return after
    palette=item["palette"] if item["palette"] in PALETTES else "ivory"
    bg,text,gold=PALETTES[palette]
    rng=random.Random(n*776)
    dark=palette in ("noir","espresso")
    # Mathematically exact print canvas: 15×10cm at 300 pixels/inch.
    paper=Image.new("RGBA",(W,H),(*bg,255))
    d=ImageDraw.Draw(paper)
    top=lighten(bg,.045 if not dark else .025)
    bottom=darken(bg,.035 if not dark else .02)
    for y in range(H):
        rgb=mix(top,bottom,y/(H-1))
        d.line((0,y,W,y),fill=(*rgb,255),width=1)
    graphic(d,item["category"],n,bg,gold)
    header(d,item,text,gold)
    windows=rects(item["photos"],n)
    # A true print overlay must have alpha=0 inside the photograph slots.
    for j,(l,t,r,b) in enumerate(windows):
        assert l>=80 and r<=W-80 and t>=240 and b<=990
        d.rounded_rectangle((l,t,r,b),radius=9,fill=(0,0,0,0))
        d.rounded_rectangle((l,t,r,b),radius=9,
            outline=(*gold,255),width=6)
    # Consistent generous logo safe-zone in the lower right, never fake text.
    logo_size=114
    logo_x=W-79-logo_size
    logo_y=H-51-logo_size
    badge=logo.resize((logo_size,logo_size),Image.Resampling.LANCZOS).convert("RGBA")
    # One precise, anti-aliased circular seal; no existing logo to erase
    # because the sheet is rebuilt from fresh artwork.
    mask=Image.new("L",(logo_size,logo_size),0)
    md=ImageDraw.Draw(mask)
    md.ellipse((1,1,logo_size-2,logo_size-2),fill=255)
    mask=mask.filter(ImageFilter.GaussianBlur(.45))
    d.ellipse((logo_x-5,logo_y-5,logo_x+logo_size+5,logo_y+logo_size+5),
              outline=(*gold,200),width=2)
    paper.paste(badge,(logo_x,logo_y),mask)
    d=ImageDraw.Draw(paper)
    # A clean photo print must not contain stock template labels, demo dates
    # or editorial placeholders. The empty lower-left strip is reserved for
    # event-specific text/branding, added only by an explicitly approved editor.
    d.line((95,H-107,1410,H-107),fill=(*gold,120),width=2)

    path=PRINT / f"fp-{n:03d}.png"
    item["printIncludesTemplateTitle"]=False
    item["printContainsDemoDate"]=False
    item["printUsesCatalogueName"]=False
    item["optionalPersonalizationRegion"]=[95,H-101,750,H-32]
    paper.save(path,"PNG",dpi=(DPI,DPI),optimize=True)
    physical=Image.open(path)
    physical_dpi=physical.info.get("dpi",(0,0))
    assert all(299<=float(x)<=301 for x in physical_dpi), (
        item["id"],"PNG missing verified 300 DPI metadata",physical_dpi)
    check=physical.convert("RGBA")
    assert check.size==(1772,1181), item["id"]
    for l,t,r,b in windows:
        assert check.getpixel(((l+r)//2,(t+b)//2))[3]==0,item["id"]
    assert check.getpixel((logo_x+logo_size//2,logo_y+logo_size//2))[3]==255
    # Display preview: gentle neutral placeholders, not fictitious people.
    placeholder=Image.new("RGBA",(W,H),(*bg,255))
    pd=ImageDraw.Draw(placeholder)
    for j,(l,t,r,b) in enumerate(windows):
        fill=lighten(bg,.55) if dark else darken(bg,.07)
        pd.rectangle((l,t,r,b),fill=(*fill,255))
        txt=f"FOTO {j+1:02d}"
        tt=font(28,False)
        box=pd.textbbox((0,0),txt,font=tt)
        width=box[2]-box[0]
        pd.text(((l+r-width)/2,(t+b)/2-16),txt,font=tt,
                fill=(*gold,155))
    preview=Image.alpha_composite(placeholder,paper).convert("RGB")
    # Never ship 44 full 300-DPI print canvases as gallery thumbnails.
    # Print PNGs remain full-res; only UI previews are compact and responsive.
    web_preview=preview.resize((900,600),Image.Resampling.LANCZOS)
    web_preview.save(TARGET/f"fp-{n:03d}.webp","WEBP",quality=88,method=5)
    if "sha256" in item:
        item["sourceOriginalSha256"]=item["sha256"]
    item["sha256"]=hashlib.sha256((TARGET/f"fp-{n:03d}.webp").read_bytes()).hexdigest()
    item["image"]=f"/assets/designvorlagen/fp-{n:03d}.webp"
    item["printOverlay"]=f"/assets/designvorlagen/print/fp-{n:03d}.png"
    item["format"]="15 x 10 cm Querformat"
    item["dpi"]=DPI
    item["pixelWidth"]=W
    item["pixelHeight"]=H
    item["photoRegions"]=[list(b) for b in windows]
    item["studio11PrintSha256"]=hashlib.sha256(path.read_bytes()).hexdigest()
    return preview

thumbs=[]
for item in catalogue:
    thumbs.append(make(item))
for name,sha in source_hashes.items():
    assert hashlib.sha256((ORIGINAL/name).read_bytes()).hexdigest()==sha
assert hashlib.sha256(MASTER.read_bytes()).hexdigest()==master_hash
(OUT/"assets/design-gallery-data.json").write_text(
    json.dumps(catalogue,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
# Compact contact-sheet: physically generated assets, not AI mockups.
cols=4
tile_w,tile_h=440,293
sheet=Image.new("RGB",(cols*tile_w, math.ceil(len(thumbs)/cols)*(tile_h+24)),
                (245,240,233))
sd=ImageDraw.Draw(sheet)
for i,img in enumerate(thumbs):
    x=(i%cols)*tile_w
    y=(i//cols)*(tile_h+24)
    scaled=img.resize((tile_w,tile_h),Image.Resampling.LANCZOS)
    sheet.paste(scaled,(x,y))
    sd.text((x+8,y+tile_h+4),f"FP-{i+1:03d}",font=font(17,False),
            fill=(60,49,39))
sheet.save(QA/"photoprint-44-contact-sheet.webp","WEBP",quality=91,method=5)

# Full motif-preservation evidence: source on left, faithful new brand on right.
assert len(classic_records)==32 and len(classic_pairs)==32
pair_cell=(480,320)
proof=Image.new("RGB",(pair_cell[0]*4,pair_cell[1]*8),(29,25,21))
proof_draw=ImageDraw.Draw(proof)
for i,(before,after) in enumerate(classic_pairs):
    x=(i%4)*pair_cell[0];y=(i//4)*pair_cell[1]
    orig=before.resize((231,154),Image.Resampling.LANCZOS)
    new=after.resize((231,154),Image.Resampling.LANCZOS)
    proof.paste(orig,(x+4,y+48))
    proof.paste(new,(x+245,y+48))
    proof_draw.text((x+10,y+12),f"FP-{i+1:03d} | ORIGINAL / CLASSIC",font=font(18,False),fill=(242,216,179))
    proof_draw.text((x+255,y+214),"Ein Originalmotiv, ein Goldlogo",font=font(14,False),fill=(199,178,149))
proof.save(QA/"classics-32-source-vs-restored.webp","WEBP",quality=92,method=5)
# Explicit close-up QA on every replaced seal: original vs the real 300-DPI
# print overlay. A full-page browser pass alone cannot reveal branding halos.
zoom_dir=QA/"classics-logo-zoom"
zoom_dir.mkdir(exist_ok=True)
logo_contact=Image.new("RGB",(4*440,8*240),(24,20,17))
logo_draw=ImageDraw.Draw(logo_contact)
for i,rec in enumerate(classic_records):
    number=i+1
    source=Image.open(ORIGINAL/f"fp-{number:03d}.webp").convert("RGB")
    actual=Image.open(PRINT/f"fp-{number:03d}.png").convert("RGB")
    sw,sh=source.size
    x,y=rec["logoCenter"]
    r=rec["newRadius"]
    src_crop=source.crop((x-r-12,y-r-12,x+r+12,y+r+12))
    px=round(x*W/sw)
    py=round(y*H/sh)
    rp=round((r+12)*W/sw)
    dst_crop=actual.crop((px-rp,py-rp,px+rp,py+rp))
    tile=Image.new("RGB",(430,210),(24,20,17))
    tile.paste(ImageOps.contain(src_crop,(204,196)),(3,2))
    tile.paste(ImageOps.contain(dst_crop,(204,196)),(220,2))
    tile.save(zoom_dir/f"fp-{number:03d}-logo-before-after.webp",
              "WEBP",quality=93,method=4)
    xx=(i%4)*440
    yy=(i//4)*240
    logo_contact.paste(tile,(xx,yy))
    logo_draw.text((xx+8,yy+213),f"FP-{number:03d} · Alt / Masterlogo",
                   font=font(14,False),fill=(231,204,169))
logo_contact.save(QA/"classics-32-logo-closeups.webp","WEBP",quality=94,method=5)
(QA/"classics-32-source-fidelity.json").write_text(json.dumps(classic_records,ensure_ascii=False,indent=2),encoding="utf-8")
# Every original id retains one source-based 3:2 composition and a true alpha
# overlay with verified original photo slots (no uniform generic layouts).
assert all(x["originalMotifPreserved"] is True for x in catalogue[:32])
assert all(x["collection"]=="signature" for x in catalogue[32:])

# Existing forms need the new IDs, but no workflow logic or POST is changed.
new_options="".join(
    f'<option value="FP-{n:03d}">FP-{n:03d} · {catalogue[n-1]["name"]}</option>'
    for n in range(33,45)
)
select_pattern=re.compile(r'(<select\b[^>]*\bname="vorlage"[^>]*>)(.*?)(</select>)',re.S)
updated_pages=0
for page in sorted(OUT.rglob("index.html")):
    if "admin" in page.relative_to(OUT).parts:continue
    html=page.read_text(encoding="utf-8")
    def add_options(m):
        if 'value="FP-044"' in m.group(2):return m.group(0)
        return m.group(1)+m.group(2)+new_options+m.group(3)
    updated,count=select_pattern.subn(add_options,html)
    for before,after in [
        ("32 Designvorlagen","44 Designvorlagen"),
        ("32 Fotodesigns","44 Fotodesigns"),
        ("32 Premium-Layouts","44 Premium-Layouts"),
        ("32 exklusive FOTOPOLIS","44 exklusive FOTOPOLIS"),
        ("Alle 32","Alle 44"),
        ("alle 32","alle 44"),
        ("32 individuelle Fotolayouts","44 individuelle Fotolayouts"),
    ]:
        updated=updated.replace(before,after)
    if updated!=html:
        page.write_text(updated,encoding="utf-8")
        updated_pages+=1

# Preserve a truthful separation between the Studio 10 audit (32 originals)
# and the new print candidate (44 distinct redesigns).
audit_path=QA/"studio11-build-audit.json"
existing_audit=json.loads(audit_path.read_text(encoding="utf-8"))
existing_audit["studio11ChangesToPreviewArtwork"]=44
existing_audit["originalSourceDesignsPreserved"]=32
existing_audit["newPrintCandidates"]=12
existing_audit["candidatePrintCollection"]=44
existing_audit["printFormat"]="15 x 10 cm landscape, 1772 x 1181 px, 300 DPI"
existing_audit["printQA"]="44 alpha-overlay PNG files and 44 3:2 WebP gallery previews"
existing_audit["printArtworkManualReview"]="pending 44 individual print layouts"
audit_path.write_text(json.dumps(existing_audit,ensure_ascii=False,indent=2),encoding="utf-8")

report={
 "release":"NOT APPROVED: independent Studio 11 photo-format preview",
 "officialSpecification":"fotopolis-mieten.de/tools/designer/designer.html: 15 x 10 cm, 300 DPI, PNG/JPG",
 "sizeCm":[15,10],"pixelSize":[W,H],"dpi":DPI,
 "originalSourceDesignsPreserved":32,"originalMotifsPreservedInPreview":32,
 "sourceToCandidateQA":"qa/classics-32-source-vs-restored.webp",
 "individuallyDetectedPhotoRegions":32,
 "newDesigns":12,"candidateCount":44,
 "masterGoldmarkSha256":master_hash,
 "sourceOriginalSha256":source_hashes,
 "printOverlays":"alpha-cutout PNG, single master logo, exact photo masks",
 "generatedCatalogCount":len(catalogue),
 "files":[{"id":x["id"],"photoRegions":x["photoRegions"],
           "printOverlay":x["printOverlay"],"sha256":x["studio11PrintSha256"]}
          for x in catalogue],
 "updatedHtmlPages":updated_pages,
 "manualVisualApproval":"PENDING"
}
(QA/"photoprint-44-audit.json").write_text(
 json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
# One-click archive for the physical 15×10 cm alpha-print layouts.
# Keep previews separate; this ZIP is for print operators and needs real photos.
from zipfile import ZipFile, ZIP_STORED
bundle=QA/"FOTOPOLIS_PhotoPrint_44_15x10_300dpi.zip"
with ZipFile(bundle,"w",compression=ZIP_STORED) as archive:
    for overlay in sorted(PRINT.glob("fp-*.png")):
        archive.write(overlay,arcname="print-overlays/"+overlay.name)
    archive.writestr("README.txt",
        "FOTOPOLIS Studio 11.1 — 15x10 cm Querformat, 300 DPI.\\n"
        "Jede PNG-Datei ist ein Foto-Overlay mit transparenten Ausschnitten; "
        "noch kein fertiges Foto.\\n"
        "Logo stammt aus der verbindlichen FOTOPOLIS-Goldmark-Masterdatei.\\n"
        "Vor produktivem Druck Farbraum, Papiermass, Beschnitt und Farbprofil "
        "am Originaldrucker pruefen.\\n"
        "Nur Testvorschau; keine Live-Freigabe.\\n")
# The existing 32 originals are also available separately for event operators.
# This prevents confusing new Signature designs with the familiar Classics.
classics_bundle=QA/"FOTOPOLIS_Classics_32_Originalmotive_15x10_300dpi.zip"
with ZipFile(classics_bundle,"w",compression=ZIP_STORED) as archive:
    for i in range(1,33):
        artwork=PRINT/f"fp-{i:03d}.png"
        assert artwork.exists()
        archive.write(artwork,arcname="FOTOPOLIS-Classics/"+artwork.name)
    archive.writestr("README.txt",
        "32 authentische FOTOPOLIS Classics · Originalmotive neu verarbeitet.\\n"
        "15 × 10 cm · 300 DPI · transparente Fotofenster.\\n"
        "Unveränderte Originalquellen, exakt ein neues freigegebenes Logo.\\n"
        "Druckvorlagen ohne eingefügte Eventfotos, vor Serienproduktion "
        "mit dem Originaldrucker auf Beschnitt/Farben prüfen.\\n")
assert len(list(PRINT.glob("fp-*.png")))==44
assert len(list(TARGET.glob("fp-*.webp")))==44
print(f"FOTOPOLIS PHOTOPRINT: {len(catalogue)} x 15x10cm landscape, "
      f"{W}x{H}px, {DPI} DPI; original 32/master logo untouched.")
