# FOTOPOLIS Website Development 2.8 — Roadmap Punkt 4

**Stand:** 05.11.2026 · `design/premium-v2` · PR #2 (Draft) · ausschließlich Netlify Deploy Preview.

## Ziel
Die drei Seiten **Anlässe**, **Galerie** und **Über uns** zu einem konsistenten Premium-Erlebnis entwickeln und zusätzlich geprüfte Vertrauenselemente auf der Startseite integrieren – ohne neue oder bearbeitete Bilder, erfundene Leistungsversprechen, ungeprüfte Bewertungen und falsche Verfügbarkeiten.

## Neue Funktionen und Inhalte
1. `/anlaesse/`: vier redaktionell strukturierte Erlebniswelten (Hochzeiten, Geburtstage/Jubiläen, Firmen-/Teamevents, Motto-/Gartenpartys), jeweils mit Planungsfragen und direkten Links zu passenden Fotoerlebnissen. Hinzu kommt eine dreiteilige Event-Checkliste mit CTA zum bereits bestehenden, unverbindlichen Paketfinder.
2. `/galerie/`: responsive Galerie mit **sechs unveränderten vorhandenen Bildern** in zwei klaren Kategorien: **Eventmomente** (3 bestehende LEG-Fotos, Rechte noch ungeklärt) und **Produktwelten** (3 bereits freigegebene Produktvisualisierungen). Filterbuttons mit `aria-pressed`; native `<dialog>`-Großansicht mit Escape, Pfeiltasten, Vor/Zurück und Fokus-Rückgabe. Keine Drittanbieter-Plugins, externe Bildanfragen, Speicherung oder Bildmanipulation.
3. `/ueber-uns/`: vier überprüfbare Fakten/Prozessaussagen: drei Fotoerlebnisse, individuelle Beratung, schriftlich zu klärende Leistungen/Preise und verantwortungsbewusste Bildfreigabe. Dazu ein dreistufiger Ablauf von Orientierung bis konkretem Angebot.
4. `/`: neuer vertrauensbildender Editorial-Bereich mit drei Prozessfakten und Links zu Anlässen und Über uns. Der vereinbarte bildfreie Hero bleibt unverändert.

## Wahrheit, Quellen, Bildrechte
- Offizielle bisherige Website: https://fotopolis-mieten.de/ und https://fotopolis-mieten.de/galerie.html (verifiziert 05.11.2026).
- Die bisherige Galerie zeigt ein positives Kundenstatement ohne öffentlich überprüfbare Zuschreibung. Dieses Statement wurde **bewusst nicht übernommen**.
- **Keine** erfundenen Rezensionen, Sternebewertungen, Kundenzahlen, Logos von Firmenkunden, Referenzen, Antwortzeiten, Festpreise oder Verfügbarkeitsgarantien.
- Für `LEG-060.webp`, `LEG-073.webp` und `LEG-046.webp` sind Personen- und Nutzungsrechte für die neue öffentliche Galerie **noch nachzuweisen**. Die aktuell öffentlich aufrufbare Entwicklungspreview ist keine Freigabe zur späteren Verwendung.
- `fotobox-event-1672.webp`, `fotospiegel-hero-lossless.webp` und `fotowohnwagen-gartenparty-1448.webp` sind bereits bestehende genehmigte **Visualisierungen**, nicht echte Kunden-Referenzaufnahmen; als solche beschriftet. Die Quellbilder werden byte-identisch kopiert. Das alte Logo bleibt unverändert.
- `robots=noindex,nofollow` auf allen generierten Unterseiten. Eine technische robots-Anweisung bietet keine Zugriffskontrolle; vor öffentlicher Bewerbung müssen Bildrechte verifiziert sein.

## Technische Änderungen
- `concepts/premium-v2/pages.json`: Content-Manifest auf Version 2.8 und strukturiertes Schema für Anlässe, Fotos, Trust-Prozesse.
- `scripts/build_premium_pages.py`: semantisch markierte, escaped Eventkarten, Gallery-/Dialog-Markup und Trust-Elemente. Festes Bilddatei-Allowlisting plus Rechte-Status.
- `concepts/premium-v2/gallery-viewer.js`: rein lokaler, mit Tastatur steuerbarer Galerie-Controller.
- `concepts/premium-v2/styles.css`: vollständig responsive Layouts; Bilddateien und CI-Tokens unverändert.
- `concepts/premium-v2/index.html`: kleine, inhaltlich überprüfbare Trust-Sektion und Versionskennzeichnung.
- `scripts/build-premium-preview.py`: Gallery-Controller ausschließlich in Netlify-Preview-Build übernehmen; vorhandene SHA-256-Guards unverändert.
- `.github/workflows/premium-concept-qa.yml`: alle alten Prüfungen beibehalten und `scripts/premium-step4-qa.mjs` mit sechs Viewports ergänzen.

## Quality Gates
- Startseiten-Browserchecks: Quellkonzept und exakter Netlify-Publish-Build.
- 11 Unterseiten-Routen, Navigation, Fokus, Assets.
- Layout: alle zwölf Routen bei neun Bildschirmbreiten von 320 bis 1920 px.
- Paketfinder: alle sechs Viewports mit Eingabe-, Mailto- und Datensparsamkeitsprüfungen.
- **Neu in Punkt 4:** Anlassnarrative, Produktlinks, Galerie-Filter, `dialog`-Fokus und Escape/Pfeiltasten, Rechte-Hinweis, Trust-Fakten, sechs Viewports, Screenshot-Artefakte.
- Separate visuelle Sichtabnahme der Screenshots vor endgültiger Freigabe.

**Finaler Teststatus wird erst nach dem abgeschlossenen GitHub-Actions-Lauf dokumentiert; ein ungeprüfter Status darf nicht als PASS bezeichnet werden.**

## Schutzgrenzen
Kein Merge, kein Livegang, keine Änderungen an `main`, `site/`, dem bisherigen `fotopolis-mieten.de` oder an Produktbild-/Logo-Dateien. Keine personenbezogenen produktiven Daten, kein Backend, kein Online-Kalender.
