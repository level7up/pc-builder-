import type { OfferSource } from './parts'
import previous from './offers-previous.json'

interface PreviousOffer {
  store: string
  priceEgp: number
  inStock: boolean
}

interface PreviousSource {
  checkedOn: string
  stores: OfferSource['stores']
  items: Record<string, PreviousOffer[]>
}

const toOfferSource = (source: PreviousSource): OfferSource => ({
  ...source,
  items: Object.fromEntries(Object.entries(source.items).map(([id, offers]) => [id, offers.map(offer => ({ ...offer, url: '', title: '' }))]))
})

export const PREVIOUS_OFFER_SOURCE: OfferSource = toOfferSource(previous)
