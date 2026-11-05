from pathlib import Path
from urllib.parse import urljoin, urlparse
from datetime import datetime, timezone
from collections import Counter
import base64, csv, hashlib, io, json, re, requests
from bs4 import BeautifulSoup
from PIL import Image, ImageOps, ImageDraw

URL = "https://fotopolis-mieten.de/"
OUT = Path("review-assets/legacy")
OUT.mkdir(parents=True,exist_ok=True)
session = requests.Session()
session.headers.update({"User-Agent":"Mozilla/5.0 (FOTOPOLIS Brand Asset Review)"})

def allowed(url):
    p=urlparse(url)
    return p.scheme=="https" and p.netloc in ("fotopolis-mieten.de","www.fotopolis-mieten.de") and any(x in p.path for x in ("/wp-content/uploads/","/assets/","/images/","/img/")) and p.path.lower().endswith((".jpeg",".jpg",".png",".webp"))

def original(url):
    p=urlparse(url)
    path=re.sub(r"-[0-9]{2,5}x[0-9]{2,5}(?=\.(?:jpg|jpeg|png|webp)$)","",p.path,flags=re.I)
    return p._replace(path=path,query="",fragment="").geturl()

def get_image(url):
    with session.get(url,timeout=(12,40),stream=True) as r:
        r.raise_for_status()
        chunks=[];size=0
        for part in r.iter_content(131072):
            size+=len(part)
            if size>24000000:raise ValueError("over 24 MB")
            chunks.append(part)
    data=b"".join(chunks)
    img=Image.open(io.BytesIO(data))
    img=ImageOps.exif_transpose(img)
    img.load()
    return img,data

def section_of(img):
    heading=img.find_previous(["h1","h2","h3","h4"])
    return heading.get_text(" ",strip=True) if heading else "Unbekannt"

def category(section,name):
    s=(section+" "+name).lower()
    if any(k in s for k in ("wohnwagen","ww_","wwfront")):return "Fotowohnwagen"
    if "spiegel" in s or "mirror" in s:return "Fotospiegel"
    if "fotobox" in s:return "Fotobox"
    if "angebot" in s or "release" in s:return "Angebote/Events"
    if "galerie" in s:return "Galerie"
    return "Sonstige"

pages=[URL]
for suffix in ("index.html","angebote.html","fotobox.html","fotospiegel.html","spiegel.html","wohnwagen.html","galerie.html","kontakt.html","ueber-uns.html","ueber.html"):
    pages.append(urljoin(URL,suffix))
