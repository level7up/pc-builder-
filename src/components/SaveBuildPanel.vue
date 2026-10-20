<script setup lang="ts">
import { computed, ref } from 'vue'
import { cleanName, isSameBuild } from '../domain/savedBuilds'
import type { BuildIds } from '../domain/types'
import type { Messages } from '../i18n/messages'
import { BUILDS_HASH } from '../useRoute'
import { useSavedBuilds } from '../useSavedBuilds'

const props = defineProps<{ t: Messages; ids: BuildIds; storeId: string | undefined }>()

const saved = useSavedBuilds()
const name = ref('')
const isNaming = ref(false)

const hasParts = computed(() => Object.keys(props.ids).length > 0)
const active = saved.active
const isChanged = computed(() => !!active.value && !isSameBuild(active.value, props.ids, props.storeId))
const showForm = computed(() => !active.value || isNaming.value)
const content = () => ({ ids: props.ids, storeId: props.storeId })

function save() {
  if (!hasParts.value) return
  saved.save(cleanName(name.value, props.t.builds.defaultName(saved.builds.value.length + 1)), content())
  name.value = ''
  isNaming.value = false
}

function update() {
  if (active.value) saved.update(active.value.id, content())
}
</script>

<template>
  <div class="save-build">
    <template v-if="active">
      <p class="status">
        <span>💾 {{ t.builds.savedAs(active.name) }}</span>
        <span v-if="isChanged" class="changed">{{ t.builds.changed }}</span>
      </p>
      <div v-if="!isNaming" class="row">
        <button v-if="isChanged" type="button" class="update" @click="update">{{ t.builds.update }}</button>
        <button type="button" class="save-new" :disabled="!hasParts" @click="isNaming = true">{{ t.builds.saveNew }}</button>
      </div>
    </template>
    <form v-if="showForm" class="row" @submit.prevent="save">
      <input v-model="name" type="text" :maxlength="40" :placeholder="t.builds.namePlaceholder" :aria-label="t.builds.namePlaceholder" />
      <button type="submit" class="save" :disabled="!hasParts">{{ t.builds.save }}</button>
      <button v-if="active" type="button" class="cancel" @click="isNaming = false">{{ t.builds.cancel }}</button>
    </form>
    <a class="all" :href="BUILDS_HASH">{{ t.builds.viewAll }} ›</a>
  </div>
</template>

<style scoped>
.save-build { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--line); }
.status { margin: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; font-size: 14px; font-weight: 700; }
.changed { font-size: 12px; font-weight: 700; padding: 1px 8px; border-radius: 999px; color: var(--warn); border: 1px solid color-mix(in srgb, var(--warn) 45%, var(--line)); }
.row { display: flex; flex-wrap: wrap; gap: 6px; }
input { flex: 1 1 140px; min-width: 0; padding: 7px 10px; border-radius: 10px; border: 1px solid var(--line); background: var(--panel2); color: inherit; font: inherit; font-size: 14px; }
input:focus { outline: 2px solid var(--accent); outline-offset: -1px; }
button { border-radius: 999px; padding: 7px 14px; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; border: 1px solid var(--line); background: var(--panel); color: inherit; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
.save, .update { border-color: var(--accent); background: var(--accent); color: var(--accent-ink); }
.save-new:hover:not(:disabled), .cancel:hover { border-color: var(--accent); color: var(--accent); }
.all { align-self: flex-start; font-size: 13px; font-weight: 700; color: var(--accent); text-decoration: none; }
.all:hover { text-decoration: underline; }
</style>
