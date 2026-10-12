<script setup lang="ts">
import type { Issue } from '../domain/types'
import { issueText, type Messages } from '../i18n/messages'

defineProps<{ issues: Issue[]; t: Messages }>()

const ICON: Record<Issue['severity'], string> = { error: '⛔', warning: '⚠️', info: 'ℹ️' }
</script>

<template>
  <div class="card">
    <h2>{{ t.issuesTitle }}</h2>
    <p v-if="issues.length === 0" class="ok">{{ t.allGood }}</p>
    <ul v-else>
      <li v-for="(issue, i) in issues" :key="issue.code + i" :class="issue.severity">
        <span aria-hidden="true">{{ ICON[issue.severity] }}</span>
        <span>{{ issueText(t, issue) }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.card { background: var(--panel); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; box-shadow: var(--shadow); }
h2 { margin: 0 0 8px; font-size: 16px; }
.ok { margin: 0; color: var(--ok); font-weight: 600; }
ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
li { display: flex; gap: 8px; font-size: 14px; padding: 8px 10px; border-radius: 10px; background: var(--panel2); }
li.error { color: var(--bad); }
li.warning { color: var(--warn); }
li.info { color: var(--muted); }
</style>
