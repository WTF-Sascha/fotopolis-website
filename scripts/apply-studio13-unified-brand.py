#!/usr/bin/env python3
"""Studio 13.1: canonical Quiet-Luxury brand across the built PWA, public routes and admin.
Runs after Studio 13 security hardening, before preview deployment.
Never edits source logos, templates, photography, auth or database.
"""
from __future__ import annotations
import hashlib
import json
import re
import shutil
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"preview-build"
SRC=ROOT/"site/assets/fotopolis-goldmark.webp"
THEME=ROOT/"concepts/premium-v2/studio13-unified-brand.css"
assert SRC.is_file() and THEME.is_file() and (OUT/"admin/dashboard/index.html").is_file()
original=hashlib.sha256(SRC.read_bytes()).hexdigest()
assert hashlib.sha256((OUT/"assets/fotopolis-goldmark.webp").read_bytes()).hexdigest()==original
assets=OUT/"icons"
assets.mkdir(exist_ok=True)
shutil.copy2(THEME,OUT/"studio13-unified-brand.css")

# Generate sharp-enough icons from the EXACT existing approved goldmark without changing any
# original logo pixel, lettering, color or geometry. Only proportional resizing and neutral
# padding are allowed. Goldmark master is ~188px; original-resolution limitation remains documented.
mark=Image.open(SRC).convert("RGBA")
assert mark.width>=180 and mark.height>=180
ground=(33,26,21,255)
def app_icon(size,maskable=False):
    canvas=Image.new("RGBA",(size,size),ground)
    # Maskable foreground stays inside Android's guaranteed central safe zone.
    ratio=.66 if maskable else .91
    dimension=max(1,round(size*ratio))
    scaled=mark.resize((dimension,dimension),Image.Resampling.LANCZOS)
    inset=(size-dimension)//2
    canvas.alpha_composite(scaled,(inset,inset))
    return canvas.convert("RGB")
for sz in (16,32,48,64,192,512):
    icon=app_icon(sz)
    icon.save(assets/f"icon-{sz}.png",format="PNG",optimize=True)
    icon.save(assets/f"brand-{sz}.png",format="PNG",optimize=True)
app_icon(180).save(assets/"apple-touch-icon-180.png",format="PNG",optimize=True)
app_icon(180).save(assets/"brand-180.png",format="PNG",optimize=True)
app_icon(512,True).save(assets/"icon-maskable-512.png",format="PNG",optimize=True)
app_icon(512,True).save(assets/"brand-maskable-512.png",format="PNG",optimize=True)
app_icon(48).save(OUT/"favicon.png",format="PNG",optimize=True)
app_icon(64).save(OUT/"favicon.ico",format="ICO",sizes=[(16,16),(32,32),(48,48),(64,64)])

manifest_path=OUT/"manifest.webmanifest"
manifest=json.loads(manifest_path.read_text(encoding="utf-8"))
assert manifest["id"]=="/" and manifest["scope"]=="/" and manifest["display"]=="standalone"
manifest["theme_color"]="#211a15"
manifest["background_color"]="#faf6ef"
manifest["icons"]=[
 {"src":"/icons/brand-192.png","sizes":"192x192","type":"image/png","purpose":"any"},
 {"src":"/icons/brand-512.png","sizes":"512x512","type":"image/png","purpose":"any"},
 {"src":"/icons/brand-maskable-512.png","sizes":"512x512","type":"image/png","purpose":"maskable"}
]
manifest_path.write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")

# Recolor ONLY admin CSS hex colors that are visibly blue/cyan, preserving their
# relative lightness and alpha. Other colors, including semantic red and green, stay.
# The explicit shared token stylesheet is loaded last and handles layout and components.
admin_css=[OUT/"admin/admin.css",OUT/"admin/login/login.css"]
admin_css+=list((OUT/"admin/dashboard").glob("*.css"))
admin_css+=list((OUT/"admin/designstudio").glob("*.css"))
palette=("#231a15","#352920","#4d3d30","#655347","#776658","#978572","#b4a08a","#d8cab8","#efe7db")
def warm_hex(token):
    digits=token[1:]
    digits=digits*2 if len(digits) in (3,4) else digits
    if len(digits) not in (6,8):return token
    try: r,g,b=[int(digits[i:i+2],16)/255 for i in (0,2,4)]
    except ValueError:return token
    import colorsys
    hue,light,sat=colorsys.rgb_to_hls(r,g,b)
    # Blue/cyan only; ochre, beige, warm gray, green statuses and reds are preserved.
    if not (.48<=hue<=.72 and sat>=.085):return token
    new=palette[min(8,int(light*9))]
    return new+(digits[6:] if len(digits)==8 else "")
