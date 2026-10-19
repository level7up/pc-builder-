<script setup lang="ts">
import { computed } from 'vue'
import type { Messages } from '../i18n/messages'
import { useWishlist } from '../useWishlist'

const props = defineProps<{ wishKey: string; t: Messages }>()

const wishlist = useWishlist()
const isFavorite = computed(() => wishlist.keys.value.includes(props.wishKey))
const label = computed(() => (isFavorite.value ? props.t.favorite.remove : props.t.favorite.add))
</script>

<template>
  <button type="button" class="fav" :class="{ on: isFavorite }" :aria-pressed="isFavorite" :aria-label="label" :title="label" @click.stop.prevent="wishlist.toggle(wishKey)">
    <span aria-hidden="true">{{ isFavorite ? '♥' : '♡' }}</span>
  </button>
</template>

<style scoped>
.fav { display: inline-grid; place-items: center; inline-size: 34px; block-size: 34px; flex: 0 0 auto; border-radius: 999px; border: 1px solid var(--line); background: var(--panel); color: var(--muted); font-size: 18px; line-height: 1; cursor: pointer; transition: color 0.15s, border-color 0.15s, transform 0.15s; }
.fav:hover { color: var(--bad); border-color: color-mix(in srgb, var(--bad) 45%, var(--line)); }
.fav.on { color: var(--bad); border-color: color-mix(in srgb, var(--bad) 45%, var(--line)); background: color-mix(in srgb, var(--bad) 8%, var(--panel)); }
.fav:active { transform: scale(0.9); }
</style>
