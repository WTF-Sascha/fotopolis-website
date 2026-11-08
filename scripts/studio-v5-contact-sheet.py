#!/usr/bin/env python3
"""Compose actual browser screenshots for manual visual review in job logs."""
from pathlib import Path
from io import BytesIO
import base64
from PIL import Image, ImageOps, ImageDraw

root=Path("concepts/premium-v2/qa-screenshots/studio-v5")
items=[
    ("HOME · PHONE","home-375.png"),
    ("BOX · PHONE","fotobox-375.png"),
    ("MIRROR · PHONE","fotospiegel-375.png"),
    ("CAMPER · PHONE","fotowohnwagen-375.png"),
    ("CONTACT · PHONE","kontakt-375.png"),
    ("HOME · DESKTOP","home-1440.png"),
]
w,h=310,610
sheet=Image.new("RGB",(3*w,2*h),(229,225,219))
draw=ImageDraw.Draw(sheet)
found=0
for i,(label,filename) in enumerate(items):
    p=root/filename
    if not p.exists():
        print("MISSING_SCREENSHOT",str(p))
        continue
    found+=1
    img=Image.open(p).convert("RGB")
    # Reproduce the first screen plus following section rather than squeezing
    # the entire page (which would make typography unreadable).
    limit=1200 if "DESKTOP" not in label else 1150
    img=img.crop((0,0,img.width,min(img.height,limit)))
    thumb=ImageOps.contain(img,(w-12,h-43))
    x=(i%3)*w+6+(w-12-thumb.width)//2
    y=(i//3)*h+34
    sheet.paste(thumb,(x,y))
    draw.text(((i%3)*w+14,(i//3)*h+10),label,fill=(23,41,54))
    draw.rectangle(((i%3)*w+1,(i//3)*h+1,((i%3)+1)*w-1,((i//3)+1)*h-1),outline=(192,168,131),width=1)
if found!=6:
    print("CONTACT_SHEET_INCOMPLETE",found)
else:
    data=BytesIO()
    sheet.save(data,format="JPEG",quality=57,optimize=True)
    encoded=base64.b64encode(data.getvalue()).decode("ascii")
    print("STUDIO5_CONTACT_SHEET_BEGIN")
    for start in range(0,len(encoded),1100):
        print("S5",encoded[start:start+1100])
    print("STUDIO5_CONTACT_SHEET_END")
    print("STUDIO5_CONTACT_SHEET_JPEG_BYTES",len(data.getvalue()))
