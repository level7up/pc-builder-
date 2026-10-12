import { readFile, writeFile } from 'node:fs/promises'

const LISTINGS_PATH = new URL('../src/data/listings.json', import.meta.url)
const SHOULD_WRITE = process.argv.includes('--write')
const CENTS_PER_POUND = 100
const REQUEST_GAP_MS = 250

const sleep = ms => new Promise(done => setTimeout(done, ms))

async function fetchVariant(storeUrl, item) {
  const response = await fetch(`${storeUrl}/products/${encodeURIComponent(item.handle)}.js`, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!response.ok) return { error: `HTTP ${response.status}` }
  const product = await response.json()
  const variant = product.variants.find(v => v.title === item.variant) ?? product.variants[0]
  if (!variant) return { error: 'no variants' }
  return { priceEgp: Math.round(variant.price / CENTS_PER_POUND), available: variant.available }
}

async function main() {
  const listings = JSON.parse(await readFile(LISTINGS_PATH, 'utf8'))
  const rows = []
  for (const [id, item] of Object.entries(listings.items)) {
    try {
      rows.push({ id, old: item.priceEgp, ...(await fetchVariant(listings.storeUrl, item)) })
    } catch (error) {
      rows.push({ id, old: item.priceEgp, error: error instanceof Error ? error.message : String(error) })
    }
    await sleep(REQUEST_GAP_MS)
  }

  rows.forEach(r => {
    const status = r.error ? `ERROR ${r.error}` : `${r.priceEgp}${r.available ? '' : '  (out of stock)'}${r.priceEgp !== r.old ? `  was ${r.old}` : ''}`
    console.log(`${r.id.padEnd(18)} ${status}`)
  })

  const changed = rows.filter(r => !r.error && r.priceEgp !== r.old)
  const problems = rows.filter(r => r.error || !r.available)
  console.log(`\n${changed.length} price changes, ${problems.length} listings out of stock or failing.`)

  if (!SHOULD_WRITE) {
    console.log('Run with --write to save the new prices.')
    return
  }
  const items = Object.fromEntries(Object.entries(listings.items).map(([id, item]) => {
    const row = rows.find(r => r.id === id)
    return [id, row && !row.error ? { ...item, priceEgp: row.priceEgp } : item]
  }))
  const today = new Date().toISOString().slice(0, 10)
  await writeFile(LISTINGS_PATH, JSON.stringify({ ...listings, checkedOn: today, items }, null, 2) + '\n')
  console.log(`Saved to src/data/listings.json (checkedOn ${today}).`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
