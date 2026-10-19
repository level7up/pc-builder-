<script setup lang="ts">
import { computed, ref } from 'vue'
import { inStockCount } from '../domain/browse'
import type { FoundPart } from '../domain/lookup'
import type { Locale, Messages } from '../i18n/messages'
import { describePart } from '../specs'
import { formatEgp } from '../format'
import { partHash } from '../useRoute'
import FavoriteButton from './FavoriteButton.vue'
import CompareButton from './CompareButton.vue'

const MAX_SPECS = 3

const props = defineProps<{ found: FoundPart; t: Messages; locale: Locale; wishKey?: string; note?: string }>()

const part = computed(() => props.found.part)
const href = computed(() => partHash(part.value.id))
const specs = computed(() => describePart(props.found.category, part.value, props.t).slice(0, MAX_SPECS))
const brokenImage = ref(false)
const image = computed(() => (brokenImage.value ? undefined : part.value.listing.image))
</script>

<template>
  <article class="part-card" :class="{ gone: !part.listing.inStock }">
    <a class="image" :href="href" tabindex="-1" aria-hidden="true">
      <img v-if="image" :src="image" alt="" loading="lazy" referrerpolicy="no-referrer" width="160" height="160" @error="brokenImage = true" />
      <span v-else class="placeholder">{{ t.categories[found.category] }}</span>
    </a>
    <div class="top">
      <span class="category">{{ t.categories[found.category] }}</span>
      <span class="actions">
        <CompareButton :id="part.id" :t="t" />
        <FavoriteButton :wish-key="wishKey ?? part.id" :t="t" />
      </span>
    </div>
    <a class="name" :href="href">{{ part.name }}</a>
    <p v-if="note" class="note" role="status">{{ note }}</p>
    <div class="specs">
      <span v-for="s in specs" :key="s" class="chip">{{ s }}</span>
    </div>
    <div class="foot">
      <strong class="price">{{ formatEgp(part.listing.priceEgp, locale) }}</strong>
      <span v-if="!part.listing.inStock" class="sold">{{ t.soldOut.badge }}</span>
      <small v-else class="stores">{{ t.browse.stores(inStockCount(part)) }}</small>
    </div>
  </article>
</template>

<style scoped>
.part-card { display: flex; flex-direction: column; gap: 10px; min-width: 0; padding: 16px; border-radius: var(--radius); border: 1px solid var(--line); background: var(--panel); box-shadow: var(--shadow); transition: border-color 0.15s, transform 0.15s; }
.part-card:hover { border-color: var(--accent); transform: translateY(-2px); }
.image { display: grid; place-items: center; aspect-ratio: 1 / 1; border-radius: 12px; overflow: hidden; background: #fff; border: 1px solid var(--line); }
.image img { inline-size: 100%; block-size: 100%; object-fit: contain; padding: 8px; box-sizing: border-box; }
.placeholder { color: #8a8f98; font-weight: 700; font-size: 14px; }
.top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.actions { display: flex; gap: 6px; }
.category { font-size: 13px; font-weight: 700; color: var(--accent); }
.name { font-size: 16px; font-weight: 700; color: inherit; text-decoration: none; line-height: 1.4; direction: ltr; unicode-bidi: plaintext; text-align: start; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.name:hover { color: var(--accent); }
:global([dir='rtl'] .part-card .name) { text-align: right; }
.note { margin: 0; font-size: 12px; font-weight: 600; color: var(--warn); }
.specs { display: flex; flex-wrap: wrap; gap: 4px; }
.chip { font-size: 12px; background: var(--panel2); border: 1px solid var(--line); border-radius: 999px; padding: 1px 8px; color: var(--muted); unicode-bidi: plaintext; }
.foot { margin-top: auto; display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 8px; }
.price { font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums; }
.stores { font-size: 13px; color: var(--ok); }
.sold { font-size: 11px; font-weight: 700; padding: 1px 8px; border-radius: 999px; color: var(--bad); border: 1px solid color-mix(in srgb, var(--bad) 45%, var(--line)); }
.gone .price { color: var(--muted); text-decoration: line-through; }
.gone .image { opacity: 0.6; }
</style>
