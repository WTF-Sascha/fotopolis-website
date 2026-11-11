# FOTOPOLIS · Interne Verwaltungs-App – Betrieb und Anmeldung
Stand: 11. November 2026 · Entwicklungsbranch `feature/studio14-consolidation-20261111`, PR #20 Draft.
**Keine Live-Freigabe, kein Merge und keine echten Kundendaten-/Geräteänderungen.**

## 1. Welche Anfrage landet wo?

### Bestehende Live-Website `https://fotopolis-mieten.de/`
- Das öffentliche alte Kontaktangebot verweist auf `kontakt@fotopolis-mieten.de`, Telefon und WhatsApp.
- Diese Kanäle laufen **nicht** über Netlify Forms des neuen Entwicklungsprojekts und synchronisieren derzeit **nicht** automatisch in Neon.
- Vor dem Livewechsel müssen diese Kanäle durch Verantwortliche weiter manuell überwacht werden. Kein unbeauftragter E-Mail-/WhatsApp-Abruf.

### Neue isolierte Netlify-Deploy-Preview `https://deploy-preview-20--fotopolis-preview.netlify.app/`
1. Der Besucher wählt Fotobox/Fotospiegel/Fotowohnwagen, Datum und optional eines der 44 Designs; Kundenfoto-Dateien bleiben browserlokal.
2. Das Kontaktformular sendet an Netlify Forms `fotopolis-studio9-anfrage`. Netlify ist der **maßgebliche Eingangsnachweis**.
3. Die unveränderliche Anfrage-ID `fp_request_key` wird **vor** dem Form-POST erzeugt und im Netlify-Formular mit gespeichert.
4. Neuer DEV-Serverauslöser `formSubmitted`: Nach **verifizierter** Netlify-Formularannahme nimmt die eventbasierte Function `fotopolis-studio14-form-events.mjs` den Datensatz entgegen und trägt ihn mit identischer UUID in `fotopolis_studio13.inquiries` ein. Ein `UNIQUE(request_key)` verhindert Doppelanlage; Browser-Fallback bleibt kompatibel. Eingabefelder/Einwilligung/Honeypot werden geprüft; kein PII-Logging.
5. Über `/admin/dashboard/#eventanfragen` kann ein berechtigter Administrator den Neon-Datensatz filtern und den Status `neu → in_pruefung → angebot → abgeschlossen` oder `abgesagt` setzen. **Die Statusbearbeitung erzeugt noch keine Buchung.**
6. Netlify Forms und Neon bleiben **zwei Speicherorte**; eine Abweichung muss erkennbar abgeglichen werden. Ein vollständiger nachgelagerter Replay-/Reconciliation-Job bei Ausfall ist noch **nicht** implementiert. Browser-/Unit-Tests beweisen keinen verifizierten Live-Form-Event-Eingang.

Befund bei letzter read-only Abfrage: Netlify Forms `0` Submissions, Neon DEV `0` Inquiry-Kopien. Keine echte E2E-Einsendung durchgeführt, keine E-Mail-Benachrichtigung an Kunden oder Betreiber ausgelöst oder bestätigt.

## 2. Zugang zur internen App

- Einstieg: `/admin/`
- Direkte Anmeldung: `/admin/login/`
- Hauptverwaltung: `/admin/dashboard/`
- Anfrage-Posteingang: `/admin/dashboard/#eventanfragen`
- Termin-/Geräteverwaltung: `/admin/dashboard/#calendar` und `#inventory`
- Buchungs- und Sperrzeitenplanung: `#bookings`, `#planning`
- Design Studio (44 geschützte Print-Overlays): `/admin/designstudio/`
- Designfreigaben: `/admin/dashboard/#designs`
- Rollen, Inhalte, Medien und Analytics: jeweils über Dashboard-Navigation.

**Anmeldung:** In der Entwicklungs-Preview muss zuerst die Netlify-Team-SSO-Schranke passiert werden. Danach `Neon Auth`: bestehende Team-E-Mail-Adresse und persönliches Passwort; beim ersten Mal per `Passwort festlegen` einen Code an das **bereits vorhandene** berechtigte Postfach senden lassen. Der Server prüft zusätzlich einen **aktiven** Eintrag in `fotopolis.admin_members`. Ein beliebiges Neon-Auth-Konto gewährt noch keinen Zugang. Bei der Bestandsaufnahme war genau **eine aktive Owner-Rolle** registriert; aus der Anzahl geht nicht hervor, ob der Nutzer selbst die Zugangsdaten hat.

