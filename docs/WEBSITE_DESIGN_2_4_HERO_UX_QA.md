# FOTOPOLIS – Website Design 2.4 · Editorial Hero und UX/UI

Stand: 05.11.2026 · Branch: `design/premium-v2` · PR #2 (Draft) · nur Netlify-Deploy-Preview.

## Umgesetzt

- **Hero ohne Bild:** Kein Fotospiegelbild, kein anderes Foto, keine neu generierte Grafik, kein Preload. Die zuvor doppelt gezeigte Fotospiegel-Visualisierung bleibt **ausschließlich** in ihrer Produktkarte.
- **Premium-Layout:** Typografisch geführte Headline auf Midnight-Navy-/Deep-Blue-Fläche mit minimalen champagnergoldenen CSS-Linien, klarer Hierarchie, beschreibendem Text und zwei handlungsorientierten CTAs.
- **Produktschnellnavigation:** Drei semantische Hero-Links direkt zu Fotobox, Fotospiegel und Fotowohnwagen; eindeutig mit den Produktsektionen verankert.
- **Mobile UX:** Layout-Umbruch zu einer Spalte, gut erreichbare Buttons, handliche Produktschnellnavigation, geringere Abstände in kleinen Viewports.
- **Navigation:** Sticky Header, Anker-Offsets gegen Verdeckung, Escape setzt Fokus zum Menütoggle zurück, Menu schließt bei Desktop-Resize; sichtbare Fokuszustände und reduzierte Animation bei entsprechenden Systemeinstellungen.
- **Rhythmus und Interaktion:** ruhige Cards, optimierte Intro-Abstände und konsistentes Hover-Feedback.

## Grenzen und Schutz

Das freigegebene Logo `site/assets/fotopolis-logo-original.png`, alle Fotobox-/Fotospiegel-/Wohnwagen-Dateien und das bestehende CI bleiben unverändert. Der Netlify-Build prüft Original- und Produktdateien weiterhin über SHA-256.

Keine Änderung an `main`, der Netlify-Hauptvorschau oder `fotopolis-mieten.de`, kein Merge, keine neuen Kosten. Die verlinkte `mailto:`-Anfrage bleibt ein Entwurf für das Review, kein fertiger Kontaktprozess.

## QA und Freigabe

Automatisierte Browserprüfungen des Quellkonzepts und des Netlify-Publish-Verzeichnisses auf 320, 375, 768, 1024 und 1440 px: keine Hero-Bilder, drei echte Produktsprünge, beide CTAs, Bildrendering, keine Überläufe, Desktop-Herohöhe, mobile Menübedienung mit Fokuswiederherstellung und keine JavaScript-Fehler.

**Aussagen zu tatsächlichen Pass-/Fail-Ergebnissen nur nach abgeschlossenem GitHub-Actions-Lauf und Netlify-Deploy treffen.** Endgültige Bild-/Personenrechte, Produktionskontakt, Rechtstexte und Fonts bleiben separate Release-Gates.