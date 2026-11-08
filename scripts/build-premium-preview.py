#!/usr/bin/env python3
"""Build a self-contained, review-only FOTOPOLIS V2 deploy from the approved development branch.
No secrets, API calls, extra tracking, or deployment to the production website."""
from pathlib import Path
import re, shutil, hashlib

root = Path(__file__).resolve().parents[1]
source = root / "concepts/premium-v2"
target = root / "preview-build"
photos = ()  # Legacy event photos lack verified releases; do not publish.
product_photos = ["fotobox-event-1672.webp","fotobox-event-800.webp","fotowohnwagen-gartenparty-1448.webp","fotowohnwagen-gartenparty-760.webp"]
if target.exists():
    shutil.rmtree(target)
(target / "assets/images").mkdir(parents=True)
for name in ("styles.css", "studio-polish.css", "site.js", "package-planner.js", "gallery-viewer.js", "contact-flow.js", "reference-v4.css", "reference-v4.js", "studio-v5.css", "studio-v5.js", "product-v6.css", "product-enquiry-v6.js"):
    shutil.copy2(source / name, target / name)
shutil.copy2(root / "site/assets/fotopolis-logo-original.png",
             target / "assets/fotopolis-logo-original.png")
shutil.copy2(root / "site/favicon.ico", target / "favicon.ico")

# Premium Design Collection: original motifs remain unchanged in source archive;
# only approved WebP previews are emitted in this isolated build.
template_images = sorted((source / "assets/designvorlagen").glob("fp-*.webp"))
assert len(template_images) == 32, "Exactly 32 unique design previews required"
(target / "assets/designvorlagen").mkdir(parents=True, exist_ok=True)
for image in template_images:
    shutil.copy2(image, target / "assets/designvorlagen" / image.name)
for filename in ("design-gallery.css", "design-gallery.js", "design-gallery-data.json"):
    shutil.copy2(source / filename, target / "assets" / filename)

for name in photos:
    shutil.copy2(root / "review-assets/legacy" / name,
                 target / "assets/images" / name)
# SHA-256 verification of original uploads and precisely encoded WebP derivatives.
for name, expected_hash in {"upload-a.png":"7539ff8fb703d94f461b8a88f49059d236357ee31815e7e7a71a975c501e609b","upload-b.png":"9c77a0fb7d61b80a69c5dad885ed5f0e58324a1c0080c77882a71f518c10a3e4","upload-c.png":"8df769dc97ca651520991c6d53cad794daa2d3896bd7f6b87e85743a463b2ee1"}.items():
    assert hashlib.sha256((source / "assets/incoming" / name).read_bytes()).hexdigest() == expected_hash, f"Original PNG mismatch: {name}"
for name, expected_hash in {"fotobox-event-1672.webp":"ff7a1db74919e2d64f9919c4d82136357ae1b03b4347cab221a801811b8830d1","fotobox-event-800.webp":"6a23627fa229b91bccd6922bd1a16beb43ee8682de788e8e2e98f30e10274e80","fotowohnwagen-gartenparty-1448.webp":"056ed5c167fb2e1954d0ebf00747ecfd77a21588bd162ef861a8f37e3cf776cc","fotowohnwagen-gartenparty-760.webp":"67c11ea6edc7df2ba342e6c8c3054d8abb2ef384e06d9b638c161d8d0bb7b8c6"}.items():
    webp = source / "assets/products" / name
    assert hashlib.sha256(webp.read_bytes()).hexdigest() == expected_hash, f"Optimized product file mismatch: {name}"
    shutil.copy2(webp, target / "assets/images" / name)
shutil.copy2(source / "assets/fotospiegel-hero-lossless.webp",
             target / "assets/images/fotospiegel-hero-lossless.webp")
expected = "c9a493de7b479b13253e1c7ba91da6d8fc5cd775f918c84c5881a71efe640241"
actual = hashlib.sha256((target / "assets/images/fotospiegel-hero-lossless.webp").read_bytes()).hexdigest()
assert actual == expected, "User image checksum changed unexpectedly"
html = (source / "index.html").read_text(encoding="utf-8")
html = html.replace("../../site/assets/fotopolis-logo-original.png",
                    "/assets/fotopolis-logo-original.png")
html = html.replace("../../site/favicon.ico", "/favicon.ico")

