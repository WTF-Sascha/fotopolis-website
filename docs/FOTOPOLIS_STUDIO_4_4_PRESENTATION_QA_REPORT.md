# FOTOPOLIS – Präsentations- und Qualitätsbericht 4.4

**Datum:** 07.11.2026  
**Gegenstand:** Isolierte Website und geschütztes Management Studio in `WTF-Sascha/fotopolis-website`, Branch `design/premium-v2`, Draft-PR #2, Netlify Deploy Preview.  
**Freigabeempfehlung:** Für eine **begleitete Präsentation** geeignet; **nicht** als fertig abgenommene Produktionsanwendung freigeben.

## 1. Ziel und Abgrenzung

Die Präsentation soll Fotoerlebnisse und Verwaltung als hochwertiges zusammenhängendes FOTOPOLIS-Produkt zeigen – ohne sichtbare Entwicklungsnummern, irreführenden Demo-Kalender, unrechte Eventaufnahmen oder übermäßige Techniktexte. **Eine Präsentationsfassung ist kein Live-Release:** Die Produktionsdomain bleibt unangetastet, die Branch-Trennung, Rollenrechte, noindex und Schutz der Datenbank bleiben aktiv. Fehlende Buchungsfunktionen und unfertige Pflichttexte dürfen nicht als fertig oder rechtswirksam dargestellt werden.

## 2. Durchführung und Prüfnachweise

