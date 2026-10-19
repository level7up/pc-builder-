import { readFile, writeFile } from 'node:fs/promises'
import { pickOffer } from './lib/match.mjs'
import { STORES } from './lib/stores.mjs'

const DATA_DIR = new URL('../src/data/', import.meta.url)
const OFFERS_PATH = new URL('offers.json', DATA_DIR)
const PREVIOUS_PATH = new URL('offers-previous.json', DATA_DIR)
const SHOULD_WRITE = process.argv.includes('--write')
const REQUEST_GAP_MS = 300

const sleep = ms => new Promise(done => setTimeout(done, ms))
const readJson = async url => JSON.parse(await readFile(url, 'utf8'))
const errorText = error => (error instanceof Error ? error.message : String(error))

async function scrapeStore(store, terms, references) {
  const offers = {}
  const errors = []
  for (const [id, rule] of Object.entries(terms)) {
    try {
      const offer = pickOffer(await store.products(rule.q), rule, references[id])
      if (offer) offers[id] = { store: store.id, ...offer }
    } catch (error) {
      errors.push(`${id}: ${errorText(error)}`)
    }
    await sleep(REQUEST_GAP_MS)
  }
  const failed = errors.length === Object.keys(terms).length
  console.log(`${store.name.padEnd(18)} ${Object.keys(offers).length} matched, ${errors.length} errors${failed ? '  (store failed, keeping old prices)' : ''}`)
  errors.slice(0, 3).forEach(e => console.log(`  ${e}`))
  return { store, offers, failed }
}

function mergeOffers(ids, results, previous) {
  return Object.fromEntries(ids.map(id => {
    const fresh = results.filter(r => !r.failed).flatMap(r => (r.offers[id] ? [r.offers[id]] : []))
    const failedStores = new Set(results.filter(r => r.failed).map(r => r.store.id))
    const kept = (previous.items?.[id] ?? []).filter(o => failedStores.has(o.store))
    return [id, [...fresh, ...kept].sort((a, b) => a.priceEgp - b.priceEgp)]
  }))
}

const pricesOnly = source => ({
  checkedOn: source.checkedOn,
  stores: source.stores,
  items: Object.fromEntries(Object.entries(source.items ?? {}).map(([id, offers]) => [id, offers.map(({ store, priceEgp, inStock }) => ({ store, priceEgp, inStock }))]))
})

function printTable(items) {
  Object.entries(items).forEach(([id, offers]) => {
    const cells = offers.map(o => `${o.store} ${o.priceEgp}${o.inStock ? '' : '*'}`).join(' | ')
    console.log(`${id.padEnd(18)} ${cells || '-'}`)
  })
  console.log('\n* = out of stock')
}

async function main() {
  const terms = await readJson(new URL('search-terms.json', DATA_DIR))
  const listings = await readJson(new URL('listings.json', DATA_DIR))
  const previous = await readJson(OFFERS_PATH).catch(() => ({}))
  const references = Object.fromEntries(Object.entries(listings.items).map(([id, item]) => [id, item.priceEgp]))

  const missing = Object.keys(terms).filter(id => !references[id])
  if (missing.length > 0) throw new Error(`No reference price for: ${missing.join(', ')}`)

  const results = await Promise.all(STORES.map(store => scrapeStore(store, terms, references)))
  const items = mergeOffers(Object.keys(terms), results, previous)
  console.log('')
  printTable(items)

  if (!SHOULD_WRITE) {
    console.log('Run with --write to save these prices.')
    return
  }
  const today = new Date().toISOString().slice(0, 10)
  const stores = STORES.map(({ id, name, url }) => ({ id, name, url }))
  if (previous.checkedOn && previous.checkedOn !== today) {
    await writeFile(PREVIOUS_PATH, JSON.stringify(pricesOnly(previous)) + '\n')
    console.log(`Kept the ${previous.checkedOn} prices in src/data/offers-previous.json.`)
  }
  await writeFile(OFFERS_PATH, JSON.stringify({ checkedOn: today, stores, items }, null, 2) + '\n')
  console.log(`Saved to src/data/offers.json (checkedOn ${today}).`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
