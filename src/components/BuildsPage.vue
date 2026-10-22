<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { priceMoves, type SavedBuild } from '../domain/savedBuilds'
import type { Locale, Messages } from '../i18n/messages'
import { useSavedBuilds } from '../useSavedBuilds'
import BuildCard from './BuildCard.vue'
import BuildsCompare from './BuildsCompare.vue'
import BuildStoresCompare from './BuildStoresCompare.vue'

const MAX_BUILD_COMPARE = 3
const MIN_BUILD_COMPARE = 2

defineProps<{ t: Messages; locale: Locale }>()
const emit = defineEmits<{ open: [build: SavedBuild] }>()

const saved = useSavedBuilds()
const picks = ref<string[]>([])

const movedCount = computed(() => saved.builds.value.filter(b => priceMoves(b).length > 0).length)
const storesId = ref<string>()
const storesBuild = computed(() => saved.builds.value.find(b => b.id === storesId.value))
const storesPanel = ref<{ $el: HTMLElement }>()

async function showStores(id: string) {
  storesId.value = id
  await nextTick()
  storesPanel.value?.$el.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
}

const pickedBuilds = computed(() => saved.builds.value.filter(b => picks.value.includes(b.id)))
const canPickMore = computed(() => pickedBuilds.value.length < MAX_BUILD_COMPARE)

function setPicked(id: string, isPicked: boolean) {
  picks.value = isPicked ? [...picks.value.filter(p => p !== id), id] : picks.value.filter(p => p !== id)
}
</script>

<template>
  <section class="builds-page" :aria-label="t.builds.title">
    <div class="head">
      <h2>{{ t.builds.title }}</h2>
      <span v-if="saved.builds.value.length > 1" class="hint">{{ t.builds.pickHint(MAX_BUILD_COMPARE) }}</span>
    </div>
    <div v-if="movedCount" class="price-banner" role="status">
      <span>🔔 {{ t.builds.priceAlert(movedCount) }}</span>
      <button type="button" class="accept-all" @click="saved.acceptPrices()">{{ t.builds.acceptAll }}</button>
    </div>
    <ul v-if="saved.builds.value.length" class="grid">
      <li v-for="build in saved.builds.value" :key="build.id">
        <BuildCard
          :build="build"
          :t="t"
          :locale="locale"
          :picked="picks.includes(build.id)"
          :can-pick="canPickMore"
          :is-active="saved.active.value?.id === build.id"
          @open="emit('open', build)"
          @pick="isPicked => setPicked(build.id, isPicked)"
          @stores="showStores(build.id)"
        />
      </li>
    </ul>
    <p v-else class="empty">{{ t.builds.empty }}</p>
    <BuildStoresCompare v-if="storesBuild" ref="storesPanel" :build="storesBuild" :t="t" :locale="locale" @close="storesId = undefined" />
    <BuildsCompare v-if="pickedBuilds.length >= MIN_BUILD_COMPARE" :builds="pickedBuilds" :t="t" :locale="locale" />
  </section>
</template>

<style scoped>
.builds-page { margin-top: 20px; }
.head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px 12px; margin-bottom: 14px; }
h2 { margin: 0; font-size: 20px; }
.hint { color: var(--muted); font-size: 14px; }
.price-banner { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 12px; margin-bottom: 14px; padding: 10px 14px; border-radius: var(--radius); border: 1px solid var(--warn); background: color-mix(in srgb, var(--warn) 12%, var(--panel)); font-weight: 700; }
.accept-all { border-radius: 999px; padding: 6px 14px; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; border: 1px solid var(--line); background: var(--panel); color: inherit; }
.accept-all:hover { border-color: var(--accent); color: var(--accent); }
.grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
.grid > li { display: flex; min-width: 0; }
.grid > li > * { flex: 1 1 auto; min-width: 0; }
.empty { padding: 40px 16px; text-align: center; color: var(--muted); border-radius: var(--radius); border: 1px dashed var(--line); background: var(--panel); }
@media (max-width: 560px) {
  .grid { grid-template-columns: minmax(0, 1fr); }
}
</style>
