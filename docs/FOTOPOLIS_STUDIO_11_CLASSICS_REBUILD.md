# FOTOPOLIS Studio 11.2 — 32 originale Classics professionell neu aufgebaut

## Korrektur gegenüber Studio 11.1

Die bisherige PhotoPrint-Generatorversion hatte die 32 vorhandenen, unterschiedlichen Motive FP-001–FP-032 irrtümlich in neu gezeichnete Standardlayouts verwandelt. Das entsprach **nicht** dem Auftrag. Diese Version bewahrt die **authentischen Originalmotive einschließlich ihrer Farbwelten, Goldbänder, floralen Elemente, Geometrien, typografischen Merkmale und Fotoanzahlen**.

- **FP-001–FP-032:** FOTOPOLIS Classics, Originalmotive beibehalten und aus den unveränderten Quellen neu aufbereitet; vorhandenes altes Logo wird im originalen unteren rechten Brandingbereich von der freigegebenen Goldmark überdeckt. Originalfotoslots werden für den Druck transparent angelegt.
- **FP-033–FP-044:** zwölf zusätzliche Signature-Entwürfe der Studio-11.1-Serie.
- Beide Serien sind in der **PWA-Galerie getrennt filterbar** und weiterhin zusammen in Suche, Merkliste, Modals, Anfrageauswahl und Download abrufbar.

## Reproduzierbarer Build statt pauschaler Überlagerung

`scripts/classics-original-preserve.py` wird über `scripts/build-photo-print-collection.py` bei jedem Vorschau-Build ausgeführt.

1. Ausschließlich unveränderter Source `concepts/premium-v2/assets/designvorlagen/fp-001.webp … fp-032.webp`.
2. Bildformat unverändert **3:2 Querformat**, im Ausgabegerät rechnerisch **1772 × 1181 px bei 300 DPI** (15 × 10 cm).
3. Die ursprünglichen grauen Fotoausschnitte werden anhand ihrer tatsächlichen Rahmen erkannt, **nicht neu angeordnet**; die wenigen cremefarbenen oder dunkelblauen Originalrahmen erhalten aus Sichtprüfung definierte Interieurkoordinaten.
4. Das Goldlogo stammt ausschließlich aus `site/assets/fotopolis-goldmark.webp`, ist im ursprünglichen Logo-Safe-Area verankert und deckt den vorherigen Stempel samt Ring vollständig mit **einem einzigen neuen Master-Signet** ab. Keine getrennten CSS-Overlays und keine zweiten Logos.
5. Archiv-Quellen sind bytegleich; neue PNG-/WebP-Dateien entstehen nur in `preview-build`. Das korrekte Foto-Overlay hat echte transparente Fotoöffnungen, die Galerie eine originalgetreue Vorschau.
6. Die Anwender können die ersten 32 wie zuvor per ID (`FP-001`–`FP-032`) auswählen; die zwölf zusätzlichen IDs bleiben unabhängig.

## QA, Freigabepunkte und Fakten

- 32 SHA-256-Quellen, mit Quellkatalog abgeglichene IDs, Namen, Anlasskategorien und Fotozahlen.
- Pro Vorlage mindestens ein/mehrere erkannte, transparent ausgeschnittene Fotoöffnung(en) und **keine Änderung außerhalb des originalen Logobereichs oder der Öffnungen**.
- PNG auf 1772 × 1181 Pixel und tatsächliche 300-DPI-Metadaten geprüft.
- `/qa/classics-32-source-vs-restored.webp`: originale Komposition vs. neue Markenfassung für alle 32.
- `/qa/classics-32-logo-closeups.webp` und `/qa/classics-logo-zoom/`: optische Logokontrolle der 32 Stempel für die manuelle Retuscheabnahme.
- `/qa/classics-32-source-fidelity.json`: pro Vorlage Quellgröße, tatsächliche Fotofenster und Schutzflächen.
- Browser-QA an 7 Breiten: Classics-Filter ergibt 32, Signature-Filter 12, Gesamtansicht 44; Galerie-/Modal-/Anfragefluss und 14 öffentliche Routen.
- ZIP im Review enthält alle 44 Druck-PNGs, die Gallery erhält kleine WebP-Dateien.

### Nicht durch einen grünen Test ersetzbar

Ein guter Testlauf ist **keine Druckfreigabe**. Insbesondere Überprüfung des Druckertreibers und Papierbeschnitts sowie 200–300%-Retuschekontrolle der 32 Logos sind gestalterisch getrennt abzunehmen. Die einzelnen Vorlagen bleiben in der PR-Preview und werden nicht auf `main` oder `fotopolis-mieten.de` veröffentlicht. Auch produktive Kundenanfragen oder Administrationsdaten werden nicht verändert.
