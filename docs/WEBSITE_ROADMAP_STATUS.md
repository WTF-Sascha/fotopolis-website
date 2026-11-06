# FOTOPOLIS – Website-Roadmap · verbindlicher Gesamtstatus

**Arbeitsbereich:** Nur Branch `design/premium-v2`, Draft-PR #2, Netlify Deploy Preview. Kein Merge und kein Livegang ohne zusätzliche Freigabe. Freigegebenes Logo, originale Produktbilder und bestehende Domain bleiben unangetastet.

| Nr. | Roadmap-Schritt | Status | Freigabe-/Abhängigkeitskriterium |
| --- | --- | --- | --- |
| 1 | Inhaltsübernahme, Premium-Hauptmenü, Seitenarchitektur | In Preview implementiert | Abschließender Text-/Rechteabgleich |
| 2 | Drei Premium-Produktdetailseiten | In Preview implementiert | Ausstattung und Leistungsumfang durch FOTOPOLIS bestätigen |
| 3 | Pakete, Leistungen, Paketfinder | In Preview implementiert | Angebotspreise und Paketinhalt schriftlich bestätigen |
| 4 | Anlässe, Galerie, Vertrauenselemente | In Preview implementiert | Bild-/Personenrechte und Fotobezeichnungen prüfen |
| 5 | Kontakt- und Anfrageprozess | Preview-Kontaktformular mit eigenständigem E-Mail-Entwurf implementiert; Live-Datenübertragung **nicht** vorhanden | Formularworkflow, rechtliche Angaben, Aufbewahrung, Versand |
| 6 | Supabase-Buchungsdatenbank und Verfügbarkeitslogik | **Datenmodell und Kollisionslogik entwickelt, in PostgreSQL 17 inkl. paralleler Buchungen erfolgreich getestet**; Supabase-Testprojekt und Cloudanbindung ausstehend | Eigenes FOTOPOLIS-Projekt + Kostenfreigabe; reale Inventar-/Pufferregeln, Adminrechte und Security Advisors |
| 7 | Admin-Kalender und interne Sperrzeiten | Noch nicht implementiert | Auth, rollenbasierte Rechte, Audit-Logs, Testnutzer |
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

## Abhängigkeit für die Schritte 6–8 · Supabase-Isolation

Der lesende Projektabgleich am 05.11.2026 hat **kein bestehendes FOTOPOLIS-Projekt** in der verbundenen allgemeinen Supabase-Organisation ergeben. Es bestehen Projekte anderer Anwendungen. **Diese dürfen nicht für FOTOPOLIS zweckentfremdet oder geändert werden.**

Vor der Implementierung des tatsächlichen Verfügbarkeits-/Buchungsbackends wird ein **getrenntes FOTOPOLIS-Testprojekt** benötigt. Etwaige Projekt-/Branch-Kosten, Organisation und Berechtigungen sind vor einer Anlage transparent zu prüfen und bei Kosten durch den Nutzer freizugeben. Die derzeitige Studio-Version 3.1 wird deshalb weiterhin bewusst **ohne** Supabase-Produktivverbindung betrieben. Der Punkt-6-SQL-Entwurf liegt ausschließlich im Entwicklungsrepository und wird separat in einem kurzlebigen PostgreSQL-17-CI-Container getestet.
