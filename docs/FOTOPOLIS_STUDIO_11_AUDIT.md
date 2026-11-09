# FOTOPOLIS Studio 11.0 — Quiet Luxury / Design-Audit und QS

**Stand:** 08.11.2026 · **Ziel:** isolierter Preview-Kandidat, keine Produktivfreigabe.

## Ausgangsbasis / Provenienz

- Repository: `WTF-Sascha/fotopolis-website`.
- Studio-10-Baseline: Commit `f689a209929e25bdd6b6d8717675277d0ec52eb8`, PR #16 (offen, Draft).
- Studio-11-Branch: `feature/studio11-quiet-luxury-20261108`.
- Prüfumfang: 14 öffentliche Seiten, 32 Designvorlagen, 7 Viewports (360/390/430/768/1024/1440/1920).
- Studio-10-QA-Aussage: 98 automatisierte Browserfälle bestanden; **keine** menschliche Gestaltungsfreigabe.
- Die Testvorschau konnte während der ersten Codeprüfung nicht direkt in einem visuellen Browser geöffnet werden. Daraus werden keine ungetesteten Aussagen abgeleitet.

## Priorisierte Problemmatrix

| ID | Priorität | Art | Beobachtung / Evidenz | Maßnahme Studio 11 | Status |
|---|---|---|---|---|---|
| A01 | P0 | **Nachgewiesener Codebefund** | `studio-v5.css`, `brand-gold.css`, `brand-finish.css`, `studio10-premium.css` und seitenbezogene Styles aktiv; teils überschreibende !important-Regeln und vorangehende Navy-Hexwerte | Einheitliche Abschluss-Tokens und definierte Ladefolge in `studio11-quiet-luxury.css` | Implementiert; vollständige Legacy-CSS-Konsolidierung offen |
| A02 | P0 | **Nachgewiesener Codebefund** | Header hat ein großes Wellen-SVG und große Mindesthöhen; mobile Navigation zentriert bisher das Logo und erzeugt eine zusätzliche Bottom-Dock | Kompakter Header, linksbündiges Branding, ruhiger Mobile-Drawer, Dock ausgeblendet | Implementiert, Browser-/Usability-Abnahme offen |
| A03 | P0 | **Hinweis aus Studio-10-Review** | Kontakt-Zusammenfassung teilweise kontrastschwach; dunkle Zusammenfassung im Produktflow | Direkte Text- und Background-Kontrastregeln, referenzierte Farbpaar-Prüfung | Implementiert, tatsächliche Pixelkontraste in CI zu prüfen |
| A04 | P0 | **Nachgewiesener Codebefund** | `studio-v5.css` und `reference-v4.css` enthalten blau geprägte Paket-, Galerie- und Produktfarben | Tokens und explizite Overrides für Konfigurator, Buttons, Tabellen, Galerie, Produktdetails | Implementiert, Restfarben-/Browserprüfung offen |
| A05 | P1 | **Gestalterische Schwäche** | Radialverläufe, Goldlinien, doppelte Produkt-Rahmen und dekorative Kreise in CSS | Matte Flächen, definierte Materialien, ruhige Bildbühnen, reduzierte Radien | Implementiert, Screenshots auswerten |
| A06 | P1 | **Gestalterische Schwäche** | Viele abwechselnde Hero-/Karten-/Ziermuster unterbrechen Dramaturgie | Einheitliche Headlines, Abstände und Bildproportionen, entfallene Embleme | Erste Umsetzung, produktspezifische Einzelabnahme offen |
| A07 | P1 | **Prüfhypothese** | Einzelne Designvorlagen erscheinen in Screenshots leer | In Browser-QA jede Seite wirklich scrollen, Bilder dekodieren, 32 Galerie-Bilder prüfen | CI-Prüfung implementiert; Ergebnis noch offen |
| A08 | P0 | **Nachgewiesener Screenshotbefund** | Beim tatsächlichen 300%-Review sind an mehreren der 32 bearbeiteten Logo-Ausschnitte weiche Halo-Ränder und uneinheitliche Freistellungen sichtbar (u. a. FP-014, FP-019, FP-023 und FP-027); kein Ausfall der Bilddateien | Originalmotivik schützen; vorhandene Retuschen nicht pauschal freigeben; gezielte Quellbild-basierte professionelle Überarbeitung als separater Bild-QA-Schritt | **Offen – keine Bildfreigabe** |
| A09 | P1 | **Prüfhypothese** | Mirror-Display nutzt nur abgeleiteten Low-Res-Videostill; Original-MP4 nicht im Repo | Quellmaterial nicht erfinden; Geräte-/Logo-Komposition nicht verändern | Verbesserte Originaldatei weiterhin erforderlich |
| A10 | P2 | **Gestalterische Schwäche** | Kleine Labels und dekorative Fließtextgestaltung | 16px Basisschrift, responsive Display-Schrift, kräftigere Sekundärfarben | Implementiert, Browser-Kontrast prüfen |
| A11 | P2 | **Technische Grenze** | Noch keine verlässlichen Daten zu LCP/CLS, Screenreader und Cross-Browser | Keine erfundenen Messwerte; separate Labormessung bzw. manuelle Prüfung | Offen |

