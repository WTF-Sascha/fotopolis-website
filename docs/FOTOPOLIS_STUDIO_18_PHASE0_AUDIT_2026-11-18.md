# FOTOPOLIS Studio 18.0 · Phase 0 / CI-2.1-Fundament
Stand: 18.11.2026 · **Staging-only · NO-GO für Produktion**

## 1. Tatsächlich geprüfte technische Ausgangslage

- Repository: `WTF-Sascha/fotopolis-website`; Ausgangsbranch: `staging` @ `032c3f1bd1ad0e95e06ad48c9c0c467fc9586046`
- Referenz `main` (ungeschrieben): `1831a1eead195d78f33a9d5dcce0f350b72486d8`
- Separater Studio-17-Prototyp bleibt unangetastet: `feature/studio17-simplified-management-prototype-20261113` @ `087c1f6c8301a59bdf05130c01b3a34b6092ba7b`
- Studio-18-Branch: `feature/studio18-ci21-complete-brand-integration`, **ohne Merge**
- Netlify `publish = "preview-build"`; der Quellcode der aktiven Preview wird mehrstufig aus `concepts/premium-v2/`, `site/` und `scripts/` erzeugt. Deshalb darf eine Logo-/Farbänderung nicht nur im Verzeichnis `site/` erfolgen.
- Public-Site, Login, Dashboard und internes Design Studio werden über gebaute HTML-Dateien ausgeliefert.
- Auth ist Neon Auth, die Anfragen laufen über Netlify Forms und einen geschützten Neon-DEV-Verwaltungspfad. **Keine DB- oder Auth-Änderung** für Studio 18 autorisiert.

## 2. Verifizierte CI-Unterlagen / Originalasset-Grenze

Die freigegebenen Textquellen `fotopolis-ci-2.1.css` und `fotopolis-ci-2.1.tokens.json` wurden aus dem korrigierten CI-Kontext übernommen und liegen in `site/assets/brand/v2-1/`.

Die korrigierte CI-ZIP `FOTOPOLIS_Corporate_Identity_2_1_KORRIGIERT.zip` und das korrigierte PDF sind im Projektkatalog nachweisbar, aber die ZIP-Originalbytes ließen sich in dieser Sitzung **nicht** materialisieren. Die im Token-Manifest benannte Raster-Masterdatei `01_LOGO/fotopolis_logo_master_ivory_1254.png` ist im aktuellen Repository nicht als freigegebene CI-2.1-Masterdatei nachgewiesen.

**Konsequenz:** Studio 18.0 verwendet **kein** nachgezeichnetes, generiertes oder erratenes Logo. Die bisher gebauten Goldmark-Icons und Logo-Referenzen bleiben vorläufig aktiv. **Dies ist ein Release-Blocker.**

## 3. Bestandsmatrix / Migrationsstatus

| Fundstelle/Funktionsgruppe | Derzeitiger Stand | CI-2.1-Abweichung / Risiko | Erforderliche Maßnahme | Status |
|---|---|---|---|---|
| `site/assets/fotopolis-goldmark.webp` | Bisherige Goldmark im Build | Falsches Markenzeichen | Erst nach bytegenauer Übernahme des CI-Masters ersetzen | **Blockiert** |
| `scripts/apply-studio13-unified-brand.py` | Baut Goldmark-Icons und aktiviertes Alt-Stylesheet | PWA-/Brand-Quelle ist Studio 13 | Kontrollierter CI-Asset-Switch mit Hash- und Größenprüfung | **Offen** |
| `concepts/premium-v2/studio13-unified-brand.css` | Viele fest kodierte Espresso-/Goldfarben | Nicht vollständig CI 2.1 | Zentrale Variablen und komponentenweises Refactoring | **Teilweise** (kompatible Token-Ebene) |
| Öffentliche HTML-Seiten | Aus `preview-build` generiert | Alte Markenressourcen | Neue Tokens/Style-Ebene nach Alt-CSS einbinden, danach Screenshots prüfen | **Staging-Code umgesetzt, Browser-QA offen** |
| Header & Hero | Premium-Hero bereits freigegeben | Logo nicht CI 2.1 | Nur Logo/Kontrast/Responsive prüfen, Hero nicht ersetzen | **Logo blockiert** |
| `/admin/login/` | Geschützte Anmeldung | Alte Farb- und Logo-Elemente | CI-Styling mit echter Auth-Regression absichern | **Teilweise** |
| `/admin/dashboard/` | Kompakte Workspace-Navigation | Einzelne Altstile | CI-Styling ohne Rollen- oder UX-Regressionsfehler | **Teilweise** |
| `/admin/designstudio/` | Internes geschütztes Design Studio | Logo-/Editor-Farben/Printvorschau offen | Rechteprüfung, Editor-/Druck-Farbtreue, Templates | **Offen** |
| Kundenportal | Nach tatsächlichem Implementierungsstand zu prüfen | Kein ungeprüfter Funktionsstatus | Vorhandene Routen ermitteln, CI & RBAC prüfen | **Offen** |
| `site/manifest.webmanifest`, Service Worker | Bestehende eine PWA, Goldmark-Icons | Neue CI-Icons fehlen | Farben und Cache-Referenzen vorbereiten, Icons nach Quellenfreigabe ersetzen | **Teilweise** |
| 32 Classic-Layouts | `fp-001.webp` bis `fp-032.webp` vorhanden | Master-/Printdateien nicht individuell geprüft | 1/2/3 Bilder, 5×15/10×15, Motivnamen, Logo, Druckproof | **Inventar, keine Freigabe** |
| 12 zusätzliche Signature-Layouts | Im vorbestehenden Build nachgewiesen | Können eigenes QA benötigen | Erhalten, nicht ungeprüft ändern | **Offen** |
| Originalfotos Fotobox/Mirror/Camper | Bestehende Produktdateien im Projekt | Originaltreue / Zuschnitt / Auslieferung | Nicht-destruktive Qualitätsprüfung | **Offen** |
| E-Mail/PDF/OG/QR/Printmaterial | Teilweise außerhalb des Builds | Nicht vollständig inventarisiert | Quelle und Ausgabepfad je Medium prüfen | **Offen** |

