# FOTOPOLIS Studio 18.1 – Eingebrannte Altlogos in Bilddateien
Stand: 2026-11-18 · Entwicklungsbranch · **NO-GO für visuelle Freigabe**

## Nutzermeldung und Befund
Im mobilen Screenshot der aktiven Studio-18-Preview ist in der Karte „Foto Mirror“ das veraltete gold-/dunkelblaue Fotopolis-Logo **innerhalb der Fotospiegel-Bilddatei** zu sehen. Ein Austausch des Headerlogos, Favicons, CSS oder PWA-Icons behebt diesen Fehler nicht.

Quellbilder aus dem GitHub-Feature-Branch wurden einzeln visuell geprüft. Betroffene Bildinhalte:

| Priorität | Quellasset | Sichtbarer Befund | Abhilfe | Status |
|---|---|---|---|---|
| **P0** | `concepts/premium-v2/assets/fotospiegel-hero-lossless.webp` | Großes blau-goldenes Rundlogo und alte Interface-Beschriftung auf dem Fotospiegel-Display. Verwendung auch in Produkt-/Heroansichten prüfen. | Foto quelltreu retuschieren, Bildschirm **ohne altes Logo** neu gestalten; freigegebene originale CI-2.1-Wort-/Bildmarke perspektivisch korrekt in Displayfläche einpassen. Keine Veränderung am Gerät, Hintergrund, Licht, Rahmen oder Fotomaterial. | **OFFEN** |
| **P0** | `concepts/premium-v2/assets/products/fotobox-event-1672.webp` und `fotobox-event-800.webp` | Altes Gold-/Dunkellogo auf dem Bildschirm der Fotobox in den veröffentlichten Bildderivaten. | Gemeinsame hochauflösende Originalquelle bearbeiten und beide Auflösungen **aus derselben korrigierten Quelle** neu exportieren, mit 1:1-Geräte- und Motivtreue. | **OFFEN** |
| **P1 / Prüfung** | `concepts/premium-v2/assets/products/fotowohnwagen-gartenparty-1448.webp` und `fotowohnwagen-gartenparty-760.webp` | Wimpelkette mit „FOTOPOLIS“-Buchstaben, jedoch **nicht dasselbe veraltete Rundlogo**. | Markenkonformität abklären; die vom Auftraggeber gewünschte Fotopolis-Wimpelkette nicht reflexartig entfernen oder in ein unlesbares Logo verwandeln. | **EINZELPRÜFUNG OFFEN** |
| **P0** | `concepts/premium-v2/assets/branding/fotopolis-video-still-source.webp` | Altes Badge als zentrales Bildschirmmotiv, vermutlich für Film-/Gerätevarianten. | Video-/Fotoquelle und ggf. Animationen prüfen; neues Display mit Originalmarke konsistent integrieren. | **OFFEN** |
| **P1** | 32 × `concepts/premium-v2/assets/designvorlagen/fp-001.webp` … `fp-032.webp` | Die 32 Vorschauen existieren; eingebrannte Markenlogos wurden **noch nicht** einzeln bildlich geprüft. | Vorschau und private Druckdatei einzeln kontrollieren, Original-Logo unten rechts, nie Designname auf dem Druck, keine doppelten Logos. | **OFFEN** |
| **P1** | Weitere aktive Vorschauen, Open-Graph/Email-/Medien-/Gerätebilder | Noch nicht vollständig bildlich inventarisiert. | Bildquellen und vom Build referenzierte Derivate auf Markenaltlasten prüfen und dokumentieren. | **OFFEN** |

## Verbindliche Bildretusche-Spezifikation

1. **Das hochauflösende vorhandene Original ist die Referenz.** Bildaufbau, Gerät, Perspektive, Kamera, Rahmen, Schatten, Umgebung, Requisiten, Texturen und Licht bleiben unverändert.
2. Das alte integrierte Logo wird wirklich aus der Bilddatei entfernt; ein zusätzliches CSS-/HTML-Overlay oder ungeeigneter Filter zählt **nicht** als Reparatur.
3. Retusche muss die ehemalige Logo-Fläche plausibel rekonstruieren. Anschließend ist das **verifizierte originale Rasterlogo aus dem CI-2.1-freigegebenen Logo-Paket** in der Display-Ebene unter Beachtung von Perspektive, Reflexion, Material und Kontrast einzusetzen. Kein nachgezeichneter Text.
4. Farbgebung: CI-2.1 Ivory `#F7F3EC`, Logo Yellow `#FEE158`, Obsidian `#181512`, Espresso `#30251D`. Bei dunklen Displays darf das freigegebene kontrastreiche Logo-Badge auf hellem Feld verwendet werden; kein blau-goldenes Altbranding.
5. Die alte Bilddatei durch eine nachvollziehbar benannte, korrigierte Quelle ersetzen; anschließend **alle** Responsive-Derivate aus derselben Quelle neu exportieren. Bildabmessung, Seitenverhältnis und Orientierung unverändert lassen.
6. Pro Motiv: alt/neu-Sichtprüfung mit Pixel-/Bildvergleich außerhalb des bearbeiteten Bereichs, 320/390/768/1440-px-Render, auf tatsächlichen Geräten und ohne Artefakte im Logo. Reproduzierbares Protokoll, Input/Output SHA-256.
7. Das Gerät ist **kein Platzhalter**: Keine synthetische Veränderung von Fotospiegel- oder Fotobox-Gehäuse; kein neu erdachter Fotowohnwagen, keine zusätzliche Stickerei, kein künstliches Fotopolis-Symbol.
8. Keine Freigabe, solange einzelne aktive Bildassets noch das alte Logo enthalten.

## Implementierungszustand

Dieses Register ist ein **nachgewiesener Befund und konkreter Bildkorrektur-Arbeitsauftrag, keine Bestätigung bereits retuschierter Bilder**. Die aktuell commiteten Quellbilder sind noch unverändert. Das automatisierte Studio-18.1-Release-Manifest kennzeichnet die Bildkorrektur ausdrücklich als `PENDING`.

**Release-Gate: NO-GO.** `staging`, `main`, produktive Webseite, Kundendaten und Studio-17-Prototyp bleiben unverändert.
