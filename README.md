# Lasterliste

Filterbare Liste von LKW-Leergewichten (Allrad-LKW, Expeditions-, Feuerwehr- und
Militärfahrzeuge). Statische Seite mit Nuxt 3, gehostet auf GitHub Pages. Die Daten
kommen live aus einem **Google Sheet** – so kann jede/r mit Google-Account mitpflegen,
ganz ohne GitHub.

## Liste pflegen (für alle, ohne GitHub)

Die Liste liegt in einem Google Sheet mit den Spalten **Marke · Modell · Beschreibung · Gewicht**.
Einfach eine Zeile ergänzen/ändern/löschen – die Seite zeigt die Änderung beim nächsten
Neuladen (Google cached die veröffentlichte Datei ein paar Minuten).

## Google Sheet einrichten (einmalig, durch den Repo-Owner)

1. Neues Google Sheet anlegen. Erste Zeile als Kopf: `Marke | Modell | Beschreibung | Gewicht`.
2. Bestand übernehmen: **Datei → Importieren → Hochladen** und die mitgelieferte
   [`data/trucks.csv`](data/trucks.csv) (201 Einträge) auswählen → „Daten an aktueller
   Stelle einfügen".
3. **Datei → Freigeben → Im Web veröffentlichen** → „Gesamtes Dokument",
   Format **Kommagetrennte Werte (.csv)** → *Veröffentlichen*.
4. Die erzeugte URL (endet auf `output=csv`) in **[`data/sheet.ts`](data/sheet.ts)**
   bei `SHEET_CSV_URL` eintragen und committen.

Zum *Bearbeiten* des Sheets gibst du den Mitpflegern Schreibzugriff (Teilen-Button,
Google-Konten oder Link). Zum *Anzeigen* auf der Seite genügt das „Im Web veröffentlichen"
aus Schritt 3 – dafür braucht niemand Zugriff.

## Lokale Entwicklung

```bash
npm install
npm run dev        # http://localhost:3000
```

## Deploy

GitHub Actions (`.github/workflows/pages.yml`) baut bei jedem Push auf `main`
(`npm run generate`) und veröffentlicht nach GitHub Pages. Einmalig im Repo:
**Settings → Pages → Source: „GitHub Actions"**.

> Hinweis: Die eigentlichen Listendaten ändern sich über das Google Sheet **ohne**
> erneuten Deploy – ein Rebuild ist nur nötig, wenn sich Code oder die Sheet-URL ändern.
