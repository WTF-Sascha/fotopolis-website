# FOTOPOLIS Studio 15.0 – Phase 0: verifizierte Bestandsaufnahme und Release-Gates

**Stand:** 12.11.2026 · **Quelle:** Master-Arbeitsauftrag Studio 15.0, GitHub `staging` (`032c3f1`), Netlify-Projekt `fotopolis-preview`, Neon-Projekt `Fotopolis` / DB-Branch `development`.
**Geltungsbereich:** ausschließlich Entwicklungsumgebung. **Gate 0: NICHT bestanden; kein Produktionsmerge und keine Live-Freigabe.**

## 1. Architektur-Iststand

| Schicht | Verifizierter Befund | Konsequenz |
| --- | --- | --- |
| Source / CI | GitHub `WTF-Sascha/fotopolis-website`, Ausgangsbranch `staging`; Python-Generator, statische HTML/CSS/JS-PWA, Node-Skripte, GitHub Actions | Vorhandene Komponenten ausbauen; keine Komplettneuschreibung |
| Hosting | Netlify `fotopolis-preview`; `staging` ist eigener Branch-Deploy, letzter geprüfter Deploy `ready` vom 12.11.2026 | Nicht nach `main` mergen; Bestands-Hero vor Änderungen schützen |
| Zugang Staging | Netlify-Site meldet Passwortschutz für Non-Production und **kein** obligatorisches Netlify-Team-SSO; app-eigene Neon-Auth bleibt erforderlich | Bestehende ältere SSO-Dokumentation korrigieren; echte Anmeldung separat E2E prüfen |
| Datenhaltung | Neon PostgreSQL 18 in Frankfurt, Projekt `icy-wave-78750589`; `development` = `br-super-leaf-b9jj8n9p`; produktiver Default-Branch separat | Neon DEV ist derzeit Single Source of Truth für Verwaltungsdaten; keine zweite Supabase-Kopie anlegen |
| Supabase | Bei den verbundenen Supabase-Konten **kein FOTOPOLIS-Projekt** gefunden | Supabase ist gegenwärtig kein nachgewiesenes Backend dieses Projekts; ein Architekturwechsel erfordert gesonderten Migrationsentscheid |
| Anmeldung / Rechte | Neon Auth, serverseitige JWT-/JWK-Prüfung, `fotopolis.admin_members`, Rollen `owner/manager/viewer`; zusätzliche Staff-Rollen vorbereitet | Positive und negative Realtests stehen aus |
| Anfrageannahme | Netlify Forms `fotopolis-studio9-anfrage` maßgeblich; verifizierter Form-Event-Handler und browserseitiger Fallback schreiben Neon-Inquiry mit derselben UUID | Reconciliation, Retry/Dead-Letter und echte Ende-zu-Ende-Formübermittlung fehlen |
| Geräte / Kalender | `fotopolis.resources`, `allocations`, Ausschluss-Constraint für überschneidende belegte Zeitfenster, Studio-15-Verknüpfung `inquiry_id` | Gleichzeitige reale Buchungstests und gültige aktive Geräte fehlen |
| Druckdesign | 32 Classics + 12 Signatures, Druckoriginale private Netlify-Function, öffentlichen Katalog getrennt | Classics auf eingebrannten Text prüfen, physische Druckproofs nötig |
| Hero / CI | Neuere `staging`-Commits 12.11. schützen den unverlinkten Begrüßungs-Hero; automatisierte Tests vorhanden | Diese Referenz unverändert lassen; zusätzliche visuelle E2E-Prüfung folgt |

**Sicherheitshinweis:** Das GitHub-Repository ist nach aktuellen Metadaten öffentlich; ältere Deployments können historische Assets enthalten. Sichtbarkeit und Alt-Deployments vor jedem realen Kundeneinsatz gesondert prüfen, nicht ungefragt ändern.

## 2. DEV-Datenbestand – read-only am 12.11.2026 geprüft

| Kennzahl | Bestätigt |
| --- | ---: |
| Anfragen (`fotopolis_studio13.inquiries`) | 0 |
| Belegungen (`fotopolis.allocations`) | 0 |
| Geräte insgesamt / aktiviert | 3 / 0 |
| Vorlagenfreigabe-Datensätze (`design_reviews`) | 0 |
| Admin-Mitgliedschaften | 1 |

Diese Zahlen sind **kein Funktionsnachweis**: Insbesondere wurde kein tatsächlicher Kunde, keine bestätigte Buchung und keine Druckfreigabe getestet. Es wurden keine produktiven Daten gelesen, verändert oder kopiert.

## 3. Funktionsmatrix Ist / Soll

**Legende:** `teilweise` = vorhandene technische Komponenten ohne vollständige E2E-Abnahme; `nicht vorhanden` = kein funktionierender vollständiger Zielprozess im überprüften Entwicklungsstand nachgewiesen.

