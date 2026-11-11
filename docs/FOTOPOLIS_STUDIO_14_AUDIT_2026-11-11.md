# FOTOPOLIS Studio 14.0 – Auditregister und Abnahmeprotokoll
Stand: 11.11.2026 · Status: **Entwicklungsarbeit, keine Releasefreigabe**

## 0. Nachgewiesene Ausgangsbasis und Isolation

- Source of truth: `WTF-Sascha/fotopolis-website`, PR #19, Studio-13.1-Commit `27c971d809b5449690749f99a6c5ec54b54ad1b5`.
- Studio-14-Branch: `feature/studio14-consolidation-20261111`, ausschließlich von obigem Commit abgezweigt. PR #20 ist **Draft**, Base `main` nur für isolierte Netlify-PR-Preview.
- Netlify-Projekt: `fotopolis-preview`; Nichtproduktionsdeployments erfordern Team-SSO; Formularerkennung aktiv.
- Neon: Projekt `icy-wave-78750589`, Branch `br-super-leaf-b9jj8n9p` (`development`), Schema `fotopolis_studio13`. Separater Neon-Produktionsbranch ist nicht verändert.
- Neon Auth DEV akzeptiert zusätzlich den expliziten Origin `https://deploy-preview-20--fotopolis-preview.netlify.app`; vorherige Origins bleiben erhalten.
- **Keine** Änderungen an `main`, `fotopolis-mieten.de`, echten Kundendaten, Gerätedaten, Originals, bestehenden Druckmotiven oder produktiven Absendern.
- DEV-Datenbank read-only gezählt (keine personenbezogenen Inhalte ausgelesen): **0** CRM-Anfragen, **0** Designprüfungen, **0** Medien, **4** CMS-Slots, **1** freigegebene Verwaltungsperson. Netlify-Formular `fotopolis-studio9-anfrage` vorhanden, angezeigter aktueller Submission-Count **0**. Dies ist **kein** erfolgreicher Positivtest.

## 1. Nachweisregister (Stand vor PR-#20-CI)

Die Statusbegriffe sind strikt getrennt: **nicht implementiert**, **teilweise implementiert**, **technisch implementiert**, **technisch getestet**, **real getestet**, **fachlich freigegeben**. Kein Commit ist automatisch ein realer oder fachlicher Test.

