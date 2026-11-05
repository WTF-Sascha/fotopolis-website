from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
import base64,io
root=Path("concepts/premium-v2/qa-screenshots")
out=Image.new("RGB",(1440,1280),"#e8e7e2")
d=ImageDraw.Draw(out)
items=[
 ("Desktop / 1440 px",root/"desktop-1440-fold.png",0),
 ("Tablet / 768 px",root/"tablet-768-fold.png",0),
 ("Mobile / 375 px",root/"mobile-375-fold.png",0),
 ("Desktop / Angebotssektion",root/"desktop-1440.png",1450)
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
preview=out.copy();preview.thumbnail((1200,1070))
buf=io.BytesIO();preview.save(buf,format="JPEG",quality=65,optimize=True)
print("PREMIUM_CONTACT_SHEET_START")
print(base64.b64encode(buf.getvalue()).decode("ascii"))
print("PREMIUM_CONTACT_SHEET_END")

# Temporary source identification contact sheet for three verbatim GitHub uploads.
# Filenames are deliberately neutral until their visual identity is confirmed.
from PIL import ImageFont
from hashlib import sha256
sources = Path("concepts/premium-v2/assets/incoming")
ident = Image.new("RGB",(1440,600),"#f5f2ed")
draw = ImageDraw.Draw(ident)
for i,name in enumerate(("upload-a.png","upload-b.png","upload-c.png")):
    p=sources/name
    pic=Image.open(p).convert("RGB")
    width,height=pic.size
    digest=sha256(p.read_bytes()).hexdigest()
    print("FOTOPOLIS_UPLOAD_INFO",name,width,height,p.stat().st_size,digest)
    pic.thumbnail((450,505),Image.Resampling.LANCZOS)
    x=480*i+(480-pic.width)//2
    y=65+(505-pic.height)//2
    ident.paste(pic,(x,y))
    draw.text((480*i+16,18),name,fill="#102f49")
ident.save(root/"incoming-contact-sheet.jpg",quality=88,optimize=True)
payload=io.BytesIO()
ident.save(payload,format="JPEG",quality=78,optimize=True)
print("FOTOPOLIS_INCOMING_CONTACT_START")
print(base64.b64encode(payload.getvalue()).decode("ascii"))
print("FOTOPOLIS_INCOMING_CONTACT_END")
