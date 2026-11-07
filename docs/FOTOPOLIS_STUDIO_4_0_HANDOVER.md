# FOTOPOLIS Studio 4.0 – Entwicklungsübergabe

**Datum:** 07.11.2026 · **Status:** isolierte Testvorschau · **Produktiv-Website unverändert**.

## Ziel und Architektur

Die bestehende FOTOPOLIS-Premium-CI 1.0 bleibt verbindlich. Entwicklung ausschließlich auf `design/premium-v2` / Draft-PR #2, Netlify `deploy-preview-2` und Neon-Branch `development` (EU Frankfurt). Kein Merge, keine Domainänderung, keine Migration in die produktive Datenbank und keine Veränderungen an anderen Apps.

Technik: Neon Auth (signiertes JWT), serverseitige Owner-/Manager-/Viewer-Rechte, Netlify Functions als ausschließliches Schreibgateway, pro Funktion eingeschränkte PostgreSQL-Rollen. Datenbank-Zugangsdaten dürfen ausschließlich im serverseitigen Netlify-Kontext `deploy-preview` / `functions` existieren.

## Umgesetzte interne Funktionen

1. Geschützter Admin-Login mit persönlichem Passwort; Administrator und Managementrolle werden bei jedem API-Aufruf gegen Neon überprüft.
2. Gerätebestand: einzelne physische Fotoboxen, Fotospiegel und Fotowohnwagen neu anlegen. Interne Kennung eindeutig, Name validiert. Jedes Gerät wird zunächst **deaktiviert** angelegt; die Owner-Rolle kann es ausdrücklich aktivieren oder deaktivieren. Eine Statusänderung bedeutet keine öffentliche Buchungsfreigabe.
3. Interne Sperrzeiten und Wartung: Authentifizierte Besitzer/Koordinatoren können Gerätesperren für einen validierten UTC-Zeitraum speichern und wieder aufheben. Die PostgreSQL-Exclusion-Constraint verhindert Zeitüberschneidungen. Bei Konflikt HTTP 409.
4. Interne Vormerkungen: ausschließlich aktivierte Geräte, separate Veranstaltungszeiten und **explizit gewählte** Vor- und Nachlaufpuffer. Statusübergang `held -> confirmed / cancelled`. Fremde Buchungsdaten, Preis-/Zahlungsabläufe, Kunden-E-Mails und Bestätigungsmails sind nicht Teil dieses internen Systems.
5. Kalender: Monats-/Wochenansicht, Gerätefilter, Datumssprung, Tagesdetail-Dialog im sichtbaren Bereich, Aktualisierungsstatus, Anzeige echter Belegungen.
6. Änderungsprotokoll: `fotopolis.admin_activity` mit beschränktem read-only Endpoint, ohne E-Mail-/Kundendaten in der Antwort; Datenbank-Trigger protokollieren zudem jede Änderung von Belegungen.
7. Responsive Premium-Studio-Ansichten, Demo-Fallback für Viewer und geschützte Routen.

## Rollen und Berechtigungen (Neon development)

| Rolle | Zulässige Schreibvorgänge |
| --- | --- |
| `fotopolis_admin_inventory_writer` | Einzeln eingeschränkte Spalten in `resources` für INSERT, UPDATE Name und Aktivierung; INSERT Aktivitätsprotokoll |
| `fotopolis_admin_calendar_writer` | INSERT internes Block/Wartung, UPDATE nur Status `blocked -> cancelled`, zugehörige Audit-Einträge |
| `fotopolis_admin_reservation_writer` | INSERT Buchung ausschließlich als `held`, UPDATE nur Status `confirmed/cancelled`, Audit-Einträge |
| `fotopolis_admin_dashboard_reader` | SELECT definierte Ressourcen-/Kalenderfelder und begrenztes Aktionsprotokoll |
| `fotopolis_admin_auth_reader` | Ausschließlich für Berechtigungsabgleich relevante Mitgliedschaftsfelder |

