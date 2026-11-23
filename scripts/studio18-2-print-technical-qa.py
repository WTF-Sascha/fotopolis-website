#!/usr/bin/env python3
"""Studio 18.2 — 44 individual, read-only technical print proofs.

Checks actual PNG/WebP derivatives after the Studio 18.1 build. This never
publishes private print PNGs, mutates DB state, or claims physical color proofs.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PRIVATE = ROOT / "private-design-assets" / "print"
PREVIEWS = ROOT / "preview-build" / "assets" / "designvorlagen"
# The public catalog intentionally strips private cutout geometry. Use the
# protected full catalog for print QA; check the public inventory separately.
CATALOGUE = ROOT / "private-design-assets" / "catalogue.json"
PUBLIC_CATALOGUE = ROOT / "preview-build" / "assets" / "design-gallery-data.json"
REPORT = ROOT / "preview-build" / "qa"
EXPECTED = [f"FP-{i:03d}" for i in range(1, 45)]
W, H = 1772, 1181
rows = []
errors = []

if not PRIVATE.is_dir() or not CATALOGUE.is_file() or not PUBLIC_CATALOGUE.is_file():
    raise SystemExit("FOTOPOLIS PRINT NO-GO: private print assets or catalogue absent")
catalogue = json.loads(CATALOGUE.read_text(encoding="utf-8"))
if [x.get("id") for x in catalogue] != EXPECTED:
    raise SystemExit("FOTOPOLIS PRINT NO-GO: 44 uniquely ordered protected design identifiers absent")
public_catalogue = json.loads(PUBLIC_CATALOGUE.read_text(encoding="utf-8"))
if [x.get("id") for x in public_catalogue] != EXPECTED:
    raise SystemExit("FOTOPOLIS PRINT NO-GO: 44 uniquely ordered public design identifiers absent")
if any("photoRegions" in entry or "printOverlay" in entry for entry in public_catalogue):
    raise SystemExit("FOTOPOLIS PRINT NO-GO: private print geometry leaked to public gallery")

for item in catalogue:
    ident = item["id"]
    name = ident.lower()
    printfile = PRIVATE / f"{name}.png"
    previewfile = PREVIEWS / f"{name}.webp"
    failures = []
    record = {
        "id": ident,
        "collection": item.get("collection"),
        "photoWindowsMetadata": len(item.get("photoRegions") or []),
        "declaredPhotoWindows": item.get("photos"),
        "technicalStatus": "FAIL",
        "physicalPrintApproval": "NOT_TESTED",
        "logoVisualReview": "NOT_TESTED",
        "catalogueTextPixelReview": "NOT_TESTED",
        "iccColorProof": "NOT_TESTED",
        "formatCm": "15x10 landscape",
    }
    if not printfile.is_file():
        failures.append("Protected print file missing")
    if not previewfile.is_file():
        failures.append("Public preview file missing")
    if printfile.is_file():
        try:
            with Image.open(printfile) as raw:
                raw.load()
                record["printSizePx"] = list(raw.size)
                record["printMode"] = raw.mode
                record["dpi"] = list(raw.info.get("dpi", (0, 0)))
                record["iccProfilePresent"] = bool(raw.info.get("icc_profile"))
                if raw.format != "PNG" or raw.size != (W, H):
                    failures.append("Print PNG or dimensions invalid")
                if len(record["dpi"]) != 2 or not all(299 <= float(v) <= 301 for v in record["dpi"]):
                    failures.append("Actual print DPI not 300")
                rgba = raw.convert("RGBA")
                alpha = rgba.getchannel("A").getextrema()
                record["alphaExtrema"] = list(alpha)
                if alpha[0] != 0 or alpha[1] != 255:
                    failures.append("Transparent photo windows/opaque design not verified")
                for region in item.get("photoRegions") or []:
                    if len(region) != 4:
                        failures.append("Malformed photoRegion geometry")
                        continue
                    left, top, right, bottom = map(int, region)
                    if not (0 <= left < right <= W and 0 <= top < bottom <= H):
                        failures.append("PhotoRegion outside print")
                        continue
                    cx, cy = (left + right) // 2, (top + bottom) // 2
                    if rgba.getpixel((cx, cy))[3] != 0:
                        failures.append("Photo window center is not transparent")
                if record["declaredPhotoWindows"] != record["photoWindowsMetadata"]:
                    failures.append("Photo-region count differs from catalogue")
            record["printSha256"] = hashlib.sha256(printfile.read_bytes()).hexdigest()
        except Exception as exc:
            failures.append("Print decode/check error: " + type(exc).__name__)
    if previewfile.is_file():
        try:
            with Image.open(previewfile) as preview:
                preview.load()
                record["previewSizePx"] = list(preview.size)
                if preview.format != "WEBP" or preview.width < 500 or preview.height < 300:
                    failures.append("Preview WebP or dimensions invalid")
            record["previewSha256"] = hashlib.sha256(previewfile.read_bytes()).hexdigest()
        except Exception as exc:
            failures.append("Preview decode/check error: " + type(exc).__name__)
    if (PREVIEWS / "print" / f"{name}.png").exists():
        failures.append("PRIVATE print overlay leaked to public preview")
    record["technicalStatus"] = "PASS" if not failures else "FAIL"
    record["errors"] = failures
    rows.append(record)
    errors.extend(f"{ident}: {message}" for message in failures)

REPORT.mkdir(parents=True, exist_ok=True)
payload = {
    "suite": "Studio 18.2 individual print raster verification",
    "technicalPassCount": len(rows) - len([r for r in rows if r["technicalStatus"] != "PASS"]),
    "candidateCount": len(rows),
    "physicalPrintApproval": "NOT_TESTED",
    "supportedFormat": "15 x 10 cm landscape at 300 DPI",
    "fiveByFifteenCm": "NOT_IMPLEMENTED_OR_VERIFIED",
    "verificationLimit": "Automated raster checks only. No OCR, print hardware, ICC profile proof, logo appearance or manual design approval.",
    "entries": rows,
    "errors": errors,
}
(REPORT / "studio18-2-print-technical-matrix.json").write_text(
    json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
head = ["# Studio 18.2 — 44 technische Druckvorlagen-Einzelkontrollen", "",
        "Reine Rasterprüfung. **Keine physische, Farb- oder Motivfreigabe.**", "",
        "| ID | Technischer Status | Größe | DPI | Logo-Sichtprüfung | Realer Druck |",
        "|---|---|---|---|---|---|"]
for row in rows:
    head.append("| {id} | {status} | {size} | {dpi} | NICHT GEPRÜFT | NICHT GEPRÜFT |".format(
        id=row["id"], status=row["technicalStatus"],
        size="×".join(str(x) for x in row.get("printSizePx", [])),
        dpi=" / ".join(f"{x:.2f}" for x in row.get("dpi", []))))
(REPORT / "studio18-2-print-technical-matrix.md").write_text("\n".join(head)+"\n",encoding="utf-8")
if errors:
    raise SystemExit("FOTOPOLIS PRINT NO-GO: "+str(len(errors))+" structural checks failed: "+"; ".join(errors[:8]))
print(f"FOTOPOLIS PRINT TECHNICAL QA: {len(rows)}/44 candidates structurally verified; physical proofs remain OPEN")
