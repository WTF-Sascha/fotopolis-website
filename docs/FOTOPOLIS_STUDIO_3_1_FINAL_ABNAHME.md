# FOTOPOLIS Studio Experience 3.1 — Abgeschlossene UI/UX-Überarbeitung

**Stand:** 05.11.2026 · Nur neuer, isolierter Website-Prototyp · `design/premium-v2` · Draft-PR #2 · Netlify Deploy Preview.

## Abnahmegegenstand

Der Auftrag, **die bereits vorhandene neue FOTOPOLIS-Website** auf einen durchgängigen Premium-Studio-Standard für Benutzerführung und visuelle Darstellung zu bringen, ist im Entwicklungszweig **technisch umgesetzt, vollständig automatisiert geprüft und in den dokumentierten Screenshots visuell gegengeprüft**.

Nicht Gegenstand dieser Studio-Finalisierung sind eine produktive Buchungsdatenbank, Admin-Kalender, Live-Verfügbarkeit, echte Reservierungen, automatische E-Mails oder der öffentliche Relaunch. Diese bleiben ausdrücklich Teil der separat dokumentierten Gesam­t­roadmap.

## Umgesetzte Verbesserungen

1. **Konsistenter visueller Studiostandard**: Deep-Navy, Champagnergold und warme neutrale Flächen beibehalten; feinere Typografierhythmik, einheitliche Abstände, Fokus-/Touchzustände und responsive Designregeln auf allen zwölf Seiten.
2. **Kompakter bildfreier Homepage-Hero**: direkte Produkt- und Anfragewege, keine Änderung am freigegebenen Original-Logo.
3. **Anlassbasierter Erlebnisberater**: vier auswählbare Eventtypen, sofortige redaktionelle Empfehlung, lokale Vorauswahl im Kontaktformular. Mobil wird die Empfehlung nach Auswahl ins Sichtfeld gebracht. Der neue Link „Anderen Anlass auswählen“ führt mit korrektem Tastaturfokus zurück.
4. **Drei unveränderte Original-Produktvisualisierungen**: Fotobox, Fotospiegel, Fotowohnwagen mit unveränderten Quellen/Hash-Wachen und unverfälschter Darstellung.
5. **Informationsarchitektur**: thematische Seitenanker und zugängliche, aufklappbare Zusatzinformationen; aus FAQ, Galerie, Anlässen, Über uns, Paketen, Kontakt und Rechtsseiten wurden generische, doppelt vorhandene Seitenleisten/Abschlussaufforderungen entfernt. Produktseiten behalten ihre kontextbezogene Anfragehilfe.
6. **Kontakt-Wizard**: drei klare Schritte Event → Kontaktdaten → Wünsche, Schrittvalidierung, Vor/Zurück, erhaltene Daten, lokale Sofortzusammenfassung, ausdrücklich manuell auszulösender E-Mail-Entwurf und Kopierfunktion; kein Backend und keine Datenübertragung. Bei gewünschtem Rückruf ist die Telefonnummer erforderlich.
7. **Mobile UX und echte Layoutkorrektur**: Der schwebende Anfrage-Button wurde nach Sichtprüfung entfernt, weil er FAQ-Texte und Produktbereiche überdeckte. In-Page-CTAs und Hauptnavigation bleiben vorhanden. Kontakt-Einstieg verschlankt, primäre „Weiter“-Aktion vor nachrangigen Hinweisen platziert.

## Messbare Auswirkung auf Screenshot-Höhen

Die Maße stammen aus den archivierten GitHub-Actions-Screenshots, gleiche Browserbreite je Vergleich. Sie messen **Seitenlänge**, nicht Ladegeschwindigkeit, LCP, CLS oder Conversionrate.

| Seite und Breite | Version 2.9 | Studio 3.1 | Differenz |
| --- | ---: | ---: | ---: |
| Startseite, 1440 px | 6.932 px | 5.823 px | −16,0 % |
| Startseite, 320 px | 9.329 px | 8.681 px | −6,9 % |
| Kontakt, 320 px | 5.989 px | 3.157 px | −47,3 % |
| FAQ, 375 px | 2.663 px | 1.668 px | −37,4 % |

## Technischer Qualitätsnachweis

**Geprüfter Code-Commit:** `7b4eb1d3039a660429415f002d12efbca1b32feb`.

**[GitHub Actions: FOTOPOLIS Premium V2 Visual QA · Run 42127154852](https://github.com/WTF-Sascha/fotopolis-website/actions/runs/42127154852): SUCCESS, keine fehlerhaften Prüfpunkte.**

| Testgruppe | Bestanden |
| --- | ---: |
| Startseite im Quellkonzept | 124/124 |
| Startseite im Netlify-Publish-Build | 124/124 |
| Unterseiten, Menü, Tastaturfokus | 147/147 |
| Vollständiges Layout: 12 Routen × 9 Breiten | 1.188/1.188 |
| Paketfinder und Anfragewünsche | 108/108 |
| Anlasswelten, Galerie, Vertrauen | 252/252 |
| Kontakt-Wizard, Vor-/Zurück-Navigation | 168/168 |
| Studio-3-Nutzerwege, acht Viewports | 718/718 |
| Abschluss-Gate: sichtbares Formular, Rückruf und keine Überlagerungen | 373/373 |
| **GESAMT** | **3.202/3.202** |

Im QA-Artefakt befinden sich unter anderem 15 Layout-, 3 Paket-, 9 Anlass-/Galerie-/Über-uns-, 3 Kontakt-, 6 Studio- und 5 Abschluss-Screenshots, sowie zusätzliche Route-/Konzeptbilder. Mindestens die fertigen Startseiten-, Kontakt-, Produkt- und FAQ-Screenshots bei mobilen und Desktopbreiten wurden manuell geöffnet und auf offensichtlichen Beschnitt, Überlagerungen, Bilddarstellung und Informationshierarchie geprüft.

## Schutz und offene Freigaben

- **KEIN Merge** nach `main`, keine Änderung der bestehenden Produktivdomain `fotopolis-mieten.de`.
- **KEINE** Änderung der freigegebenen Corporate Identity 1.0, des Logos und der drei hochgeladenen Original-Produktmotive.
- **KEINE** produktive Buchung, kein Versand ohne explizite Benutzerinteraktion, keine Speicherung/Verarbeitung echter Kundendaten durch den Prototyp.
- **KEINE** erfundenen Sternebewertungen, Kundenreferenzen, Preise, Paketgarantien und Verfügbarkeiten.
- Die bisherigen Eventbilder sind nur für diese Entwicklungsvorschau vorgesehen; **Personen-/Bildrechte vor Livegang bestätigen**.
- Impressum und Datenschutztexte sind im Preview noch Entwürfe.
- Der separate `Premium release gate` darf die Veröffentlichung weiterhin verhindern, auch wenn der technische Browser-QA-Lauf erfolgreich ist.

## Abschlussentscheidung

**Studio 3.1 – UI/UX-Implementierung und technische Regression: ABGESCHLOSSEN.**

**Öffentlicher Website-Relaunch / echte Buchungsfunktion: NICHT FREIGEGEBEN.** Die gesonderte Zehn-Punkte-Roadmap bleibt bis zur eigenen technischen, geschäftlichen und rechtlichen Abnahme offen.

[Isolierte Preview](https://deploy-preview-2--fotopolis-preview.netlify.app/) · [GitHub Draft-PR #2](https://github.com/WTF-Sascha/fotopolis-website/pull/2)
