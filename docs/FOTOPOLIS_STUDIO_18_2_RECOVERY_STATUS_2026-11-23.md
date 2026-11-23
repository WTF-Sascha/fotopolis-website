# FOTOPOLIS Studio 18.2 — Recovery-Baseline und Arbeitsregister

Stand: 23.11.2026 · Arbeit ausschließlich im Feature-Branch · **NO-GO für Produktivfreigabe**

## A. Verifizierter Ausgangsstand

- Audit-Referenz: `FOTOPOLIS_Studio_18_Enterprise_System_Audit_2026-11-23.md` (Read-only-Report).
- Repo: `WTF-Sascha/fotopolis-website`; `main` @ `1831a1eead195d78f33a9d5dcce0f350b72486d8`; `staging` @ `032c3f1bd1ad0e95e06ad48c9c0c467fc9586046`.
- Studio 17: offener Draft PR #23, `087c1f6c8301a59bdf05130c01b3a34b6092ba7b`. **Phase 2 und echte Admin-Integration nicht freigegeben.**
- Studio 18 CI 2.1: offener Draft PR #24, `02b9cae31474fb0d250b1890ade0f23bf376e052` (abgenommene Codebasis, nicht vollständige Fachfreigabe).
- Neuer Studio-18.2-Branch aus genau diesem Studio-18-Commit: `feature/studio18-2-enterprise-quality-recovery`.
- Netlify-Projekt `fotopolis-preview`, Projekt-ID `653f790e-5476-4349-84d9-012adbeeb489`; aktuell veröffentlichter Hauptdeploy `6af0de4062ec0dcdec2f5915` (ready, **Studio 9.5**, Commit `1831a1ee`). Non-Production-Preview-Passwortschutz vorhanden.
- Neon-Projekt `icy-wave-78750589`: `production` @ `br-lingering-mode-b92xvpnl`; `development` @ `br-super-leaf-b9jj8n9p`. Keine Datenbankmutation in Studio 18.2.
- Verifizierte Neon DEV RLS-Eigenschaften: fünf `fotopolis`-Tabellen mit RLS aktiv, neun `fotopolis_studio13`-Tabellen ohne RLS. Dies beweist **keine** öffentlich ausnutzbare Lücke, solange der tatsächliche Zugriff ausschließlich geschützte Serververbindungen verwendet.
- **Read-only-Grants-Review 23.11.:** `fotopolis_studio13_writer` besitzt `SELECT, INSERT, UPDATE, DELETE` auf neun Studio-13-Tabellen; drei dedizierte `fotopolis_admin_*_writer`-Rollen besitzen jeweils `SELECT`-Grants auf 1–2 Basistabellen. `neondb_owner` hat volle Eigentümerrechte. Im abgefragten `information_schema.role_table_grants` erscheint kein expliziter anonymer `PUBLIC`-Grant; diese Sicht ersetzt keine vollständige Prüfung effektiver Rollenvererbung oder Internet-Exposition. **Keine Grant-Änderung vorgenommen.**
- Neon Auth DEV `trusted_origins`: `deploy-preview-2`, `-19`, `-20`, `-22` und `staging`; Preview #24 ist nicht gelistet. DEV Registrierung deaktiviert, E-Mail-Verifikation erforderlich. Produktion: Registrierung zugelassen, Verifikation nicht verpflichtend, localhost erlaubt. **Risiko / Konfiguration, kein bestätigter Exploit.**
- CI-Ausgangsbefund: Studio 12 Run [44723669062](https://github.com/WTF-Sascha/fotopolis-website/actions/runs/44723669062) rot wegen sieben 30s-Locator-Timeouts; Brand QA [44723669005](https://github.com/WTF-Sascha/fotopolis-website/actions/runs/44723669005) und Studio 13 [44723669014](https://github.com/WTF-Sascha/fotopolis-website/actions/runs/44723669014) grün auf **altem Studio-18-Head-SHA**, nicht auf 18.2.

## B. Änderungsnachweise des aktuellen Inkrements

1. `scripts/studio11-browser-qa.mjs`: Entfernt den **nicht mehr gültigen** Anspruch, ein Fotospiegel-Produktbild im neuen Begrüßungs-Hero zu finden. Ersetzt ihn durch nachweisbare positive Prüfungen für genau einen freigegebenen Welcome-Hero, H1, Begrüßungstext, Atmosphäre, keine Produktlinks oder Produktnennungen im Hero, drei Produktkarten und ein geladenes Fotospiegelbild in der korrekten Produktkarte. **Implementiert; sieben Viewports und gesamter alter Browserlauf noch auf dem neuen SHA nachzuweisen.**
2. `scripts/studio18-2-preview-guard.mjs`: Nur Netlify `deploy-preview` oder `branch-deploy` erlaubt; `production`/unbekannte Kontexte und fremde Site-ID werden abgewiesen. Lokaler Offline-Build ist gesondert gekennzeichnet. Keine automatischen produktiven Deployments.
3. `scripts/studio18-2-build-provenance.mjs`: Erzeugt nach dem Build `preview-build/studio18-release.json` mit erlaubter, nicht geheimer Branch-/Commit-/Deploy-Zuordnung sowie status `NO-GO`; fügt in Admin-Login und Dashboard eine sichtbare nicht-freigegeben-Kennzeichnung ein. Dies ist Buildprovenienz, keine E2E-Abnahme.
4. `netlify.toml`: In allen drei vorhandenen Build-Kontexten wird zuerst der Preview-Guard aufgerufen und nach den bestehenden Qualitätsprüfungen die Buildprovenienz erzeugt. Der neue Branch unterscheidet damit zulässige Preview-Deployments explizit von nicht erlaubten Produktivdeployments.
5. `scripts/test-studio18-2-release.mjs` und `.github/workflows/studio18-2-release-qa.yml`: isolierte Node-Tests für erlaubte und verbotene Deploy-Kontexte, falsche Site-ID, Manifest-Inhalt, Admin-Banner, doppelte Injektion und Build-Konfigurationsvollständigkeit. Tests laufen ohne Kundendaten, Auth und Netzverkehr.
6. `README.md`: neue aktuelle Architektur-/Umgebungsbeschreibung; alte Website-Design-1.0-Dokumentation als historisch gekennzeichnet, nicht fälschlich gelöscht.
7. `scripts/studio18-2-print-technical-qa.py`: automatisierte **Einzelprüfung aller 44** generierten geschützten Print-PNGs und öffentlichen WebP-Vorschauen: Größe, DPI, echte Alphafenster, Zahl und Geometrie der Fotofelder, Prüfsummen, Schutz der Printdateien vor öffentlicher Auslieferung. Liefert 44 Zeilen als `preview-build/qa/studio18-2-print-technical-matrix.json` und `.md`. Das Brand-QA-Workflow-Artifact bewahrt diese Matrix auf. Logo-Sichtabnahme, Katalogtext-Pixelprüfung, ICC-Farbproof und physischer Druck bleiben ausdrücklich `NOT_TESTED`.

Alle Änderungen sind vorerst **Entwicklungs-Code**. Ein Commit allein ist **kein** bestandener Test.

## C. Auditfehlerregister FOTO-001 bis FOTO-016

Statuswerte: `OFFEN`, `IN ANALYSE`, `IMPLEMENTIERT`, `TECHNISCH GETESTET`, `FACHLICH ABGENOMMEN`, `BLOCKIERT`.
Ein abweichender älterer CI-Status gilt **nicht** als Testnachweis für den neuen Feature-Commit.

| ID | Prio | Aktueller Status | Aktueller Befund / Maßnahme | Nächstes zwingendes Gate |
|---|---|---|---|---|
| FOTO-001 | P1 | **IMPLEMENTIERT** | Veralteten Hero-Locator identifiziert und durch die aktuell freigegebene Welcome-/Produktstruktur geprüft; keine Assertions deaktiviert | Chromium-Workflow auf aktuellem SHA: sieben Breiten, Screenshots, alle Pflichtchecks grün |
| FOTO-002 | P1 | **IMPLEMENTIERT (teilweise)** | Build-Manifest und Admin-Hinweis ergänzt; Main-Preview bleibt absichtlich Studio 9.5 | Zuordnung jeder Preview zu Commit/PR/Modulen verifizieren; keine stille Aktualisierung von main |
| FOTO-003 | P1 | **BLOCKIERT** | Fehlende Trusted Origin der neueren Preview bestätigte Konfigurationslücke | Gesonderte Freigabe für DEV-Auth-Origin und positive/negative Login-/OTP-E2E |
| FOTO-004 | P1 | **BLOCKIERT** | Netlify Forms→Neon-CRM nicht mit synthetischer End-to-End-Anfrage bestätigt | Testdatensatz-Freigabe; ID-/Persistenz-/Wiederholungsnachweis |
| FOTO-005 | P1 | **BLOCKIERT** | Kein nachgewiesener aktiver DEV-Testgeräte-/Reservierungsfluss | Freigabe für synthetische Ressourcen/Reservierungen und Race-/DST-Tests |
| FOTO-006 | P1 | **IMPLEMENTIERT (nur technischer Prüflauf)** | 44 individuelle Rasterprüfungen im isolierten Build mit JSON/Markdown-Matrix ergänzt; noch kein bestandener Testlauf und keine optische oder physische Druckfreigabe | 44 erfolgreich verifizierte Artefakte am exakten Commit, echte Motiv-/Logo-/Katalognamen-Prüfung und anschließend Druckerproof je Vorlage |
| FOTO-007 | P1 | **BLOCKIERT** | 5×15-cm-Unterstützung hardwareabhängig und nicht nachgewiesen | Reale Drucker-/Papier-/Beschnittspezifikation, danach Implementierung |
| FOTO-008 | P1 | **BLOCKIERT** | Production-Neon-Auth mit offener Sign-up-Option, fehlender obligatorischer Verifikation und localhost | Zweck des Endpoints klären; separate Auth-Härtungsfreigabe und Rollback |
| FOTO-009 | P2 | **IN ANALYSE** | RLS auf neun DEV-Studio-13-Tabellen aus; Schutz hängt an serverseitigen Rollen/Grants | Read-only Grant-/API-Exposure-Review; least-privilege-Plan ohne automatische Mutation |
| FOTO-010 | P1 | **OFFEN** | CI 2.1 auf Studio-18-Feature vorhanden, nicht auf Hauptpreview fachlich freigegeben | Echte Original-Master-/Produkt-/Print-/UI-Bildabnahme aller aktiven Medien |
| FOTO-011 | P2 | **IMPLEMENTIERT** | Preview-only Netlify-Interlock und Offline-Tests ergänzt | Aktueller CI-Run erfolgreich, Negativtest Produktionskontext, Previewdeploy korrekt |
| FOTO-012 | P2 | **IMPLEMENTIERT (teilweise)** | Architektur-README korrigiert | Vollständige Dokumentations-/C4-/Betriebsprüfung |
| FOTO-013 | P2 | **OFFEN** | Keine tatsächlichen LCP/CLS/INP- und WCAG-2.2-AA-Gesamtnachweise | Lighthouse-/Field-Daten, realer Tastatur-/Screenreader-/Gerätetest |
| FOTO-014 | P1 | **BLOCKIERT** | Automatisierter Form-/CRM-Reconciliation-Mechanismus nicht nachgewiesen | Freigabe und Design für Replay/Alarm/Idempotenz, Tests gegen isolierte Datensätze |
| FOTO-015 | P2 | **OFFEN** | DSGVO, Medienrechte, Repository-Freigabe, Backup/Restore/Retention nicht abgenommen | Sicherheits- und rechtlicher Betriebsreview |
| FOTO-016 | P2 | **OFFEN** | CRM/Kundenportal/Personal/Automatisierung/KI teilweise Planungsstand | Klarer Feature-Parity-Backlog, keine Scheinfunktionen |

## D. Freigabepflichtige Änderungen — nicht ausgeführt

| Vorhaben | Grund / Restrisiko | Geplanter Rücksetzweg |
|---|---|---|
| Ergänzung der **konkreten neuen Preview-Origin** in Neon Auth DEV | Externe persistente Auth-Konfiguration; Konfigurationsänderung nur mit zusätzlicher Freigabe | Exakt diesen Origin wieder entfernen, aktuelle Liste vorher/nachher dokumentieren |
| Härtung Production-Neon-Auth | Könnte reale Anmeldeflüsse sperren; keine automatische Änderung | Vorherkonfiguration protokollieren, getesteter Notfallzugang und planbarer Rollback |
| Synthetische CRM-/Anfrage-/Geräte-E2E | Erzeugt persistente Testdaten und kann externe Netlify-Forms-/Mail-Events auslösen | Getrennte Testdaten-ID, gezielte Datenbereinigung und Reconciliation; **niemals** echte Kunden |
| DB-Constraints/Migration, Reconciliation-Job und Writer-Grant-Änderung | Datenmodell-/Betriebsrisiko; Revision muss transactional und reversibel sein | Vorher-Schema, Migrations-Dry-Run und dokumentierte Down-Migration bzw. Wiederherstellung |
| Studio-17-Phase-2-Integration | UX-Prototyp in PR #23 ist ausdrücklich noch nicht zur Backend-Integration freigegeben | Weiter getrennt lassen; neues Konzept-/Release-Gate |
| Echte Print-Freigabe | Physische Hardware, ICC/Farbprofil, Druckqualität unbekannt | Separater Musterdruck je Layout; in QA bis dahin `NICHT ABGENOMMEN` |

## E. Nächste sichere Reihenfolge und harte Abnahme

1. Die neuen Studio-18.2-Offline-Tests und den wieder aktivierten Browserworkflow für die **exakte Head-SHA** ausführen; Fehler analysieren statt Assertions abschalten.
2. Nur erfolgreiche geschützte Netlify-Preview dokumentieren, mit Screenshot-/Build-ID; ohne erfolgreichen Lauf keine Aussage `TECHNISCH GETESTET`.
3. Auth-/DB-Konfiguration und öffentliche Routen ausschließlich read-only prüfen; danach separate Freigaben für persistente Tests und Anpassungen.
4. Alle 44 Drucklayouts, CI-Medien, WCAG, Web Vitals und fachlichen Geschäftsprozesse systematisch nachprüfen; Ergebnisse nach ID dokumentieren.
5. **Nicht mergen oder veröffentlichen.** Studio 18.2 bleibt NO-GO bis durchgängige Funktionalität, Datenintegrität, Sicherheit und fachliche Freigabe nachgewiesen sind.

### Quellen

- [Enterprise System Audit 23.11.2026](../docs/FOTOPOLIS_STUDIO_18_PHASE0_AUDIT_2026-11-18.md) (älterer Repo-Audit als Ergänzung; das aktuelle Enterprise-Audit liegt separat im Projektkontext)
- [Studio-17-PR #23](https://github.com/WTF-Sascha/fotopolis-website/pull/23)
- [Studio-18-PR #24](https://github.com/WTF-Sascha/fotopolis-website/pull/24)
- [Studio-12-Fehlerlauf 44723669062](https://github.com/WTF-Sascha/fotopolis-website/actions/runs/44723669062)

**Abschluss-Disclaimer:** Keine realen Besucher-, Formular-, Kundendaten-, Hardware- oder Auth-End-to-End-Tests durchgeführt; kein Zugriff auf Produktionsdaten, keine Migration und kein Merge. Der Status `IMPLEMENTIERT` darf nicht mit `GETESTET` verwechselt werden.
