// Mock wallet ledger. LEDGER DISCIPLINE (spec decision #24): each profile's
// transactions sum EXACTLY to that profile's gastoMensual — asserted in
// src/lib/roundup.test.ts (Task 3.10). Every on-screen stat must be
// recomputable by hand from this visible data. If you edit amounts, keep the sum.

export type TxCategory =
  | 'super'
  | 'transporte'
  | 'servicios'
  | 'gastronomia'
  | 'hogar'
  | 'compras'
  | 'otros'

export interface Transaction {
  id: string
  merchant: string
  amount: number // ARS
  category: TxCategory
}

// The scripted demo payment (spec decision #23)
export const DEMO_PAYMENT = { merchant: 'Café Martínez', amount: 4_350 } as const

const LEDGERS: Record<string, Transaction[]> = {
  // Σ = 1.180.000 (exact — mati.gastoMensual)
  mati: [
    { id: 'm1', merchant: 'Alquiler depto', amount: 450_000, category: 'hogar' },
    { id: 'm2', merchant: 'Coto supermercado', amount: 274_722, category: 'super' },
    { id: 'm3', merchant: 'Tarjeta Galicia (resumen)', amount: 200_000, category: 'otros' },
    { id: 'm4', merchant: 'YPF nafta', amount: 80_000, category: 'transporte' },
    { id: 'm5', merchant: 'Edenor', amount: 48_700, category: 'servicios' },
    { id: 'm6', merchant: 'Movistar', amount: 35_200, category: 'servicios' },
    { id: 'm7', merchant: 'Rappi', amount: 28_640, category: 'gastronomia' },
    { id: 'm8', merchant: 'Farmacity', amount: 23_890, category: 'compras' },
    { id: 'm9', merchant: 'Netflix', amount: 15_999, category: 'servicios' },
    { id: 'm10', merchant: 'SUBE recarga', amount: 12_000, category: 'transporte' },
    { id: 'm11', merchant: 'Spotify', amount: 6_499, category: 'servicios' },
    { id: 'm12', merchant: 'Café Martínez', amount: 4_350, category: 'gastronomia' },
  ],
  // Σ = 870.000 (exact — lu.gastoMensual)
  lu: [
    { id: 'l1', merchant: 'Alquiler habitación', amount: 380_000, category: 'hogar' },
    { id: 'l2', merchant: 'Día supermercado', amount: 174_151, category: 'super' },
    { id: 'l3', merchant: 'Ropa Avellaneda', amount: 123_000, category: 'compras' },
    { id: 'l4', merchant: 'Salidas', amount: 45_000, category: 'gastronomia' },
    { id: 'l5', merchant: 'Edesur', amount: 39_800, category: 'servicios' },
    { id: 'l6', merchant: 'Personal', amount: 28_500, category: 'servicios' },
    { id: 'l7', merchant: 'Rappi', amount: 22_400, category: 'gastronomia' },
    { id: 'l8', merchant: 'Farmacity', amount: 19_350, category: 'compras' },
    { id: 'l9', merchant: 'SUBE recarga', amount: 18_000, category: 'transporte' },
    { id: 'l10', merchant: 'Netflix', amount: 15_999, category: 'servicios' },
    { id: 'l11', merchant: 'Café', amount: 3_800, category: 'gastronomia' },
  ],
  // Σ = 1.700.000 (exact — fede.gastoMensual)
  fede: [
    { id: 'f1', merchant: 'Alquiler', amount: 650_000, category: 'hogar' },
    { id: 'f2', merchant: 'Tarjeta Santander (resumen)', amount: 320_000, category: 'otros' },
    { id: 'f3', merchant: 'Jumbo', amount: 230_000, category: 'super' },
    { id: 'f4', merchant: 'Restaurantes', amount: 150_351, category: 'gastronomia' },
    { id: 'f5', merchant: 'Shell nafta', amount: 120_000, category: 'transporte' },
    { id: 'f6', merchant: 'Notebook (cuota 3/12)', amount: 88_000, category: 'compras' },
    { id: 'f7', merchant: 'Metrogas', amount: 52_650, category: 'servicios' },
    { id: 'f8', merchant: 'Gimnasio', amount: 45_000, category: 'otros' },
    { id: 'f9', merchant: 'Vinoteca', amount: 32_000, category: 'compras' },
    { id: 'f10', merchant: 'Spotify', amount: 6_499, category: 'servicios' },
    { id: 'f11', merchant: 'Café de especialidad', amount: 5_500, category: 'gastronomia' },
  ],
}

export function transactionsFor(profileId: string): Transaction[] {
  return LEDGERS[profileId] ?? []
}
