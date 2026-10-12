import type { Case, Cooler, Cpu, Gpu, Listing, Memory, Motherboard, Offer, Psu, Storage } from '../domain/types'
import listings from './listings.json'
import scraped from './offers.json'

export interface ListingSource {
  checkedOn: string
  store: string
  storeUrl: string
  items: Record<string, { priceEgp: number; handle: string; variant: string; title: string }>
}

export interface OfferSource {
  checkedOn: string
  stores: { id: string; name: string; url: string }[]
  items: Record<string, Offer[]>
}

export const PRICE_SOURCE: ListingSource = listings
export const OFFER_SOURCE: OfferSource = scraped

export const PRICES_CHECKED_ON = OFFER_SOURCE.checkedOn || PRICE_SOURCE.checkedOn
export const STORE_COUNT = Math.max(OFFER_SOURCE.stores.length, 1)

const byPrice = (a: Offer, b: Offer): number => a.priceEgp - b.priceEgp

function referenceOffer(id: string, source: ListingSource): Offer {
  const item = source.items[id]
  if (!item) throw new Error(`No store listing for part "${id}"`)
  return { store: source.store, priceEgp: item.priceEgp, url: `${source.storeUrl}/products/${encodeURIComponent(item.handle)}`, inStock: true, title: item.title }
}

export function listingFor(id: string, source: ListingSource = PRICE_SOURCE, offerSource: OfferSource = OFFER_SOURCE): Listing {
  const reference = referenceOffer(id, source)
  const storeName = (storeId: string) => offerSource.stores.find(s => s.id === storeId)?.name ?? storeId
  const found = (offerSource.items[id] ?? []).map(offer => ({ ...offer, store: storeName(offer.store) }))
  const hasReferenceStore = found.some(offer => offer.store === reference.store)
  const offers = [...found, ...(hasReferenceStore ? [] : [reference])].sort(byPrice)
  const best = offers.find(offer => offer.inStock) ?? reference
  return { priceEgp: best.priceEgp, store: best.store, url: best.url, offers }
}

type Spec<T> = Omit<T, 'listing'>

const withListing = <T extends { id: string }>(specs: Spec<T & { listing: Listing }>[]): (T & { listing: Listing })[] =>
  specs.map(spec => ({ ...spec, listing: listingFor(spec.id) }) as T & { listing: Listing })

const DDR4: Cpu['memory'] = ['DDR4']
const DDR5: Cpu['memory'] = ['DDR5']
const DDR4_OR_5: Cpu['memory'] = ['DDR4', 'DDR5']

