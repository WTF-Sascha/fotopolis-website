# FOTOPOLIS — Website Development 2.5 · Roadmap Punkt 1

**Status:** Entwicklungsstand zur Prüfung · 05.11.2026  
**Branch:** `design/premium-v2` · **PR:** #2 (Draft) · **Deployment:** ausschließlich Netlify Deploy Preview.

## Ziel und Abgrenzung

Geordnete Inhaltsübernahme aus dem bisherigen öffentlichen Auftritt `fotopolis-mieten.de`, Einbau einer hochwertigen und responsiven Hauptnavigation und Aufbau einer vollständig verlinkten Seitenarchitektur. **Nicht** Teil von Punkt 1: verbindliche Online-Buchungen, Kalenderdaten, Paketpreise, produktive Kontaktformulare, Foto-/Personenfreigaben oder neue Rechtstexte.

### Informationsarchitektur

- `/` — Editorial Landing, weiterhin **vollständig bildfreier Hero** und drei unveränderte Produktbilder in ihren Bereichen.
- `/fotobox/`, `/fotospiegel/`, `/fotowohnwagen/` — Produktdetailseiten, jeweils mit den freigegebenen, byte-identischen Produktbildern und erläuternden Texten.
- `/pakete/` — Leistungsüberblick ohne erfundene Preise oder Ausstattungsversprechen.
- `/galerie/` — vorläufiger interner Bildbestand, ausdrücklich **noch nicht freigegeben**.
- `/anlaesse/` — Hochzeiten, Geburtstage, Firmenevents, Jubiläen und individuelle Anlässe.
- `/ueber-uns/` — Marken- und Erlebnispositionierung ohne unbestätigte Firmenhistorie.
- `/faq/` — Fragen zu Unterschieden, Planung, Gestaltung, Fläche, Verfügbarkeit, Anfrage.
- `/kontakt/` — Mailto-Kontaktweg; keine serverseitige Datenerfassung oder Buchung.
- `/impressum/`, `/datenschutz/` — deutlich markierte Prüfentwürfe, **nicht veröffentlichungsreif**.

**Bisherige Website**: Startseite (Home, Fotobox, Fotospiegel, Wohnwagen, Pakete, Galerie, Kontakt, Design Studio) als öffentlich nachvollziehbare Navigationsstruktur geprüft. Bereits vorhandene Entwürfe im Repo unter `site/` als Ausgangspunkt für Produkt- und FAQ-Texte genutzt; die Original-Unterseiten waren beim aktuellen Abruf nicht alle vollständig erreichbar. Deshalb keine behauptete wortgetreue Vollmigration. Das alte Design Studio wird vorläufig als **expliziter externer Link** auf den bisherigen Auftritt angeboten. Exakte Paketbestandteile, Preise, Bildfreigaben, technische Details und Rechtstexte müssen vor der Freigabe gegengeprüft werden.

### Premium-Navigation

Sticky Header mit unverändertem runden Original-Logo, Menü `Fotoerlebnisse` (Fotobox / Fotospiegel / Fotowohnwagen), `Pakete & Leistungen`, `Galerie`, `Mehr entdecken` (Anlässe / Über uns / FAQ / altes Design Studio) und primärem CTA `Event anfragen`.

- Auf Desktop: Dropdown-Panels mit Kontexttexten, Hover, Fokus und Klick.
- Auf Mobilgeräten: Menü und Untergruppen per Schaltfläche, Zustandskennzeichnung via `aria-expanded`, Escape-Schließen samt Fokuswiederherstellung, sichtbare Tastatur-Fokusringe.
- Durchgängige interne Seitenlinks, Breadcrumbs und thematische Footer-Navigation.

### Technisches Konzept

- Inhalte liegen strukturiert in `concepts/premium-v2/pages.json`.
- `scripts/build_premium_pages.py` rendert elf eigenständige HTML-Seiten in das isolierte `preview-build/`; `scripts/build-premium-preview.py` führt die vorhandene SHA-256-Integritätsprüfung aller freigegebenen Bilddateien weiterhin aus.
- `netlify.toml` bleibt unverändert. `[build]` veröffentlicht weiterhin `site/` und **nicht** die neue Entwicklungsvorschau. Nur `[context.deploy-preview]` und `[context.branch-deploy]` führen den isolierten Preview-Build aus.
- `scripts/premium-route-qa.mjs` kontrolliert alle elf Routen in Chromium bei 375 und 1440 px sowie Menü-, Fokus-, Bild- und Layoutzustände. Bestehende Visual-QA testet zusätzlich 320, 375, 768, 1024 und 1440 px.
- Kein Analytics, keine externe API, keine Geheimnisse, keine Kostenfunktion und kein Merge.

## Ausstehende Freigaben

1. Fachlicher Faktenabgleich mit FOTOPOLIS zu Leistungs-/Paketdetails und Fotos.
2. Rechtstexte (Impressum/Datenschutz) und Bild-/Personenrechte.
3. Kalender / echte Verfügbarkeit / verbindliches Anfragemanagement (späterer Roadmap-Punkt).
4. Finale visuelle Browserreview und Freigabe **vor jedem** Merge oder Livegang.

**Schutz:** `main`, `site/`, `fotopolis-mieten.de`, Netlify-Produktionsdeploy, Original-Logo und sämtliche vorhandenen Produktbilder werden nicht verändert.
