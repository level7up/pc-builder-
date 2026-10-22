import type { Issue } from '../domain/types'
import { ar } from './ar'
import { en } from './en'
import type { Locale, Messages } from './types'

export type { Locale, Messages } from './types'

export const BRAND = 'levelxup'

export const MESSAGES: Record<Locale, Messages> = { ar, en }

export function issueText(messages: Messages, issue: Issue): string {
  const render = messages.issues[issue.code]
  if (!render) return issue.code
  return render(issue.params ?? {}, c => messages.categories[c])
}