| Master-Modul | Nachweisbarer Iststand | Bewertung | Hauptlücke |
| --- | --- | --- | --- |
| Public Website / Produkte | Premium-Seiten, Produktseiten, Navigation, Hero, responsive Tests | teilweise | Visuelle Regression auf echten Geräten und fachliche finale Inhalte |
| Sichere Kundenanfrage | Netlify Form + UUID-Mirror + Validierung | teilweise | Netlify→Neon-Staging-Synchronisierung und Wiederanlauf E2E |
| CRM und Event-Akte | Inquiries, Status, Historie, Dashboard, Verknüpfung zur Vormerkung | teilweise | Angebot, Kundenstamm, Event-Akte und vollständige Statusmaschine |
| Geräte, Sperrzeiten, Buchungen | Ressourcen und belegungsfreies Zeitfenstermodell | teilweise | Aktive Testgeräte, reale Parallelbuchungs- und Puffertests |
| Design Studio Pro | Geschützter Editor, 44 Quelllayouts, Teilfreigaben | teilweise | 32 Classics-Fachprüfung, Versionierung, echte Drucke |
| Kundenportal / Designfreigabe | Kein nachgewiesener vollständiger eventbezogener Kundenportal-Flow | nicht vorhanden | Einladungs-/Zugriffsmodell, unveränderliche Freigabeversion |
| Automatisierungen | Einfache Form-Events und technische Statusaktionen | teilweise | Outbox, Retry, Recovery, Bestätigungen ohne echten Versand im Test |
| Business Analytics | Aggregierte DEV-Ereignisse und Dashboard-Vorarbeiten | teilweise | Definitionen, belastbare Conversion, Rechts-/Consentprüfung |
| Event-Checklisten / Personal | Keine vollständige Integration nachgewiesen | nicht vorhanden | Rollen, Dienstplanung, Aufgabenvorlagen, Datenminimierung |
| KI-Assistent / Design-KI | Keine freigegebene Integration | nicht vorhanden (P2) | Datenschutz-, Kosten- und Qualitätsentscheidung |
| Digitale Eventgalerie | Noch kein Hardware-/Software-Ingest nachgewiesen | nicht vorhanden (P2) | Schnittstellenanalyse, Speicher-/Löschkonzept, Zugriff |

Keine der unvollständig getesteten Funktionen wird in diesem Bericht als abnahmefähig bezeichnet.

## 4. Kritische Findings und Prioritäten

| ID | Prio | Beobachtung / Risiko | Nächster Nachweis |
| --- | --- | --- | --- |
| G0-01 | P0 | Die Browser-CRM-Mirror-Quelle akzeptierte ausschließlich `deploy-preview-N` und nicht die feste `staging`-Domain. | Host-Allowlist exakt ergänzen; Regression für Staging, Preview, Main und fremde Hosts |
| G0-02 | P0 | `formSubmitted` verwendet eine Preview-DEV-DB-Umgebungsvariable; die Staging-spezifischen DB-Aliase werden von diesem Eventpfad derzeit nicht nachweisbar verwendet. | Netlify-Form-Event auf der festen Staging-Adresse prüfen und isolierte Routingstrategie entwerfen |
| G0-03 | P0 | Kein automatisierter Abgleich aller Netlify-Submissions mit Neon per korrelierter UUID und fehlertolerantem Replay nachgewiesen. | Synthetische Doppel-/Ausfalltests und Recovery-Report |
| G0-04 | P0 | Echtes Owner-Login, Rollen-Negativtests und Token-Revocation auf Staging nicht nachgewiesen. | Auth-E2E über echten geschützten Zugriff, ohne Credentials in Logs |
| G0-05 | P0 | Drei physische Ressourcen sind deaktiviert. Kein nachgewiesener bestätigter Geräte-Booking-E2E. | Synthetisches Testgerät, DB-Konkurrenztest, vollständiges Aufräumen |
| G0-06 | P0 | 32 Classic-Rasterbilder noch nicht individuell auf eingebrannte Namen/Logos/Sicherheitsbereiche abgenommen. | Visuelle Einzelprüfung plus physischer 10x15-/5x15-Proof |
| G0-07 | P1 | Das bisherige README beschreibt noch mailto, altes blaues Branding und nicht angebundene DB; damit irreführend. | README an tatsächlich geprüften Stage-Stand anpassen |
| G0-08 | P1 | GitHub-Repository ist öffentlich, historische Deploy-Vorschauen können Vorgängerassets behalten. | Repository-/Asset-/Alt-Deploy-Risiken vor Realbetrieb separat freigeben |
| G0-09 | P1 | Keine verbindliche Buchungsstatusmaschine und zentrale Kunden-Event-Akte. | Migrationsfähiges Schema mit Berechtigungen, FK, Offer/Event-Versionen planen |

## 5. Abhängigkeiten und Umsetzungsplan

**Gate 0 – Systembasis:** G0-01 bis G0-08 bewerten, Staging-Auth und DB-Isolation verifizieren, echte Netlify-Form-Probe ausschließlich synthetisch, Druckbestand inventarisieren. G0-02 bis G0-06 sind noch offen.

