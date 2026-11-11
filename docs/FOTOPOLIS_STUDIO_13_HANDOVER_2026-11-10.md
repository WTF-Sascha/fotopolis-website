# FOTOPOLIS Studio 13.0 – Entwicklungsabschluss & Übergabe (10.11.2026)

**Entwicklungsstand:** Vollständig im separaten Branch implementierte Studio-13-Preview mit funktionalen Business-Modulen, aber **kein freigegebener Produktionsrelease**. PR #19 bleibt ausdrücklich Draft. Die unveränderte Live-Domain ist `fotopolis-mieten.de`; `main` und produktive Kundendaten wurden nicht geändert.

## 1. Technische Referenzen

| Thema | Referenz |
|---|---|
| Repository | `WTF-Sascha/fotopolis-website` (derzeit öffentlich, Privatisierung offen) |
| Branch | `feature/studio13-business-command-center-20261110` |
| PR | https://github.com/WTF-Sascha/fotopolis-website/pull/19 |
| Nichtproduktiver Preview-Einstieg | https://deploy-preview-19--fotopolis-preview.netlify.app/ |
| Verwaltung | `/admin/dashboard/` |
| Privater Druckeditor | `/admin/designstudio/` |
| Auth | Neon Auth Entwicklungsbranch, JWKS-validierter JWT und aktive Mitgliedschaft |
| Datenbank | Neon `icy-wave-78750589`, Branch `br-super-leaf-b9jj8n9p`, Schema `fotopolis_studio13` |
| DB-Zugang | `FOTOPOLIS_STUDIO13_DEV_DB_URL` – Netlify: secret, Functions only, deploy-preview only |
| Public API | `/api/fotopolis/studio13/{content,metric,enquiry}` |
| Admin API | `/api/fotopolis/studio13/admin/{analytics,inquiries,cms,media,designs,roles,audit}` |

**Sicherheitsupgrade vom 10.11.2026:** Netlify Visitor Access Controls verlangen SSO mit dem zugehörigen Netlify-Team für alle **non-production** Deployments. Diese zentrale Projekteinstellung schützt somit auch die älteren PR-Previews (einschließlich Studio 12); die Haupt-Site wird davon nicht als Produktionskontext eingeschränkt.

## 2. Umgesetzte Funktionen

| Modul | Konkreter Funktionsumfang | Grenzen |
|---|---|---|
| Dashboard | Bestehende Termin-/Geräte-/Sperrzeiten-/Audit-Module unverändert; 7 neue responsive Command-Center-Bereiche | Bestehende echte Admin-Session erforderlich |
| Analytics | First-Party Ereigniszählung nach Tag, Seitenroute und Art; Anzeige echter 30-Tage-Zähler; keine Cookies, Besucher-IDs, IP-/UA-Speicherung in `analytics_daily` | Nur Preview-Traffic, keine Unique Users, keine vollständige Attribution oder juristische Endfreigabe |
| Eventanfragen | Netlify Forms bleibt **Primär-Eingang**; nach bestätigtem POST erfolgt eine zusätzliche, best-effort idempotente Übernahme in Neon-CRM; Status ändern, Historie und Rechte | Nicht transaktional zwischen Netlify und Neon; verlorene Kopien müssen über Netlify Forms abgeglichen werden. Keine automatischen Angebote/Buchungen |
| CMS | Vier kontrollierte Textslots, Entwurf, versionierte Veröffentlichung in Preview, Historie und Rollback | Kein allgemeines visuelles Page-Builder-CMS, kein automatisches SEO-Prerendering, kein Produktiv-Publish |
| Medien | Private JPG/PNG/WebP-Uploads (max. 2 MB), Bildprüfung/Hash, Herkunft/Nutzungsrechte/Alt-Text, Auth-Vorschau, Archivierung | Maximal 40 Dateien; keine automatische Veröffentlichung, kein Ersatz originaler Logos, keine Videos |
| Designvorlagen | 44 aktuelle Motive (32 Classics + 12 Signature) unverändert, interne Prüfstufen, Notizen und Freigaben | Freigabestatus ersetzt keinen Drucker-ICC-Proof; Originaldateien und Motivdaten werden nicht verändert |
| Design-to-Print | Fotoeditor unter `/admin/designstudio/`, bearbeitbare Foto-Slots, lokaler PNG-Export 1772 × 1181 px mit 300-DPI-Metadatum; 44 Druckoriginale außerhalb des statischen Publish-Ordners in serverseitige Function-Assets ausgelagert | Echter positiver Login-/Drucktest mit dem administrativen Konto und physischem FOTOPOLIS-Drucksystem bleibt offen |
| Rollen & Audit | `owner`, `manager`, `viewer` als bestehende Auth-Basis; ergänzende `designer`, `editor`, `eventmanager`, `analyst` nur für aktive, bereits bestehende Konten. Server prüft Modulrechte und dokumentiert Änderungen | Keine öffentliche Registrierung oder vollständige MFA-Einführung |

