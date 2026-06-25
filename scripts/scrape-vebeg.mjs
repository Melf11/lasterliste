// Scraper für die VEBEG-Zuschlagspreise (https://www.vebeg.de/de/verkauf/zuschlagspreise.htm).
//
// Die VEBEG-Seite zeigt nur die Zuschläge der *letzten Tage* und lässt sich wegen
// fehlender CORS-Header nicht direkt aus dem Browser laden. Dieses Skript läuft
// daher per GitHub Action (siehe .github/workflows/scrape-vebeg.yml):
//   - lädt die Seite, parst die Fahrzeug-Zeilen,
//   - hängt neue Zuschläge an public/vebeg.json an (dedupliziert nach Los-Nummer),
//   - so wächst über die Zeit eine Historie für die Statistik-Seite.
//
// Lokal testen:  node scripts/scrape-vebeg.mjs

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const SOURCE_URL = 'https://www.vebeg.de/de/verkauf/zuschlagspreise.htm'
const OUT_FILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'vebeg.json')

// Fahrzeug-Kategorien: erstes passendes Schlüsselwort (Reihenfolge wichtig) bestimmt
// den Typ. Zeilen ohne Treffer sind keine Fahrzeuge und werden verworfen.
const VEHICLE_TYPES = [
  ['Anhänger', ['anhänger', 'auflieger', 'sattelanhänger']],
  ['Zugmaschine/Schlepper', ['zugmaschine', 'ackerschlepper', 'schlepper', 'unimog', 'traktor', 'geräteträger']],
  ['Krad', ['krad', 'kraftrad', 'motorrad', 'roller', 'quad']],
  ['Bus', ['omnibus', 'kleinbus', 'reisebus', ' bus']],
  ['Lkw', ['lkw', 'lastkraftwagen', 'kipper', 'pritsche', 'müllwagen', 'müllfahrzeug', 'feuerwehr', 'abrollcontainer', 'sattelzug', 'tankwagen', 'wechsellader', 'kofferaufbau']],
  ['Transporter', ['transporter', 'kastenwagen']],
  ['Pkw', ['pkw', 'kombi', 'geländewagen', 'cabrio', 'limousine', 'kleinwagen', 'personenkraftwagen']],
  ['Arbeitsmaschine', ['bagger', 'radlader', 'gabelstapler', 'stapler', 'walze', 'kehrmaschine', 'lader']]
]

// Bekannte Marken (Alias -> kanonischer Name) zum Ableiten von Marken-Filtern.
const BRANDS = {
  'mercedes-benz': 'Mercedes', mercedes: 'Mercedes', 'mb-trac': 'Mercedes',
  volkswagen: 'VW', vw: 'VW',
  audi: 'Audi', bmw: 'BMW', opel: 'Opel', ford: 'Ford',
  man: 'MAN', iveco: 'Iveco', magirus: 'Magirus', unimog: 'Unimog',
  mitsubishi: 'Mitsubishi', toyota: 'Toyota', nissan: 'Nissan', mazda: 'Mazda', honda: 'Honda',
  renault: 'Renault', citroën: 'Citroën', citroen: 'Citroën', peugeot: 'Peugeot',
  fiat: 'Fiat', skoda: 'Skoda', 'škoda': 'Skoda', seat: 'Seat',
  volvo: 'Volvo', scania: 'Scania', daf: 'DAF', setra: 'Setra', 'kässbohrer': 'Kässbohrer',
  deutz: 'Deutz', fendt: 'Fendt', 'john deere': 'John Deere', case: 'Case',
  hyundai: 'Hyundai', kia: 'Kia', suzuki: 'Suzuki', subaru: 'Subaru', jeep: 'Jeep',
  'land rover': 'Land Rover', landrover: 'Land Rover', dacia: 'Dacia', smart: 'Smart',
  multicar: 'Multicar', piaggio: 'Piaggio'
}

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&euro;/g, '€')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&[a-z]+;/g, ' ')
}

function stripTags(s) {
  return decodeEntities(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()
}

function classify(desc) {
  const d = ' ' + desc.toLowerCase() + ' '
  for (const [type, keys] of VEHICLE_TYPES) {
    if (keys.some((k) => d.includes(k))) return type
  }
  return null
}

function findBrand(desc) {
  const d = ' ' + desc.toLowerCase() + ' '
  for (const [alias, name] of Object.entries(BRANDS)) {
    if (d.includes(' ' + alias + ' ') || d.includes(' ' + alias + '-') || d.includes(' ' + alias + ',')) {
      return name
    }
  }
  return ''
}

function parsePrice(raw) {
  const digits = raw.replace(/[^\d,]/g, '').replace(/\./g, '').replace(',', '.')
  const n = parseFloat(digits)
  return Number.isFinite(n) ? n : null
}

function toISODate(s) {
  const m = s.match(/(\d{2})\.(\d{2})\.(\d{4})/)
  return m ? `${m[3]}-${m[2]}-${m[1]}` : ''
}

function parseRows(html) {
  const out = []
  const rowRe = /<tr class='highlighonhover zuschlag_user'[^>]*>(.*?)<\/tr>/gs
  let m
  while ((m = rowRe.exec(html))) {
    const cells = [...m[1].matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map((c) => stripTags(c[1]))
    if (cells.length < 4) continue
    const [los, dateRaw, desc, priceRaw] = cells
    if (!los || !desc) continue
    const type = classify(desc)
    if (!type) continue // keine Fahrzeug-Zeile
    const price = parsePrice(priceRaw)
    if (price == null) continue
    out.push({ los, date: toISODate(dateRaw), desc, type, brand: findBrand(desc), price })
  }
  return out
}

async function main() {
  console.log(`Lade ${SOURCE_URL} …`)
  const res = await fetch(SOURCE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; lasterliste-bot)' }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = new TextDecoder('latin1').decode(await res.arrayBuffer())

  const scraped = parseRows(html)
  console.log(`Gefunden: ${scraped.length} Fahrzeug-Zuschläge auf der Seite.`)

  // Bestand laden und nach Los-Nummer mergen (vorhandene Einträge bleiben erhalten).
  const byLos = new Map()
  if (existsSync(OUT_FILE)) {
    try {
      const prev = JSON.parse(readFileSync(OUT_FILE, 'utf8'))
      for (const it of prev.items ?? []) byLos.set(it.los, it)
    } catch (e) {
      console.warn('Bestehende vebeg.json nicht lesbar, beginne neu.', e.message)
    }
  }
  const before = byLos.size
  for (const it of scraped) if (!byLos.has(it.los)) byLos.set(it.los, it)

  const items = [...byLos.values()].sort(
    (a, b) => (b.date || '').localeCompare(a.date || '') || a.los.localeCompare(b.los)
  )
  const added = byLos.size - before

  writeFileSync(
    OUT_FILE,
    JSON.stringify({ updated: new Date().toISOString(), source: SOURCE_URL, count: items.length, items }, null, 0) + '\n'
  )
  console.log(`Neu hinzugefügt: ${added}. Gesamt: ${items.length}. Geschrieben: ${OUT_FILE}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