Alle Schreibrollen unterliegen PostgreSQL RLS. Browser erhalten keine Datenbank-Zugangsdaten. Owner-/Manager-Prüfung erfolgt in Netlify Functions. Geräteaktivierung ist **Owner-only**. Aktivitäten sind nur für Owner/Manager abrufbar; Viewer haben keine Schreibschnittstelle.

## API-Schnittstellen

- `GET /api/fotopolis/admin/session` – Sitzung und Rolle
- `GET /api/fotopolis/admin/overview` – Geräte + Kalender (max. 45 Tage)
- `POST/PATCH /api/fotopolis/admin/inventory` – Geräteanlage, Umbenennung, Status
- `POST/PATCH /api/fotopolis/admin/blocks` – interne Sperrzeit erstellen/aufheben
- `POST/PATCH /api/fotopolis/admin/reservations` – Vormerkung erstellen/bestätigen/stornieren
- `GET /api/fotopolis/admin/activity` – letzte 50 Verwaltungsaktionen

**Wichtig:** APIs werden nur in Netlify-Deploy-Previews bereitgestellt; veröffentlichte Produktions-Deploys erhalten 404.

## Technische Testabdeckung

- PostgreSQL-Entwicklungsrollen: Spaltenrechte, RLS-Regeln und negative Berechtigungen kontrolliert.
- Inventory: echter INSERT/UPDATE/Audit-Test unter der eingeschränkten Datenbankrolle mit Savepoint und **Rollback**, ohne fiktiven Bestand zu hinterlassen.
- Calendar-/Reservation: SQL-Pläne unter ihren getrennten Writer-Rollen mit `EXPLAIN` geprüft; ein realer blockübergreifender DB-Integrationstest benötigt einen ausdrücklich erfassten Gerätebestand.
- Automatisierte Node-/Playwright-Tests: Eingabevalidierung, JWT-Gateway-Negativfälle, Zeitumstellung, Überlappung, UI-Erstellung, mobile Darstellung, lokale Demo-Nichtpersistenz, isolierte persistente UI-Callbacks. Diese Tests simulieren teilweise Session und API; sie **ersetzen keine reale End-to-End-Abnahme im Nutzerbrowser**.

## Bedienungsabnahme mit echten, vom Betreiber bestätigten Daten

1. Mit eigenem Passwort anmelden und das Dashboard öffnen.
2. Ein tatsächlich vorhandenes Mietgerät mit korrekter interner Kennung erfassen; nach Neuladen muss es weiterhin angezeigt werden.
3. Über `Bearbeiten` Namen und (als Owner) Aktivierung prüfen.
4. Eine interne Sperrzeit speichern und bestätigen, dass sie nach Neuladen sichtbar ist; dann Sperrzeit wieder aufheben.
5. Eine interne Vormerkung mit ausdrücklich eingegebenen Logistikpuffern anlegen, bestätigen und stornieren.
6. Prüfen, dass für ein überlappendes Belegungsfenster die zweite Reservierung verweigert wird.
7. Kontrollieren, dass die Aktionen im Protokoll erscheinen und mobile Dialoge im sichtbaren Fenster bleiben.

**Bis zur echten Benutzer-Abnahme keine Aussage „vollständig produktionsbereit“.**

## Offene Punkte für den späteren öffentlichen Buchungsservice

Realer Bestand und Verfügbarkeit, Logistik-/Pufferstandardwerte, Kundenanfrage und Datenschutz/Einwilligung, rechtlich geprüfte Vertragsbedingungen, Leistungen/Pakete/Preise, Zahlungs- und E-Mail-Kommunikation sowie Fehlerbehandlung in der Produktion. Keine automatische Domain-Umstellung.

## Release-Gate

Der allgemeine Premium-Release-Workflow kann bis zur fachlichen Freigabe absichtlich rot bleiben. Ein grüner isolierter Admin-QA-Lauf bedeutet nur, dass die abgeprüften technischen Fälle erfolgreich sind. `main` und die Live-Domain dürfen erst nach einer erneuten, expliziten Freigabe verändert werden.