export const cpus: Cpu[] = withListing<Cpu>([
  { id: 'r5-5500', name: 'AMD Ryzen 5 5500', brand: 'AMD', socket: 'AM4', cores: 6, threads: 12, powerW: 88, hasIgpu: false, gamingScore: 49, memory: DDR4 },
  { id: 'r5-5600', name: 'AMD Ryzen 5 5600', brand: 'AMD', socket: 'AM4', cores: 6, threads: 12, powerW: 88, hasIgpu: false, gamingScore: 56, memory: DDR4 },
  { id: 'r7-5700x', name: 'AMD Ryzen 7 5700X', brand: 'AMD', socket: 'AM4', cores: 8, threads: 16, powerW: 88, hasIgpu: false, gamingScore: 58, memory: DDR4 },
  { id: 'r7-5800x3d', name: 'AMD Ryzen 7 5800X3D', brand: 'AMD', socket: 'AM4', cores: 8, threads: 16, powerW: 142, hasIgpu: false, gamingScore: 72, memory: DDR4 },
  { id: 'r5-8400f', name: 'AMD Ryzen 5 8400F', brand: 'AMD', socket: 'AM5', cores: 6, threads: 12, powerW: 88, hasIgpu: false, gamingScore: 60, memory: DDR5 },
  { id: 'r5-7500f', name: 'AMD Ryzen 5 7500F', brand: 'AMD', socket: 'AM5', cores: 6, threads: 12, powerW: 88, hasIgpu: false, gamingScore: 70, memory: DDR5 },
  { id: 'r5-7600', name: 'AMD Ryzen 5 7600', brand: 'AMD', socket: 'AM5', cores: 6, threads: 12, powerW: 88, hasIgpu: true, gamingScore: 72, memory: DDR5 },
  { id: 'r5-9600x', name: 'AMD Ryzen 5 9600X', brand: 'AMD', socket: 'AM5', cores: 6, threads: 12, powerW: 88, hasIgpu: true, gamingScore: 76, memory: DDR5 },
  { id: 'r7-7700x', name: 'AMD Ryzen 7 7700X', brand: 'AMD', socket: 'AM5', cores: 8, threads: 16, powerW: 142, hasIgpu: true, gamingScore: 77, memory: DDR5 },
  { id: 'r7-9700x', name: 'AMD Ryzen 7 9700X', brand: 'AMD', socket: 'AM5', cores: 8, threads: 16, powerW: 88, hasIgpu: true, gamingScore: 78, memory: DDR5 },
  { id: 'r7-7800x3d', name: 'AMD Ryzen 7 7800X3D', brand: 'AMD', socket: 'AM5', cores: 8, threads: 16, powerW: 162, hasIgpu: true, gamingScore: 89, memory: DDR5 },
  { id: 'r7-9800x3d', name: 'AMD Ryzen 7 9800X3D', brand: 'AMD', socket: 'AM5', cores: 8, threads: 16, powerW: 162, hasIgpu: true, gamingScore: 100, memory: DDR5 },
  { id: 'r7-9850x3d', name: 'AMD Ryzen 7 9850X3D', brand: 'AMD', socket: 'AM5', cores: 8, threads: 16, powerW: 162, hasIgpu: true, gamingScore: 103, memory: DDR5 },
  { id: 'r9-9950x3d', name: 'AMD Ryzen 9 9950X3D', brand: 'AMD', socket: 'AM5', cores: 16, threads: 32, powerW: 230, hasIgpu: true, gamingScore: 99, memory: DDR5 },
  { id: 'i5-12400f', name: 'Intel Core i5-12400F', brand: 'Intel', socket: 'LGA1700', cores: 6, threads: 12, powerW: 117, hasIgpu: false, gamingScore: 60, memory: DDR4_OR_5 },
  { id: 'i5-14400f', name: 'Intel Core i5-14400F', brand: 'Intel', socket: 'LGA1700', cores: 10, threads: 16, powerW: 148, hasIgpu: false, gamingScore: 64, memory: DDR4_OR_5 },
  { id: 'i7-14700f', name: 'Intel Core i7-14700F', brand: 'Intel', socket: 'LGA1700', cores: 20, threads: 28, powerW: 219, hasIgpu: false, gamingScore: 75, memory: DDR4_OR_5 },
  { id: 'i7-14700k', name: 'Intel Core i7-14700K', brand: 'Intel', socket: 'LGA1700', cores: 20, threads: 28, powerW: 253, hasIgpu: true, gamingScore: 79, memory: DDR4_OR_5 },
  { id: 'i9-14900k', name: 'Intel Core i9-14900K', brand: 'Intel', socket: 'LGA1700', cores: 24, threads: 32, powerW: 253, hasIgpu: true, gamingScore: 82, memory: DDR4_OR_5 },
  { id: 'u5-225f', name: 'Intel Core Ultra 5 225F', brand: 'Intel', socket: 'LGA1851', cores: 10, threads: 10, powerW: 121, hasIgpu: false, gamingScore: 62, memory: DDR5 },
  { id: 'u5-245k', name: 'Intel Core Ultra 5 245K', brand: 'Intel', socket: 'LGA1851', cores: 14, threads: 14, powerW: 159, hasIgpu: true, gamingScore: 72, memory: DDR5 },
  { id: 'u5-250kp', name: 'Intel Core Ultra 5 250K Plus', brand: 'Intel', socket: 'LGA1851', cores: 18, threads: 18, powerW: 159, hasIgpu: true, gamingScore: 75, memory: DDR5 },
  { id: 'u7-265k', name: 'Intel Core Ultra 7 265KF', brand: 'Intel', socket: 'LGA1851', cores: 20, threads: 20, powerW: 250, hasIgpu: false, gamingScore: 77, memory: DDR5 },
  { id: 'u7-270kp', name: 'Intel Core Ultra 7 270K Plus', brand: 'Intel', socket: 'LGA1851', cores: 24, threads: 24, powerW: 250, hasIgpu: true, gamingScore: 80, memory: DDR5 }
])

