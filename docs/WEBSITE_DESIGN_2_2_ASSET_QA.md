# FOTOPOLIS — Website Design 2.2 · Produktbild-Inventar und QA

Stand: 05.11.2026 · Branch: `design/premium-v2` · PR #2 · ausschließlich Deploy Preview.

## Quellen und Status

| Komponente | Originalquelle | Im Review-Build | Größe (Pixel) | Kategorie | Status |
|---|---|---|---:|---|---|
| Logo | `site/assets/fotopolis-logo-original.png` | `/assets/fotopolis-logo-original.png` | siehe Originaldatei | Markenoriginal | unverändert kopiert; Build prüft Bytegleichheit |
| Hero (Desktop/Mobil) | `concepts/premium-v2/assets/fotospiegel-hero-lossless.webp` | `/assets/images/fotospiegel-hero-lossless.webp` | 840 × 1050 | freigegebene Studio-Visualisierung | freigegeben, SHA-256 geprüft |
| Fotospiegel-Karte | identische Fotospiegel-Datei | identische Build-Datei | 840 × 1050 | freigegebene Studio-Visualisierung | freigegeben, keine Filter/Beschnitte |
| Fotobox-Karte | *Finalbild aus parallelem Chat nicht als Datei verfügbar* | bewusst **kein** Fotobox-Ersatzbild | — | freigegebene Visualisierung erwartet | **BLOCKIERT**: geprüfte Originaldatei fehlt |
| Fotowohnwagen-Feature | `review-assets/legacy/LEG-014.webp` | `/assets/images/LEG-014.webp` | 1200 × 769 | reales älteres Referenzfoto | **PROVISORISCH**, nicht finale Gartenparty-Visualisierung |
| Galerie Hochzeit | `review-assets/legacy/LEG-060.webp` | `/assets/images/LEG-060.webp` | 1800 × 1200 | reales Eventfoto | nur Sichtung, Bildrechte ungeklärt |
| Galerie Fotowohnwagen | `review-assets/legacy/LEG-073.webp` | `/assets/images/LEG-073.webp` | 1800 × 1200 | reales Eventfoto | nur Sichtung, Bildrechte ungeklärt |
| Galerie Mottoparty | `review-assets/legacy/LEG-046.webp` | `/assets/images/LEG-046.webp` | 1800 × 1200 | reales Eventfoto | nur Sichtung, Bildrechte ungeklärt |

Fotospiegel SHA-256: `c9a493de7b479b13253e1c7ba91da6d8fc5cd775f918c84c5881a71efe640241`.

## Was geändert wurde
- `LEG-019.webp` (Gäste vor Fotohintergrund) aus dem Fotobox-Produktbereich **entfernt**; auch aus dem Deploy-Build gestrichen.
- Statt ein falsches Gerät zu zeigen, ist der noch fehlende freigegebene Originaldatei-Import transparent als `pending-approved-file` markiert. **Nicht als abgeschlossene Fotobox-Bildintegration werten.**
- Originalfoto `LEG-014.webp` bleibt als vorübergehender Wohnwagen-Platzhalter; `legacy-reference` ist sichtbar dokumentiert. **Nicht als finales Gartenparty-Foto werten.**
- Für Fotospiegel und Wohnwagen gilt `object-fit:contain` und `filter:none`; störende Bildüberlagerung am Wohnwagen entfernt.
- Keine generative Neuschöpfung, keine Retusche, keine Veränderung am Logo oder am Fotospiegel-Bild.
- Der Preview-Build kopiert nur vier ältere Event-/Referenzbilder statt fünf.

## Fehlende Originale / Abnahme-Gates
1. **Fotobox:** Letzte freigegebene Fest-/Geburtstagsszene mit vollständig sichtbarer Box, originalgetreuem kleinen FOTOPOLIS-Logo und „Touch to start“. In GitHub-Tree und verfügbaren Projekt-/Library-Dateien nicht vorhanden. Eine Chat-Vorschau ist keine über GitHub ladbare Datei.
2. **Fotowohnwagen:** Zuletzt freigegebene Gartenparty-Szene, ohne Aufkleber, künstliches Display oder „40“. Entsprechend nicht als überprüfbares Asset vorhanden.
3. **Logo:** nicht neu generieren. Für Logo bleibt die Datei im Repository maßgeblich.
4. **Rechte:** Bilder mit Gästen in der Review-Galerie nicht ohne Personen-/Nutzungsfreigabe live veröffentlichen.
5. **Review ist keine Produktionsfreigabe**: Netlify-Hauptvorschau, main und bestehende Domain bleiben unberührt.

## Prüfung
`scripts/premium-concept-qa.mjs` testet bei 320, 375, 768, 1024 und 1440 px: HTTP, Bild-Laden, horizontalen Überlauf, unveränderten Logopfad, Fotospiegel-Ausschnitt und Filter, Wohnwagen-Ausschnitt, korrekte Fotobox-Fehlbildbehandlung, interne Anker, H1, Browserfehler sowie mobiles Menü. GitHub Actions prüft Quelle und Netlify-Build separat.

**Testergebnis erst eintragen, wenn ein neuer Actions-Lauf tatsächlich abgeschlossen ist.** Vorschau-Status getrennt von Code-Status bewerten.