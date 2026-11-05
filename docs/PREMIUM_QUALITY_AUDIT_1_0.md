# FOTOPOLIS — Independent Quality Audit 1.0

**Datum:** 05.11.2026  
**Untersucht:** `WTF-Sascha/fotopolis-website` (Website Design 1.0, 10 HTML-Seiten), Netlify `fotopolis-preview`, CI- und Logo-Vorgaben.  
**Gesamtstatus:** ❌ **NICHT PREMIUM-FREIGABEFÄHIG**. Die technische Veröffentlichung wurde bereits bestätigt, die gestalterische Freigabe ausdrücklich nicht.  
**Scope:** statische Quellcodeanalyse, Designkonzept-/Content-Audit und Netlify-Deploymentstatus. **Kein** vollständiger Screenshotvergleich, Real-Device-Test, Lighthouse- oder WCAG-Audit erfolgt. Live-Preview war in der aktuellen Testumgebung nicht visuell erreichbar.

## Befunde nach Kritikalität

### BLOCKER / P0

**P0-01 – Bildwelt fehlt**
- Messung im tatsächlichen Repository: 10 Seiten, 0 reale Event- oder Produktbilder. Die `<img>`-Elemente enthalten ausschließlich das originale Markenlogo (Startseite: 3, andere Seiten: je 2).
- Konsequenz: Produkt und Erlebnis können visuell nicht bewertet werden. Die Website funktioniert eher als textlastige Konzeptstudie als als Premium-Eventmarke.
- Maßnahme: kuratierte echte Eventbilder (Lizenz-/Einwilligungsprüfung), echte Aufnahmen von Fotobox, Spiegel und Wohnwagen, ein stringenter Bildbearbeitungsstil; keine unmarkierten KI-Personenbilder als vermeintliche Eventreferenzen.

**P0-02 – Hero und Produktdarstellung ohne Erlebnis**
- Das erste Sichtfeld wird vor allem vom kreisförmigen Logo statt von einer Veranstaltungsszene bestimmt. Produktbereiche nutzen dekorative Inline-SVG-Strichzeichnungen.
- Maßnahme: editorialer Hero mit echtem, atmosphärischem Bild, Logo im Header und gegebenenfalls als Markenakzent; drei eigenständig komponierte Produktwelten mit echten Fotos und nachvollziehbaren Leistungsdaten.

**P0-03 – Keine belastbaren Vertrauenselemente**
- Keine authentische Projekt-/Eventgalerie, keine verifizierten Kundenstimmen, keine konkreten Referenzen; diese dürfen nicht erfunden werden.
- Maßnahme: Fotogalerie mit dokumentierten Nutzungsrechten, belegbare Beispielfälle und klare Team-/Ansprechpartnerinformationen.

**P0-04 – Anfragefluss ist ein Prototyp**
- Kontaktformular öffnet lediglich `mailto:`; der Anwender muss die E-Mail selbst verschicken. Keine validierte Übertragung, Zuverlässigkeitskontrolle oder Empfangsbestätigung.
- Maßnahme: separat abgesicherter serverseitiger Kontaktprozess mit Spam-/Rate-Limit-Schutz, Datenschutzprüfung, Zustellkontrolle, Fehlerzuständen und Bestätigung nach tatsächlicher Übermittlung. Supabase ist noch nicht aktiv; keine vorzeitige Live-Schaltung.

### HOCH / P1

**P1-01 – Copywriting oberflächlich**
- Viele allgemeine Formulierungen zu Erinnerungen und Gefühlen, wenig unmittelbare Antworten auf kaufentscheidende Fragen: Aufstellfläche, Fotooptionen, Betreuung, Layouts, Verfügbarkeit, Preisstruktur etc.
- Die frühere offizielle Website nennt einige technische Angaben (z. B. Wohnwagenmaße und Fotobox-Ausstattung), die vor Übernahme neu zu verifizieren sind.
- Maßnahme: konkret belegte Produktdaten, differenzierende USPs und kompakte, präzise Kaufberatung.

**P1-02 – Layoutvarianten zu repetitiv**
- Viele Unterseiten teilen nahezu identische Hero-, Text-, Dreierkachel- und CTA-Muster. Premium-Qualität erfordert mehr situative Komposition statt immer gleicher Komponenten.
- Maßnahme: mehr typografische Hierarchie, maßgeschneiderte Bildsequenzen, Editorial-Grid, intelligente Weißräume, differenzierte Kapitelgestaltung.

**P1-03 – Markenschriften nicht tatsächlich eingebunden**
- CSS nennt Manrope und Inter als Font-Familien, es gibt jedoch keine `@font-face`-Definition und keine mitgelieferten Font-Dateien; in der Regel greifen System-Fallbacks.
- Maßnahme: webkonforme, lizenzgeprüfte Schriftdateien lokal einbinden (Fontlizenzen beachten), metrisch testen, Fallback-/FOUT-Verhalten optimieren.

**P1-04 – Öffentlich zugänglicher unfertiger Entwurf**
- GitHub-Repository ist öffentlich; Netlify-Vorschau ebenfalls ohne Zugangsschutz. `noindex` ist keine Zugriffskontrolle.
- Maßnahme: Repo bei Bedarf privat, Preview optional mit Netlify-SSO oder Passwort absichern; keinerlei echte Kundendaten oder Geheimnisse in dieser Umgebung.

**P1-05 – Rechtliche Inhalte noch nicht veröffentlichungsfähig**
- Keine final freigegebenen Impressums- und Datenschutztexte für das neue System. Die Seite kennzeichnet dies selbst als offenen Punkt.
- Maßnahme: Anbieterinformationen bestätigen, Verarbeitungsvorgänge erfassen, Rechtstexte professionell prüfen, Release-Blocker bis Fertigstellung.

