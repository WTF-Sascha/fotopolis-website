# FOTOPOLIS — Website Design 2.0 / Bild- und Komponentenmapping

**Stand:** 05.11.2026  
**Branch:** `design/premium-v2`  
**Review-Seite:** `concepts/premium-v2/index.html`  
**Status:** Konzeptentwurf, keine Produktionsfreigabe, Netlify-`main` unverändert.

## Tatsächlich integrierte Originalbilder
| Bauteil | Genutztes Altbild | Zweck | Nachfolger / Ersatz |
|---|---|---|---|
| Hero Desktop + Mobil | LEG-068 | Gäste im Fotowohnwagen, authentische Situation | Neues hochwertiges, veranstaltungsbezogenes Hero-Foto mit echter Nutzungsfreigabe |
| Fotowohnwagen Hauptfeature | LEG-014 | Wiedererkennbares Originalgerät außen | Neue hochwertige Außenaufnahme ohne störende Requisiten, gern Golden Hour/Blue Hour |
| Fotobox Bildfläche | LEG-019 | Gäste mit Fotoaccessoires | Hochwertiges Produktfoto der tatsächlichen Fotobox plus ergänzend Gäste-Interaktion |
| Hochzeits-Galerie | LEG-060 | Hochzeitspaar | Freigegebene, aktuelle Hochzeits-/Eventaufnahme |
| Event-Galerie | LEG-073 | Gruppe im Wohnwagen | Freigegebenes hochwertiges Erlebnis-/Gruppenbild |
| Mottoparty-Galerie | LEG-046 | Kostümierte Gäste | Freigegebenes Foto für Party-/Event-Variation |
| Fotospiegel Hauptfeature | Noch kein Bild | Kennzeichnung als Platzhalter, keine erfundene Hardwareaufnahme | Neues, originalgetreues Fotospiegelbild aus Parallelchat, ohne RGB und ohne falschen Goldrahmen |

Diese Bilder sind **nur für den Review-Branch** vorgesehen. Bereits öffentlich sichtbare Bilder der bisherigen Website sind nicht automatisch für eine zweite Veröffentlichung freigegeben. Die People-/Event-Releases müssen separat geprüft werden.

## Komponentensystem
1. Kleine Original-Logomarke im dunklen Header, keine Logo-Variationen.
2. Emotionaler Editorial-Hero, zwei Spalten auf Desktop; Foto noch innerhalb der ersten Mobilansicht.
3. Ruhige Service-Zeile, keine erfundenen USPs.
4. Intro und differenzierte Erlebniskarten.
5. Fotowohnwagen als charakteristisches Hauptfeature, ohne die Dachmarke darauf zu reduzieren.
6. Fotobox und Fotospiegel mit klarer Trennung zwischen vorhandener Fotografie und markiertem Ersatzbildplatz.
7. Kuratierte Bilderwelt statt unkontrollierter 73-Foto-Galerie.
8. Seriöser Kontakt-CTA als `mailto:`-Vorstufe, bis Backend und Datenschutz vollständig sind.

## Verpflichtender nächster Bildschritt
Die hochwertigen Einzelbilder aus dem parallelen Chat werden zunächst **nicht automatisch** als reale Referenzaufnahmen deklariert. Je Datei prüfen: tatsächlich generiert oder fotografiert, Gerätetreue, freigegebene Logo-Abbildung, Farbgebung, Beleuchtung, Proportionen, Dateiformat, geeigneter Zuschnitt für Desktop/Mobil, WebP-/AVIF-Export und Rechte.

## Offene Punkte
- Manrope/Inter lokal bereitstellen und testen; derzeit Fallback.
- Angebots-/Produktdetailtexte mit echten Ausstattungsmerkmalen abgleichen.
- Datensparsame sichere Anfragefunktion vor Live-Betrieb.
- Rechtliche Texte, vollständige mobile/desktop QA, PWA-Installation und Ladezeitmessungen.
- Das GitHub-Repository ist öffentlich und sollte für die Entwicklungsarbeit auf privat gestellt werden.