| ID | Priorität | Modul / Historie | Befund vor Studio 14 | Maßnahme im Branch / Status danach | Test / Abnahmekriterium |
|---|---|---|---|---|---|
| F14-001 | P0 | Formular → CRM, Studio 9/13 | Nach erfolgreichem Netlify-POST wurde der Mirror-Aufruf mit `void` nicht abgewartet; ein fehlgeschlagener Mirror blieb in der Erfolgsanzeige unsichtbar | **Code korrigiert:** abgewarteter Mirror, max. 2 Versuche mit gleicher UUID, explizite Sync-Warnung ohne Verlust der Netlify-Sendebestätigung | CI-Contract-Test plus echte synthetische Netlify→Neon-End-to-End-Synchronisation ausstehend |
| F14-002 | P0 | Netlify-Forms-Abgleich, Studio 13 | Zwei Quellen ohne Transaktion; Netlify-Submission-ID nicht im CRM; keine vollständige Pagination/Abgleichfunktion | **Teilweise:** Übertragungszuverlässigkeit verbessert, Netlify-Forms-Feld `fp_request_key` registriert und in Neon sowie internem CRM dieselbe Referenz verwendet; Filter nach Produkt, Status und Wunschtermin ergänzt; automatischer historischer Soll-/Ist-Abgleich und echter Testversand weiterhin **offen** | Mit freigegebenen Testanfragen jede Netlify-ID genau einmal einer bestätigten CRM-Kopie zuordnen; Fehlfälle dokumentieren |
| F14-003 | P0 | Auth/JWT/RBAC, Studio 3–13 | Negative Tests dokumentiert; positive reale Anmeldung und Rollentrennung in PR #19 nicht belegt | **Unverändert offen:** Auth-Preview-Origin #20 in Neon DEV freigegeben; kein Konto simuliert | Echter SSO+Neon-Owner-Login, Tokenablauf, Logout, erlaubte und verweigerte API-Rechte |
| F14-004 | P0 | Verwaltung, Studio 4.0–4.4 | Persistente Geräte, Reservierungen, Sperrzeiten und Audit implementiert; kein neuer echter Full-Flow belegt | **Erhalten, E2E offen**; keine Testbuchung mit echten Geräten erzeugt | Synthetische isolierte Anlage, Konflikt, UTC/DST, Storno, Audit, Reload, Rollback |
| F14-005 | P0 | Private Designs, Studio 12/13 | Editor hinter JWT und private Print-Originale über Function; Zusatzrolle Designer hatte trotz aktiver Studio-Rolle keinen Zugang | **Code korrigiert:** aktive Designer-Scope serverseitig auf jeder Dateianforderung geprüft, geschützter Editor-Bootstrap auf diese Prüfung ausgerichtet; 44 Originale unverändert | Designer aktiv erlaubt; deaktivierter Designer/Editor/Viewer verboten; reale Browser-/Rollenprüfung weiterhin offen |
| F14-006 | P0 | Druckqualität, Studio 10/11/12 | 44 Motive, 1772×1181 px, DPI-Metadatum; frühere Halo-/Freistellfehler an Logos u. a. FP-014/019/023/027 nicht abschließend fachlich freigegeben | **Offen, Asset-Freigabeblocker.** Originale bewusst unverändert | Visueller 300%-Check aller 44, physischer Proof mit ICC, Beschnitt, korrektem FOTOPOLIS-Logo |
| F14-007 | P0 | CRM-Validierung, Studio 13 | Backend akzeptierte `FP-000`, obwohl kein Motiv mit dieser ID existiert | **Code korrigiert**, Regressionstest ergänzt | `FP-000` → 400, `FP-001` bis `FP-044` bleiben valide |
| F14-008 | P1 | CMS-Rollen, Studio 13 | Manager durfte CMS-POST grundsätzlich, Preview-Publish/Rollback verweigerte die Rollenprüfung dennoch | **Code korrigiert**, Berechtigung explizit und testbar | Manager: Preview-Publish ja; Viewer: nein; Owner: ja; kein Live-Publish |
| F14-009 | P1 | Analytics, Studio 13 | 30-Tage-Fenster inklusive heute umfasste faktisch 31 Kalendertage; LIMIT 500 konnte das Ereignisschema abschneiden; Click-Metrik war mit echten Anfragen vermischt | **Code korrigiert:** 29 Tage Rückblick + heute, LIMIT 1500, CRM-Daten nur als Aggregat, getrennte UI-Kennzahl | CI/API-Test; auf echte Netlify-Formularzahlen darf weiterhin nicht geschlossen werden |
| F14-010 | P1 | CMS, Studio 13 | Vier Slots, Versionierung, Preview-Rollback vorhanden; vollständiger Seiten-CMS-Publishing-Prozess und Medienvarianten fehlen | **Offen / nicht als vollständig behauptet** | Modell für redaktionelle Felder, SEO, Entwurf/Freigabe/Version mit serverseitigen Rollen, keine Liveänderung |
| F14-011 | P1 | Interne Medien, Studio 13 | Private Uploads bis 2 MB; keine produktive Freigabe/optimierte Webvarianten | **Technisch vorhanden; Realtest offen** | Positiv-/Negativtests auf Dateityp, Metadaten, Rechte, Archivierung, Bildzugriff |
| F14-012 | P1 | UX/UI, Studio 11–13.1 | Brand-Tokens, Espresso/Ivory/Champagne und Logo-Master in Preview eingebaut; zuletzt grüne 27 Browseransichten | **Beibehalten**; keine neue Gestaltung ohne Anlass | 320, 360, 390, 430, 768, 1024, 1440, 1920 px; echte Screenshots prüfen |
| F14-013 | P1 | PWA, Studio 13.1 | Manifest und alte Blau-Icons in Build harmonisiert; 188×188-Pixel-Logo als Qualitätslimit | **Offen als Asset-Abhängigkeit**; kein künstlich neues Logo | Realgerät-Installation, Update, Cache, passende hochauflösende Quelldatei |
| F14-014 | P1 | Accessibility/Performance | Bereits einzelne technische Tests; kein vollständiger WCAG-2.2-AA-Screenreader-/Web-Vitals-Nachweis | **Offen** | Tastatur, Screenreader, Kontrast, LCP/CLS/INP unter definierten Bedingungen |
| F14-015 | P0 | Datenschutz und Betrieb | Öffentliche Git-Sichtbarkeit, juristische Prüfung, Lösch-/Retention- und Integrationsnachweise ausstehend | **Offen; keine Änderung am Repo-Privacy-Setting** | Betreiber- und Datenschutzfreigabe, Berechtigungskonzept, Backup/Restore |
| F14-016 | P2 | Spezifische Formate | Technischer Export verifiziert 15×10 cm/300 DPI; frühere Wünsche 10×15 und 5×15 | **Offen bis Papier-/Druckerkompatibilität geklärt** | Freigabe reale Formate und Vorlagen mit einheitlichem Logo-/Personalisierungsfeld |

