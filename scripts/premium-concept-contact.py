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

# Temporary export of production-quality responsive, proportionally scaled WebP encodes.
# Original PNGs in incoming/ remain byte-for-byte unchanged.
for file_key,output_name,width_target in (
  ("upload-b.png","fotobox-event-1672.webp",1672),
  ("upload-b.png","fotobox-event-800.webp",800),
  ("upload-c.png","fotowohnwagen-gartenparty-1448.webp",1448),
  ("upload-c.png","fotowohnwagen-gartenparty-760.webp",760),
):
    with Image.open(sources/file_key) as loaded:
        photo=loaded.convert("RGB")
        if photo.width!=width_target:
            height_target=round(photo.height*width_target/photo.width)
            photo=photo.resize((width_target,height_target),Image.Resampling.LANCZOS)
        outbuf=io.BytesIO()
        photo.save(outbuf,format="WEBP",quality=94,method=6,exact=True)
        payload=outbuf.getvalue()
        digest=sha256(payload).hexdigest()
        print("FOTOPOLIS_WEBP_START",output_name,photo.width,photo.height,len(payload),digest)
        encoded=base64.b64encode(payload).decode("ascii")
        for offset in range(0,len(encoded),5000):
            print("FOTOPOLIS_WEBP_CHUNK",encoded[offset:offset+5000])
        print("FOTOPOLIS_WEBP_END",output_name)
# Confirm original Fotospiegel render corresponds to incoming source after a proportional resize.
with Image.open(sources/"upload-a.png") as original,Image.open("concepts/premium-v2/assets/fotospiegel-hero-lossless.webp") as established:
    reference=original.convert("RGB").resize(established.size,Image.Resampling.LANCZOS)
    from PIL import ImageChops,ImageStat
    delta=ImageChops.difference(reference,established.convert("RGB"))
    statistics=ImageStat.Stat(delta)
    print("FOTOPOLIS_MIRROR_PIXEL_DELTA",reference.size,established.size,[round(x,4) for x in statistics.mean])
