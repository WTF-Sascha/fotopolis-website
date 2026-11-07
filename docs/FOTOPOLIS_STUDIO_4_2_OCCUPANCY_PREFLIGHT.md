# FOTOPOLIS Studio 4.2 – Interne Belegungs-Vorprüfung

**Stand:** 07.11.2026 · Nur Entwicklungsbranch `design/premium-v2`, Draft-PR #2 und Netlify Deploy Preview. Keine Änderung an `main`, `fotopolis-mieten.de`, den anderen Apps oder Neon Production.

## Neuer Ablauf im Admin Studio

1. Über **Interne Vormerkungen** ein aktiviertes, tatsächlich registriertes Mietgerät wählen.
2. Die Veranstaltungszeiten in **Europe/Berlin** angeben und **beide** Logistikpuffer ausdrücklich festlegen.
3. Über **Belegung vorab prüfen** wird die genaue Belegungszeit als UTC-Bereich an die geschützte, **nur lesende** Netlify-Function übertragen.
4. Die Oberfläche meldet klar getrennt: Gerät deaktiviert, überschneidende Belegung vorhanden, aktuell keine Überschneidung erkannt, unzulässiges Zeitfenster oder Vorprüfung nicht erreichbar.
5. Nach jeder Feldänderung wird die vorherige Aussage verworfen. Ein Vorprüfungsergebnis ist niemals eine Buchungszusage.
6. Erst der getrennte, bereits vorhandene **Vormerkung speichern**-Vorgang führt eine schreibende Aktion aus. Die PostgreSQL-GiST-Exclusion-Constraint und der Zustand des Mietgeräts zum Speicherzeitpunkt entscheiden verbindlich über die interne Eintragung.

## Serverseitige Sicherheit

- Neue Function: `GET /api/fotopolis/admin/occupancy-check`.
- Signierter Neon Auth JWT und erneuter `fotopolis.admin_members`-Rollenabgleich vor jedem SQL-Zugriff; ausschließlich `owner` und `manager`.
- Preview-only-Guard; keine Ausgabe in produktiven Deploys.
- Nur die bereits vorhandene eingeschränkte Rolle `fotopolis_admin_dashboard_reader`, **kein Writer-Secret**.
- Genau drei zulässige Queryparameter: Resource-UUID, UTC-Startzeit und UTC-Endzeit.
- Dauer zwischen 15 Minuten und 14 Tagen; invalide bzw. uneindeutige Daten ausgeschlossen.
- DB-Abfrage prüft eine einzelne Ressource und die tatsächlich vorhandenen Belegungen in den Zuständen `held`, `confirmed` und `blocked`, mit halb-offener Intervallüberschneidung `[start,end)`.
- Stornierte Reservierungen dürfen eine mögliche interne Eintragung nicht blockieren.
- Kein Kundenname, keine E-Mail, kein Preis, keine Ermittlung fremder Gerätestammdaten, keine DB-Schreiboperation, `Cache-Control: no-store`.
- Die Function liefert ausschließlich die intern erforderlichen Konfliktflags. Eine Vorprüfung kann bei parallelen Schreibvorgängen unmittelbar nach der Antwort veraltet sein.

## Qualitätssicherung

- `scripts/test-admin-occupancy.mjs`: Autorisierung, Preview-Schutz, Datum und Zeitfenster, unerlaubte Felder, maximal 14 Tage, keine anonyme oder produktive Nutzung.
- `scripts/premium-admin-occupancy-qa.mjs`: 320/375/430/768/1440 px, Ergebnisdarstellung, erkennbare Konflikte, Ungültigkeit, automatische Rücknahme veralteter Prüfergebnisse und **keine echten API-Schreibaufrufe**. Die Prüfung nutzt isolierte Mock-Callbacks und schreibt keine Geräte in Neon.
- Die bisherigen Auth-, Inventar-, Kalender-, Buchungs-, Design- und Mobile-Regressionstests bleiben aktiv.

## Weitere Freigabeschranken

Die Entwicklungsdatenbank enthält weiterhin nur vom Betreiber ausdrücklich zu erfassende reale Geräte und Termine (kein automatisch angelegter Testbestand). Vor Produktivbetrieb sind die realen Geräte, deren interne Kennungen, tatsächliche Logistikregeln, Nutzer-End-to-End-Test der Speicherung, Datenschutz- und Vertragsfreigaben sowie die öffentliche Buchungslogik erforderlich.

**Studio 4.2 ist eine interne Entscheidungshilfe; keine öffentliche Verfügbarkeitsfunktion und keine Reservierungsgarantie.**
