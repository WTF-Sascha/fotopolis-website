#!/usr/bin/env python3
"""Render FOTOPOLIS preview-only subpages from reviewed content, not from a live CMS."""
from __future__ import annotations
import json
import re
from html import escape
from pathlib import Path


def e(value: str) -> str:
    return escape(value, quote=True)


def build_pages(source: Path, target: Path, home_html: str) -> list[str]:
    data = json.loads((source / "pages.json").read_text(encoding="utf-8"))
    assert data["status"] == "preview-only"
    assert data["version"] == "2.5"
    header = re.search(r'<header class="site-header">.*?</header>', home_html, re.S)
    footer = re.search(r'<footer class="footer">.*?</footer>', home_html, re.S)
    ribbon = re.search(r'<div class="review-bar">.*?</div></div>', home_html, re.S)
    assert header and footer and ribbon, "Navigation/footer source missing"
    generated = []
    for p in data["pages"]:
        slug = p["slug"]
        assert re.fullmatch(r"[a-z-]+", slug), slug
        assert slug not in generated, f"Duplicate page: {slug}"
        generated.append(slug)
        # All data values are escaped; only preapproved images from this build may be used.
        content = ""
        if "image" in p:
            image = p["image"]
            assert image in {
                "fotobox-event-1672.webp",
                "fotospiegel-hero-lossless.webp",
                "fotowohnwagen-gartenparty-1448.webp",
            }, f"Unapproved product reference: {image}"
            content += (
                '<figure class="page-detail-photo"><img loading="eager" decoding="async" '
                f'src="/assets/images/{e(image)}" alt="{e(p["imageAlt"])}"></figure>'
                '<p class="page-image-caption">Freigegebene, unveränderte Produktvisualisierung.'
                ' Tatsächliche Ausstattung bitte vor Buchung bestätigen.</p>'
            )
        if "gallery" in p:
            assert p["gallery"] == ["LEG-060.webp","LEG-073.webp","LEG-046.webp"]
            content += '<div class="page-gallery-grid">'
            for i,name in enumerate(p["gallery"],start=1):
                content += (
                    f'<figure><img src="/assets/images/{e(name)}" alt="Interne Event-Bildsichtung {i}" loading="lazy" decoding="async">'
                    f'<figcaption>Interne Sichtung {i:02d} · Personenfreigabe offen</figcaption></figure>'
                )
            content += "</div>"
        if "faqs" in p:
            content += '<div class="page-faq">'
            for question, answer in p["faqs"]:
                content += f'<details><summary>{e(question)}</summary><p>{e(answer)}</p></details>'
            content += "</div>"
        for block in p.get("blocks", []):
            content += (
                '<section class="page-content-block">'
                f'<h2>{e(block["heading"])}</h2><p>{e(block["body"])}</p></section>'
            )
        if slug in ("impressum","datenschutz"):
            content = (
                '<div class="page-legal-notice"><strong>Entwurf – kein veröffentlichungsreifer Rechtstext.</strong> '
                'Vor einem Livegang muss die verantwortliche Stelle diese Angaben prüfen und freigeben.</div>'
                + content
            )
        if slug == "kontakt":
            content += (
                '<p><a class="button gold" '
                'href="mailto:kontakt@fotopolis-mieten.de?subject=FOTOPOLIS%20Eventanfrage">'
                'E-Mail-Anfrage vorbereiten <span aria-hidden="true">↗</span></a></p>'
                '<p class="page-image-caption" style="margin:18px 0 0">Öffnet das E-Mail-Programm. '
                'Es wird nichts automatisch versendet.</p>'
            )
        seo_title = f'{e(p["title"])} | FOTOPOLIS – Entwicklungsvorschau'
        page_html = (
            '<!doctype html><html lang="de"><head><meta charset="utf-8">'
            '<meta name="viewport" content="width=device-width,initial-scale=1">'
            '<meta name="robots" content="noindex,nofollow">'
            '<meta name="theme-color" content="#071B30">'
            f'<title>{seo_title}</title><meta name="description" content="{e(p["lead"])}">'
            '<link rel="icon" href="/favicon.ico">'
            '<link rel="stylesheet" href="/styles.css">'
            '<script defer src="/site.js"></script></head><body>'
            '<a class="skip" href="#content">Zum Inhalt springen</a>'
            + ribbon.group(0) + header.group(0) +
            '<main id="content"><section class="page-hero"><div class="inner">'
            '<nav class="page-breadcrumbs" aria-label="Brotkrumennavigation">'
            '<a href="/">Start</a><span aria-hidden="true">/</span>'
            f'<span aria-current="page">{e(p["title"])}</span></nav>'
            f'<span class="kicker">{e(p["eyebrow"])}</span>'
            f'<h1>{e(p["headline"])}</h1><p>{e(p["lead"])}</p>'
            '</div></section><div class="page-body"><div class="inner page-grid">'
            f'<div class="page-article">{content}</div>'
            '<aside class="page-aside"><span class="kicker">UNVERBINDLICH PLANEN</span>'
            '<h2>Dein Event. Dein Moment.</h2>'
            '<p>Welches Erlebnis passt zu deinem Anlass? Schicke uns die Eckdaten, '
            'wir klären das individuell. Kein Live-Kalender und keine Sofortbuchung.</p>'
            '<a class="button gold" href="/kontakt/">Event anfragen '
            '<span aria-hidden="true">↗</span></a></aside></div></div>'
            '<section class="page-end"><div class="inner"><div><h2>Erinnerungen beginnen mit einer Idee.</h2>'
            '<p>FOTOPOLIS · Fotobox · Fotospiegel · Fotowohnwagen</p></div>'
            '<a class="button gold" href="/pakete/">Leistungen ansehen ↗</a></div></section>'
            '</main>' + footer.group(0) + '</body></html>'
        )
        assert page_html.count("<h1>") == 1, slug
        dest = target / slug
        dest.mkdir(parents=True, exist_ok=True)
        (dest / "index.html").write_text(page_html, encoding="utf-8")
    # No indexed publication; every route must have a real generated entry file.
    for slug in generated:
        assert (target / slug / "index.html").is_file()
    return generated


if __name__ == "__main__":
    raise SystemExit("Run via scripts/build-premium-preview.py")