## 3. Sicherheits- und Qualitätsnachweise

- Studio-13-Foundation-QA: https://github.com/WTF-Sascha/fotopolis-website/actions/runs/42797058435 – **success**. Darin Syntax- und 9/9 Service-Tests, 7/7 Auth-Gates, sichere Asset-Gates, responsive Browser-QA bei 360/390/430/768/1024/1440/1920 px.
- Gated Admin-Layout im Browser statisch sichtbar gemacht, ohne eine erfolgreiche Benutzeranmeldung vorzutäuschen: bei 390/768/1440 px geprüft, jeweils ohne horizontales Overflow.
- Öffentliche Galerie: 44 Vorlagen an allen 7 Breiten, keine öffentlichen Print-Downloads/Editorlinks, keine Browser-JS-Fehler.
- Live Netlify API Smoke: `GET /content` = 200, anonymer Admin API GET = 401, ungültige Metrik = 400, synthetischer aggregierter Metrik-POST = 202, ungültige Anfrage = 400. Verifiziert in derselben GitHub-Actions-QA, **bevor die Netlify-SSO-Sperre aktiviert wurde**.
- Verifizierter DB-Eintrag: `analytics_daily` enthält ein synthetisches, identifikatorfreies Seitenaufrufereignis `/faq/` vom 10.11.2026.
- Kein echter Kundenkontakt oder Kundendatensatz wurde bei den Studio-13-Techniktests künstlich angelegt.
- Kein Rückschluss von Browser-QA auf eine erfolgreiche signierte Owner-/Manager-Sitzung; dafür braucht es die echte berechtigte Anmeldung.

## 4. Freigabebedingungen – nicht durch technische Tests ersetzbar

1. **Echter Verwaltungslogin:** Eigentümer meldet sich in der SSO-geschützten Preview über Neon Auth an und prüft Owner-Rolle, Dashboard, Formular-Bearbeitung, Editor, Uploads, CMS-Publish/Rollback und Abmeldung.
2. **Druckqualität:** Ein Originalmotiv mit echten Fotos am FOTOPOLIS-Gerät inklusive Papierformat, Randlos-/Beschnittparametern, ICC-Profil und optischem Logoabgleich drucken.
3. **Netlify-CRM-Synchronisierung:** Mit ausdrücklich freigegebenen synthetischen Testdaten einen echten Netlify-Formularversand und dessen anschließende Studio-13-Datenkopie belegen. Die Netlify Forms Oberfläche ist bei Sync-Abweichungen maßgebend.
4. **Datenschutz:** Rechtsgrundlagen, Auftragsverarbeitung, Datenübermittlungen, Aufbewahrungsdauer, Einwilligung/Hinweistexte, Analytics, Opt-out- und Löschkonzept anwaltlich bzw. fachlich abnehmen. Die Testumgebung ist technisch implementiert, nicht juristisch freigegeben.
5. **Repository-Sichtbarkeit:** Das GitHub-Repository ist derzeit öffentlich. Private Assets und Codequellen können aus der Git-Historie ableitbar sein. Eine Umstellung auf privat kann der aktuelle GitHub-Connector nicht ausführen; sie muss in den GitHub-Repositoryeinstellungen nach Integrationsprüfung erfolgen.
6. **Abnahme & Release:** Keine PR-Merge, kein `main`-Commit, kein Livegang oder Änderung echter Buchungs-/Kundendaten ohne ausdrückliche Nutzerfreigabe. Die echte Live-Domain `fotopolis-mieten.de` bleibt unberührt.

## 5. Struktur & Änderungsnachweise

- Datenbankmigration (ausschließlich DEV): `database/neon/006_studio13_command_center_dev.sql`.
- Server: `netlify/functions/fotopolis-studio13-public.mjs` und `fotopolis-studio13-admin.mjs`.
- Rollen-/Preview-Härtung: `fotopolis-admin-session.mjs`, bestehende Mutationsendpunkte, `fotopolis-design-private.mjs`.
- Frontend: `concepts/premium-v2/admin/dashboard/command-center-app.js`, `command-center.css`, `studio13-{metrics,enquiry-mirror,public-content}.js`.
- Build-Härtung: `scripts/harden-studio13.py`, `netlify.toml`, `scripts/build-admin-auth.mjs`.
- CI: `.github/workflows/studio13-foundation-qa.yml`, `scripts/studio13-{services,private,contract,browser,live}-qa.mjs`.

**Fazit:** Der implementierbare Entwicklungsumfang ist über PR #19 prüfbar. Die oben aufgeführten echten Nutzer-/Druck-/Rechtsfreigaben sind explizite Blocker für einen produktiven Release und dürfen nicht als automatisiert bestanden dargestellt werden.