**Gate 1 – Business Core (erst nach Gate 0):** bestehende Neon-Inquiry als Einstieg erhalten; CRM-Statusmaschine, Customer/Event/Offer-Aggregate mit idempotenten Transaktionen; serverseitig gebundene Buchung mit Zeitpuffer und Bestandssperre; Audit und Rollen-E2E.

**Gate 2 – Design & Customer:** alle 44 Designs inventarisieren, 32 Classics überprüfen, unveränderliche Freigabeversionen, geschütztes Studio, Kundenportal und Druckfreigaben; physischen Proof nicht durch Screenshots ersetzen.

**Gate 3 – Operations & Intelligence:** Outbox/Jobs/Benachrichtigungen, Checklisten, Personal, Datenkennzahlen und DSGVO-konforme Reichweitenmessung, CSV/PDF-Exporte.

**Gate 4 – Innovation:** KI nur nach Sicherheits-/Kostenfreigabe, Galerie erst nach positiver Prüfung der realen Fotohardware.

**Gate 5 – Release-QA:** Auth/IDs, Netlify→DB-Reconciliation, parallele Buchung, Druck- und Rollenfreigabe, Recovery, echte Mobile-Browser, WCAG 2.2 AA, LCP/INP/CLS, Rollback. Auch danach **kein** Merge nach `main` ohne Freigabe.

## 6. Abnahmematrix für die nächste Entwicklung

| Test-ID | Verfahren | Mindestakzeptanz | Stand |
| --- | --- | --- | --- |
| T-01 | Netlify Form→Webhook/Browser-Mirror→Neon auf Staging | Nach einer akzeptierten synthetischen Submission exakt eine Inquiry, korrelierte UUID, Fehlerfall dokumentiert | offen |
| T-02 | Parallelversuche dieselbe Geräteressource | Nur eine kollidierende belegte Buchung bleibt bestehen; Overlap-Constraint validiert | DB-Constraint vorhanden, E2E offen |
| T-03 | Neon Owner/Manager/Viewer, fremder Kunde, Sessionablauf | Ungenehmigte Antworten 401/403, keine fremden Informationen | offen |
| T-04 | 44 Druckdesigns incl. 32 Classics | Keine internen Vorlagennamen im Raster; Print-ICC/Beschnitt nach Hardwareproof | offen |
| T-05 | Hero/Brand auf 320–1920 px | Keine CTA-/Produktverlinkung, keine Logo-Änderung, Layout und Kontraste einwandfrei | Code/CI vorhanden, visuelle Endabnahme offen |
| T-06 | Offline/PWA-Scope und Zugriff auf `/admin/`, `/api/` | Geschützte Daten nie aus Service-Worker-Cache | Contract vorhanden, Browser-E2E offen |
| T-07 | Recovery und Rollback | Reproduzierbarer Build, belegbarer DB-Restore, keine produktiven Änderungen | offen |

## 7. Kosten, Risiken und Umsetzungsvoraussetzungen

- Vorhandene GitHub-, Netlify- und Neon-Ressourcen weiterverwenden. **Keine neuen bezahlten Dienste, kein Datenbankbranch mit Kosten und kein Live-E-Mail-Versand.**
- Eine neue Supabase-Organisation oder zusätzliche Datenbank ist angesichts der bereits vorhandenen Neon-Plattform **nicht** freigegeben und derzeit technisch nicht erforderlich.
- Physischen Inventarbestand, Datenschutz-/Aufbewahrungsregeln, echten Mitarbeiterzugang und Druckhardware-Spezifikation fachlich abnehmen lassen.
- Automatische Checks bestätigen Quellcodeverträge, **nicht** eine reale erfolgreiche Annahme oder Buchung.

## 8. Ergebnis / Definition of Done Phase 0

Erledigt: Read-only Architektur- und Datenprüfung, Identifikation der bestehenden `staging`-Basis, Frontend-/Backend-Modulzuordnung, Risikomatrix, Implementierungsreihenfolge, definierte Test-Gates. Im zugehörigen isolierten Feature-Branch wird die fehlende Mirror-Hostfreigabe samt Regression korrigiert, ohne Anfrage zu erzeugen.

**Nicht erledigt:** vollständige Staging-End-to-End-Tests, Auth mit tatsächlichem Teamkonto, Form-Event-Recovery, Validierung von Geräteverfügbarkeit, physische Drucke sowie Entscheidung zu Repository-/Datenschutz-Freigaben.

**Entscheidung: Gate 0 = NO-GO für Business-Core-Livebetrieb.** Der nächste Schritt ist ein kontrollierter Testdurchlauf mit synthetischen Daten, nicht das blinde Ausrollen von zehn neuen Modulen.

**Unveränderte Leitplanken:** kein Merge, keine Änderungen an `staging`, `main`, dem Neon-Produktionsbranch, `fotopolis-mieten.de`, Hero oder Logo ohne neue ausdrückliche Freigabe.