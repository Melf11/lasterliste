<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { SHEET_CSV_URL } from './data/sheet'

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
  const q = search.value.trim().toLowerCase()
  let list = trucks.value.filter((t) => {
    if (selectedBrands.value.length && !selectedBrands.value.includes(t.brand)) return false
    if (minWeight.value != null && t.weight < minWeight.value) return false
    if (maxWeight.value != null && t.weight > maxWeight.value) return false
    if (q) {
      const hay = `${t.brand} ${t.model} ${t.desc}`.toLowerCase()
      if (!hay.includes(q)) return false
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
  <div class="page">
    <header class="hero">
      <div class="hero-inner">
        <h1>Lasterliste</h1>
        <p class="sub">
          Leergewichte von Allrad-LKW, Expeditions-, Feuerwehr- und Militärfahrzeugen –
          aus der Forumsliste, filter- und durchsuchbar.
        </p>
      </div>
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
      Angaben ohne Gewähr – Mischung aus gewogenen Werten, Papieren und Schätzungen.
      Details siehe jeweilige Beschreibung. Die Liste wird gemeinschaftlich über ein
      Google Sheet gepflegt.
    </footer>
  </div>
</template>

<style>
:root {
  --bg: #0f1115;
  --panel: #181b22;
  --panel-2: #1f232c;
  --line: #2a2f3a;
  --text: #e7e9ee;
  --muted: #99a0ad;
  --accent: #ff8a3d;
  --accent-soft: rgba(255, 138, 61, 0.15);
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.5;
}

.page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1rem 4rem;
}

.hero {
  padding: 2.5rem 0 1.5rem;
}

.hero h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3rem);
  letter-spacing: -0.02em;
}

.hero .sub {
  margin: 0.5rem 0 0;
  color: var(--muted);
  max-width: 60ch;
}

.notice {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 1rem 1.1rem;
  color: var(--muted);
}

.notice.error {
  border-color: #5a2a2a;
  color: #ff9b9b;
}

.notice code {
  color: var(--text);
}

/* Filter bar */
.filters {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(15, 17, 21, 0.9);
  backdrop-filter: blur(8px);
  padding: 1rem 0;
  border-bottom: 1px solid var(--line);
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.field.grow {
  flex: 1 1 280px;
}

.field.weight {
  width: 120px;
}

.field-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}

input,
select {
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--text);
  padding: 0.55rem 0.7rem;
  border-radius: 10px;
  font-size: 0.95rem;
  width: 100%;
}

input:focus,
select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

.brands {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.9rem;
}

.chip {
  background: var(--panel);
  border: 1px solid var(--line);
  color: var(--muted);
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.12s ease;
}

.chip:hover {
  color: var(--text);
  border-color: var(--accent);
}

.chip.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #1a1205;
  font-weight: 600;
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.9rem;
  font-size: 0.9rem;
  color: var(--muted);
}

.meta .count strong {
  color: var(--text);
}

.reset {
  background: none;
  border: 1px solid var(--line);
  color: var(--muted);
  border-radius: 8px;
  padding: 0.3rem 0.7rem;
  cursor: pointer;
  font-size: 0.85rem;
}

.reset:hover {
  color: var(--text);
  border-color: var(--accent);
}

/* Results */
.results {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  margin-top: 1.4rem;
}

.empty {
  text-align: center;
  color: var(--muted);
  padding: 3rem 0;
}

.card {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  transition: border-color 0.12s ease, transform 0.12s ease;
}

.card:hover {
  border-color: #3a4150;
  transform: translateY(-1px);
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.title {
  display: flex;
  flex-direction: column;
}

.brand {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
  font-weight: 600;
}

.model {
  font-size: 1.05rem;
  font-weight: 600;
}

.weight {
  white-space: nowrap;
  font-size: 1.15rem;
  font-weight: 700;
  background: var(--panel-2);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 0.25rem 0.6rem;
}

.weight .unit {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--muted);
}

.desc {
  margin: 0;
  font-size: 0.9rem;
  color: var(--muted);
}

.foot {
  margin-top: 2.5rem;
  text-align: center;
  font-size: 0.82rem;
  color: var(--muted);
}

@media (max-width: 560px) {
  .field.weight {
    flex: 1 1 45%;
    width: auto;
  }
  .field select {
    width: 100%;
  }
}
</style>
