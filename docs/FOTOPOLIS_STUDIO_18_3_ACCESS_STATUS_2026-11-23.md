# FOTOPOLIS Studio 18.3 — Phase 0 / Stability & Access

**Stand:** 23.11.2026 · **SCOPE:** GitHub-Feature-PR #25 / Netlify Deploy Preview / Neon Development. **Freigabestatus:** NO-GO; kein Merge, keine Live-Veröffentlichung, keine produktive Datenbank- oder Auth-Konfiguration verändert.

## 1. Belegter Iststand (read-only)

| Komponente | Nachweis / Stand | Bewertung |
| --- | --- | --- |
| GitHub | PR #23 (Studio 17), #24 (CI 2.1), #25 (Recovery) jeweils offen und Draft; PR #25 vor diesem Inkrement auf `f332ab4738034f6a1382a89c5855f5a2c792b7b8` | verifiziert |
| Netlify | `fotopolis-preview`, Projekt `653f790e-5476-4349-84d9-012adbeeb489`, Preview #25 Deploy `6b03fd95282f8cf43e77a104` status `ready`, auf vorherigem Commit `f332ab4...` | Baseline verifiziert; neuer Head separat prüfen |
| Neon DEV | `icy-wave-78750589` / `br-super-leaf-b9jj8n9p`, status ready | verifiziert |
| Auth Origin | `https://deploy-preview-25--fotopolis-preview.netlify.app` in `trusted_origins` von Neon DEV | verifiziert; nicht erneut hinzufügen |
| Auth Einstellungen | Email/Passwort aktiviert, Sign-up aus, E-Mail-Verifikation erforderlich, Session-Widerruf nach Password Reset an | verifiziert |
| Auth-Konto | 1 Benutzer, 1 bestätigte E-Mail; 1 aktivierter FOTOPOLIS-Admin mit Rolle `owner`; 1 Account `credential` mit vorhandenem Passwort-Hash | **keine fehlende Admin-Freigabe**, aber kein Beleg für Kenntnis des gültigen Passworts |
| Auth Sessions | 6 Sitzungsdatensätze; neueste Anlage 12.11.2026 19:03:00 UTC | keine neue erfolgreiche Sitzung am 23.11. durch diese Abfrage nachgewiesen |
| Netlify Secrets | `FOTOPOLIS_NEON_DEV_AUTH_READER_URL` vorhanden, nur Functions / deploy-preview; entsprechender Staging-Key vorhanden, nur Functions / branch-deploy | Metadaten verifiziert; **Inhalt / Verbindung nicht getestet** |
| CI auf alter Baseline | Studio 18.2, Studio 18 CI 2.1, Studio 13, Studio 12 auf `f332ab4...` abgeschlossen mit success | automatische Tests, **keine authentifizierte E2E-Abnahme** |

Die ältere Dokumentation `docs/FOTOPOLIS_ADMIN_IDENTITY_SETUP.md` vom 06.11.2026 nennt `emailVerified=false` und `enabled=false`. Der aktuelle read-only-Datenbankbefund widerspricht diesen **historischen** Angaben; die Datenbank wird nicht aufgrund der Dokumentation zurückgesetzt.

## 2. Eingrenzung der Anmeldung

**Nachgewiesen:** Die aktuelle Preview-Origin ist erlaubt; im DEV-Branch gibt es ein verifiziertes, aktiviertes Admin-Konto mit Passwort-Credential. Die Netlify-Funktionsvariable ist für den vorgesehenen Deployment-Kontext vorhanden.

**Noch nicht nachgewiesen:** Ob die konkret eingegebenen Zugangsdaten akzeptiert werden; ob das Browser-Cookie gespeichert/gesendet wird; ob `client.getSession()` eine gültige Sitzung erhält; ob ein kryptografisch prüfbarer JWT aus dem SDK kommt; ob Netlify `/api/fotopolis/admin/session` 200 liefert; ob der Browser anschließend das Dashboard öffnet. Aus einem `ready`-Deployment oder einem `enabled=true`-Admin folgt nicht, dass der Login funktioniert.

