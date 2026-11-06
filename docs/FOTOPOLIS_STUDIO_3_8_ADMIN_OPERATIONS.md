# FOTOPOLIS Studio 3.8 – Operations & Admin Workspace

**Entwicklungsstand:** 06.11.2026. Ausschließlich GitHub `design/premium-v2`, Draft-PR #2, isolierte Netlify Deploy Preview und Neon `development` in Frankfurt. Keine Produktivveröffentlichung, keine Änderung an `main`, am bisherigen `fotopolis-mieten.de`-Angebot oder anderen Anwendungen.

## Umgesetzte Verwaltung

1. **Verifizierte Administrator-Anmeldung:** Neon Auth mit eigenem Passwort, optionaler OTP-Alternative und individueller Owner-Rolle. Nutzer hat den realen Login und das geschützte Dashboard im vorigen Schritt erfolgreich bestätigt.
2. **Geräteübersicht:** Echter Bestand nur lesend aus Neon. Zusätzlich vor Ort entworfene Fotobox-/Fotospiegel-/Fotowohnwagen-Geräte mit Validierung und Duplikaterkennung; Entwürfe befinden sich ausschließlich im Tab-Arbeitsspeicher und verschwinden beim Neuladen.
3. **Echter Kalender:** Monats- und Wochenansicht, Geräte-Filter, Datumsnavigation, gezielter Datumssprung, manuelle Aktualisierung und sichtbarer Datenlade- bzw. Fehlerstatus. Die sichtbare Belegungszahl zählt ausschließlich tatsächlich geladene Neon-Belegungen.
4. **Tagesdetail-Dialog:** Ein Klick auf einen Kalendertag öffnet die Detailansicht direkt im Viewport. Escape, Schließen-Schaltfläche und Hintergrundklick schließen das Fenster. Echte Belegungen und lokale Entwürfe werden getrennt ausgewiesen.
5. **Interne Planung:** Wartungs- und Sperrzeitenentwürfe auf reale Geräte oder lokale Geräteentwürfe. Validierung von Gerätezuordnung, Zeitfenstern, sich überschneidenden geladenen Belegungen und eigenen Planungsentwürfen. Zeitumstellung wird explizit in `Europe/Berlin` behandelt: nicht vorhandene oder doppeldeutige lokale Stunden sind unzulässig.
6. **Export:** Lokaler JSON-Export der Entwürfe auf ausdrücklichen Klick. Keine Übermittlung, Speicherung oder Reservierung im Backend. Beim Neuladen gehen die Entwürfe verloren; JSON ist eine Planungskopie, keine Buchungsbestätigung.
7. **Mobile UX:** Eigene Navigation, verankerte Bereiche, responsives Formular, Kalendertag-Dialog im sichtbaren Bereich, Übersicht bei 320–1440 Pixel.
8. **Preview-Gateway:** Geschützte Session-JWT-/RBAC-Prüfung und read-only-Kalender. Ein vollständig serverseitig gesperrtes Inventar-Schreib-API-Gerüst ist vorhanden, erlaubt später ausschließlich inaktive Geräteanlage und Namensänderung bei `owner` oder `manager`.

## Bewusst nicht freigeschaltet

- **Bestandsdaten speichern/bearbeiten:** Die eigens erstellte Neon-Rolle `fotopolis_admin_inventory_writer` hat keine Write-GRANTs. Die dafür notwendige Freigabe wurde durch Sicherheitsprüfungen der verbundenen Datenbank-Tools blockiert und nicht umgangen. Der spezifische, noch **nicht ausgeführte** Migrationsvorschlag liegt unter `database/neon/005_inventory_writer_review_only.sql`. Kein Netlify Writer-Secret eingerichtet; API antwortet kontrolliert ohne Mutation.
- **Echte interne Blockierungen:** Keine Datenbank-Mutation der Tabelle `allocations`. Entwürfe wirken ausdrücklich NICHT als Belegung. Die vollständige Ausschlussbedingung für konkurrierende Buchungen besteht zwar in Neon, ist aber noch nicht durch eine schreibberechtigte Admin-API erreichbar.
- **Kundenbuchungen, Verfügbarkeitszusagen, E-Mail-Versand, Preise, reale Inventar-/Pufferwerte:** ausstehende Geschäftsdaten und gesonderte Freigaben. Die ursprüngliche Website bleibt online und unberührt.
- **Admin-Rollenverwaltung:** Die erste Owner-Rolle besteht. Weitere Rollen/Einladungen werden ohne autorisierte Backendverwaltung nicht vorgetäuscht.

## Qualitätsprüfung

- `scripts/test-admin-planning.mjs`: Zeitzonen-/DST-Fälle, reale und lokale Ressourcen, identische und angrenzende Terminfenster, Teilüberschneidungen, ungültige Eingaben.
- `scripts/premium-admin-planning-qa.mjs`: sichtbare Formulare, Erstellung, Validierungsfehler, Export, Nichtpersistenz, fünf mobile/desktop Breakpoints, Null-Datenbankmutationen.
- Alle bisherigen Kalender-, Passwort-, Login-, Dashboard-, Geräte- und visuellen Regressionen bleiben im Admin-Workflow aktiv.
- Der allgemeine **Premium Release Gate** bleibt wegen fehlender Geschäfts-, Rechte- und Livefreigaben absichtlich blockiert; dies bedeutet nicht, dass die isolierte Vorschau nicht benutzbar ist.

## Nächste technisch notwendige Freigaben

1. Granulare Rechte für die isolierte Entwicklungs-Datenbankrolle prüfen und freigeben; danach restriktiv in `development` einspielen und kontrollieren.
2. Einen geheimen Netlify-Writerserver-Zugang **nur für deploy-preview / functions** einrichten und End-to-End-Rechteprüfung mit echten negativen und positiven Integrationstests abschließen.
3. Echte Gerätebestände, Gerätekennungen und Einsatzpuffer durch den Betreiber bestätigen lassen.
4. Serverseitig auditiertes Ressourcen-CRUD, anschließend echte Sperrzeiten, erst danach Kundenbuchungs-Workflow implementieren und testen.

**Keine** Eintragung erfundener Geräte, Termine oder Preise. **Keine** Live-Veröffentlichung bis zur gesonderten Freigabe.
