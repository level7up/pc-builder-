import type { Build, Cpu, Gpu, Memory, Resolution } from './types'

export const RESOLUTIONS: Resolution[] = ['1080p', '1440p', '4K']

export const CPU_FRAMES_PER_POINT = 2
export const GPU_FRAMES_PER_POINT = 1.7
export const RESOLUTION_LOAD: Record<Resolution, number> = { '1080p': 1, '1440p': 0.7, '4K': 0.38 }
export const VRAM_NEEDED_GB: Record<Resolution, number> = { '1080p': 8, '1440p': 10, '4K': 12 }
export const VRAM_SHORT_PENALTY = 0.85
export const SINGLE_CHANNEL_PENALTY = 0.9
export const BALANCED_BELOW_PCT = 10
export const STRONG_FROM_PCT = 25

export type Limiter = 'cpu' | 'gpu' | 'balanced'
export type Strength = 'none' | 'mild' | 'strong'

export interface BottleneckResult {
  resolution: Resolution
  cpuCapacity: number
  gpuCapacity: number
  limitedBy: Limiter
  percent: number
  strength: Strength
}

export function cpuCapacity(cpu: Cpu, memory?: Memory): number {
  const channelFactor = memory && memory.sticks === 1 ? SINGLE_CHANNEL_PENALTY : 1
  return cpu.gamingScore * CPU_FRAMES_PER_POINT * channelFactor
}

export function gpuCapacity(gpu: Gpu, resolution: Resolution): number {
  const vramFactor = gpu.vramGb < VRAM_NEEDED_GB[resolution] ? VRAM_SHORT_PENALTY : 1
  return gpu.gamingScore * GPU_FRAMES_PER_POINT * RESOLUTION_LOAD[resolution] * vramFactor
}

function strengthOf(percent: number): Strength {
  if (percent < BALANCED_BELOW_PCT) return 'none'
  return percent < STRONG_FROM_PCT ? 'mild' : 'strong'
}

export function bottleneck(cpu: Cpu, gpu: Gpu, resolution: Resolution, memory?: Memory): BottleneckResult {
  const c = cpuCapacity(cpu, memory)
  const g = gpuCapacity(gpu, resolution)
  const percent = Math.round((1 - Math.min(c, g) / Math.max(c, g)) * 100)
  const limitedBy: Limiter = percent < BALANCED_BELOW_PCT ? 'balanced' : c < g ? 'cpu' : 'gpu'
  return { resolution, cpuCapacity: c, gpuCapacity: g, limitedBy, percent, strength: strengthOf(percent) }
}

export function bottleneckForBuild(build: Build): BottleneckResult[] {
  const { cpu, gpu, memory } = build
  if (!cpu || !gpu) return []
  return RESOLUTIONS.map(resolution => bottleneck(cpu, gpu, resolution, memory))
}
