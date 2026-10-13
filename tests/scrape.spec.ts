import { describe, expect, it } from 'vitest'
import { isSanePrice, matchesRule, normalize, pickOffer } from '../scripts/lib/match.mjs'
import { decodeEntities, fromOpenCartHtml, fromShopifyProducts, fromSigmaHtml, fromWooProducts, parseEgp, readJsonValue } from '../scripts/lib/stores.mjs'
import { listingFor, type ListingSource, type OfferSource } from '../src/data/parts'

const product = (title: string, priceEgp: number, inStock = true) => ({ title, priceEgp, inStock, url: `https://shop.test/${priceEgp}` })

describe('title matching', () => {
  it('splits letters from digits so spellings compare equal', () => {
    expect(normalize('Ryzen5 7500F')).toBe(normalize('RYZEN 5 7500 f'))
    expect(normalize('i5-12400F')).toBe(' i 5 12400 f ')
  })

  it('matches whole terms only', () => {
    const rule = { all: ['rtx 5060'], none: ['ti'] }
    expect(matchesRule('ZOTAC GeForce RTX 5060 Twin Edge 8GB', rule)).toBe(true)
    expect(matchesRule('MSI GeForce RTX 5060 Ti Ventus 8GB', rule)).toBe(false)
    expect(matchesRule('ASUS RTX 5060 OC Edition', rule)).toBe(true)
    expect(matchesRule('RTX 50600', rule)).toBe(false)
  })

  it('accepts any spelling in a term group', () => {
    const rule = { all: ['rtx 3050', ['6gb', '6g']] }
    expect(matchesRule('MSI RTX 3050 VENTUS 2X 6G OC', rule)).toBe(true)
    expect(matchesRule('Zotac RTX 3050 SOLO 6GB', rule)).toBe(true)
    expect(matchesRule('Zotac RTX 3050 ECO 8GB', rule)).toBe(false)
    expect(matchesRule('Zotac RTX 3050 16GB', rule)).toBe(false)
  })

  it('rejects bundles, builds and laptops', () => {
    const rule = { all: ['7500f'] }
    expect(matchesRule('MSI B840M + AMD Ryzen 5 7500F Bundle', rule)).toBe(false)
    expect(matchesRule('Ryzen 5 7500F Gaming PC Build', rule)).toBe(false)
    expect(matchesRule('Lenovo Legion Pro 7 Ultra 9 275HX RTX 5090 16 inch', { all: ['rtx 5090'] })).toBe(false)
    expect(matchesRule('AMD Ryzen 5 7500F Tray', rule)).toBe(true)
  })
})

describe('offer choice', () => {
  const rule = { all: ['7500f'] }

  it('keeps prices near the reference price', () => {
    expect(isSanePrice(7000, 7500)).toBe(true)
    expect(isSanePrice(50000, 7500)).toBe(false)
    expect(isSanePrice(1000, 7500)).toBe(false)
  })

  it('takes the cheapest in-stock match', () => {
    const offer = pickOffer([product('Ryzen 5 7500F', 6500, false), product('Ryzen 5 7500F MPK', 7200), product('Ryzen 5 7500F Box', 7400)], rule, 7500)
    expect(offer).toMatchObject({ priceEgp: 7200, inStock: true })
  })

  it('falls back to an out-of-stock match and ignores odd prices', () => {
    expect(pickOffer([product('Ryzen 5 7500F', 7100, false), product('Ryzen 5 7500F (October #16)', 50000)], rule, 7500)).toMatchObject({ priceEgp: 7100, inStock: false })
    expect(pickOffer([product('Ryzen 5 7600', 8000)], rule, 7500)).toBeUndefined()
  })
})

