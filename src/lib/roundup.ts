// ⭐ THE one calculator (spec decision #10): every number on screen and in the
// coach's prompt derives from this pure module. No React, no server imports.
//
// Maintained TDD-style: do NOT add or change behavior here without a failing
// test first in roundup.test.ts (see docs/plan.md §Phase 3).

import type { Transaction } from '../data/transactions'
import { TNA_SIMULADA } from './config'

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
  if (profile.gastoMensual <= 0)
    throw new ValidationError(`gastoMensual must be positive: ${profile.gastoMensual}`)
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

/** Months to reach a goal at a margin (Math.ceil, returns excluded); contribution ≤ 0 → unreachable. */
export function monthsToGoal(
  profile: UserProfile,
  margin: number,
  goalAmount: number,
): { reachable: boolean; months: number | null } {
  if (goalAmount <= 0) throw new ValidationError(`goalAmount must be positive: ${goalAmount}`)
  const contribution = monthlyContribution(profile, margin)
  if (contribution <= 0) return { reachable: false, months: null }
  return { reachable: true, months: Math.ceil(goalAmount / contribution) }
}

/**
 * Months to cover a remaining amount at a flat monthly sweep rate (Math.ceil).
 * Generic counterpart to monthsToGoal, used by the goal screen's pace line so the
 * projection stays inside the one-calculator rule. remaining ≤ 0 → already there
 * ({ reachable: true, months: 0 }); rate ≤ 0 → { reachable: false, months: null }.
 */
export function monthsAtRate(
  remainingAmount: number,
  monthlyRate: number,
): { reachable: boolean; months: number | null } {
  if (remainingAmount <= 0) return { reachable: true, months: 0 }
  if (monthlyRate <= 0) return { reachable: false, months: null }
  return { reachable: true, months: Math.ceil(remainingAmount / monthlyRate) }
}

/**
 * Direction + magnitude of a numeric series (spec decision #28): compares the
 * average of the first ≤3 entries (base) against the average of the last ≤3
 * (recent). `pct` is the relative change (recent − base) / base. A ±3% deadband
 * keeps small wiggles "estable": |pct| < 0.03 → estable, ≥ +0.03 → sube,
 * ≤ −0.03 → baja. Series shorter than 2, or a zero base (div-by-zero guard),
 * return { direction: 'estable', pct: 0 }.
 */
export function trendOf(series: number[]): {
  direction: 'sube' | 'estable' | 'baja'
  pct: number
} {
  if (series.length < 2) return { direction: 'estable', pct: 0 }
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
  // Window = up to 3, but never so wide that base and recent overlap on a
  // short series (2 entries → 1 each, 5 → 2 each, 6+ → 3 each).
  const w = Math.min(3, Math.floor(series.length / 2))
  const base = avg(series.slice(0, w))
  const recent = avg(series.slice(-w))
  if (base === 0) return { direction: 'estable', pct: 0 }
  const pct = (recent - base) / base
  const direction = pct >= 0.03 ? 'sube' : pct <= -0.03 ? 'baja' : 'estable'
  return { direction, pct }
}

/** Format an ARS amount, es-AR, no decimals (emits a NBSP after `$`; spec decision #17). */
export function formatARS(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n)
}

/** Format a fraction as an es-AR percentage with up to 1 decimal. */
export function formatPct(f: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'percent', maximumFractionDigits: 1 }).format(f)
}

/** Liquidity band from capacity/gasto ratio: < 0.05 baja, < 0.25 media, else alta. */
export function liquidityBand(profile: UserProfile): 'baja' | 'media' | 'alta' {
  if (profile.gastoMensual <= 0)
    throw new ValidationError(`gastoMensual must be positive: ${profile.gastoMensual}`)
  const ratio = savingsCapacity(profile) / profile.gastoMensual
  if (ratio < 0.05) return 'baja'
  if (ratio < 0.25) return 'media'
  return 'alta'
}

/** Simulated growth of end-of-month contributions at TNA_SIMULADA (annuity); always labeled "simulado" in UI. */
export function simulateReturns(
  contribution: number,
  months: number,
): { aportado: number; rendimiento: number; total: number } {
  if (contribution < 0 || months < 0)
    throw new ValidationError(`negative input: contribution=${contribution}, months=${months}`)
  const aportado = contribution * months
  const r = TNA_SIMULADA / 12
  const total = months === 0 ? aportado : Math.round(contribution * (((1 + r) ** months - 1) / r))
  return { aportado, rendimiento: total - aportado, total }
}

/** The per-payment sweep (spec decision #8): round(margin × amount), nearest peso half-up. */
export function sweepForPayment(amount: number, marginFraction: number): number {
  if (!Number.isFinite(amount) || amount < 0)
    throw new ValidationError(`invalid payment amount: ${amount}`)
  return Math.round(clampMargin(marginFraction) * amount)
}

/** Total swept across a ledger this month: Σ sweepForPayment over each transaction. */
export function monthlySweepTotal(ledger: Transaction[], marginFraction: number): number {
  return ledger.reduce((sum, tx) => sum + sweepForPayment(tx.amount, marginFraction), 0)
}
