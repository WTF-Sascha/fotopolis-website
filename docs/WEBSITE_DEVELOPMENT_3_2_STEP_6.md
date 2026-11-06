# FOTOPOLIS – Website Development 3.2 · Roadmap-Punkt 6
## Ressourcen, Buchungssperren und Verfügbarkeit – isolierter Datenbank-Prototyp

**Geltung:** FOTOPOLIS-Entwicklungszweig `design/premium-v2`; Draft-PR #2, Netlify Deploy Preview. **Nicht produktiv und nicht an eine echte Supabase-Datenbank angeschlossen.**

## Ziel und Grenze

Das Ziel dieses Schritts ist eine belastbare technische Basis, die **Doppelbuchungen desselben physischen Mietgeräts auf Datenbankebene verhindert**, auch bei gleichzeitigen Schreibzugriffen. Bestands- und Angebotsdaten müssen später von FOTOPOLIS bestätigt werden. Eine freie Zeit im Prototyp bedeutet **noch keine tatsächliche öffentliche Verfügbarkeit**, da reale Geräteanzahl, Einsatz-, Transport-, Auf- und Abbauzeiten sowie Buchungs-/Stornierungsregeln noch nicht abgenommen sind.

Die verbundene Supabase-Organisation enthält derzeit **kein eigenes FOTOPOLIS-Projekt**. Die vorhandenen Mammut-/Tierheim-/Inventory-Datenbanken anderer Anwendungen bleiben unangetastet. Ohne Bestätigung der Organisation und eventueller Kosten wird auch kein neues kostenpflichtiges Projekt angelegt.

## Datenmodell

```text
fotopolis.resources (je physisches Gerät)
  id UUID
  resource_code UNIQUE
  product_type = fotobox | fotospiegel | fotowohnwagen
  display_name
  enabled (initial FALSE)
       |
       +---1:N--- fotopolis.allocations (Belegungen)
                     id UUID
                     resource_id
                     allocation_kind = booking | internal_block | maintenance
                     allocation_state = held | confirmed | blocked | cancelled
                     event_start_at / event_end_at
                     occupied_from / occupied_until (inkl. Logistik)
                     occupied_window = tstzrange [von,bis)
                              |
                              +---1:N--- fotopolis.allocation_audit
                                            INSERT / UPDATE
                                            Vorher-/Nachher-Zustand
                                            Zeit und Datenbankrolle
```

Die Zahl der mietbaren Geräte wird **nicht geraten**: Erst wenn reale physische Ressourcen angelegt und explizit aktiviert werden, erscheinen diese in der internen Verfügbarkeitsabfrage.

### Doppelbuchungsschutz
Das Postgres-`EXCLUDE USING gist`-Constraint aus `btree_gist` verhindert für dasselbe Gerät überlappende `tstzrange`-Belegungen mit `held`, `confirmed` oder `blocked`. Der Schutz liegt **nicht nur im Frontend**. Inklusive Starts und exklusivem Ende erlaubt es exakt aneinandergrenzende, aber keine sich überschneidenden Zeitfenster.

Diese technische Umsetzung orientiert sich an den offiziellen Postgres-Dokumenten zu Range-Exclusion-Constraints und am Supabase-Leitfaden zu zeitbasierten Range-Spalten.  <https://www.postgresql.org/docs/current/rangetypes.html> · <https://supabase.com/blog/range-columns>

### Sicherheitsmodell
- Separates privates Schema `fotopolis`, keine Objekte im öffentlichen `public`-Schema.
- RLS eingeschaltet auf **allen** Ressourcen-, Belegungs- und Audit-Tabellen, zunächst **ohne** Browser-RLS-Policies.
- `PUBLIC`, `anon` und `authenticated`: kein Schema-/Tabellen-/Funktionszugriff.
- Die Verfügbarkeitsfunktion `fotopolis.available_resources(start,end,product_type)` läuft als `SECURITY INVOKER` und wird **nicht** als öffentliches RPC freigeschaltet.
- **Keine** Secrets, URL, Supabase-Service-Keys oder Buchungs-/Kundendaten in der Netlify-Preview.
- Die Testmigration legt **keine** Bestandsdaten, Preise oder Kundenprofile an; nur die Tests erzeugen synthetische, wieder zurückgerollte Datensätze.
- Rollen und echte, nachweisbare Mitarbeiter-Identität für den Admin-Kalender werden erst im separaten Roadmap-Punkt 7 definiert.

