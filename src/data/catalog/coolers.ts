import type { Cooler, Spec } from '../../domain/types'

export const COOLER_SPECS: Spec<Cooler>[] = [
  { id: 'cool-se903', name: 'ID-Cooling SE-903-SD V3', kind: 'air', ratedW: 130 },
  { id: 'cool-a450', name: 'Antec A450', kind: 'air', ratedW: 180 },
  { id: 'cool-a620', name: 'ID-Cooling Frozn A620 Pro SE', kind: 'air', ratedW: 260 },
  { id: 'cool-fx240', name: 'ID-Cooling FX240 Pro (240mm AIO)', kind: 'liquid', ratedW: 300 },
  { id: 'cool-fx360', name: 'ID-Cooling FX360 INF (360mm AIO)', kind: 'liquid', ratedW: 350 }
]
