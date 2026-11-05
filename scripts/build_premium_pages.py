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
    assert data["version"] in ("2.5", "2.6", "2.7", "2.8", "2.9")
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
        if "gallery" in p and not p.get("galleryCollection"):
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
                f'<a class="button gold" href="/kontakt/?produkt={e(p["title"])}">'
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

        # Roadmap 4: independent occasion storytelling, with no promises of availability.
        if p.get("occasionCards"):
            assert slug == "anlaesse"
            rich_sections += (
                '<section class="occasion-section section" aria-labelledby="occasion-section-title">'
                '<div class="inner"><div class="section-heading">'
                '<span class="kicker">DEIN ANLASS · DEIN FOTOERLEBNIS</span>'
                '<h2 id="occasion-section-title">Für jedes Fest <em>eine eigene Geschichte.</em></h2>'
                '<p>Diese Ideen helfen dir bei der Auswahl. Details werden passend zu deiner Feier abgestimmt.</p>'
                '</div><div class="occasion-grid">'
            )
            for item in p["occasionCards"]:
                assert re.fullmatch(r"[a-z]+", item["id"])
                rich_sections += (
                    f'<article class="occasion-card" id="anlass-{e(item["id"])}">'
                    '<div class="occasion-card-head">'
                    f'<span class="occasion-number" aria-hidden="true">{e(item["number"])}</span>'
                    f'<span class="kicker">{e(item["category"])}</span>'
                    f'<h3>{e(item["title"])}</h3>'
                    f'<p>{e(item["lead"])}</p></div>'
                    '<div class="occasion-card-detail">'
                    '<h4>Worauf es bei der Planung ankommt</h4><ul>'
                )
                for item_text in item["planning"]:
                    rich_sections += f'<li>{e(item_text)}</li>'
                rich_sections += '</ul><div class="occasion-card-links">'
                for product in item["products"]:
                    assert product["slug"] in ("fotobox", "fotospiegel", "fotowohnwagen")
                    rich_sections += (
                        f'<a href="/{e(product["slug"])}/">{e(product["label"])}'
                        ' <span aria-hidden="true">↗</span></a>'
                    )
                rich_sections += '</div></div></article>'
            rich_sections += (
                '</div><p class="occasion-disclaimer">'
                f'{e(p["occasionDisclaimer"])}</p></div></section>'
                '<section class="occasion-steps section" aria-labelledby="occasion-steps-title">'
                '<div class="inner"><div class="section-heading">'
                '<span class="kicker">DIE DREI FRAGEN VOR DEINEM EVENT</span>'
                '<h2 id="occasion-steps-title">Gut geplant. <em>Einfach angefragt.</em></h2>'
                '</div><div class="occasion-step-grid">'
            )
            for step in p["occasionChecklist"]:
                rich_sections += (
                    '<article class="occasion-step">'
                    f'<span class="occasion-step-num">{e(step["title"])}</span>'
                    f'<p>{e(step["text"])}</p></article>'
                )
            rich_sections += (
                '</div><a class="button gold" href="/pakete/#paketfinder">'
                'Eventwünsche zusammenstellen <span aria-hidden="true">↗</span></a>'
                '<p class="occasion-disclaimer">Öffnet einen unverbindlichen Paketfinder, '
                'keine Buchungsseite.</p></div></section>'
            )

        # Roadmap 4: two clearly separated media classes, all assets unchanged.
        # Legacy event imagery is PREVIEW-ONLY until persons and usage rights clear.
        elif p.get("galleryCollection"):
            assert slug == "galerie"
            allow = {
                "LEG-060.webp": "moments",
                "LEG-073.webp": "moments",
                "LEG-046.webp": "moments",
                "fotobox-event-1672.webp": "products",
                "fotospiegel-hero-lossless.webp": "products",
                "fotowohnwagen-gartenparty-1448.webp": "products",
            }
            assert len(p["galleryCollection"]) == len(allow) == 6
            assert {item["file"] for item in p["galleryCollection"]} == set(allow)
            rich_sections += (
                '<section class="curated-gallery section" aria-labelledby="curated-gallery-title">'
                '<div class="inner"><div class="section-heading">'
                '<span class="kicker">BILDER MIT KLARER HERKUNFT</span>'
                '<h2 id="curated-gallery-title">Zwei Blickwinkel. <em>Eine Bildwelt.</em></h2>'
                '<p>Unterscheide zwischen historischen Eventaufnahmen und freigegebenen '
                'Produktvisualisierungen. Alle Bilder bleiben unverändert.</p></div>'
                '<div class="gallery-filters" role="group" aria-label="Galerieansicht wählen">'
                '<button class="gallery-filter" type="button" data-gallery-filter="all" '
                'aria-pressed="true">Alle Eindrücke</button>'
                '<button class="gallery-filter" type="button" data-gallery-filter="moments" '
                'aria-pressed="false">Eventmomente</button>'
                '<button class="gallery-filter" type="button" data-gallery-filter="products" '
                'aria-pressed="false">Produktwelten</button></div>'
                '<div class="curated-grid" data-curated-gallery>'
            )
            for item in p["galleryCollection"]:
                assert item["kind"] == allow[item["file"]]
                assert (item["rights"] == "unverified") == (item["kind"] == "moments")
                category = "INTERNE EVENTAUFNAHME" if item["kind"] == "moments" else "PRODUKTVISUALISIERUNG"
                rich_sections += (
                    f'<figure class="curated-item" data-gallery-item data-gallery-kind="{e(item["kind"])}">'
                    '<button class="curated-open" type="button" data-gallery-open '
                    f'aria-label="{e(item["label"])} – Bild vergrößern">'
                    f'<img src="/assets/images/{e(item["file"])}" '
                    f'alt="{e(item["alt"])}" loading="eager" decoding="async">'
                    '<span class="curated-zoom" aria-hidden="true">Ansehen ↗</span>'
                    '</button><figcaption>'
                    f'<span class="curated-category">{e(category)}</span>'
                    f'<strong>{e(item["label"])}</strong>'
                    f'<small>{e(item["note"])}</small>'
                    '</figcaption></figure>'
                )
            rich_sections += (
                '</div><p class="gallery-rights-note" data-gallery-rights>'
                f'{e(p["galleryNotice"])}</p></div>'
                '<dialog class="gallery-lightbox" data-gallery-dialog '
                'aria-label="Fotogalerie Großansicht">'
                '<button type="button" class="gallery-dialog-close" data-gallery-close '
                'aria-label="Großansicht schließen">×</button>'
                '<div class="gallery-dialog-media"><img data-gallery-large src="/assets/images/LEG-060.webp" alt="Interne Eventaufnahme"></div>'
                '<div class="gallery-dialog-foot"><div>'
                '<strong data-gallery-dialog-title></strong>'
                '<small data-gallery-dialog-note></small>'
                '</div><div class="gallery-dialog-actions">'
                '<button type="button" data-gallery-prev aria-label="Vorheriges Bild">←</button>'
                '<button type="button" data-gallery-next aria-label="Nächstes Bild">→</button>'
                '</div></div></dialog></section>'
            )

        # Trust via verifiable processes and product facts, never fabricated reviews.
        elif p.get("trustFacts"):
            assert slug == "ueber-uns"
            rich_sections += (
                '<section class="trust-section section" aria-labelledby="trust-title">'
                '<div class="inner"><div class="section-heading">'
                '<span class="kicker">WORAUF DU DICH BEI DER PLANUNG STÜTZEN KANNST</span>'
                '<h2 id="trust-title">Gute Erlebnisse beginnen <em>mit Klarheit.</em></h2>'
                '<p>Diese Aussagen beschreiben unser Angebot und den transparenten '
                'Planungsprozess – keine erfundenen Sterne oder Referenzen.</p>'
                '</div><div class="trust-grid">'
            )
            for item in p["trustFacts"]:
                rich_sections += (
                    '<article class="trust-fact">'
                    f'<span class="kicker">{e(item["eyebrow"])}</span>'
                    f'<h3>{e(item["title"])}</h3>'
                    f'<p>{e(item["description"])}</p>'
                    '</article>'
                )
            rich_sections += (
                '</div></div></section>'
                '<section class="trust-process section" aria-labelledby="trust-flow-title">'
                '<div class="inner"><div class="section-heading">'
                '<span class="kicker">SO ENTSTEHT DEIN ANGEBOT</span>'
                '<h2 id="trust-flow-title">Persönlich planen. <em>Verbindlich klären.</em></h2>'
                '</div><div class="trust-step-grid">'
            )
            for step in p["trustFlow"]:
                rich_sections += (
                    '<article class="trust-step">'
                    f'<span class="trust-step-number">{e(step["step"])}</span>'
                    f'<h3>{e(step["title"])}</h3>'
                    f'<p>{e(step["description"])}</p></article>'
                )
            rich_sections += (
                '</div><p class="trust-review-policy">'
                f'{e(p["reviewPolicy"])}</p>'
                '<a href="/kontakt/" class="button gold">Event unverbindlich anfragen '
                '<span aria-hidden="true">↗</span></a></div></section>'
            )

        # Step 5: contact form never transmits visitor inputs from this preview.
        if p.get("contactFlow"):
            assert slug == "kontakt"
            flow = p["contactFlow"]
            rich_sections += (
                '<section class="contact-flow section" aria-labelledby="contact-flow-title">'
                '<div class="inner"><div class="contact-intro">'
                f'<span class="kicker">{e(flow["eyebrow"])}</span>'
                f'<h2 id="contact-flow-title">{e(flow["title"])}</h2>'
                f'<p>{e(flow["intro"])}</p></div>'
                '<div class="contact-layout"><form class="contact-form" '
                'data-contact-flow novalidate>'
                '<fieldset><legend><span>01</span> Das Event</legend>'
                '<div class="contact-fields">'
                '<div><label for="contact-occasion">Anlass <span aria-hidden="true">*</span></label>'
                '<select id="contact-occasion" name="anlass" required>'
            )
            for i, item in enumerate(flow["occasionOptions"]):
                value = '' if i == 0 else item
                rich_sections += (
                    f'<option value="{e(value)}">{e(item)}</option>'
                )
            rich_sections += (
                '</select></div>'
                '<div><label for="contact-product">Fotoerlebnis</label>'
                '<select id="contact-product" name="produkt">'
            )
            for item in flow["productOptions"]:
                rich_sections += f'<option value="{e(item)}">{e(item)}</option>'
            rich_sections += (
                '</select></div>'
                '<div><label for="contact-date">Wunschtermin (optional)</label>'
                '<input type="date" id="contact-date" name="datum"></div>'
                '<div><label for="contact-time">Tageszeit</label>'
                '<select id="contact-time" name="tageszeit">'
            )
            for item in flow["timeOptions"]:
                rich_sections += f'<option value="{e(item)}">{e(item)}</option>'
            rich_sections += (
                '</select></div>'
                '<div><label for="contact-location">Veranstaltungsort (optional)</label>'
                '<input id="contact-location" name="ort" type="text" '
                'maxlength="120" autocomplete="address-level2" placeholder="z. B. Ahlen"></div>'
                '<div><label for="contact-guests">Gästezahl (optional)</label>'
                '<input id="contact-guests" name="gaeste" type="number" '
                'min="1" max="20000" step="1" inputmode="numeric" '
                'placeholder="z. B. 100"></div>'
                '</div></fieldset>'
                '<fieldset><legend><span>02</span> Deine Kontaktdaten</legend>'
                '<div class="contact-fields">'
                '<div><label for="contact-name">Name <span aria-hidden="true">*</span></label>'
                '<input id="contact-name" name="name" type="text" maxlength="100" '
                'autocomplete="name" required placeholder="Dein Name"></div>'
                '<div><label for="contact-email">E-Mail <span aria-hidden="true">*</span></label>'
                '<input id="contact-email" name="email" type="email" maxlength="150" '
                'autocomplete="email" required placeholder="name@beispiel.de"></div>'
                '<div><label for="contact-phone">Telefon (optional)</label>'
                '<input id="contact-phone" name="telefon" type="tel" maxlength="45" '
                'autocomplete="tel" placeholder="+49 ..."></div>'
                '<div><label for="contact-way">Bevorzugter Kontaktweg</label>'
                '<select id="contact-way" name="kontaktweg">'
            )
            for item in flow["contactWays"]:
                rich_sections += f'<option value="{e(item)}">{e(item)}</option>'
            rich_sections += (
                '</select></div></div></fieldset>'
                '<fieldset><legend><span>03</span> Wünsche &amp; Extras</legend>'
                '<div class="contact-wishes">'
            )
            for item in flow["wishItems"]:
                rich_sections += (
                    '<label class="contact-choice"><input type="checkbox" '
                    f'name="wunsch" value="{e(item)}"><span>{e(item)}</span></label>'
                )
            rich_sections += (
                '</div><label for="contact-details">Weitere Wünsche (optional)</label>'
                '<textarea id="contact-details" name="details" rows="4" maxlength="800" '
                'placeholder="Was sollten wir über dein Event wissen?"></textarea></fieldset>'
                '<p class="contact-small">* Pflichtfeld – erforderlich, damit die '
                'E-Mail-Vorlage sinnvoll ausgefüllt werden kann.</p>'
                '<p class="contact-privacy">'
                f'{e(flow["legalNotice"])}</p>'
                '</form><aside class="contact-recap" aria-labelledby="contact-recap-title">'
                '<span class="kicker">DEINE VORSCHAU</span>'
                '<h3 id="contact-recap-title">Dein Event auf einen Blick.</h3>'
                '<p>Die Vorschau aktualisiert sich direkt. '
                'Es wird nichts versendet oder reserviert.</p>'
                '<pre data-contact-summary aria-live="polite"></pre>'
                '<div class="contact-actions">'
                '<a class="button gold" data-contact-email '
                'href="mailto:kontakt@fotopolis-mieten.de">'
                'E-Mail-Entwurf öffnen <span aria-hidden="true">↗</span></a>'
                '<button type="button" class="button contact-copy" '
                'data-contact-copy>Angaben kopieren</button></div>'
                '<p class="contact-status" data-contact-status role="status"></p>'
                f'<small>{e(flow["responseNote"])}</small>'
                '</aside></div></div></section>'
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
            ('<script defer src="/gallery-viewer.js"></script>' if slug == "galerie" else '') +
            ('<script defer src="/contact-flow.js"></script>' if slug == "kontakt" else '') +
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
