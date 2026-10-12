import { GAMES } from '../data/games'
import { CPU_FRAMES_PER_POINT, GPU_FRAMES_PER_POINT, cpuCapacity, gpuCapacity } from './bottleneck'
import type { Build, Cpu, Game, Gpu, Memory, Resolution } from './types'

export const REFERENCE_SCORE = 100
export const PLAYABLE_FPS = 30
export const SMOOTH_FPS = 60
export const HIGH_FPS = 144
const BASE_RESOLUTION: Resolution = '1080p'

export type FpsTier = 'low' | 'playable' | 'smooth' | 'high'
export type FpsLimiter = 'cpu' | 'gpu' | 'cap'

export interface FpsEstimate {
  game: Game
  fps: number
  limitedBy: FpsLimiter
  tier: FpsTier
}

const cpuShare = (cpu: Cpu, memory?: Memory): number => cpuCapacity(cpu, memory) / (CPU_FRAMES_PER_POINT * REFERENCE_SCORE)

const gpuShare = (gpu: Gpu, resolution: Resolution): number => gpuCapacity(gpu, resolution) / (GPU_FRAMES_PER_POINT * REFERENCE_SCORE)

export function tierOf(fps: number): FpsTier {
  if (fps < PLAYABLE_FPS) return 'low'
  if (fps < SMOOTH_FPS) return 'playable'
  return fps < HIGH_FPS ? 'smooth' : 'high'
}

export function estimateFps(game: Game, cpu: Cpu, gpu: Gpu, resolution: Resolution, memory?: Memory): FpsEstimate {
  const cpuFps = game.cpuFps * cpuShare(cpu, memory)
  const gpuFps = game.gpuFps * gpuShare(gpu, game.fixedResolution ? BASE_RESOLUTION : resolution)
  const uncapped = Math.min(cpuFps, gpuFps)
  const cap = game.maxFps ?? Infinity
  const fps = Math.round(Math.min(uncapped, cap))
  const limitedBy: FpsLimiter = uncapped >= cap ? 'cap' : cpuFps < gpuFps ? 'cpu' : 'gpu'
  return { game, fps, limitedBy, tier: tierOf(fps) }
}

export function fpsForBuild(build: Build, resolution: Resolution, games: readonly Game[] = GAMES): FpsEstimate[] {
  const { cpu, gpu, memory } = build
  if (!cpu || !gpu) return []
  return games.map(game => estimateFps(game, cpu, gpu, resolution, memory))
}
