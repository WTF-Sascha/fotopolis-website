# FOTOPOLIS STUDIO 18.6 — Verifizierbarer Qualitätsbericht
**Datum:** 23.11.2026  
**Status:** INKREMENT IMPLEMENTIERT · RELEASE NO-GO  
**Branch:** `feature/studio18-6-contrast-accessibility-qa-20261123`  
**Pull Request:** [#27](https://github.com/WTF-Sascha/fotopolis-website/pull/27) (Draft, Basis PR #26)  
**Scope:** Isolierte, risikoarme CSS-Kontrastkorrekturen und reproduzierbare QA; **keine Freigabe der Gesamtplattform**.

## 1. Verifizierter Ausgangsstand
- PR [#25](https://github.com/WTF-Sascha/fotopolis-website/pull/25): offen, Draft, Head `e73c7320ba745bae164b50928615df56b9fb4dad`; Basis `staging`.
- PR [#26](https://github.com/WTF-Sascha/fotopolis-website/pull/26): offen, Draft, Head `cf0600b52f7af8d86e7ac7507de11c8245205f62`; Basis Studio 18.2.
- PR #27 basiert exakt auf diesem Studio-18.5-Head; kein Commit auf `main` oder `staging` durch das Inkrement.
- CI Studio 13 [45161951978](https://github.com/WTF-Sascha/fotopolis-website/actions/runs/45161951978): SUCCESS auf `cf0600b5`.
- CI Studio 12 [45161951894](https://github.com/WTF-Sascha/fotopolis-website/actions/runs/45161951894): SUCCESS auf `cf0600b5` (zuvor offen). Eine andere frühere Baseline ersetzt diesen SHA-Nachweis nicht.
- CI CI-2.1 [45161951812](https://github.com/WTF-Sascha/fotopolis-website/actions/runs/45161951812): SUCCESS, vorhandenes Screenshot-Artefakt `studio18-ci21-brand-review-52`. Dies belegt CI-Smoketests, keine subjektive Design- oder vollständige WCAG-Abnahme.
- Netlify-Projekt `fotopolis-preview`: Password-Access für Non-Production konfiguriert. [Deploy `6b04107a8ea36bfd8cc26651`](https://app.netlify.com/sites/653f790e-5476-4349-84d9-012adbeeb489/deploys/6b04107a8ea36bfd8cc26651) ist `ready`, **gehört jedoch zu PR #25 / SHA `e73c7320`**. Er ist kein Deployment-Beleg für PR #26 oder #27.

## 2. Nachgewiesene CSS-Kontrastbefunde und Korrekturen
WCAG 2.2 AA erfordert für gewöhnlichen Text in der Regel mindestens **4,5:1**. Nachstehende Werte sind aus den vorhandenen CSS-Hexwerten und den festgelegten hellen Oberflächen mathematisch berechnet; reale Browser- und Gesamtseitenprüfung separat.

| ID | Sichtbarer Bereich / Selektor | Vorher | Nachher (berechnet) | CI-2.1-Token | Priorität |
| --- | --- | ---: | ---: | --- | --- |
| F18.6-001 | Admin-Login `.eyebrow` | 2,95:1 | 5,12:1 | `--fp-warning` | P2 |
| F18.6-002 | Login `.mode-tabs button` inaktiv | 4,03:1 | 4,77:1 | `--fp-text-muted` | P2 |
| F18.6-003 | Login `.footnote` | 3,24:1 | 5,18:1 | `--fp-text-muted` | P2 |
| F18.6-004 | Login `.link-button` | 3,87:1 | 5,12:1 | `--fp-warning` | P2 |
| F18.6-005 | Admin `.cc-eyebrow` | 2,62:1 | 5,34:1 | `--fp-warning` | P1 |
| F18.6-006 | Admin `.cc-link` (helles Panel) | 4,17:1 | 5,34:1 | `--fp-warning` | P2 |
| F18.6-007 | Admin `#dashboard-app .fp16-kicker` | 4,24:1 | 4,75:1 | `--fp-text-muted` | P2 |

**Ursache:** Historisch unabhängige, teilweise zu helle Textfarben in kleinen UI-Schriften statt zentraler CI-2.1-Kontrasttokens.  
**Umsetzung:** Bestehende Regeln gezielt auf die freigegebenen Tokens umgestellt; keine Design-, Logo-, Funktions- oder Sicherheitsänderungen.  
**Wirkungsgrenze:** Mit einer punktuellen Farbprüfung wird nicht der gesamte Admin-Bereich auf Konformität geprüft.

## 3. Styling-Architektur: messbarer Wartungsbefund
Im neuen Branch wurden **neun konkret benannte CSS-Dateien** auf Vorkommen des Texts `!important` und `@media` untersucht: insgesamt **685 `!important`-Vorkommen**, **125 `@media`-Vorkommen**. Das ist eine Stichprobe mit anderer Dateizusammenstellung als die ältere 433-Angabe; beide Zahlen dürfen nicht als identische Grundgesamtheit dargestellt werden.

- `studio11-quiet-luxury.css`: 299 `!important`.
- `studio13-unified-brand.css`: 152 `!important`.
- `studio18-ci21-compat.css`: 159 `!important`.
- Die sechs weiteren untersuchten Dateien zusammen: 75 `!important`.

Das belegt hohen Cascade-/Override-Aufwand, **nicht automatisch 685 fehlerhafte Deklarationen**. Ein breitflächiger Abbau ohne CSS-Wirkungsanalyse und Screenshot-Regression wäre nicht zulässig. Die nun vorgenommenen Kontrastkorrekturen ersetzen nur die bestehenden Farbwerte.

## 4. Geänderte Dateien und Zweck
1. `concepts/premium-v2/admin/login/login.css`: vier Textfarben auf CI 2.1.
2. `concepts/premium-v2/admin/dashboard/command-center.css`: drei Textfarben auf CI 2.1.
3. `scripts/studio18-6-contrast-qa.mjs`: sieben deterministische Kontrastverträge mit vorhandenen Tokenwerten und den bekannten Oberflächen.
4. `scripts/studio18-brand-browser-qa.mjs`: vier echte gerenderte Login-Kontrastmessungen an allen 10 definierten Viewports, Fehler bei unter 4,5:1.
5. `.github/workflows/studio18-ci21-qa.yml`: kontrastbezogene Quellcodeänderungen als Trigger, Node-Syntax- und Vertragsprüfung; keine Entfernung bisheriger Testschritte.

## 5. Qualitäts- und Abnahmematrix
| Gate | Status | Nachweis / Grenze |
| --- | --- | --- |
| GitHub-Ausgangsstand / Abhängigkeit PR #25–27 | BESTANDEN | PR-Metadaten und Basis-SHAs |
| Isolierter PR #27, keine PR-Übernahme | BESTANDEN | PR #27 Draft |
| CSS-Kontraste rechnerisch ≥ 4,5:1 | BESTANDEN (Berechnung) | sieben definierte Farbpaare |
| Studio-18.6-CI-2.1-Workflow | IN PRÜFUNG | [Run 45166763789](https://github.com/WTF-Sascha/fotopolis-website/actions/runs/45166763789) |
| Studio-18.6-Studio-13-Regression | IN PRÜFUNG | [Run 45166763917](https://github.com/WTF-Sascha/fotopolis-website/actions/runs/45166763917) |
| Studio-18.6-Studio-12-Regression | IN PRÜFUNG | [Run 45166764416](https://github.com/WTF-Sascha/fotopolis-website/actions/runs/45166764416) |
| Chromium-Login-Kontraste / zehn Viewports | IN PRÜFUNG | Bestandteil CI-2.1-Run |
| 70 Screenshots auf neuem Commit | IN PRÜFUNG | CI-2.1-Artefakt aus neuer Runde; fachlicher Vergleich separat |
| PR-#27-Netlify-Deploy mit exaktem SHA | NICHT NACHGEWIESEN | Bekannter `ready`-Deploy gehört zu PR #25 |
| Login/Logout mit echtem DEV-Konto | BLOCKIERT | Autorisierte Kontoinhaber-Interaktion erforderlich |
| Session/JWT/RBAC und internes Dashboard real | BLOCKIERT | Keine echten Passwörter oder Persistenz-Tests ohne zusätzliche Freigabe |
| Anfrage-, Termin-, Geräte-, Designprozess-E2E | BLOCKIERT | Kein mutierender Test realer Daten |
| Vollständige WCAG 2.2 AA / 200-%-Zoom / Screenreader | NICHT GETESTET | Einzelkontrasttest ersetzt keinen Audit |
| Core Web Vitals LCP/CLS/INP | NICHT GETESTET | Messbares Device-/Netzwerkprofil und Felddaten fehlen |
| Physische Druckfreigabe | NICHT GETESTET | Technische 44er-Print-QA ist keine Druckerfreigabe |
| Freigabe nach `main`, `staging` oder Produktion | NICHT FREIGEGEBEN / NO-GO | Sonderfreigabe zwingend |

## 6. Untersuchte Komponenten und Abgrenzung
Quellcodekonkret: öffentliche Home-Struktur, Login-HTML/CSS/JS, Admin-Dashboard-HTML/CSS, CI-2.1-Kompatibilitätsschicht, Marken-Tokens, Chromium-QA-Script, GitHub-Actions-Workflow, bestehende Auth-Handoverdokumentation. Browser-Suite: Homepage, Fotobox, Fotospiegel, Fotowohnwagen, Designvorlagen, Kontakt, Login mit 320/360/375/390/430/768/1024/1280/1440/1920 px. Keine Behauptung, dass geschützte interne Ansichten, alle Zustände, Screenreader oder sämtliche 14 öffentlichen Seiten vollständig manuell geprüft wurden.

## 7. Restrisiko, Rollback und fachliche Empfehlung
**Release-Status: NO-GO.** Die neue Arbeit ist ein gezieltes Qualitätsinkrement, keine umfassende Enterprise-Freigabe. Verifikation vor weiteren Schritten: CI-2.1-Report und Screenshots des neuen Code-Commits, fachlicher Vorher-Nachher-Vergleich, echte isolierte Admin-Login-E2E mit Kontoinhaber, Admin-/Geschäftsprozessprüfung, WCAG und Core Web Vitals. Die bestehende Studio-17-UX-Prototypgrenze bleibt unberührt.

**Rollback:** Die fünf Studio-18.6-Dateiänderungen im isolierten Branch rückgängig machen bzw. PR #27 schließen; kein Rücksetzen von `staging`, `main`, Neon oder Netlify-Konfiguration nötig. `fotopolis-mieten.de` bleibt unverändert.

**Freigabeempfehlung:** Weiterentwicklung und Prüfung des Draft-PR möglich. **Kein Merge und kein Livegang** ohne gesonderte ausdrückliche Genehmigung und nachweislich geschlossene P0/P1-Gates.