## 4. Technisch implementiert (nur Feature-Branch)

1. Freigegebene CI-2.1-Token-Dateien versioniert unter `site/assets/brand/v2-1/`.
2. Additive Übergangsebene `concepts/premium-v2/studio18-ci21-compat.css` mit CI-konformen Primäraktionen (Gelb mit Obsidian-Schrift), Fokus und semantisch getrennter Statuslogik.
3. `scripts/apply-studio18-ci21.py`: kopiert Tokens byte-identisch in die isolierte Build-Ausgabe, ergänzt sie nach der Alt-CSS-Ebene in allen tatsächlich gebauten HTML-Routen, aktualisiert Theme-Color und PWA-Cache **ohne** Icons/Originale auszutauschen; erzeugt dokumentierten NO-GO-Status.
4. `scripts/studio18-ci21-qa.mjs`: statisches Build-Gate für Token-Werte, Seiten-Cascade, 32 Classics, PWA-Scope, Cache-Referenzen und nicht irreführenden Freigabestatus.
5. `netlify.toml`: Stage-18-Build- und Testschritte nach den bisherigen Sicherheits- und Funktionsprüfungen in alle isolierten Preview-Kontexte integriert.

**Nicht behauptet:** kein echter Browser-Screenshot, keine erfolgreiche Netlify-Deployment-Prüfung, kein Auth-/Anfrage-E2E, kein CI-2.1-Logo-Switch, kein echter Fotoausdruck, kein Gerätetest.

## 5. Einzelprüfregister – 32 bestehende Classic-Vorlagen

Jede Reihe muss nach Einlesen der **tatsächlichen Print-Quelldatei** ergänzt werden. Eine registrierte WebP-Vorschau ist **kein** bestandener Drucktest.

| Vorlage | Stand | Einzelabnahme |
|---|---|---|
| FP-001 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-002 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-003 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-004 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-005 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-006 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-007 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-008 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-009 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-010 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-011 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-012 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-013 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-014 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-015 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-016 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-017 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-018 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-019 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-020 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-021 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-022 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-023 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-024 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-025 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-026 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-027 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-028 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-029 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-030 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-031 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |
| FP-032 | Quelle im Repository erfasst | Quelldatei, Fotofelder, Logo, eingebrannter Vorlagenname und Druckproof offen |

Pflicht je Vorlage: Logovariante unten rechts; kein Logo-Overlay über Altlogo; keine Designbezeichnung im Druck; Inhalts- und Sicherheitsabstände; 300 DPI bzw. hardwaregerechte Auflösung; 5×15/10×15 cm; korrekte Felder für 1, 2 oder 3 Fotos; Vorschau = tatsächlicher Druck; Vorher-/Nachher- und physischer Printproof.

## 6. P0-Abnahme-Gates / Freigabeentscheidung

- [ ] Bytegenaue Quelldateien des korrigierten CI-2.1-Pakets erhalten, Herkunft und Hash dokumentiert
- [ ] Finale Logos (Header, Footer, PWA, Social, Kundenportal, Admin, Print) aus diesen Originalen abgeleitet
- [ ] 32 Classic-Printlayouts einzeln geprüft, repariert und auf echter Hardware freigegeben
- [ ] Alle aktiven Seiten auf 320/360/390/768/1024/1280/1440 px visuell geprüft; Vorher/Nachher
- [ ] Kontrast-/Tastatur-/Screenreader-Checks WCAG 2.2 AA
- [ ] Neon-Auth-/RBAC-/Session- und Netlify-Forms-E2E mit Testdaten
- [ ] Studio-17-Konzept separat geprüft, keine unautorisierte Übernahme
- [ ] Produktoriginale, E-Mail-/Dokumentenmedien, Geräteoberflächen und Caches geprüft
- [ ] Tatsächlicher GitHub-/Netlify-Status des neuesten Feature-Commits grün nachgewiesen
- [ ] Gesonderte ausdrückliche Freigabe vor jedem produktiven Merge und Livegang

**Aktuelle Entscheidung: NO-GO für Veröffentlichung.**

## 7. Rollback

Vor jeder Prüfung den letzten unveränderten `staging`-Commit `032c3f1bd1ad0e95e06ad48c9c0c467fc9586046` sichern. Für eine reine CI-Vorschau kann der Studio-18-Feature-Branch verworfen oder seine isolierte Preview abgeschaltet werden; `main`, `staging`, Live-Domain, Neon-DB und echte Kundeninformationen wurden nicht geschrieben. Ein späterer Merge benötigt eine neue Baseline- und Konfliktprüfung und eine gesonderte Freigabe.

**Keine Freigabe der alten Goldmark als Ersatz für die CI-2.1-Originalmarke.**
