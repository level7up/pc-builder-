<script setup lang="ts">
import { computed, ref } from 'vue'
import { storePrices, type FoundPart } from '../domain/lookup'
import type { Locale, Messages } from '../i18n/messages'
import { describePart } from '../specs'
import { formatEgp } from '../format'
import { HOME_HASH } from '../useRoute'
import FavoriteButton from './FavoriteButton.vue'
import { wishKey } from '../domain/wishlist'

const props = defineProps<{ found: FoundPart; t: Messages; locale: Locale; inBuild: boolean; storeName?: string }>()
const emit = defineEmits<{ add: [] }>()

const part = computed(() => props.found.part)
const specs = computed(() => describePart(props.found.category, part.value, props.t))
const rows = computed(() => storePrices(part.value))
const brokenImage = ref<string | null>(null)
const image = computed(() => (part.value.listing.image && part.value.listing.image !== brokenImage.value ? part.value.listing.image : undefined))
</script>

<template>
  <section class="part-profile" :aria-label="part.name">
    <a class="back" :href="HOME_HASH">{{ t.profile.back }}</a>

    <div class="intro">
      <a v-if="image" class="image" :href="part.listing.url" target="_blank" rel="noopener">
        <img :src="image" :alt="part.name" referrerpolicy="no-referrer" width="160" height="160" @error="brokenImage = image ?? null" />
      </a>
      <div class="info">
        <div class="category-row">
          <span class="category">{{ t.categories[found.category] }}</span>
          <FavoriteButton :wish-key="part.id" :t="t" />
        </div>
        <h2>{{ part.name }}</h2>
        <div class="specs">
          <span v-for="s in specs" :key="s" class="chip">{{ s }}</span>
        </div>
        <p v-if="part.listing.inStock" class="price">
          <strong>{{ formatEgp(part.listing.priceEgp, locale) }}</strong>
          <small>{{ t.offers.cheapestAt(part.listing.store) }}</small>
        </p>
        <p v-else class="sold-note" role="status">⛔ {{ t.soldOut.note(formatEgp(part.listing.priceEgp, locale)) }}</p>
        <span v-if="inBuild" class="in-build">{{ t.profile.inBuild }}</span>
        <button v-else type="button" class="add" @click="emit('add')">{{ t.profile.add }}</button>
      </div>
    </div>

    <h3>{{ t.profile.storesTitle }}</h3>
    <table class="stores">
      <thead>
        <tr>
          <th scope="col">{{ t.profile.store }}</th>
          <th scope="col" class="num">{{ t.profile.price }}</th>
          <th scope="col">{{ t.profile.status }}</th>
          <th scope="col"><span class="sr-only">{{ t.profile.open }}</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in rows" :key="row.store.id" :class="{ missing: !row.offer, gone: row.offer && !row.offer.inStock, mine: row.store.name === storeName }">
          <td class="store">
            <b>{{ row.store.name }}</b>
            <small v-if="row.store.name === storeName" class="tag">{{ t.profile.yourStore }}</small>
            <small v-if="row.offer" class="title">{{ row.offer.title }}</small>
          </td>
          <td class="num">
            <template v-if="row.offer">{{ formatEgp(row.offer.priceEgp, locale) }}</template>
            <template v-else>—</template>
          </td>
          <td class="status">
            <span v-if="i === 0 && row.offer?.inStock" class="best">{{ t.profile.best }}</span>
            <span v-else-if="row.offer?.inStock">{{ t.profile.inStock }}</span>
            <span v-else-if="row.offer">{{ t.offers.outOfStock }}</span>
            <span v-else>{{ t.profile.notListed }}</span>
          </td>
          <td class="link">
            <FavoriteButton v-if="row.offer" :wish-key="wishKey(part.id, row.store.id)" :t="t" />
            <a v-if="row.offer?.url" :href="row.offer.url" target="_blank" rel="noopener">{{ t.profile.open }} ↗</a>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.part-profile { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; box-shadow: var(--shadow); margin-top: 20px; }
.back { font-weight: 700; color: var(--accent); text-decoration: none; }
.back:hover { text-decoration: underline; }
.intro { display: flex; gap: 20px; align-items: flex-start; margin-top: 14px; }
.image { flex: 0 0 auto; display: block; inline-size: 160px; block-size: 160px; border-radius: 14px; overflow: hidden; background: #fff; border: 1px solid var(--line); }
.image img { display: block; inline-size: 100%; block-size: 100%; object-fit: contain; }
.info { min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
.category-row { display: flex; align-items: center; gap: 10px; }
.category { font-size: 13px; font-weight: 700; color: var(--accent); }
h2 { margin: 0; font-size: 22px; direction: ltr; unicode-bidi: plaintext; text-align: start; }
.specs { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { font-size: 12px; background: var(--panel2); border: 1px solid var(--line); border-radius: 999px; padding: 1px 10px; color: var(--muted); unicode-bidi: plaintext; }
.price { margin: 0; display: flex; flex-direction: column; }
.price strong { font-size: 26px; font-weight: 800; font-variant-numeric: tabular-nums; }
.price small { color: var(--muted); }
.sold-note { margin: 0; font-size: 14px; font-weight: 600; color: var(--bad); }
.add { border: 1px solid var(--accent); background: var(--accent); color: var(--accent-ink); border-radius: 999px; padding: 7px 18px; font: inherit; font-weight: 700; cursor: pointer; }
.add:hover { filter: brightness(1.05); }
.in-build { font-weight: 700; color: var(--ok); }
h3 { margin: 22px 0 8px; font-size: 16px; }
table { inline-size: 100%; border-collapse: collapse; font-size: 14px; }
th { text-align: start; font-size: 12px; color: var(--muted); font-weight: 700; padding: 8px; border-block-end: 1px solid var(--line); }
td { padding: 8px; border-block-end: 1px solid var(--line); vertical-align: top; }
.num { text-align: end; white-space: nowrap; font-weight: 700; font-variant-numeric: tabular-nums; }
.store { min-width: 0; }
.store b { margin-inline-end: 6px; }
.title { display: block; color: var(--muted); font-size: 12px; direction: ltr; unicode-bidi: plaintext; text-align: start; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-inline-size: 420px; }
.tag { font-size: 11px; font-weight: 700; color: var(--accent); }
.status { white-space: nowrap; color: var(--ok); }
.best { font-weight: 800; padding: 1px 8px; border-radius: 999px; background: color-mix(in srgb, var(--ok) 14%, var(--panel)); }
tr.gone .status, tr.missing .status, tr.missing .num { color: var(--muted); font-weight: 400; }
tr.gone .num { color: var(--muted); text-decoration: line-through; font-weight: 400; }
tr.mine { background: color-mix(in srgb, var(--accent) 7%, var(--panel)); }
.link { white-space: nowrap; }
.link > * { vertical-align: middle; }
.link a { margin-inline-start: 8px; }
.link a { color: var(--accent); font-weight: 700; text-decoration: none; }
.link a:hover { text-decoration: underline; }
.sr-only { position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
:global([dir='rtl'] .part-profile h2), :global([dir='rtl'] .part-profile .title) { text-align: right; }
@media (max-width: 640px) {
  .intro { flex-direction: column; }
  .image { inline-size: 120px; block-size: 120px; }
  thead { display: none; }
  tr { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 2px 12px; padding: 10px 4px; border-block-end: 1px solid var(--line); }
  td { padding: 0; border: 0; }
  td.store { grid-column: 1 / -1; }
  .title { max-inline-size: 100%; }
  .num { text-align: start; }
}
</style>
