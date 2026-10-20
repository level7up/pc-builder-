import type { CellValue } from './domain/compare'
import type { Locale, Messages } from './i18n/messages'
import { formatEgp } from './format'

const GB_PER_TB = 1000

export function formatCell(cell: CellValue, t: Messages, locale: Locale): string {
  if (cell.kind === 'text') return cell.value
  if (cell.kind === 'flag') return cell.value ? `✓ ${t.compare.yes}` : `✗ ${t.compare.no}`
  const plain = (n: number) => new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', { maximumFractionDigits: 1 }).format(n)
  const units = t.compare.units
  switch (cell.unit) {
    case 'egp': return formatEgp(cell.value, locale)
    case 'percent': return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', { style: 'percent' }).format(cell.value / 100)
    case 'gb': return cell.value >= GB_PER_TB ? units.tb(plain(cell.value / GB_PER_TB)) : units.gb(plain(cell.value))
    case 'watts': return t.specs.watts(cell.value)
    case 'mm': return units.mm(plain(cell.value))
    case 'mts': return units.mts(plain(cell.value))
    case 'stores': return units.stores(plain(cell.value))
    case 'pcie': return units.pcie(plain(cell.value))
    case 'fps': return units.fps(plain(cell.value))
    default: return plain(cell.value)
  }
}
