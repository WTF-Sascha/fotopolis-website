# FOTOPOLIS · Website/PWA Preview 1.2

**Status:** Entwicklungsstand; keine öffentliche Veröffentlichung. Diese Vorschau wird auf Netlify bereitgestellt, hat aber ein absichtliches `noindex`.

## CI / Design-Freeze
Die freigegebene Wort-/Bildmarke darf **nicht** neu gezeichnet oder verändert werden. CI-Tokens: Navy `#071B30`, Deep Blue `#123B5C`, Champagne `#D7B77A`, Warm Ivory `#F8F2E6`. Das Original-Logo muss noch als unveränderte Datei nach `site/assets/fotopolis-logo-original.png` hochgeladen werden. Die Gestaltung zeigt bis dahin lediglich den Text-Fallback.

## Website
- Startseite, Fotobox, Fotospiegel, Fotowohnwagen, Über uns, Kontakt und Rechtliches.
- Statische HTML-/CSS-/JS-Struktur ohne Abhängigkeiten und ohne Datenbank.
- Responsive Navigation, kontrastreiche Gestaltung, reduced-motion berücksichtigt.
- Kontaktanfragen absichtlich **nicht aktiviert**, solange Supabase, Datenschutz und Unternehmensangaben ungeprüft sind.

## PWA
- Manifest, Service Worker, Offline-Fallback vorhanden.
- Echte App-Icons aus der **unveränderten Originaldatei** stehen noch aus. Das Manifest führt deshalb bewusst noch keine Icons; die PWA ist **noch nicht vollständig installierbar**.
- Nur GETs der eigenen Informationsseiten werden offline gecacht; keine Anfrage- oder Admin-Endpunkte.

## Netlify
In `netlify.toml`: Publish-Ordner `site`, keine Build-Pipeline. Nach GitHub-Commit erfolgt ein automatischer Deploy auf `fotopolis-preview`. Der Seitenaufruf ist öffentlich erreichbar, daher keine echten Kundendaten verwenden.

## Supabase
Die Organisation FOTOPOLIS wurde vom Nutzer angelegt, aber die Free-Projektgrenze verhindert momentan ein neues Projekt. Noch keine Supabase-Konfiguration enthalten.

## Vor Produktivsetzung
1. GitHub-Repository privat stellen, sofern gewünscht.
2. Original-Logo und daraus abgeleitete PNG-Icons hochladen.
3. Echte Unternehmensdaten, Foto-/Bildrechte, Impressum, Datenschutz ergänzen.
4. Kontakt-Backend separat anbinden und absichern.
5. Mobile PWA-Installations- und Offline-Tests durchführen.
6. Freigabe für Domain und Live-Schaltung einholen.
