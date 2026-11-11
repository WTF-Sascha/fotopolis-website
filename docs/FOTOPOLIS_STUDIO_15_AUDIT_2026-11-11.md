# FOTOPOLIS STUDIO 15.0 – Technisches Audit, Konsolidierung und Übergabe
Stand: 11.11.2026. **Nur Entwicklung; keine Freigabe für den Livebetrieb.**

## 1. Verifizierte Systeme

| System | Iststand / Nachweis |
| --- | --- |
| Source | `WTF-Sascha/fotopolis-website`, Branch `feature/studio14-consolidation-20261111`, Draft PR #20 |
| Vorschau | Netlify `fotopolis-preview`, PR #20; non-production hinter Team-SSO |
| Auth | Neon Auth, DEV-Trusted-Origin für PR #20, E-Mail/Passwort, separate aktive `fotopolis.admin_members`-Prüfung |
| DEV-Datenbank | Neon `icy-wave-78750589`, **development** `br-super-leaf-b9jj8n9p` |
| Produktivdaten | Neon `production`-Branch und `fotopolis-mieten.de` wurden für Studio 15 NICHT geändert |
| Aktuelle DEV-Bestände | 0 `inquiries`; 0 `allocations`; 3 **deaktivierte** Ressourcen; 1 administrative Mitgliedschaft; 44 Druckvorlagen im Quellbestand |
| Quelldaten | Netlify Forms `fotopolis-studio9-anfrage` mit `fp_request_key`; Submission-Count zuletzt 0 |

**Wichtige Beweisgrenze:** GitHub-CI-Prüfungen und ein fertiges Deployment beweisen keine real erfolgreiche Formularannahme, Anmeldung oder Gerätebuchung. Diese End-to-End-Tests sind separat nachzuholen.

## 2. Technisch umgesetzt – Studio 15, erste Integration

### S15-01: **Eine** installierbare FOTOPOLIS-PWA (Code)

- Kanonisches `/manifest.webmanifest`, stabile App-ID `/`, Start `/`, Scope `/` für öffentlichen Bereich und Teamverwaltung.
- Admin-Einstieg, Passwortseite, Dashboard und Druckeditor verwenden denselben Manifest-Link und den zentralen Update-Mechanismus.
- Das separate Quellmanifest `/admin/manifest.webmanifest` wurde entfernt und wird nicht mehr gebaut.
- Gemeinsame Markenicons; Root-Service-Worker um Version `v15-one-app-secure-r1` invalidiert.
- Der Worker **schließt `/admin/` und `/api/` von Cache-Interception aus**; Teamdaten, Sessions, private Druckoriginale und Verwaltungs-JSON werden nicht precached.
- Manifest-Shortcuts führen bei Bedarf zu Teamportal, Anfragen, Kalender und Design Studio. Sie erteilen keine Rechte.
- Bereits installierte Staff-PWAs mit bisherigem `id="/admin/"` verschwinden nicht automatisch vom Gerät. Vor Umstellung neue kanonische App testen, anschließend die alte Installation **manuell** entfernen.

### S15-02: Anfrage → interne Geräte-Vormerkung (Code und DEV-Migration)

- Optionale `fotopolis.allocations.inquiry_id`-Referenz per Foreign Key auf `fotopolis_studio13.inquiries(id)`, `ON DELETE RESTRICT`; bestehende Daten bleiben gültig.
- Teilindex auf `inquiry_id`, kein Kopieren personenbezogener Kundendaten in die Reservierungstabelle.
- Exakte neue Spaltenrechte nur für `fotopolis_admin_reservation_writer` (INSERT) und `fotopolis_admin_dashboard_reader` (SELECT). **Keine** zusätzlichen direkten Leserechte auf CRM-Kundendaten.
- Anfragenliste: berechtigte Owner/Manager können `Vormerkung aus Anfrage planen` wählen; der interne Planer übernimmt Anfrage-ID, Datum und, bei eindeutiger Übereinstimmung, die geeignete aktive Geräteeinheit. Zeitraum und Logistikpuffer sind ausdrücklich vom Mitarbeiter zu prüfen.
- Die Reservierungs-API speichert optional die verknüpfte Anfrage-ID; eine unbekannte ID wird durch den FK zurückgewiesen. Bestätigungen bleiben eine separate berechtigte Aktion.
- Der geschützte Kalender liefert `inquiry_id` zurück; Reservierungskarten können zur zugehörigen Anfragenliste führen.
- Bestehende `resource_time_no_overlap`-Exclusion-Constraint bleibt unangetastet und verhindert konkurrierende gespeicherte Belegungen.
- **Keine** automatischen Kundenbuchungen, echten E-Mails oder Änderungen an Geräten. Aktuell gibt es keine aktiven Geräte oder erfassten Anfragen, daher keinen positiven vollständigen Testvorgang.

**Nachvollziehbare Migration:** `database/neon/007_studio15_inquiry_booking_link_dev.sql`. Bereits **nur** auf dem expliziten Neon-DEV-Branch ausgeführt und Schema-/Berechtigungsbestand anschließend lesend überprüft. Keine Migration auf Default-/Produktionsbranch. Rollback nur kontrolliert nach eigener Freigabe, nicht durch automatisches `DROP`.

### S15-03: Technische Prüfungen

- `scripts/studio15-one-app-qa.mjs`: gemeinsames Manifest, keine zweite PWA-ID im Build, Ausschluss der privaten Cachepfade, zulässige/unzulässige Verknüpfungs-IDs, serverseitiger Fremdschlüsselvertrag, interne UI-Übergabe.
- `scripts/studio14-print-admin-qa.mjs` auf die neue gemeinsame PWA-Struktur umgestellt.
- GitHub Studio-13-Foundation-QA und Netlify-Buildcommand führen die neuen Prüfschritte aus.
- CI-Erfolg ist erst nach Auswertung des **aktuellen** Build-Commits bestätigt, nicht bereits durch das Hinzufügen der Tests.

