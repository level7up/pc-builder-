<script setup lang="ts">
import { storeSummaries } from '../domain/storeProfile'
import type { Locale, Messages } from '../i18n/messages'
import { formatCount } from '../format'
import { storeHash } from '../useRoute'

defineProps<{ t: Messages; locale: Locale }>()

const summaries = storeSummaries()
</script>

<template>
  <section class="stores-page" :aria-label="t.shops.title">
    <h2>{{ t.shops.title }}</h2>
    <p class="hint">{{ t.shops.hint }}</p>
    <ul class="list">
      <li v-for="s in summaries" :key="s.store.id" class="store-summary" :data-store="s.store.id">
        <a class="name" :href="storeHash(s.store.id)">{{ s.store.name }}</a>
        <p class="stats">
          <span>{{ t.shops.products(formatCount(s.products, locale)) }}</span>
          <span class="ok">{{ t.shops.inStock(formatCount(s.inStock, locale)) }}</span>
        </p>
        <p class="cheapest">{{ t.shops.cheapest(formatCount(s.cheapest, locale)) }}</p>
        <ul class="categories">
          <li v-for="c in s.categories" :key="c.category">{{ t.categories[c.category] }} <b>{{ formatCount(c.inStock, locale) }}</b></li>
        </ul>
        <a class="open" :href="storeHash(s.store.id)">{{ t.shops.open }}</a>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.stores-page { margin-top: 20px; }
h2 { margin: 0; font-size: 20px; }
.hint { margin: 4px 0 16px; color: var(--muted); }
.list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.store-summary { display: flex; flex-direction: column; gap: 8px; padding: 16px; border-radius: var(--radius); border: 1px solid var(--line); background: var(--panel); box-shadow: var(--shadow); }
.store-summary:hover { border-color: var(--accent); }
.name { font-size: 18px; font-weight: 800; color: inherit; text-decoration: none; }
.name:hover { color: var(--accent); }
.stats { display: flex; flex-wrap: wrap; gap: 4px 12px; margin: 0; font-weight: 700; font-variant-numeric: tabular-nums; }
.ok { color: var(--ok); }
.cheapest { margin: 0; font-size: 13px; color: var(--muted); }
.categories { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
.categories li { font-size: 12px; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--line); color: var(--muted); }
.categories b { color: var(--text, inherit); }
.open { margin-top: auto; text-align: center; padding: 9px 12px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--line)); color: var(--accent); font-size: 14px; font-weight: 700; text-decoration: none; }
.open:hover { background: var(--accent); color: var(--accent-ink); }
</style>
