<script setup lang="ts">
// Gemeinsames Layout: Navigation + Seiteninhalt (NuxtPage). Die einzelnen Seiten
// liegen unter pages/ (index.vue = Lasterliste, vebeg.vue = Vebeg-Statistik).
</script>

<template>
  <div class="page">
    <nav class="topnav">
      <NuxtLink to="/" class="nav-link">📋 Lasterliste</NuxtLink>
      <NuxtLink to="/vebeg" class="nav-link">📊 Vebeg-Preise</NuxtLink>
    </nav>
    <NuxtPage />
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

/* Top navigation */
.topnav {
  display: flex;
  gap: 0.5rem;
  padding: 1rem 0 0;
}

.nav-link {
  text-decoration: none;
  color: var(--muted);
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--panel);
  transition: all 0.12s ease;
}

.nav-link:hover {
  color: var(--text);
  border-color: var(--accent);
}

.nav-link.router-link-active {
  color: #1a1205;
  background: var(--accent);
  border-color: var(--accent);
}

.hero {
  padding: 2rem 0 1.5rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem 1.5rem;
  flex-wrap: wrap;
}

.sheet-btn {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--accent);
  color: #1a1205;
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  padding: 0.55rem 0.9rem;
  border-radius: 10px;
  border: 1px solid var(--accent);
  transition: filter 0.12s ease, transform 0.12s ease;
}

.sheet-btn:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
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
  gap: 0.75rem;
  flex-wrap: wrap;
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

.foot p {
  margin: 0.4rem 0;
}

.foot-links a {
  color: var(--accent);
  text-decoration: none;
}

.foot-links a:hover {
  text-decoration: underline;
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