1. **Quellcode- und Inhaltskontrolle:** Startseite, 11 redaktionelle Unterseiten, altes /admin/, Login, Dashboard, Geräteverwaltung, Sperrzeiten, Vormerkungen, Statusmeldungen, Galeriedaten und Build-Prozess wurden auf widersprüchliche Labels, Demo-Funktionen und Veröffentlichung ungeklärter Eventfotos geprüft.
2. **Automatisierte Browser-QA:** Vollständiger Netlify-Preview-Build in GitHub Actions mit Playwright: HTTP-Routen, Bilder, Semantik, Breakpoints, Menü, Dialoge, Kalender und passwortbasierte Admin-UI; mit **simulierten Antworten** für geschützte Schreibabläufe. Siehe [Premium Visual QA](https://github.com/WTF-Sascha/fotopolis-website/actions/workflows/premium-concept-qa.yml) und [Admin Integration QA](https://github.com/WTF-Sascha/fotopolis-website/actions/workflows/admin-studio-qa.yml).
3. **Eigener Präsentations-Gate:** `scripts/premium-presentation-qa.mjs` kontrolliert die 12 öffentlichen Seiten und 3 Admin-Routen im tatsächlichen Build auf störende Prototyptexte, ungeprüfte Personenbilder, vollen Zugangsschutz, rechtliche Transparenz und Entfernung des alten Admin-Demos.
4. **Echte Neon-Lesekontrolle:** Entwicklungsbranch `br-super-leaf-b9jj8n9p` enthält **3 registrierte Geräte** (Fotobox, Fotospiegel, Fotowohnwagen), davon **0 aktiviert**, **0 Terminbelegungen** und **3 Aktivitätseinträge**. Gerätecodes: `BOX-01`, `MIRROR-01`, `WAGEN-01`. Es wurden für dieses Audit **keine** Daten geändert.
5. **Direkte Rollenprüfung der Datenbank:** Spaltenberechtigungen für Geräteanlage/-änderung, Kalender-Sperrzeiten, Reservierungen und Leserechte sind auf gesonderte PostgreSQL-Rollen verteilt. Das beweist vorhandene Grants, **nicht** den kompletten authentifizierten Browser-Speicherablauf.
6. **Netlify-Bereitstellung:** Deploy Preview erfolgreich erstellt. Ein vorheriger Präsentations-Build scheiterte an einer veralteten Bildanzahl-Prüfung und wurde korrigiert. Keine Veröffentlichung auf `fotopolis-mieten.de`.
7. **Separater Premium-Release-Gate für `site/`:** Im bestehenden Produktionszweig weiterhin **9 offene Punkte**: keine finalen Realbilder, kein authentisches Galerieportfolio, lediglich mailto statt Backend-Anfragen, fehlende eingebundene Premium-Webfonts, rechtlich unvollständige Seiten. Das ist keine Aussage darüber, dass die *neue* isolierte Vorschau nicht startet, sondern hält die **Produktionsfreigabe** bewusst gesperrt.

### Prüfstatus (differenziert)

| Bereich | Nachweis | Stand |
| --- | --- | --- |
| Präsentationsseiten und responsive Layouts | Playwright im generierten Preview-Build | **Automatisiert erfolgreich getestet** |
| Geschütztes Admin-Login und Komponenten | Admin-Browser- und Autorisierungstests | **Automatisiert erfolgreich getestet** |
| Geräte-Erstanlage | Drei Datensätze und Aktivitätseinträge in Neon | **Dauerhafte Speicherung nachgewiesen** |
| Geräteaktivierung/-änderung | Rechte bestätigt; Browserablauf mit Test-Callbacks | **Mit echtem Konto noch nicht end-to-end abgenommen** |
| Sperrzeit anlegen/aufheben | Backend vorhanden, Konfliktlogik getestet, 0 echte Einträge | **Mit echtem Konto noch nicht end-to-end abgenommen** |
| Interne Reservierung, Bestätigung, Stornierung | Schnittstellen, Mock-Browser- und Unit-Tests; 0 echte Einträge | **Mit echtem Konto noch nicht end-to-end abgenommen** |
| Read-only Belegungsprüfung | API-Validierungs- und Sicherheitstests, SQL-Leseplan | **Technisch geprüft; kein echter Buchungsnachweis** |
| Galerie | Nur drei bereits freigegebene Produktvisualisierungen | **Präsentationsfähig; kein freigegebenes Realportfolio** |
| Eventanfrage | Browserformular und vom Anwender selbst gestarteter mailto-Entwurf | **Funktioniert lokal; kein automatischer Versand** |
| Automatische Kundensynchronisierung, öffentliche Buchung, Zahlungsabwicklung | Nicht implementiert | **Nicht freigeben / nicht versprechen** |
| Impressum und Datenschutz | Fehlende vollständige Angaben inhaltlich ausdrücklich ausgewiesen | **Blocker für öffentlichen Livegang** |
| Operative Übernahme durch neuen Betreiber | Noch kein gemeinsam abgenommenes Übergabeprotokoll | **Offen** |

## 3. Bereits durchgeführte Präsentationsbereinigung

- Entwicklungs- und Versionsbanner im Login, Dashboard, auf der Startseite und in den redaktionellen Seiten entfernt; hochwertige FOTOPOLIS-Markenbezeichnungen erhalten.
- Die Startseite und die Galerie auf ausschließlich bekannte Produktvisualisierungen umgestellt. Eventaufnahmen mit ungeklärter Personenfreigabe werden nicht in die Preview-Ausgabe kopiert. Die tatsächliche Ausstattung wird weiterhin individuell bestätigt; keine gefälschten Referenzen.
- Die alte rein lokale `/admin/`-Demoseite aus dem Build entfernt. Der Einstieg führt zur echten, geschützten `/admin/login/`-Seite; keine scheinbar dauerhaft gespeicherten Demo-Sperrzeiten.
- Der Einrichtungsassistent ist erhalten, befindet sich aber **unterhalb des operativen Dashboards beim Konto-/Systembereich**, damit die Kernfunktionen bei einer Vorführung im Vordergrund stehen.
- Neutrale und aussagekräftige Betriebslabels im Kalender, Gerätebestand, Änderungsprotokoll und Kontaktprozess eingeführt.
- Testfälle angepasst und ein verpflichtender Präsentations-Gate ergänzt.
- Alle Änderungen ausschließlich in `design/premium-v2`, kein Merge nach `main`, keine produktiven Datensätze verändert.

## 4. Konkrete Defekte, Risiken und offene Funktionstests

### P0 – Funktionelle Abnahme vor der Übergabe

1. **Der tatsächliche Gerätebestand ist vollständig deaktiviert.** Es ist derzeit weder eine echte Geräteaktivierung noch eine durchgängige Terminbelegung im produktnahen Arbeitsablauf nachgewiesen. Mit Betreiberfreigabe muss ein vorhandenes Gerät aktiviert, ein erlaubter Termin angelegt, erneut geladen, auf Kollision geprüft und sauber storniert bzw. aufgehoben werden. Keine ungefragten echten Termine erzeugen.
2. **Alte lokale Entwurfsmodi für Rollen ohne Schreibzugang sind noch vorhanden.** In Inventory/Planning existieren rein lokale Fallback-Abläufe. Das ist fachlich transparent gekennzeichnet, aber für eine professionell übergebene Verwaltung missverständlich: Entwürfe verschwinden nach Reload. Im nächsten Update für nicht schreibberechtigte Rollen eine eindeutig schreibgeschützte Ansicht statt scheinbar funktionaler Speichermasken etablieren.
3. **Reale Fehlerpfade bei Betreiberrechten prüfen:** JWT-Ablauf, Sessionwechsel, deaktiviertes Gerät, Überschneidung, falscher Zeitraum, Speicherdienst nicht erreichbar, wiederholtes Submit, mobile Darstellung nach Serverfehler. Bisher sind diese Fälle nur teilweise simuliert.

### P1 – Präsentation, Betrieb und Freigabekriterien

4. **Rechtliche Seiten nicht vollständig:** Originale Betreiberpflichtangaben, ladungsfähige Anschrift, Kontakt, verantwortliche Stelle und vollständige Datenschutzerklärung prüfen/freigeben lassen. Die Preview muss unindexiert bleiben, bis die Angaben vorliegen.
5. **E-Mail-Kontakt noch kein echter digitaler Anfrageeingang:** Der aktuelle Kontaktfluss öffnet einen lokalen E-Mail-Entwurf. Für den späteren Betrieb Spam-Schutz, Versandbestätigung, Protokollierung, Aufbewahrung und DSGVO abgestimmt implementieren. Keine unbelegte Aussage über automatisch eingegangene Anfragen.
6. **Bildrechte und Ausstattung:** Historische Eventbilder dürfen erst mit den notwendigen Rechten wieder aufgenommen werden. Produktvisualisierungen nicht als authentische Veranstaltungsfotos oder endgültige Leistungszusage kennzeichnen.
7. **Übergabe an tatsächlichen Betreiber:** Rechteverteilung, Zugangswechsel, Domain/DNS, Mailpostfach, Netlify/GitHub/Neon-Eigentümerschaft, Backups, Kosten und Wiederherstellung dokumentieren; getrennte Test-/Produktivkonfiguration bestätigen.
8. **Performance- und Accessibility-Abschluss:** Browser-Responsive-Tests bestanden, aber kein dokumentierter realer mobiler Netz-Lasttest, Screenreader-Abnahme oder vollständiger Security-Penetrationstest.

### P2 – Nach dem internen MVP

9. Öffentliche Verfügbarkeits- und Buchungsstrecke nur mit echten Geräten, Preisen, Sperrregeln, Mietbedingungen, Double-Booking-Schutz und Datenschutzfreigabe konzipieren.
10. Rollen- und Berechtigungsoberfläche, vollständige Übergabedokumentation und gegebenenfalls ein datensparender, schreibgeschützter Präsentationszugang nach Bedarf ergänzen.

## 5. Verbindlicher Vorschlag für das nächste Update

**FOTOPOLIS Studio 4.5 – Operative Funktionsabnahme & Übergabequalität**

1. Lokale Nicht-Speicher-Fallbacks für nicht autorisierte Rollen entfernen und Berechtigungs-/Fehlermeldungen eindeutig gestalten.
2. Echte Admin-End-to-End-Prüfung an den vorhandenen drei Geräten, einschließlich Aktivierung, Reload, Konfliktprüfung und Storno/Aufhebung; ausschließlich nach expliziter Betreiberfreigabe für Testmutationen.
3. Kalender und Formularzustände für leere Bestände, Fehler, Ladezustand und Rollengrenzen konsistent härten.
4. Ein vollständiges Smartphone- und Desktop-Abnahmeprotokoll erzeugen, einschließlich reproduzierbarer Bildschirmnachweise und 0 kritischen JS-/HTTP-Fehlern in den durchgeführten Tests.
5. Betreiber-Handbuch und Übergabe-Checkliste fertigstellen; offene Freigaben (E-Mail, Preise, Recht, Fotos) als separate Aufgaben erfassen.

**Freigabegrenze:** Fertige Präsentationsoberfläche ≠ rechtliche, betriebliche oder technische Produktionsfreigabe. Die bestehende Live-Domain und `main` bleiben bis zur ausdrücklichen Freigabe unangetastet.