## 3. Zielzuordnung vorhandener Module

| Zielmodul | Bestehende Komponenten | Fachliche Lücke |
| --- | --- | --- |
| Öffentliche Website | Premium-V2-Seiten, 3 Produktseiten, Kontakt, Galerie, 44 Motive | Öffentliches CMS nur eingeschränkt; vollständige Datenerfassung E2E offen |
| Anmeldung & Team | Neon Auth, JWT/JWKS, `fotopolis.admin_members`, `staff_roles` | Echte Login-/Rollentests, Nutzerverwaltung und vollständige Rechte-Matrix |
| Anfrage-Posteingang | Netlify Forms, `formSubmitted`, CRM-Mirror, `inquiries` | Reconciliation, Recovery, Benachrichtigungen, manuelle Eingänge |
| Kalender & Buchungen | `resources`, `allocations`, Konflikt-Constraint; jetzt Anfrageverknüpfung | Tagesansicht, kompletter Geschäftsstatus, E2E und Pufferfreigabe |
| Geräte | Bestandsverwaltung und interne Aktivierungsprüfung | Physischer Bestandsabgleich, Zubehör/Wartung/Zustand |
| Design Studio | Geschützter Editor, 44 private Print-Master, `design_reviews` | 32 Classics einzeln auf eingebrannte Texte prüfen; druckphysische Freigabe |
| Kunden | Anfragendatensätze und CRM-Felder | Zusammengeführte Kundenakte, Dublettenprozess, Einwilligungs-/Löschregeln |
| CMS/Medien | Vier CMS-Slots, privater Medienbestand | Vollständige Freigabe-/Versionierungs-Pipeline, Medienvarianten |
| Analytics | Aggregierte Preview-Ereignisse | Verlässliche Datenquellen, reale Conversion ohne Schätzung |
| PWA & CI | Eine kanonische App-ID, Root-Update-Mechanismus, QA | Endgeräte-Migration und reale Installations-/Update-Tests |

## 4. Nicht erledigte P0-/P1-Freigabegates

**P0**
1. **Echte Formularprobe und Recovery:** kontrollierte synthetische Netlify-Formularsendung, unveränderte UUID, genau ein CRM-Datensatz, Wiederanlauf/Dead-Letter/Abgleich. Derzeit noch nicht nachgewiesen.
2. **Echte Anmeldung:** SSO, Neon Owner/Manager/Viewer, positive/negative Modulrechte, Logout, Reset und Sessionablauf.
3. **Buchungs-E2E:** ausschließlich freigegebene synthetische DEV-Daten, aktives Testgerät, Anfrage zu Vormerkung, gleichzeitige Konfliktbuchung, Storno, wiederholte Abfrage und Audit; anschließend kontrolliertes Bereinigen.
4. **Vorlagen-Fachprüfung:** sämtliche 32 Classic-Ausgangsraster auf eingebrannte Katalognamen prüfen, qualitätsgesicherte Korrektur, ICC-/Beschnitt-/Hardwareproof für 10×15 und 5×15 cm.
5. **Betriebsfreigaben:** Datenschutz und Aufbewahrung, reale Geräte und Puffer, sichere Kommunikationskanäle und Repository-Sichtbarkeit.

**P1**
6. Vollständige CRM-Statusmaschine (Angebot erzeugt/versendet/bestätigt), Kundenstammdaten und manuelle Eingangskanäle.
7. Design Studio mit vollständiger freigegebener Versionierung, verschiedenen Fotoanordnungen, echter Druckausgabe und Produktzuordnung.
8. Mobile Navigation und Tages-/Wochen-/Monatskalender nach realer Nutzerprüfung.
9. Rollenmatrix/Einladungen, erweitertes CMS und Medienfreigaben.

**P2**: Fortgeschrittene Analytics, Attributionsqualität, Assistenzautomatisierungen, Komfort- und Performanceoptimierung.

## 5. Betrieb und Sicherheitsgrenzen

- PR #20 bleibt Draft, kein Merge nach `main`, keine Änderung an `fotopolis-mieten.de` oder dem produktiven Neon-Branch.
- Keine echten Kundenbenachrichtigungen, Buchungen, Löschungen oder kostenpflichtigen Infrastrukturentscheidungen.
- Die Mitarbeiteranmeldung ist nach Netlify-Team-SSO unter `/admin/login/` erreichbar. Ein Konto allein genügt nicht: die serverseitige aktive Mitgliedschaft ist zwingend.
- Das Root-Service-Worker-Skript wird auf Adminseiten registriert, greift aber in `/admin/`- und `/api/`-Requests nicht ein; geschützte Daten bleiben network-only.
- Keine Testdaten als tatsächliche Kundenkontakte ausgeben. Eine leere DEV-Datenbank ist kein erfolgreicher Eingangstest.

## 6. Aktuelle Freigabeempfehlung

**NO-GO für den Produktivbetrieb.** Teilimplementierung auf dem isolierten Entwicklungsbranch mit überprüfter DEV-Datenbankmigration, aber ohne echte End-to-End-Abnahme der geschäftskritischen Vorgänge. Eine Freigabe verlangt dokumentierte Positiv- und Negativtests, physische Druckmuster, Betriebs-/Datenschutzprüfung und eine separate ausdrückliche Entscheidung.
