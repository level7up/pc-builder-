import type { Game } from '../domain/types'

export const GAMES: Game[] = [
  { id: 'pubg-mobile', name: 'PUBG Mobile (GameLoop)', preset: 'Smooth · 120 FPS', cpuFps: 200, gpuFps: 600, maxFps: 120, fixedResolution: true },
  { id: 'valorant', name: 'Valorant', preset: 'High', cpuFps: 650, gpuFps: 1100 },
  { id: 'lol', name: 'League of Legends', preset: 'Very High', cpuFps: 550, gpuFps: 1200 },
  { id: 'cs2', name: 'Counter-Strike 2', preset: 'High', cpuFps: 500, gpuFps: 600 },
  { id: 'fortnite', name: 'Fortnite', preset: 'High · DX12', cpuFps: 300, gpuFps: 260 },
  { id: 'eafc', name: 'EA SPORTS FC 26', preset: 'Ultra', cpuFps: 400, gpuFps: 350 },
  { id: 'warzone', name: 'Call of Duty: Warzone', preset: 'Basic', cpuFps: 260, gpuFps: 230 },
  { id: 'cyberpunk', name: 'Cyberpunk 2077', preset: 'Ultra · No RT', cpuFps: 180, gpuFps: 150 }
]
