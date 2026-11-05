# FOTOPOLIS — Website Design 1.0 / QA

**Stand:** 05.11.2026 · **Quelle:** GitHub `WTF-Sascha/fotopolis-website`; Netlify `fotopolis-preview`.

## Umfang
- Premium-Startseite, Fotobox, Fotospiegel, Fotowohnwagen, Anlässe, Leistungen, FAQ, Über uns, Kontakt, Rechtliches (10 HTML-Seiten).
- Verbindliche CI-Farben und ausschließlich freigegebene Logo-Bilddatei.
- Responsive CSS, Mobile-Menü mit ARIA/Escape, anlassbasierte Auswahl, vorausgefüllter E-Mail-Anfrageentwurf.
- PWA-Manifest, Maskable-/Apple-Icons, Offline-Cache mit Versionswechsel.

## Verifizierte technische Checks
- GitHub: atomarer Design-Commit `874be6bb3b18f1b66f3fdd1c4393a830d9d512b6`.
- Korrektur: Vorauswahl eines Fotoerlebnisses auf der Kontaktseite, Commit `4715c8ad99b6a5e4434a5c0e417d4bfe06a06ae9`.
- Netlify: letzter Commit bereitgestellt; Status `ready`, kein Buildfehler.
- Alle 10 HTML-Seiten besitzen genau eine H1, Main-Landmark, Skip-Link, noindex und Original-Logo-Referenz.
- Sämtliche lokalen CSS-/JS-/Bild- und Link-Pfade im statischen Quellcode überprüft; keine fehlenden lokalen Zielpfade festgestellt.
- PWA-Manifest referenziert 3 App-Icon-Varianten; Service Worker beinhaltet sämtliche 10 Seiten.
- Kontaktverarbeitung: keine Backend-Submissions; ausschließlich ein manuell zu versendender E-Mail-Entwurf.

## Noch nicht als bestanden markieren
- Sichtprüfung der gerenderten Seite in Browsern, responsives Overflow-Testing auf 320/375/768/1440 px, Cross-Browser-Screenshots.
- Echte iOS-/Android-Installation und Offline-Test (einschließlich Cache-Update).
- Lighthouse Performance, Accessibility, Best Practices und WCAG-2.2-AA-Audit.
- Unternehmensdaten, Nutzungsrechte für echte Fotos, aktualisierte Leistungen, rechtlich vollständige Impressums-/Datenschutztexte.
- Produktionsreife Datenbank, Kontakt-Backend und Live-Domain: absichtlich ausstehend.
- GitHub-Repository und Netlify-Vorschau sind derzeit öffentlich erreichbar.

## UX-Grenzen
- Keine KI-/Stock-Eventfotos als echte Referenzen ausgegeben; Produktillustrationen sind abstrakte Designvisuals.
- Die Website ist ausdrücklich eine Entwicklungs- und Review-Umgebung, noch keine produktionsfreigegebene Unternehmenswebsite.

## Nächste Qualitätsschleife
1. Visuelles Review mit Auftraggeber anhand der Netlify-Preview.
2. Authentische Veranstaltungs- und Gerätefotos mit Nutzungsrechten einpflegen.
3. Mobile/Browser-/PWA-Tests und Lücken in der Barrierefreiheit schließen.
4. Angebote und Kontakt-/Backendprozess fachlich definieren; danach erst Produktivfreigabe.
