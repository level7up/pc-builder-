const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

export const toWesternDigits = (text: string): string =>
  [...text].map(ch => (ARABIC_DIGITS.includes(ch) ? String(ARABIC_DIGITS.indexOf(ch)) : ch)).join('')

const compact = (text: string): string => toWesternDigits(text).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')

export function matchesQuery(name: string, query: string): boolean {
  const haystack = compact(name)
  return query.trim().split(/\s+/).map(compact).every(word => haystack.includes(word))
}
