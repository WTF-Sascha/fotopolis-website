from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
import base64,io
root=Path("concepts/premium-v2/qa-screenshots")
out=Image.new("RGB",(1440,1920),"#e8e7e2")
d=ImageDraw.Draw(out)
items=[
 ("Desktop / 1440 px",root/"desktop-1440-fold.png",0),
 ("Tablet / 768 px",root/"tablet-768-fold.png",0),
 ("Mobile / 375 px",root/"mobile-375-fold.png",0),
 ("Desktop / Fotowohnwagen",root/"desktop-1440-product-spotlight.png",0),
 ("Desktop / Fotobox",root/"desktop-1440-product-fotobox.png",0),
 ("Desktop / Fotospiegel",root/"desktop-1440-product-fotospiegel.png",0)
]
for idx,(label,path,offset) in enumerate(items):
 if not path.exists():continue
 pic=Image.open(path).convert("RGB")
 if offset:pic=pic.crop((0,min(offset,pic.height-1),pic.width,min(pic.height,offset+850)))
 pic.thumbnail((670,560),Image.Resampling.LANCZOS)
 x=(idx%2)*720;y=(idx//2)*640
 d.rounded_rectangle((x+7,y+7,x+711,y+632),fill="#fcfbf8",radius=10)
 d.text((x+24,y+17),label,fill="#0c283d")
 out.paste(pic,(x+(720-pic.width)//2,y+52))
out.save(root/"contact-sheet.jpg",quality=82,optimize=True)
preview=out.copy();preview.thumbnail((1200,1600))
buf=io.BytesIO();preview.save(buf,format="JPEG",quality=65,optimize=True)
print("PREMIUM_CONTACT_SHEET_START")
print(base64.b64encode(buf.getvalue()).decode("ascii"))
print("PREMIUM_CONTACT_SHEET_END")
