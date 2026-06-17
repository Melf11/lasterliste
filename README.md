# Lasterliste

Filterbare Liste von LKW-Leergewichten (Allrad-LKW, Expeditions-, Feuerwehr- und
Militärfahrzeuge). Statische Seite mit Nuxt 3, gehostet auf GitHub Pages.

## Liste pflegen

Die komplette Liste steht in **[`data/trucks.ts`](data/trucks.ts)**. Einfach dort
einen Eintrag ergänzen/ändern und committen:

```ts
{ id: 202, brand: 'Mercedes', model: 'LA 911B', desc: 'kurze Doka …', weight: 4500 },
```

- `id`: fortlaufende Nummer (eindeutig)
- `brand`: Marke (gruppiert die Filter-Chips)
- `model`: Modellbezeichnung
- `desc`: Beschreibung (Aufbau, Bereifung, Quelle der Wägung …) – darf leer sein
- `weight`: Leergewicht in kg (die genannte Hauptangabe)

Bei jedem Commit auf `main` baut GitHub Actions die Seite neu und veröffentlicht sie.

## Lokale Entwicklung

```bash
npm install
npm run dev        # http://localhost:3000
```

## Build / Deploy

GitHub Actions (`.github/workflows/pages.yml`) führt bei Push auf `main`
`npm run generate` aus und deployt das Ergebnis nach GitHub Pages – nichts manuell nötig.

Einmalig im Repo: **Settings → Pages → Build and deployment → Source: „GitHub Actions"**.
