# FOTOPOLIS – Admin-Identität: erster Entwicklungsbenutzer

Stand: 06.11.2026. **Nur Neon-Projekt `icy-wave-78750589`, Branch `development` (`br-super-leaf-b9jj8n9p`). Keine Live-Website und kein Neon-Branch `production`.**

## Angelegt und über Neon verifiziert

- Ein erster Neon-Auth-Benutzer für das temporäre FOTOPOLIS-Setup-Postfach wurde angelegt. **Die E-Mail-Adresse wird nicht in Frontend-/Netlify-Code oder dieser Dokumentation hinterlegt.** Das vom Nutzer im Gespräch gesprochene „Photopolis“ kann in der Schreibweise vom vorher vorgeschlagenen „Fotopolis“ abweichen; die exakte Adresse muss vor dem Aktivieren geprüft werden.
- Der Benutzer ist mit der FOTOPOLIS-Anwendungsrolle `owner` in `fotopolis.admin_members` verknüpft. **`enabled = false`**, bis Besitz und Verifikation der Zieladresse sowie die serverseitigen Autorisierungschecks eindeutig nachgewiesen sind.
- Neon Auth `neon_auth.user.emailVerified = false`; **keine** Passwortvergabe und **kein** Versand einer Bestätigungsmail behauptet.
- Öffentliche Self-Sign-ups in Neon Auth sind **deaktiviert**, E-Mail-Verifizierung ist erforderlich, und nach Passwort-Reset werden bestehende Sessions widerrufen.
- Ausschließlich die bekannte isolierte Netlify-Preview-Origin `https://deploy-preview-2--fotopolis-preview.netlify.app` wurde für Better Auth auf `development` in die Trusted-Origins-Liste aufgenommen.
- Die Anmeldung via Neon Auth **Email OTP** ist für das Ziel vorgesehen: `emailOtp.sendVerificationOtp({ email, type:'sign-in' })`, danach `signIn.emailOtp({ email, otp })`. Diese APIs sind [offiziell dokumentiert](https://neon.com/docs/auth/guides/plugins/email-otp). Ohne OTP-Nachweis und funktionierenden geschützten Backend-Auth-Check bleibt die Adminfreigabe deaktiviert.

## Nächste verbindliche Schritte

1. Schreibweise/Empfang der temporären Mailadresse bestätigen, ohne Passwort oder OTP an den Assistenten zu übermitteln.
2. Eigene Neon Auth-Anmeldeseite mit offiziellem SDK und E-Mail-OTP auf der Preview einrichten. Exakte Abhängigkeiten, Builds, Bundle-CSP und Cross-Origin-Cookie-Verhalten prüfen, nicht mit beliebigen fremden CDNs oder selbst erfundenen Auth-Endpunkten abkürzen.
3. Serverseitige Auth- und RBAC-Prüfung für alle echten Verwaltungsendpunkte: Neon Auth JWT kryptografisch verifizieren und `fotopolis.admin_members.enabled` und Rolle in Neon Postgres nachschlagen; keine serverseitige Datenbankverbindung ohne sichere, Branch-spezifische Umgebungsvariablen und Least-Privilege-Rolle.
4. Erst nach erfolgreicher E-Mail-Verifizierung und negativer 401/403-Testmatrix den ersten `owner` explizit freischalten. Produktive Geräte, Buchungen und Kundeninformationen erst nach gesonderter Abnahme verwenden.
5. Die bestehende öffentliche [`/admin/`-Demo](https://deploy-preview-2--fotopolis-preview.netlify.app/admin/) bleibt ohne Auth und ohne Persistenz; **keine** Behauptung, sie sei bereits ein echtes, zugriffsgeschütztes Adminportal.

**Wichtig:** Ein Neon-Auth-Benutzer ist nicht identisch mit der Neon-Cloud-Organisation oder einer PostgreSQL-Superuser-Rolle. Die FOTOPOLIS-Rolle `owner` berechtigt nur später innerhalb der eigenen Anwendung, nachdem der Zugriff ausdrücklich aktiviert und geprüft wurde.
