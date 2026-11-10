# FOTOPOLIS Studio 13.0 – Bestandsaufnahme, Architektur und Stage-Gates
Stand: 10.11.2026 · Scope: ausschließlich isolierter Entwicklungsbranch.

## Technisch verifizierte Ausgangslage
- GitHub: `WTF-Sascha/fotopolis-website`, derzeit **öffentlich**, Schreibberechtigung vorhanden.
- Studio 12: Draft-PR #18, Head `e50916d87f1e5e83c6c8007ed3293923c03a966a`; 32 Classics und 12 Signature-Layouts (Manifest-Prüfung im Build).
- Netlify: `fotopolis-preview`, Formularverarbeitung aktiviert. Ziel-Build: `preview-build`; keine produktive Domain-Änderung.
- Supabase: In den verbundenen Konten kein FOTOPOLIS-Projekt gefunden. Andere dort sichtbare Projekte sind **nicht** Bestandteil dieses Auftrags und dürfen nicht geändert werden.
- Tatsächlicher Backend-Stack in Git: **Neon Auth** + Neon PostgreSQL Entwicklungsbranch `development` im Projekt `icy-wave-78750589`, nicht Supabase. Die existierende Verwaltung hat echte Auth-, Termin-, Geräte-, Sperrzeit- und Audit-Funktionen.
- Vorhandene Rollen: `owner`, `manager`, `viewer`. Sechs Studio-13-Rollen dürfen erst nach serverseitig abgestimmter und getesteter Rechte-Migration aktiviert werden.
- Kein nachgewiesener, datenschutzrechtlich freigegebener Web-Analytics-Datenfluss.
- **Kritischer Studio-12-Sicherheitsblocker:** `/designstudio/` ist ein öffentlicher Editor; `/assets/designvorlagen/print/` enthält öffentlich auslieferbare Produktionsdateien. Ein neuer Admin-Menüpunkt allein behebt das nicht.
- Ursprüngliche Admin-JWT-Gate-Implementierung band den `Origin` an Deploy-Preview #2. Studio 13 akzeptiert ausschließlich `deploy-preview-N--fotopolis-preview.netlify.app` desselben Netlify-Projekts und lehnt abweichende Origins ab (weiterhin nur Deploy-Previews, nie veröffentlichte Deployments).
- Die bereits bestehenden Studio-11- und Studio-12-QA-Berichte und ihre Einschränkungen bleiben historische Belege; sie ersetzen keine Studio-13-Neutests.

## P0 – vor funktionaler Freigabe
1. **Private Studio-Dateien**: Druckoriginale aus dem öffentlich auslieferbaren Build entfernen, in geschützte Storage/Function-Bundles übertragen, direkte URL- und CDN-Zugriffe negativ testen. Editor, Vorlagenmanifest, API und Bildexport **serverseitig** autorisieren. Öffentliche Galerie nur mit Webvorschaubildern und unverbindlicher Vorlagenauswahl.
2. **Admin-Authentisierung**: Preview-Origin-Gate, JWT-Signatur und aktive Mitgliederrolle zusätzlich durch reale Browser- und API-Tests belegen. Produktion geschlossen halten. Role-Matrix für Owner/Manager/Designer/Editor/Eventmanager/Analyst aus bestehender Neon-Struktur ableiten.
3. **Formulare & personenbezogene Daten**: Netlify-Forms mit geschütztem Backend abrufen, nur berechtigte Rollen lesen, doppelte Anfragen nicht duplizieren, Buchungen strikt getrennt; keine produktiven Kundendaten manipulieren.
4. **Repository-Sichtbarkeit**: öffentlich -> privat nur nach Prüfung von Netlify- und GitHub-Integrationsauswirkungen. Keine Credentials im Repository, auch nicht nach einer Umstellung.

## P1 – Fachliche Erweiterung
- Dashboard: KPIs ausschließlich mit definiertem Ereignisschema, bekannter Datenquelle und Leerzustand.
- Analytics: datensparsame, dokumentiert zulässige Architektur, begründete Consent-Entscheidung, Bot-/Duplikat-Filter. Keine unbestätigte Einwilligungsfreiheit.
- Anfragen: Anfragen-Inbox, Status-Workflow, Berechtigungen, Audit und Datenschutz.
- CMS: Entwurf / Prüfung / Freigabe / Veröffentlichung, versioniert, mit Vorschau und Rollback. Kein autonomes Live-Publishing.
- Media: öffentliche Webvarianten und private Originale mit unveränderlichem Markenmaster, sichere Uploads, Versionsbezug.
- Design Collection: alle 44 Vorlagen (32+12), Prüfworkflow und 15x10 cm / 300 DPI als Baseline; reale Drucker-Freigabe offen.

## P2 – Abnahme, Go/No-Go
- Desktop/Mobile 360/390/430/768/1024/1440/1920 px, reale Screenshots, Screenreader-/Keyboard-Flows.
- Authentifizierte/unauthentifizierte API- und Asset-Zugriffsmatrix, Storage-Routen, Regressionen bestehender Admin-Funktionen.
- Eventanfrage-Form, Netlify-Deploy-Kontext, PWA/Service Worker, 44 Vorlagen, PNG-Druckausgabe (ICC, Beschnitt, physischer Proof separat).
- Keine produktive Veröffentlichung, kein Merge nach `main` und keine Änderung produktiver Kundendaten ohne ausdrückliche Freigabe.

## Umsetzung in diesem Commit
- Sicherheitskorrektur: Origin-Prüfung preview-nummernunabhängig, aber origin-/sitegebunden.
- Zusätzliche Negativtests für fremde Hosts, fremde Preview-Origins und veröffentlichte Deployments.
- Neue Command-Center-Navigation und responsive Module in der vorhandenen **authentifizierten** Admin-Anwendung, ohne Ersatz der bewährten Verwaltungsfunktionen.
- Alle noch nicht angebundenen Funktionen zeigen echte Leer- bzw. Integrationszustände, keine erfundenen Daten.
- **Noch nicht fertig:** private Editor-Migration, Analytics, CMS, Anfrage-Inbox, vollständige Rollenmatrix, realer End-to-End-Test. Diese Funktionen werden nicht als freigegeben behauptet.
