# FOTOPOLIS Studio 17.0 — Phase 1: UX-Konzept zur Abnahme

**Status:** ausschließlich klickbarer, isolierter Konzeptprototyp. Keine Freigabe für Phase 2, produktive Dienste oder Merge.
**Quelle:** `concepts/studio17-prototype/`
**Deploy-Preview-Pfad:** `/studio17-konzept/` auf der nummerierten Netlify-PR-Preview.

## Einfache, verbindliche Informationsarchitektur

Hauptnavigation (exakt sechs): Übersicht, Anfragen, Termine, Geräte, Designs, Website.
Sekundär: Einstellungen (Rechte, Audit, Konto, Systemstatus).

Die bestehende technische Struktur mit 14 Bereichen bleibt vollständig unberührt. Dieses Konzept ist **keine neue echte Adminoberfläche**: keine Anmeldesimulation, keine Authentifizierung, keine Kundendaten, kein API-Zugriff und keine Speicherung.

## Klickbare UX-Aufgaben in Phase 1

1. Dashboard-Kachel → Anfrage öffnen und Status nur lokal simulieren.
2. Anfrage → Terminplanung auf gewähltem Datum öffnen (ohne echte Vormerkung).
3. Kalender: Monat wechseln, einen Tag wählen, Demo-Sperrzeit lokal hinzufügen.
4. Geräte: nach Typ suchen, Detailansicht öffnen, Demogerät hinzufügen, Status lokal ändern.
5. Designs: alle 44 Katalog-IDs mit Paginierung, 32 Classic mit vorhandenen öffentlichen WebP-Vorschauen, 12 Signature **nur als Konzeptplatzhalter**. Detail und Qualitätsstatus lokal simulieren. **Kein Zugriff auf private Druckoriginale.**
6. Website: Bereich wählen, Entwurf simulieren; nie etwas veröffentlichen.
7. Einstellungen: klare Sekundärnavigation ohne echte Rollen-/Auth-Eingriffe.
8. Mobil: ein per Hamburger erreichbares Menü; Desktop: feste schmale Navigation. Nie zwei gleichzeitige Menüs.

## Designgrenzen

- Unveränderte, existierende Freigabe-Goldmark unter `/assets/fotopolis-goldmark.webp`.
- Warmes Ivory/Espresso/Gold-System; keine blaue Navigation, keine Produktrebrandings.
- Keine Änderungen an öffentlichem Hero, Druckdateien, PWA-Manifest, realem Administrator oder Kontaktformular.
- Keine echten Namen/E-Mail-Adressen: `example.invalid`-Fixtures.
- Keine Browser-Persistenz (`localStorage`, `IndexedDB`), keine Netzwerk-API, keine Form-POSTs.
- Header: `DEMODATEN · KEINE SPEICHERUNG`; zusätzlich `noindex` in HTML.
- Produktionsbuild durch den bereits vorhandenen Studio-15-Release-Guard sowie den separaten Stage-Guard gesperrt.
- Netlify-Site-Policy schützt Nichtproduktionsdeployments mit einem Sitepasswort; das Demo selbst besitzt bewusst keine echte Authentifizierung.

## Abnahme Phase 1 (vor Phase 2)

- [ ] Anwender bestätigt die sechs Hauptbereiche und Verständlichkeit der Bezeichnungen.
- [ ] Anfragen → Terminplanung ohne Orientierungsverlust nachvollziehbar.
- [ ] Gerätemanagement und Designfreigaben verständlich und eindeutig als Simulation gekennzeichnet.
- [ ] Mobile UX auf 320/390/768 px, Desktop auf 1440 px ohne horizontales Überlaufen.
- [ ] Kein produktiver Zugriff, keine echte Datenverarbeitung, keine Änderung vorhandener Admin-Funktionen.
- [ ] Brand-Master exakt und korrekt angezeigt.
- [ ] Fokus, Tastaturbedienung und Dialogschließen funktionieren.
- [ ] Erforderliche Anpassungen aus Benutzerfeedback gesammelt.
- [ ] Separate ausdrückliche Freigabe für Phase 2.

Ein grüner Chromium-Test bestätigt lediglich die Funktionsfähigkeit der isolierten Demo; **kein** reales Login, keine Buchungsberechtigung und keine menschliche Designabnahme.

## Umsetzung nach Freigabe (nicht begonnen)

Phase 2 würde die nun rein statische Struktur schrittweise und rückwärtskompatibel mit den bestehenden JWT/RBAC-geschützten Modulen verbinden. Migrationen, neue Rechte und produktive Änderungen bleiben getrennte Freigabegates. `fotopolis-mieten.de` bleibt unverändert.