### NOCH NICHT GEPRÜFT / Keine Erfolgsbehauptung

- Mobile Layout und horizontales Overflow bei 320, 375, 768, 1024, 1440 px; Pixel- und Screenshottests
- Safari/iOS- und Chrome/Android-PWA-Installation, Offline-Cache, Updateverhalten
- Cross-Browser, Kontrastmessungen, Tastaturbedienung, Screenreader, Zoom und WCAG-2.2-AA-Audit
- Lighthouse Performance/Accessibility/Best Practices und Real-World Core Web Vitals
- Bildrechte, Texte, Leistungen und die tatsächliche Gültigkeit aller Aussagen

## Künftiger verpflichtender Pre-Delivery-QA-Workflow

1. **Creative Review:** Hero, Typografie, Rhythmus, Bildführung, Eigenständigkeit, Premium-Anspruch gegen freigegebenes CI prüfen. Kritische Designfehler blockieren die Präsentation.
2. **Desktop- und Mobile-Review:** Browser-Screenshots bei 320, 375, 768 und 1440 px aufnehmen, persönlich prüfen, sichtbare Fehler beheben. Keine rein quellcodebasierte Freigabe.
3. **Content Review:** Alle realen Leistungsdaten, Kontakte, Bilder und Rechte gegen verlässliche Quellen prüfen. Keine unbestätigten Behauptungen.
4. **Functional QA:** Navigation, Anlass-Auswahl, Kontakt, Formularzustände und Fehlermeldungen, PWA/Offline, interne Links und App-Icons.
5. **Accessibility:** WCAG 2.2 AA als Ziel, regulär mindestens 4,5:1 Kontrast für normalen Text und 3:1 für große Schrift; Fokus, Tastatur, Semantik und Zoom prüfen.
6. **Performance:** Lighthouse/field metrics; Zielwerte Core Web Vitals (gute Kategorie): LCP ≤2,5s, INP ≤200ms, CLS ≤0,1. Messwerte ehrlich als **nicht getestet** kennzeichnen, solange sie nicht gemessen wurden.
7. **Release-Gate:** Kein P0 offen, keine kritischen P1 ohne dokumentierten Grund, Designer-Abnahme mit Screenshots, Funktionschecks grün, Nutzerfreigabe, erst dann als premium-abnahmefähige Vorschau präsentieren.

## Priorisierte Nacharbeit

**A – Asset-Sichtung**: freigegebene Echtbilder von Events und Geräten, technische Ausstattung, Leistungen, Nutzungsrechte organisieren.  
**B – Kreative Neugestaltung**: Hero, Produktseiten, Bildstory, Galerie, einzigartige Komponenten und Markeninszenierung entwickeln; CI und Logo strikt unangetastet.  
**C – Conversion und Content**: belastbare Produktdetails, FAQ, Vergleich, Vertrauen, geeigneter Kontaktprozess.  
**D – Technische Produktreife**: responsive Screenshots und Interaktionstests, PWA, Barrierefreiheit, Performance, Rechtstexte, sichere Backend-Anbindung.  
**E – Vorführung**: Nur nach durchgeführter QA mit dokumentierten Belegen und offenen Punkten.

**Bewertung:** Aktuelle Seite bleibt eine **technische Entwicklungsreferenz** und wird nicht als Premium-Endergebnis ausgewiesen. Es wurden im Rahmen dieses Audits **keine gestalterischen Veränderungen** am freigegebenen Logo oder an der CI vorgenommen.

---

## Ergänzung 1.1 — Echte Browser-QA vom 05.11.2026

**Prüfumgebung:** Chromium/Playwright auf Ubuntu 24.04, lokaler Server mit exakt dem GitHub-Stand, nicht die Produktivdomain. Prüfungen bei 320, 375, 768 und 1440 px. 

**Befund:** 119 automatische Browserchecks erfolgreich. Geprüft wurden Statuscodes der zehn Seiten, horizontale Überläufe, Ladezustand aller eingebundenen Bilder, einzelne H1, JS-Laufzeitfehler, Mobilnavigation (inklusive Escape), Anlässe-Tabs, FAQ-Aufklappen, Auswahlübernahme im Kontaktformular, Manifest und App-Icon-URLs.

**Konkret gefundener und behobener Fehler:** Die Kontaktseite überlief bei 320 und 375 px horizontal. Die Ursache lag im Formular-/CTA-Bereich (intrinsische Mindestbreiten und nicht umbrechender Buttontext); die CSS-Korrektur ist eingespielt und der erneute Prüflauf ist grün.

**Nachweise:** [GitHub Actions Run 42019930439](https://github.com/WTF-Sascha/fotopolis-website/actions/runs/42019930439); [Screenshot-Artefakt](https://github.com/WTF-Sascha/fotopolis-website/actions/runs/42019930439/artifacts/13409949848).

**Visuelle Sichtung:** Die erzeugte Kontaktübersicht mit Desktop- und Mobilansichten der Startseite sowie dem mobilen oberen Kontaktbereich wurde überprüft. Zu viele Logo-/Textflächen, keine emotionale Produktfotografie, kleine schematische Illustration und eine zu generische Editorial-Komposition bestätigen, dass das Design weiterhin **nicht** premium-freigabefähig ist. Die übrigen vollständigen Screenshots sind als Artefakt gespeichert, aber nicht alle einzeln im Originalformat bewertet.

**Wichtig:** Technische Browser-QA und visuelles Konzepturteil sind voneinander getrennt. Ein grüner Browserlauf hebt die offenen P0-Designblocker nicht auf. Der Design-Branch `design/premium-v2` dient dem nächsten visuellen Neuaufbau, ohne den aktuell ausgelieferten `main`-Stand vorschnell durch halbfertige Entwürfe zu ersetzen.
