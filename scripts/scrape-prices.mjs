import { readFile, writeFile } from 'node:fs/promises'
import { pickOffer } from './lib/match.mjs'
import { STORES } from './lib/stores.mjs'
import { createProgress } from './lib/progress.mjs'
import { argList, mergeOffers, pickStores } from './lib/select.mjs'

const DATA_DIR = new URL('../src/data/', import.meta.url)
const OFFERS_PATH = new URL('offers.json', DATA_DIR)
const PREVIOUS_PATH = new URL('offers-previous.json', DATA_DIR)
const SHOULD_WRITE = process.argv.includes('--write') || process.env.npm_config_write === 'true'
const REQUEST_GAP_MS = 300

const sleep = ms => new Promise(done => setTimeout(done, ms))
const readJson = async url => JSON.parse(await readFile(url, 'utf8'))
const errorText = error => (error instanceof Error ? error.message : String(error))

async function scrapeStore(store, terms, references, progress) {
  const offers = {}
  const errors = []
  const ids = Object.keys(terms)
  for (const [index, id] of ids.entries()) {
    const rule = terms[id]
    try {
      const offer = pickOffer(await store.products(rule.q), rule, references[id])
      if (offer) offers[id] = { store: store.id, ...offer }
    } catch (error) {
      errors.push(`${id}: ${errorText(error)}`)
    }
    progress.update(store.id, { done: index + 1, matched: Object.keys(offers).length, errors: errors.length })
    if (!store.usesCatalog) await sleep(REQUEST_GAP_MS)
  }
  const failed = errors.length === ids.length
  progress.update(store.id, { finishedAt: Date.now(), failed })
  return { store, offers, errors, failed }
}

function printErrors(results) {
  results.filter(r => r.errors.length > 0).forEach(({ store, errors }) => {
    console.log(`${store.name}: ${errors.length} errors, first ones:`)
    errors.slice(0, 3).forEach(e => console.log(`  ${e}`))
  })
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

  const chosen = pickStores(STORES, argList(process.argv, process.env, 'stores'), argList(process.argv, process.env, 'skip'))
  if (chosen.length < STORES.length) console.log(`Updating ${chosen.map(s => s.name).join(', ')}; other stores keep their current prices.`)
  const progress = createProgress(chosen, Object.keys(terms).length)
  const results = await Promise.all(chosen.map(store => scrapeStore(store, terms, references, progress)))
  progress.stop()
  printErrors(results)
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
