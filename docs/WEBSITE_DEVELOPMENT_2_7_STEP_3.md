# FOTOPOLIS Website Development 2.7 — Roadmap Punkt 3

**Status:** isolierte Entwurfs-Preview · Branch `design/premium-v2` · PR #2 (Draft) · keine Produktivveröffentlichung.

## Ziel und Ergebnis

Die schon vorhandene einfache Vergleichsseite `/pakete/` wurde zu einem durchgehenden Premium-Leistungsbereich ausgebaut. Die drei Erlebniswelten sind **keine behaupteten verbindlichen Tarifpakete**, sondern transparent dargestellte Angebotsfamilien.

### Neue Inhalte
- Drei Erlebnisprofile Fotobox, Fotospiegel und Fotowohnwagen mit Detailseiten und direkter Übernahme in den Paketfinder.
- Leistungsübersicht in fünf Bereichen: **Mietdauer/Einsatzzeit**, **Druck/digitale Fotos**, **Layouts/Hintergründe**, **Extras/Betreuung**, **Lieferung/Auf- und Abbau**.
- Statuskennzeichnung: `Auf der bisherigen Website beschrieben`, `Auf Anfrage prüfen` oder `Individuell abstimmen`.
- Bestehende Produktvergleichstabelle mit horizontal bedienbarer Ansicht bei schmalen Bildschirmen.
- Interaktiver, rein clientseitiger Paketfinder mit gewünschtem Fotoerlebnis, Mietdauer-Wunsch, optionalem Datum/Ort, sechs expliziten Optionswünschen und Freitext.
- Dynamische Zusammenfassung, `mailto:`-Vorlage und Kopiermöglichkeit. **Kein automatischer Versand, keine Datenspeicherung, keine Reservierung, keine Live-Verfügbarkeitsabfrage und keine Preiskalkulation.**
- Mietdauerstufen sind ausdrücklich nur **Orientierungs-/Anfragewünsche**, keine angebotenen oder gesicherten buchbaren Tarife.

### Fakten- und Quellenprüfung

Am 05.11.2026 wurden die bislang öffentlich auslesbaren Seiten geprüft:
- https://fotopolis-mieten.de/pakete.html — Einleitung beschreibt flexible Pakete für unterschiedlich große Veranstaltungen, listet im ausgelesenen Seitentext aber **keine bestätigten Preise, Mietdauer-Tarife oder fest zugesagten Paketbausteine**.
- https://fotopolis-mieten.de/fotobox.html — Canon EOS 1300D (18 MP), Studioblitz, Sofortdruck, digitale Übergabe/USB, individuelle Layouts und Hintergrundoptionen werden beschrieben.
- https://fotopolis-mieten.de/spiegel.html — Touch-Bedienung, Live-Effekte, Hochformat und LED-Beleuchtung werden beschrieben.
- https://fotopolis-mieten.de/wohnwagen.html — restaurierter Wohnwagen, Abmessungen und besondere Ausstattung werden beschrieben.

**Wichtig:** Diese Aussagen beschreiben den **bisherigen** Auftritt. Der aktuelle Lieferumfang, Druckkontingente, Preise, Extras, Mietstufen, Betreuungsleistungen sowie Lieferung und Aufbau müssen durch FOTOPOLIS fachlich bestätigt werden. Kein Live-Angebot ohne diese Prüfung.

## Technische Umsetzung
- `concepts/premium-v2/pages.json`: Version 2.7, strukturiertes Serviceinventar und unverbindlicher Paketfinder.
- `scripts/build_premium_pages.py`: semantische, HTML-escaped Darstellung der Servicebereiche und Formularfelder.
- `concepts/premium-v2/package-planner.js`: zustandsbasierte, lokale Auswahl – `textContent`, kein `fetch`, keine Speicherung.
- `concepts/premium-v2/styles.css`: responsive, barrierearme Layouts ohne Änderung von CI/Logo oder Bildern.
- `scripts/build-premium-preview.py`: kopiert das Planerscript ausschließlich in den isolierten Preview-Build.
- `scripts/premium-package-qa.mjs`: eigener Interaktions-, Wahrheitsgehalts-, Responsive- und Screenshottest über 320/375/768/1100/1440/1920 px.
- `.github/workflows/premium-concept-qa.yml`: bestehende 12-Routen-/9-Viewport-Layoutprüfung und alte 124+124+147 Tests bleiben bestehen, plus die neuen Paketintegrationstests.

## QA-Gates vor Freigabe
1. Kein Fehler im Netlify-Preview-Build, alle gebauten Assets und Logo-/Produktbild-Checksummen unverändert.
2. Automatisierte Route-/Navigation- und Browserprüfungen inkl. 12 Routen/9 Viewports.
3. Neue Pakettests: Eingabefelder, Vorschau, Email-URL, keine unautorisierte Datenübertragung, Screenshots und Responsive-Layout.
4. Screenshots visuell prüfen; Automatisierung allein kann ein Design nicht abschließend freigeben.

**QA-Ergebnis:** nach Abschluss der zugehörigen finalen GitHub-Actions- und Netlify-Deploy-Prüfungen dokumentieren. Kein Status PASS behaupten, bevor die jeweiligen Läufe wirklich abgeschlossen sind.

## Unveränderte Schutzregeln
Kein Merge, keine Änderung in `main` oder `site/`, kein Livegang unter `fotopolis-mieten.de`, keine Supabase-Produktivdaten, keine Backend-Kalenderbuchung, kein neues kostenpflichtiges Angebot. Freigegebenes Original-Logo und sämtliche Produkt- und Quellbilder werden unverändert weiterverwendet.

## Später separat zu realisieren
Roadmap Punkt 4: Anlässe, Galerie und Vertrauenselemente. Punkt 5: echter Kontakt-/Anfrageprozess. Punkte 6–8: Supabase-Verfügbarkeitsdaten, interner Admin-Kalender und anschließend Online-Buchungen. Finale Rechts- und Bildrechte-Freigaben bleiben gesonderte Gates.