# Preserve the approved premium navigation and add the collection to the existing dropdown.
design_nav_anchor = '<a href="/anlaesse/"><strong>Anlässe</strong><small>Hochzeit, Geburtstag &amp; Business</small></a>'
assert design_nav_anchor in html, "Premium navigation anchor changed"
html = html.replace(
    design_nav_anchor,
    design_nav_anchor + '<a href="/designvorlagen/"><strong>Designvorlagen</strong><small>Premium-Looks &amp; Collagen</small></a>',
    1,
)
# A compact, editorial selection creates a route into the full design collection.
design_teaser = (
    '<section class="fpv2-preview-section" aria-labelledby="design-teaser-title"><div class="inner fpv2-preview-inner">'
    '<div class="fpv2-preview-heading"><div><span class="kicker">FOTOPOLIS / DESIGN COLLECTION</span>'
    '<h2 id="design-teaser-title">Das passende Design <em>für deinen Moment.</em></h2></div>'
    '<p>Für Hochzeiten, Geburtstage und Firmenfeiern – entdecke 32 individuelle Fotolayouts.</p></div>'
    '<div class="fpv2-preview-grid">'
    '<a href="/designvorlagen/?vorlage=FP-023"><img src="/assets/designvorlagen/fp-023.webp" loading="lazy" decoding="async" width="1536" height="1024" alt="Edles Marineblau-Champagnergold Design"><span>Signature Gold</span></a>'
    '<a href="/designvorlagen/?vorlage=FP-028"><img src="/assets/designvorlagen/fp-028.webp" loading="lazy" decoding="async" width="1536" height="1024" alt="Romantische Hochzeit Designvorlage"><span>Romantic Wedding</span></a>'
    '<a href="/designvorlagen/?vorlage=FP-031"><img src="/assets/designvorlagen/fp-031.webp" loading="lazy" decoding="async" width="1536" height="1024" alt="Designvorlage für Firmenevents"><span>Company Gala</span></a>'
    '</div><a class="button gold fpv2-preview-cta" href="/designvorlagen/">Alle 32 Designvorlagen ansehen <span aria-hidden="true">↗</span></a>'
    '</div></section>'
)
assert '<section class="v45-final-cta"' in html
html = html.replace('<section class="v45-final-cta"', design_teaser + '<section class="v45-final-cta"', 1)
html = html.replace("</head>", '<link rel="stylesheet" href="/assets/design-gallery.css"></head>', 1)

html = html.replace("../../review-assets/legacy/", "/assets/images/")
html = html.replace("./assets/fotospiegel-hero-lossless.webp",
                    "/assets/images/fotospiegel-hero-lossless.webp")
html = html.replace("./assets/products/", "/assets/images/")
html = html.replace('<link rel="stylesheet" href="./styles.css">',
                    '<link rel="stylesheet" href="/styles.css">')
html = html.replace('<link rel="stylesheet" href="./studio-polish.css">',
                    '<link rel="stylesheet" href="/studio-polish.css">')
html = html.replace('<script defer src="./site.js"></script>',
                    '<script defer src="/site.js"></script>')
html = html.replace('<link rel="stylesheet" href="./reference-v4.css">',
                    '<link rel="stylesheet" href="/reference-v4.css">')
html = html.replace('<script defer src="./reference-v4.js"></script>',
                    '<script defer src="/reference-v4.js"></script>')
html = html.replace('<link rel="stylesheet" href="./studio-v5.css">',
                    '<link rel="stylesheet" href="/studio-v5.css">')
html = html.replace('<script defer src="./studio-v5.js"></script>',
                    '<script defer src="/studio-v5.js"></script>')
# Strictly forbid accidental publication of unreviewed paths or source-only links.
assert "../../" not in html
assert html.count("<h1") == 1
assert not any("/assets/images/LEG-"+n in html for n in ("060.webp","073.webp","046.webp")), "Unreleased people images must not appear"
assert html.count("/assets/images/fotospiegel-hero-lossless.webp") == 1  # single mirror product card
assert '<section class="v4-hero v45-hero"' in html and 'data-v4-product-rail' in html, "Missing Reference Edition home"
assert 'class="v45-home"' in html and 'class="v45-final-cta"' in html, "Missing approved 4.5 homepage"
assert all(x not in html for x in ('id="studio-berater"','data-advisor-occasion','class="home-trust','class="v4-hero-meta','class="gallery section','class="v4-advantages','class="v4-date-cta')), "Retired homepage components remain"
assert html.count('class="v4-product-card"') == 3, "Three product cards required"
# Regression gate: the photo-first premium homepage must never be replaced by the
# print-template catalog, and the design teaser must remain below the products.
assert html.count('id="design-teaser-title"') == 1, "Design teaser missing or duplicated"
assert html.index('id="erlebnisse"') < html.index('id="design-teaser-title"') < html.index('class="v45-final-cta"'), "Design collection displaced the premium product presentation"
assert 'data-design-gallery' not in html, "Full design catalog must only appear on its own page"
assert all(html.count(p) >= 1 for p in (
    'fotobox-event-1672.webp',
    'fotospiegel-hero-lossless.webp',
    'fotowohnwagen-gartenparty-1448.webp',
)), "Approved product photography missing from the homepage"