## 2. Änderungsdateien Studio 14.0

- `concepts/premium-v2/studio13-enquiry-mirror.js`: retrybare, idempotente, awaitbare Neon-Kopie; keine PII in Browser-Speichern.
- `scripts/harden-studio13.py`: bestätigt Netlify-POST vor Mirror und macht eine Abweichung im Testformular sichtbar.
- `netlify/functions/fotopolis-studio13-public.mjs`: Motivkennung `FP-000` ausgeschlossen.
- `netlify/functions/fotopolis-studio13-admin.mjs`: Rollenkonsistenz und getrennte aggregierte CRM-/Analytics-Daten.
- `concepts/premium-v2/admin/dashboard/command-center-app.js`: Kennzahlen semantisch getrennt.
- `netlify/functions/fotopolis-design-private.mjs` und `concepts/premium-v2/admin/designstudio/boot.js`: geschützter Editor für aktive Designer-Scope-Rollen, serverseitig bei jeder privaten Dateianforderung geprüft.
- `scripts/studio13-services-qa.mjs`, `scripts/studio13-contract-qa.mjs` und `scripts/studio13-private-qa.mjs`: zusätzliche Regressionstests und angepasste ältere Verträge.
- CRM-Filter: `netlify/functions/fotopolis-studio13-admin.mjs` prüft Queryparameter, `command-center-app.js` bietet Produktauswahl, Status und Wunschtermin von/bis. Neue Testläufe für diese Änderung separat prüfen.

## 3. Abnahmeprotokoll (laufend, streng evidenzbasiert)

| Nachweis | Stand |
|---|---|
| Echte Branch-Abzweigung von `27c971d` | **Bestätigt** |
| Studio-14-Pull-Request #20 als Draft | **Bestätigt** |
| Netlify-SSO-Schutzeinstellung des Preview-Projekts | **Bestätigt** |
| Neon-DEV-Branch vorhanden und 4 CMS-Slots | **Bestätigt, read-only** |
| Reale Owner-Sitzung und alle Rollen | **Nicht durchgeführt** |
| Vollständiger Netlify-Forms→CRM-E2E mit Test-Anfrage | **Nicht durchgeführt** |
| Echtes Wiederherstellungs-/Buchungs-End-to-End | **Nicht durchgeführt** |
| Physischer Druck und rechtliche Freigabe | **Nicht durchgeführt** |
| GitHub Actions & aktuelle Netlify-Deploy-Preview | **Teilweise bestätigt**: Studio-13-Foundation-QA-Lauf #42988938558 erfolgreich (vor neuester Filterergänzung). Studio-14-Deploy-Preview als Netlify-Deployment `6af42a0bac83364232ed2077` mit `ready` nachgewiesen (früherer Branch-Stand). Neuster Commit und alle Regressions-Workflows bleiben gesondert nachzuprüfen. |

## 4. Freigabeentscheidung

**NO-GO für Produktivbetrieb**, auch wenn später alle automatisierten Branch-Tests grün werden. Es fehlen authentifizierte E2E-/Druck-/Datenschutz-/Betriebsfreigaben. `main`, Domain `fotopolis-mieten.de`, echte Buchungen und personenbezogene Kundendaten bleiben unangetastet.

Kein weiterer großflächiger Markenumbau: erst technische und fachliche Altlasten nachprüfbar schließen.

## 5. Quellkorrelation und technische Nachweise (Studio 14)

- In der registrierten Netlify-Formulardefinition `fotopolis-studio9-anfrage` ist das zusätzliche versteckte Feld `fp_request_key` sichtbar; Netlify hat das Feld nach einem erfolgreichen Preview-Deploy erkannt.
- Die öffentliche Formular-Implementierung generiert beim Absenden **vor** dem Netlify-POST eine UUID; dieselbe ID wird bei der nachgelagerten Neon-Kopie als `request_key` verwendet. Die interne CRM-API liefert diese Referenz nur mit gültiger Berechtigung und zeigt sie im Verwaltungsbereich an.
- **Beweisgrenze:** Die Feldregistrierung und der Build beweisen die technische Datenzuordnung, aber keine Ende-zu-Ende-Zustellung. Für einen erfolgreichen Funktionstest muss eine ausdrücklich freigegebene synthetische Anfrage bei Netlify Forms eingehen und genau einmal mit identischer UUID in Neon erscheinen.
- Die aktuelle DEV-Bestandsaufnahme hatte zum Auditzeitpunkt 0 CRM-Anfragen; es wurden keine echten Kundenkontakte, E-Mails oder Buchungen ausgelöst.
