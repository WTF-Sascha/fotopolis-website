# FOTOPOLIS – Website-Roadmap · verbindlicher Gesamtstatus

**Arbeitsbereich:** Nur Branch `design/premium-v2`, Draft-PR #2, Netlify Deploy Preview. Kein Merge und kein Livegang ohne zusätzliche Freigabe. Freigegebenes Logo, originale Produktbilder und bestehende Domain bleiben unangetastet.

| Nr. | Roadmap-Schritt | Status | Freigabe-/Abhängigkeitskriterium |
| --- | --- | --- | --- |
| 1 | Inhaltsübernahme, Premium-Hauptmenü, Seitenarchitektur | In Preview implementiert | Abschließender Text-/Rechteabgleich |
| 2 | Drei Premium-Produktdetailseiten | In Preview implementiert | Ausstattung und Leistungsumfang durch FOTOPOLIS bestätigen |
| 3 | Pakete, Leistungen, Paketfinder | In Preview implementiert | Angebotspreise und Paketinhalt schriftlich bestätigen |
| 4 | Anlässe, Galerie, Vertrauenselemente | In Preview implementiert | Bild-/Personenrechte und Fotobezeichnungen prüfen |
| 5 | Kontakt- und Anfrageprozess | Preview-Kontaktformular mit eigenständigem E-Mail-Entwurf implementiert; Live-Datenübertragung **nicht** vorhanden | Formularworkflow, rechtliche Angaben, Aufbewahrung, Versand |
| 6 | Neon-PostgreSQL-Buchungsdatenbank und Verfügbarkeitslogik | **In Neon Free (Frankfurt), PostgreSQL 18, separatem `development`-Branch installiert und erfolgreich mit zurückgerollten Testbuchungen geprüft**. CI-Parallelbuchungstest zuvor in PostgreSQL 17 bestanden. | Reale Inventar-/Pufferregeln, abgesicherte API und Admin-Auth; keine öffentliche Buchbarkeit |
| 7 | Admin-Kalender und interne Sperrzeiten | **Persönlicher Owner-Account in Neon development mit bestätigter E-Mail und aktivierter Rolle; E-Mail-/Passwortanmeldung, Passwortvergabe per OTP, geschütztes Premium-Dashboard und tatsächliche Geräte-/Kalenderansicht (read-only) im Deploy Preview entwickelt.** | Echter Passwort-End-to-End-Test, sichere Ressourcen-/Sperrzeiten-CRUD-Endpunkte, Bestands- und Pufferregeln, endgültige Freigabe |
| 8 | Kundenkalender und echte Online-Buchung | Noch nicht implementiert | Konfliktprüfungen, transaktionale Buchung, Benachrichtigungen, Testfälle |
| 9 | Design Studio und Buchungskommunikation | Noch nicht integriert | Umfang, Schnittstelle, finale Texte, Datenschutz- und E-Mail-Freigaben |
| 10 | Finale Premium-QA und Übergabe | Teilweise automatisiert; Endabnahme ausstehend | Responsive, Browser, Performance, Accessibility, SEO, Datenschutz, Rechte, Security, Buchung, PWA, echte Testbuchungen |

## Abnahmeregel

1. Ein **grüner Testlauf** bedeutet ausschließlich, dass die automatisierten technischen Prüfpunkte des jeweiligen Entwicklungsstands bestanden sind. Er ist weder ein Nachweis für den Abschluss aller zehn Roadmap-Schritte noch eine Freigabe der Live-Website.
2. Jedes neue Feature erhält eigene Funktions-, Interaktions- und Responsive-Tests sowie Screenshot-Nachweise. Bestehende Tests bleiben erhalten (Regression).
3. Nach jedem Schritt wird die Tabelle fortgeschrieben. Ein Schritt darf als **vollständig** erst gelten, wenn technische QA, visuelle Kontrolle und alle erforderlichen inhaltlichen/rechtlichen/geschäftlichen Freigaben vorliegen.
4. Der vollständige Gesamtauftrag bleibt **OFFEN**, solange ein Teil der Punkte 5–10 aussteht.
5. Bis zur expliziten späteren Freigabe bleiben PR #2 **Draft**, `main` und die bisherige Website unverändert.

## Technischer Hinweis zur Vorschau

Die aktuelle Vorschau ist **öffentlich über ihren Netlify-Link abrufbar**, auch wenn Seiten `noindex` setzen. Deshalb dürfen dort keine vertraulichen Schlüssel, Kundendaten oder personenbezogenen Testdatensätze abgelegt werden. Eine echte Supabase-Datenbank und der E-Mail-Versand werden erst in einer geeigneten isolierten Testumgebung mit freigegebenen Sicherheitsregeln angeschlossen.

## Punkt 6 – Nachweis und Supabase-Isolation

