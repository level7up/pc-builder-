<script setup lang="ts" generic="T">
import { computed, ref, watch } from 'vue'
import { CARDS_PER_PAGE } from '../domain/browse'
import type { Messages } from '../i18n/messages'

const props = defineProps<{ items: readonly T[]; itemKey: (item: T) => string; t: Messages }>()

defineSlots<{ default: (props: { item: T }) => unknown }>()

const limit = ref(CARDS_PER_PAGE)
const shown = computed(() => props.items.slice(0, limit.value))

watch(() => props.items, () => { limit.value = CARDS_PER_PAGE })
</script>

<template>
  <div>
    <ul class="grid">
      <li v-for="item in shown" :key="itemKey(item)">
        <slot :item="item" />
      </li>
    </ul>
    <button v-if="items.length > shown.length" type="button" class="more" @click="limit += CARDS_PER_PAGE">{{ t.browse.more }}</button>
  </div>
</template>

<style scoped>
.grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.grid > li { display: flex; min-width: 0; }
.grid > li > :slotted(*) { flex: 1 1 auto; }
.more { display: block; margin: 18px auto 0; border: 1px solid var(--accent); background: var(--panel); color: var(--accent); border-radius: 999px; padding: 8px 24px; font: inherit; font-weight: 700; cursor: pointer; }
.more:hover { background: var(--accent); color: var(--accent-ink); }
@media (max-width: 560px) {
  .grid { grid-template-columns: minmax(0, 1fr); gap: 12px; }
}
</style>
