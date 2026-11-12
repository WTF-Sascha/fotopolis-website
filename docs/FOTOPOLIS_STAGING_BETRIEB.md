# FOTOPOLIS – dauerhafte Staging-Umgebung

Stand: 12.11.2026. **Nur Entwicklung, kein produktiver Livegang.**

## Feste URLs

- Neue, dauerhafte Staging-Adresse: `https://staging--fotopolis-preview.netlify.app/`
- Interne Anmeldung: `https://staging--fotopolis-preview.netlify.app/admin/login/`
- Interne Verwaltung: `https://staging--fotopolis-preview.netlify.app/admin/dashboard/`
- GitHub-Quellbranch: `WTF-Sascha/fotopolis-website` → `staging`
- Vorherige PR-Testvorschau (bleibt unabhängig): `https://deploy-preview-20--fotopolis-preview.netlify.app/`

## Freischaltung der Netlify-Branch-Deploy-Veröffentlichung

Netlify erzeugt Branch Deploys **nicht automatisch**, solange sie nicht in den Seiteneinstellungen aktiviert sind. Im Netlify-Projekt `fotopolis-preview` als Developer/Owner:

1. `https://app.netlify.com/projects/fotopolis-preview` öffnen.
2. `Project configuration → Developer settings → Continuous deployment → Branches and deploy contexts → Configure` öffnen.
3. Bei **Branch deploys** die Option **Let me add individual branches** auswählen, nur `staging` eintragen und **Save** auswählen. *Nicht* Production branch auf `staging` setzen und *nicht* `All` für alle Branches auswählen.
4. Anschließend den Buildstatus prüfen. Gegebenenfalls einen erneuten Branch-Deploy-Trigger durch Commit auf `staging` auslösen. Erst nach einem **Ready**-Deploy die URL als funktionierend betrachten.
5. **Non-production SSO** aktiv belassen. Die Geschäfts- und Administrator-APIs müssen weiterhin JWT und Rolle prüfen.

## Bereits auf dem staging-Branch vorbereitet

- Das sichere Management-Dashboard und die kompakte Dropdown-Navigation sind aus dem Studio-15/16-Stand übernommen.
- `netlify/functions/fotopolis-admin-session.mjs` erlaubt die exakte Staging-Domain **nur** bei Netlify-Kontext `branch-deploy`. Die Produktion, andere Branch-Hosts und Cross-Origin-Anfragen bleiben gesperrt. Rollenprüfung auf der Serverseite bleibt Pflicht.
- Neon-Auth im **development** Branch erlaubt die exakte Staging-Origin als Trusted Domain. Selbstregistrierung bleibt deaktiviert.
- Sechs **separate Netlify-Variablen** mit Präfix `FOTOPOLIS_STAGING_` sind als **Secret**, **Functions Scope**, **branch-deploy Context** konfiguriert und auf dedizierte Least-Privilege-PostgreSQL-Rollen der *development*-Datenbank bezogen. Die unveränderten `FOTOPOLIS_NEON_DEV_*`-Variablen bleiben auf `deploy-preview` beschränkt.
- `netlify.toml` führt den gesicherten Build inkl. Vertrags- und Sicherheitschecks in `branch-deploy` aus.
- Pushes auf `staging` triggern GitHub Foundation QA; Netlify Branch Deploys werden nach Aktivierung automatisch mit neuen Staging-Commits aktualisiert.
- Kein Merge in `main`, keine Änderung an `fotopolis-mieten.de`, keine Aktivierung von Livegeräten, keine Migration produktiver Datensätze.

## Wichtig für Testanfragen

- Netlify Forms bleiben beim Testen die maßgebliche Formquelle; Browser-Mirror-Ereignisse verwenden auf Staging die isolierte **development**-Datenbank.
- Der verifizierte Netlify-Form-Event-Handler besitzt bewusst **keinen** Schreibzugriff auf die Staging-DB-Aliasvariablen; eine vollständige, doppelt abgesicherte Synchronisation aller Formularereignisse ist daher noch ein gesonderter QA-Punkt.
- Testdaten möglichst ausschließlich synthetisch und mit Einwilligung. Nicht automatisch als Buchung bestätigen.

## Update-Prozess

1. Neuentwicklung im separaten Feature-Branch und Deploy Preview prüfen.
2. Nur freigegebene und geprüfte Änderungen nach `staging` übernehmen (kontrollierter Fast-Forward oder PR).
3. GitHub QA und Netlify-Branch-Deploy auf `Ready` prüfen.
4. Auf der unveränderten Staging-URL Funktionen, Login und Anzeige verifizieren.
5. Ein produktiver Release wird getrennt und erst nach ausdrücklicher Freigabe in `main` veröffentlicht.

## Verifikation

- Netlify `staging` Deploy **Ready** mit GitHub-SHA des Staging-Branches
- Staging-Dashboard lädt ohne falsche SSO-/CORS-/Redirect-Schleifen
- Anonyme Aufrufe geschützter APIs erhalten 401; ungültige Hosts und Produktionskontexte 404
- Owner-Login und Rollenrechte prüfen, auch negativen 403-Fall
- Mögliche Staging-Formübernahme prüfen, ohne produktive Kundendaten zu verwenden
- Keine neuen Dateien aus `private-design-assets` im öffentlichen CDN; PWA speichert private Routen nicht zwischen
