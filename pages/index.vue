<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { SHEET_CSV_URL, SHEET_EDIT_URL } from '../data/sheet'

useHead({ title: 'Lasterliste – Leergewichte' })

// Link zum Sheet: bevorzugt der Bearbeitungs-Link, sonst die öffentliche Leseansicht
// des veröffentlichten Sheets (aus der CSV-URL abgeleitet).
const sheetUrl = SHEET_EDIT_URL || SHEET_CSV_URL.replace(/\/pub\?.*$/, '/pubhtml')
const repoUrl = 'https://github.com/Melf11/lasterliste'

interface Truck {
  id: number
  brand: string
  model: string
  desc: string
  weight: number
}

const trucks = ref<Truck[]>([])
const status = ref<'loading' | 'ready' | 'error' | 'unconfigured'>('loading')
const errorMsg = ref('')

/** Minimaler RFC-4180-CSV-Parser: behandelt Kommas, Zeilenumbrüche und "" in Feldern. */
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  text = text.replace(/\r\n?/g, '\n')
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows
}

const HEADER_ALIASES: Record<keyof Omit<Truck, 'id'>, string[]> = {
  brand: ['marke', 'brand', 'hersteller'],
  model: ['modell', 'model', 'typ'],
  desc: ['beschreibung', 'desc', 'description', 'aufbau'],
  weight: ['gewicht', 'weight', 'leergewicht', 'kg', 'gewicht (kg)']
}

function rowsToTrucks(rows: string[][]): Truck[] {
  if (!rows.length) return []
  const header = rows[0].map((h) => h.trim().toLowerCase())
  const col = (field: keyof typeof HEADER_ALIASES) =>
    header.findIndex((h) => HEADER_ALIASES[field].includes(h))
  const ci = { brand: col('brand'), model: col('model'), desc: col('desc'), weight: col('weight') }

  const out: Truck[] = []
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r]
    const brand = (cells[ci.brand] ?? '').trim()
    const model = (cells[ci.model] ?? '').trim()
    const desc = (cells[ci.desc] ?? '').trim()
    const weight = Number(String(cells[ci.weight] ?? '').replace(/[^\d]/g, '')) || 0
    if (!brand && !model) continue // Leerzeilen überspringen
    out.push({ id: r, brand, model, desc, weight })
  }
  return out
}

onMounted(async () => {
  if (!SHEET_CSV_URL) {
    status.value = 'unconfigured'
    return
  }
  try {
    const res = await fetch(SHEET_CSV_URL, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    trucks.value = rowsToTrucks(parseCSV(await res.text()))
    status.value = 'ready'
  } catch (e: any) {
    errorMsg.value = e?.message || 'Unbekannter Fehler'
    status.value = 'error'
  }
})

const search = ref('')
const selectedBrands = ref<string[]>([])
const minWeight = ref<number | null>(null)
const maxWeight = ref<number | null>(null)
const sortBy = ref<'brand' | 'weight-asc' | 'weight-desc'>('brand')

const brands = computed(() =>
  [...new Set(trucks.value.map((t) => t.brand))].sort((a, b) => a.localeCompare(b, 'de'))
)

const weightBounds = computed(() => {
  const w = trucks.value.map((t) => t.weight).filter((n) => n > 0)
  return w.length ? { min: Math.min(...w), max: Math.max(...w) } : { min: 0, max: 0 }
})

function toggleBrand(brand: string) {
  const i = selectedBrands.value.indexOf(brand)
  if (i === -1) selectedBrands.value.push(brand)
  else selectedBrands.value.splice(i, 1)
}

function resetFilters() {
  search.value = ''
  selectedBrands.value = []
  minWeight.value = null
  maxWeight.value = null
  sortBy.value = 'brand'
}

const filtered = computed<Truck[]>(() => {
  // Tokenisierte Suche: jedes Wort muss vorkommen (beliebige Reihenfolge).
  const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean)
  let list = trucks.value.filter((t) => {
    if (selectedBrands.value.length && !selectedBrands.value.includes(t.brand)) return false
    if (minWeight.value != null && t.weight < minWeight.value) return false
    if (maxWeight.value != null && t.weight > maxWeight.value) return false
    if (terms.length) {
      const hay = `${t.brand} ${t.model} ${t.desc}`.toLowerCase()
      if (!terms.every((term) => hay.includes(term))) return false
    }
    return true
  })

  list = [...list].sort((a, b) => {
    if (sortBy.value === 'weight-asc') return a.weight - b.weight
    if (sortBy.value === 'weight-desc') return b.weight - a.weight
    return (
      a.brand.localeCompare(b.brand, 'de') ||
      a.model.localeCompare(b.model, 'de') ||
      a.weight - b.weight
    )
  })
  return list
})

