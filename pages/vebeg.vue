<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

useHead({ title: 'Vebeg-Verkaufspreise – Statistik' })

const repoUrl = 'https://github.com/Melf11/lasterliste'
const sourceUrl = 'https://www.vebeg.de/de/verkauf/zuschlagspreise.htm'
const baseURL = useRuntimeConfig().app.baseURL

interface Item {
  los: string
  date: string // ISO YYYY-MM-DD
  desc: string
  type: string
  brand: string
  price: number
}

const items = ref<Item[]>([])
const updated = ref('')
const status = ref<'loading' | 'ready' | 'error' | 'empty'>('loading')
const errorMsg = ref('')

onMounted(async () => {
  try {
    const res = await fetch(`${baseURL}vebeg.json`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    items.value = data.items ?? []
    updated.value = data.updated ?? ''
    status.value = items.value.length ? 'ready' : 'empty'
  } catch (e: any) {
    errorMsg.value = e?.message || 'Unbekannter Fehler'
    status.value = 'error'
  }
})

const search = ref('')
const selectedTypes = ref<string[]>([])
const selectedBrands = ref<string[]>([])
const minPrice = ref<number | null>(null)
const maxPrice = ref<number | null>(null)
const sortBy = ref<'price-desc' | 'price-asc' | 'date-desc'>('price-desc')

/** Eindeutige Werte eines Feldes, sortiert nach Häufigkeit (häufigste zuerst). */
function byFrequency(field: 'type' | 'brand') {
  const counts = new Map<string, number>()
  for (const it of items.value) {
    const v = it[field]
    if (!v) continue
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v)
}

const types = computed(() => byFrequency('type'))
const brands = computed(() => byFrequency('brand'))

const priceBounds = computed(() => {
  const p = items.value.map((i) => i.price)
  return p.length ? { min: Math.min(...p), max: Math.max(...p) } : { min: 0, max: 0 }
})

function toggle(list: typeof selectedTypes, value: string) {
  const i = list.value.indexOf(value)
  if (i === -1) list.value.push(value)
  else list.value.splice(i, 1)
}

function resetFilters() {
  search.value = ''
  selectedTypes.value = []
  selectedBrands.value = []
  minPrice.value = null
  maxPrice.value = null
  sortBy.value = 'price-desc'
}

const filtered = computed<Item[]>(() => {
  // Tokenisierte Suche: jedes Wort muss vorkommen (beliebige Reihenfolge),
  // gesucht wird über Beschreibung + Typ + Marke.
  const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean)
  let list = items.value.filter((it) => {
    if (selectedTypes.value.length && !selectedTypes.value.includes(it.type)) return false
    if (selectedBrands.value.length && !selectedBrands.value.includes(it.brand)) return false
    if (minPrice.value != null && it.price < minPrice.value) return false
    if (maxPrice.value != null && it.price > maxPrice.value) return false
    if (terms.length) {
      const hay = `${it.desc} ${it.type} ${it.brand}`.toLowerCase()
      if (!terms.every((t) => hay.includes(t))) return false
    }
    return true
  })
  list = [...list].sort((a, b) => {
    if (sortBy.value === 'price-asc') return a.price - b.price
    if (sortBy.value === 'date-desc') return (b.date || '').localeCompare(a.date || '') || b.price - a.price
    return b.price - a.price
  })
  return list
})

/** Kennzahlen über die aktuell gefilterten Zuschläge. */
const stats = computed(() => {
  const prices = filtered.value.map((i) => i.price).sort((a, b) => a - b)
  const n = prices.length
  if (!n) return null
  const sum = prices.reduce((s, p) => s + p, 0)
  const mid = Math.floor(n / 2)
  const median = n % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2
  return { n, sum, avg: sum / n, median, min: prices[0], max: prices[n - 1] }
})

const hasActiveFilters = computed(
  () =>
    !!search.value ||
    selectedTypes.value.length > 0 ||
    selectedBrands.value.length > 0 ||
    minPrice.value != null ||
    maxPrice.value != null
)

const fmtEur = (n: number) =>
  n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const fmtDate = (iso: string) => {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso
}
const fmtUpdated = computed(() => (updated.value ? fmtDate(updated.value.slice(0, 10)) : ''))
</script>

