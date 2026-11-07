# FOTOPOLIS – Präsentationsabnahme und technischer Qualitätsbericht

**Datum:** 7. November 2026  
**Prüfgegenstand:** isolierte Netlify-Deploy-Preview / GitHub-Branch `design/premium-v2` / Neon-Branch `development`  
**Freigabeempfehlung:** **Für eine moderierte Präsentation geeignet. Nicht für den öffentlichen Produktivbetrieb freigegeben.**

## 1. Prüfmethoden und belastbare Nachweise

- Quellcodeprüfung: Startseite, zwölf öffentliche Seiten, Administrator-Login, geschütztes Dashboard, Inventar-, Wartungs-, Termin- und Kalenderverwaltung, Build-Pipeline, Authentifizierung und Rollen-Gateways.
- GitHub-Browser- und Visual-QA: zwölf öffentliche Seiten über neun Bildschirmbreiten; vollständige Formulardurchläufe, Bildladeprüfungen, Galeriedialog, mobile Menüs, Layout-Overflow, Lint-/Sicherheits- und Admin-Regressionen. Referenzlauf: [Premium V2 Visual QA 42407511554](https://github.com/WTF-Sascha/fotopolis-website/actions/runs/42407511554), erfolgreich.
- Geschützter Admin-Test: [Admin Studio QA 42408333098](https://github.com/WTF-Sascha/fotopolis-website/actions/runs/42408333098), erfolgreich. Die Browser-Tests verwenden simulierte Authentifizierung / Testdaten und **ersetzen nicht** die finale Owner-Abnahme.
- Manuelle Bildprüfung: aufgezeichnete CI-Screenshots von Startseite (Desktop, Tablet, Mobil), Galerie (Mobil), Administratoranmeldung (Desktop, 320 px), Dashboard (1440/320 px), Geräte- und Terminformularen (Desktop/Mobil). Grundlayout, mobile Navigation und visuelle Markenführung sind konsistent; besonders lange Smartphone-Dashboards bleiben verbesserungsfähig.
- **Echter Neon-Nachweis:** im Development-Branch drei Datensätze in `fotopolis.resources`, null in `fotopolis.allocations` und drei `fotopolis.admin_activity`-Einträge. Die Einheiten `BOX-01` (Fotobox), `MIRROR-01` (Fotospiegel) und `WAGEN-01` (Fotowohnwagen) sind alle **deaktiviert**. Keine Testbuchungen angelegt, keine Bestandsdaten verändert.
- Netlify-Anwendungsprotokolle im geprüften Fenster zeigen drei erfolgreiche HTTP-201-Antworten für Geräte-Anlageaufrufe. Eine persönliche Ende-zu-Ende-Prüfung aller Bearbeitungs-, Aktivierungs- und Terminaktionen ist daraus nicht ableitbar.
- Allgemeines `FOTOPOLIS Quality Gates`-Workflow-Ergebnis: **absichtlich nicht vollständig grün**, weil der separate Premium-/Produktivfreigabe-Check rechtliche, inhaltliche und operative Freigaben verlangt. Technische und Browser-Jobs waren erfolgreich. Diese gesperrte Freigabe darf nicht als bloßer Schönheitsfehler behandelt werden.

## 2. Präsentationsbereinigung – umgesetzt

| Bereich | Änderung | Prüfung |
|---|---|---|
| Startseite und öffentliche Inhalte | Sichtbare Versions-, Review- und Entwicklungskennzeichnungen entfernt; freigegebene Bildsprache, Logo, Hero und Marineblau-/Gold-Farbwelt beibehalten | Browser-/Visual-QA |
| Admin-Anmeldung | Professionelle Zugangsansicht; kein Entwicklungslabel; technischer Anbietertext entfernt | Auth-Browser-QA und Screenshotprüfung |
| Dashboard | Neutrale Verwaltungsbezeichnungen statt Datenbank-/Preview-/Entwicklungshinweisen; wahrheitsgemäße Funktionsbeschreibungen | Admin-Integration |
| `/admin/` | Veraltete, rein lokale Verwaltungsdemo aus dem Deployment entfernt; Weiterleitung zur echten geschützten Anmeldung | Redirect-Test |
| Galerie | Keine ungeprüft freigegebenen Veranstaltungsbilder mit Personen; nur die drei intern freigegebenen Produktinszenierungen | Rechte- und Image-Gate |
| Galeriebedienung | Redundante Filter einer einzelnen Bildkategorie entfernt; Bilddialog, Pfeiltasten und Escape bleiben bestehen | aktualisierte Galerie-QA |
| CI | Präsentations-Gate für 15 öffentliche/geschützte Routen, noindex, Alt-Demo-Abwesenheit, freigegebene Bilder und angemessene Beschriftung | automatischer Regressionstest |

**Wichtig:** Die Sicherheits- und Geschäftsregeln wurden **nicht** durch kosmetisches Entfernen von Warnungen deaktiviert. Kein Merge nach `main`, keine Änderungen an `fotopolis-mieten.de`, Mammut oder RM Inventory. Die Preview bleibt `noindex`.

## 3. Funktionsmatrix – verifiziert versus noch nicht persönlich abgenommen

| Funktion | Technischer Befund | Offene Abnahme |
|---|---|---|
| Passwort-Login & geschützte Admin-Ansicht | Nutzerseitig zuvor erfolgreich bestätigt; CI erfolgreich | Sessionablauf nach erneuter Anmeldung |
| Geräte dauerhaft erstellen | Echter Neon-Bestand: drei gespeicherte Geräte, drei Audit-Einträge | Gerätekennungen und physische Zuordnung mit Betreiber prüfen |
| Geräte aktivieren/deaktivieren & umbenennen | RBAC-API vorhanden und Tests erfolgreich | Reale Bedienung; alle drei Geräte momentan deaktiviert |
| Interne Monats-/Wochenansicht | Browser-, Datumssprung- und Mobile-Tests erfolgreich | Darstellung echter Belegungen überprüfen |
| Wartung & Sperrzeit speichern/aufheben | API und Konfliktlogik automatisiert geprüft | Noch keine echte gespeicherte Belegung als Nachweis |
| Vormerkung, Bestätigung & Storno | APIs und Mock-End-to-End-Tests vorhanden | Speicherung mit eigenem Login, Prüfung kompletter Logistikfenster und Storno |
| Belegung vorab prüfen | Authentifizierte, nur lesende Vorprüfung / Kollisionslogik getestet | Echte Belegungskonflikte und Race-Condition testen |
| Änderungsprotokoll | Drei tatsächliche Aktionen nachgewiesen; Lesezugriff geschützt | Bearbeiten/Aktivieren/Terminänderungen gegen Audit abgleichen |
| Öffentliche Kontaktanfrage | Lokaler mehrstufiger E-Mail-Entwurf, Validierung und Übergabe getestet | Echtes E-Mail-Programm und tatsächlichen Versand kontrollieren; kein integrierter Serverversand |
| Öffentliche Sofortbuchung / Kundenzahlung | Nicht implementiert oder freigeschaltet | Eigenes Produktvorhaben, kein Präsentationsversprechen |

## 4. Festgestellte Restmängel und priorisierte Updates

### P0 – Vor einem öffentlichen Livegang zwingend

1. **Impressum/Datenschutz nicht freigegeben.** Die neue Webanwendung hat keine vollständig geprüften rechtlichen Anbieter- und Datenschutztexte. Die bestehenden Angaben der bisherigen FOTOPOLIS-Website (offizielle Datenschutzseite: https://fotopolis-mieten.de/datenschutz.html) sind eine mögliche Recherchegrundlage, aber nicht ohne Prüfung auf Hosting, Neon Auth, Formulare und tatsächlich eingesetzte Dienste übertragbar. **Nicht künstlich als fertig darstellen.**
2. **Reale Geräte-/Termin-End-to-End-Abnahme:** Mit dem persönlichen Owner-Konto ein bestätigtes physisches Gerät aktivieren, nach Neustart nachweisen, eine Sperre speichern/aufheben, eine Vormerkung erstellen, Überschneidung abweisen, Vormerkung stornieren und Auditdaten prüfen. Erst dann interne Funktionsabnahme.
3. **Freigabe- und Sicherheitsprozess:** Prüfen, welche Datenbestände/Deployment-Umgebungen die späteren Verantwortlichen nutzen, und separates rechtliches/organisatorisches Go-live festhalten.

### P1 – Für eine überzeugende Übergabe an die Betreiber

4. **E-Mail- und Anfrageprozess:** Aktuell nur mailto-Entwurf. Entweder diesen Weg explizit als „Anfrage per E-Mail“ präsentieren oder einen eigenen, getesteten Versand-/Posteingang inklusive Datenschutz/Spam-Schutz implementieren.
5. **Inventar-Stammdaten und Logistikregeln:** Drei vorhandene Kennungen auf physische Geräte abgleichen, tatsächlichen Aktivstatus festlegen; zulässige Aufbau-, Abbau-, Transport- und Übergabepuffer dokumentieren.
6. **Berechtigungs- und Betreiberübergabe:** Zweite Admin-/Manager-Rolle nur nach definiertem Berechtigungsprofil, Einladungsprozess, Passwortwiederherstellung und dokumentierter Verantwortlichkeit.
7. **Präsentationsablauf mit echten Daten:** Ein sauberer, moderierter Rundgang über Bestandsliste, Gerätedetails, Wochenkalender, Sperre, Vormerkung und Status. Keine erfundenen Referenzen, Gäste oder Umsatzzahlen.

### P2 – Optimierung nach funktionaler Abnahme

8. **Mobile Dashboard-Dichte:** Auf 320 px ist die Darstellung funktionsfähig, aber lang und teils kleinteilig. Sektionen bei Bedarf einklappbar machen, Priorität der wichtigsten Aktionen erhöhen und Abstände/Tap-Targets erneut mit realen Geräten testen.
9. **Performance und Barrierefreiheit:** Lighthouse/Core-Web-Vitals und zusätzlicher Screenreader-/Tastatur-Check auf tatsächlicher Preview unter typischen Netzbedingungen; aktuell keine belastbare produktive Performance-Messreihe.
10. **Bildfreigabe und Angebotsdaten:** Reale Referenzfotos erst mit nachweisbaren Nutzungs-/Personenrechten ergänzen; bestätigte Pakete, Ausstattungsdetails und Preise später separat übernehmen.

## 5. Empfohlener nächster Sprint

1. Mit Betreiberkontozugriff **Inventar + Sperrzeit + Vormerkung + Audit** als echten, dokumentierten Vorgang abnehmen.
2. P0-Restmängel beheben und die Kontaktdaten/Anfrageziele durch die Betreiber bestätigen lassen.
3. Ein kompakteres mobiles Admin-Dashboard und ein geprüftes Betreiberhandbuch für die Übergabe.
4. Danach erst Entscheidung über öffentliche Buchung, E-Mail-Versand und spätere Produktivveröffentlichung.

**Abnahmeurteil:** Die Anwendung ist **für eine interne Design- und Funktionspräsentation geeignet**, aber **nicht produktionsreif**. Der technische Funktionsumfang ist weitgehend umgesetzt, die fehlenden persönlichen End-to-End- und Rechtsfreigaben sind transparent zu kennzeichnen.
