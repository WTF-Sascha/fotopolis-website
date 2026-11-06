# FOTOPOLIS – Roadmap 7 · Premium Admin Studio 3.3

**Stand:** 06.11.2026. **Nur Entwicklungsvorschau** im Branch `design/premium-v2`, GitHub Draft-PR #2 und Netlify Deploy Preview. Keine Live-Veröffentlichung, keine kundenbezogenen Daten, keine echten Termine.

## 1. Umgesetzte Admin-Oberfläche

Direkter Aufruf in der isolierten Preview: **[/admin/](https://deploy-preview-2--fotopolis-preview.netlify.app/admin/)**.

- Eigenständige hochwertige Verwaltungsoberfläche auf Basis der verbindlichen FOTOPOLIS CI 1.0: Marineblau, Champagnergold, warme neutrale Hintergründe; freigegebenes Logo unverändert.
- Responsive Monats- und Wochenansicht inklusive Heute/Zurück/Vorwärts-Navigation; Kalenderfilter nach Fotobox, Fotospiegel und Fotowohnwagen.
- Tagesdetails, auswählbare Kalendertage und Arbeitsbereich Geräteübersicht.
- Dialog zum Erstellen/Entfernen einer **ausdrücklich als Demo gekennzeichneten Sperrzeit**. Änderungen bleiben **ausschließlich im Arbeitsspeicher der geöffneten Seite** und verschwinden beim Neuladen.
- Neue Route erhält `noindex,nofollow,noarchive`. Keine falschen Aussagen zu freien Terminen, realen Geräteanzahlen, Kundenbuchungen, Berechtigungen oder gesicherten Backendfunktionen.
- Keine Verbindung zwischen dieser öffentlichen Demo-Seite und Neon. **Keine** Credentials, SQL-Dateien, Session-Tokens, Anmeldung oder Kundendaten im Browser. Keine externen Schrift-CDNs.

## 2. Neon-Backend: private RBAC-Struktur

Nur Neon-Projekt `icy-wave-78750589`, Branch `development` (`br-super-leaf-b9jj8n9p`), Datenbank `neondb`; der Neon-Default-Branch `production` bleibt unverändert.

- Die bereits geprüften Tabellen `fotopolis.resources`, `fotopolis.allocations` und `fotopolis.allocation_audit` bleiben unverändert; vorhandener Exclusion-Constraint verhindert gleichzeitige Doppelbelegungen derselben physischen Ressource.
- `database/neon/002_admin_role_foundation.sql` wurde im Development-Branch ausgeführt: `admin_members` (Benutzerzuordnung via Neon Auth UUID, `owner/manager/viewer`, anfänglich deaktiviert) und `admin_activity` (separater Audit für spätere Verwaltungsaktionen).
- RLS auf **allen fünf** `fotopolis`-Tabellen aktiviert, keine öffentlichen Grants. Datenbankprüfung: **0 Administratoren, 0 Geräte, 0 Buchungen, 0 Aktionen**.
- Neon Managed Better Auth existiert im Development-Branch. Öffentliche Registrierungen wurden deaktiviert; E-Mail-Verifizierung ist erforderlich, Passwort-Reset widerruft bestehende Sitzungen. Es wurden **keine** Admin-Accounts erzeugt und **keine** privaten Zugangsdaten gespeichert.
- Admin-Autorisierung erfolgt später auf Serverseite, nicht durch bloße Benutzeranmeldung, Browser-Flags oder Rollenangaben aus ungesicherten JWT-Metadaten.

## 3. Browser-QA

Neuer Test: `scripts/premium-admin-qa.mjs` (GitHub Actions: `premium-concept-qa.yml`). Prüft die echte statische Vorschau über sieben Bildschirmbreiten von 320 bis 1920 Pixeln:

- Monat/Woche, Datumssprung, Produktfilter und fokussierbare Kalendertage;
- Dialog öffnen, Eingabe prüfen, Demo-Sperre erzeugen, Tagesdetail aktualisieren und Eintrag entfernen;
- nach Neuladen **0** gespeicherte Demo-Sperren;
- mobile Navigation und horizontalen Seitenüberlauf;
- keine Browser-JavaScript-Fehler, kein automatischer Backend-Aufruf und keine Datenbankgeheimnisse in HTML/JS.

Der bereits bestehende 3.1-Website-Testkatalog läuft unverändert als Regression mit.

## 4. Sicherheit und reale Funktionsgrenzen

Diese öffentlich erreichbare Preview ist **kein geschütztes Admin-Portal**: Sie ist eine bedienbare, künstlich befüllbare UI-Demo ohne persistente Daten. Der User darf diese Route nicht mit einer produktiven Verwaltungsfunktion verwechseln.

Vor realer Buchungs- und Sperrverwaltung sind zwingend erforderlich:

1. Verifizierte Admin-Identität: Neon Auth-Login mit explizitem Freigabeprozess und eindeutiger ID; Registrierung bleibt geschlossen.
2. Geschützte Server-API: alle Operationen mit **serverseitiger** Prüfung des Benutzers, der Mitgliedschaft, Aktivierung und Adminrolle. Keine Datenbank-URL oder API-Keys im Browser und kein direktes Schreibrecht aus der öffentlichen Website.
3. Rollenspezifische Grenzen: `viewer` nur lesen, `manager` Geräte und Sperren bearbeiten, `owner` Administratoren freigeben. Rollenwechsel auditieren.
4. DB-Anbindung nur mit Branch-`development`-gebundenem, minimal privilegiertem Zugang in Netlify Functions Secrets; keine CORS-Freigabe und keine ungeschützten SQL-RPCs.
5. Verbindliche Angaben zu **realen Geräten**, Buchungspuffern, Wartefristen und Stornoregeln.
6. Sicherheitstests für fehlende/ungültige Auth, falsche Rollen, parallele Writes, Spam, CSRF/Origin und Audit-Integrität.

Keine Änderung an `main`, `fotopolis-mieten.de`, freigegebenem Logo und Originalfotos. Keine Änderung der Supabase-Projekte Mammut oder RM-Inventory. Keine kostenpflichtige Neon-Zusatzfunktion.

## 5. Abnahmestatus

**Admin-Studio-Visualisierung:** implementiert, aber rein lokal simulierend; Browser-QA ist getrennt nachzuweisen.

**Datenbank-Autorisierung:** private Tabellenstruktur und Grundrollenmodell angelegt; tatsächliche Admin-Authentifizierung und Live-Verwaltungsfunktionen stehen noch aus.

**Roadmap-Punkt 7:** **teilweise umgesetzt**, **nicht vollständig abgeschlossen**. Kein Übergang zu echten Online-Buchungen (Punkt 8) ohne Berechtigungs- und Backendabnahme.

[GitHub Draft PR #2](https://github.com/WTF-Sascha/fotopolis-website/pull/2) · [Kalender-Demo](https://deploy-preview-2--fotopolis-preview.netlify.app/admin/)
