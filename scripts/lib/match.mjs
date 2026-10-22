export const MIN_PRICE_RATIO = 0.6
export const MAX_PRICE_RATIO = 1.8

const EXCLUDED_PHRASES = ['bundle', 'combo', 'build', 'laptop', 'notebook', 'gaming pc', 'desktop pc', 'prebuilt', 'used', 'open box', 'hx', 'hz', 'inch', 'ryzen ai', 'oled', 'windows', 'win11']
const BUNDLE_MARK = /[+]/

const normalized = new Map()

export function normalize(text) {
  const key = String(text)
  if (!normalized.has(key)) normalized.set(key, clean(key))
  return normalized.get(key)
}

function clean(text) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
  return ` ${words} `
}

const hasPhrase = (text, phrase) => text.includes(normalize(phrase))

export function matchesRule(title, rule) {
  if (BUNDLE_MARK.test(title)) return false
  const text = normalize(title)
  const allowed = rule.allow ?? []
  if (EXCLUDED_PHRASES.some(phrase => !allowed.includes(phrase) && hasPhrase(text, phrase))) return false
  if ((rule.none ?? []).some(phrase => hasPhrase(text, phrase))) return false
  return rule.all.every(term => [term].flat().some(phrase => hasPhrase(text, phrase)))
}

export const isSanePrice = (priceEgp, referenceEgp) =>
  priceEgp >= referenceEgp * MIN_PRICE_RATIO && priceEgp <= referenceEgp * MAX_PRICE_RATIO

export function pickOffer(products, rule, referenceEgp) {
  const matching = products
    .filter(p => p.priceEgp > 0 && matchesRule(p.title, rule) && isSanePrice(p.priceEgp, referenceEgp))
    .sort((a, b) => a.priceEgp - b.priceEgp)
  return matching.find(p => p.inStock) ?? matching[0]
}
