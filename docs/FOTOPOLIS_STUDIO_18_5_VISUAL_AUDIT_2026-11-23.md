# FOTOPOLIS Studio 18.5 — Visual Audit & Quality Register

**Stand:** 2026-11-23 · **Status:** IN ARBEIT / NO-GO · **Scope:** isolierter Entwicklungsbranch `feature/studio18-5-premium-ui-refinement-20261123`.
**Referenz:** PR #25, Commit `e73c7320ba745bae164b50928615df56b9fb4dad` (Studio 18.3). Keine Änderung an `main`, `staging`, Produktionsdomain, Neon-Daten oder Auth-Konfiguration.

## Ausgangslage und Vorher-Nachweis

- GitHub: PR #25 offen, Draft; CI auf diesem Referenz-Commit: Studio 18.2, 18.3, 12, 13 und CI 2.1 erfolgreich.
- Netlify: `fotopolis-preview`, Deploy Preview #25 auf Referenzbranch; Deployment-Status `ready`, kein authentifiziertes End-to-End-Testergebnis.
- Visuelle Baseline: [GitHub Actions, Studio 18.1 CI 2.1 Browser QA, Run 45153267036](https://github.com/WTF-Sascha/fotopolis-website/actions/runs/45153267036); Artifact `studio18-ci21-brand-review-51` (56 Chromium-Screenshots, 7 Routen × 8 Breiten, Ergebnisse JSON, 0 technische Smoke-Findings).
- Manuelle Durchsicht der lokalen Artifact-Screenshots `login-320.png`, `login-390.png`, `home-320.png`, `home-1440.png`. Diese ist keine vollständige Pixel-Freigabe.
- Geplanter neuer Browser-Test: 320, 360, **375**, 390, 430, 768, 1024, **1280**, 1440, 1920 px; 7 Routen. Hoch-/Querformat, 200% Zoom, Tastatur, Dashboard und Login-E2E sind separat zu prüfen.

## Verifiziertes Fehlerregister

| ID | Bereich / Viewport | Befund | Risiko / Priorität | Korrektur | Nachweis / Status |
| --- | --- | --- | --- | --- | --- |
| F18.5-001 | Admin/Login, 320–400 px | Ursprüngliches CSS verkleinert drei Anmelde-Tabs auf 9 px und minimale Innenabstände; im Baseline-Screenshot 320 px optisch gut erkennbar | P2, Lesbarkeit und Touch-Bedienung | Bei <=400 px Zwei-Spalten-Raster mit dritter Option in voller Breite; min. 44 px Höhe, 13 px Text, 6 px Zwischenraum; keine Änderung der Anmeldung selbst | CODE IMPLEMENTIERT; neue Chromium-Abnahme AUSSTEHEND |
| F18.5-002 | Chromium-Visual-QA, Home | Baseline-Screenshot in 1440 px zeigt zwei Galerie-Teaser zunächst einfarbig; alle drei Bilder sind als Lazy-Load-Assets im Build referenziert, fehlende Bilddateien sind damit nicht belegt | P2, QA-Aussagekraft; Ursache noch nicht endgültig bestätigt | Vor Screenshot alle drei Teaserbilder aktiv decodieren und sichtbaren Ladeerfolg prüfen; keine Änderung der produktiven Bildassets | TEST IMPLEMENTIERT; Re-Run AUSSTEHEND |
| F18.5-003 | Visuelle Regression | Browser-QA bisher nur 8 Breiten; 375 und 1280 px fehlen | P2, Testabdeckung | Auf 10 festgelegte Breiten erweitern, Login-Tabs auf Kollisionsfreiheit, Beschneidung, Lesbarkeit und mindestens 43 px gemessene Höhe prüfen | TEST IMPLEMENTIERT; Re-Run AUSSTEHEND |
| F18.5-004 | Interner Verwaltungsbereich | Echte Anmeldung, alle internen Zustände und Rollen nicht browserseitig authentifiziert zugänglich; daher kein verifizierter Komplett-Screenshot-Audit | P0, bereits offenes Gate Studio 18.3 | Freigabegrenze beachten; keine Testidentität oder Datenmutation eigenmächtig erzeugen | BLOCKIERT; keine Freigabe |
| F18.5-005 | Gesamtplattform | Mehrere historische CSS-Schichten; nicht alle Designabweichungen und CSS-Redundanzen innerhalb dieses Inkrements vollständig geprüft | P2 | Refactoring erst nach reproduzierbarem visuellem Beleg und Regression | OFFEN |
| F18.5-006 | Accessibility, Core Web Vitals und Druck | Kein vollständiger WCAG-2.2-AA-, LCP/CLS/INP- oder physischer Drucknachweis | P1/P2 | Separate messbasierte Freigabe; bestehende Tests und Produktionssperren erhalten | OFFEN / NO-GO |

## Sichere Änderungen dieses Inkrements

1. `concepts/premium-v2/admin/login/login.css`: CSS-Umbruch statt Mikrotypografie; echte Anmelde-Events, Sicherheitsgrenzen und Formularfunktionen unverändert.
2. `scripts/studio18-brand-browser-qa.mjs`: 10 statt 8 Viewports; Tab-Geometrie, Schriftgröße, horizontales Overflow, Galerie-Ladeerfolg; Screenshot-Inhalte werden nicht manipuliert.
3. Diese Dokumentation. Technische Review-Ergebnisse nach neuer CI und Preview-Deployment gesondert nachziehen.

## Freigabe- und Abnahmematrix

| Gate | Stand |
| --- | --- |
| Ausgangsbranch / SHA verifiziert | BESTANDEN |
| Referenz-CI auf exakt `e73c7320` | BESTANDEN (5 Workflows, keine fachliche Freigabe) |
| Vorher-Screenshot-Baseline vorhanden | BESTANDEN |
| Reine Quelltextkorrektur durchgeführt | BESTANDEN |
| Neue CI / aktualisierte Screenshots auf Studio-18.5-Head | NICHT GETESTET (bis Re-Run) |
| Login-Formular und Server-RBAC E2E | BLOCKIERT |
| Admin-Dashboard aller Rollen und Geräte/Termine | BLOCKIERT |
| Vollständige WCAG-2.2-AA-Prüfung | NICHT GETESTET |
| LCP <= 2.5 s / CLS <= 0.1 / INP <= 200 ms gemessen | NICHT GETESTET |
| Fachlicher Druckproof (44 Einzelvorlagen) | NICHT GETESTET |
| Mergen / Livegang | NO-GO |

## Rollback

Revert ausschließlich der Studio-18.5-Inkrement-Commits oder Löschen des isolierten Branches. Weder CI-2.1-Logo noch Auth-Code aus Studio 18.3 noch produktive Konfigurationen werden verändert. Vor einer Freigabe: neue GitHub-Actions-Artifacts visuell vergleichen, bekannte P0/P1-Gates separat schließen und konkreten Merge-Zielstand vorlegen.
