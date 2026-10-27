<script setup lang="ts">
import { computed, ref } from 'vue'
import type { StoreListing } from '../domain/browse'
import type { Locale, Messages } from '../i18n/messages'
import { formatCount, formatEgp } from '../format'
import { partHash, storeHash } from '../useRoute'
import { wishKey } from '../domain/wishlist'
import FavoriteButton from './FavoriteButton.vue'
import CompareButton from './CompareButton.vue'

const props = defineProps<{ listing: StoreListing; t: Messages; locale: Locale }>()

const offer = computed(() => props.listing.offer)
const brokenImage = ref(false)
const image = computed(() => (brokenImage.value ? undefined : offer.value.image ?? props.listing.part.listing.image))
</script>

<template>
  <article class="listing-card" :class="{ gone: !offer.inStock }">
    <a class="image" :href="offer.url" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">
      <img v-if="image" :src="image" alt="" loading="lazy" referrerpolicy="no-referrer" width="160" height="160" @error="brokenImage = true" />
      <span v-else class="placeholder">{{ offer.store }}</span>
    </a>
    <div class="top">
      <a class="store" :href="storeHash(listing.storeId)">{{ offer.store }}</a>
      <span class="actions">
        <CompareButton :id="listing.part.id" :t="t" />
        <FavoriteButton :wish-key="wishKey(listing.part.id, listing.storeId)" :t="t" />
      </span>
    </div>
    <a class="title" :href="offer.url" target="_blank" rel="noopener" :title="offer.title">{{ offer.title }}</a>
    <a class="part" :href="partHash(listing.part.id)">
      <span class="category">{{ t.categories[listing.category] }}</span>
      <span class="part-name">{{ listing.part.name }}</span>
    </a>
    <div class="foot">
      <strong class="price">{{ formatEgp(offer.priceEgp, locale) }}</strong>
      <span v-if="!offer.inStock" class="sold">{{ t.offers.outOfStock }}</span>
      <span v-else-if="offer.quantity !== undefined" class="qty">{{ t.offers.quantity(formatCount(offer.quantity, locale)) }}</span>
    </div>
    <a class="buy" :href="offer.url" target="_blank" rel="noopener">{{ t.browse.openAtStore }} ↗</a>
  </article>
</template>

<style scoped>
.listing-card { display: flex; flex-direction: column; gap: 10px; min-width: 0; padding: 16px; border-radius: var(--radius); border: 1px solid var(--line); background: var(--panel); box-shadow: var(--shadow); transition: border-color 0.15s, transform 0.15s; }
.listing-card:hover { border-color: var(--accent); transform: translateY(-2px); }
.image { display: grid; place-items: center; aspect-ratio: 1 / 1; border-radius: 12px; overflow: hidden; background: #fff; border: 1px solid var(--line); }
.image img { inline-size: 100%; block-size: 100%; object-fit: contain; padding: 8px; box-sizing: border-box; }
.placeholder { color: #8a8f98; font-weight: 700; font-size: 14px; }
.top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.actions { display: flex; gap: 6px; flex: 0 0 auto; }
.store { text-decoration: none; font-size: 13px; font-weight: 800; padding: 2px 10px; border-radius: 999px; color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, var(--panel)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.store:hover { background: var(--accent); color: var(--accent-ink); }
.title { font-weight: 700; font-size: 16px; color: inherit; text-decoration: none; line-height: 1.4; direction: ltr; unicode-bidi: plaintext; text-align: start; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.title:hover { color: var(--accent); }
.part { display: flex; align-items: baseline; gap: 6px; min-width: 0; font-size: 13px; color: var(--muted); text-decoration: none; }
.part:hover { color: var(--accent); }
.category { flex: 0 0 auto; font-weight: 700; }
.part-name { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; direction: ltr; text-align: start; }
:global([dir='rtl'] .listing-card .part-name) { text-align: right; }
:global([dir='rtl'] .listing-card .title) { text-align: right; }
.foot { margin-top: auto; display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 8px; }
.price { font-size: 22px; font-weight: 800; font-variant-numeric: tabular-nums; }
.sold { font-size: 11px; font-weight: 700; padding: 1px 8px; border-radius: 999px; color: var(--bad); border: 1px solid color-mix(in srgb, var(--bad) 45%, var(--line)); }
.buy { text-align: center; padding: 9px 12px; border-radius: 999px; border: 1px solid color-mix(in srgb, var(--accent) 45%, var(--line)); color: var(--accent); font-size: 14px; font-weight: 700; text-decoration: none; }
.buy:hover { background: var(--accent); color: var(--accent-ink); }
.qty { font-size: 12px; font-weight: 700; color: var(--muted); font-variant-numeric: tabular-nums; }
.gone .price { color: var(--muted); text-decoration: line-through; }
.gone .image { opacity: 0.6; }
</style>
