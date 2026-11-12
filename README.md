# FOTOPOLIS – Premium Event Platform (Entwicklung/Staging)

**Stand:** 12.11.2026. Dieses Repository enthält die neue FOTOPOLIS-PWA und die interne Entwicklungsverwaltung. **Keine Freigabe für die bestehende Live-Domain `fotopolis-mieten.de`.**

## Aktuelle Staging-URLs

- Öffentliche Testwebsite: `https://staging--fotopolis-preview.netlify.app/`
- Teamportal: `https://staging--fotopolis-preview.netlify.app/admin/`
- Anmeldung: `https://staging--fotopolis-preview.netlify.app/admin/login/`
- Verwaltung: `https://staging--fotopolis-preview.netlify.app/admin/dashboard/`
- Geschütztes Design Studio: `https://staging--fotopolis-preview.netlify.app/admin/designstudio/`

Die derzeitige Netlify-Projektkonfiguration schützt Non-Production-Deploys mit einem Site-Passwort; Netlify-Team-SSO ist derzeit nicht als Zugriffszwang eingestellt. Die Anwendung besitzt **zusätzlich** eigene Neon-Authentifizierung und serverseitige Berechtigungen. Ein Passwort für die Vorschauseite erteilt niemals interne Verwaltungsrechte. Aktuelle Zugriffsdetails bitte in Netlify überprüfen; niemals Passwörter oder Zugangstokens in dieses Repository schreiben.

## Reale Architektur

- `staging` ist der dauerhafte Entwicklungsbranch; Änderungen zunächst in separaten Feature-Branches prüfen. Der ältere Draft-PR #20 und `main` bleiben davon getrennt.
- Statische Premium-Seiten und eine PWA werden durch Python-Buildskripte generiert. Node-/ESM-Skripte sichern Bau- und Browserregressionen ab.
- **Netlify** hostet Build/Branch-Deploys, geschützte Serverfunktionen und das Anfrageformular `fotopolis-studio9-anfrage`.
- **Neon PostgreSQL + Neon Auth** sind die bestehende DEV-Verwaltungsdatenbasis, nicht Supabase. Der Neon-Branch `development` muss explizit in isolierten DEV-Funktionen verwendet werden. Neon `production` nicht ändern.
- Neue Anfragen werden über Netlify Forms angenommen und unter derselben UUID in Neon gespiegelt. Die echte Netlify→Neon-End-to-End-Reconciliation ist **noch nicht abgenommen**.
- Geräte/Belegungen, Rollen, Administrations-Dashboard, Designs, Inhaltsverwaltung und aggregierte Metriken sind teilweise implementiert; die vollständigen geschäftlichen Prozesse sind noch **nicht freigegeben**.

## Verbindliche Design- und Datenregeln

- Der freigegebene FOTOPOLIS-Logo-Master und die aktuelle warme Premium-Gestaltung bleiben erhalten. Kein Rückfall auf historische Blau-Navigation. Aktuellen Hero ausschließlich als unverlinkte Begrüßung erhalten.
- 32 Classic- und 12 Signature-Vorlagen sind als Quellbestand vorhanden. Print-Originale dürfen nicht im öffentlichen CDN liegen; innere Vorlagennamen dürfen nicht in Druckbilder gerendert werden. Die 32 Classics benötigen weiterhin eine Einzel- und Hardwareabnahme.
- Kein Versand echter Kundenmails, keine echten Buchungen, keine Aktivierung realer Geräte und keine kostenpflichtigen Dienste ohne gesonderte Genehmigung.
- Keine produktiven Kunden-/Gerätedaten für Staging-Tests kopieren; synthetische Testdaten verwenden.

## Qualitätssicherung

Der Netlify-Build läuft über `netlify.toml`; GitHub-Foundation-QA in `.github/workflows/studio13-foundation-qa.yml`. Die Staging-Sicherheits- und UX-Checks umfassen u.a. `scripts/staging-secure-qa.mjs`, `scripts/studio15-one-app-qa.mjs`, `scripts/studio16-workspace-qa.mjs` und `scripts/hero-welcome-qa.mjs`.

Ein grüner Build belegt **keinen** erfolgreichen echten Login, Formular-Eingang, Doppelbuchungsschutz unter parallelen Nutzern oder physische Druckqualität.

**Maßgeblicher neuer Arbeitsplan:** [`docs/FOTOPOLIS_STUDIO_15_PHASE0_BENCHMARK_2026-11-12.md`](docs/FOTOPOLIS_STUDIO_15_PHASE0_BENCHMARK_2026-11-12.md). Weitere Details: [`docs/FOTOPOLIS_STAGING_BETRIEB.md`](docs/FOTOPOLIS_STAGING_BETRIEB.md).

**Release-Grenze: NO-GO für Live, kein Merge nach `main`, keine Änderung an `fotopolis-mieten.de` ohne ausdrückliche weitere Freigabe.**
