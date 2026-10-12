import { CATEGORIES } from './domain/build'
import { PRICES_CHECKED_ON } from './data/parts'
import { BRAND, type Locale, type Messages } from './i18n/messages'
import { formatDate, formatEgp } from './format'
import type { Build } from './domain/types'

const WHATSAPP_SHARE = 'https://wa.me/?text='

const partLines = (build: Build, t: Messages, locale: Locale): string[] =>
  CATEGORIES.flatMap(category => {
    const part = build[category]
    return part ? [`${t.categories[category]}: ${part.name} — ${formatEgp(part.listing.priceEgp, locale)} (${part.listing.store})`] : []
  })

export function buildText(build: Build, total: number, link: string, t: Messages, locale: Locale): string {
  return [
    `${BRAND} · ${t.title}`,
    t.exportBuild.pricesOn(formatDate(PRICES_CHECKED_ON, locale)),
    '',
    ...partLines(build, t, locale),
    '',
    `${t.total}: ${formatEgp(total, locale)}`,
    link
  ].join('\n')
}

export const whatsappUrl = (text: string): string => `${WHATSAPP_SHARE}${encodeURIComponent(text)}`
