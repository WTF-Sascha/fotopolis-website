# FOTOPOLIS Studio 18.1 – CI-2.1-Umsetzungsprotokoll
Stand: 18. November 2026 · Branch `feature/studio18-ci21-complete-brand-integration` · Draft PR #24 gegen `staging`

## Freigabe / unveränderliche Leitplanken
- Auftraggeber erteilte ausdrücklich die **Implementierungsfreigabe im isolierten Entwicklungsbranch** auf Basis von `FOTOPOLIS_Corporate_Identity.pdf` (CI 2.1, November 2026).
- Das bereitgestellte CI-2.0-Logo-Paket enthält **dieselben freigegebenen Motivpixel** wie die CI-2.1-PDF. Die **2.1-Gestaltungsregeln** haben Vorrang.
- Kein Merge nach `staging` oder `main`; kein Produktiv-Deploy, keine Domain-, Datenbank-, Auth- oder zahlungsbezogene Mutation.
- Premium-Hero, Produktoriginale, geschützte Design-Print-Dateien und Studio-17-Prototyp unverändert.

## Tatsächlich implementiert
1. Zentrales CI-2.1-Tokenset mit Ivory `#F7F3EC`, Obsidian `#181512`, Espresso `#30251D`, Logo Yellow `#FEE158`, Yellow Hover `#F8D543`, Muted Gold `#B99862`; Newsreader/Manrope als definierte Font-Familien (lokale Verfügbarkeit ist noch zu verifizieren).
2. Die CI-2.1-Kompatibilitätsebene wird **nach** dem alten Studio-13-CSS in jede generierte HTML-Route eingebunden; Primärbuttons mit dunkler Schrift auf Gelb, sichtbarer Fokus, ruhiger Administrations-Stil.
3. **Bisherige Ursache des Logo-Rückfalls beseitigt:** Die ältere `apply-studio13-unified-brand.py` erzeugt Goldmark-Icons und ersetzt Original-Logo-Referenzen. `apply-studio18-ci21.py` greift nun nach diesem Schritt, überschreibt die Browser-/PWA-Icons **nur in `preview-build`** und tauscht Altlogo-Pfade in allen generierten HTML-Seiten aus.
4. Quelldatei `site/assets/brand/v2-1/fotopolis-logo-ci21-256.webp.b64`: 5.450 Bytes WebP nach Base64-Dekodierung, 256×256 Pixel. Dies ist ein **proportional verkleinertes Raster-Derivat des vom Auftraggeber freigegebenen Originalmasters**, keine neue Grafik und **nicht** die 1254-px-Printvorlage. SHA-256 der dekodierten WebP-Datei: `bd75b191893afdf60ce51ccf5a7ad0298ecca9660603dbd2ce1f1b2755501fba`; Hash im Build geprüft.
5. Iconvarianten 16, 32, 48, 64, 180, 192 und 512 px sowie Maskable-512, Apple-Touch-Icon und Favicon werden aus diesem Original-Derivat für die isolierte Preview erstellt. App-ID/Scope bleiben unverändert.
6. Header-/Footer-Styling behandelt die originale vollständige Wortmarke als Bild und verhindert die optische Überlagerung durch zusätzlich gesetzte Logo-Texte. Der freigegebene Hero bleibt erhalten.
7. Offline-Ansicht wird farblich an CI 2.1 angepasst; der neue Logo-Pfad wird im Service Worker vorgecached. Die geschützten Admin- und API-Pfade bleiben weiterhin vom Offline-Caching ausgenommen.
8. Node-QA prüft: Tokenwerte, Stylesheet-Reihenfolge, 32 vorhandene Classic-Webvorschauen, fehlende alte Logo-Links in HTML, SHA-256 des neuen Bildderivats, PNG-Dimensionen aller Icongrößen, PWA-Cache-Pfade sowie rechnerisch ausreichenden WCAG-Farbkontrast für die drei primären Farbkombinationen.

## Verifizierte technische Nachweise
- Erfolgreiches **isoliertes Netlify Deploy Preview** für Commit `7c4416bfb1fb376c5ccd1db6e222fac4a1e5c193`: `https://6afdb0bbc47e3ba034a3c208--fotopolis-preview.netlify.app/`; Netlify-Status **ready**; 18 generierte HTML-Seiten. Dies bestätigt den Build, **nicht** Screenshot- oder Interaktionsqualität.
- Spätere Commits verbessern Offline-Kontrast, PWA-Cache und automatisierte QA. Ihren Status erneut prüfen; der oben genannte Deploy beweist **nicht** den Erfolg späterer Commits.
- Logo-Hash der kompakten Bilddatei wurde zusätzlich unabhängig aus den über GitHub eingelesenen Base64-Daten kontrolliert und stimmt mit dem lokalen Derivat überein.