**Begriffe:** Nachgewiesen = anhand von Code, CI-Ausgabe oder tatsächlich gesichteten Screenshots festgestellt; Schwäche = fachliche Gestaltungsbeurteilung; Hypothese = zusätzlicher Browsertest oder Quellenprüfung nötig.

## Designsystem / technische Umsetzung

| Ebene | Entscheidung |
|---|---|
| Primärflächen | Soft Ivory `#F7F3EC`, Porcelain `#FFFCF8` |
| Dunkle Dramaturgie | Obsidian `#181512`, Espresso `#30251D` |
| Akzent | Champagne `#B99862` nur selektiv; für kleinen Text `#765633` |
| Referenzkontraste | Dunkler Text/heller Grund mindestens 4,5:1; Werte im `qa/studio11-build-audit.json` |
| Schrift | `Newsreader` / `Manrope` als bevorzugte Familiennamen; mangels lokal eingebundener Fontdateien reale Auslieferung derzeit über Georgia/System-Fallbacks; keine datenschutzkritischen Google-Font-Requests |
| CTAs | Matte Flächen, nur kurze Farbtransition; keine Goldglow- oder 3D-Effekte |
| Header | Kürzer, links Markenlogo, rechts Desktop-Navigation, auf Mobile zugänglicher Drawer |
| Hero | Original-Foto-Mirror unverändert; ein textorientierter Produktlink ergänzt |
| Collection | 32 Originalvorlagen, bestehende Filter-, Großansicht- und Anfragelogik unverändert; Präsentationsfläche erneuert |
| CSS | Neue isolierte, zuletzt geladene Designschicht. **Nicht** behauptet: vollständige Entfernung aller alten Cascade-/!important-Regeln. |
| Formular | Ausschließlich Präsentations-CSS, existierender Netlify-Forms-/Consent-/Mailto-Pfad unverändert |
| Administration | Ausgeschlossen; weder Datenbank noch Auth-CSS angefasst |

## Bildherkunft, Retuschegrenzen und Rückrollbarkeit

Die originalen Vorlagen unter `concepts/premium-v2/assets/designvorlagen/` und das Masterlogo `site/assets/fotopolis-goldmark.webp` bleiben unangetastet. Studio 10 erzeugt bestehende Vorschau-Derivate mit ersetzten Logos; diese Preview-Kopien sind **nicht bytegleich** mit Originalen. Studio 11 erstellt keine neue Bildretusche. Im Studio-11-Audit werden getrennte SHA-256-Werte für Original und bereits bearbeitete Vorschau dokumentiert. Originalvideo ist im überprüften Git-Baum nicht enthalten; eine originalgetreue High-Res-Rekonstruktion wird nicht behauptet.

