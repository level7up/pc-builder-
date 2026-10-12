import { describe, expect, it } from 'vitest'
import { estimateFps, fpsForBuild, tierOf } from '../src/domain/fps'
import { resolveBuild } from '../src/domain/build'
import { GAMES } from '../src/data/games'
import { cpus, gpus, memories } from '../src/data/parts'
import { RESOLUTIONS } from '../src/domain/bottleneck'

const cpu = (id: string) => cpus.find(c => c.id === id)!
const gpu = (id: string) => gpus.find(g => g.id === id)!
const game = (id: string) => GAMES.find(g => g.id === id)!

describe('fps estimate', () => {
  it('includes PUBG Mobile on GameLoop', () => {
    expect(GAMES.map(g => g.name)).toContain('PUBG Mobile (GameLoop)')
  })

  it('gives the reference pair its reference frame rate when the GPU is the limit', () => {
    const r = estimateFps(game('cyberpunk'), cpu('r7-9800x3d'), gpu('rtx5080'), '1080p')
    expect(r.fps).toBe(game('cyberpunk').gpuFps)
    expect(r.limitedBy).toBe('gpu')
  })

  it('drops the frame rate as the resolution rises', () => {
    const [p1080, p1440, p4k] = RESOLUTIONS.map(res => estimateFps(game('cyberpunk'), cpu('r5-7500f'), gpu('rtx5070ti'), res).fps)
    expect(p1080).toBeGreaterThan(p1440)
    expect(p1440).toBeGreaterThan(p4k)
  })

  it('shows a budget CPU limiting a fast GPU in an esports game', () => {
    expect(estimateFps(game('valorant'), cpu('r5-5500'), gpu('rtx5080'), '1080p').limitedBy).toBe('cpu')
  })

  it('caps PUBG Mobile at 120 FPS on a strong build at every resolution', () => {
    RESOLUTIONS.forEach(res => {
      const r = estimateFps(game('pubg-mobile'), cpu('r7-9800x3d'), gpu('rtx5070'), res)
      expect(r.fps).toBe(120)
      expect(r.limitedBy).toBe('cap')
    })
  })

  it('keeps PUBG Mobile mostly CPU-bound on entry graphics', () => {
    const entry = estimateFps(game('pubg-mobile'), cpu('i5-12400f'), gpu('rtx3050-6'), '4K')
    expect(entry.fps).toBeGreaterThanOrEqual(90)
  })

  it('lowers the CPU side with a single memory stick', () => {
    const single = memories.find(m => m.sticks === 1)!
    const dual = memories.find(m => m.type === single.type && m.sticks === 2)!
    const args = [game('valorant'), cpu('r5-7500f'), gpu('rtx5080'), '1080p'] as const
    expect(estimateFps(...args, single).fps).toBeLessThan(estimateFps(...args, dual).fps)
  })

  it('returns a positive whole number for every CPU, GPU and game', () => {
    cpus.forEach(c => gpus.forEach(g => GAMES.forEach(gm => {
      const { fps } = estimateFps(gm, c, g, '4K')
      expect(Number.isInteger(fps)).toBe(true)
      expect(fps).toBeGreaterThan(0)
    })))
  })

  it('estimates every game for a build with a CPU and a GPU', () => {
    expect(fpsForBuild(resolveBuild({ cpu: 'r5-7500f', gpu: 'rtx5060' }), '1080p')).toHaveLength(GAMES.length)
    expect(fpsForBuild(resolveBuild({ cpu: 'r5-7600' }), '1080p')).toEqual([])
  })

  it('labels frame rates by how they feel', () => {
    expect([20, 45, 90, 200].map(tierOf)).toEqual(['low', 'playable', 'smooth', 'high'])
  })
})
