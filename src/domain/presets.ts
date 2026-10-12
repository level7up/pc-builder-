import type { BuildIds } from './types'

export interface Preset {
  id: 'budget' | 'mainstream' | 'high' | 'enthusiast'
  ids: BuildIds
}

export const PRESETS: Preset[] = [
  {
    id: 'budget',
    ids: { cpu: 'i5-12400f', motherboard: 'mb-h610m-k-d4', memory: 'ram-d4-16', gpu: 'rtx5060', storage: 'ssd-512', psu: 'psu-750b', case: 'case-elite301', cooler: 'cool-se903' }
  },
  {
    id: 'mainstream',
    ids: { cpu: 'r5-7500f', motherboard: 'mb-b650m-p', memory: 'ram-d5-32', gpu: 'rx9060xt-16', storage: 'ssd-1t', psu: 'psu-750g', case: 'case-danb4', cooler: 'cool-a450' }
  },
  {
    id: 'high',
    ids: { cpu: 'r7-7800x3d', motherboard: 'mb-b850m-ds3h', memory: 'ram-d5-32', gpu: 'rx9070xt', storage: 'ssd-1t', psu: 'psu-850g', case: 'case-td500', cooler: 'cool-a620' }
  },
  {
    id: 'enthusiast',
    ids: { cpu: 'r7-9800x3d', motherboard: 'mb-x870-eagle', memory: 'ram-d5-32', gpu: 'rtx5080', storage: 'ssd-2t', psu: 'psu-1000g', case: 'case-gt502', cooler: 'cool-fx360' }
  }
]