export const gpus: Gpu[] = withListing<Gpu>([
  { id: 'rtx3050-6', name: 'MSI RTX 3050 Ventus 2X 6GB', brand: 'NVIDIA', vramGb: 6, boardPowerW: 70, lengthMm: 189, gamingScore: 18 },
  { id: 'rtx3050-8', name: 'ZOTAC RTX 3050 ECO 8GB', brand: 'NVIDIA', vramGb: 8, boardPowerW: 130, lengthMm: 225, gamingScore: 23 },
  { id: 'rtx3060', name: 'GALAX RTX 3060 1-Click OC 12GB', brand: 'NVIDIA', vramGb: 12, boardPowerW: 170, lengthMm: 252, gamingScore: 32 },
  { id: 'rtx5050', name: 'GALAX RTX 5050 1-Click OC 8GB', brand: 'NVIDIA', vramGb: 8, boardPowerW: 130, lengthMm: 250, gamingScore: 35 },
  { id: 'rtx5060', name: 'ZOTAC RTX 5060 Twin Edge 8GB', brand: 'NVIDIA', vramGb: 8, boardPowerW: 145, lengthMm: 225, gamingScore: 44 },
  { id: 'rtx5060ti-8', name: 'MSI RTX 5060 Ti Ventus 2X 8GB', brand: 'NVIDIA', vramGb: 8, boardPowerW: 180, lengthMm: 200, gamingScore: 50 },
  { id: 'rtx5060ti-16', name: 'GALAX RTX 5060 Ti 1-Click OC 16GB', brand: 'NVIDIA', vramGb: 16, boardPowerW: 180, lengthMm: 248, gamingScore: 52 },
  { id: 'rx9060xt-8', name: 'GIGABYTE RX 9060 XT Gaming OC 8GB', brand: 'AMD', vramGb: 8, boardPowerW: 160, lengthMm: 281, gamingScore: 48 },
  { id: 'rx9060xt-16', name: 'ASUS Dual RX 9060 XT 16GB', brand: 'AMD', vramGb: 16, boardPowerW: 160, lengthMm: 235, gamingScore: 51 },
  { id: 'rx9070gre', name: 'ASUS Prime RX 9070 GRE 12GB', brand: 'AMD', vramGb: 12, boardPowerW: 220, lengthMm: 310, gamingScore: 64 },
  { id: 'rtx5070', name: 'GIGABYTE RTX 5070 Eagle OC 12GB', brand: 'NVIDIA', vramGb: 12, boardPowerW: 250, lengthMm: 261, gamingScore: 68 },
  { id: 'rx9070', name: 'GIGABYTE RX 9070 Gaming OC 16GB', brand: 'AMD', vramGb: 16, boardPowerW: 220, lengthMm: 288, gamingScore: 76 },
  { id: 'rx9070xt', name: 'GIGABYTE RX 9070 XT Gaming OC 16GB', brand: 'AMD', vramGb: 16, boardPowerW: 304, lengthMm: 288, gamingScore: 85 },
  { id: 'rtx5070ti', name: 'GIGABYTE RTX 5070 Ti Eagle OC SFF 16GB', brand: 'NVIDIA', vramGb: 16, boardPowerW: 300, lengthMm: 304, gamingScore: 87 },
  { id: 'rtx5080', name: 'GIGABYTE RTX 5080 Windforce OC 16GB', brand: 'NVIDIA', vramGb: 16, boardPowerW: 360, lengthMm: 304, gamingScore: 100 },
  { id: 'rtx5090', name: 'MSI RTX 5090 Ventus 3X OC 32GB', brand: 'NVIDIA', vramGb: 32, boardPowerW: 575, lengthMm: 325, gamingScore: 145 }
])

