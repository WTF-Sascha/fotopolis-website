# FOTOPOLIS — Premium Website Design 2.0 · Visual QA

**Datum:** 05.11.2026  
**Entwicklungsbranch:** `design/premium-v2`  
**Konzeptdatei:** `concepts/premium-v2/index.html`  
**Build-/Visual-QA:** [GitHub Actions Run 42035788536](https://github.com/WTF-Sascha/fotopolis-website/actions/runs/42035788536)  
**Screenshots:** [QA-Artefakt mit Vollseitenbildern (fünf Viewports)](https://github.com/WTF-Sascha/fotopolis-website/actions/runs/42035788536/artifacts/13417908491)

## Automatisierte Browserprüfungen

**39/39 bestanden, 0 fehlgeschlagen.**

- Desktop 1440 px / Laptop 1024 px / Tablet 768 px / Mobil 375 px und 320 px.
- HTML-Seite und eingebundene Bilder laden ohne Fehler.
- Kein horizontaler Überlauf in den geprüften Viewports.
- Genau eine H1.
- Original-Logopfad unverändert: `../../site/assets/fotopolis-logo-original.png`.
- Keine JavaScript-Laufzeitfehler.
- Menü auf Tablet/Mobil öffnet und schließt; Escape-Taste funktioniert.
- Galerie-Bilder werden vor der Screenshot- und Vollständigkeitsprüfung geladen.
- Screenshots für alle fünf Größen (volle Seite und erster sichtbarer Bereich) archiviert.

## Gestalterische Selbstbewertung nach Sichtprüfung

### Verbesserung zum vorherigen Design
- Echter Fotomoment statt übergroßes Markenlogo im Hero.
- Klare Zweispalten-Komposition auf Desktop, ruhige Navigation, einheitliche CI.
- Echtes Foto bereits im sichtbaren Bereich der 375-px-Mobilansicht.
- Differenzierte Darstellung von Fotowohnwagen und Fotobox sowie eine kleine kuratierte Galerie.
- Eigenständige Bildräume und ausreichend Lesekontrast in der gesichteten Fassung.

### Noch nicht ausreichend für finale Premium-Freigabe
1. **Hero-Motiv:** authentisch, aber keine überzeugende Premium-Location/komplette Produktszene; neues Originalevent-/Studiomotiv bevorzugt.
2. **Fotowohnwagen:** LEG-014 ist als Referenz brauchbar, aber durch Umgebung und Bildqualität nicht das ideale hochklassige Hauptproduktfoto.
3. **Fotobox:** LEG-019 zeigt eine Gästeaufnahme, jedoch keine hochwertige Gesamtansicht der tatsächlichen Fotobox.
4. **Fotospiegel:** ausdrücklich als Bildplatzhalter gekennzeichnet, bis die derzeit separat entstehenden Bilder vorliegen.
5. **Markenschriften:** Manrope und Inter sind als CSS-Familien vorgesehen, aber im Konzept noch nicht lokal mit überprüften Lizenzdateien eingebunden.
6. **Bildrechte:** Nutzungsrechte/Einwilligungen für neue Website bisher nicht geprüft; die bereits auf der alten Website öffentlich vorhandenen Bilder sind **nicht automatisch** zur Zweitveröffentlichung freigegeben.
7. **Funktion:** Kontakt nur mailto-Link, keine Backend-Zustellung/Validierung.
8. **Recht/Technik:** Kein fertiges Impressum/Datenschutz auf dieser Designstudie; keine finale PWA-/WCAG-/Lighthouse-Produktionsfreigabe.

## Release-Gate
- **Technischer Konzept-QA-Status:** PASS (39/39)
- **Creative-Review-Status:** Entwicklungsentwurf; sichtbar verbessert, jedoch mangels der neuen echten Produktbilder kein final abgenommenes Premium-Design
- **Veröffentlichung:** NICHT freigegeben. Netlify-`main` bleibt unverändert.
- **Nächster Schritt:** Aktuelle Originalaufnahmen und neue Studio-Motive gegenüber dem Bildmapping prüfen, Fotografien für Homepage und Produktseiten integrieren, danach vollständige Visual- und Geräte-QA wiederholen.

## Besondere Sicherheits- und Markenvorgaben
- Keine eigenmächtige Logo-Neugenerierung oder Änderung an den O-Buchstaben.
- Corporate Identity 1.0 bleibt verbindlich.
- Bereits bestehende Domain `fotopolis-mieten.de` unangetastet.
- Das GitHub-Repository ist zum Prüfzeitpunkt öffentlich; der Review-Branch enthält ältere öffentlich zugängliche Eventfotos. Umstellung auf **Private** wird empfohlen.
