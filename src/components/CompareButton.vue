<script setup lang="ts">
import { computed } from 'vue'
import { MAX_COMPARE } from '../domain/compare'
import { findPart } from '../domain/lookup'
import type { Messages } from '../i18n/messages'
import { useCompare } from '../useCompare'

const props = defineProps<{ id: string; t: Messages }>()

const compare = useCompare()
const isCompared = computed(() => compare.ids.value.includes(props.id))
const isOtherCategory = computed(() => compare.ids.value.length > 0 && findPart(compare.ids.value[0])?.category !== findPart(props.id)?.category)
const isFull = computed(() => !isCompared.value && !isOtherCategory.value && compare.ids.value.length >= MAX_COMPARE)
const hint = computed(() => {
  if (isFull.value) return props.t.compare.full(MAX_COMPARE)
  if (isOtherCategory.value) return props.t.compare.startNew
  return isCompared.value ? props.t.compare.remove : props.t.compare.add
})
</script>

<template>
  <button
    type="button"
    class="compare-toggle"
    :class="{ on: isCompared }"
    :aria-pressed="isCompared"
    :aria-label="hint"
    :disabled="isFull"
    :title="hint"
    @click.stop.prevent="compare.toggle(id)"
  >
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 3v18M7 21h10M5 7h14M12 5.5 5 7m7-1.5L19 7" />
      <path d="M5 7 2.5 13a2.5 2.5 0 0 0 5 0Z" />
      <path d="M19 7l-2.5 6a2.5 2.5 0 0 0 5 0Z" />
    </svg>
  </button>
</template>

<style scoped>
.compare-toggle { display: inline-grid; place-items: center; flex: 0 0 auto; inline-size: 34px; block-size: 34px; padding: 0; border-radius: 999px; border: 1px solid var(--line); background: var(--panel); color: var(--muted); cursor: pointer; transition: color 0.15s, border-color 0.15s, background 0.15s, transform 0.15s; }
.compare-toggle:hover:not(:disabled) { color: var(--accent); border-color: var(--accent); }
.compare-toggle.on { color: var(--accent-ink); background: var(--accent); border-color: var(--accent); }
.compare-toggle:active:not(:disabled) { transform: scale(0.9); }
.compare-toggle:disabled { opacity: 0.45; cursor: not-allowed; }
</style>
