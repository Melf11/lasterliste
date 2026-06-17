# Lasterliste

Filter- und durchsuchbare Liste von LKW-Leergewichten (Allrad-LKW, Expeditions-,
Feuerwehr- und Militärfahrzeuge).

## Liste ansehen

👉 **https://melf11.github.io/lasterliste/**

Oben kannst du suchen, nach Marke filtern, nach Gewicht eingrenzen und sortieren.

## Liste bearbeiten

Die Daten liegen in einem **Google Sheet** – dafür brauchst du nur einen
Google-Account, kein GitHub.

👉 **Google Sheet:** _https://docs.google.com/spreadsheets/d/17KJyeW6GAxpIM9eat4wMFit__qa1a4hZt0B-kbpstRw/edit?usp=sharing_

So geht's:

- **Eintrag hinzufügen:** unten eine neue Zeile ausfüllen.
- **Eintrag ändern:** die betreffende Zelle anpassen.
- **Eintrag löschen:** die ganze Zeile löschen (Rechtsklick auf die Zeilennummer → „Zeile löschen").

Die Spalten:

| Spalte | Bedeutung |
|---|---|
| **Marke** | Hersteller, z. B. `Mercedes` (gruppiert die Filter-Knöpfe) |
| **Modell** | Modellbezeichnung, z. B. `LA 1113B` |
| **Beschreibung** | Aufbau, Bereifung, Radstand, Quelle der Wägung … (darf leer sein) |
| **Gewicht** | Leergewicht in kg, nur die Zahl, z. B. `4500` |

Wichtig:
- Die **erste Zeile** (Überschriften `Marke / Modell / Beschreibung / Gewicht`)
  bitte nicht umbenennen oder löschen.
- Änderungen erscheinen auf der Webseite nach kurzer Zeit – einfach die Seite neu laden
  (Google aktualisiert die Daten ein paar Minuten verzögert).

---

ℹ️ Technische Doku (Aufbau, lokale Entwicklung, Deployment, Sheet einrichten):
siehe **[DEVELOPMENT.md](DEVELOPMENT.md)**.
