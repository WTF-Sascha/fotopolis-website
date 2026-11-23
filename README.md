# FOTOPOLIS — aktuelle Entwicklungsarchitektur (Studio 18.2)

> **Status: isolierter Entwicklungsbranch / NO-GO für Produktivveröffentlichung.**
> Dieser Abschnitt ist die aktuelle Referenz für den Studio-18.2-Branch.
> Der weiter unten unverändert erhaltene Abschnitt „Website Design 1.0“ ist
> historische Dokumentation und beschreibt **nicht** den aktuellen Gesamtstand.

## Architektur und verbindliche Quellen

| Bereich | Aktueller Stand |
|---|---|
| GitHub | `WTF-Sascha/fotopolis-website` · `main` veröffentlicht Studio 9.5, `staging` separate Basis, Studio-17- und Studio-18-PRs weiterhin Draft |
| Öffentliche Hauptpreview | `https://fotopolis-preview.netlify.app` (Stand Studio 9.5, nicht identisch mit Studio 18.2) |
| Aktueller Codekandidat | `feature/studio18-2-enterprise-quality-recovery`, abgezweigt von Studio-18-Feature-SHA `02b9cae31474fb0d250b1890ade0f23bf376e052` |
| Preview | Netlify-Pull-Request-/Branch-Deploy; nichtproduktive Zugriffe sind passwortgeschützt; ihre jeweilige Commit-ID prüfen |
| Build-Pipeline | `netlify.toml` → Python/Pillow → HTML/CSS/Vanilla JS → Netlify Functions → CI-2.1-Asset-/Print-Generatoren und Tests |
| Datenbank | Neon PostgreSQL Projekt `icy-wave-78750589`, getrennte Branches `production` und `development` |
| Auth | Neon Auth im Entwicklungszweig; JWT/JWKS und geschützte Netlify-API-Routen; vollständige Test- und Sicherheitsabnahme offen |
| Anfragen | Netlify Forms → geprüfter Event-/Function-Pfad → Neon Development CRM; echtes synchrones E2E und Recovery/Reconciliation nicht abgenommen |
| Verwaltung | Geschützte Admin-Oberflächen aus Studio 13–16; Studio-17-Sechs-Bereiche-UX bleibt ein **separater, nur lokaler Prototyp** |
| Marke | **CI 2.1**: Ivory `#F7F3EC`, Obsidian `#181512`, Espresso `#30251D`, Gelb `#FEE158`; Newsreader/Manrope; Original-Logo unverändert |
| Druck | 32 Classic- und 12 Signature-Kandidaten, 15×10-cm-Generator; 5×15-cm-Hardwarepfad und 44 echte Druckproofs offen |

## Sichere Entwicklung

- Keine Änderungen an `fotopolis-mieten.de`, `main`, `staging`, produktiven Neon-Daten/Secrets/Neon Auth.
- Nur Entwicklungsbranches und isolierte Preview-Kontexte. `scripts/studio18-2-preview-guard.mjs` blockiert Netlify-Produktionskontexte in diesem Branch.
- `scripts/studio18-2-build-provenance.mjs` erzeugt den Buildnachweis `studio18-release.json` und kennzeichnet interne Preview-Routen ausdrücklich als nicht freigegeben.
- Tests: `node --test scripts/test-studio18-2-release.mjs`. Für tatsächlich bestandene E2E-, Druck-, WCAG- und Performancefreigaben sind separate Nachweise erforderlich.
- Startpunkt für Fehlerregister, Änderungsnachweise, Blocker und Freigabegrenzen: `docs/FOTOPOLIS_STUDIO_18_2_RECOVERY_STATUS_2026-11-23.md`.
- Die Print- und CI-Kandidaten aus Draft PR #24 sowie die Verwaltungs-UX aus Draft PR #23 dürfen **nicht** als live oder fachlich abgenommen bezeichnet werden.

---

## Historischer Projektstand (Website Design 1.0)

# FOTOPOLIS · Website Design 1.0 / PWA

Status: **isolierte, öffentlich erreichbare Netlify-Entwicklungsvorschau**. Keine Freigabe für die bestehende Domain.

## Produktionsgrenzen
- **Das freigegebene FOTOPOLIS-Logo bleibt unverändert**. Einzige Markenbildquelle: `site/assets/fotopolis-logo-original.png` mit den vorhandenen PWA-Icons.
- **Corporate Identity 1.0 verbindlich**: Navy `#071B30`, Blue `#123B5C`, Champagne `#D7B77A`, Warm Ivory `#F8F2E6`; Begleitschriften Manrope/Inter mit datenschutzfreundlichen System-Fallbacks.
- Bisherige Website **fotopolis-mieten.de** wurde nicht verändert. Das neue Projekt ist auf `https://fotopolis-preview.netlify.app` begrenzt.
- Keine erfundenen Preise, Bewertungen oder Referenzfotos. Grafische Produktzeichnungen sind abstrakte Illustrationen, keine Produktfotos.
- Die Kontakt-E-Mail `kontakt@fotopolis-mieten.de` stammt aus dem bisherigen öffentlichen Webauftritt und ist vor dem Livegang erneut zu bestätigen.

## Umgesetzter Designumfang
- Neue Premium-Startseite mit Storytelling, Produktvergleich, Anlass-Auswahl, FAQ, Prozess und CTA.
- Angepasste Produktseiten: Fotobox, Fotospiegel, Fotowohnwagen.
- Weitere Seiten: Anlässe, Leistungen, Über uns, FAQ, Kontakt, Rechtliches.
- Mobile Navigation (Tastatur/Escape/ARIA), responsives Layout, Reduced-Motion-Unterstützung, lesbare Kontrastgestaltung.
- Kontaktformular erzeugt **nur eine lokale mailto-Vorlage**. Daten werden weder an Netlify noch an Supabase gesendet; die Nachricht wird erst durch manuelles Absenden im E-Mail-Programm verschickt.
- Service Worker mit offline verfügbaren Informationsseiten. App-Manifest und originale PWA-Icons bleiben erhalten.

## Verwendete Architektur
- Statische HTML-/CSS-/JS-Seiten ohne Analytics, eingebundene Trackingdienste oder JS-CDN.
- Netlify `publish = "site"`; Konfiguration in `netlify.toml`.
- GitHub `main` löst nach Commit ein Netlify-Preview-Deployment aus.
- Supabase ist **nicht angebunden**. Der Free-Projektplatz ist derzeit nicht verfügbar.

## Qualität, die noch aussteht
- Echte Eventbilder mit schriftlich geklärten Nutzungsrechten, Produktdetaildaten, aktuelle Paketpreise und authentische Referenzen.
- Vollständige, fachlich geprüfte Impressums- und Datenschutzseiten.
- Technisch abgesichertes Backend für echte Anfragen und späteres CMS.
- Browser-/Gerätetests auf iOS, Android und Desktop, Lighthouse-/WCAG-2.2-AA-Audit, PWA-Installationsprüfung.
- Für das Repo ist privat vorgesehen; aktueller Stand kann öffentlich sein. Netlify-Preview ist ohne Passwort zugänglich: keine geheimen Daten hochladen.

## Review-Checkliste
1. Desktop und Mobil öffnen: `https://fotopolis-preview.netlify.app`
2. Original-Logo, Navigation und alle Produktseiten vergleichen.
3. Anlass-Auswahl und Kontaktentwurf testen (kein automatischer Versand).
4. Menü am Smartphone und Tastaturnavigation prüfen.
5. PWA installieren und Informationsseiten offline erneut öffnen.
6. Inhaltliche Freigabe einholen. **Keine Live-Domain ohne gesonderte Freigabe.**
