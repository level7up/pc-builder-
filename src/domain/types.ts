export type Socket = 'AM4' | 'AM5' | 'LGA1700' | 'LGA1851'
export type MemoryType = 'DDR4' | 'DDR5'
export type FormFactor = 'ATX' | 'mATX'
export type Resolution = '1080p' | '1440p' | '4K'
export type Category = 'cpu' | 'gpu' | 'motherboard' | 'memory' | 'storage' | 'psu' | 'case' | 'cooler'

export interface Offer {
  store: string
  priceEgp: number
  url: string
  inStock: boolean
  title: string
}

export interface Listing {
  priceEgp: number
  store: string
  url: string
  offers: Offer[]
}

export interface PartBase {
  id: string
  name: string
  listing: Listing
}

export interface Cpu extends PartBase {
  brand: 'AMD' | 'Intel'
  socket: Socket
  cores: number
  threads: number
  powerW: number
  hasIgpu: boolean
  gamingScore: number
  memory: MemoryType[]
}

export interface Gpu extends PartBase {
  brand: 'NVIDIA' | 'AMD'
  vramGb: number
  boardPowerW: number
  lengthMm: number
  gamingScore: number
}

export interface Motherboard extends PartBase {
  socket: Socket
  chipset: string
  memory: MemoryType
  formFactor: FormFactor
  maxCpuPowerW: number
  canOverclock: boolean
  wifi: boolean
}

export interface Memory extends PartBase {
  type: MemoryType
  totalGb: number
  sticks: number
  speedMts: number
}

export interface Storage extends PartBase {
  capacityGb: number
  pcieGen: 3 | 4 | 5
}

export interface Psu extends PartBase {
  watts: number
  rating: 'Standard' | 'Bronze' | 'Gold'
}

export interface Case extends PartBase {
  formFactors: FormFactor[]
  maxGpuMm: number
}

export interface Cooler extends PartBase {
  kind: 'air' | 'liquid'
  ratedW: number
}

export interface PartsByCategory {
  cpu: Cpu
  gpu: Gpu
  motherboard: Motherboard
  memory: Memory
  storage: Storage
  psu: Psu
  case: Case
  cooler: Cooler
}

export type Build = { [K in Category]?: PartsByCategory[K] }

export type BuildIds = Partial<Record<Category, string>>

export type Severity = 'error' | 'warning' | 'info'

export interface Issue {
  severity: Severity
  code: string
  params?: Record<string, string | number>
}
