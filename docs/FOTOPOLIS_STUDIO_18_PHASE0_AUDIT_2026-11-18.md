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

**Aktualisierte Quellprüfung 18.11.2026:** Das nun direkt hochgeladene, 12-seitige `FOTOPOLIS_Corporate_Identity.pdf` weist die CI **2.1** ausdrücklich aus (SHA256 `f642fa35216761d78a1b2567de7cfcba2dfe5c85ee841a4d0c3ff0d704d29b86`). Vier Bildkomponenten aus dem vorher hochgeladenen, vollständig integritätsgeprüften **Logo-Paket 2.0** stimmen **RGB-pixelgenau** mit den eingebetteten CI-2.1-PDF-Bildobjekten überein: vollständiger Master (1254²), transparenter Badge (1254²; RGB geprüft), Fotozeichen (422²), Original-Wortmarke (922×414). In PDF Seite 5 ist exakt dieses Logodesign freigegeben. **Die 2.0-Bilddateien sind als Quelle für CI 2.1 gültig; die veralteten 2.0-Gestaltungsregeln sind nicht gültig.**

**Konsequenz:** Ein zusätzliches korrigiertes CI-2.1-Logo-ZIP ist für die Bildfreigabe nicht erforderlich. Die bestätigten Binärdateien müssen jedoch vor der Aktivierung noch in das Studio-18-Repository übertragen und je Oberfläche korrekt eingebunden werden. Bis dahin bleiben alte Goldmark-Icons in der Feature-Preview sichtbar; **tatsächliche Asset-Migration und Release-QA bleiben offen**, nicht die Identität des Originals.

## 3. Bestandsmatrix / Migrationsstatus

| Fundstelle/Funktionsgruppe | Derzeitiger Stand | CI-2.1-Abweichung / Risiko | Erforderliche Maßnahme | Status |
|---|---|---|---|---|
| `site/assets/fotopolis-goldmark.webp` | Bisherige Goldmark im Build | Falsches Markenzeichen | Vom PDF bestätigte Originaldatei aus Logo-Paket 2.0 einbinden; anschließend alle Fundstellen prüfen | **Blockiert** |
| `scripts/apply-studio13-unified-brand.py` | Baut Goldmark-Icons und aktiviertes Alt-Stylesheet | PWA-/Brand-Quelle ist Studio 13 | Kontrollierter CI-Asset-Switch mit Hash- und Größenprüfung | **Offen** |
| `concepts/premium-v2/studio13-unified-brand.css` | Viele fest kodierte Espresso-/Goldfarben | Nicht vollständig CI 2.1 | Zentrale Variablen und komponentenweises Refactoring | **Teilweise** (kompatible Token-Ebene) |
| Öffentliche HTML-Seiten | Aus `preview-build` generiert | Alte Markenressourcen | Neue Tokens/Style-Ebene nach Alt-CSS einbinden, danach Screenshots prüfen | **Staging-Code umgesetzt, Browser-QA offen** |
| Header & Hero | Premium-Hero bereits freigegeben | Logo nicht CI 2.1 | Nur Logo/Kontrast/Responsive prüfen, Hero nicht ersetzen | **Logoquelle verifiziert; Einbindung offen** |
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

**Nicht behauptet:** kein echter Browser-Screenshot, kein Auth-/Anfrage-E2E, kein CI-2.1-Logo-Switch, kein echter Fotoausdruck, kein Gerätetest. Die Netlify-Feature-Preview war zuletzt **ready**; das ist kein visueller oder funktionaler Freigabenachweis.

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

- [x] CI-2.1-PDF als aktuell verbindlich bestätigt und die vier Bildkomponenten der Logo-Quelle 2.0 RGB-pixelgenau verglichen; SHA-256 der PDF/des ZIP und PNG-Masters dokumentiert
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

**Keine Freigabe der alten Goldmark als Ersatz für die CI-2.1-Originalmarke. Das freigegebene Original stammt nach Vergleich aus dem Logo-Quellpaket 2.0.**


## 8. Nachtrag – eingegangener Logoquellstand 2.0 (18.11.2026)

