<script setup lang="ts">
import { computed } from 'vue'
import { resolveWish, wishTotal, type WishItem } from '../domain/wishlist'
import type { Locale, Messages } from '../i18n/messages'
import { formatEgp } from '../format'
import { PARTS_HASH } from '../useRoute'
import { useWishlist } from '../useWishlist'
import PartsGrid from './PartsGrid.vue'
import PartCard from './PartCard.vue'
import ListingCard from './ListingCard.vue'

const props = defineProps<{ t: Messages; locale: Locale }>()

const wishlist = useWishlist()
const items = computed(() => wishlist.keys.value.map(resolveWish).filter((item): item is WishItem => item !== undefined))
const totalText = computed(() => props.t.wishlist.total(formatEgp(wishTotal(items.value), props.locale)))
</script>

<template>
  <section class="wishlist-page" :aria-label="t.wishlist.title">
    <div class="head">
      <h2>{{ t.wishlist.title }}</h2>
      <span v-if="items.length" class="total">{{ totalText }}</span>
    </div>
    <PartsGrid v-if="items.length" v-slot="{ item }" :items="items" :item-key="wish => wish.key" :t="t">
      <ListingCard v-if="item.kind === 'listing'" :listing="item.listing" :t="t" :locale="locale" />
      <PartCard v-else-if="item.kind === 'gone'" :found="item.found" :wish-key="item.key" :note="t.wishlist.gone(item.store.name)" :t="t" :locale="locale" />
      <PartCard v-else :found="item.found" :t="t" :locale="locale" />
    </PartsGrid>
    <div v-else class="empty">
      <p>{{ t.wishlist.empty }}</p>
      <a :href="PARTS_HASH">{{ t.wishlist.browse }}</a>
    </div>
  </section>
</template>

<style scoped>
.wishlist-page { margin-top: 20px; }
.head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 12px; margin-bottom: 14px; }
h2 { margin: 0; font-size: 20px; }
.total { color: var(--muted); font-size: 14px; }
.empty { padding: 40px 16px; text-align: center; border-radius: var(--radius); border: 1px dashed var(--line); background: var(--panel); }
.empty p { margin: 0 0 12px; color: var(--muted); }
.empty a { font-weight: 700; color: var(--accent); }
</style>
