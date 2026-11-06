# FOTOPOLIS Studio 3.7 – Geräteverwaltung

**Stand 06.11.2026 – Browser-Vorschau implementiert, Datenbank-Speicherung weiterhin gesperrt.**

## In der isolierten Netlify-Entwicklungsvorschau

- Geschützte Admin-Navigation unter `/admin/dashboard/#inventory` mit direktem Sprung nach erfolgreicher Sitzung.
- Geräte-Editor für einzelne Fotoboxen, Fotospiegel und Fotowohnwagen; Kennungen werden normalisiert, Eingaben validiert, Duplikate gegen den realen Neon-Bestand und lokale Entwürfe abgewehrt.
- Maximal 20 temporäre Einträge im Browser-Arbeitsspeicher; Entwürfe lassen sich verwerfen und verschwinden beim Neuladen vollständig.
- Bestehende Geräte werden weiterhin ausschließlich über die geschützte und signiert authentifizierte read-only-API angezeigt.
- Responsives Corporate Design im freigegebenen FOTOPOLIS-Branding; keinerlei Änderung am freigegebenen Logo oder den Produktbildern.
- Der automatisierte Studio-3.7-Browser-Test prüft ungültige Kennungen, Doppelungen, Darstellung bei 320, 375, 430, 768 und 1440 Pixel, Seitenbreite, Nichtpersistenz und fehlende Schreibzugriffe. Er ist in den Admin-Studio-Workflow eingebunden.

## Technische Sicherheitsgrenze

Im Neon-Projekt FOTOPOLIS existiert nur auf dem Branch `development` die Rolle `fotopolis_admin_inventory_writer`, die derzeit nicht über die zur Geräteverwaltung benötigten Schreibrechte verfügt. Die Rolle ist **nicht** in der Netlify-Anwendung als Writer-Credential hinterlegt. Die Einrichtung eingeschränkter SQL-GRANTs wurde vom Sicherheitscheck der verbundenen Tools blockiert und nicht umgangen. Eine echte Speicherung ist deshalb absichtlich **nicht** vorgetäuscht oder aktiv.

Vor dem nächsten Schritt sind granular begrenzte Datenbankrechte (nur erlaubte Ressourcenfelder und Audit-Aktion), eine nur in `deploy-preview` verfügbare Function-Credential, serverseitige Owner-/Manager-RBAC-Autorisierung, Transaktions-/Audit-Tests sowie eine neue ausdrückliche Freigabe für echte Bestandsänderungen erforderlich.

Das Entwicklungsschema enthält weiterhin keine erfundenen Geräte oder Buchungen. `main`, die Live-Website und Mammut-/RM-Inventory bleiben unverändert. PR #2 bleibt Draft. **Roadmap 7 ist noch offen.**
