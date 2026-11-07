#!/usr/bin/env python3
"""Generate a genuine first-fold and enquiry visual-contact sheet."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
from io import BytesIO
import base64

directory=Path("concepts/premium-v2/qa-screenshots/products-v6")
products=["fotobox","fotospiegel","fotowohnwagen"]
labels=["BOX","MIRROR","CAMPER"]
items=[
  (f"{label} / MOBILE HERO",f"{slug}-375-hero.png")
  for label,slug in zip(labels,products)
]+[
  (f"{label} / REQUEST",f"{slug}-375-request.png")
  for label,slug in zip(labels,products)
]+[
  (f"{label} / DESKTOP",f"{slug}-1440-hero.png")
  for label,slug in zip(labels,products)
]
cellw,cellh=300,515
sheet=Image.new("RGB",(3*cellw,3*cellh),(236,232,225))
draw=ImageDraw.Draw(sheet)
valid=0
for i,(label,file) in enumerate(items):
    p=directory/file
    if not p.exists():
        print("PRODUCT_CONTACT_SHEET_MISSING",file)
        continue
    img=Image.open(p).convert("RGB")
    thumb=ImageOps.contain(img,(cellw-12,cellh-40))
    x=(i%3)*cellw+6+(cellw-12-thumb.width)//2
    y=(i//3)*cellh+30
    sheet.paste(thumb,(x,y))
    draw.text(((i%3)*cellw+12,(i//3)*cellh+10),label,fill=(18,40,58))
    draw.rectangle(((i%3)*cellw+1,(i//3)*cellh+1,((i%3)+1)*cellw-1,((i//3)+1)*cellh-1),outline=(186,162,126))
    valid+=1
if valid!=len(items):
    print("PRODUCT_CONTACT_SHEET_INCOMPLETE",valid,len(items))
else:
    b=BytesIO()
    sheet.save(b,format="JPEG",quality=58,optimize=True)
    data=base64.b64encode(b.getvalue()).decode("ascii")
    print("PRODUCT_V6_SHEET_BEGIN")
    for start in range(0,len(data),1100):
        print("PV6",data[start:start+1100])
    print("PRODUCT_V6_SHEET_END")
    print("PRODUCT_V6_SHEET_JPEG_BYTES",len(b.getvalue()))