candidates={}
visited=set()
for page_url in pages[:16]:
    if page_url in visited:continue
    visited.add(page_url)
    try:
        response=session.get(page_url,timeout=(10,24))
        if response.status_code!=200:continue
        if "text/html" not in response.headers.get("content-type","text/html"):continue
        soup=BeautifulSoup(response.text,"html.parser")
        print("PAGE",page_url,len(response.content),"IMG_TAGS",len(soup.find_all("img")),flush=True)
        if "galerie.html" in page_url:
            scan=[]
            for ln in response.text.splitlines():
                if re.search(r"assets/|\\.jpg|\\.png|gallery|galerie|fetch\\(|\\.js",ln,re.I):
                    scan.append(ln.strip()[:1200])
            for tag in soup.select("script[src]"):
                src=urljoin(page_url,tag.get("src",""))
                if src.startswith(URL):
                    try:
                        jr=session.get(src,timeout=(9,15))
                        if jr.ok and len(jr.content)<400000:
                            scan.append("EXTERNAL_SCRIPT "+src)
                            scan.extend(line.strip()[:1200] for line in jr.text.splitlines() if re.search(r"assets/|\\.jpg|\\.png|galerie|gallery",line,re.I))
                    except Exception as err:scan.append("SCRIPT_ERROR "+src+" "+str(err)[:100])
            (OUT/"gallery-source-scan.txt").write_text("\n".join(scan)+"\n",encoding="utf-8")
        for link in soup.find_all("a",href=True):
            link_url=urljoin(page_url,link.get("href",""))
            if link_url.startswith(URL) and link_url.split("?")[0].lower().endswith(".html") and link_url not in visited and link_url not in pages and len(pages)<16:
                pages.append(link_url)
        elements=soup.find_all(["img","source","a"])
        for element in elements:
            urls=[]
            for attr in ("data-src","data-lazy-src","data-background","src","href","poster"):
                if element.get(attr):urls.append(element[attr])
            for attr in ("srcset","data-srcset"):
                if element.get(attr):urls.extend(v.strip().split(" ")[0] for v in element[attr].split(","))
            urls=[urljoin(page_url,u) for u in urls if u]
            urls=[u for u in urls if allowed(u)]
            if not urls:continue
            parent=element.find_previous(["h1","h2","h3","h4"])
            section=parent.get_text(" ",strip=True) if parent else Path(urlparse(page_url).path).stem
            for u in urls:
                canon=original(u)
                candidates.setdefault(canon,{"source_url":canon,"fallback_url":u,"name":Path(urlparse(canon).path).name,"section":section,"alt":element.get("alt","")})
        # Catch images inside inline JS/CSS (hero background, galleries).
        for match in re.finditer(r"""["'(]([^\s"'()<>{}]+\.(?:jpe?g|png|webp)(?:\?[^"'() ]*)?)["')]""",response.text,flags=re.I):
            u=urljoin(page_url,match.group(1))
            if not allowed(u):continue
            canon=original(u)
            candidates.setdefault(canon,{"source_url":canon,"fallback_url":u,"name":Path(urlparse(canon).path).name,"section":Path(urlparse(page_url).path).stem or "Startseite","alt":""})
    except Exception as e:
        print("PAGE_ERROR",page_url,str(e)[:110],flush=True)
candidates=list(candidates.values())[:100]
print("CURRENT_ASSETS_FOUND",len(candidates),flush=True)
if not candidates:
    u="https://fotopolis-mieten.de/assets/wohnwagen/ww_aussen%20%282%29.jpg"
    candidates=[{"source_url":u,"fallback_url":u,"name":"ww_aussen (2).jpg","section":"Fotowohnwagen","alt":""}]
    print("CURRENT_ASSET_FALLBACK",u,flush=True)
rows=[];thumbnails=[];sha_seen=set()
for n,item in enumerate(candidates,1):
    row={"id":"LEG-%03d"%n,**item,"status":"missing","width":0,"height":0,"source_bytes":0,"sha256":"","webp_file":"","webp_bytes":0,"error":"","rights_status":"UNVERIFIED","person_release":"UNVERIFIED","production_approved":False}
    row["category"]=category(item["section"],item["name"])
    try:
        try:photo,data=get_image(item["source_url"]);used=item["source_url"]
        except Exception:photo,data=get_image(item["fallback_url"]);used=item["fallback_url"]
        row["download_url"]=used
        row["width"],row["height"]=photo.size
        row["source_bytes"]=len(data)
        row["sha256"]=hashlib.sha256(data).hexdigest()
        if row["sha256"] in sha_seen:
            row["status"]="duplicate"
        else:
            sha_seen.add(row["sha256"])
            if photo.mode not in ("RGB","RGBA"):photo=photo.convert("RGB")
            photo.thumbnail((1800,1800),Image.Resampling.LANCZOS)
            if photo.mode=="RGBA":
                bg=Image.new("RGB",photo.size,"white")
                bg.paste(photo,mask=photo.getchannel("A"))
                photo=bg
            dest=OUT/(row["id"]+".webp")
            photo.save(dest,"WEBP",quality=80,method=4)
            row["status"]="downloaded"
            row["webp_file"]=dest.as_posix()
            row["webp_bytes"]=dest.stat().st_size
            thumbnail=ImageOps.contain(photo,(200,125))
            thumbnails.append((row["id"],row["category"],thumbnail,row["width"],row["height"]))
    except Exception as e:
        row["error"]=str(e)[:180]
    print("ASSET",row["id"],row["status"],row["name"],row["width"],row["height"],flush=True)
    rows.append(row)

