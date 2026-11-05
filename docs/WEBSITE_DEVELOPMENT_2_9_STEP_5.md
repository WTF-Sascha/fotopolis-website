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