### Zeitmodell und Betriebsregeln
- Zeitpunkte als `timestamptz` (absolute Instants); Darstellung später in `Europe/Berlin`.
- Für Überlappung zählt `occupied_from → occupied_until`. Dieser Bereich **muss** alle notwendigen Vor-/Nachlaufzeiten abdecken; die Höhe dieser Puffer ist vorab mit FOTOPOLIS abzustimmen, sie wird **nicht** automatisch erfunden.
- `held` ist eine **konservative interne Sperre**, keine automatisch ablaufende Kundenreservierung. Eine Ablaufautomatik benötigt erst definierte Fristen und eine spätere serverseitige Joblogik.
- `cancelled` gibt das Zeitfenster frei, aber behält Änderungs- und Historieneinträge.
- Wartung und interne Blocker werden genauso konfliktfest verwaltet wie echte Belegungen.
- Die SQL-Funktion liefert **nur interne Orientierung** und keine verbindlichen Buchungszusagen.
- Datenschutz: Keine personenbezogenen Angaben in diesem Modul.

## Dateien

| Pfad | Inhalt |
| --- | --- |
| `database/step6/availability_schema.sql` | Erstentwurf des privaten PostgreSQL-Schemas, RLS und Exclusion-Constraint |
| `database/step6/test_availability.sql` | Reale PostgreSQL-Integrationstests für Ressourcen, Sperren, Buffer, Status, DST und RLS |
| `database/step6/test_concurrent_bookings.sh` | Zwei konkurrierende Transaktionen auf derselben physischen Ressource |
| `.github/workflows/step6-database-ci.yml` | PostgreSQL-17-Container, reproduzierbare Migration und Tests ohne Außenverbindung |

**Hinweis:** Weil die Supabase CLI in der Arbeitsumgebung nicht verfügbar ist und noch kein dediziertes Projekt existiert, ist `availability_schema.sql` bewusst ein **überprüfbarer SQL-Entwurf**, noch kein als angewendet deklarierter `supabase/migrations/<timestamp>_*.sql`-Eintrag. Beim offiziellen Setup muss die Migration mit der dann aktuellen Supabase CLI erzeugt, im eigenen Projekt ausgeführt und mit `supabase test db`/Security Advisors geprüft werden. Die CLI hat am 04.11.2026 Versionsänderungen für lokale/Remote-Befehle erfahren; deren konkrete Syntax vor der Ausführung prüfen.

## Testkriterien

| Testfall | Erwartetes Ergebnis |
| --- | --- |
| Identisches Gerät + überlappende Intervalle | PostgreSQL lehnt den zweiten Datensatz ab |
| Zwei zeitgleiche Transaktionen | Maximal eine Buchung gewinnt |
| Zwei tatsächlich unabhängige Geräte | Gleichzeitig buchbar |
| Event ohne Vor-/Nachlauf, aber Belegung mit Puffer | Puffer sperrt die reale Ressource |
| Aneinandergrenzende `[)`-Zeitbereiche | Beide gültig |
| Aktive interne Blockade / Wartung | Keine freie Ressource |
| Storno | Ressourcenfenster wieder verfügbar |
| Deaktiviertes Gerät | Keine freie Ressource |
| Ungültige Zeit-/Statuswerte | SQL-Check verhindert Datenspeicherung |
| Sommerzeitwechsel | UTC-Instants korrekt verglichen |
| `anon` und `authenticated` | Keine Berechtigung zum privaten Schema |
| Änderungsprotokoll | Insert/Update/Storno nachprüfbar |

## Noch offene Betriebsfreigaben (vor echter Supabase-Anbindung)

1. **Zielorganisation und Kosten:** explizite Zuordnung zur eigenen FOTOPOLIS-Organisation und bestätigter Supabase-Tarif/Projektkosten.
2. **Physischer Bestand:** Anzahl pro Produkt, Gerätekennzeichnungen, Ausweichgeräte, weitere kombinierte Dienstleistungen.
3. **Betriebszeiten und Logistik:** Buchungsfenster, Mindestmietdauer, Transport-/Vorbereitungs- und Rückbauzeiten, Ort/Einzugsgebiet, Pufferschema.
4. **Geschäftsstatus:** Wann ist eine Anfrage eine Sperre? Wann verfällt sie? Wer bestätigt/storniert?
5. **Administrations- und Zugangsregeln:** interne Rollen, Authentifizierung, echte Benutzer-Zurechenbarkeit, datenschutzrechtliche Prüfung.
6. **Server-API:** vor einem echten öffentlichen Buchungskalender separate transaktionale Reservierungslogik und API-Zugriffsprüfung.

## Ergebnis

**Technisch implementiert:** isolierter Datenbankentwurf und PostgreSQL-17-Prüfstrecke. **Nicht implementiert:** echte Supabase-Projektanlage, Einspielen in eine Cloud-Datenbank, öffentliche Verfügbarkeits-API, Kundendatenverarbeitung und verbindliche Reservierungen.

**Projektstatus:** Roadmap-Punkt 6 ist nach erfolgreichem CI-Lauf auf Ebene Datenmodell/Integrität **technisch vorbereitet und getestet**, bleibt für einen echten Cloudbetrieb bis zur Freigabe des eigenen Supabase-Testprojekts **teilweise offen**. Die folgenden Punkte 7–10 bleiben unverändert.