## Ausstehend / Keine Freigabe
- [ ] Original-Logo mit **vollständiger 1254×1254-Auflösung** als reguläre Binary im Repository versionieren (nicht nur das Preview-Derivat); hochwertige Web- und Printableitungen daraus erzeugen.
- [ ] Text/Assets nach Vollständigkeit durch alle tatsächlich vorhandenen Seiten, E-Mails, Meta-OG, Admin und Kundenportal verfolgen.
- [ ] Newsreader/Manrope als geladene, CSP-konforme Webfonts verifizieren; lediglich gesetzte CSS-Familien gelten nicht als abgeschlossen.
- [ ] Screenshot- und Responsive-Vergleich über 320/360/390/768/1024/1280/1440 px, Tastatur/SR/Barrierefreiheit und Real-Browser-Interaktion durchführen.
- [ ] 32 Classic-Print-Originale einzeln auf 300-DPI, Logo unten rechts, Designnamen und echten Geräteausdruck prüfen; geschützte Dateien nicht veröffentlichen.
- [ ] Login, RBAC, Formularabgabe, Anfragen und Verwaltungsabläufe mit freigegebenen **Testdaten** Ende-zu-Ende prüfen.
- [ ] OG/Social/E-Mail, Kundenportal und Gerätedisplays mit ihren echten Quellen abgleichen.
- [ ] Finalen Feature-Commit und Netlify-Status zusammen mit Checklisten vor einer gesonderten Freigabe nachweisen.

**RELEASE-ENTSCHEID: NO-GO.** Der sichtbare Logo-/CI-Migrationsstand ist auf einem getrennten Preview implementiert; eine vollständige Qualitätsabnahme oder produktive Veröffentlichung ist nicht erteilt.


## Nachtrag 20.11.2026 – eingebrannte Logos und echte Produktbild-Derivate

**Hintergrund:** Der Auftraggeber wies anhand einer mobilen Preview darauf hin, dass bisherige Logos innerhalb der Gerätefotografien nicht allein durch einen Header-/PWA-Logotausch verschwinden.

**Tatsächlich implementiert im isolierten Studio-18-Feature-Branch:**

1. `scripts/studio18-retouch-product-screens.py` verarbeitet ausschließlich den inneren **Displaybereich** der vorhandenen Fotospiegel- und Fotobox-Quellen. Das alte, innerhalb der Pixel gespeicherte Display-Branding wird dort ersetzt; eine Original-CI-2.1-Bildmarke wird als echtes Pixelbild mit Ivory, Obsidian und gezieltem Logo Yellow eingebettet. Gehäuse, Licht, übrige Dekoration, Kamerarahmen und Fotokomposition werden außerhalb des Bildausschnitts nicht manipuliert.
2. Das Script erzeugt im Netlify-Deploy **drei neue WebP-Bildderivate**: `fotospiegel-hero-lossless-ci21.webp`, `fotobox-event-1672-ci21.webp` sowie die aus dem korrigierten hochauflösenden Fotoboxbild hergeleitete `fotobox-event-800-ci21.webp`.
3. Die Post-Build-Migration `scripts/apply-studio18-ci21.py` ersetzt die Referenzen auf diese Bilder in allen generierten HTML-, CSS-, JS-, JSON- und Manifest-Dateien. Alte Bildderivate werden **nur aus dem isolierten Public-Build** entfernt. Die fotografischen Originaldateien in Git bleiben unverändert.
4. `qa/studio18-embedded-image-corrections.json` protokolliert Eingangs-/Ausgangs-SHA-256, Auflösung, Pixel-Austauschbereich und Vergleich der bearbeiteten Bildschirmflächen. Static-QA kontrolliert die korrigierten Bilddateien und verbietet alte Bildreferenzen in den aktiven Ausgabedateien.
5. Die **44 gebauten Drucklayouts (32 Classic + 12 Signature)** werden nun vom gemeinsamen Generator `scripts/build-photo-print-collection.py` mit der geprüften **CI-2.1-Originalmarke** statt der Studio-13-Goldmark erzeugt. Die vorhandenen Motive und Fotofenster bleiben erhalten; die geschützten Druckdateien sind nicht öffentlich als CDN-Dateien zugänglich. Die zugehörige QA prüft das Logo-Masterhash und die Anzahl der Print- und Preview-Dateien.
6. Der neue Bildalgorithmus wurde vor Integration lokal auf synthetischen Quellgrößen ausgeführt und auf echte Rasteränderung innerhalb der Zielregion geprüft. **Das ersetzt ausdrücklich keinen Vorher-/Nachher-Review der realen Bilddateien.**

**Weiter offene Abnahme-Gates:** Browser-Screenshots des neuesten Commitstands, PWA-Gerätetests, echte Druckproofs der 44 geschützten Vorlagen, mögliche Altmarken in nicht aktiven Video-/Marketingquellen, vollständige WCAG- und Auth-/Anfrage-End-to-End-Tests. Blaue Elemente in erhaltenen **Originalmotiven** der Classic-Collection sind gesondert mit dem Auftraggeber abzustimmen; bloße Logo-Migration ist noch kein CI-Redesign aller Motive.

**Sicherheit:** Es gab keinen Merge, keinen produktiven Deploy und keine DB-Migration. Der PR bleibt Draft und die Releaseentscheidung **NO-GO**, bis sämtliche Pflichtnachweise vorliegen.
