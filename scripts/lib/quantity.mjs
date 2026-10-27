const errorText = error => (error instanceof Error ? error.message : String(error))

export const QUANTITY_CONCURRENCY = 2
export const BUSY_TRIES = 5
export const BUSY_WAIT_MS = 2_000

const sleep = ms => new Promise(done => setTimeout(done, ms))
const isBusy = error => /HTTP 429\b/.test(errorText(error))

export const retryWhenBusy = (request, { tries = BUSY_TRIES, wait = sleep } = {}) => async (...args) => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await request(...args)
    } catch (error) {
      if (!isBusy(error) || attempt >= tries) throw error
      await wait(BUSY_WAIT_MS * 2 ** (attempt - 1))
    }
  }
}

const SELLS_PAST_ZERO = /"inventory_policy":"continue"|data-inventory-policy="continue"/

export function readInventoryQuantity(html) {
  if (SELLS_PAST_ZERO.test(html)) return undefined
  const found = html.match(/"inventory_quantity":(-?\d+)/) ?? html.match(/data-inventory-quantity="(-?\d+)"/)
  return found ? Math.max(0, Number(found[1])) : undefined
}

export const mainSectionId = html => html.match(/id="shopify-section-(template--[\w-]+__main)"/)?.[1]

export function withSection(url, sectionId) {
  const parsed = new URL(url)
  parsed.searchParams.set('section_id', sectionId)
  return parsed.toString()
}

export async function addQuantities(offers, quantityOf, { concurrency = QUANTITY_CONCURRENCY, onCount = () => {} } = {}) {
  const queue = Object.entries(offers).filter(([, offer]) => offer.inStock)
  const counts = new Map()
  const errors = []
  let next = 0
  let done = 0
  const worker = async () => {
    while (next < queue.length) {
      const [id, offer] = queue[next++]
      try {
        const quantity = await quantityOf(offer.url)
        if (quantity !== undefined) counts.set(id, quantity)
      } catch (error) {
        errors.push(`${id}: ${errorText(error)}`)
      }
      done += 1
      onCount(done, queue.length)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker))
  const result = Object.fromEntries(Object.entries(offers).map(([id, offer]) => [id, counts.has(id) ? { ...offer, quantity: counts.get(id) } : offer]))
  return { offers: result, errors }
}
