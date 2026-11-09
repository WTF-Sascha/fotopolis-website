# FOTOPOLIS Studio 11.1 — PhotoPrint Collection (Preview only)

## Verifizierte Formatvorgabe

Offizielle Quelle: `https://fotopolis-mieten.de/tools/designer/designer.html`.
Dort angegeben: **15 × 10 cm, 300 DPI, PNG/JPG**.
Deshalb neue Fotolayouts **im Querformat** (3:2), nicht im Hochkant-Postkartenformat.

- Physikalisch: 15,0 × 10,0 cm
- Digitale Pixelmaße: 1772 × 1181 px (gerundete 300-dpi-Abbildung)
- 300 dpi als Metadatum im PNG-Druckoverlay
- 1, 2 oder 3 fotografische Ausschnitte in jedem Design
- Ein einziges, echtes Logo, ausschließlich aus `site/assets/fotopolis-goldmark.webp`
- Logo unten rechts, mit festgelegtem Schutzabstand und kontrollierter Einpassung
- Transparente Fotoflächen im Druckoverlay, nicht künstliche weiße Balken im eigentlichen Drucklayout
- Galerie-WebP-Dateien enthalten neutrale Fotoplatzhalter zur Vorschau; keine erfundenen Eventbilder
- Die 32 Ausgangsdesigns und das Markenlogo bleiben unverändert im Repository; ihre 32 **neugestalteten Kandidaten** ersetzen lediglich die generierten Preview-Dateien
- 12 neue Printdesigns, IDs FP-033 bis FP-044; insgesamt **44**

## Implementierung

`scripts/build-photo-print-collection.py` startet am Ende von `scripts/build-premium-preview.py`, nachdem die unveränderten 32 Vorlagen in Studio 10 und Studio 11 bereits technisch geprüft wurden.

Die Skript-Ausgabe im separaten PR-Preview:
- `/assets/designvorlagen/fp-001.webp` bis `fp-044.webp` – Galerie-Preview
- `/assets/designvorlagen/print/fp-001.png` bis `fp-044.png` – transparente Druck-Overlays
- `/assets/design-gallery-data.json` – eindeutige ID, Anlass, Fotofelder, Foto-Rechtecke, Bildformat, DPI und hashbasierte Verifikation
- `/qa/photoprint-44-contact-sheet.webp` – alle Entwürfe auf einem Blatt für die manuelle Einzelbildkontrolle
- `/qa/photoprint-44-audit.json` – unveränderte Quelle und ausgabeseitige Druckdaten

Die Galerie kann 44 Entwürfe suchen, filtern, in der Detailansicht öffnen und als transparente Overlays herunterladen. Alle 44 IDs werden im unverbindlichen Anfrageformular bereitgestellt. Das Formular und bestehende personenbezogene Daten werden nicht verändert.

## Abnahme- und Sicherheitsgrenzen

Es handelt sich um **Fotolayout-Overlays**, in die beim späteren Workflow echte Gästeaufnahmen eingesetzt werden müssen. Sie sind keine fertig gerenderten Kundenfotos. Die Ausgabe ist kein Beleg für die Konfiguration des tatsächlich verwendeten Druckertreibers. Vor Druckproduktion ist ein physischer Testprint mit dem FOTOPOLIS-Drucksystem nötig: Farbraum, Beschnitt, Druckerprofil, Papierlage und Druckskalierung verifizieren. Fotoausschnitte sind Metadaten, keine implementierte automatische Kamera-/Drucker-Schnittstelle.

QA:
1. 44 IDs und alle Druck- und Galerie-Dateien,
2. 1772 × 1181 px, 300-DPI-PNG-Metadaten,
3. transparente zentrale Fotoausschnitte und opake Logo-/Footer-Zone,
4. Quelle und Masterlogo bytegleich zu vor der Umsetzung,
5. GitHub Browser-Regression: 14 Seiten × 7 Viewports,
6. Screenshots und visuelle 200–300%-Kontrolle aller 44 Artefakte.

Keine Veröffentlichung auf `main` oder der Live-Domain. Keine produktiven Datenänderungen. Manuelle Designfreigabe ausstehend, bis alle erzeugten Motive tatsächlich gesichtet sind.
