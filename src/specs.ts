import type { Messages } from './i18n/messages'
import type { Case, Category, Cooler, Cpu, Gpu, Memory, Motherboard, PartBase, Psu, Storage } from './domain/types'

type Describe = (part: PartBase, m: Messages) => string[]

const DESCRIBE: Record<Category, Describe> = {
  cpu: (p, m) => {
    const c = p as Cpu
    return [c.socket, m.specs.cores(c.cores, c.threads), m.specs.watts(c.powerW), c.memory.join('/'), ...(c.hasIgpu ? [m.specs.igpu] : [])]
  },
  gpu: (p, m) => {
    const g = p as Gpu
    return [m.specs.vram(g.vramGb), m.specs.watts(g.boardPowerW), m.specs.length(g.lengthMm)]
  },
  motherboard: p => {
    const b = p as Motherboard
    return [b.socket, b.chipset, b.memory, b.formFactor, ...(b.wifi ? ['Wi-Fi'] : [])]
  },
  memory: p => {
    const r = p as Memory
    return [r.type, `${r.totalGb} GB`, `${r.speedMts} MT/s`]
  },
  storage: p => {
    const s = p as Storage
    return [s.capacityGb >= 1000 ? `${s.capacityGb / 1000} TB` : `${s.capacityGb} GB`, `PCIe ${s.pcieGen}`]
  },
  psu: p => {
    const s = p as Psu
    return [`${s.watts} W`, s.rating === 'Standard' ? '80 Plus' : `80 Plus ${s.rating}`]
  },
  case: (p, m) => {
    const c = p as Case
    return [c.formFactors.join(' / '), c.gpuClearanceEstimated ? m.specs.maxGpuEstimated(c.maxGpuMm) : m.specs.maxGpu(c.maxGpuMm)]
  },
  cooler: (p, m) => {
    const c = p as Cooler
    return [c.kind === 'air' ? 'Air' : 'AIO', m.specs.rated(c.ratedW)]
  }
}

export const describePart = (category: Category, part: PartBase, messages: Messages): string[] => DESCRIBE[category](part, messages)
