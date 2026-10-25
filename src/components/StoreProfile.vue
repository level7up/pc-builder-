<script setup lang="ts">
import { computed, ref } from 'vue'
import { browseListings, DEFAULT_FILTER, SORT_ORDERS, type PartFilter } from '../domain/browse'
import { storeProfile } from '../domain/storeProfile'
import type { Category } from '../domain/types'
import type { Locale, Messages } from '../i18n/messages'
import { formatCount } from '../format'
import { STORES_HASH } from '../useRoute'
import PartsGrid from './PartsGrid.vue'
import ListingCard from './ListingCard.vue'

const props = defineProps<{ storeId: string; t: Messages; locale: Locale }>()

const profile = computed(() => storeProfile(props.storeId))
const filter = ref<PartFilter>({ ...DEFAULT_FILTER, storeId: props.storeId })
const listings = computed(() => browseListings(filter.value))
const countText = computed(() => props.t.browse.listingCount(formatCount(listings.value.length, props.locale)))

const update = <K extends keyof PartFilter>(key: K, value: PartFilter[K]) => { filter.value = { ...filter.value, [key]: value } }
const pickCategory = (category: Category | undefined) => update('category', category)
</script>

<template>
  <section v-if="profile" class="store-profile" :aria-label="profile.store.name" :data-store="profile.store.id">
    <a class="back" :href="STORES_HASH">{{ t.shops.back }}</a>
    <div class="head">
      <div>
        <h2>{{ profile.store.name }}</h2>
        <p class="stats">
          <span>{{ t.shops.products(formatCount(profile.products, locale)) }}</span>
          <span class="ok">{{ t.shops.inStock(formatCount(profile.inStock, locale)) }}</span>
          <span class="muted">{{ t.shops.cheapest(formatCount(profile.cheapest, locale)) }}</span>
        </p>
      </div>
      <a v-if="profile.url" class="visit" :href="profile.url" target="_blank" rel="noopener">{{ t.shops.visit }} ↗</a>
    </div>

    <div class="chips" role="group" :aria-label="t.browse.allCategories">
      <button type="button" class="chip" :class="{ on: !filter.category }" :aria-pressed="!filter.category" @click="pickCategory(undefined)">
        {{ t.browse.allCategories }} <b>{{ formatCount(profile.products, locale) }}</b>
      </button>
      <button
        v-for="c in profile.categories"
        :key="c.category"
        type="button"
        class="chip"
        :class="{ on: filter.category === c.category }"
        :data-category="c.category"
        :aria-pressed="filter.category === c.category"
        @click="pickCategory(c.category)"
      >{{ t.categories[c.category] }} <b>{{ formatCount(c.products, locale) }}</b></button>
    </div>

    <div class="filters">
      <input
        type="search"
        class="search"
        autocomplete="off"
        spellcheck="false"
        :value="filter.query"
        :placeholder="t.browse.search"
        :aria-label="t.browse.search"
        @input="update('query', ($event.target as HTMLInputElement).value)"
      />
      <select class="sort" :value="filter.sort" :aria-label="t.browse.sorts.priceAsc" @change="update('sort', ($event.target as HTMLSelectElement).value as PartFilter['sort'])">
        <option v-for="s in SORT_ORDERS" :key="s" :value="s">{{ t.browse.sorts[s] }}</option>
      </select>
      <label class="check">
        <input type="checkbox" class="in-stock" :checked="filter.inStockOnly" @change="update('inStockOnly', ($event.target as HTMLInputElement).checked)" />
        {{ t.browse.inStockOnly }}
      </label>
      <span class="result-count" role="status">{{ countText }}</span>
    </div>

    <PartsGrid v-if="listings.length" v-slot="{ item }" :items="listings" :item-key="listing => listing.key" :t="t">
      <ListingCard :listing="item" :t="t" :locale="locale" />
    </PartsGrid>
    <p v-else class="empty">{{ t.browse.empty }}</p>
  </section>
</template>

<style scoped>
.store-profile { margin-top: 20px; }
.back { display: inline-block; margin-bottom: 10px; color: var(--muted); text-decoration: none; font-size: 14px; }
.back:hover { color: var(--accent); }
.head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 12px; }
h2 { margin: 0; font-size: 24px; font-weight: 800; }
.stats { display: flex; flex-wrap: wrap; gap: 4px 14px; margin: 6px 0 0; font-weight: 700; font-variant-numeric: tabular-nums; }
.ok { color: var(--ok); }
.muted { color: var(--muted); font-weight: 600; }
.visit { padding: 8px 16px; border-radius: 999px; border: 1px solid var(--accent); color: var(--accent); font-weight: 700; font-size: 14px; text-decoration: none; white-space: nowrap; }
.visit:hover { background: var(--accent); color: var(--accent-ink); }
.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.chip { border: 1px solid var(--line); background: var(--panel); color: inherit; border-radius: 999px; padding: 6px 14px; font: inherit; font-size: 14px; cursor: pointer; }
.chip b { margin-inline-start: 4px; color: var(--muted); font-variant-numeric: tabular-nums; }
.chip:hover { border-color: var(--accent); }
.chip.on { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
.chip.on b { color: inherit; }
.filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 12px 0 16px; padding: 12px; border-radius: var(--radius); border: 1px solid var(--line); background: var(--panel); box-shadow: var(--shadow); }
.search, select { padding: 7px 10px; border-radius: 10px; border: 1px solid var(--line); background: var(--panel2); color: inherit; font: inherit; font-size: 14px; }
.search { flex: 1 1 240px; min-width: 0; }
.search:focus, select:focus { outline: 2px solid var(--accent); outline-offset: -1px; }
.check { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer; white-space: nowrap; }
.check input { accent-color: var(--accent); }
.result-count { margin-inline-start: auto; color: var(--muted); font-size: 14px; font-variant-numeric: tabular-nums; }
.empty { padding: 32px; text-align: center; color: var(--muted); }
</style>
