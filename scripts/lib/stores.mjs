const USER_AGENT = 'Mozilla/5.0'
const REQUEST_TIMEOUT_MS = 30_000
const SHOPIFY_PAGE_SIZE = 250
const SHOPIFY_MAX_PAGES = 100
const WOO_PAGE_SIZE = 30
const UNAVAILABLE = /out of stock|coming soon|pre-?order|sold out/i

const ENTITIES = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' }

export function decodeEntities(text) {
  return String(text)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (whole, name) => ENTITIES[name.toLowerCase()] ?? whole)
}

export const parseEgp = text => Math.round(Number(String(text).replace(/[^0-9.]/g, '')))

async function get(url, kind) {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: kind === 'json' ? 'application/json' : 'text/html' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  })
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`)
  return kind === 'json' ? response.json() : response.text()
}

export function fromShopifyProducts(products, storeUrl) {
  return products.flatMap(product => product.variants.map(variant => ({
    title: variant.title && variant.title !== 'Default Title' ? `${product.title} ${variant.title}` : product.title,
    priceEgp: Math.round(Number(variant.price)),
    inStock: variant.available === true,
    url: `${storeUrl}/products/${encodeURIComponent(product.handle)}${product.variants.length > 1 ? `?variant=${variant.id}` : ''}`
  })))
}

export function fromWooProducts(items) {
  return items.map(item => ({
    title: decodeEntities(item.name),
    priceEgp: Math.round(Number(item.prices.price) / 10 ** item.prices.currency_minor_unit),
    inStock: item.is_in_stock === true,
    url: item.permalink
  }))
}

const withoutSearchParams = url => {
  const parsed = new URL(url)
  parsed.searchParams.delete('search')
  parsed.searchParams.delete('limit')
  return parsed.toString()
}

export function fromOpenCartHtml(html) {
  const flat = html.replace(/\s+/g, ' ')
  return flat.split('data-product-id=').slice(1).flatMap(raw => {
    const card = raw.split('class="buttons-wrapper"')[0]
    const name = card.match(/<div class="name"><a href="([^"]*)">([^<]*)<\/a>/)
    const price = card.match(/<span class="price-(?:new|normal)">([^<]*)<\/span>/)
    if (!name || !price) return []
    const labels = [...card.matchAll(/product-label[^"]*"><strong>([^<]*)</g)].map(m => m[1])
    const stock = card.match(/Stock:<\/span> <span>([^<]*)/)?.[1] ?? ''
    return [{
      title: decodeEntities(name[2]).trim(),
      priceEgp: parseEgp(price[1]),
      inStock: !UNAVAILABLE.test([...labels, stock].join(' ')),
      url: withoutSearchParams(decodeEntities(name[1]))
    }]
  })
}

export function readJsonValue(text, start) {
  const open = text[start]
  const close = open === '[' ? ']' : '}'
  let depth = 0
  let inString = false
  for (let i = start; i < text.length; i += 1) {
    const ch = text[i]
    if (inString) {
      if (ch === '\\') i += 1
      else if (ch === '"') inString = false
    } else if (ch === '"') inString = true
    else if (ch === open) depth += 1
    else if (ch === close && --depth === 0) return JSON.parse(text.slice(start, i + 1))
  }
  throw new Error('Unterminated JSON value')
}

export function fromSigmaHtml(html, siteUrl) {
  const payload = [...html.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)]
    .map(m => JSON.parse(`"${m[1]}"`))
    .join('')
  const marker = '"products":['
  const at = payload.indexOf(marker)
  if (at < 0) return []
  return readJsonValue(payload, at + marker.length - 1).map(product => ({
    title: product.name,
    priceEgp: Math.round(Number(product.price?.current)),
    inStock: product.is_stock === true,
    url: `${siteUrl}/en/item?id=${encodeURIComponent(product.slug)}`
  }))
}

function shopifyStore(id, name, url) {
  let catalog
  const loadCatalog = async () => {
    const pages = []
    for (let page = 1; page <= SHOPIFY_MAX_PAGES; page += 1) {
      const { products } = await get(`${url}/products.json?limit=${SHOPIFY_PAGE_SIZE}&page=${page}`, 'json')
      if (products.length === 0) break
      pages.push(fromShopifyProducts(products, url))
    }
    return pages.flat()
  }
  return { id, name, url, products: () => (catalog ??= loadCatalog()) }
}

const wooStore = (id, name, url, apiBase = url) => ({
  id,
  name,
  url,
  products: async query => fromWooProducts(await get(`${apiBase}/wp-json/wc/store/v1/products?search=${encodeURIComponent(query)}&per_page=${WOO_PAGE_SIZE}`, 'json'))
})

const openCartStore = (id, name, url) => ({
  id,
  name,
  url,
  products: async query => fromOpenCartHtml(await get(`${url}/index.php?route=product/search&search=${encodeURIComponent(query)}&limit=100`, 'html'))
})

const sigmaStore = (id, name, url) => ({
  id,
  name,
  url,
  products: async query => fromSigmaHtml(await get(`${url}/en/search?q=${encodeURIComponent(query)}`, 'html'), url)
})

export const STORES = [
  shopifyStore('compumarts', 'Compumarts', 'https://www.compumarts.com'),
  shopifyStore('kimo', 'Kimo Store', 'https://kimostore.net'),
  shopifyStore('ahw', 'AHW Store', 'https://ahw.store'),
  sigmaStore('sigma', 'Sigma Computer', 'https://www.sigma-computer.com'),
  openCartStore('elbadr', 'El Badr Group', 'https://elbadrgroupeg.store'),
  openCartStore('maximum', 'Maximum Hardware', 'https://maximumhardware.store'),
  wooStore('alfrensia', 'Alfrensia', 'https://alfrensia.com', 'https://alfrensia.com/en'),
  wooStore('uptodate', 'Uptodate Store', 'https://uptodate.store')
]