<template>
  <div>
    <header class="hero">
      <div class="hero-inner">
        <h1>Vebeg-Verkaufspreise</h1>
        <p class="sub">
          Erzielte Zuschlagspreise für Fahrzeuge aus den VEBEG-Ausschreibungen, gesammelt
          über die Zeit. Nach Typ, Marke oder Stichwort filtern und die Statistik dazu ablesen.
        </p>
      </div>
      <a class="sheet-btn" :href="sourceUrl" target="_blank" rel="noopener">
        🔗 VEBEG-Zuschlagspreise
      </a>
    </header>

    <p v-if="status === 'loading'" class="notice">Lade Daten …</p>

    <p v-else-if="status === 'empty'" class="notice">
      Noch keine Daten gesammelt. Die GitHub Action <code>scrape-vebeg</code> füllt
      <code>public/vebeg.json</code> – sobald sie einmal lief, erscheinen hier die Zuschläge.
    </p>

    <p v-else-if="status === 'error'" class="notice error">
      Daten konnten nicht geladen werden ({{ errorMsg }}).
    </p>

    <template v-else>
      <div class="filters">
        <div class="filter-row">
          <label class="field grow">
            <span class="field-label">Suche</span>
            <input
              v-model="search"
              type="search"
              placeholder="Mehrere Wörter, beliebige Reihenfolge (z. B. „mercedes sprinter 4x4“)"
            />
          </label>

          <label class="field">
            <span class="field-label">Sortierung</span>
            <select v-model="sortBy">
              <option value="price-desc">Preis ↓ (teuer zuerst)</option>
              <option value="price-asc">Preis ↑ (günstig zuerst)</option>
              <option value="date-desc">Datum (neueste zuerst)</option>
            </select>
          </label>

          <label class="field weight">
            <span class="field-label">Preis ab (€)</span>
            <input
              v-model.number="minPrice"
              type="number"
              inputmode="numeric"
              :placeholder="String(priceBounds.min)"
            />
          </label>

          <label class="field weight">
            <span class="field-label">bis (€)</span>
            <input
              v-model.number="maxPrice"
              type="number"
              inputmode="numeric"
              :placeholder="String(priceBounds.max)"
            />
          </label>
        </div>

        <div class="brands">
          <button
            v-for="t in types"
            :key="t"
            class="chip"
            :class="{ active: selectedTypes.includes(t) }"
            type="button"
            @click="toggle(selectedTypes, t)"
          >
            {{ t }}
          </button>
        </div>

        <div v-if="brands.length" class="brands brand-chips">
          <button
            v-for="b in brands"
            :key="b"
            class="chip"
            :class="{ active: selectedBrands.includes(b) }"
            type="button"
            @click="toggle(selectedBrands, b)"
          >
            {{ b }}
          </button>
        </div>

        <div class="meta">
          <span class="count">
            <strong>{{ filtered.length }}</strong> von {{ items.length }} Zuschlägen
          </span>
          <button v-if="hasActiveFilters" class="reset" type="button" @click="resetFilters">
            Filter zurücksetzen
          </button>
        </div>
      </div>

      <section v-if="stats" class="statgrid">
        <div class="stat">
          <span class="stat-label">Anzahl</span>
          <span class="stat-value">{{ stats.n.toLocaleString('de-DE') }}</span>
        </div>
        <div class="stat accent">
          <span class="stat-label">Durchschnitt</span>
          <span class="stat-value">{{ fmtEur(stats.avg) }}</span>
        </div>
        <div class="stat accent">
          <span class="stat-label">Median</span>
          <span class="stat-value">{{ fmtEur(stats.median) }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Minimum</span>
          <span class="stat-value">{{ fmtEur(stats.min) }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Maximum</span>
          <span class="stat-value">{{ fmtEur(stats.max) }}</span>
        </div>
      </section>

      <main class="results">
        <p v-if="!filtered.length" class="empty">
          Keine Treffer. Filter anpassen oder zurücksetzen.
        </p>

        <article v-for="it in filtered" :key="it.los" class="card">
          <div class="card-head">
            <div class="title">
              <span class="brand">{{ it.type }}<template v-if="it.brand"> · {{ it.brand }}</template></span>
              <span class="model">{{ it.desc }}</span>
            </div>
            <div class="weight">{{ fmtEur(it.price) }}</div>
          </div>
          <p class="desc">Zuschlag am {{ fmtDate(it.date) }} · Los {{ it.los }}</p>
        </article>
      </main>
    </template>

    <footer class="foot">
      <p class="foot-note">
        Angaben ohne Gewähr. Zuschlagspreise netto (ohne USt.), Quelle:
        <a class="inline" :href="sourceUrl" target="_blank" rel="noopener">VEBEG</a>.
        <template v-if="fmtUpdated"> Stand der Sammlung: {{ fmtUpdated }}.</template>
      </p>
      <p class="foot-links">
        Daten täglich automatisch gesammelt ·
        <a :href="repoUrl" target="_blank" rel="noopener">Quellcode auf GitHub</a>
      </p>
    </footer>
  </div>
</template>

<style scoped>
.brand-chips {
  margin-top: 0.5rem;
  opacity: 0.92;
}

.statgrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.7rem;
  margin-top: 1.4rem;
}

.stat {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 0.9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.stat.accent {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.stat-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
}

.inline {
  color: var(--accent);
  text-decoration: none;
}

.inline:hover {
  text-decoration: underline;
}
</style>