colors_changed={}
for path in admin_css:
    if not path.exists():continue
    text=path.read_text(encoding="utf-8")
    hits=[0]
    def replace(match):
        result=warm_hex(match.group(0))
        if result!=match.group(0):hits[0]+=1
        return result
    updated=re.sub(r"#[0-9a-fA-F]{3,8}\b",replace,text)
    updated=updated.replace("rgba(7,27,48,","rgba(33,26,21,")
    updated=updated.replace("rgb(7,27,48","rgb(33,26,21")
    path.write_text(updated,encoding="utf-8")
    colors_changed[str(path.relative_to(OUT))]=hits[0]

# A single, last-loaded stylesheet for EVERY public page and EVERY admin entry.
html_files=sorted(OUT.rglob("index.html"))
assert len(html_files)>=17
changed=[]
for path in html_files:
    relative=path.relative_to(OUT)
    html=path.read_text(encoding="utf-8")
    assert html.count("</head>")==1,relative
    assert "/studio13-unified-brand.css" not in html,relative
    html=html.replace("/assets/fotopolis-logo-original.png","/assets/fotopolis-goldmark.webp")
    # Unify all icons; avoid an old favicon overriding our PWA identity.
    html=re.sub(r'<link\b[^>]*\brel=["\']icon["\'][^>]*>',"",html,flags=re.I)
    html=re.sub(r'<link\b[^>]*\brel=["\']apple-touch-icon["\'][^>]*>',"",html,flags=re.I)
    icon_markup=(
      '<link rel="icon" href="/icons/brand-32.png" type="image/png" sizes="32x32">'
      '<link rel="icon" href="/favicon.ico" sizes="any">'
      '<link rel="apple-touch-icon" href="/icons/brand-180.png" sizes="180x180">'
    )
    if re.search(r'<meta\s+name=["\']theme-color["\']\s+content=["\'][^"\']+["\']',html,re.I):
        html=re.sub(r'(<meta\s+name=["\']theme-color["\']\s+content=["\'])[^"\']+',r'\g<1>#211a15',html,count=1,flags=re.I)
    else:
        html=html.replace("</head>",'<meta name="theme-color" content="#211a15"></head>',1)
    html=html.replace("</head>",icon_markup+'<link rel="stylesheet" href="/studio13-unified-brand.css"></head>',1)
    if relative.parts[0]=="admin":
        assert "studio13-unified-brand.css" in html
    path.write_text(html,encoding="utf-8")
    changed.append(str(relative))

# A new version and the actual new icon URLs ensure PWA updates use the right logo.
worker_path=OUT/"service-worker.js"
worker=worker_path.read_text(encoding="utf-8")
assert "v13-admin-secure-r1" in worker, "Unexpected PWA cache version"
worker=worker.replace("v13-admin-secure-r1","v13-brand-unified-r2",1)
assert "const CORE=[" in worker
worker=worker.replace("const CORE=[",
 "const CORE=['/studio13-unified-brand.css','/icons/brand-192.png',"
 "'/icons/brand-512.png','/icons/brand-maskable-512.png','/icons/brand-180.png',",1)
assert "/api/" in worker and "/admin/" in worker
worker_path.write_text(worker,encoding="utf-8")

# Assert approved logo and production originals are untouched.
assert hashlib.sha256(SRC.read_bytes()).hexdigest()==original
assert hashlib.sha256((OUT/"assets/fotopolis-goldmark.webp").read_bytes()).hexdigest()==original
assert (OUT/"admin/dashboard/index.html").read_text(encoding="utf-8").count("studio13-unified-brand.css")==1
assert all((assets/i["src"].split("/")[-1]).is_file() for i in manifest["icons"])
assert len(list((OUT/"assets/designvorlagen").glob("fp-*.webp")))==44
print("STUDIO 13.1 BRAND: approved goldmark preserved; PWA icon set regenerated; "+
      str(len(changed))+" routes aligned; recolored legacy blue rules "+
      str(sum(colors_changed.values()))+" across "+str(len(admin_css))+" stylesheets.")
