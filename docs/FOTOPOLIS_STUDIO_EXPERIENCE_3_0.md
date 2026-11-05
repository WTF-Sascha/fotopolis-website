# FOTOPOLIS Studio Experience 3.0 — Premium UI/UX Refinement

**Scope:** complete refinement of the existing preview (all 12 routes), not a new product, booking backend or live website.

**Implementation isolation:** `design/premium-v2` · draft PR #2 · Netlify deploy-preview only. No merge, no publication, no changes to original logo or approved product image bytes.

## Ausgangsanalyse
Die Website 2.9 besaß bereits ein konsistentes Farbsystem und eine funktionierende Hauptnavigation. In der visuellen Screenshot-Analyse wurden aber folgende UX-Schwächen festgestellt:

- **Zu lange Einstiegstrecke:** Homepage ca. 6.932 px bei Desktop 1440 px und ca. 9.329 px bei 320 px Viewportbreite – emotionale Statements wurden in mehreren aufeinanderfolgenden Sektionen wiederholt.
- **Zu wenig Entscheidungshilfe:** Produkte und Anlässe waren zwar beschrieben, aber es fehlte eine unmittelbare, interaktive Orientierung.
- **Unnötiger Klick:** Der sekundäre Hero-CTA führte erst zum unteren Startseitenabschnitt und nicht direkt zur Anfrage.
- **Kontaktseite:** Bei 320 px ca. 5.989 px Seitenhöhe; alle Eingabeblöcke erschienen gleichzeitig.
- **Unterseiten:** Nach umfangreichen redaktionellen Bereichen folgten weitere offene Textsektionen, was das Informationsgewicht unnötig erhöhte.

## Leitidee 3.0
**Weniger suchen, schneller entscheiden, persönlich anfragen.** FOTOPOLIS bleibt in Marineblau, Champagnergold und hellen Sandtönen. Keine Änderung an freigegebenen Bild-/Markenassets.

## Umgesetzte UX-Verbesserungen

### 1. Simplified Editorial Home
- Emotionale Dachbotschaft im fotografiefreien Hero auf **„Für Momente, die bleiben.“** verdichtet.
- Wiederholte Intro-/Interlude-Abschnitte entfernt, um die Produktwahl früher sichtbar zu machen.
- Drei unveränderte Bildwelten bleiben zentrales emotionales Element.
- Direkter Hero-Kontakt-CTA statt Umweg über den unteren Seitenabschluss.

### 2. Studio-Erlebnisberater
- Vier nutzerzentrierte Anlässe per Tastatur und Touch auswählbar.
- Sofort sichtbare Produktempfehlung als **redaktionelle Orientierung**, keine algorithmische oder verbindliche Buchung.
- Direkte Produktdetail-/Kontakt-CTAs mit datensparsam vorausgefülltem Produkt- und Anlasskontext.
- `aria-pressed`, `aria-live` und klare Alternativen.

### 3. Navigation und mobile User Experience
- Einheitlicher Studio-Layer in `studio-polish.css`: präzisere Typohierarchie, reduzierte Flächen, ruhigere Abstände, klare Fokuszustände, zurückhaltende Interaktion.
- Mobile Menüfläche mit Überlagerungszustand und Escape-/Tastaturnavigation.
- Kontextabhängiger mobiler Anfrage-Shortcut (auf Kontaktseite und bei geöffnetem Menü ausgeblendet).
- `aria-current=page` für aktuelle Navigationsroute.

### 4. Unterseiten mit klarer Orientierung
- Page-Sprungnavigation für Produkte, Pakete, Galerie, Anlässe, Über uns und Kontakt.
- Wiederholende Hintergrundinfos als barrierearme `<details>`-Elemente statt durchgehend offenen Fließtexts.
- Kompaktere, konsistente Header- und Abschnittsraster auf sämtlichen Routen.
- Angepasste FAQ als deutlich getrennte, keyboard-fähige Aufklappkarten.

### 5. Kontakt als progressiver Prozess
- Drei angeleitete Schritte: **Event → Kontakt → Wünsche**.
- Sichtbarer Fortschritt, Weiter/Zurück, Pflichtfeldvalidierung pro Schritt und Erhalt aller Angaben.
- Am Ende vollständige Live-Zusammenfassung und explizit auslösbarer E-Mail-Entwurf.
- Nur browserlokale Verarbeitung; kein Tracking, Backend, Versand und keine Terminreservierung.

## Technische Umsetzung
- `concepts/premium-v2/index.html` — klarere Startseite, Produktführung, mobiler CTA.
- `concepts/premium-v2/studio-polish.css` — Studio-Designsystem ohne Änderungen der Marken-CI-Farbtokens oder Bildquellen.
- `concepts/premium-v2/studio-guide.js` — redaktionell deterministischer Erlebnisberater.
- `concepts/premium-v2/site.js` — fokussierbare Navigationszustände.
- `concepts/premium-v2/contact-flow.js` — schrittweiser Anfrageprozess.
- `scripts/build_premium_pages.py` — systematische Unterseiten, Kontext-Links, komprimierte Detaildisclosures.
- `scripts/build-premium-preview.py` — Studio-CSS und JS isoliert in den Preview-Build kopieren.
- `scripts/premium-studio3-qa.mjs` — acht Viewports, komplette Nutzerwege, Screenshots.
- `.github/workflows/premium-concept-qa.yml` — neuer QA-Block **zusätzlich** zu sämtlichen bisherigen Regressionstests.

## Unverrückbare Anforderungen
- Das zuvor freigegebene runde Logo, die Corporate Identity 1.0 und sämtliche bestehenden Produktvisualisierungen bleiben unverändert.
- Keine künstlichen Kundenbewertungen, keine erfundenen Pakete/Preise, keine garantierten Terminverfügbarkeiten.
- Die alten Eventfotos bleiben als noch nicht live-freigegeben gekennzeichnet.
- Keine Änderungen an `main`, `site/`, der bestehenden Domain oder Supabase-Produktivdaten.
- Freigabe ist erst nach automatischer QA, visueller Sichtprüfung und separater rechtlicher/geschäftlicher Abnahme möglich.

## Abnahme
- Die automatisierten QA-Läufe sind vor Abschluss des aktuellen Commits auszuführen. **Keine Behauptung „abgenommen“, wenn noch Fehler offen sind.**
- Insbesondere Mobile 320/375/430, Tablet 768 und Desktop 1440/1920 px müssen vollständig getestet werden.
- Screenshot-Vorher-Nachher-Vergleich anhand bestehender 2.9- und neuer 3.0-Artifakte, nicht nur per automatischem HTML-Test.
- Der Gesamtumfang der zehnteiligen Website-Roadmap bleibt separat offen: Kalenderbackend, Admin-Kalender, echte Buchungen und Produktivfreigaben sind nicht Gegenstand dieser reinen UX-Studioversion.