assert [html.index('id="'+x+'"') for x in ("fotobox","fotospiegel","fotowohnwagen")] == sorted(html.index('id="'+x+'"') for x in ("fotobox","fotospiegel","fotowohnwagen")), "Product order mismatch"
assert 'href="/kontakt/"' in html and 'id="erlebnisse"' in html, "Contact page or product section missing"
assert 'Fotoerlebnisse entdecken' not in html and 'class="v4-hero-actions"' not in html, "Redundant hero discovery CTA remains"
assert 'studio-header' in html and 'studio-v5.css' in html and 'studio-v5.js' in html, "New premium studio system missing"
assert html.count('class="studio-product-index"') == 3, "Editorial index missing from product cards"
assert '/assets/images/fotobox-event-1672.webp' in html.split('<section class="v4-hero v45-hero"',1)[1].split("</section>",1)[0], "Approved hero visual required"
assert all('id="'+a+'"' in html and 'href="/'+a+'/"' in html for a in ("fotobox","fotospiegel","fotowohnwagen")), "Product routes and anchors required"
assert "LEG-019.webp" not in html and "LEG-014.webp" not in html, "No misleading legacy product visuals"
assert "pending-approved-file" not in html and "legacy-reference" not in html, "Outdated placeholder"
assert html.count('data-asset-status="approved-user-upload"') == 2, "Both approved scenes needed"
assert all("/assets/images/" + name in html for name in product_photos), "Responsive assets not linked"
(target / "index.html").write_text(html, encoding="utf-8")
# Build dedicated editorial pages from a single, reviewed content manifest.
# This runs only for Netlify deploy-preview / branch-deploy contexts, never production.
from build_premium_pages import build_pages
routes = build_pages(source, target, html)

# Build the premium design route from the proven gallery module but with the
# CURRENT premium-v2 header/footer and its accessible mobile navigation.
gallery_source = (source / "designvorlagen-template.html").read_text(encoding="utf-8")
gallery_match = re.search(r'<main id="main" data-design-gallery>(.*?)</main>', gallery_source, re.S)
gallery_header = re.search(r'<header\b.*?</header>', html, re.S)
gallery_footer = re.search(r'<footer\b.*?</footer>', html, re.S)
gallery_ribbon = re.search(r'<div class="review-bar">.*?</div></div>', html, re.S)
assert gallery_match and gallery_header and gallery_footer and gallery_ribbon
gallery_html = (
    '<!doctype html><html lang="de"><head><meta charset="utf-8">'
    '<meta name="viewport" content="width=device-width,initial-scale=1">'
    '<meta name="robots" content="noindex,nofollow">'
    '<meta name="theme-color" content="#071B30">'
    '<title>Premium-Designvorlagen | FOTOPOLIS</title>'
    '<meta name="description" content="32 exklusive FOTOPOLIS Fotolayouts für Hochzeiten, Feiern und Firmenevents.">'
    '<link rel="icon" href="/favicon.ico">'
    '<link rel="stylesheet" href="/styles.css">'
    '<link rel="stylesheet" href="/studio-polish.css">'
    '<link rel="stylesheet" href="/reference-v4.css">'
    '<link rel="stylesheet" href="/studio-v5.css">'
    '<link rel="stylesheet" href="/assets/design-gallery.css">'
    '<script defer src="/site.js"></script>'
    '<script defer src="/assets/design-gallery.js"></script>'
    '</head><body class="gl-page"><a class="skip" href="#content">Zum Inhalt springen</a>'
    + gallery_ribbon.group(0) + gallery_header.group(0)
    + '<main id="content" data-design-gallery>' + gallery_match.group(1) + '</main>'
    + gallery_footer.group(0) + '</body></html>'
)
assert gallery_html.count("<h1") == 1
gallery_dest = target / "designvorlagen"
gallery_dest.mkdir(exist_ok=True)
(gallery_dest / "index.html").write_text(gallery_html, encoding="utf-8")

