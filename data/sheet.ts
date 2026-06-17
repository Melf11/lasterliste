// Öffentliche CSV-URL des Google Sheets mit der Lasterliste.
//
// So bekommst du sie:
//   1. Google Sheet öffnen (Spalten: Marke | Modell | Beschreibung | Gewicht).
//      Zum Befüllen: Datei → Importieren → data/trucks.csv hochladen.
//   2. Datei → Freigeben → Im Web veröffentlichen
//      → "Gesamtes Dokument", Format "Kommagetrennte Werte (.csv)" → Veröffentlichen.
//   3. Die erzeugte URL (endet auf "output=csv") hier eintragen.
//
// Solange das Feld leer ist, zeigt die Seite einen Hinweis statt der Liste.
export const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRulkC2rwMKQPbGT8S5M_mwscun_r3TBtzIcBYNUx00i0qvwooRKOeKr30IUYotaiyiND-ntwp0SIAQ/pub?gid=0&single=true&output=csv'

// Optionaler Bearbeitungs-Link des Google Sheets (Teilen-/Edit-Link, endet auf /edit).
// Wird im Header/Footer als "bearbeiten"-Link verwendet. Bleibt er leer, verlinkt die
// Seite stattdessen automatisch die öffentliche Leseansicht des veröffentlichten Sheets.
export const SHEET_EDIT_URL =
  'https://docs.google.com/spreadsheets/d/17KJyeW6GAxpIM9eat4wMFit__qa1a4hZt0B-kbpstRw/edit?usp=sharing'