- [SQL-Implementierung und Testmatrix](https://github.com/WTF-Sascha/fotopolis-website/blob/design/premium-v2/docs/WEBSITE_DEVELOPMENT_3_2_STEP_6.md)
- [Isolierter Postgres-17-Datenbanktest](https://github.com/WTF-Sascha/fotopolis-website/actions/workflows/step6-database-ci.yml)
- Testdaten sind fiktiv und der Regeltest wird zurückgerollt; keinerlei Zugriff auf Mammut-, Tierheim-, Inventory- oder sonstige produktive Datenbanken.
- Trotz erfolgreichem SQL-Test kann aktuell **kein echtes Datum als frei bestätigt oder reserviert werden**, weil noch kein eigenes Supabase-Cloudprojekt, kein bestätigter Gerätebestand und kein freigegebener Buchungsprozess existieren.

## Aktualisierung 06.11.2026 – Persönlicher Adminbereich 3.6

Der erste Owner ist auf Neon `development` nach nachgewiesener E-Mail-Verifizierung kontrolliert aktiviert. Unter [`/admin/login/`](https://deploy-preview-2--fotopolis-preview.netlify.app/admin/login/) stehen nun Passwortanmeldung, alternative OTP-Anmeldung und selbstständige Passwortvergabe über einen einmaligen Sicherheitscode bereit. Nach erfolgreicher servertseitiger JWT-/RBAC-Prüfung erfolgt die Weiterleitung zum [`/admin/dashboard/`](https://deploy-preview-2--fotopolis-preview.netlify.app/admin/dashboard/), das den tatsächlichen Geräte- und Terminbestand ausschließlich lesend aus Neon abfragt. Der vorhandene Gerätebestand ist weiterhin leer. Für die Lese-API wurde eine zweite Rolle mit SELECT-Rechten nur auf Ressourcen und Belegungen eingerichtet. **Echte Passwortvergabe und kompletter Login-/Browser-Flow müssen noch mit dem Nutzer getestet werden.** Es gibt weiterhin keine echten CRUD- oder Kundenbuchungen. [Technischer Bericht](./FOTOPOLIS_ADMIN_STUDIO_3_6.md).

## Aktualisierung 06.11.2026 – Auth-Erstanmeldung 3.5

Der OTP-Login ist unter `/admin/login/` im Deploy Preview vorbereitet. Erste Owner-Mitgliedschaft ist noch deaktiviert, E-Mail nicht verifiziert. Eine Netlify-Function prueft signierte JWTs und die private Neon-Rolle. Keine Schreibrechte oder echte Buchungsfreigabe. Siehe `docs/FOTOPOLIS_ADMIN_AUTH_3_5.md`.

## Aktualisierung 06.11.2026 – Premium Admin Studio (Roadmap 7)

Die isolierte Netlify-Preview enthält jetzt [`/admin/`](https://deploy-preview-2--fotopolis-preview.netlify.app/admin/) mit Monats-/Wochenkalender, Gerätefilter und in-memory-Demo-Sperrzeiten. Das ist **keine produktive Admin-App**, sondern ein interaktiver Entwurf ohne echten Datenbankzugriff. Die Neon-Tabellen `fotopolis.admin_members` und `fotopolis.admin_activity` sind auf dem Entwicklungsbranch mit RLS erstellt; inzwischen ein noch deaktiviertes Owner-Mitglied angelegt. [Technischer Entwicklungsstand 3.3](./FOTOPOLIS_ADMIN_STUDIO_3_3_STEP_7.md). Authentifizierung, autorisierte Endpunkte und echte Änderungen bleiben ausdrücklich offen.

## Aktualisierung 06.11.2026 – eigene Neon-Cloudinfrastruktur

Die bisherige Supabase-Free-Organisation ist wegen zweier produktiv genutzter Projekte ausgeschöpft; Mammut und RM-Inventory bleiben unberührt. **Es erfolgt keine neue Supabase-Projektanlage.** Als kostenlose Alternative ist in Neon das bereits vom Nutzer angelegte Projekt `Fotopolis` (`icy-wave-78750589`, Frankfurt, Free) verbunden. Ein separater Neon-Branch `development` enthält das migrierte FOTOPOLIS-Buchungsschema. Die Neon-Abnahme dokumentiert [FOTOPOLIS_NEON_DEVELOPMENT_SETUP.md](./FOTOPOLIS_NEON_DEVELOPMENT_SETUP.md).

Der Neon-Branch `production` bleibt ohne FOTOPOLIS-Tabellen; das produktive Webhosting wird nicht geändert. Alle Neon-Testbuchungen wurden zurückgerollt. Roadmap 6 ist damit auf Datenbank-Entwicklungs-/Integritätsebene abgeschlossen, auf API-, Rechte- und Betriebsreifeebene weiterhin offen.

## Historischer Supabase-Plan (durch Neon ersetzt)

Der lesende Projektabgleich am 05.11.2026 hat **kein bestehendes FOTOPOLIS-Projekt** in der verbundenen allgemeinen Supabase-Organisation ergeben. Es bestehen Projekte anderer Anwendungen. **Diese dürfen nicht für FOTOPOLIS zweckentfremdet oder geändert werden.**

Vor der Implementierung des tatsächlichen Verfügbarkeits-/Buchungsbackends wird ein **getrenntes FOTOPOLIS-Testprojekt** benötigt. Etwaige Projekt-/Branch-Kosten, Organisation und Berechtigungen sind vor einer Anlage transparent zu prüfen und bei Kosten durch den Nutzer freizugeben. Die derzeitige Studio-Version 3.1 wird deshalb weiterhin bewusst **ohne** Supabase-Produktivverbindung betrieben. Der Punkt-6-SQL-Entwurf liegt ausschließlich im Entwicklungsrepository und wird separat in einem kurzlebigen PostgreSQL-17-CI-Container getestet.
