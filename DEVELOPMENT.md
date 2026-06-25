# Technische Doku

Nutzer-Anleitung (Sheet pflegen, Seite ansehen) steht im [README](README.md).
Hier: Aufbau, lokale Entwicklung, Deployment und Sheet-Einrichtung.

## Aufbau

- **Nuxt 3**, als statische Seite generiert (`nuxt generate`) und auf **GitHub Pages** gehostet.
- Kein Backend, keine Datenbank, kein Login.
- Zwei Seiten über den Nuxt-Pages-Router:
  - **`pages/index.vue`** – die Lasterliste (Leergewichte).
  - **`pages/vebeg.vue`** – Statistik der VEBEG-Zuschlagspreise.
  - **`app.vue`** ist das gemeinsame Layout (Navigation + globale Styles + `<NuxtPage>`).
- Die Listendaten kommen **live aus einem Google Sheet**: Die Seite lädt im Browser die
  als CSV veröffentlichte Tabelle und rendert sie. Daten ändern sich also ohne Rebuild.

## VEBEG-Verkaufspreise (Statistik-Seite)

Die VEBEG-Seite (`zuschlagspreise.htm`) ist server-gerendertes HTML, hat **keine
CORS-Header** und zeigt nur die Zuschläge der *letzten Tage* – ein direkter Browser-Fetch
ist also nicht möglich, und ein einmaliger Snapshot würde veralten. Deshalb:

- **`scripts/scrape-vebeg.mjs`** (Node, ohne Abhängigkeiten) lädt die Seite, parst die
  Fahrzeug-Zeilen (Klassifizierung nach Typ + Marke per Schlüsselwort-Tabellen) und merged
  neue Zuschläge in **`public/vebeg.json`** – **dedupliziert nach Los-Nummer**, vorhandene
  Einträge bleiben erhalten. So wächst über die Zeit eine Historie.
- **`.github/workflows/scrape-vebeg.yml`** führt das Skript täglich (cron) aus und committet
  geänderte `public/vebeg.json`. Lokal: `node scripts/scrape-vebeg.mjs`.
- Da Bot-Commits mit dem `GITHUB_TOKEN` das `push`-Event **nicht** auslösen, deployt
  `pages.yml` zusätzlich per `workflow_run` nach Abschluss des Sammellaufs.
- `pages/vebeg.vue` lädt `public/vebeg.json` (unter `baseURL`) im Browser, filtert nach
  Typ/Marke/Suche und berechnet die Kennzahlen (Anzahl, Ø, Median, Min, Max).

## Datenquelle (Google Sheet)

- Die öffentliche CSV-URL steht in **`data/sheet.ts`** (`SHEET_CSV_URL`).
- `app.vue` holt sie beim Laden (`fetch`), parst das CSV (RFC-4180-tauglich: Kommas,
  Anführungszeichen und Zeilenumbrüche in Feldern werden korrekt behandelt) und mappt die
  Spalten per Kopfzeile (deutsche oder englische Header).
- **`data/trucks.csv`** ist ein Seed-Snapshot (201 Einträge) zum Erst-Import ins Sheet.

### Sheet einrichten (einmalig)

1. Google Sheet anlegen, Kopfzeile: `Marke | Modell | Beschreibung | Gewicht`.
2. Bestand übernehmen: **Datei → Importieren → Hochladen** → `data/trucks.csv` →
   „Daten an aktueller Stelle einfügen".
3. **Datei → Freigeben → Im Web veröffentlichen** → „Gesamtes Dokument",
   Format **Kommagetrennte Werte (.csv)** → *Veröffentlichen*.
4. Die erzeugte URL (endet auf `output=csv`) in `data/sheet.ts` eintragen, committen, pushen.

Zum *Bearbeiten* brauchen die Pfleger Schreibzugriff aufs Sheet (Teilen-Button). Zum
*Anzeigen* auf der Seite genügt das „Im Web veröffentlichen" – dafür braucht niemand Zugriff.

> Hinweis: Die veröffentlichte CSV ist öffentlich lesbar (für die Webseite nötig). Das ist
> ok, weil die Liste ohnehin öffentlich ist. Soll die Tabelle nicht öffentlich sein, müsste
> man stattdessen per geplanter GitHub Action das Sheet ziehen und ins Repo schreiben.

## Lokale Entwicklung

```bash
npm install
npm run dev        # http://localhost:3000
```

## Deployment (GitHub Pages)

Automatisch per GitHub Actions (`.github/workflows/pages.yml`): bei jedem Push auf
`main` läuft `npm run generate`, das Ergebnis (`.output/public`) wird zu GitHub Pages
deployt.

Einmalig im Repo: **Settings → Pages → Build and deployment → Source: „GitHub Actions"**.

Details:
- Der Workflow setzt beim Build `NUXT_APP_BASE_URL=/lasterliste/`, weil die Seite unter
  `https://melf11.github.io/lasterliste/` (Projekt-Pfad) liegt. Bei eigener Domain
  (Seite unter `/`) diesen Wert auf `/` ändern.
- `public/.nojekyll` verhindert, dass GitHub Pages die `_nuxt`-Assets ignoriert.
- Der Workflow nutzt `npm install` (nicht `npm ci`), weil die `package-lock.json` je nach
  Plattform optionale native Abhängigkeiten auslassen kann.

Ein erneuter Deploy ist nur nötig, wenn sich **Code** oder die **Sheet-URL** ändert –
die eigentlichen Listendaten kommen live aus dem Sheet.
