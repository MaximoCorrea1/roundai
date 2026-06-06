import type { UserProfile } from '@/lib/roundup'

// Placeholder numbers — Maximo provides real profiles to iterate on.
// Swapping the active profile is a one-line change (spec decision #4:
// lock it before the demo — the canned fallback echoes the active profile).
export const profiles: UserProfile[] = [
  {
    id: 'mati',
    nombre: 'Mati',
    riskProfile: 'moderado',
    ingresoMensual: 1_450_000,
    gastoMensual: 1_180_000,
    liquidezFinDeMes: [95_000, 120_000, 80_000, 140_000, 110_000, 105_000],
  },
  {
    id: 'lu',
    nombre: 'Lu',
    riskProfile: 'conservador',
    ingresoMensual: 900_000,
    gastoMensual: 870_000,
    liquidezFinDeMes: [15_000, 30_000, 8_000, 22_000, 12_000, 18_000],
  },
  {
    id: 'fede',
    nombre: 'Fede',
    riskProfile: 'agresivo',
    ingresoMensual: 2_600_000,
    gastoMensual: 1_700_000,
    liquidezFinDeMes: [420_000, 510_000, 380_000, 460_000, 490_000, 445_000],
  },
]

export const ACTIVE_PROFILE_ID = 'mati'

export function activeProfile(): UserProfile {
  return profiles.find((p) => p.id === ACTIVE_PROFILE_ID)!
}
