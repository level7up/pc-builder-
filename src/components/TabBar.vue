<script setup lang="ts">
import { computed } from 'vue'
import type { Messages } from '../i18n/messages'
import { BUILDS_HASH, HOME_HASH, PARTS_HASH, PRICES_HASH, WISHLIST_HASH, type Route } from '../useRoute'

const props = defineProps<{ t: Messages; route: Route; wishCount: number; buildCount: number }>()

const ICONS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  parts: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  wishlist: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  builds: 'M12 3 3 7.5l9 4.5 9-4.5zM3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5',
  prices: 'M4 19V5M4 19h16M8 15l4-4 3 3 5-6'
} as const

const tabs = computed(() => [
  { id: 'home', href: HOME_HASH, label: props.t.home, isCurrent: props.route.name === 'builder', count: 0 },
  { id: 'parts', href: PARTS_HASH, label: props.t.nav.parts, isCurrent: props.route.name === 'parts', count: 0 },
  { id: 'wishlist', href: WISHLIST_HASH, label: props.t.nav.wishlist, isCurrent: props.route.name === 'wishlist', count: props.wishCount },
  { id: 'builds', href: BUILDS_HASH, label: props.t.builds.nav, isCurrent: props.route.name === 'builds' || props.route.name === 'build', count: props.buildCount },
  { id: 'prices', href: PRICES_HASH, label: props.t.nav.prices, isCurrent: props.route.name === 'prices', count: 0 }
] as const)
</script>

<template>
  <nav class="tabbar" :aria-label="t.nav.label">
    <a v-for="tab in tabs" :key="tab.id" :href="tab.href" :aria-current="tab.isCurrent ? 'page' : undefined">
      <span class="icon">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path :d="ICONS[tab.id]" /></svg>
        <span v-if="tab.count" class="count">{{ tab.count }}</span>
      </span>
      <span class="label">{{ tab.label }}</span>
    </a>
  </nav>
</template>

<style scoped>
.tabbar { display: none; }
@media (max-width: 640px) {
  .tabbar { position: fixed; z-index: 60; inset-inline: 0; inset-block-end: 0; display: grid; grid-template-columns: repeat(5, 1fr); block-size: var(--tabbar-h); padding-block-end: env(safe-area-inset-bottom); background: color-mix(in srgb, var(--panel) 94%, transparent); backdrop-filter: blur(8px); border-block-start: 1px solid var(--line); }
  a { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; min-width: 0; color: var(--muted); text-decoration: none; font-size: 11px; font-weight: 600; }
  a[aria-current] { color: var(--accent); }
  .icon { position: relative; display: block; line-height: 0; }
  svg { fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
  a[aria-current] svg { stroke-width: 2.2; }
  .label { max-inline-size: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-inline: 2px; }
  .count { position: absolute; inset-block-start: -5px; inset-inline-end: -10px; min-inline-size: 16px; padding: 0 4px; border-radius: 999px; background: var(--bad); color: #fff; font-size: 10px; font-weight: 800; line-height: 16px; text-align: center; }
}
</style>