### Ausgeführtes Codeinkrement

- `concepts/premium-v2/admin/session-token.js`: Probiert für bestehende authentifizierte Sitzungen bevorzugt den vom Neon-SDK vorgesehenen Accessor `client.getJWTToken()`, falls vorhanden; prüft weiter ausschließlich syntaktisch JWT-förmige Werte mit Längenlimit. Bereits gültige JWTs aus `getSession` behalten Vorrang.
- Bei fehlendem/fehlerhaftem Accessor bleiben die bisherigen `client.token()`- und expliziten Session-Refresh-Fallbacks erhalten. Es werden keine vertraulichen Token ausgegeben oder im Local Storage abgelegt.
- `scripts/test-admin-token.mjs`: vier zusätzliche negative/positive Vertragsprüfungen für opaque Sessions, SDK-Fehler, Fallback und fail-closed-Verhalten.
- `.github/workflows/studio18-3-auth-qa.yml`: separater, rein synthetischer CI-Gate mit Token- und Admin-API-Negativtests. **CI-Ergebnis am neuen Head noch nachziehen.**

**Wirkungsgrenze:** Der zusätzliche Token-Abruf greift erst nach erfolgreicher Anmeldung; er kann ein falsches Passwort, einen abgelehnten Auth-Request oder vom Browser blockierte Drittanbieter-Cookies nicht beheben. Deshalb keine Behauptung „Login repariert“, bevor E2E positiv nachgewiesen ist.

## 3. Priorisierte Maßnahmen / Freigabestatus

| ID | Ursache/Risiko | Prio | Maßnahme | Prüfnachweis | Status |
| --- | --- | --- | --- | --- | --- |
| FOTO-003-A | Unklare Auth- und Session-Fehlerkette | P0 | Origin, Login-Konfiguration, gespeicherte Identität, Rollen und Netlify-Kontext read-only abgleichen | SQL-Aggregate, Neon Auth-Konfig, Netlify-Metadaten | **VERIFIZIERT (nur Konfiguration)** |
| FOTO-003-B | JWT-Abruf bei SDK-Versionen mit opaque Session | P0 | zusätzlicher offizieller SDK-Accessor, bestehender Fallback bleibt | dedizierter CI-Workflow, lokale Negativtests; aktueller Head prüfen | **IMPLEMENTIERT / TEST AUSSTEHEND** |
| FOTO-003-C | Echte Browser-Anmeldung trotz aktivem Konto nicht nachgewiesen | P0 | Anmeldung → Cookie → Session → JWT → 200/403 → Logout sicher durchtesten | Browser-E2E mit autorisiertem Kontoinhaber, ohne Passwort/OTP im Bericht | **NICHT GETESTET** |
| FOTO-002 | Main-Preview und PR-Preview historisch unterschiedlich | P1 | Branch-Commit-Deploy-Kette sichtbar halten | Netlify Deploy-ID / Commit + CI | **TEILWEISE BELEGT** |
| FOTO-008 | Production-Auth weniger restriktiv | P1 | getrennte Security-Entscheidung mit Recovery-Plan | **Keine Änderung ohne Freigabe** | **BLOCKIERT** |
| FOTO-009 | RLS/Grants in Studio-13-Schema zu überprüfen | P2 | effektive Rechte und API-Reichweite analysieren | bisher nur ältere Read-only-Review | **OFFEN** |

Für die restlichen FOTO-001 bis FOTO-016 gilt das unverändert dokumentierte Studio-18.2-Register. Keine stillschweigende Abnahme anderer Geschäftsprozesse, Printlayouts oder Designs.

## 4. Deterministische Diagnosematrix für den nächsten legitimen Login-Test

