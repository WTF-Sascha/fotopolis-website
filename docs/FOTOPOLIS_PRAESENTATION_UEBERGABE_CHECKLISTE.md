# FOTOPOLIS – Präsentationsleitfaden und Abnahmeprotokoll

**Stand:** 7. November 2026  
**Geltungsbereich:** ausschließlich isolierte Design-/Verwaltungsvorschau  
**Vorschau:** https://deploy-preview-2--fotopolis-preview.netlify.app/  
**Verwaltung:** https://deploy-preview-2--fotopolis-preview.netlify.app/admin/login/  
**Detaillierter technischer Bericht:** [FOTOPOLIS_PRESENTATION_QA_REPORT_2026-11-07.md](./FOTOPOLIS_PRESENTATION_QA_REPORT_2026-11-07.md)

## 1. Präsentationsablauf (ohne Datenänderungen)

1. **Markenauftritt:** Startseite öffnen, Original-Logo, Marineblau/Champagnergold, bildfreien Hero und Hauptnavigation vorstellen.
2. **Fotoerlebnisse:** Fotobox, Fotospiegel und Fotowohnwagen zeigen. Bilder sind *Produktvisualisierungen*, keine nachgewiesenen realen Eventreferenzen.
3. **Galerie:** Drei Produktwelten zeigen; Bilddialog und Tastaturbedienung (Pfeile, Escape). Keine ungeprüften Personenfotos.
4. **Anfrage:** Kontaktformular durchlaufen. **Wichtig:** Es erzeugt derzeit einen E-Mail-Entwurf im Gerät des Besuchers; es erfolgt kein automatischer Versand und keine Bestätigung über einen Buchungsserver.
5. **Verwaltung:** Über `/admin/` zur geschützten Anmeldung; mit dem persönlichen Admin-Zugang anmelden.
6. **Datenbestand:** Drei gespeicherte Geräte zeigen. Die aktuellen Kennungen `BOX-01`, `MIRROR-01`, `WAGEN-01` sind lediglich vorhandene Datenbankkennungen und müssen mit physischen FOTOPOLIS-Geräten abgeglichen werden. Alle drei sind zunächst deaktiviert.
7. **Kalender und Verwaltung:** Monat/Woche, Tagesdetails, interne Sperrzeiten und Reservierungen erklären. Eine Konfliktvorprüfung ist nur eine Momentaufnahme; der endgültige Konfliktschutz liegt beim Speichern in der Datenbank.
8. **Einordnung:** Keine Aussage zu garantierten Preisen, Verfügbarkeit, automatischem Versand, Online-Sofortbuchung oder Produktivfreigabe treffen.

## 2. Tatsächlich verifizierter Stand

- GitHub Draft-PR, Netlify-Development-Preview und Neon-Development-Verbindung verfügbar.
- Öffentliches Layout-/Visual-QA über zwölf Seiten, mehrere mobile/desktop Breakpoints und interaktive Kontakt-/Galerieabläufe erfolgreich.
- Geschützte Anmeldung bereits durch den Projektverantwortlichen einmal erfolgreich bestätigt, Admin-Regressionen erfolgreich.
- Echtes Neon-Ergebnis am 7.11.2026: drei `resources`, null `allocations`, drei `admin_activity`-Einträge, null aktivierte Ressourcen.
- **Nicht** als funktional abgenommen gelten: Geräteaktivierung nach erneuter Anmeldung, echte Wartung/Sperre, echte Reservierung, Storno, Buchungskonflikt, Auditeintrag nach Terminaktion sowie öffentliche Kundenbuchung.

## 3. Sichere finale Betreiber-Abnahme (mit persönlichem Login)

**Keine erfundenen Testbuchungen auf echten Ereignisdaten anlegen.** Zuerst intern vereinbaren, welches tatsächlich existierende Gerät für einen kontrollierten Test benutzt werden darf und ob das System ausschließlich Testdaten enthalten soll.

| Test | Erwarteter Nachweis | Status |
|---|---|---|
| A1 – Geräteidentität | Eine Kennung entspricht einem bestätigten physischen Mietgerät | Offen |
| A2 – Aktivieren | Berechtigter Owner kann bestätigtes Gerät aktivieren; nach Seiten-Reload weiterhin aktiv | Offen |
| A3 – Umbenennen | Gerätename wird korrekt gespeichert; Änderungsprotokoll enthält Aktion | Offen |
| A4 – Sperrzeit | Kontrollierte Wartung/Sperre wird gespeichert und nach Reload angezeigt | Offen |
| A5 – Konflikt | Zweite Belegung im gleichen Zeitfenster wird serverseitig abgewiesen | Offen |
| A6 – Vormerkung | Kontrollierter interner Termin mit ausdrücklich gewählten Vor-/Nachlaufpuffern wird gespeichert | Offen |
| A7 – Storno / Aufhebung | Eintrag wird widerrufen; Verfügbarkeit und Protokoll werden entsprechend aktualisiert | Offen |
| A8 – Rollen / Sitzungen | Viewer darf nicht schreiben; abgelaufene Sitzung erfordert Anmeldung | Offen |
| A9 – Handy | Derselbe Ablauf ist auf Smartphone ohne verdeckte Schaltflächen möglich | Offen |

Das Protokoll erst mit **„Bestanden“** ausfüllen, wenn der reale Schritt tatsächlich durchgeführt und die Wirkung nach erneutem Laden bestätigt wurde. Bloße grüne Unit-Tests sind dafür kein Ersatz.

## 4. Release-Stopper

1. Vollständige und korrekte Anbieterangaben für das Impressum; finale Datenschutzerklärung passend zu Hosting, Authentifizierung, Kontaktdaten und allen tatsächlich verwendeten Diensten.
2. Freigabe des Betreibers für veröffentlichte Produktdetails, Kontaktadresse, Bestandszuordnung, Fotos und Leistungsversprechen.
3. Realer Test von Anfragen, E-Mail-Zustellung und interner Disposition; vor öffentlicher Buchbarkeit zusätzliche Geschäftslogik und Buchungsbedingungen.
4. Explizite Freigabe für Wechsel von der isolierten Preview auf die reale Domain. Die bestehende Website bleibt bis dahin unverändert.

## 5. Übergabeunterlagen

- Quellcode und Änderungen: [Draft-Pull-Request #2](https://github.com/WTF-Sascha/fotopolis-website/pull/2)
- Technischer Qualitätsbericht: [Präsentations-QA](./FOTOPOLIS_PRESENTATION_QA_REPORT_2026-11-07.md)
- Handover: dieses Dokument
- Visual-QA und Browserprotokolle: GitHub Actions „FOTOPOLIS Premium V2 Visual QA“ und „FOTOPOLIS Admin Studio Integration QA“

**Freigabestatus:** für moderierte interne Präsentation geeignet, noch kein öffentlicher Produktivbetrieb. Kein Merge nach `main` und keine DNS-/Domainänderung durchgeführt.