**Prüfgegenstand:** vom Auftraggeber separat hochgeladenes `FOTOPOLIS_Logo_Paket_Brand_Identity_2_0(1).zip`.
- ZIP-SHA256: `9babe8c0889d5a28a9cdcc85669bdaebf6274a3c47fc761b9397cca5e1d8c685`
- Archivintegrität (ZIP-CRC): bestanden; 33 Einträge, davon 31 im integrierten Asset-Manifest mit SHA256 verifiziert.
- `01_MASTER/fotopolis_logo_master_1254px_ivory.png`: 1254×1254 RGBA, SHA256 `3aa473c6788beb52587a7c5c423cd83f05a44e356b51bcabbb5b6f7af6957a24`
- `01_MASTER/fotopolis_logo_badge_transparent.png`: 1254×1254 RGBA, SHA256 `142596acd0be1c589c5eb744ebe7b6d98794efe9ded3c48561cafdec94f2ee03`
- Weitere echte Dateien: Icon/WebP, Favicons, PWA-Maskable, Social, Print und Vorlagen-Guide 2.0.
- Sichtprüfung: geschwungene Fotopolis-Wortmarke, gestapelte gelbe Fotosymbole, SOCIAL EVENTS, elfenbeinfarbener Grund. Kein Vektormaster enthalten.
- **Versionskonflikt:** Der gelieferte `MIGRATIONSPLAN.md` von **2.0** verbietet die Verwendung des Fotomotiv-Gelbs als primäre UI-Farbe, während die **CI 2.1** `#FEE158` explizit für primäre CTA-Elemente vorschreibt. Die Richtlinien sind daher **nicht** als identisch zu behandeln.
- Der korrigierte CI-2.1-Master `01_LOGO/fotopolis_logo_master_ivory_1254.png` konnte bislang nicht bytegenau gegen das 2.0-Paket verglichen werden. Gleiche Motivbeschreibung beweist **keine** identischen Quelldateien.
- **Konsequenz:** Dieser 2.0-Quellstand ist als überprüfte Referenz dokumentiert, nicht als CI-2.1-Freigabe eingespielt; keine automatische Änderung von Logo, PWA-Icons, Druckvorlagen oder Produktbildern. **CI-2.1-Quellpaket weiterhin blockierend.**


## 9. Abschließende Klärung der CI-2.1-Quelle (ersetzt abweichende Aussagen in § 8)

Am 18.11.2026 bestätigte der Auftraggeber die hochgeladene Datei `FOTOPOLIS_Corporate_Identity.pdf` ausdrücklich als **aktuelle Corporate Identity**. Der Titel lautet „Corporate Identity 2.1“. Der im vorherigen § 8 genannte Versionskonflikt betrifft **ausschließlich die Regeln aus dem alten Brand Guide 2.0**, **nicht** die Logo-Originalbilder. Die PDF bestätigt genau dieselben RGB-Pixel des vollständigen Masters, des Badge-Motivs, des Fotosymbols und der Schriftmarke.

| Prüfobjekt aus PDF CI 2.1, Seite 5 | ZIP-Quelle Brand Identity 2.0 | RGB-pixelgenau |
|---|---|---|
| Master · Ivory (1254×1254) | `01_MASTER/fotopolis_logo_master_1254px_ivory.png` | **Ja** |
| Badge · dunkel (1254×1254) | `01_MASTER/fotopolis_logo_badge_transparent.png` | **Ja, RGB**; Alphakanal separat prüfen |
| Foto-Symbol (422×422) | `02_WEB/fotopolis_logo_photo_icon_422px.png` | **Ja** |
| Original-Wortmarke (922×414) | `02_WEB/fotopolis_wordmark_only_transparent.png` | **Ja, RGB**; Alphakanal separat prüfen |

**Verbindliche CI-2.1-Regeln aus PDF:** Logo Yellow `#FEE158`, Ivory `#F7F3EC`, Obsidian `#181512`, Espresso `#30251D`, Muted Gold `#B99862`, Warm White `#FFFCF8`; Primäraktion Gelb mit dunkler Schrift (Hover `#F8D543`), 3-px-Fokusring, Newsreader/Manrope, keine neu gesetzte Wortmarke. Die Produkte bleiben originalgetreu, der freigegebene Hero wird nicht ersetzt; 32 Classic-Printlayouts sind einzeln zu prüfen, Logos unten rechts und keine Designnamen auf den Ausdrucken. Rollout nur Feature-Preview und Freigabe-Gates; **kein Merge, keine DB-Migration, keine Live-Domain-Änderung.**

**QA-Entscheid:** Identität der Bildquelle **verifiziert**; Einbau, Druck, E2E, Screenshots sowie Barrierefreiheit **weiterhin NO-GO für Live**. Ein zusätzliches 2.1-ZIP zur Identitätsklärung muss nicht mehr angefordert werden.
