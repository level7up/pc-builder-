<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import type { PartBase } from '../domain/types'
import type { Locale } from '../i18n/messages'
import { formatEgp } from '../format'
import { matchesQuery } from '../search'

export interface PickerGroup {
  label?: string
  parts: readonly PartBase[]
}

const props = defineProps<{
  id: string
  groups: readonly PickerGroup[]
  selected?: string
  locale: Locale
  placeholder: string
  searchLabel: string
  emptyLabel: string
}>()

const emit = defineEmits<{ change: [id: string] }>()

const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const search = ref<HTMLInputElement | null>(null)
const list = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const query = ref('')
const active = ref(0)

const listId = computed(() => `${props.id}-list`)
const optionId = (index: number) => `${props.id}-option-${index}`
const chosen = computed(() => props.groups.flatMap(g => g.parts).find(p => p.id === props.selected))

const visibleGroups = computed(() => {
  const groups = props.groups
    .map(group => ({ label: group.label, parts: group.parts.filter(p => matchesQuery(p.name, query.value)) }))
    .filter(group => group.parts.length > 0)
  return groups.map((group, index) => ({ ...group, start: groups.slice(0, index).reduce((sum, g) => sum + g.parts.length, 0) }))
})
const visible = computed(() => visibleGroups.value.flatMap(g => g.parts))

watch(query, () => { active.value = 0 })

function scrollToActive() {
  const option = list.value?.querySelector<HTMLElement>('.option.active')
  option?.scrollIntoView?.({ block: 'nearest' })
}

function onOutside(event: Event) {
  if (!root.value?.contains(event.target as Node)) close(false)
}

async function open() {
  query.value = ''
  isOpen.value = true
  active.value = Math.max(0, visible.value.findIndex(p => p.id === props.selected))
  document.addEventListener('pointerdown', onOutside)
  await nextTick()
  search.value?.focus()
  scrollToActive()
}

function close(returnFocus: boolean) {
  isOpen.value = false
  document.removeEventListener('pointerdown', onOutside)
  if (returnFocus) trigger.value?.focus()
}

const toggle = () => (isOpen.value ? close(false) : open())

function choose(part: PartBase) {
  emit('change', part.id)
  close(true)
}

function move(step: number) {
  const count = visible.value.length
  if (count === 0) return
  active.value = (active.value + step + count) % count
  nextTick(scrollToActive)
}

function onSearchKey(event: KeyboardEvent) {
  const actions: Record<string, () => void> = {
    ArrowDown: () => move(1),
    ArrowUp: () => move(-1),
    Enter: () => {
      const part = visible.value[active.value]
      if (part) choose(part)
    },
    Escape: () => close(true)
  }
  if (event.key === 'Tab') return close(false)
  const action = actions[event.key]
  if (!action) return
  event.preventDefault()
  action()
}

function onTriggerKey(event: KeyboardEvent) {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
  event.preventDefault()
  open()
}

onUnmounted(() => document.removeEventListener('pointerdown', onOutside))
</script>

<template>
  <div ref="root" class="picker" :class="{ open: isOpen }">
    <button
      :id="id"
      ref="trigger"
      type="button"
      class="trigger"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      :aria-controls="isOpen ? listId : undefined"
      @click="toggle"
      @keydown="onTriggerKey"
    >
      <template v-if="chosen">
        <span class="name">{{ chosen.name }}</span>
        <span class="price">{{ formatEgp(chosen.listing.priceEgp, locale) }}</span>
      </template>
      <span v-else class="placeholder">{{ placeholder }}</span>
      <span class="caret" aria-hidden="true">▾</span>
    </button>
    <div v-if="isOpen" class="panel">
      <input
        ref="search"
        v-model="query"
        type="search"
        class="search"
        role="combobox"
        autocomplete="off"
        spellcheck="false"
        aria-autocomplete="list"
        aria-expanded="true"
        :aria-label="searchLabel"
        :placeholder="searchLabel"
        :aria-controls="listId"
        :aria-activedescendant="visible.length ? optionId(active) : undefined"
        @keydown="onSearchKey"
      />
      <ul :id="listId" ref="list" role="listbox" :aria-label="searchLabel">
        <template v-for="group in visibleGroups" :key="group.label ?? ''">
          <li v-if="group.label" class="group" role="presentation">{{ group.label }}</li>
          <li
            v-for="(part, i) in group.parts"
            :id="optionId(group.start + i)"
            :key="part.id"
            role="option"
            class="option"
            :class="{ active: group.start + i === active, chosen: part.id === selected }"
            :aria-selected="part.id === selected"
            @mousedown.prevent
            @mousemove="active = group.start + i"
            @click="choose(part)"
          >
            <span class="name">{{ part.name }}</span>
            <span class="price">{{ formatEgp(part.listing.priceEgp, locale) }}</span>
          </li>
        </template>
        <li v-if="visible.length === 0" class="empty" role="presentation">{{ emptyLabel }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.picker { position: relative; }
.trigger { display: flex; align-items: center; gap: 10px; inline-size: 100%; padding: 8px 10px; border-radius: 10px; border: 1px solid var(--line); background: var(--panel2); color: inherit; font: inherit; text-align: start; cursor: pointer; }
.trigger:hover, .open .trigger { border-color: var(--accent); }
.trigger .name { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.placeholder { flex: 1 1 auto; color: var(--muted); }
.caret { color: var(--muted); font-size: 12px; transition: transform 0.15s; }
.open .caret { transform: rotate(180deg); }
.panel { position: absolute; z-index: 30; inset-inline: 0; inset-block-start: calc(100% + 4px); padding: 8px; border-radius: 12px; border: 1px solid var(--line); background: var(--panel); box-shadow: 0 12px 32px rgb(0 0 0 / 0.18); }
.search { inline-size: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--line); background: var(--panel2); color: inherit; font: inherit; }
.search:focus { outline: 2px solid var(--accent); outline-offset: -1px; }
ul { list-style: none; margin: 6px 0 0; padding: 0; max-block-size: min(340px, 50vh); overflow-y: auto; overscroll-behavior: contain; }
.group { position: sticky; inset-block-start: 0; padding: 6px 8px 4px; font-size: 12px; font-weight: 700; color: var(--muted); background: var(--panel); }
.option { display: flex; align-items: baseline; gap: 10px; padding: 6px 8px; border-radius: 8px; cursor: pointer; }
.option.active { background: color-mix(in srgb, var(--accent) 14%, var(--panel)); }
.option.chosen .name { font-weight: 700; color: var(--accent); }
.name { flex: 1 1 auto; min-width: 0; direction: ltr; unicode-bidi: plaintext; text-align: start; }
.price { flex: 0 0 auto; font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
:global([dir='rtl'] .picker .name) { text-align: right; }
.empty { padding: 10px 8px; color: var(--muted); text-align: center; }
</style>
