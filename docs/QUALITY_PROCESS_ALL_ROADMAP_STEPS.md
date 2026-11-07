# FOTOPOLIS – Verbindlicher Qualitätsprozess für jeden Roadmap-Schritt

**Gültig ab Website Development 2.6, Roadmap Punkt 2 – 05.11.2026.**

## Verbindliche Abnahmeregel

**Kein Roadmap-Schritt wird als abgeschlossen oder zur Freigabe bereit erklärt, solange ein relevanter Qualitätscheck fehlt oder fehlschlägt.** Arbeiten erfolgen ausschließlich in `design/premium-v2` / PR #2 als Draft über Netlify Deploy Preview; kein Merge, keine Änderung an `main` oder `site/` und kein Livegang ohne separate ausdrückliche Freigabe.

### QA-1 – Bestandsaufnahme vor Änderungen
- PR-Head, Verzeichnisstruktur, Ausgangsdesign und betroffene Seiten erfassen.
- Bestehende Bilddateien und das freigegebene Logo als unveränderliche Referenzen behandeln.
- Neue Inhalte aus dem alten Auftritt mit nachvollziehbaren Quellen; Paketpreise, exakte Ausstattungsumfänge und Rechtsangaben nur nach Bestätigung.

### QA-2 – Technische Prüfung bei jedem Commit
- Quellkonzept und exakt erzeugten Netlify-Preview-Publish-Ordner bauen.
- SHA-256-Prüfung der Original- und Produktbilder im Build bestehen.
- Keine fehlenden Bilder oder internen Routen, keine Browser-JavaScript-Fehler.
- Browserprüfung der bestehenden Hauptseite in 320, 375, 768, 1024 und 1440 px; die bestehende navigationsbezogene QA bleibt aktiv.

### QA-3 – Verpflichtendes erweitertes Layout-Gate
Der neue Test `scripts/premium-layout-gate.mjs` überprüft **jede der zwölf Routen** (Startseite plus elf Unterseiten) in **320, 375, 430, 768, 1024, 1100, 1280, 1440 und 1920 px**.

Kontrollpunkte:
- Keine horizontalen Überläufe.
- Keine Überschneidungen von Logo und Hauptnavigation bzw. Menütoggle.
- Footer-Navigation muss **unterhalb** der oberen Footer-Inhalte stehen, nicht daneben kollidieren.
- Kein ungewolltes Abschneiden von Überschriften oder Karteninhalten.
- Keine kaputten Fotos; Produktbilder weiter in `object-fit:contain` ohne CSS-Farbfilter.
- Produktbild und Text dürfen weder nebeneinander noch untereinander überlappen.
- Interaktive Haupt-Buttons mindestens 42 px hoch (Ziel ≥44 px für finale UX-Freigabe).
- Auf der Paketseite drei Erlebnisprofile und horizontal zugängliche Tabelle.

### QA-4 – Funktions- und Tastaturtest
- Produkt-Links, Dropdowns, mobile Menüs, Escape und Fokuswiederherstellung.
- Interne Seiten müssen HTTP 200 liefern; verlinkte Seiten dürfen nicht nur Attrappen sein.
- Keine behaupteten Buchungen, Verfügbarkeiten oder E-Mails ohne tatsächlichen Backend-Flow.

### QA-5 – Visuelles Review und dokumentierte Freigabe
- Pro Schritt Screenshots: Start, Fotobox, Fotospiegel, Fotowohnwagen, Pakete bei 320, 768 und 1440 px; weitere Routen können ergänzt werden.
- Die Screenshots werden als GitHub-Workflow-Artefakt archiviert. **Automatische Tests ersetzen die manuelle Sichtprüfung nicht.**
- Jedes auffällige Layout wird **vor** Freigabe reproduziert, korrigiert, erneut gerendert und erneut getestet.
- Nur wenn QA-Grün und visuelle Beurteilung abgeschlossen sind, kann der Schritt zur Nutzerfreigabe vorgeschlagen werden. Produktive Veröffentlichung bleibt unabhängig gesperrt.

## Wiederholbarer Nachweis
Workflow: `.github/workflows/premium-concept-qa.yml`.  
Visual Review: `concepts/premium-v2/qa-screenshots/`.  
Layout-Report: `concepts/premium-v2/qa-screenshots/layout-gate/report.json`.

**Bekannter 2.5-Layoutfehler / Korrektur:** `.footer-grid` war Flex-Layout, `.footer-navigation` wurde aber als Rasterelement mit `grid-column` eingefügt. Dadurch konnte die Navigation in einer unerwünschten vierten Spalte stehen. In 2.6 auf ein echtes dreispaltiges Footer-Grid mit klarer Zeilenstruktur und responsiven Umbrüchen korrigiert; passende Positionsassertion für alle Routen ergänzt.