# Contextual teaser: existing product enquiry sections and the gallery of event
# photography stay intact; nothing is changed in their original source manifest.
product_names = {"fotobox": "Fotobox", "fotospiegel": "Fotospiegel", "fotowohnwagen": "Fotowohnwagen"}
for product_slug, display_name in product_names.items():
    path = target / product_slug / "index.html"
    product_html = path.read_text(encoding="utf-8")
    gallery_link = "/designvorlagen/?produkt=" + display_name
    teaser = (
        '<section class="fpv2-preview-section fpv2-preview-compact" aria-label="Fotodesign für dein Event">'
        '<div class="inner fpv2-preview-inner"><div class="fpv2-preview-heading"><div>'
        '<span class="kicker">DEIN FOTO · DEIN DESIGN</span>'
        '<h2>Ein Foto. <em>Dein Signature-Look.</em></h2></div>'
        '<p>32 Premium-Layouts für Hochzeiten, Geburtstage und geschäftliche Veranstaltungen.</p>'
        '</div><a class="button gold fpv2-preview-cta" href="' + gallery_link + '">'
        'Designvorlagen entdecken <span aria-hidden="true">↗</span></a></div></section>'
    )
    product_html = product_html.replace("</head>", '<link rel="stylesheet" href="/assets/design-gallery.css"></head>', 1)
    assert product_html.count("</main>") == 1
    product_html = product_html.replace("</main>", teaser + "</main>", 1)
    path.write_text(product_html, encoding="utf-8")

# Product gallery and image collection remain separate: photo gallery is for
# equipment/event imagery; design collection is for printable layouts.
existing_gallery = target / "galerie/index.html"
old_gallery = existing_gallery.read_text(encoding="utf-8")
gallery_cta = (
    '<section class="fpv2-preview-section fpv2-preview-compact"><div class="inner fpv2-preview-inner">'
    '<div class="fpv2-preview-heading"><div><span class="kicker">FOTOPOLIS DESIGN COLLECTION</span>'
    '<h2>Gestaltung, die <em>zu deinem Event passt.</em></h2></div>'
    '<p>Hier findest du nicht nur Fotoerlebnisse, sondern auch unsere Designvorlagen.</p></div>'
    '<a class="button gold fpv2-preview-cta" href="/designvorlagen/">Alle 32 Fotodesigns ansehen ↗</a>'
    '</div></section>'
)
assert old_gallery.count("</main>") == 1
old_gallery = old_gallery.replace("</head>", '<link rel="stylesheet" href="/assets/design-gallery.css"></head>', 1)
old_gallery = old_gallery.replace("</main>", gallery_cta + "</main>", 1)
existing_gallery.write_text(old_gallery, encoding="utf-8")

assert routes == [
    "fotobox","fotospiegel","fotowohnwagen","pakete","galerie",
    "anlaesse","ueber-uns","faq","kontakt","impressum","datenschutz"
], f"Unexpected route inventory: {routes}"
# Product Studio 6.0: prove there is one on-page enquiry per product,
# no repeated product photo inside the story and no unconnected booking CTA.
for slug in ("fotobox", "fotospiegel", "fotowohnwagen"):
    product_html = (target / slug / "index.html").read_text(encoding="utf-8")
    assert product_html.count('data-product-request-section') == 1, f"Missing inline enquiry: {slug}"
    assert product_html.count('data-product-request ') == 1, f"Missing real form: {slug}"
    assert 'id="terminanfrage"' in product_html and 'href="#terminanfrage"' in product_html, f"Broken term link: {slug}"
    assert 'name="datum" type="date"' in product_html and 'name="email" type="email"' in product_html, f"Missing request fields: {slug}"
    assert 'data-product-request-email' in product_html and 'data-product-request-copy' in product_html, f"Missing email/copy actions: {slug}"
    assert '/product-v6.css' in product_html and '/product-enquiry-v6.js' in product_html
    assert 'class="page-aside"' not in product_html and 'class="page-end"' not in product_html, f"Redundant CTAs: {slug}"
    assert 'class="s7-story-layout"' in product_html and 'class="s7-feature-grid product-specs"' in product_html, f"Studio 7 story missing: {slug}"
    assert product_html.count('data-product-step="1"') == 1 and product_html.count('data-product-step="2"') == 1, f"Two-step enquiry missing: {slug}"
    assert 'data-product-next' in product_html and 'data-product-back' in product_html, f"Two-step controls missing: {slug}"
    assert product_html.index('id="terminanfrage"') < product_html.index('class="page-body"'), f"Enquiry too late: {slug}"
    assert 'class="product-identity-art"' not in product_html and 'class="product-v6-steps"' not in product_html, f"Retired decorative layout remains: {slug}"
    assert 'class="product-stage-media"' not in product_html, f"Duplicated product picture: {slug}"