export const motherboards: Motherboard[] = withListing<Motherboard>([
  { id: 'mb-a520m-k', name: 'Gigabyte A520M K V2', socket: 'AM4', chipset: 'A520', memory: 'DDR4', formFactor: 'mATX', maxCpuPowerW: 88, canOverclock: false, wifi: false },
  { id: 'mb-b550m-vdh', name: 'MSI B550M PRO-VDH', socket: 'AM4', chipset: 'B550', memory: 'DDR4', formFactor: 'mATX', maxCpuPowerW: 142, canOverclock: true, wifi: false },
  { id: 'mb-a620m-h', name: 'Gigabyte A620M H', socket: 'AM5', chipset: 'A620', memory: 'DDR5', formFactor: 'mATX', maxCpuPowerW: 162, canOverclock: false, wifi: false },
  { id: 'mb-b650m-p', name: 'MSI PRO B650M-P', socket: 'AM5', chipset: 'B650', memory: 'DDR5', formFactor: 'mATX', maxCpuPowerW: 230, canOverclock: true, wifi: false },
  { id: 'mb-b850m-ds3h', name: 'Gigabyte B850M DS3H', socket: 'AM5', chipset: 'B850', memory: 'DDR5', formFactor: 'mATX', maxCpuPowerW: 230, canOverclock: true, wifi: false },
  { id: 'mb-x870-eagle', name: 'Gigabyte X870 Eagle WiFi7', socket: 'AM5', chipset: 'X870', memory: 'DDR5', formFactor: 'ATX', maxCpuPowerW: 300, canOverclock: true, wifi: true },
  { id: 'mb-b850-tomahawk', name: 'MSI MAG B850 Tomahawk MAX WiFi', socket: 'AM5', chipset: 'B850', memory: 'DDR5', formFactor: 'ATX', maxCpuPowerW: 300, canOverclock: true, wifi: true },
  { id: 'mb-h610m-k-d4', name: 'Gigabyte H610M K DDR4', socket: 'LGA1700', chipset: 'H610', memory: 'DDR4', formFactor: 'mATX', maxCpuPowerW: 150, canOverclock: false, wifi: false },
  { id: 'mb-b760m-e-d4', name: 'MSI PRO B760M-E DDR4', socket: 'LGA1700', chipset: 'B760', memory: 'DDR4', formFactor: 'mATX', maxCpuPowerW: 180, canOverclock: false, wifi: false },
  { id: 'mb-b760m-ds3h-d5', name: 'Gigabyte B760M DS3H Gen5 DDR5', socket: 'LGA1700', chipset: 'B760', memory: 'DDR5', formFactor: 'mATX', maxCpuPowerW: 253, canOverclock: false, wifi: false },
  { id: 'mb-z790-p', name: 'MSI PRO Z790-P WiFi DDR5', socket: 'LGA1700', chipset: 'Z790', memory: 'DDR5', formFactor: 'ATX', maxCpuPowerW: 300, canOverclock: true, wifi: true },
  { id: 'mb-h810m-k', name: 'Gigabyte H810M-K', socket: 'LGA1851', chipset: 'H810', memory: 'DDR5', formFactor: 'mATX', maxCpuPowerW: 150, canOverclock: false, wifi: false },
  { id: 'mb-b860m-e', name: 'MSI PRO B860M-E', socket: 'LGA1851', chipset: 'B860', memory: 'DDR5', formFactor: 'mATX', maxCpuPowerW: 180, canOverclock: false, wifi: false },
  { id: 'mb-b860m-ds3h', name: 'Gigabyte B860M DS3H', socket: 'LGA1851', chipset: 'B860', memory: 'DDR5', formFactor: 'mATX', maxCpuPowerW: 253, canOverclock: false, wifi: false },
  { id: 'mb-z890-eagle', name: 'Gigabyte Z890 Eagle', socket: 'LGA1851', chipset: 'Z890', memory: 'DDR5', formFactor: 'ATX', maxCpuPowerW: 300, canOverclock: true, wifi: false }
])

