# FOTOPOLIS 3.5 – Neon Auth und serverseitiges Admin-Gateway

**Datum:** 06.11.2026 · **Nur** GitHub `design/premium-v2`, Netlify PR #2 und Neon-Projekt `icy-wave-78750589` / Branch `development`. Keine Live-Veröffentlichung.

## Ist-Stand

- Der temporäre Proton-Benutzer ist in `neon_auth.user` angelegt (Identität bestätigt durch den Nutzer, **E-Mail technisch noch unverifiziert**).
- `fotopolis.admin_members` enthält die Rolle `owner`, aber `enabled=false`. Kein produktiver oder autorisierter Zugriff.
- Neon Auth: öffentliche Registrierung **aus**; E-Mail-Verifizierung erforderlich; Passwort-Reset beendet vorhandene Sitzungen.
- Zulässiger Origin in Neon Auth: **nur** `https://deploy-preview-2--fotopolis-preview.netlify.app`. Kein Live-Domain-Origin.
- Authentifizierungsseite: **[`/admin/login/`](https://deploy-preview-2--fotopolis-preview.netlify.app/admin/login/)**. Erstanmeldung über E-Mail-Verifizierung (`email-verification`-OTP) und danach `sign-in`-OTP. Kein vom Assistenten vergebenes Passwort; keine Codes im Chat.
- Nutzt die **offizielle** verwaltete Neon Auth JavaScript-Bibliothek `@neondatabase/auth`, lokal gebündelt mit esbuild in den Preview-Build. Auth-Host ist öffentliche Provider-Konfiguration, **kein** Datenbankschlüssel.
- Session-Check per Netlify Function `/api/fotopolis/admin/session`: Nur **deploy-preview** (nicht production oder veröffentlichter Deploy), ausschließlich GET, Bearer-JWT nach **EdDSA/Ed25519** mit Neons öffentlicher JWKS und überprüftem Issuer/Audience, danach Datenbankprüfung von `fotopolis.admin_members.enabled` und Rolle. Nicht angemeldet → 401, nicht freigeschaltet → 403. Alle Antworten `no-store`; keine CORS-Freigabe; 503 bei fehlender Backend-Konfiguration.
- Neon-Verbindung **nur als geheimes Netlify-Environment** `FOTOPOLIS_NEON_DEV_AUTH_READER_URL`, eingeschränkt auf **Functions** und **deploy-preview**. Keine URI im Repository, Browser, Screenshot oder Logs.
- Auth-Reader ist Neon-Rolle `fotopolis_admin_auth_reader` mit engstem Umfang: SELECT nur auf `fotopolis.admin_members`-Spalten `user_id,admin_role,enabled`, RLS-Policy auf dieser Tabelle und **keine** Berechtigung für Buchungen, Admin-Mutationen und Schema `neon_auth`. 
- Die private Rollen-/Policy-Migration `database/neon/003_auth_reader_scope.sql` wurde im Development-Branch ausgeführt und mit einem echten Rollen-SELECT sowie denied SQL auf `allocations` geprüft.
- `netlify.toml` beschränkt die Login-Seite mit CSP auf Self-Origin-Skripte und den exakten Auth-Host; kein Frame, kein externes CSS/Font, `no-store`.
- Der Admin-Kalender unter `/admin/` bleibt weiter eine **öffentlich sichtbare, rein lokale Demo** ohne echte Buchungen. Ein Login wird nicht als fertig geschützter Kalender ausgegeben.

## Abnahme / verifizierbare Belege

- Admin Studio Screen/Interaktion: 180 erfolgreiche Browser-QA-Checks über 7 Displaybreiten (letzter verifizierter Workflow [#42249013614](https://github.com/WTF-Sascha/fotopolis-website/actions/runs/42249013614)).
- Neon Auth Login-Layout und Einmalcode-Moduswechsel: 45 erfolgreiche Browser-Smoke-Checks über 5 Displaybreiten; **keine echten E-Mails** in diesem Test versendet.
- Serverseitige Einheitstests: 4/4 erfolgreich für 401 ohne Session, 404 außerhalb der Preview, 403 für fremden Origin, 405 für falsche Methoden sowie fehlerhafte JWTs. 
- Die neuen Tests laufen im [Admin-Review-QA-Workflow](https://github.com/WTF-Sascha/fotopolis-website/actions/workflows/admin-studio-qa.yml); normales Website-Review und 3.1-Regression bleiben erhalten.
- Diese Tests beweisen **noch nicht** den erfolgreichen echten E-Mail-Empfang, die Neon-Browser-Session, Verifizierung oder die Erteilung einer `200`-Freigabe nach Aktivierung. Das wird bei Erstanmeldung im Preview getestet. Kein vorgetäuschter End-to-End-Erfolg.

## Nächste Schritte

1. Nutzer öffnet `/admin/login/` und wählt **1. E-Mail bestätigen**, sendet selbst den Code an sein temporäres Proton-Postfach und trägt ihn **nur in der Website** ein.
2. Anschließend **2. Anmelden**: neuen Code anfordern und im Login eingeben; der Server muss erwartungsgemäß noch `403` melden, weil `enabled=false`.
3. Danach wird die überprüfte Neon-E-Mail-Verifizierung read-only kontrolliert. Erst mit verifizierter Adresse und erfolgreicher negativer Token-/Rollen-Testmatrix kann die App-Rolle `enabled=true` gesetzt werden (noch keine echte Kalender-Schreibfreigabe).
4. Später geschützte CRUD-Endpunkte für Geräte, Sperrzeiten und Buchungen implementieren; echte Buchungen ausdrücklich erst nach Inventar- und Geschäftsregel-Freigabe.
5. Vor Livebetrieb: eigener verantwortlicher Admin (nicht geteiltes Übergangskonto), MFA-fähige Auth-Möglichkeit, korrekter Datenschutz, SMTP und Backupkonzept.

## Grenzen

**Kein Zugriff auf `main`, keine Änderung an `fotopolis-mieten.de`, keine Änderung anderer Apps, keine bezahlte Zusatzfunktion.** Netlify Preview und Neon Development sind strikt isoliert. Die Bestätigungscodes dürfen nie an den Assistenten geschickt werden.
