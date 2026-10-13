import type { Storage, Spec } from '../../domain/types'

export const STORAGE_SPECS: Spec<Storage>[] = [
  { id: 'ssd-512', name: 'OSCOO ON1000 512GB NVMe Gen4', capacityGb: 512, pcieGen: 4 },
  { id: 'ssd-1t', name: 'Kingston NV3 1TB NVMe Gen4', capacityGb: 1000, pcieGen: 4 },
  { id: 'ssd-1t-gen5', name: 'MSI Spatium M560 1TB NVMe Gen5', capacityGb: 1000, pcieGen: 5 },
  { id: 'ssd-2t', name: 'WD Blue SN5000 2TB NVMe Gen4', capacityGb: 2000, pcieGen: 4 }
]