1. Nur die eindeutig zugehörige **PR #25 Preview** öffnen, Netlify Site-Passwortschutz durchlaufen, dann `/admin/login/`.
2. Bei Fehler *vor* `signIn.email()` die lokal angezeigte Validierung prüfen. Wenn Neon die Credentials zurückweist, die Fehlermeldung und den HTTP-Status dokumentieren **ohne** Passwort, Code, Cookies, JWT oder personenbezogene Header.
3. Bei erfolgreicher Auth-Antwort prüfen, ob `getSession()` eine Session zeigt; ggf. Cookie-Blocking zwischen `netlify.app` und `neon.tech` als Browserproblem gesondert untersuchen.
4. Bei JWT-Abrufproblem SDK-Methode und Vorhandensein eines JWTs prüfen, **niemals dessen Wert protokollieren**.
5. `/api/fotopolis/admin/session`: 200 + `authorized=true` erlaubt Dashboard; 401 bedeutet fehlenden/ungültigen Bearer, 403 bedeutet serverseitig fehlende Admin-Freigabe, 503 Dienst-/Konfigurationsproblem. Status und Request-ID reichen für die Fehlerakte.
6. Getrennte negative Tests: anonym 401, fremder Origin 403, ungültige Methode 405, Produktionshost 404, abgelaufener Token 401, gesperrter Benutzer 403. Freigabepflichtige persistente Benutzer-/Rollentests NICHT eigenmächtig durchführen.
7. Abmeldung, Sitzungserneuerung und Passwort-Reset nur mit aktivem Kontoinhaber und festgelegtem Testumfang durchspielen. Keine Test-Mails ungefragt auslösen.

## 5. Abhängigkeiten PR #23 / #24 / #25

- **PR #23** ist ausschließlich klickbarer UX-Prototyp (Studio 17, Phase 1), keine Backend-Integration. Gesondertes Freigabe-Gate.
- **PR #24** enthält genehmigte CI-2.1-Implementierung; nicht ohne vollständige Qualitätssicherung in `staging` übernehmen.
- **PR #25** basiert auf PR #24 und enthält Recovery + dieses Studio-18.3-Diagnoseinkrement. PR #25 ist der einzige unmittelbare technische Testkandidat, nicht das alte Main-Deployment.
- Erst CI, Auth-E2E und regressionssicheres Branch-Diff prüfen; Integrationsplan für PR #23 als eigenständige Entscheidung dokumentieren. **Keine automatische Zusammenführung der drei PRs**.

## 6. Freigaben, Restrisiken und Rollback

- Kein Nutzerpasswort oder OTP erfragt, verwendet, verändert oder gespeichert; kein API-Login mit echtem Konto durchgeführt.
- Keine Neon-Auth-Konfigurationsänderung, Datenbankmutation, produktiver Merge oder Umstellung von `fotopolis-mieten.de`.
- Rollback des Inkrements: die spezifischen GitHub-Commits in PR #25 rückgängig machen; sämtliche bereits freigegebenen CI-2.1-Build- und Preview-Guard-Schritte beibehalten.
- **Gate A:** Konfiguration zum Teil belegt. **Gate B:** Implementierung unter isoliertem Branch. **Gate C:** CI auf neuem Commit nachweisen. **Gate D:** fachliche echte Anmeldung fehlt. **Gate E:** NO-GO.
- **Nächster freigabepflichtiger Schritt:** Echt-Login/Logout- und Berechtigungstests mit vorhandener persönlicher DEV-Identität, falls dafür Zugang oder Änderungen außerhalb der bestehenden Freigabegrenze nötig werden. Kein Freitext mit Zugangsdaten.

### Vertrauenswürdige Referenzen

- Projektbaselines: `docs/FOTOPOLIS_STUDIO_18_2_RECOVERY_STATUS_2026-11-23.md`
- Neon: https://neon.com/docs/auth/guides/plugins/jwt (JWT, Ausgabe und Refresh); https://neon.com/docs/compute/functions/authentication (Issuer/JWKS-Prüfung)
- GitHub: PR #25 und Studio-18.3-CI auf exakter SHA nach dem Commit prüfen.

**Gesamtstatus: STUDIO 18.3 NICHT ABGENOMMEN — KEIN LIVEGANG.**