Rollback: Studio-11-Branch/PR entfernen oder deaktivieren. Studio-10-Commit `f689a209` bleibt als unabhängige Ausgangsbasis erhalten. `main`, Haupt-Netlify-Domain und produktive Domain dürfen nicht verändert werden.

## QS-Protokoll / Akzeptanzkriterien

1. **Static Build:** `python3 scripts/build-premium-preview.py` und `node scripts/visual-release-qa.mjs`; 14 Seiten, Logo, 32 Motive, Formular- und PWA-Verknüpfungen.
2. **Browser-QA:** `node scripts/studio11-browser-qa.mjs`; 98 Kombinationen mit echten Scrollvorgängen, Image-Decode, Overflow, 32 Collection-Bildern, Navigationszuständen, Formularfeldern, Logo, HTTP-/JS-Fehlern.
3. **Visuelle Regression:** Realbrowser-Screenshots der fixierten Studio-10-Baseline gegen Studio 11 bei 390 und 1440 Pixeln; jeweils First Fold und Fullpage für jede Route.
4. **Unabhängige menschliche Kontrolle:** Screenshots, Produkterkennung, Textumbrüche, reale Gerätekompositionen, 32 Drucklayouts bei 200–300%, Touch-UX, Tastatur/Screenreader und weitere Browser. **Nicht automatisch bestanden.**
5. **Core Web Vitals:** LCP/CLS unter reproduzierbaren Bedingungen messen, bevor Zahlen freigegeben werden.
6. **Formulare:** Keine Live- oder Testnachrichten ohne gesondert kontrollierte Freigabe; DOM-Simulation ist keine E2E-Netlify-Übermittlung.

## Freigabestatus

**Nicht freigegeben.** CI-Ergebnis, eigenständige Deploy-Preview und menschliche Sichtprüfung sind gesondert nachzutragen. Die Fertigstellung des Designsystems bedeutet **nicht** gleichzeitig die vollständige technische und visuelle Projektabnahme.


## Screenshot-Nachprüfung / Korrekturrunde 11.0-R2

Beim ersten unabhängigen Sichtvergleich der CI-Screenshots wurden folgende Befunde bestätigt:

- **Header:** Desktop-Logo war noch über statt links neben der Navigation angeordnet. Auf Mobile blieb die bisherige zentrierte Logogeometrie aktiv. Ursache: spezifischere `studio-v5.css`-Regeln für 147px-Zeilenlayout und 120px-Mobilheader. Gegenmaßnahme: gleich spezifische, später geladene responsive Studio-11-Overrides.
- **Paketkonfigurator:** Alte dunkle Form-Textfarben wurden auf hellem Hintergrund kaum lesbar. Die alte zweispaltige Rasterdefinition ließ eine große leere Fläche unter der Produktauswahl. Gegenmaßnahme: neue vollbreite Produktauswahl, zwei logisch angeordnete Eingabebereiche, dunkle Labels, eigener Summary-Bereich.
- **Screenshots:** Der alte Smooth-Scroll-Zustand konnte beim automatisierten Rücksprung zur Seitenoberkante noch laufen. Gegenmaßnahme: Scroll-Animation für die Testausführung deaktiviert, nach echtem Scroll/Decode `scrollY===0` abgewartet.
- **Logo-Retusche:** 300%-Sichtprüfung ergab bei einzelnen Vorlagen unsaubere Übergänge; dies bleibt bewusst ein offener **P0-Asset-Qualitätsmangel**. Kein Retusche-Vorgang auf niedrigwertiger Bildbasis wird als professionelle Lösung ausgegeben.

