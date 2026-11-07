# FOTOPOLIS – Neon PostgreSQL 18 · Entwicklungsanbindung

**Stand:** 06.11.2026. Scope: ausschließlich FOTOPOLIS (GitHub `design/premium-v2`, Neon-Projekt `icy-wave-78750589`). Keine Änderung der Live-Domain, von `main` oder von Supabase-Projekten anderer Anwendungen.

## 1. Neon-Iststand, geprüft

| Eigenschaft | Ergebnis |
| --- | --- |
| Neon-Projekt | `Fotopolis` |
| Projekt-ID | `icy-wave-78750589` |
| Organisation | `org-patient-frog-85869133` |
| Region | `aws-eu-central-1` (Frankfurt) |
| Tarif | `free_v3` |
| PostgreSQL | `18.6` |
| Datenbank | `neondb` |
| Standard-Branch | `production` (`br-lingering-mode-b92xvpnl`) |
| **Entwicklungsbranch** | **`development` (`br-super-leaf-b9jj8n9p`)** |
| `btree_gist` | auf `development` installiert, Version 1.8 |

**Keine Datenbank-URL, Passwörter oder Credentials** im GitHub-Repository und in der öffentlich abrufbaren Netlify-Preview. Das Neon-Projekt wurde nicht zusätzlich dupliziert, keine kostenpflichtigen Neon-Features aktiviert und die Apps Mammut und RM-Inventory nicht angefasst.

## 2. Implementierung

Migration als Quellstand: `database/neon/001_private_booking_schema.sql`; ausschließlich gegen den Entwicklungsbranch ausgeführt.

Privates Schema `fotopolis`:

- `resources`: individuell mietbares Gerät pro Zeile. Das System erfindet keine Stückzahlen. Neue Geräte sind standardmäßig deaktiviert.
- `allocations`: bestätigte Buchung, interne Haltezeit, Wartung oder Sperrzeit; Eventzeit und tatsächliche Belegungszeit einschließlich Logistik separat.
- `allocation_audit`: Insert-/Update-Historie. Zuordnung zu einer konkreten Mitarbeiteridentität folgt mit Admin-Auth.
- `available_resources`: serverinterne Abfrage, die deaktivierte und belegte Geräte ausschließt.
- Ein datenbankseitiges **GiST-Exclusion-Constraint** verhindert überschneidende Belegungsfenster derselben physischen Ressource. Dies gilt auch unter konkurrierenden Schreibtransaktionen, nicht nur innerhalb der UI.
- `tstzrange` / `timestamptz` für korrekte Zeitzonenbehandlung und ein halboffenes Intervall `[)`.
- Row-Level Security für alle drei Tabellen **eingeschaltet**. `PUBLIC` hat keinerlei Schema-USAGE; Neon besitzt **keine** Supabase-spezifischen Rollen `anon` oder `authenticated`. Keine öffentliche Data API und keine Serverfunktion/DB-Credentials im Browser konfiguriert.
- `neon_auth`-Tabellen existierten bereits durch den Neon-Projektwizard und wurden **nicht verändert**.

## 3. Direkt in Neon ausgeführte Integritätstests

Die Entwicklerdatenbank erhielt einen **isolierten, absichtlich zurückrollenden PL/pgSQL-Testblock** mit synthetischen Geräte- und Buchungsdaten:

| Prüffall | Resultat |
| --- | --- |
| Zwei echte einzelne Geräte werden als zwei Ressourcen erkannt | Bestanden |
| Belegungszeit einschließlich Vorlauf sperrt erstes Gerät | Bestanden |
| Zweiter Termin auf demselben Gerät innerhalb eines aktiven Fensters | SQL-Exclusion-Constraint lehnt ab |
| Zweites Gerät zur gleichen Zeit | Zulässig |
| `held`-Status blockiert die Verfügbarkeit | Bestanden |
| Stornierung gibt das Gerät wieder frei | Bestanden |
| INSERT + UPDATE werden im Audit protokolliert | Bestanden |
| Exakt angrenzende Intervalle `[)` | Zulässig |
| Rückwärts liegende Eventzeit | CHECK-Constraint lehnt ab |
| Testdatensätze werden vollständig zurückgerollt | **0 Ressourcen, 0 Belegungen, 0 Auditzeilen** |

Direkte PostgreSQL-Katalogabfragen bestätigen: 3 Tabellen, jeweils `relrowsecurity=true`, das Ausschluss-Constraint `resource_time_no_overlap` vom Typ `x` und `btree_gist` Version 1.8.

Die Gegenprobe auf Neons Standard-Branch `production` ergab weiterhin **keine** Tabellen im Schema `fotopolis`. Der Standard-Branch wurde **nicht** migriert.

## 4. Nicht umgesetzt / bewusste Schutzgrenzen

**Noch keine echte Buchbarkeit und keine Kalender-Anbindung.** Es wurden keine Geräte aus realem Bestand angelegt, keine personenbezogenen Kundeninformationen gespeichert und keine Termine als verfügbar zugesichert.

Für die nächsten Roadmap-Schritte benötigen wir:

1. Bestätigung des **tatsächlich vermietbaren Gerätebestands** (je einzelner Fotobox, Fotospiegel und Fotowohnwagen).
2. Geschäftsregeln für Mindestdauer, Transport, Aufbau und Abbau, Vorhalte- und Stornierungsfristen.
3. Admin-Authentifizierung (Neon Auth / Better Auth) mit personenbezogenen Administratoren und serverseitiger Rollenprüfung.
4. Netlify-Serverfunktionen mit vorübergehendem DB-Zugang ausschließlich aus geschützten, **branch-gebundenen** Umgebungsvariablen. Keine Verbindungszeichenfolgen in GitHub oder Frontend.
5. Eingehende Buchungsanfragen dürfen nicht unautorisiert `allocations` schreiben. Ein ausschließlich anmeldepflichtiger Admin-Kalender und öffentliche Anfrage-/Reservierungswege benötigen getrennte Sicherheitsregeln, Audit-Zurechenbarkeit und Missbrauchsschutz.
6. Free-Tarif-Kontingente, Skalierungsverhalten und externe Backups vor Livebetrieb gesondert abnehmen.

## 5. Weiterer Plan

**Roadmap 6 – Neon-Entwicklungsdatenbank technisch bereit und getestet.** Der produktive Cloudbetrieb bleibt nicht freigegeben.

**Roadmap 7 – Admin-Kalender:** UI mit Wochen-/Monatsansicht, Ressourcenfilter und manuellen Sperren in der isolierten Preview entwickeln, daneben Admin-Auth und sichere Backend-Endpunkte vorbereiten. Zunächst keine öffentlichen Reservierungen oder echten Daten ohne Freigabe.

[Private Draft-PR #2](https://github.com/WTF-Sascha/fotopolis-website/pull/2) · [Preview](https://deploy-preview-2--fotopolis-preview.netlify.app/)
