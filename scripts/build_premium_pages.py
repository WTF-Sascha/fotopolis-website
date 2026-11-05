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
    assert data["version"] in ("2.5", "2.6", "2.7")
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
        if "image" in p and not p.get("features"):
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
        # Roadmap point 2: shared premium product stage + source-labelled features.
        # The source product photo is referenced unchanged, never generated or transformed.
        rich_sections = ""
        if p.get("features"):
            assert p["slug"] in ("fotobox", "fotospiegel", "fotowohnwagen")
            image = p["image"]
            assert image in {
                "fotobox-event-1672.webp",
                "fotospiegel-hero-lossless.webp",
                "fotowohnwagen-gartenparty-1448.webp",
            }, image
            rich_sections += (
                '<section class="product-premium" aria-label="Produktpräsentation">'
                '<div class="inner"><div class="product-stage">'
                '<figure class="product-stage-media">'
                f'<img src="/assets/images/{e(image)}" alt="{e(p["imageAlt"])}" '
                f'data-approved-product="{e(p["slug"])}" loading="eager" decoding="async">'
                '<figcaption>Freigegebene Studio-Produktvisualisierung – Bild unverändert. '
                'Ausstattung und Lieferumfang bitte vor Buchung bestätigen.</figcaption></figure>'
                '<div class="product-stage-copy">'
                '<span class="kicker">DAS FOTOERLEBNIS</span>'
                f'<h2>{e(p["tagline"])}</h2>'
                f'<p>{e(p["story"])}</p>'
                f'<a class="button gold" href="/kontakt/">'
                f'{e(p["title"])} anfragen <span aria-hidden="true">↗</span></a>'
                '<small class="product-source-note">Technische Angaben basieren auf der bisherigen '
                'FOTOPOLIS-Website; Details und Verfügbarkeiten werden im Angebot bestätigt.</small>'
                '</div></div>'
                '<div class="product-specs" aria-label="Produktdetails">'
            )
            for feature in p["features"]:
                rich_sections += (
                    '<article class="product-spec">'
                    f'<span class="kicker">{e(feature["label"])}</span>'
                    f'<h3>{e(feature["title"])}</h3>'
                    f'<p>{e(feature["text"])}</p>'
                    f'<small>{e(feature["source"])}</small></article>'
                )
            rich_sections += '</div></div></section>'

            # Include an easy-to-follow, non-binding event planning sequence.
            rich_sections += (
                '<section class="product-steps section">'
                '<div class="inner"><div class="section-heading">'
                '<span class="kicker">DEIN WEG ZUM EVENT</span>'
                '<h2>Von der Idee zum <em>Fotoerlebnis.</em></h2>'
                '<p>Die Planung bleibt persönlich. Ohne Live-Buchung oder unbestätigte Zusagen.</p>'
                '</div><div class="product-step-grid">'
            )
            for number, step in enumerate(p["process"], 1):
                rich_sections += (
                    '<article class="product-step">'
                    f'<span class="step-counter">{number:02d}</span>'
                    f'<h3>{e(step["title"])}</h3><p>{e(step["text"])}</p>'
                    '</article>'
                )
            rich_sections += '</div></div></section>'

        elif p.get("packageCards"):
            rich_sections += (
                '<section class="package-overview section">'
                '<div class="inner"><div class="section-heading">'
                '<span class="kicker">DREI ERLEBNISSE · EIN GUTES GEFÜHL</span>'
                '<h2>Finde dein <em>Fotoerlebnis.</em></h2>'
                '<p>Die Auswahl zeigt den Charakter der Systeme, keine fest zugesagten Paketpreise.</p>'
                '</div><div class="package-cards">'
            )
            for card in p["packageCards"]:
                assert card["slug"] in ("fotobox", "fotospiegel", "fotowohnwagen")
                rich_sections += (
                    '<article class="package-card">'
                    f'<span class="kicker">{e(card["tag"])}</span>'
                    f'<h3>{e(card["title"])}</h3>'
                    f'<p>{e(card["teaser"])}</p>'
                    '<ul class="package-facts">'
                )
                for item in card["checks"]:
                    rich_sections += f'<li>{e(item)}</li>'
                rich_sections += (
                    '</ul><div class="package-card-footer">'
                    '<span>Preis &amp; Verfügbarkeit: auf Anfrage</span>'
                    f'<a class="editorial-link" href="/{e(card["slug"])}/">'
                    f'{e(card["cta"])} <span aria-hidden="true">↗</span></a>'
                    f'<a class="package-select" href="#paketfinder" data-package-choice="{e(card["title"])}">'
                    'Für meine Anfrage auswählen <span aria-hidden="true">↗</span></a>'
                    '</div></article>'
                )
            rich_sections += (
                '</div><div class="compare-block">'
                '<div class="compare-heading"><div>'
                '<span class="kicker">ORIENTIERUNG</span>'
                '<h2>Erlebnisse im Vergleich.</h2></div>'
                '<p>Angaben unverbindlich, finaler Leistungsumfang nur im persönlichen Angebot.</p>'
                '</div>'
                '<div class="compare-scroll" tabindex="0" role="region" '
                'aria-label="Vergleich Fotobox Fotospiegel und Fotowohnwagen">'
                '<table class="compare-table"><thead><tr><th scope="col">Kriterium</th>'
                '<th scope="col">Fotobox</th><th scope="col">Fotospiegel</th>'
                '<th scope="col">Fotowohnwagen</th></tr></thead><tbody>'
            )
            for row in p["comparisonRows"]:
                rich_sections += (
                    '<tr>'
                    f'<th scope="row">{e(row["label"])}</th>'
                    f'<td>{e(row["fotobox"])}</td>'
                    f'<td>{e(row["fotospiegel"])}</td>'
                    f'<td>{e(row["fotowohnwagen"])}</td></tr>'
                )
            rich_sections += '</tbody></table></div></div>'
            rich_sections += (
                '<div class="planning-grid" aria-label="Ablauf deiner unverbindlichen Anfrage">'
            )
            for step in p["planningSteps"]:
                rich_sections += (
                    '<article class="planning-card">'
                    f'<h3>{e(step["title"])}</h3>'
                    f'<p>{e(step["text"])}</p></article>'
                )
            rich_sections += '</div></div></section>'

            # Roadmap 3: offer scope explanations, not fixed prices or fictitious tiers.
            if p.get("serviceTopics"):
                rich_sections += (
                    '<section class="services-overview section" id="leistungsumfang" '
                    'aria-labelledby="services-title"><div class="inner">'
                    '<div class="section-heading"><span class="kicker">LEISTUNGSUMFANG</span>'
                    '<h2 id="services-title">Was gehört <em>zu deinem Event?</em></h2>'
                    '<p>Unsere Leistungen werden für jede Veranstaltung individuell geprüft. '
                    'Die folgenden Angaben sind Möglichkeiten beziehungsweise '
                    'Beschreibungen des bisherigen Angebots, keine fest zugesagten Paketinhalte.</p>'
                    '</div><div class="services-grid">'
                )
                for topic in p["serviceTopics"]:
                    assert re.fullmatch(r"[a-z]+", topic["id"])
                    status = {"bestandsangabe":"Auf der bisherigen Website beschrieben",
                              "anfrage":"Auf Anfrage prüfen",
                              "individuell":"Individuell abstimmen"}[topic["status"]]
                    rich_sections += (
                        f'<article class="service-panel" id="service-{e(topic["id"])}">'
                        '<div class="service-panel-head">'
                        f'<span class="service-status">{e(status)}</span>'
                        f'<h3>{e(topic["title"])}</h3>'
                        f'<p>{e(topic["description"])}</p></div>'
                        '<ul class="service-bullets">'
                    )
                    for bullet in topic["bullets"]:
                        rich_sections += f'<li>{e(bullet)}</li>'
                    rich_sections += '</ul></article>'
                rich_sections += '</div></div></section>'

            # The configurator is local-only and cannot create a reservation.
            if p.get("packagePlanner"):
                cfg = p["packagePlanner"]
                assert cfg["id"] == "package-planner"
                rich_sections += (
                    '<section class="package-planner section" id="paketfinder" '
                    'aria-labelledby="planner-title"><div class="inner">'
                    '<div class="planner-heading"><span class="kicker">DEINE WÜNSCHE</span>'
                    f'<h2 id="planner-title">{e(cfg["title"])}</h2>'
                    f'<p>{e(cfg["introduction"])}</p></div>'
                    '<form class="planner-form" data-package-planner novalidate>'
                    '<fieldset class="planner-fieldset"><legend>01 / Fotoerlebnis wählen</legend>'
                    '<div class="planner-product-grid">'
                )
                for i, item in enumerate(cfg["productOptions"]):
                    assert item["value"] in ("Fotobox","Fotospiegel","Fotowohnwagen")
                    checked = ' checked' if i == 0 else ''
                    rich_sections += (
                        '<label class="planner-product">'
                        f'<input type="radio" name="produkt" value="{e(item["value"])}"{checked}>'
                        f'<span>{e(item["label"])}</span></label>'
                    )
                rich_sections += (
                    '</div></fieldset><div class="planner-options">'
                    '<div class="planner-details">'
                    '<label class="planner-label" for="planner-duration">'
                    '02 / Gewünschte Mietdauer <small>Keine buchbare Tarifstufe</small></label>'
                    '<select id="planner-duration" name="dauer">'
                )
                for option in cfg["durationOptions"]:
                    rich_sections += (
                        f'<option value="{e(option["value"])}">{e(option["label"])}</option>'
                    )
                rich_sections += (
                    '</select><div class="planner-meta-grid">'
                    '<div><label for="planner-date">Wunschtermin (optional)</label>'
                    '<input id="planner-date" name="datum" type="date"></div>'
                    '<div><label for="planner-location">Veranstaltungsort (optional)</label>'
                    '<input id="planner-location" name="ort" type="text" '
                    'maxlength="120" autocomplete="off" placeholder="z. B. Ahlen"></div>'
                    '</div><label for="planner-message">Besondere Wünsche (optional)</label>'
                    '<textarea id="planner-message" name="nachricht" maxlength="500" '
                    'rows="3" placeholder="Was ist dir wichtig?"></textarea></div>'
                    '<fieldset class="planner-fieldset planner-wishes">'
                    '<legend>03 / Mögliche Zusatzleistungen anfragen</legend>'
                    '<p class="planner-help">Auswahl bedeutet Anfrage, nicht Zusage oder Preis.</p>'
                    '<div class="planner-wish-grid">'
                )
                for item in cfg["wishes"]:
                    assert re.fullmatch(r"[a-z]+", item["id"])
                    rich_sections += (
                        '<label class="planner-wish">'
                        f'<input type="checkbox" name="wunsch" value="{e(item["label"])}">'
                        '<span>'
                        f'<strong>{e(item["label"])}</strong>'
                        f'<small>{e(item["detail"])}</small></span></label>'
                    )
                rich_sections += (
                    '</div></fieldset></div>'
                    '<div class="planner-result"><div class="planner-result-header">'
                    '<span class="kicker">DEINE UNVERBINDLICHE AUSWAHL</span>'
                    '<h3>Alles auf einen Blick.</h3>'
                    '<p>Es wird nichts automatisch gesendet oder reserviert.</p></div>'
                    '<div class="planner-result-content">'
                    '<pre data-planner-summary aria-live="polite"></pre>'
                    '</div><div class="planner-actions">'
                    '<a class="button gold" data-planner-email '
                    'href="mailto:kontakt@fotopolis-mieten.de?subject=FOTOPOLIS%20unverbindliche%20Paket-Anfrage">'
                    'E-Mail-Vorlage öffnen <span aria-hidden="true">↗</span></a>'
                    '<button type="button" class="button muted-button" data-planner-copy>'
                    'Auswahl kopieren</button></div>'
                    '<p class="planner-status" data-planner-status role="status"></p>'
                    f'<small class="planner-disclaimer">{e(cfg["disclaimer"])}</small>'
                    '</div></form></div></section>'
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
            '<script defer src="/site.js"></script>' +
            ('<script defer src="/package-planner.js"></script>' if slug == "pakete" else '') +
            '</head><body>'
            '<a class="skip" href="#content">Zum Inhalt springen</a>'
            + ribbon.group(0) + header.group(0) +
            '<main id="content"><section class="page-hero"><div class="inner">'
            '<nav class="page-breadcrumbs" aria-label="Brotkrumennavigation">'
            '<a href="/">Start</a><span aria-hidden="true">/</span>'
            f'<span aria-current="page">{e(p["title"])}</span></nav>'
            f'<span class="kicker">{e(p["eyebrow"])}</span>'
            f'<h1>{e(p["headline"])}</h1><p>{e(p["lead"])}</p>'
            '</div></section>' + rich_sections + '<div class="page-body"><div class="inner page-grid">'
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
