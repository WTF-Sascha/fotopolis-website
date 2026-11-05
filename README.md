# FOTOPOLIS · Website Design 1.0 / PWA

Status: **isolierte, öffentlich erreichbare Netlify-Entwicklungsvorschau**. Keine Freigabe für die bestehende Domain.

## Produktionsgrenzen
- **Das freigegebene FOTOPOLIS-Logo bleibt unverändert**. Einzige Markenbildquelle: `site/assets/fotopolis-logo-original.png` mit den vorhandenen PWA-Icons.
- **Corporate Identity 1.0 verbindlich**: Navy `#071B30`, Blue `#123B5C`, Champagne `#D7B77A`, Warm Ivory `#F8F2E6`; Begleitschriften Manrope/Inter mit datenschutzfreundlichen System-Fallbacks.
- Bisherige Website **fotopolis-mieten.de** wurde nicht verändert. Das neue Projekt ist auf `https://fotopolis-preview.netlify.app` begrenzt.
- Keine erfundenen Preise, Bewertungen oder Referenzfotos. Grafische Produktzeichnungen sind abstrakte Illustrationen, keine Produktfotos.
- Die Kontakt-E-Mail `kontakt@fotopolis-mieten.de` stammt aus dem bisherigen öffentlichen Webauftritt und ist vor dem Livegang erneut zu bestätigen.

## Umgesetzter Designumfang
- Neue Premium-Startseite mit Storytelling, Produktvergleich, Anlass-Auswahl, FAQ, Prozess und CTA.
- Angepasste Produktseiten: Fotobox, Fotospiegel, Fotowohnwagen.
- Weitere Seiten: Anlässe, Leistungen, Über uns, FAQ, Kontakt, Rechtliches.
- Mobile Navigation (Tastatur/Escape/ARIA), responsives Layout, Reduced-Motion-Unterstützung, lesbare Kontrastgestaltung.
- Kontaktformular erzeugt **nur eine lokale mailto-Vorlage**. Daten werden weder an Netlify noch an Supabase gesendet; die Nachricht wird erst durch manuelles Absenden im E-Mail-Programm verschickt.
- Service Worker mit offline verfügbaren Informationsseiten. App-Manifest und originale PWA-Icons bleiben erhalten.

## Verwendete Architektur
- Statische HTML-/CSS-/JS-Seiten ohne Analytics, eingebundene Trackingdienste oder JS-CDN.
- Netlify `publish = "site"`; Konfiguration in `netlify.toml`.
- GitHub `main` löst nach Commit ein Netlify-Preview-Deployment aus.
- Supabase ist **nicht angebunden**. Der Free-Projektplatz ist derzeit nicht verfügbar.

## Qualität, die noch aussteht
- Echte Eventbilder mit schriftlich geklärten Nutzungsrechten, Produktdetaildaten, aktuelle Paketpreise und authentische Referenzen.
- Vollständige, fachlich geprüfte Impressums- und Datenschutzseiten.
- Technisch abgesichertes Backend für echte Anfragen und späteres CMS.
- Browser-/Gerätetests auf iOS, Android und Desktop, Lighthouse-/WCAG-2.2-AA-Audit, PWA-Installationsprüfung.
- Für das Repo ist privat vorgesehen; aktueller Stand kann öffentlich sein. Netlify-Preview ist ohne Passwort zugänglich: keine geheimen Daten hochladen.

## Review-Checkliste
1. Desktop und Mobil öffnen: `https://fotopolis-preview.netlify.app`
2. Original-Logo, Navigation und alle Produktseiten vergleichen.
3. Anlass-Auswahl und Kontaktentwurf testen (kein automatischer Versand).
4. Menü am Smartphone und Tastaturnavigation prüfen.
5. PWA installieren und Informationsseiten offline erneut öffnen.
6. Inhaltliche Freigabe einholen. **Keine Live-Domain ohne gesonderte Freigabe.**