# The legacy browser-only admin prototype is retired from the deploy.
# /admin/ now leads exclusively to the protected Neon Auth sign-in screen.
admin_source = source / "admin"
admin_target = target / "admin"
admin_target.mkdir(exist_ok=True)
shutil.copy2(admin_source / "admin.css", admin_target / "admin.css")
admin_html = """<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="referrer" content="no-referrer">
<title>FOTOPOLIS · Verwaltung</title>
<meta http-equiv="refresh" content="0; url=/admin/login/"></head>
<body><main><h1>FOTOPOLIS Verwaltung</h1>
<p><a href="/admin/login/">Zur geschützten Anmeldung</a></p>
</main></body></html>"""
(admin_target / "index.html").write_text(admin_html, encoding="utf-8")
assert 'url=/admin/login/' in admin_html
assert not (admin_target / "admin.js").exists(), "Legacy demo must never ship"
assert not any((target / x).exists() for x in ("database", "database_url", ".env"))

# Roadmap 7.5: optional Neon Auth first-account verification route.
# Only HTML/CSS are copied here. The official SDK is bundled in the next
# npm build:auth step; the SQL reader credential is never in this output.
login_source = admin_source / "login"
login_target = admin_target / "login"
login_target.mkdir(exist_ok=True)
for name in ("index.html", "login.css"):
    shutil.copy2(login_source / name, login_target / name)
login_html = (login_target / "index.html").read_text(encoding="utf-8")
assert 'name="robots" content="noindex,nofollow,noarchive"' in login_html
assert '/admin/login/login-bundle.js' in login_html
assert 'POSTGRES' not in login_html and 'password=' not in login_html

# Studio 3.6: separate real-data admin dashboard; no static admin data or
# database credentials are published. All API access is bearer/JWKS gated.
dashboard_source = admin_source / "dashboard"
dashboard_target = admin_target / "dashboard"
dashboard_target.mkdir(exist_ok=True)
for name in ("index.html", "dashboard.css", "inventory-manager.css", "inventory-manager.js", "planning-manager.css", "planning-manager.js", "planning-logic.js", "reservations-manager.css", "reservations-manager.js", "csv-export.js", "operations-insights.css", "operations-insights.js", "first-run.css", "first-run.js"):
    shutil.copy2(dashboard_source / name, dashboard_target / name)
dashboard_html = (dashboard_target / "index.html").read_text(encoding="utf-8")
assert 'id="dashboard-app" hidden' in dashboard_html
assert '/admin/dashboard/dashboard-bundle.js' in dashboard_html
assert '/admin/dashboard/inventory-manager.css' in dashboard_html
assert '/admin/dashboard/planning-manager.css' in dashboard_html
assert '/admin/dashboard/reservations-manager.css' in dashboard_html
assert '/admin/dashboard/first-run.css' in dashboard_html
assert 'data-setup-health-check' in dashboard_html
assert 'data-setup-progress' in dashboard_html
assert '/admin/dashboard/operations-insights.css' in dashboard_html
assert 'data-agenda' in dashboard_html
assert 'data-inventory-search' in dashboard_html
assert 'data-reservations-manager' in dashboard_html
assert 'data-planning-manager' in dashboard_html
assert 'day-detail-dialog' in dashboard_html
assert 'data-inventory-manager' in dashboard_html
assert 'data-count="resources"' in dashboard_html
assert 'name="robots" content="noindex,nofollow,noarchive"' in dashboard_html
assert 'DATABASE_URL' not in dashboard_html and 'password=' not in dashboard_html

# Build QA: all referenced local assets must exist.
for match in re.finditer(r'srcset="([^"]+)"', html):
    for entry in match.group(1).split(","):
        ref = entry.strip().split()[0]
        assert ref.startswith("/assets/images/") and (target / ref.lstrip("/")).exists(), f"Missing srcset file {ref}"

for found in re.finditer(r'(?:src|href)="(/[^"#?]+)"', html):
    ref = found.group(1)
    assert (target / ref.lstrip("/")).exists(), f"Missing preview asset {ref}"
# No edits to the approved logo; exact copy verified byte-for-byte.
assert hashlib.sha256((target / "assets/fotopolis-logo-original.png").read_bytes()).digest() == hashlib.sha256((root / "site/assets/fotopolis-logo-original.png").read_bytes()).digest()
print(f"FOTOPOLIS STUDIO: {len(routes)} editorial pages and isolated admin management; approved product photography and Reference Edition V4 layout")
