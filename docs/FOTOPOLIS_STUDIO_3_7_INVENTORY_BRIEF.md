# FOTOPOLIS Studio 3.7 – Geräteverwaltung

Status: In Vorbereitung. Die bestehende Entwicklungsvorschau und die freigegebene Corporate Identity bleiben unverändert.

Die Verwaltung soll physisch einzelne Fotoboxen, Fotospiegel und Fotowohnwagen erfassen. Vorgesehen sind eine eindeutige Gerätekennung, ein Anzeigename, die Produktart und ein standardmäßig deaktivierter Aktivitätsstatus. Die Erfassung darf keine erfundenen Bestände erzeugen.

Sicherheitsanforderungen: signierte Authentifizierung, serverseitige Owner- oder Manager-Berechtigung, getrennter datenbankseitiger Minimalzugriff, Eingabevalidierung, Änderungsprotokoll und keine Änderungen an produktiven Buchungen.

Wichtig: Die Datenbank-Schreibfreigabe und die Vorschau-Implementierung sind noch nicht abgeschlossen. Der PostgreSQL-Entwicklungszweig enthält keine Geräte und keine Buchungen. Die zugehörige Rolle hat derzeit keine Schreibrechte. Keine Live-Veröffentlichung.
