# FOTOPOLIS – Studio 3.6: Persönlicher Adminbereich und Passwortanmeldung

**Stand:** 06.11.2026. Entwicklung ausschließlich im GitHub-Branch `design/premium-v2`, der isolierten Netlify-Deploy-Preview sowie dem Neon-Projekt `Fotopolis` / Branch `development` (Frankfurt). Kein Merge, kein Livegang, keine Änderungen an Mammut oder RM-Inventory.

## Umgesetzte Nutzerfunktionen

### Persönliche Anmeldung

- **[`/admin/login/`](https://deploy-preview-2--fotopolis-preview.netlify.app/admin/login/)**: Passwortanmeldung als Standard, mit alternativer Einmalcode-Anmeldung.
- Selbstständiges **erstes Passwort festlegen oder zurücksetzen** unter `/admin/login/?mode=reset`. Einmaliger Sicherheitscode im registrierten Postfach, neues Passwort mit 12–128 Zeichen und Bestätigung. Das Passwort wird nicht an ChatGPT übergeben oder in GitHub gespeichert. Die App übermittelt die Angaben an Neon Auth über HTTPS; öffentliche Registrierung bleibt deaktiviert.
- Neon Auth E-Mail-OTP-Reset-API `forgetPassword.emailOtp` → `emailOtp.resetPassword` folgt der [offiziellen Neon-Dokumentation](https://neon.com/docs/auth/guides/plugins/email-otp#reset-password-with-otp). Diese Funktion bedarf **eines echten Benutzer-End-to-End-Tests**. SDK-Versionen hatten historisch abweichende Reset-Endpunkte; ein Browser-Vertragstest gehört zum Release-Gate.
- Nach erfolgreichem Passwort- oder OTP-Login wird per Neon-JWT + FOTOPOLIS-Backendmitgliedschaft geprüft und bei Freigabe auf das Dashboard weitergeleitet.
- Konto kann sich wieder abmelden. Bei Passwort-Reset ist Sitzungswiderruf in Neon konfiguriert.

### Geschütztes Dashboard

- **[`/admin/dashboard/`](https://deploy-preview-2--fotopolis-preview.netlify.app/admin/dashboard/)**. Ohne verifizierte Sitzung + aktivierte Server-Rolle wird die App **nicht** angezeigt; bei fehlender Sitzung Weiterleitung zum Login.
- Professionelle Premium-CI-1.0-Oberfläche: Dashboard-Übersicht, Monats- und Wochenkalender, Produktfilter, Tagesdetails, Gerätebestand, Kontodaten, Link zum Passwortwechsel und Abmelden.
- Die Kalender-/Gerätedaten kommen ausschließlich aus einer **geschützten read-only Netlify-Funktion**, nicht aus erfundenen Demo-Datensätzen. Da noch keine echten Mietgeräte eingetragen sind, zeigen Ressourcen und Belegungen derzeit den tatsächlichen leeren Entwicklungsstand.
- Die ursprüngliche, unabhängig erreichbare `/admin/`-Kalender-Demo bleibt **ausdrücklich als Demo gekennzeichnet**, persistiert keine Daten und verlinkt nun auf den echten geschützten Bereich.

## Sicherheit / Rechte

- Der erste FOTOPOLIS-Setup-User ist von Neon Auth inzwischen **technisch als E-Mail-verifiziert** bestätigt. Die Anwendungsmitgliedschaft `fotopolis.admin_members` wurde **nur im development-Branch** nach dem verifizierten E-Mail-Nachweis von `enabled=false` auf `enabled=true` gestellt. Die Rolle ist `owner`.
- Das vom Benutzer angelegte Konto besitzt einen bestehenden `credential`-Eintrag, aber bei Erstellung noch **kein Passwort**; daher ist die Ersteinrichtung per E-Mail-Code vorgesehen.
- `GET /api/fotopolis/admin/session`: prüft Netlify-`deploy-preview`-Kontext, Methode, Request-Origin, Ed25519-JWT über Neon-JWKS mit Issuer/Audience, dann aktive Mitgliedschaft/Owner-Rolle. 401/403/404 bei fehlenden Berechtigungen.
- `GET /api/fotopolis/admin/overview?from=YYYY-MM-DD&to=YYYY-MM-DD`: **erneut** vollständige Serverseiten-Authentifizierung; akzeptiert nur validierte Daten und maximal 45 Tage; liefert Ressourcen und Termine aus der Datenbank mit Obergrenzen 100 Geräte / 200 Belegungen; alle Antworten `no-store`. Keine Mutationsendpunkte für Kundenbuchungen oder Sperrzeiten.
- Getrennte Neon-Datenbankkonten: `fotopolis_admin_auth_reader` liest nur 3 Mitgliedschaftsfelder; `fotopolis_admin_dashboard_reader` liest ausschließlich benannte Felder der Tabellen `resources` und `allocations`. Kein Zugriff auf Mitglieder, Audit, Neon Auth, Änderungen oder andere Anwendungen; in Neon erfolgreich über Rechteverweigerung geprüft.
- Beide Verbindungs-URIs ausschließlich als **geheime Netlify Functions-Variablen im Kontext `deploy-preview`**. Keine Secrets in GitHub, im Browserbundle oder im öffentlichen HTML. CSP begrenzt Auth-Verbindungen auf den exakten Neon-Host.
- Neon Auth hat weiterhin geschlossene Registrierung, E-Mail-Verifizierung und Sessions-Widerruf bei Reset.

## Tests, Abnahmegrenzen

- Zuvor: **180 Kalender-Demo-Checks**, **75 Passwort-Login-UI-Checks** über 5 Breakpoints, **6 isolierte Auth-/API-Abweisungstests**, ohne echte E-Mails und ohne Datenbankmutationen.
- Ergänzt: `scripts/premium-admin-dashboard-qa.mjs` prüft in Browsern 320–1440px, dass ein nicht authentifizierter Besucher **kein Dashboard zu sehen bekommt**.
- Ergänzt: `scripts/premium-admin-password-flow-qa.mjs` prüft Passwort-Setup mit synthetischen OTPs und einem simulierten Auth-Service. Der echte E-Mail-Durchlauf steht noch aus.
- Die bisherige FOTOPOLIS-Studio-Regression bleibt bestehen.
- **Wichtig:** Ein isolierter Unit- oder gemockter Browser-Test beweist noch keinen vollständig funktionierenden Reset in Neon. Eine echte Passwortvergabe, anschließend erfolgreiche Passwortanmeldung, Browser-Neuladen, Logout und erneutes Login müssen am Postfach durch den Benutzer getestet werden.

## Weiter offen

1. Echten Passwort-Code im Proton-Postfach anfordern und **ausschließlich in der Website** eingeben. Passwort selbst festlegen, ohne es ChatGPT zu übermitteln.
2. Zugang zum persönlichen Dashboard mit echtem Passwort prüfen (inklusive erneuter Anmeldung nach Abmelden/Reload).
3. Reale Anzahl und Kennzeichnungen einzelner Fotoboxen, Fotospiegel und Fotowohnwagen sowie Einsatz-/Aufbau-/Abbaupuffer bestätigen.
4. Erst danach: echte Admin-CRUD-Endpunkte für Ressourcen und Sperrzeiten unter rollenbasierter Prüfung, anschließend externe Buchungen.
5. Vor Produktivbetrieb rechtliche, Sicherheits- und Backup-Abnahme sowie angemessene Mehrfaktorauthentifizierung und ein endgültiges geschäftliches Administratorkonto.

**Roadmap 7:** Zugang und authentifizierte Lesemaske umgesetzt; konkrete Bearbeitungsfunktionen und E2E-Bestätigung bleiben offen. Kein vorzeitiger Abschluss.
