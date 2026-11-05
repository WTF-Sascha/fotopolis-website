from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont
import base64
from io import BytesIO

folder = Path("qa-artifacts")
pairs = [
    ("Desktop / Hero", folder / "home-desktop-1440.png", 0),
    ("Desktop / Angebote", folder / "home-desktop-1440.png", 900),
    ("Mobil / Hero", folder / "home-mobile-375.png", 0),
    ("Mobil / Kontakt", folder / "kontakt-mobile-375.png", 0),
]
slots = []
for name, source, offset in pairs:
    if not source.exists():
        continue
    im = Image.open(source).convert("RGB")
    height = 900 if im.width >= 1000 else 850
    crop = im.crop((0, min(offset, max(0, im.height - 1)), im.width, min(im.height, offset + height)))
    cropped = ImageOps.contain(crop, (690, 680))
    tile = Image.new("RGB", (720, 740), "#efefef")
    tile.paste(cropped, ((720 - cropped.width) // 2, 44))
    draw = ImageDraw.Draw(tile)
    draw.text((20, 15), name, fill="#222222")
    slots.append(tile)

if not slots:
    print("PREVIEW_CONTACT_SHEET_NOT_AVAILABLE")
    exit(0)

sheet = Image.new("RGB", (1440, 1480), "#dddddd")
for idx, tile in enumerate(slots[:4]):
    sheet.paste(tile, ((idx % 2) * 720, (idx // 2) * 740))
target = folder / "contact-sheet.jpg"
sheet.save(target, quality=70, optimize=True)
buffer=BytesIO()
sheet.resize((1200,1234)).save(buffer,"JPEG",quality=65,optimize=True)
encoded=base64.b64encode(buffer.getvalue()).decode("ascii")
print("PREVIEW_CONTACT_SHEET_B64_BEGIN")
print(encoded)
print("PREVIEW_CONTACT_SHEET_B64_END")