Die vorliegenden ersten Screenshots sind echte Browseraufnahmen; **nur neu aufgenommene, mit korrigiertem Scrollzustand erstellte First-Fold-Screenshots** dürfen künftig als First-Fold-Evidenz gelten. Ein erfolgreicher DOM-Test ersetzt diese Sichtprüfung nicht.


## Fortsetzung 11.0-R3 — Sichtprüfung der echten Browseraufnahmen (08.11.2026)

**Evidenz:** GitHub Actions Run [42528864627](https://github.com/WTF-Sascha/fotopolis-website/actions/runs/42528864627), Artefakt `studio11-browser-qa-16`. Dieses Material gehört ausdrücklich zum früheren Commit `bad968c`, **nicht** zu den unten genannten Korrekturen. Der archivierte Lauf meldet 98/98 erfolgreiche Browser-/Viewport-Fälle und enthält 390px/1440px First-Fold- und Fullpage-Aufnahmen beider Versionen. Eine anschließende menschliche Sichtprüfung der 14 Übersichtsbilder zeigte einen Fehler, den der ursprüngliche technische Gate nicht erkennen konnte:

| ID | Priorität | Nachweis | Studio-11-R3-Maßnahme | Abnahme |
|---|---|---|---|---|
| A12 | **P0** | **Tatsächliche 390px- und 1440px-First-Fold-Screenshots:** Der Bestätigungstext auf `/danke/` war nahezu weiß auf Ivory. Ursache: `studio9.css` setzte `#dce6e8` für ein ehemals dunkelblaues Layout, während Studio 10 die Fläche auf hell umstellte. | Öffentliche `.studio9-thanks p`-Textfarbe an `--fp11-secondary` angepasst, Textgröße/Zeilenhöhe präzisiert. Browser-QA prüft jetzt für jede Breite den Textkontrast gegen den tatsächlich berechneten Containergrund und verlangt mindestens 4,5:1. | **Korrektur committed, erneuter CI-Lauf erforderlich.** |
| A13 | P2 | **Codebefund:** Mobile Markenzusätze waren teilweise nur 7–8px, Produkt- und Galerielabels häufig 10–13px. | Mobile Wortmarke, Produkt-Tags, Galeriefilter, Kartentexte und Footer-Leseführung systematisch moderat vergrößert; unverändertes Original-Logo. | **Korrektur committed, visuelle Prüfung der neuen Screenshots erforderlich.** |
| A14 | P1 | **Testabdeckungslücke:** Die 32 Galerie-Dateien waren gezählt/geladen, aber Such-/Filter- und Modalfunktionen waren nicht interaktiv geprüft. | Browser-QA öffnet auf 390px eine Designvorschau, kontrolliert Fokus, Anfrage-Parameter, Escape, Fokus-Rückgabe, Such-Leerzustand sowie Kategorie- und Reset-Filter. Danach wird vor First-Fold-Aufnahmen explizit auf `scrollY=0` zurückgesetzt. | **Interaktions-Code committed, erneuter CI-Lauf erforderlich.** |
| A15 | P1 | **Tatsächlicher 390px-Fullpage-Screenshot:** Die drei Kontaktaktionen unter der Zusammenfassung wurden durch eine alte mobile `flex:auto`-Regel zu sehr hohen Leerflächen. | Mobilen CTA-Container auf feste Inhaltshöhen und mindestens 50px Touch-Ziel umgestellt; Playwright prüft nun 44–84px sichtbare Aktionshöhe. | **Korrektur committed, erneuter CI-Lauf erforderlich.** |
| A16 | P1 | **Tatsächlicher 390px-Pakete-Fullpage-Screenshot + nachgewiesene CSS-Kaskade:** Die Vergleichstabelle hat dunkelblaue Kopfzellen, obwohl der umgebende `thead` auf Espresso umgestellt war. Legacy `styles.css` setzt die Farbe unmittelbar auf `thead th`. | Espresso-Hintergrund direkt auf `.compare-table thead th` mit später geladener Studio-11-Regel, ruhiger Fokusindikator für `.compare-scroll`, farbgenaue Browserprüfung an sieben Breiten. | **Korrektur committed, neuer CI-Lauf erforderlich.** |

### Separat verbleibende Qualitätsgrenzen

- Aus dem 300%-Zoom-Audit sind erkennbare Halo-/Freistellkanten an mehreren Drucklogos weiterhin offen. Dies ist **kein** bestandener Bildfreigabeprozess; Studio 11 verändert weder die Vorlagen-Originale noch das verbindliche Masterlogo.
- Web-Vitals, Screenreader, reale Gerätekonfigurationen und echte Netlify-Forms-Einreichung wurden nicht verifiziert.
- Die QA-Screenshots sind Belege für gerenderte Zustände; ohne unabhängige Sichtabnahme sind sie kein gestalterisches Freigabezertifikat.
- Für sämtliche nach R3 neu erzeugten Vorher-Nachher-Bilder gilt ausschließlich der **neue** CI-Artefaktstand des aktuellen Commit-Hash als belastbar.


## 11.0-R4 — Original-Logo im Fotobox-Display korrekt zentriert (09.11.2026)

**Anlass:** Der Betreiber hat auf einer Produktpräsentation eine nicht sauber zentrierte FOTOPOLIS-Signatur im Fotobox-Display beanstandet. Ein allein im Chat gerendertes Bild ist keine PWA-Implementierung.

**Nachgewiesene Ursache im Code:** `scripts/visual-brand-pro.py` verwendete das Portrait-Standbild des Foto Mirror als 4:3-Crop auch für die Fotobox. Dieses Verfahren kann Logo- und Bildschirmausrichtung verschieben. Der fehleranfällige Fotobox-Crop wurde ersetzt.

**Tatsächliche Codeänderungen (nur Studio-11-Branch):**
- Ein eigens für das Fotobox-Display erstelltes, ruhiges 4:3-Bildschirmdesign verwendet **direkt die unveränderte, genehmigte** `site/assets/fotopolis-goldmark.webp`. Das Logo liegt geometrisch zentriert bei x=600 von 1200 Bildpunkten. Der Touch-to-Start-Knopf ist ebenso zentriert.
- `fotobox-event-800.webp` und `fotobox-event-1672.webp` werden beim Preview-Build ausschließlich innerhalb der schon festgelegten Geräte-Displaymaske neu erzeugt. Außerhalb dieses Bereichs prüft die bestehende `ImageChops`-Regression Pixelidentität.
- Die hochauflösende Foto-Mirror-Komposition, alle 32 Druckvorlagen, die Masterlogo-Datei und die unbearbeiteten Originalfoto-Dateien bleiben erhalten.
- `preview-build/qa/fotobox-logo-centering-before-after.webp` bietet einen tatsächlichen vergrößerten Original-/Kandidatenvergleich. `preview-build/qa/fotobox-logo-centering.json` dokumentiert Logoherkunft, Position und beide Bildvarianten.
- `scripts/visual-release-qa.mjs` verlangt jetzt beide Artefakte und den dokumentierten identischen horizontalen Mittelpunkt von Logo, Screen und Touch-CTA.
- Die PWA-Service-Worker-Kennung wurde geändert, damit installierte Vorschau-PWAs die aktualisierte Fotobox-Darstellung nicht aus einer früheren Cache-Version beziehen.

**Scope-/Freigabegrenzen:** Nur Produktbilddarstellung im separaten Studio-11-Preview. Nicht mit der bereits früher erzeugten freien Bildvariante verwechseln: Kein gesamtes Produktbild oder dekorativer Event-Hintergrund wurde generativ ersetzt. Die manuelle Einzelbildkontrolle der Bildschirmperspektive und die übrigen Logo-Retuschen bleiben gesonderte Freigabepunkte. Keine Änderung an Live-Domain, main, Kundendaten oder Adminbereich.