const fmt = (n: number) => n.toLocaleString('de-DE')

const hasActiveFilters = computed(
  () =>
    !!search.value ||
    selectedBrands.value.length > 0 ||
    minWeight.value != null ||
    maxWeight.value != null
)
</script>

<template>
  <div>
    <header class="hero">
      <div class="hero-inner">
        <h1>Lasterliste</h1>
        <p class="sub">
          Leergewichte von Allrad-LKW, Expeditions-, Feuerwehr- und Militärfahrzeugen –
          aus der Forumsliste, filter- und durchsuchbar.
        </p>
      </div>
      <a class="sheet-btn" :href="sheetUrl" target="_blank" rel="noopener">
        ✏️ Liste im Google&nbsp;Sheet bearbeiten
      </a>
    </header>

    <p v-if="status === 'loading'" class="notice">Lade Liste …</p>

    <p v-else-if="status === 'unconfigured'" class="notice">
      Noch keine Datenquelle hinterlegt. Trage die veröffentlichte Google-Sheet-CSV-URL
      in <code>data/sheet.ts</code> ein.
    </p>

    <p v-else-if="status === 'error'" class="notice error">
      Liste konnte nicht geladen werden ({{ errorMsg }}). Prüfe, ob das Google Sheet
      „im Web veröffentlicht" ist.
    </p>

    <template v-else>
      <div class="filters">
        <div class="filter-row">
          <label class="field grow">
            <span class="field-label">Suche</span>
            <input
              v-model="search"
              type="search"
              placeholder="Modell, Aufbau, Bereifung … (z. B. „Doka“, „1113“, „ohne Pritsche“)"
            />
          </label>

          <label class="field">
            <span class="field-label">Sortierung</span>
            <select v-model="sortBy">
              <option value="brand">Marke / Modell</option>
              <option value="weight-asc">Gewicht ↑ (leicht zuerst)</option>
              <option value="weight-desc">Gewicht ↓ (schwer zuerst)</option>
            </select>
          </label>

          <label class="field weight">
            <span class="field-label">Gewicht von (kg)</span>
            <input
              v-model.number="minWeight"
              type="number"
              inputmode="numeric"
              :placeholder="String(weightBounds.min)"
            />
          </label>

          <label class="field weight">
            <span class="field-label">bis (kg)</span>
            <input
              v-model.number="maxWeight"
              type="number"
              inputmode="numeric"
              :placeholder="String(weightBounds.max)"
            />
          </label>
        </div>

        <div class="brands">
          <button
            v-for="b in brands"
            :key="b"
            class="chip"
            :class="{ active: selectedBrands.includes(b) }"
            type="button"
            @click="toggleBrand(b)"
          >
            {{ b }}
          </button>
        </div>

        <div class="meta">
          <span class="count">
            <strong>{{ filtered.length }}</strong> von {{ trucks.length }} Einträgen
          </span>
          <button v-if="hasActiveFilters" class="reset" type="button" @click="resetFilters">
            Filter zurücksetzen
          </button>
        </div>
      </div>

      <main class="results">
        <p v-if="!filtered.length" class="empty">
          Keine Treffer. Filter anpassen oder zurücksetzen.
        </p>

        <article v-for="t in filtered" :key="t.id" class="card">
          <div class="card-head">
            <div class="title">
              <span class="brand">{{ t.brand }}</span>
              <span class="model">{{ t.model }}</span>
            </div>
            <div v-if="t.weight" class="weight">
              {{ fmt(t.weight) }} <span class="unit">kg</span>
            </div>
          </div>
          <p v-if="t.desc" class="desc">{{ t.desc }}</p>
        </article>
      </main>
    </template>

    <footer class="foot">
      <p class="foot-note">
        Angaben ohne Gewähr – Mischung aus gewogenen Werten, Papieren und Schätzungen.
        Details siehe jeweilige Beschreibung.
      </p>
      <p class="foot-links">
        Liste gemeinschaftlich gepflegt über ein
        <a :href="sheetUrl" target="_blank" rel="noopener">Google Sheet</a>
        · <a :href="repoUrl" target="_blank" rel="noopener">Quellcode auf GitHub</a>
      </p>
    </footer>
  </div>
</template>
