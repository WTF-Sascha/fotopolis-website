# FOTOPOLIS – Website Development 2.6 · Roadmap Punkt 2

Stand: 05.11.2026 · PR #2 (Draft) · Branch `design/premium-v2` · nur Netlify Deploy Preview.

## Lieferumfang
- Premium-Produkterlebnisse für Fotobox, Fotospiegel und Fotowohnwagen: großflächige unveränderte Produktvisualisierung, redaktioneller Einstieg, drei Produkt-Highlights mit Quellenstatus, dreistufige Eventplanung sowie bestehende Detailinformationen.
- Leistungsübersicht `/pakete/`: drei Profile, Leistungsbeispiele und scrollbar zugängliche Vergleichstabelle. Keine erfundenen Paketpreise.
- Quellenabgleich gegen die ursprünglichen Produktunterseiten `/fotobox.html`, `/spiegel.html`, `/wohnwagen.html`, `/pakete.html` von `fotopolis-mieten.de`. Canon EOS 1300D (18 MP), Blitz, Sofortdruck/USB, Touch, LED, Hochformat und die Wohnwagenmaße (4,25 × 2,05 × 2,35 m) entstammen ausschließlich den bisherigen öffentlichen Angaben. Eine heutige Zusicherung wird ausdrücklich nicht gemacht.
- Original-Logo, alle vorhandenen Bild- und Originaldateien, die freigegebene Bildzuordnung und der bildfreie Startseiten-Hero bleiben unverändert.

## Layout-Fix aus 2.5
- `.footer-grid`: Flex/Grid-Konflikt korrigiert und eigenständige Footer-Zeile für die Navigation definiert.
- Umbrüche und Abstände für Mobilgeräte, Tablets und große Desktops verbessert.
- Automatischer Test prüft die relative Position der Footer-Zeilen, statt nur horizontalen Gesamtüberlauf abzufragen.

## Systematische Qualitätsprüfung ab diesem Roadmap-Punkt
Der Workflow `.github/workflows/premium-concept-qa.yml` baut beide überprüfbaren Versionen und führt aus:
1. Browser-QA Startseite – Quellkonzept (320/375/768/1024/1440 px).
2. Browser-QA Startseite – identisches Netlify-Publish-Verzeichnis (320/375/768/1024/1440 px).
3. Route-QA aller elf Unterseiten mit Menütests und Tastatur-Fokus.
4. **Zusätzlich neu:** Layout-Gate aller zwölf Seiten auf **neun** Viewportgrößen 320/375/430/768/1024/1100/1280/1440/1920 px, mit Überlauf-, Bild-, Header-, Footer-, Touch-Ziel- und Headline-Prüfung.
5. 15 zusätzliche Vollseiten-Screenshots (Startseite und vier zentrale Angebotsseiten bei 320/768/1440 px) als GitHub-Actions-Artefakt.

### Qualitäts-Findings und Nacharbeit
**Erster Lauf des neuen Layout-Gates:** 1.188 Checks, 1.172 bestanden, 16 Findings. Das ist kein Freigabe-PASS.

- 320 px, Datenschutzseite: horizontales Überstehen eines langen deutschen Wortes.
- 768 px, Pakete: zu enge dreispaltige Paketkarte mit überschießendem Inhalt.
- 1440 und 1920 px: Überschriften bei mehreren Unterseiten mit zu geringer typografischer Höhe.

**Korrektur 2.6.1:** Automatisches Hyphenating und erlaubte Zeilenumbrüche für lange Headlines; mehr typografischer Vertikalspielraum; Paketkarten werden auf Tabletgrößen zweispaltig und auf mobilen Größen einspaltig. Anschließend erneuter vollständiger Lauf.

**Finaler technischer QA-Status:** [GitHub Actions Lauf 42069129265](https://github.com/WTF-Sascha/fotopolis-website/actions/runs/42069129265) auf Code-Commit `cbc8838c9ce2e21b1f5084bee4743b14e109cf18` **PASS**: 124/124 Tests Quellkonzept, 124/124 Tests Netlify-Publish-Verzeichnis, 147/147 Unterseiten- und Navigationstests, **1.188/1.188 Layout-Checks** bei 12 Routen × 9 Viewports; **15 Vollseiten-Screenshots** archiviert. Die 16 Findings aus dem Erstlauf sind bei identischem Layout-Gate nach der Korrektur nicht mehr reproduzierbar. Eine separate menschliche Prüfung der Screenshot-Artefakte vor endgültiger visueller bzw. Live-Freigabe bleibt erforderlich.

## Schutzregeln
Kein Merge, kein Produktiv-Deploy, keine Änderung an `main`, `site/`, `fotopolis-mieten.de`, Logo oder Produktbilddateien. Keine Live-Buchung, keine Kalenderdaten und keine neuen kostenpflichtigen Services.

## Weiterhin offen vor Livegang
Schriftlizenz-/Font-Einbindung, finaler Leistungs- und Preisabgleich, Bild-/Personenrechte, rechtskonforme Impressums-/Datenschutzseiten, funktionierendes Eventbuchungssystem und explizite Live-Freigabe.
