# FOTOPOLIS – Website Design 2.3 · Product Asset QA
**Stand:** 05.11.2026 · **Branch:** `design/premium-v2` · **PR:** #2 (Draft) · ausschließlich Netlify-Deploy-Preview.

| Bereich | Quelle | Originalgröße | Web-Assets | Status |
|---|---|---|---|---|
| Hero + Fotospiegel-Karte | `file_000000005f5882469375063f9a1a5092.png` | 1122×1402 | `fotospiegel-hero-lossless.webp` 840×1050 | ursprüngliche freigegebene Datei unverändert; nach Resampling mit neuem Upload pixelgleich |
| Fotobox-Karte | `file_00000000b9508210b66bcf5855d0d18f.png` | 1672×941 | `fotobox-event-1672.webp` (344472 Bytes), `fotobox-event-800.webp` (120708 Bytes) | korrekt als Gerät in Geburtstagsszene |
| Fotowohnwagen-Spotlight | `file_00000000d8e8822fb12138b88617d8ce.png` | 1448×1086 | `fotowohnwagen-gartenparty-1448.webp` (460504 Bytes), `fotowohnwagen-gartenparty-760.webp` (165140 Bytes) | korrekt als Wohnwagen in Gartenpartyszene |

Originalbilder bytegleich auf Entwicklungsbranch in `concepts/premium-v2/assets/incoming` kopiert. `main` bleibt unberührt. Referenzen und SHA-256 stehen in `concepts/premium-v2/assets/products/manifest.json`.

**Bildbearbeitung:** Keine Objekt- oder Logoänderungen, keine Retusche, kein Beschnitt und kein CSS-Filter. Ausschließlich hochqualitative WebP-Codierung (quality 94, method 6) und proportionale Skalierung für responsive Varianten.

**Frontend:** `object-fit:contain`, beschreibende Alternativtexte, `srcset` und `sizes`, explizite Bilddimensionen, Lazy Loading nach dem Hero sowie Hero-Preload. Original-Logo `site/assets/fotopolis-logo-original.png` nicht verändert, ebenso der bestehende Fotospiegel mit SHA-256 `c9a493de7b479b13253e1c7ba91da6d8fc5cd775f918c84c5881a71efe640241`.

**QA:** GitHub Actions `scripts/premium-concept-qa.mjs` prüft Konzept und Netlify-Build bei 320, 375, 768, 1024, 1440 px: Bilddateien und `srcset`, `object-fit`/Filter, Alttext, Navigation, JavaScript, Überlauf und Logo. Resultate erst nach tatsächlichem Workflow-Abschluss bestätigen.

**Offen:** Bild- und Personeneinwilligungen der realen Galerie-Bilder `LEG-060`, `LEG-073`, `LEG-046`; schriftliche Rechtsseiten/Datenschutz, finale Fonts, Anfragefunktion und Freigabe der endgültigen Website. Keine Änderungen an `main`, `fotopolis-mieten.de` oder an der Netlify-Hauptvorschau.