payload={"source":URL,"retrieved_at":datetime.now(timezone.utc).isoformat(),"publication_permitted":False,"entries":rows}
(OUT/"inventory.json").write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding="utf-8")
with (OUT/"inventory.csv").open("w",encoding="utf-8",newline="") as f:
    keys=sorted(set().union(*(x.keys() for x in rows)))
    writer=csv.DictWriter(f,fieldnames=keys,extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)
cols=5;tw=235;th=188;header=62
board=Image.new("RGB",(cols*tw,header+max(1,(len(thumbnails)+cols-1)//cols)*th),(240,238,234))
draw=ImageDraw.Draw(board)
draw.text((16,15),"FOTOPOLIS · Image inventory from existing website",fill=(17,40,60))
draw.text((16,36),"Review only — rights and person consents not verified",fill=(100,70,50))
for i,(id,cat,im,w,h) in enumerate(thumbnails):
    x=(i%cols)*tw;y=header+(i//cols)*th
    draw.rectangle((x+6,y+5,x+tw-6,y+th-5),fill=(255,255,253))
    board.paste(im,(x+(tw-im.width)//2,y+9))
    draw.text((x+12,y+142),id+" · "+cat[:18],fill=(22,45,60))
    draw.text((x+12,y+161),str(w)+" × "+str(h),fill=(110,112,116))
board.save("review-assets/legacy-contact-sheet.jpg","JPEG",quality=79,optimize=True)
ok=[x for x in rows if x["status"]=="downloaded"]
errors=[x for x in rows if x["status"]=="missing"]
small=[x for x in ok if min(x["width"],x["height"])<800]
stats={"identified":len(rows),"imported":len(ok),"failed":len(errors),"duplicates":len(rows)-len(ok)-len(errors),"under800px_shorter_side":len(small),"categories":dict(Counter(x["category"] for x in ok))}
lines=["# FOTOPOLIS — Legacy-Fotobestand 1.0","","Quelle: "+URL,"Status: nur gesonderte Bildbibliothek zur Sichtung. Keine produktive Verwendung oder Veröffentlichung genehmigt.","","## Zahlen"]
lines.extend("- "+k+": "+str(v) for k,v in stats.items() if k!="categories")
lines.append("")
lines.append("## Vorläufige Rubriken")
lines.extend("- "+k+": "+str(v) for k,v in sorted(stats["categories"].items()))
lines.extend(["","## Dateien","- Kontaktbogen: review-assets/legacy-contact-sheet.jpg","- Komprimierte Bildkopien: review-assets/legacy/LEG-###.webp","- Quellennachweis: review-assets/legacy/inventory.json und inventory.csv","","## Noch zu prüfen","- Rechteinhaber, Freigaben erkennbarer Personen, ggf. Location-Freigaben","- Originaldateien mit höherer Auflösung, wenn verfügbar","- Nutzbarkeit je Bild: Hero, Fotobox, Fotospiegel, Fotowohnwagen, Galerie","- Vergleich mit den neuen Produktaufnahmen aus dem parallelen Projektchat","- Keine Platzierung im Netlify-Publish-Ordner, bevor Bildauswahl und Rechte geklärt sind."])
if errors:
    lines+=["","## Fehlende Dateien"]
    lines.extend("- "+r["id"]+" · "+r["name"]+": "+r["error"] for r in errors)
Path("docs/LEGACY_IMAGE_INVENTORY_1_0.md").write_text("\n".join(lines)+"\n",encoding="utf-8")
print("SUMMARY_JSON "+json.dumps(stats,ensure_ascii=False),flush=True)
preview=board.copy()
preview.thumbnail((1100,1650))
buf=io.BytesIO()
preview.save(buf,"JPEG",quality=55,optimize=True)
print("SHEET_B64_START")
print(base64.b64encode(buf.getvalue()).decode("ascii"))
print("SHEET_B64_END")
if not ok:raise RuntimeError("No images downloaded")
