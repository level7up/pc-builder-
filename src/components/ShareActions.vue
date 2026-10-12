<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import { whatsappUrl } from '../export'
import type { Messages } from '../i18n/messages'

const props = defineProps<{ link: string; text: string; t: Messages }>()
const emit = defineEmits<{ reset: [] }>()

type CopyKind = 'link' | 'text'

const COPIED_MS = 1800
const copied = ref<CopyKind | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined

const whatsapp = computed(() => whatsappUrl(props.text))

async function copy(kind: CopyKind, value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value)
    copied.value = kind
    clearTimeout(timer)
    timer = setTimeout(() => { copied.value = null }, COPIED_MS)
  } catch {
    window.prompt(label, value)
  }
}

const printSheet = () => window.print()

onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <div class="actions">
    <button type="button" class="btn primary" @click="copy('link', link, t.copyLink)">{{ copied === 'link' ? t.copied : t.copyLink }}</button>
    <button type="button" class="btn copy-text" @click="copy('text', text, t.exportBuild.copyText)">{{ copied === 'text' ? t.copied : t.exportBuild.copyText }}</button>
    <a class="btn whatsapp" :href="whatsapp" target="_blank" rel="noopener noreferrer">{{ t.exportBuild.whatsapp }}</a>
    <button type="button" class="btn print" @click="printSheet">{{ t.exportBuild.print }}</button>
    <button type="button" class="btn" @click="emit('reset')">{{ t.resetBuild }}</button>
  </div>
</template>

<style scoped>
.actions { display: flex; gap: 8px; flex-wrap: wrap; }
.btn { border: 1px solid var(--line); background: var(--panel2); border-radius: 10px; padding: 7px 14px; cursor: pointer; font-weight: 600; text-decoration: none; font-size: 14px; }
.btn.primary { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
.btn.whatsapp { color: var(--ok); }
</style>
