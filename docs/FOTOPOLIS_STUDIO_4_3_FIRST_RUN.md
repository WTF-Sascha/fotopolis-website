# FOTOPOLIS Studio 4.3 – Sichere Erstinbetriebnahme & überprüfte Datenbankrechte

**Stand:** 07.11.2026. Entwicklung ausschließlich im isolierten GitHub-Branch `design/premium-v2`, Draft-PR #2 und Netlify-Deploy-Preview. Kein Merge nach `main`, keine Änderung der Live-Website `fotopolis-mieten.de`, Mammut oder RM Inventory.

## Neue Funktionen

- **Geführte Ersteinrichtung für die Owner-Rolle** mit fünf nachprüfbaren Meilensteinen:
  1. Neon-Auth-Anmeldung und aktive Owner-Rolle bestätigt.
  2. Vier getrennte Datenbankverbindungen und die notwendigen **Spaltenberechtigungen** für Inventar, Sperrzeiten, Vormerkungen und Kalender anhand einer echten, serverseitigen Prüfung bestätigt.
  3. Mindestens ein tatsächlich gespeichertes Mietgerät aus Neon gelesen.
  4. Mindestens ein gespeichertes Mietgerät ausdrücklich aktiviert.
  5. Mindestens eine aktive interne Belegung, Wartung oder Sperrzeit im **aktuell geladenen Kalenderzeitraum** gefunden.
- **Keine künstliche Abnahme:** Ein Schritt wird nicht durch einen Klick, Session-Storage, Browser-Cache oder Demo-Sätze abgeschlossen. Erforderliche Daten kommen ausschließlich von der authentifizierten Neon-API. Gerätedaten werden nicht erfunden oder automatisch angelegt. Die Verbindungsprüfung muss jedes Mal bewusst gestartet werden und ist kein vollständiger Schreib-End-to-End-Test.
- **Automatische Statusaktualisierung:** Nach dem echten Anlegen, Aktivieren oder Speichern einer internen Belegung lädt das Dashboard die autorisierten Daten neu und aktualisiert die Schritte.
- **Kontextsensitive Weiterleitung:** Bei offenem Gerätenachweis geht es zur echten Geräteanlage, bei offener Aktivierung zur Geräteverwaltung, bei offener Terminprüfung zur internen Vormerkung. Die Systemrechte werden über eine eigene Schaltfläche getestet.
- **Sicherheitsdiagnose verbessert:** `GET /api/fotopolis/admin/health` ermittelt nun serverseitig via `has_column_privilege` die notwendigen PostgreSQL-GRANTs (einschließlich Änderungsprotokolle und `allocation_audit`). Die bisherige Verbindungsprüfung allein hätte fehlende Spaltenrechte nicht erkannt. Es werden nur die Booleschen Ergebnisse `configured`, `connected` und `permissionsReady` für Owner ausgegeben. Keine Datenbankverbindungsstrings oder SQL-Fehler an den Browser.
- **Premium-UI & Barrierefreiheit:** Marineblau-/Champagner-Design, responsive Checkliste und dynamische Statusmeldung ab 320 Pixel; geschütztes Dashboard bleibt für Viewer/Manager ohne Owner-Onboarding.

## Unveränderte Sicherheitsgrenzen

- Kein neuer Schreib-Endpunkt, keine neuen Rechte vergeben und keine DB-Migration ausgeführt.
- Bestandsanlagen, Aktivierungen, interne Vormerkungen und Sperrzeiten bleiben ausschließlich den bestehenden, bereits authentifizierten, RBAC-geschützten Serverabläufen vorbehalten.
- Eine gespeicherte Vormerkung ist **nicht** automatisch eine bestätigte Buchung.
- Die Checkliste ist eine Inbetriebnahmehilfe, **kein öffentliches Verfügbarkeitsversprechen und keine Produktionsfreigabe**.
- Der reale, personenbezogene Schreibtest sowie bestätigte physische Bestandsdaten bleiben gesonderte Abnahmekriterien.

## QA

- `scripts/test-admin-first-run.mjs` prüft Owner-only, getrennte Fortschrittsstufen, leeren und geladenen Bestand, nicht bestätigte Vormerkungen, korrekte Grant-Matrix und Fail-Closed-Diagnose.
- `scripts/premium-admin-first-run-qa.mjs` prüft UI bei fünf Breakpoints (320, 375, 430, 768 und 1440 px), Statuswechsel, die bewusst gestartete Rechteprüfung, Ausschluss von Viewern, horizontales Overflow und **null Schreibvorgänge**. Testgeräte existieren ausschließlich im Browser-Mock.
- Alle bisherigen Auth-/Neon-/Inventar-/Kalender-/Reservierungs- und Mobile-Tests bleiben im Admin-Studio-Workflow.