describe('store parsers', () => {
  it('reads Shopify variants with prices in pounds', () => {
    const items = fromShopifyProducts([
      { title: 'Kingston NV3', handle: 'kingston-nv3', images: [{ src: 'https://cdn.shopify.com/nv3.png?v=1' }], variants: [{ id: 1, title: '1TB', price: '7070.00', available: true, featured_image: { src: 'https://cdn.shopify.com/nv3-1tb.png' } }, { id: 2, title: '2TB', price: '11000.00', available: false }] },
      { title: 'Ryzen 5 5500', handle: 'r5', variants: [{ id: 3, title: 'Default Title', price: '4429.00', available: true }] }
    ], 'https://shop.test')
    expect(items).toEqual([
      { title: 'Kingston NV3 1TB', priceEgp: 7070, inStock: true, url: 'https://shop.test/products/kingston-nv3?variant=1', image: 'https://cdn.shopify.com/nv3-1tb.png?width=300' },
      { title: 'Kingston NV3 2TB', priceEgp: 11000, inStock: false, url: 'https://shop.test/products/kingston-nv3?variant=2', image: 'https://cdn.shopify.com/nv3.png?v=1&width=300' },
      { title: 'Ryzen 5 5500', priceEgp: 4429, inStock: true, url: 'https://shop.test/products/r5' }
    ])
  })

  it('reads WooCommerce prices in minor units', () => {
    const items = fromWooProducts([
      { name: 'AMD Ryzen&#8482; 5 7500F &amp; Fan', permalink: 'https://w.test/p', is_in_stock: true, prices: { price: '690000', currency_minor_unit: 2 }, images: [{ src: 'https://w.test/big.png', thumbnail: 'https://w.test/small.png' }] },
      { name: 'No image', permalink: 'https://w.test/q', is_in_stock: true, prices: { price: '100000', currency_minor_unit: 2 }, images: [{ src: 'http://w.test/plain.png' }] }
    ])
    expect(items).toEqual([
      { title: 'AMD Ryzen™ 5 7500F & Fan', priceEgp: 6900, inStock: true, url: 'https://w.test/p', image: 'https://w.test/small.png' },
      { title: 'No image', priceEgp: 1000, inStock: true, url: 'https://w.test/q' }
    ])
  })

  it('reads OpenCart cards with stock labels', () => {
    const card = (id: number, name: string, price: string, label = '') => `<div
class="product-layout" data-product-id="${id}"><div class="image"><img src="https://oc.test/img-${id}.png" srcset="x 2x" alt="${name}"/></div><div class="product-labels">${label}</div><div class="caption"><div class="name"><a href="https://oc.test/item-${id}?search=x&amp;limit=100">${name}</a></div><div class="price"><span class="price-new">${price}</span> <span class="price-old">99,999 EGP</span></div></div><div class="buttons-wrapper">`
    const html = card(1, 'AMD Ryzen 5 7500F', '6,950 EGP') + card(2, 'RTX 5060', '22,499.00 EGP', '<span class="product-label product-label-30"><strong>Out Of Stock</strong></span>')
    expect(fromOpenCartHtml(html)).toEqual([
      { title: 'AMD Ryzen 5 7500F', priceEgp: 6950, inStock: true, url: 'https://oc.test/item-1', image: 'https://oc.test/img-1.png' },
      { title: 'RTX 5060', priceEgp: 22499, inStock: false, url: 'https://oc.test/item-2', image: 'https://oc.test/img-2.png' }
    ])
  })

  it('reads products from the Sigma page payload', () => {
    const data = JSON.stringify({ products: [{ slug: 'r5-7500f', name: 'AMD Ryzen 5 7500F', price: { base: 7500, current: 7299 }, is_stock: true, thumbnail: { url: 'https://api.sigma.test/media/1' } }], after: '[ignored]' })
    const pushed = JSON.stringify(`44:${data}`)
    const html = `<script>self.__next_f.push([1,${pushed}])</script>`
    expect(fromSigmaHtml(html, 'https://sigma.test')).toEqual([
      { title: 'AMD Ryzen 5 7500F', priceEgp: 7299, inStock: true, url: 'https://sigma.test/en/item?id=r5-7500f', image: 'https://api.sigma.test/media/1' }
    ])
    expect(fromSigmaHtml('<html></html>', 'https://sigma.test')).toEqual([])
  })

  it('reads one JSON value out of surrounding text', () => {
    expect(readJsonValue('x:[1,"]",[2]],tail', 2)).toEqual([1, ']', [2]])
    expect(() => readJsonValue('[1,2', 0)).toThrow()
  })

  it('parses pound amounts and entities', () => {
    expect(parseEgp('50,000.00 EGP')).toBe(50000)
    expect(decodeEntities('A &#x2013; B &quot;C&quot; &unknown;')).toBe('A – B "C" &unknown;')
  })
})

describe('listing with several stores', () => {
  const source: ListingSource = { checkedOn: '2026-10-12', store: 'Compumarts', storeUrl: 'https://cm.test', items: { x: { priceEgp: 1000, handle: 'x', variant: '', title: 'X' } } }
  const offers = (items: OfferSource['items']): OfferSource => ({ checkedOn: '2026-10-12', stores: [{ id: 'compumarts', name: 'Compumarts', url: '' }, { id: 'kimo', name: 'Kimo Store', url: '' }], items })

  it('uses the cheapest in-stock store and keeps the reference store', () => {
    const listing = listingFor('x', source, offers({ x: [{ store: 'kimo', priceEgp: 800, inStock: false, url: 'k1', title: '' }, { store: 'kimo', priceEgp: 900, inStock: true, url: 'k2', title: '' }] }))
    expect(listing).toMatchObject({ priceEgp: 900, store: 'Kimo Store', url: 'k2' })
    expect(listing.offers.map(o => o.store)).toEqual(['Kimo Store', 'Kimo Store', 'Compumarts'])
  })

  it('shows the image of the chosen offer, or any offer that has one', () => {
    const withImages = listingFor('x', source, offers({ x: [
      { store: 'kimo', priceEgp: 900, inStock: true, url: 'k', title: '', image: 'https://img.test/k.png' },
      { store: 'compumarts', priceEgp: 950, inStock: true, url: 'c', title: '', image: 'https://img.test/c.png' }
    ] }))
    expect(withImages.image).toBe('https://img.test/k.png')
    const fallback = listingFor('x', source, offers({ x: [
      { store: 'kimo', priceEgp: 900, inStock: true, url: 'k', title: '' },
      { store: 'compumarts', priceEgp: 950, inStock: true, url: 'c', title: '', image: 'https://img.test/c.png' }
    ] }))
    expect(fallback.image).toBe('https://img.test/c.png')
    expect(listingFor('x', source, offers({ x: [{ store: 'kimo', priceEgp: 900, inStock: true, url: 'k', title: '', image: 'javascript:alert(1)' }] })).image).toBeUndefined()
  })

  it('prefers the scraped reference store price over the stored one', () => {
    const listing = listingFor('x', source, offers({ x: [{ store: 'compumarts', priceEgp: 1100, inStock: true, url: 'c', title: '' }] }))
    expect(listing.offers).toHaveLength(1)
    expect(listing.priceEgp).toBe(1100)
  })

  it('falls back to the stored price when nothing was scraped', () => {
    expect(listingFor('x', source, offers({}))).toMatchObject({ priceEgp: 1000, store: 'Compumarts', url: 'https://cm.test/products/x' })
  })
})
