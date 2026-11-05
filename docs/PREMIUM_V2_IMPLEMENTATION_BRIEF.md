# Premium V2 — Designbrief & Abnahmekriterien

**Arbeitsbranch:** `design/premium-v2` — **nicht** der Netlify-`main`-Stand.

## Überarbeitung der Startseite
1. Hero: realer Eventmoment (nicht dominierendes Markenlogo), gut lesbare kurz gehaltene Botschaft, eindeutiger CTA.
2. Emotionaler Editorial-Abschnitt mit authentischer Fotografie und konsequentem Weißraum statt redundanter Designelemente.
3. Produkt-Story: Fotowohnwagen, Fotospiegel und Fotobox mit **echten Gerätefotos**, klaren Unterschieden und Orientierung.
4. Foto-/Print-Detailbereich: Beispiele echter Ausdrucke und Individualisierungen nach Verifikation.
5. Galerie: nur nach geklärten Rechten und Belegen.
6. Vertrauen/Team: reale FOTOPOLIS-Menschen und nachvollziehbare Informationen, keine fiktiven Testimonials.
7. Kontakt: datenschutzgerechter, zuverlässig versendender Anfrageprozess; `mailto:` bleibt vorläufig als gekennzeichnete Übergangslösung.

## Vorgaben
- Runde Logo-Master-Datei, O-Buchstaben, Farbgebung, Claim und Corporate Identity 1.0 **nicht verändern**.
- Keine neue Live-Domain, kein Zugriff auf andere Projekte, kein kostenpflichtiger Dienst ohne Genehmigung.
- Keine Veröffentlichung im `main`-Branch, bevor visuelle QA und Freigabe erfolgt sind.
- Bildmaterial nur nach dokumentierter Freigabe. Keine vorgetäuschten Referenzbilder.
- Bilder AVIF/WebP und `srcset`; LCP-Priorität für erstes Hero; Rest lazy.
- Desktop/Tablet/Mobile: echte Screenshots der rendernden Seite bei 320/375/768/1440 px mit visueller Prüfung.
- Auslieferung als installierbare PWA; Kontrast-/Tastatur-/Offline-Checks; Nutzerfreigabe.

## Zu liefernde Produktionsinformationen
- Originaldateien und Rechte für die im `site/assets/photo-intake-manifest.json` benannten Motive.
- Aktuelle Produktdaten zu Fotobox, Fotospiegel und Fotowohnwagen.
- Preis- bzw. Angebotslogik, Liefer-/Aufstellgebiet, Betreuungsleistung, Reinigungs-/Ausdruckoptionen.
- Aktuelle Kontakt- und Rechtsangaben; Einwilligungen für erkennbare Personen.

## Quality Gate
**P0:** fehlende authentische Hero- und Produktfotografie blockiert Premium-Freigabe.
**P0:** Screenshot-Review oder mobiles Overflow-Prüfergebnis fehlt/blockiert Freigabe.
**P0:** Veraltete/unverifizierte Produktversprechen bzw. ungeklärte Rechte blockieren Produktivsetzung.
**P1:** Leistungs-/Anfrageprozess ist ein separates funktionales Arbeitspaket.

## QA-Baseline
Browser-QA vom 05.11.2026 (GitHub Actions Run 42019930439): **119 Prüfungen erfolgreich**, darunter 10 Seiten und die Darstellung in mehreren Viewports. Ein zuvor identifizierter Overflow auf der mobilen Kontaktseite wurde korrigiert.

Dies ist **keine** Freigabe der gestalterischen Premium-Qualität. Die Screenshots belegen vielmehr, dass das derzeitige Layout weiterhin zu text- und logolastig ist.
