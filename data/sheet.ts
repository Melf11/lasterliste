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
export const SHEET_CSV_URL = ''
