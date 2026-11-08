# FOTOPOLIS · Website Development 2.9 – Roadmap Punkt 5

**Status:** isolierte Entwicklungs-Preview, `design/premium-v2` in PR #2 (Draft). Kein Merge, kein Live-Deploy.

## Auftrag
Aus der bisher rein textbasierten Kontaktseite einen professionellen, mobil bedienbaren Event-Anfrageprozess entwickeln. Die Eingaben sollen **noch nicht** an einen Server gesendet, gespeichert oder als Buchung bestätigt werden, da Admin-, Verfügbarkeits-, Rechts- und Sicherheitsfreigaben noch ausstehen.

## Umsetzung
- Neue `/kontakt/`-Darstellung mit drei logisch gruppierten Schritten:
  1. Anlass, Fotoerlebnis, Wunschtermin, Tageszeit, Veranstaltungsort und Gästezahl.
  2. Name, E-Mail, optionale Telefonnummer und bevorzugter Kontaktweg.
  3. Druck-/Layout-/Hintergrund-/Betreuungs-/Liefer- und digitale Übergabeoptionen und Freitext.
- Native Pflichtfeld- und E-Mail-Validierung. Name, gültige E-Mail und Anlass müssen ausgefüllt werden, bevor das E-Mail-Programm geöffnet werden kann.
- Browserlokal aktualisierte Zusammenfassung; `mailto:`-Entwurf wird **erst durch explizite Interaktion** geöffnet, nie automatisch gesendet. Option zum Kopieren der Angaben.
- `?produkt=Fotowohnwagen` (analog Fotobox/Fotospiegel) wählt das Produkt voraus; kein Cookie, Tracking, Datenbankzugriff oder verdeckter HTTP-Request.
- Bestehende Startseiten-CTA führt nun zum neuen Kontaktbereich. Original-Logo, alle Produktbilder und bildfreier Hero unverändert.
- Ein deutlicher Datenschutzhinweis erläutert, dass die Daten bis zum eigenständigen E-Mail-Versand ausschließlich im Browser verbleiben. **Das ist keine echte Online-Formularübermittlung.**

## Technische Dateien
- `concepts/premium-v2/pages.json` (Version 2.9)
- `scripts/build_premium_pages.py` (semantische, HTML-escaped Formularstruktur)
- `concepts/premium-v2/contact-flow.js` (kein API-/Storage-/Tracking-Code)
- `concepts/premium-v2/styles.css` (responsive)
- `concepts/premium-v2/index.html` (CTA + Versionskennzeichnung)
- `scripts/build-premium-preview.py` (Script nur im Preview-Build)
- `scripts/premium-step5-qa.mjs` (7 Breiten 320 bis 1920 px, Formularvalidierung, Mailto-Komposition, Netzwerkzugriffe und Bild-/Layoutprüfung)
- `.github/workflows/premium-concept-qa.yml` (verbindliches fünftes QA-Gate)

## Freigabeanforderungen, die **nicht** ersetzt werden
- Freigegebene E-Mail-Adresse, Verantwortliche für Anfragebearbeitung und Datenschutzangaben
- Tatsächlicher Serverbetrieb zur verschlüsselten Annahme, Aufbewahrung, Löschung und Bearbeitung von Interessentendaten
- Supabase-Testumgebung mit RLS, Rollen, Audit-Logs, Verfügbarkeits- und Konfliktprüfung
- Buchungsregeln: Zeiten, Vorbereitung/Anfahrt, Produkte, Blocker, Mindestmietdauer, Bearbeitungs- und Stornierungslogik
- Automatisierter E-Mail-Versand und verbindliche Bestätigungen erst nach separater fachlicher und technischer Freigabe

## Qualitätsnachweis
Durchlauf über Netlify Deploy Preview (GitHub Actions) mit den vorherigen 1.943 automatisierten Prüfungen, plus separatem Schritt-5-Formulartest und Screenshots. Endergebnis hier erst als bestanden dokumentieren, wenn der jeweilige Workflow tatsächlich erfolgreich abgeschlossen ist.

## Schutz
Keine Änderungen an `main`, der bisherigen Website, dem Original-Logo oder vorhandenen Produktbildern. PR #2 bleibt Draft, kein Merge, keine kostenpflichtigen externen Dienste und keine produktiven Supabase-Daten.

## Finaler technischer QA-Nachweis

[GitHub Actions Lauf 42081370163](https://github.com/WTF-Sascha/fotopolis-website/actions/runs/42081370163), geprüfter Code-Commit `5ddb446c88d59b91fb4abd667c58c2372e8935e8`, Status **success**:

| Prüfsuite | Bestanden |
| --- | ---: |
| Startseite im Quellkonzept | 124/124 |
| Startseite im Netlify-Publish-Build | 124/124 |
| Navigation und alle Unterseiten | 147/147 |
| Vollständiges Layout (12 Routen, 9 Breiten) | 1.188/1.188 |
| Paketfinder-Regression | 108/108 |
| Anlässe, Galerie, Vertrauen | 252/252 |
| Kontakt-/Anfrageformular (7 Breiten) | 126/126 |
| **Gesamt** | **2.069/2.069** |

Die Kontakt-QA hat 320, 768 und 1440 px als Vollseiten-Screenshots archiviert. Die drei Aufnahmen wurden nach Download des Artefakts in einer visuellen Gegenüberstellung geprüft: keine erkennbaren Überlappungen oder abgeschnittenen Inhalte, mobile Anordnung untereinander und Desktop-Anordnung in zwei Spalten sind konsistent. Frühere Galerie- und Produktbildprüfungen bleiben im Regressionstest aktiv.

**Abgrenzung:** Der echte servergestützte Versand, die sichere Verarbeitung personenbezogener Anfragen und die verbindliche Kalenderreservierung sind noch **nicht implementiert**. Punkt 5 ist als lokale Vorschau mit vom Nutzer eigenständig zu versendendem E-Mail-Entwurf abgeschlossen, aber noch **keine fertig freigegebene Produktivfunktion**.