**Installierbare Staff-PWA:** Die Staff-Oberfläche hat einen eigenständigen Web-App-Metadatenpfad `/admin/manifest.webmanifest` mit `id`, `start_url` und `scope` `/admin/`, offiziellen Goldmark-Icons und Direktaktionen. Die öffentliche Marken-PWA bleibt separat `/`. Mitarbeitende können die Admin-Web-App über die Installationsfunktion ihres Browsers auf Mobilgerät/Desktop hinzufügen, sobald die Test-URL und SSO-Zugriff verfügbar sind. Netzwerkzugriff ist für die geschützten Funktionen erforderlich. Der öffentliche Service Worker speichert **keine** `/admin/`-URLs oder `/api/`-Antworten.

## 3. Verwaltungsfunktionen und Grenzen

| Modul | Vorhanden in DEV | Stand für produktiven Einsatz |
| --- | --- | --- |
| Persönliche Anmeldung + JWT + Serverrollen | Ja, bestehende Owner-Rolle | Positiver echter Login auf Deploy Preview erforderlich |
| Interner Arbeitsbereich mit mobilem Dashboard | Ja | Responsive Browser-QA/Team-SSO-Praxis prüfen |
| Eventanfragen/Status/Filter | Ja, Neon-Verwaltungskopien | Verifizierte Form→Event→Neon-E2E und Recovery-Reconciliation fehlen |
| Geräteverwaltung | Ja, `fotopolis.resources` | Drei bekannte Ressourcen waren in DEV deaktiviert; Aktivierung nur nach realem Bestandsabgleich |
| Kalender, Sperrzeiten, Reservierungen | Ja, `fotopolis.allocations` | Keine gespeicherten DEV-Reservierungen; reale Geräte- und Konflikttests fehlen |
| Drucklayouts | 32 Classics + 12 Signatures | Signatures ohne eingebrannte Katalogtitel; Classics benötigen Einzelprüfung |
| Website-Texte, Medien, Rollen, Analytics | Vorbereitete Module | Rollen- und Datenschutz-/Berechtigungsabnahme offen |
| Automatische E-Mail-/WhatsApp-Zusammenführung | Nein | Kein Zugriff auf bisherige Betreiberkanäle; gesonderte Einwilligung/Integration erforderlich |
| Bestätigung/Angebote/Bezahlung | Nicht als vollständiger Ablauf | Status `abgeschlossen` ist **kein** versandtes Angebot/keine automatisch rechtsverbindliche Buchung |

## 4. Vor der Freigabe durchführen

1. Genau einen vom Betreiber freigegebenen **synthetischen** Staging-Formulartest senden, Netlify-Submission mit `fp_request_key` vergleichen, serverseitigen `formSubmitted`-Event und genau **einen** Neon-Inquiry-Datensatz mit identischer UUID verifizieren; dann ein zweites Event simulieren und Idempotenz nachweisen.
2. Netlify Forms → Neon Replay-/Reconciliation-Mechanismus bei temporärem Datenbankausfall aufsetzen und auf fehlende Anfragen alarmieren.
3. Auth: Owner-Login + 403 für nicht freigegebene Rollen, Passwort zurücksetzen, Session-Verlust, Team-SSO auf Desktop/Mobilgerät und installierte PWA testen.
4. Geräte nur mit tatsächlicher Anzahl/Verfügbarkeit aktivieren, echte Reservierung/Überlappungsprüfung auf DEV mit synthetischen Daten testen und zurücksetzen.
5. 44 Drucklayouts visuell prüfen, insbesondere mögliche eingebrannte Classics-Texte. Physische 15×10 cm Druckproofs und Markenfreigabe einholen.
6. DSGVO: Auftragsverarbeitung, Empfängerrollen, Löschfristen, Benachrichtigungen und ggf. externe Anfragekanäle prüfen.
7. Bis dahin: **NO-GO für Live.** Alte Kontaktwege weiterhin aktiv prüfen.
