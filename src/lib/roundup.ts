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

/** Average end-of-month liquidity over the recorded months; empty history → 0. */
export function savingsCapacity(profile: UserProfile): number {
  const xs = profile.liquidezFinDeMes
  if (xs.length === 0) return 0
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

/** Closed risk→margin-fraction table (spec decision #7); unknown risk → moderado. */
export const RISK_TO_MARGIN = {
  conservador: 0.03,
  moderado: 0.07,
  agresivo: 0.12,
} as const

/** Validate a margin FRACTION and clamp it to [0.01, 0.20]; rejects percent-style input. */
export function clampMargin(f: number): number {
  if (!Number.isFinite(f) || f < 0) throw new ValidationError(`invalid margin fraction: ${f}`)
  if (f > 1)
    throw new ValidationError(
      `margin fraction ${f} > 1 — did you pass percent instead of fraction? (e.g. 0.05, not 5)`,
    )
  return Math.min(0.2, Math.max(0.01, f))
}

/** Sustainable margin: min(risk-table rate, capacity/gasto), clamped; capacity ≤ 0 → 0. */
export function computeOptimalMargin(profile: UserProfile): number {
  const cap = savingsCapacity(profile)
  if (cap <= 0) return 0
  return clampMargin(
    Math.min(RISK_TO_MARGIN[profile.riskProfile] ?? RISK_TO_MARGIN.moderado, cap / profile.gastoMensual),
  )
}

/** Monthly amount swept at the given margin: margin × gastoMensual. */
export function monthlyContribution(profile: UserProfile, margin: number): number {
  if (margin < 0 || profile.gastoMensual < 0)
    throw new ValidationError(`negative input: margin=${margin}, gasto=${profile.gastoMensual}`)
  return margin * profile.gastoMensual
}

/** True iff the margin is positive AND its contribution fits within savings capacity. */
export function isSustainable(profile: UserProfile, margin: number): boolean {
  return margin > 0 && monthlyContribution(profile, margin) <= savingsCapacity(profile)
}
