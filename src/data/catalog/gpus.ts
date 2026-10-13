import type { Gpu, Spec } from '../../domain/types'

export const GPU_SPECS: Spec<Gpu>[] = [
  { id: 'rtx3050-6', name: 'MSI RTX 3050 Ventus 2X 6GB', brand: 'NVIDIA', vramGb: 6, boardPowerW: 70, lengthMm: 189, gamingScore: 18 },
  { id: 'rtx3050-8', name: 'ZOTAC RTX 3050 ECO 8GB', brand: 'NVIDIA', vramGb: 8, boardPowerW: 130, lengthMm: 225, gamingScore: 23 },
  { id: 'rtx3060', name: 'GALAX RTX 3060 1-Click OC 12GB', brand: 'NVIDIA', vramGb: 12, boardPowerW: 170, lengthMm: 252, gamingScore: 32 },
  { id: 'rtx5050', name: 'GALAX RTX 5050 1-Click OC 8GB', brand: 'NVIDIA', vramGb: 8, boardPowerW: 130, lengthMm: 250, gamingScore: 35 },
  { id: 'rtx5060', name: 'ZOTAC RTX 5060 Twin Edge 8GB', brand: 'NVIDIA', vramGb: 8, boardPowerW: 145, lengthMm: 225, gamingScore: 44 },
  { id: 'rtx5060ti-8', name: 'MSI RTX 5060 Ti Ventus 2X 8GB', brand: 'NVIDIA', vramGb: 8, boardPowerW: 180, lengthMm: 200, gamingScore: 50 },
  { id: 'rtx5060ti-16', name: 'GALAX RTX 5060 Ti 1-Click OC 16GB', brand: 'NVIDIA', vramGb: 16, boardPowerW: 180, lengthMm: 248, gamingScore: 52 },
  { id: 'rx9060xt-8', name: 'GIGABYTE RX 9060 XT Gaming OC 8GB', brand: 'AMD', vramGb: 8, boardPowerW: 160, lengthMm: 281, gamingScore: 48 },
  { id: 'rx9060xt-16', name: 'ASUS Dual RX 9060 XT 16GB', brand: 'AMD', vramGb: 16, boardPowerW: 160, lengthMm: 235, gamingScore: 51 },
  { id: 'rx9070gre', name: 'ASUS Prime RX 9070 GRE 12GB', brand: 'AMD', vramGb: 12, boardPowerW: 220, lengthMm: 310, gamingScore: 64 },
  { id: 'rtx5070', name: 'GIGABYTE RTX 5070 Eagle OC 12GB', brand: 'NVIDIA', vramGb: 12, boardPowerW: 250, lengthMm: 261, gamingScore: 68 },
  { id: 'rx9070', name: 'GIGABYTE RX 9070 Gaming OC 16GB', brand: 'AMD', vramGb: 16, boardPowerW: 220, lengthMm: 288, gamingScore: 76 },
  { id: 'rx9070xt', name: 'GIGABYTE RX 9070 XT Gaming OC 16GB', brand: 'AMD', vramGb: 16, boardPowerW: 304, lengthMm: 288, gamingScore: 85 },
  { id: 'rtx5070ti', name: 'GIGABYTE RTX 5070 Ti Eagle OC SFF 16GB', brand: 'NVIDIA', vramGb: 16, boardPowerW: 300, lengthMm: 304, gamingScore: 87 },
  { id: 'rtx5080', name: 'GIGABYTE RTX 5080 Windforce OC 16GB', brand: 'NVIDIA', vramGb: 16, boardPowerW: 360, lengthMm: 304, gamingScore: 100 },
  { id: 'rtx5090', name: 'MSI RTX 5090 Ventus 3X OC 32GB', brand: 'NVIDIA', vramGb: 32, boardPowerW: 575, lengthMm: 325, gamingScore: 145 },
  { id: 'rx6500xt-8', name: 'Sapphire Pulse RX 6500 XT 8GB', brand: 'AMD', vramGb: 8, boardPowerW: 107, lengthMm: 194, gamingScore: 16 },
  { id: 'rtx4070ti', name: 'MSI RTX 4070 Ti Gaming X Trio 12GB', brand: 'NVIDIA', vramGb: 12, boardPowerW: 285, lengthMm: 337, gamingScore: 70 },
  { id: 'rx7900xt', name: 'Sapphire Pulse RX 7900 XT 20GB', brand: 'AMD', vramGb: 20, boardPowerW: 300, lengthMm: 313, gamingScore: 82 },
  { id: 'rx7900xtx', name: 'XFX Mercury RX 7900 XTX 24GB', brand: 'AMD', vramGb: 24, boardPowerW: 355, lengthMm: 344, gamingScore: 97 },
  { id: 'rtx4090', name: 'Gigabyte RTX 4090 Gaming OC 24GB', brand: 'NVIDIA', vramGb: 24, boardPowerW: 450, lengthMm: 340, gamingScore: 118 }
]