export const memories: Memory[] = withListing<Memory>([
  { id: 'ram-d4-8', name: 'Corsair Vengeance LPX 8GB DDR4-3200', type: 'DDR4', totalGb: 8, sticks: 1, speedMts: 3200 },
  { id: 'ram-d4-16', name: 'G.Skill Aegis 16GB (2×8) DDR4-3200', type: 'DDR4', totalGb: 16, sticks: 2, speedMts: 3200 },
  { id: 'ram-d4-32', name: 'Lexar Thor 32GB (2×16) DDR4-3200', type: 'DDR4', totalGb: 32, sticks: 2, speedMts: 3200 },
  { id: 'ram-d5-16', name: 'KingSpec 16GB DDR5-6000', type: 'DDR5', totalGb: 16, sticks: 1, speedMts: 6000 },
  { id: 'ram-d5-32', name: 'Lexar Ares RGB 32GB (2×16) DDR5-6000 CL30', type: 'DDR5', totalGb: 32, sticks: 2, speedMts: 6000 },
  { id: 'ram-d5-64', name: 'Kingston Fury Beast RGB 64GB (2×32) DDR5-6000', type: 'DDR5', totalGb: 64, sticks: 2, speedMts: 6000 }
])

export const storages: Storage[] = withListing<Storage>([
  { id: 'ssd-512', name: 'OSCOO ON1000 512GB NVMe Gen4', capacityGb: 512, pcieGen: 4 },
  { id: 'ssd-1t', name: 'Kingston NV3 1TB NVMe Gen4', capacityGb: 1000, pcieGen: 4 },
  { id: 'ssd-1t-gen5', name: 'MSI Spatium M560 1TB NVMe Gen5', capacityGb: 1000, pcieGen: 5 },
  { id: 'ssd-2t', name: 'WD Blue SN5000 2TB NVMe Gen4', capacityGb: 2000, pcieGen: 4 }
])

export const psus: Psu[] = withListing<Psu>([
  { id: 'psu-650', name: 'DeepCool PF650 650W', watts: 650, rating: 'Standard' },
  { id: 'psu-750b', name: 'Xigmatek Thor T750W V3 Bronze', watts: 750, rating: 'Bronze' },
  { id: 'psu-750g', name: 'MSI MAG A750GN 750W Gold', watts: 750, rating: 'Gold' },
  { id: 'psu-850g', name: 'Cooler Master MWE Gold 850 V3', watts: 850, rating: 'Gold' },
  { id: 'psu-1000g', name: 'Cooler Master Elite Gold 1000W', watts: 1000, rating: 'Gold' },
  { id: 'psu-1200g', name: 'Thermalright TG-1200 1200W Gold', watts: 1200, rating: 'Gold' }
])

export const cases: Case[] = withListing<Case>([
  { id: 'case-elite301', name: 'Cooler Master Elite 301 Lite', formFactors: ['mATX'], maxGpuMm: 365 },
  { id: 'case-danb4', name: 'Lian Li DAN B4 Mesh', formFactors: ['mATX'], maxGpuMm: 358 },
  { id: 'case-v950w', name: 'Acer V950W', formFactors: ['ATX', 'mATX'], maxGpuMm: 410 },
  { id: 'case-td500', name: 'Cooler Master TD500 Mesh V2', formFactors: ['ATX', 'mATX'], maxGpuMm: 410 },
  { id: 'case-gt502', name: 'ASUS TUF Gaming GT502 Plus', formFactors: ['ATX', 'mATX'], maxGpuMm: 400 }
])

export const coolers: Cooler[] = withListing<Cooler>([
  { id: 'cool-se903', name: 'ID-Cooling SE-903-SD V3', kind: 'air', ratedW: 130 },
  { id: 'cool-a450', name: 'Antec A450', kind: 'air', ratedW: 180 },
  { id: 'cool-a620', name: 'ID-Cooling Frozn A620 Pro SE', kind: 'air', ratedW: 260 },
  { id: 'cool-fx240', name: 'ID-Cooling FX240 Pro (240mm AIO)', kind: 'liquid', ratedW: 300 },
  { id: 'cool-fx360', name: 'ID-Cooling FX360 INF (360mm AIO)', kind: 'liquid', ratedW: 350 }
])

export const catalog = {
  cpu: cpus,
  gpu: gpus,
  motherboard: motherboards,
  memory: memories,
  storage: storages,
  psu: psus,
  case: cases,
  cooler: coolers
} as const
