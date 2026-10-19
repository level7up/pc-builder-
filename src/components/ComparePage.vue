<script setup lang="ts">
import { computed } from 'vue'
import { compareParts } from '../domain/compare'
import { findPart, storePrices, type FoundPart } from '../domain/lookup'
import { STORES } from '../domain/store'
import type { BuildIds, Category } from '../domain/types'
import type { Locale, Messages } from '../i18n/messages'
import { formatCell } from '../compareFormat'
import { formatEgp } from '../format'
import { PARTS_HASH, partHash } from '../useRoute'
import { useCompare } from '../useCompare'

const props = defineProps<{ t: Messages; locale: Locale; buildIds: BuildIds }>()
const emit = defineEmits<{ add: [category: Category, id: string] }>()

const compare = useCompare()
const items = computed(() => compare.ids.value.map(findPart).filter((found): found is FoundPart => found !== undefined))
const category = computed(() => items.value[0]?.category)
const rows = computed(() => (category.value ? compareParts(category.value, items.value.map(f => f.part)) : []))
const priceRows = computed(() =>
  STORES.map(store => ({ store, offers: items.value.map(found => storePrices(found.part).find(row => row.store.id === store.id)?.offer) }))
)
const isInBuild = (found: FoundPart) => props.buildIds[found.category] === found.part.id
</script>

<template>
  <section class="compare-page" :aria-label="t.compare.title">
    <h2>{{ t.compare.title }}<template v-if="category"> · {{ t.categories[category] }}</template></h2>

    <div v-if="items.length < 2" class="need-more">
      <p>{{ t.compare.needMore }}</p>
      <a :href="PARTS_HASH">{{ t.compare.browse }}</a>
    </div>

    <template v-else>
      <div class="scroll">
        <table class="specs">
          <thead>
            <tr>
              <td class="corner"></td>
              <th v-for="found in items" :key="found.part.id" scope="col" class="part">
                <button type="button" class="remove" :aria-label="t.compare.remove" :title="t.compare.remove" @click="compare.toggle(found.part.id)">×</button>
                <a class="image" :href="partHash(found.part.id)" tabindex="-1" aria-hidden="true">
                  <img v-if="found.part.listing.image" :src="found.part.listing.image" alt="" loading="lazy" referrerpolicy="no-referrer" width="120" height="120" />
                </a>
                <a class="name" :href="partHash(found.part.id)">{{ found.part.name }}</a>
                <span v-if="isInBuild(found)" class="in-build">{{ t.compare.inBuild }}</span>
                <button v-else type="button" class="add" @click="emit('add', found.category, found.part.id)">{{ t.profile.add }}</button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id" :data-row="row.id">
              <th scope="row">{{ t.compare.rows[row.id] }}</th>
              <td v-for="(cell, i) in row.cells" :key="items[i].part.id" :class="{ best: cell.best, sold: row.id === 'price' && !items[i].part.listing.inStock }">
                {{ formatCell(cell.value, t, locale) }}
                <span v-if="row.id === 'price' && !items[i].part.listing.inStock" class="tag">{{ t.soldOut.badge }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>{{ t.compare.storesTitle }}</h3>
      <div class="scroll">
        <table class="prices">
          <thead>
            <tr>
              <td class="corner"></td>
              <th v-for="found in items" :key="found.part.id" scope="col" class="price-head">{{ found.part.name }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in priceRows" :key="row.store.id">
              <th scope="row">{{ row.store.name }}</th>
              <td v-for="(offer, i) in row.offers" :key="items[i].part.id" :class="{ gone: offer && !offer.inStock }">
                <a v-if="offer" :href="offer.url" target="_blank" rel="noopener">{{ formatEgp(offer.priceEgp, locale) }}</a>
                <span v-else class="muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>

<style scoped>
.compare-page { margin-top: 20px; background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; box-shadow: var(--shadow); }
h2 { margin: 0 0 14px; font-size: 20px; }
h3 { margin: 22px 0 8px; font-size: 16px; }
.need-more { padding: 32px 16px; text-align: center; color: var(--muted); }
.need-more a { font-weight: 700; color: var(--accent); }
.scroll { overflow-x: auto; overscroll-behavior-x: contain; }
table { inline-size: 100%; border-collapse: collapse; font-size: 14px; }
th, td { padding: 9px 10px; border-block-end: 1px solid var(--line); text-align: start; vertical-align: top; }
tbody th { position: sticky; inset-inline-start: 0; z-index: 1; background: var(--panel); color: var(--muted); font-size: 13px; font-weight: 700; white-space: nowrap; }
td { min-inline-size: 150px; font-variant-numeric: tabular-nums; }
.corner { background: var(--panel); }
.part { position: relative; min-inline-size: 170px; font-weight: 400; vertical-align: bottom; }
.part .image { display: grid; place-items: center; inline-size: 96px; block-size: 96px; margin-block-end: 8px; border-radius: 10px; background: #fff; border: 1px solid var(--line); overflow: hidden; }
.part img { inline-size: 100%; block-size: 100%; object-fit: contain; }
.part .name { display: block; font-weight: 700; color: inherit; text-decoration: none; direction: ltr; unicode-bidi: plaintext; text-align: start; margin-block-end: 8px; }
:global([dir='rtl'] .compare-page .part .name) { text-align: right; }
.part .name:hover { color: var(--accent); }
.remove { position: absolute; inset-block-start: 6px; inset-inline-end: 6px; inline-size: 26px; block-size: 26px; border-radius: 999px; border: 1px solid var(--line); background: var(--panel); color: var(--muted); cursor: pointer; line-height: 1; }
.remove:hover { color: var(--bad); border-color: var(--bad); }
.add { border: 1px solid var(--accent); background: var(--panel); color: var(--accent); border-radius: 999px; padding: 5px 12px; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.add:hover { background: var(--accent); color: var(--accent-ink); }
.in-build { font-size: 13px; font-weight: 700; color: var(--ok); }
td.best { font-weight: 800; color: var(--ok); background: color-mix(in srgb, var(--ok) 10%, var(--panel)); }
td.best::after { content: ' ★'; font-size: 11px; }
td.sold { color: var(--muted); text-decoration: line-through; }
.tag { margin-inline-start: 6px; font-size: 11px; font-weight: 700; color: var(--bad); text-decoration: none; display: inline-block; }
.price-head { font-size: 12px; color: var(--muted); direction: ltr; unicode-bidi: plaintext; }
:global([dir='rtl'] .compare-page .price-head) { text-align: right; }
.prices a { color: inherit; font-weight: 700; text-decoration: none; }
.prices a:hover { color: var(--accent); }
.prices td.gone a { color: var(--muted); text-decoration: line-through; font-weight: 400; }
.muted { color: var(--muted); }
</style>
