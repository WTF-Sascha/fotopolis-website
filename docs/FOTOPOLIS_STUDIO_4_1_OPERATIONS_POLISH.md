# FOTOPOLIS Studio 4.1 – Admin-Operations-Polish

**Datum:** 07.11.2026 · **Ziel:** Den bestehenden, geschützten internen Studio-4.0-Arbeitsbereich im Alltag schneller und robuster machen – ohne öffentliche Buchbarkeit und ohne ungeprüften Inventarimport.

## Neu im Entwicklungsbranch `design/premium-v2`

- **Schnelle Geräteverwaltung:** Suche nach Name, interner Gerätekennung oder Produktart. Zusätzlich Filter nach Fotobox/Fotospiegel/Fotowohnwagen und Aktiv/Deaktiviert. Die Filter verändern niemals Bestandsdaten. Bei einem leeren Filterergebnis gibt es eine eindeutige Rückmeldung. Die angezeigte Anzahl referenziert stets den tatsächlichen, geschützten Neon-Bestand.
- **Betriebsübersicht:** Die sechs frühesten Belegungen aus dem **aktuell geladenen** Kalenderbereich mit Gerät, Belegungsart, Veranstaltungszeiten und belegtem Zeitfenster inklusive Logistik. Stornierte Belegungen und Einträge ohne verknüpftes Gerät werden nicht angezeigt. Ohne erfolgreichen Datenabruf erfolgt keine vermeintliche Verfügbarkeitszusage.
- **Schneller zum Eintrag:** Die Einsatzübersicht kann einen Kalendertag öffnen. Im Tagesdetail-Dialog kann ein Owner/Manager sofort eine **interne** Vormerkung für den ausgewählten Tag vorbereiten. Das Datum ist vorausgewählt, die beiden Logistikpuffer bleiben ausdrücklich leer, bis die verantwortliche Person sie einträgt.
- **Mobile Studio-Qualität:** Filter, Einsatzkarten und Tagesaktionen sind für Smartphone-Breiten ab 320 Pixel gestaltet und bleiben tastaturbedienbar. Kein neues Logo oder eigenständiges Designsystem.
- **Sicherheitsgrenzen:** Admin-JWT/Neon-RBAC, getrennte Write-Rollen und serverseitige Überschneidungskontrolle bleiben unverändert. Studio 4.1 ergänzt **ausschließlich** lesende Ansichten und eine kürzere Bedienroute zur schon vorhandenen, autorisierten internen Vormerkung.

## Qualitätssicherung

- `scripts/test-admin-operations-insights.mjs`: Auswahl, Suche, Sortierung, getrennte Status-/Produktfilter, Stornierungen, Referenzen, Limit und Zeitbereichsfilter.
- `scripts/premium-admin-operations-qa.mjs`: Mock-Login, tatsächliches DOM-Rendering der gerenderten Testvorschau, 320/375/430/768/1440 px, aktive Filter, Tagesdetail und direkter Sprung zur Vormerkung, explizit leere Pufferfelder, null Admin-Schreibaufrufe. Alle FOTOPOLIS-Beispielgeräte existieren ausschließlich in den Mock-HTTP-Antworten der CI und werden **nicht** in Neon angelegt.
- Die bisherigen Admin-Studio-4.0-Regressionstests bleiben bestehen.

## Unverändert offen

Für die endgültige Produktionsfreigabe fehlen weiterhin der echte Benutzer-End-to-End-Test mit einem tatsächlich vorhandenen Mietgerät, bestätigte Gerätekennungen und Pufferregeln, Datenschutz-/Kundenbuchungsabläufe und die separate Freigabe zur Live-Veröffentlichung.

**Keine Änderung an `main`, `fotopolis-mieten.de`, Mammut oder RM Inventory; PR #2 bleibt DRAFT.**
