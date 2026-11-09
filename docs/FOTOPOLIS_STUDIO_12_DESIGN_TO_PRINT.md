# FOTOPOLIS Studio 12.0 — Design-to-Print (separate PR preview)

## Branch and integrity

- Based on Studio 11.2, branch feature/studio11-quiet-luxury-20261108, independently developed on feature/studio12-design-to-print-20261109.
- Draft PR #18. Its base is main *only for Netlify preview routing*, because the Studio 11 branch is not branch-deploy-enabled. There is NO authorization to merge, publish or change production.
- All 32 original Classic motifs, 12 Signature editions, source photos, original logo and protected admin remain untouched.
- Only generated preview-build files are changed, plus a new public route /designstudio/.

## Functions

- Gallery modal passes the original template ID and product to the private photo editor.
- All 44 print overlays are selected by manifest data. Exact 1–4 original photo windows are preserved. FP-017 has four distinct windows.
- Client-only image import JPEG/PNG/WebP, max 16 MB; temporary object URLs are revoked immediately after decode. No automatic uploads, tracking or cloud storage of guest photos.
- Crop controls: select a photo slot, upload/replace, drag/touch reposition, zoom 100–250%, recenter/remove.
- Optional personal caption is inserted only on request as a compact left-bottom panel. The approved Goldmark comes directly from the existing print overlay; no second logo is generated.
- Export: pixel-accurate 1772×1181 canvas image, one correct PNG pHYs chunk at 11811 pixels/metre (~300 DPI), CRC-checked. Export locked until all slots are populated.
- Explicit customer-initiated enquiry handoff: template ID and product in the URL, metadata-only message (short caption and filled-state) in same-origin sessionStorage. No guest photo data are transmitted. Contact form remains a separate, GDPR-protected, nonbinding Netlify submission, never auto-submitted.

## Verification

- Retain 14 original public-route Studio 11 browser regressions at 7 widths.
- Add a 15th route, /designstudio/, at 360,390,430,768,1024,1440,1920 pixels.
- Synthetic generated photos test all four FP-017 slots, plus single- and two-photo layouts, zoom, final PNG image dimensions and pHYs/CRC validation.
- Verify gallery-to-editor ID and product, opt-in enquiry transfer, and zero POSTs/photo bytes during preview tests.
- Archive real browser desktop/mobile screenshots and finished synthetic print file.
- All source files and archives remain immutable. Physical proof printing, ICC/colour, bleed, device scaling and manual design approval are outside the technical QA pass.

## Privacy and constraints

- Same-origin Netlify CSP for the editor: local scripts, local endpoints, blob: photo URLs.
- No additional payment service, customer database, analytics or external storage.
- Session metadata is accepted only within 30 minutes; the browser may keep it until the tab closes. It never contains image binaries.
- Low-resolution photos trigger a quality warning, not a misleading guarantee of a crisp physical print.
- The optional caption is displayed in the editor proof but is not a redesign of original baked-in source typography.

## Release discipline

Only a separate Netlify Deploy Preview is permissible. The Studio 11 branch remains a recovery point. No merging into main or publication of fotopolis-mieten.de without explicit approval.
