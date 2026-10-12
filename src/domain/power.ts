import type { Build } from './types'

export const PLATFORM_OVERHEAD_W = 50
export const PSU_HEADROOM = 1.3
export const PSU_STEP_W = 50

export function estimatedLoadW(build: Build): number {
  return (build.cpu?.powerW ?? 0) + (build.gpu?.boardPowerW ?? 0) + PLATFORM_OVERHEAD_W
}

export function recommendedPsuW(build: Build): number {
  return Math.ceil((estimatedLoadW(build) * PSU_HEADROOM) / PSU_STEP_W) * PSU_STEP_W
}
