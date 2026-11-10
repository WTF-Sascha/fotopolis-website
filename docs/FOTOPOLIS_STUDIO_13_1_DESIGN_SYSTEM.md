# FOTOPOLIS Studio 13.1 – Ganzheitliche Brand- und UX-Harmonisierung
Stand: 10.11.2026 · Nur Entwicklungsbranch/Deploy-Preview #19.

## Entscheidung: Identität statt isolierter Farbkorrektur

**Markenmaster:** `site/assets/fotopolis-goldmark.webp` ist die bereits im Studio-11-Build freigegebene, zuletzt auf der Website verwendete Goldmark-Datei. Sie wird bytegenau beibehalten. Rundes Logo, Schriftzug, Farben und grafische Bestandteile werden nicht neu gezeichnet oder verändert. Die zuvor verwendeten dunkelblau-goldenen App-Icons aus `site/icons` werden im isolierten Preview-Build durch proportional skalierte, goldmark-basierte PWA-Assets ersetzt.

**Qualitätsgrenze:** Der aktuell hinterlegte Master hat nur ungefähr 188 × 188 Pixel. Resampling erzeugt druck-/anzeigefähige Icons in technischen Zielgrößen, kann aber keine fehlenden Originaldetails rekonstruieren. Für eine finale hochwertige 512px-Vorlage sollte das Logo später als hochauflösender Originalmaster (z. B. transparentes PNG oder SVG aus der Freigabe) bereitgestellt werden. Das genehmigte Logo darf dabei nicht neu interpretiert werden.

## Verbindliche Design-Tokens

| Bedeutung | Token | Farbe |
|---|---|---|
| Dark / Espresso | `--fp-brand-dark` | `#211a15` |
| Navigation | `--fp-brand-nav` | `#281f19` |
| Hauptfläche | `--fp-brand-surface` | `#faf6ef` |
| Kartensurface | `--fp-brand-paper` | `#fffcf8` |
| Warme Nebenfläche | `--fp-brand-warm` | `#f0e8dc` |
| Primärakzent | `--fp-brand-accent` | `#c7a776` |
| Kontraststarker Akzenttext | `--fp-brand-accent-ink` | `#6d4b2b` |
| Primärtext | `--fp-brand-ink` | `#2b231d` |
| Sekundärtext | `--fp-brand-muted` | `#685c50` |
| Trennlinien | `--fp-brand-border` | `#ddd0bf` |
| Fokusindikator | `--fp-brand-focus` | `#a87738` |

**Typografie:** Lesetext und Interaktionen verwenden einen konsistenten Sans-Stack (Avenir Next/DM Sans/Inter/Segoe UI/system), redaktionelle Hauptüberschriften Georgia als zuverlässige Serif-Fallback. Keine neuen externen Font-Dateien oder Tracker.

## Implementierte Bereiche

- **Öffentliche Website:** Header / Navigationsstates, Produktkarten, Highlights, Buttons, Kontaktformulare, Galerie, Footer und redaktionelle CMS-Hinweise verwenden gemeinsam geladene Premium-Tokens. Das bisherige Hero-Motiv und die genehmigten Produktbilder bleiben unangetastet.
- **Login:** Dunkelbraune, matte Brand-Fläche statt Blauverlauf; kontrastreiche Eingaben, Tab-Auswahl, Buttons und Fokusindikatoren.
- **Verwaltungs-App:** Sidebar, aktive Menüpunkte, PWA-Logo, mobile Navigation, Dashboard, Quickinfos, Kalender, Tag-Zustände, Gerätekarten, Dialoge, Statuslabels, Analytics, CRM, CMS, Medien und Design Studio in warmem, kontrastreichem System.
- **PWA-Branding:** Installations-Icons 192/512, maskable 512 und Apple 180 sowie Favicons werden aus der genehmigten Goldmarkdatei berechnet; Update-Manifest mit neuen Icon-URLs und Farbwerten, stabile App-ID und Scope bleiben erhalten. Bestehende Icon-Ziele werden ebenfalls überschrieben, damit keine alte App-Grafik auf der Preview eingebunden wird.
- **Accessibility & Mobile:** `focus-visible`, ausreichende Berührungsflächen, reduzierte Bewegungen und responsive Regeln für 390/768/1440px und weitere Viewports. Vorhandene komplexe Formulare und Dialogfunktionen werden nicht ersetzt.
- **Build:** `scripts/apply-studio13-unified-brand.py` läuft nach dem sicherheitskritischen `harden-studio13.py`. Neue CSS-Datei wird ganz am Ende in jede Seiten- und Verwaltungsansicht geladen. Bereits vorhandene blau getönte adminseitige Farbangaben werden zusätzlich in den statisch ausgelieferten CSS-Kopien neutralisiert. Kein Original wird geändert.

## Technischer QA-Fahrplan

1. Build-Syntax, Studio-12/13-Regression und Security-Gate müssen grün sein.
2. Die 44 bestehenden Vorlagen und alle privaten Print-Overlays dürfen nicht verändert oder öffentlich verfügbar gemacht werden.
3. PWA-Manifest: `id=/`, `scope=/`, `theme_color=#211a15`, `background_color=#faf6ef`, neue Icon-Dateien und Version des Service-Worker-Caches.
4. Browser-QA für zehn öffentliche Routen bei 390 und 1440px; Login bei 390/768/1440px; Dashboard-Layoutrender bei 390/768/1440px; interne Editor-Gate-Shell. Für die Dashboard-QA wird der HTML-Aufbau synthetisch sichtbar gemacht, **keine echte Anmeldung simuliert**.
5. Authentifizierter Benutzer-E2E und visuelle Prüfung auf realen Geräten bleiben vor produktiver Freigabe erforderlich.

## Release-Grenzen

Keine Änderungen an `main`, der Live-Domain, produktiven Daten, Originalfotografien oder Druckoriginalen. PR #19 bleibt Draft bis zur ausdrücklichen Freigabe. Historische Netlify-Previews stehen weiterhin unter SSO-Zugriffsschutz.
