<script setup lang="ts">
import { computed } from 'vue'
import { findPart, type FoundPart } from '../domain/lookup'
import type { Messages } from '../i18n/messages'
import { COMPARE_HASH } from '../useRoute'
import { useCompare } from '../useCompare'

const props = defineProps<{ t: Messages }>()

const compare = useCompare()
const items = computed(() => compare.ids.value.map(findPart).filter((found): found is FoundPart => found !== undefined))
const label = computed(() => (items.value.length ? props.t.compare.bar(items.value.length, props.t.categories[items.value[0].category]) : ''))
</script>

<template>
  <aside v-if="items.length" class="compare-bar" :aria-label="t.compare.title">
    <div class="inner">
      <b class="label">⚖ {{ label }}</b>
      <ul class="chips">
        <li v-for="found in items" :key="found.part.id" class="chip">
          <span class="name">{{ found.part.name }}</span>
          <button type="button" class="x" :aria-label="t.compare.remove" :title="t.compare.remove" @click="compare.toggle(found.part.id)">×</button>
        </li>
      </ul>
      <div class="actions">
        <a v-if="items.length > 1" class="go" :href="COMPARE_HASH">{{ t.compare.go }}</a>
        <span v-else class="need-more">{{ t.compare.needMore }}</span>
        <button type="button" class="clear" @click="compare.clear()">{{ t.compare.clear }}</button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.compare-bar { position: fixed; z-index: 50; inset-inline: 0; inset-block-end: var(--tabbar-h); padding: 10px 16px; background: color-mix(in srgb, var(--panel) 92%, transparent); backdrop-filter: blur(8px); border-block-start: 1px solid var(--line); box-shadow: 0 -8px 24px rgb(0 0 0 / 0.08); }
.inner { max-width: 1180px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; }
.label { white-space: nowrap; }
.chips { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; flex: 1 1 auto; min-width: 0; }
.chip { display: inline-flex; align-items: center; gap: 4px; max-inline-size: 240px; padding: 3px 4px 3px 10px; border-radius: 999px; background: var(--panel2); border: 1px solid var(--line); font-size: 13px; }
.name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; direction: ltr; unicode-bidi: plaintext; }
.x { border: 0; background: none; color: var(--muted); cursor: pointer; font-size: 16px; line-height: 1; padding: 0 4px; }
.x:hover { color: var(--bad); }
.actions { display: flex; align-items: center; gap: 10px; margin-inline-start: auto; }
.go { padding: 8px 18px; border-radius: 999px; background: var(--accent); color: var(--accent-ink); font-weight: 700; text-decoration: none; white-space: nowrap; }
.need-more { font-size: 13px; color: var(--muted); }
.clear { border: 0; background: none; color: var(--muted); cursor: pointer; font: inherit; font-size: 13px; }
.clear:hover { color: var(--bad); }
@media (max-width: 640px) {
  .compare-bar { padding: 8px 12px; }
  .inner { flex-wrap: nowrap; }
  .chips { display: none; }
  .label { font-size: 14px; }
  .need-more { font-size: 12px; }
}
</style>
