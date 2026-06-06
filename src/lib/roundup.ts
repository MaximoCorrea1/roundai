// ⭐ THE one calculator (spec decision #10): every number on screen and in the
// coach's prompt derives from this pure module. No React, no server imports.
//
// Phase 1: type declarations only. Implementations land in Phase 3 via TDD —
// do NOT add functions here without a failing test first (see docs/plan.md §Phase 3).

export type RiskProfile = 'conservador' | 'moderado' | 'agresivo'

export interface UserProfile {
  id: string
  nombre: string
  riskProfile: RiskProfile
  ingresoMensual: number // ARS
  gastoMensual: number // ARS — the round-up base
  liquidezFinDeMes: number[] // last 6 months, end-of-month liquidity (ARS)
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
