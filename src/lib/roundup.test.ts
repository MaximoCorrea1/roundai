import { describe, expect, test } from 'vitest'
import { profiles } from '../data/profiles'
import { transactionsFor } from '../data/transactions'
import {
  computeOptimalMargin,
  formatARS,
  formatPct,
  isSustainable,
  liquidityBand,
  monthlyContribution,
  monthlySweepTotal,
  monthsToGoal,
  monthsAtRate,
  monthsWithReturns,
  planGoal,
  simulateReturns,
  sweepForPayment,
  trendOf,
  RISK_TO_MARGIN,
  clampMargin,
  savingsCapacity,
  ValidationError,
} from './roundup'

// Lib tests use RELATIVE imports (vitest resolves the '@' alias too, but the
// plan keeps lib tests on relative paths). Fixtures from the seed data.
const [mati, lu, fede] = profiles

describe('savingsCapacity', () => {
  test('averages 6 months of liquidity', () => {
    expect(savingsCapacity(mati)).toBeCloseTo(108_333.33, 1)
  })
  test('of empty history is 0', () => {
    expect(savingsCapacity({ ...mati, liquidezFinDeMes: [] })).toBe(0)
  })
})

describe('RISK_TO_MARGIN', () => {
  test('is the closed table from spec decision #7', () => {
    expect(RISK_TO_MARGIN).toEqual({ conservador: 0.03, moderado: 0.07, agresivo: 0.12 })
  })
})

describe('clampMargin', () => {
  test('rejects percent-style input (>1)', () => {
    expect(() => clampMargin(5)).toThrow(ValidationError)
  })
  test('rejects negative input', () => {
    expect(() => clampMargin(-0.1)).toThrow(ValidationError)
  })
  test('rejects non-finite input', () => {
    expect(() => clampMargin(NaN)).toThrow(ValidationError)
  })
  test('clamps up to the floor 0.01', () => {
    expect(clampMargin(0.005)).toBe(0.01)
  })
  test('clamps down to the ceiling 0.20', () => {
    expect(clampMargin(0.5)).toBe(0.2)
  })
  test('passes through a value already in range', () => {
    expect(clampMargin(0.07)).toBe(0.07)
  })
})

describe('computeOptimalMargin', () => {
  test('mati: risk table wins (capacity ratio 0.0918 > table 0.07)', () => {
    expect(computeOptimalMargin(mati)).toBe(0.07)
  })
  test('lu: capacity-capped below the conservative table rate', () => {
    expect(computeOptimalMargin(lu)).toBeCloseTo(0.020115, 5)
  })
  test('fede: aggressive table rate', () => {
    expect(computeOptimalMargin(fede)).toBe(0.12)
  })
  test('zero-capacity profile → 0', () => {
    expect(computeOptimalMargin({ ...mati, liquidezFinDeMes: [0, 0, 0] })).toBe(0)
  })
})

describe('monthlyContribution', () => {
  test('mati @ 0.07 → 82.600', () => {
    expect(monthlyContribution(mati, 0.07)).toBeCloseTo(82_600, 6)
  })
  test('negative margin → ValidationError', () => {
    expect(() => monthlyContribution(mati, -0.05)).toThrow(ValidationError)
  })
  test('negative gasto → ValidationError', () => {
    expect(() => monthlyContribution({ ...mati, gastoMensual: -1 }, 0.07)).toThrow(ValidationError)
  })
})

describe('isSustainable', () => {
  test('mati @ 0.07 (82.600 ≤ 108.333) is sustainable', () => {
    expect(isSustainable(mati, 0.07)).toBe(true)
  })
  test('mati @ 0.10 (118.000 > 108.333) is not sustainable', () => {
    expect(isSustainable(mati, 0.1)).toBe(false)
  })
  test('margin 0 is never sustainable', () => {
    expect(isSustainable(mati, 0)).toBe(false)
  })
})

describe('monthsToGoal', () => {
  test('zero contribution returns unreachable — never Infinity/NaN', () => {
    expect(monthsToGoal(lu, 0, 2_000_000)).toEqual({ reachable: false, months: null })
  })
  test('goalAmount ≤ 0 throws ValidationError', () => {
    expect(() => monthsToGoal(mati, 0.07, 0)).toThrow(ValidationError)
  })
  test('months are ceiled, never under-promised', () => {
    // mati @ 7% of 1.180.000 = 82.600/mes → 500.000 / 82.600 = 6.05 → 7 meses
    expect(monthsToGoal(mati, 0.07, 500_000)).toEqual({ reachable: true, months: 7 })
  })
  test('honest branch: absurdly slow at a SUSTAINABLE margin', () => {
    // lu's sustainable margin ≈ 0.02 → ~$17.500/mes; $2.000.000 toma ~115 meses
    const r = monthsToGoal(lu, computeOptimalMargin(lu), 2_000_000)
    expect(r.reachable).toBe(true)
    expect(r.months!).toBeGreaterThan(100)
  })
})

describe('monthsAtRate', () => {
  // Generic projection used by the goal screen: remaining amount at a flat
  // monthly sweep rate. Keeps the goal projection inside the one-calculator rule.
  test('ceils months for a partial remainder', () => {
    // 500.000 − 305 = 499.695 remaining at 82.600/mes → 6.049 → 7 meses
    expect(monthsAtRate(499_695, 82_600)).toEqual({ reachable: true, months: 7 })
  })
  test('remaining ≤ 0 → already reached, 0 months', () => {
    expect(monthsAtRate(0, 82_600)).toEqual({ reachable: true, months: 0 })
    expect(monthsAtRate(-50, 82_600)).toEqual({ reachable: true, months: 0 })
  })
  test('rate ≤ 0 → unreachable, never Infinity/NaN', () => {
    expect(monthsAtRate(1000, 0)).toEqual({ reachable: false, months: null })
    expect(monthsAtRate(1000, -5)).toEqual({ reachable: false, months: null })
  })
})

describe('monthsWithReturns', () => {
  // Goal timeline that ALSO accounts for expected investment returns (spec
  // iteration-4): smallest n ≥ 0 where the end-of-month annuity FV reaches the
  // goal. monthly × (((1+tna/12)^n − 1)/(tna/12)) ≥ goalAmount. tna 0 → ceil.
  // All numbers HAND-VERIFIED against the annuity FV formula.
  test('mati @ 82.600 / 500.000 / 35% → 6 (returns shave a month off 7)', () => {
    // n=6 FV ≈ $533.2k ≥ 500k; n=5 ≈ $437.8k < 500k. Without returns: ceil(500000/82600)=7.
    expect(monthsWithReturns(82_600, 500_000, 0.35)).toBe(6)
    expect(monthsToGoal(mati, 0.07, 500_000).months).toBe(7)
  })
  test('41.667 / 500.000 / 35% → 11 (vs 12 without returns)', () => {
    expect(monthsWithReturns(41_667, 500_000, 0.35)).toBe(11)
    expect(Math.ceil(500_000 / 41_667)).toBe(12)
  })
  test('41.667 / 500.000 / 15% (pesimista) → 12', () => {
    expect(monthsWithReturns(41_667, 500_000, 0.15)).toBe(12)
  })
  test('41.667 / 500.000 / 55% (optimista) → 10', () => {
    expect(monthsWithReturns(41_667, 500_000, 0.55)).toBe(10)
  })
  test('tna 0 → ceil parity with the no-returns projection (monthsAtRate)', () => {
    expect(monthsWithReturns(41_667, 500_000, 0)).toBe(monthsAtRate(500_000, 41_667).months)
    expect(monthsWithReturns(82_600, 500_000, 0)).toBe(monthsAtRate(500_000, 82_600).months)
  })
  test('goalAmount ≤ 0 → 0 (already there)', () => {
    expect(monthsWithReturns(82_600, 0, 0.35)).toBe(0)
    expect(monthsWithReturns(82_600, -100, 0.35)).toBe(0)
  })
  test('monthly ≤ 0 → null (never Infinity/NaN)', () => {
    expect(monthsWithReturns(0, 500_000, 0.35)).toBe(null)
    expect(monthsWithReturns(-5, 500_000, 0.35)).toBe(null)
  })
  test('tiny monthly vs huge goal exceeds the 600-month cap → null', () => {
    // $1/mes toward $10M at 15% TNA stays under-water past 600 months → null.
    // (At 35% it would compound to 438 months — under the cap; pesimista is the
    // honest stress case for the cap.)
    expect(monthsWithReturns(1, 10_000_000, 0.15)).toBe(null)
    // No growth at all: definitively a fantasy timeline → null.
    expect(monthsWithReturns(1, 10_000_000, 0)).toBe(null)
  })
  test('negative goalAmount is treated as ≤ 0 → 0, but negative tna → ValidationError', () => {
    expect(() => monthsWithReturns(82_600, 500_000, -0.1)).toThrow(ValidationError)
  })
})

describe('planGoal', () => {
  // mati: gasto 1.180.000, capacity 108.333,33 → capacityCap 0.091808.
  // riskCaps: moderado 0.07, agresivo 0.12.
  test('a) mati moderado $500.000 / 12m → comodo (required ≤ both caps)', () => {
    const p = planGoal(mati, 'moderado', 500_000, 12)
    expect(p.status).toBe('comodo')
    // required 41.666,67 / 1.180.000 = 0.035311
    expect(p.marginFraction).toBeCloseTo(0.035311, 5)
    expect(p.monthly).toBeCloseTo(41_666.67, 1)
    expect(p.monthsAtMargin).toBe(12)
  })
  test('b) mati moderado $500.000 / 6m → ajustado (fits capacity, exceeds riskCap)', () => {
    const p = planGoal(mati, 'moderado', 500_000, 6)
    expect(p.status).toBe('ajustado')
    // required 83.333,33 / 1.180.000 = 0.070621 > 0.07 (riskCap) ≤ 0.091808 (capacityCap)
    expect(p.marginFraction).toBe(0.07)
    expect(p.monthly).toBeCloseTo(82_600, 6)
    // 500.000 / 82.600 = 6.053 → ceil 7
    expect(p.monthsAtMargin).toBe(7)
  })
  test('c) mati agresivo $1.000.000 / 3m → inviable (required > capacityCap)', () => {
    const p = planGoal(mati, 'agresivo', 1_000_000, 3)
    expect(p.status).toBe('inviable')
    // required 333.333,33 / 1.180.000 = 0.282486 > capacityCap → clamp(min(0.091808, 0.20))
    expect(p.marginFraction).toBeCloseTo(0.091808, 5)
    expect(p.monthly).toBeCloseTo(108_333.33, 1)
    // ceil(1.000.000 / 108.333,33) = ceil(9.2307) = 10
    expect(p.monthsAtMargin).toBe(10)
  })
  test('months < 1 → ValidationError', () => {
    expect(() => planGoal(mati, 'moderado', 500_000, 0)).toThrow(ValidationError)
  })
  test('non-integer months → ValidationError', () => {
    expect(() => planGoal(mati, 'moderado', 500_000, 1.5)).toThrow(ValidationError)
  })
  test('amount ≤ 0 → ValidationError', () => {
    expect(() => planGoal(mati, 'moderado', 0, 12)).toThrow(ValidationError)
    expect(() => planGoal(mati, 'moderado', -100, 12)).toThrow(ValidationError)
  })
  test('zero-capacity profile → inviable degenerate (margin/monthly 0, monthsAtMargin null)', () => {
    const broke = { ...mati, liquidezFinDeMes: [0, 0, 0] }
    const p = planGoal(broke, 'moderado', 500_000, 12)
    expect(p).toEqual({
      status: 'inviable',
      marginFraction: 0,
      monthly: 0,
      monthsAtMargin: null,
    })
  })
})

describe('trendOf', () => {
  // base = avg(first ≤3), recent = avg(last ≤3); pct = (recent − base) / base.
  // |pct| < 0.03 → estable; ≥ +0.03 → sube; ≤ −0.03 → baja.
  test('rising series → sube with the relative change', () => {
    // base avg(100,110,120)=110, recent avg(130,140,150)=140 → (140−110)/110 = 0.2727
    const r = trendOf([100, 110, 120, 130, 140, 150])
    expect(r.direction).toBe('sube')
    expect(r.pct).toBeCloseTo(0.272727, 5)
  })
  test('falling series → baja with a negative pct', () => {
    // base avg(150,140,130)=140, recent avg(120,110,100)=110 → (110−140)/140 = −0.2143
    const r = trendOf([150, 140, 130, 120, 110, 100])
    expect(r.direction).toBe('baja')
    expect(r.pct).toBeCloseTo(-0.214286, 5)
  })
  test('flat series within the 3% deadband → estable', () => {
    // base avg(100,101,99)=100, recent avg(100,99,101)=100 → 0
    const r = trendOf([100, 101, 99, 100, 99, 101])
    expect(r.direction).toBe('estable')
    expect(r.pct).toBeCloseTo(0, 5)
  })
  test('change exactly on the +3% boundary → sube (≥)', () => {
    // base 100, recent 103 → +0.03 exactly
    expect(trendOf([100, 103]).direction).toBe('sube')
  })
  test('change exactly on the −3% boundary → baja (≤)', () => {
    expect(trendOf([100, 97]).direction).toBe('baja')
  })
  test('single-element series → estable / 0', () => {
    expect(trendOf([100])).toEqual({ direction: 'estable', pct: 0 })
  })
  test('empty series → estable / 0', () => {
    expect(trendOf([])).toEqual({ direction: 'estable', pct: 0 })
  })
  test('base of zero is protected (no div-by-zero) → estable / 0', () => {
    expect(trendOf([0, 0, 0, 50, 60, 70])).toEqual({ direction: 'estable', pct: 0 })
  })
  test('short series (2 elements) averages what is there', () => {
    // base avg(100)=100, recent avg(120)=120 → +0.2
    const r = trendOf([100, 120])
    expect(r.direction).toBe('sube')
    expect(r.pct).toBeCloseTo(0.2, 5)
  })
})

describe('formatARS', () => {
  test('es-AR currency, no decimals, NBSP after $ normalized', () => {
    // The char after $ is U+00A0 — normalize it before comparing (escaped, not pasted).
    expect(formatARS(1_234_567).replace(/\u00A0/g, ' ')).toBe('$ 1.234.567')
  })
})

describe('formatPct', () => {
  test('es-AR percent, max 1 decimal — pinned to real Node ICU output', () => {
    // Verified runtime output: Node emits "7%" (no space). Normalize NBSP for safety.
    expect(formatPct(0.07).replace(/\u00A0/g, ' ')).toBe('7%')
  })
})

describe('liquidityBand', () => {
  test('mati ratio ≈ 0.092 → media', () => {
    expect(liquidityBand(mati)).toBe('media')
  })
  test('lu ratio ≈ 0.020 → baja', () => {
    expect(liquidityBand(lu)).toBe('baja')
  })
  test('fede ratio ≈ 0.265 → alta', () => {
    expect(liquidityBand(fede)).toBe('alta')
  })
})

describe('simulateReturns', () => {
  test('months 0 → all zeros', () => {
    expect(simulateReturns(82_600, 0)).toEqual({ aportado: 0, rendimiento: 0, total: 0 })
  })
  test('contribution 82.600 over 7 months: positive rendimiento, total = aportado + rendimiento', () => {
    const r = simulateReturns(82_600, 7)
    expect(r.aportado).toBe(82_600 * 7)
    expect(r.rendimiento).toBeGreaterThan(0)
    expect(r.total).toBe(r.aportado + r.rendimiento)
  })
  test('total exceeds aportado for months ≥ 2', () => {
    const r = simulateReturns(50_000, 2)
    expect(r.total).toBeGreaterThan(r.aportado)
  })
  test('negative contribution → ValidationError', () => {
    expect(() => simulateReturns(-1, 5)).toThrow(ValidationError)
  })
  test('negative months → ValidationError', () => {
    expect(() => simulateReturns(50_000, -1)).toThrow(ValidationError)
  })
})

describe('sweepForPayment', () => {
  test('exact per payment, half-up', () => {
    expect(sweepForPayment(4_350, 0.07)).toBe(305) // 304,5 → 305
  })
  test('zero amount → 0', () => {
    expect(sweepForPayment(0, 0.07)).toBe(0)
  })
  test('negative amount → ValidationError', () => {
    expect(() => sweepForPayment(-1, 0.07)).toThrow(ValidationError)
  })
  test('percent-style margin → ValidationError (via clampMargin)', () => {
    expect(() => sweepForPayment(4_350, 5)).toThrow(ValidationError)
  })
})

describe('monthlySweepTotal', () => {
  test('reconciles with the margin target to within n/2 pesos', () => {
    const txns = transactionsFor('mati')
    const total = monthlySweepTotal(txns, 0.07)
    expect(Math.abs(total - 0.07 * mati.gastoMensual)).toBeLessThanOrEqual(txns.length / 2)
  })
})

describe('ledger discipline (spec decision #24)', () => {
  // Each profile's mock ledger must sum EXACTLY to its gastoMensual, so a judge
  // can recompute every on-screen stat by hand from the visible ledger.
  test.each(profiles)('$id ledger sums exactly to gastoMensual', (profile) => {
    const sum = transactionsFor(profile.id).reduce((a, tx) => a + tx.amount, 0)
    expect(sum).toBe(profile.gastoMensual)
  })
})

describe('profile histories (spec decision #28)', () => {
  // gastoMensualHist must end exactly on gastoMensual so ledger discipline
  // (spec #24) keeps holding — the visible "last month" gasto is the same
  // number every other stat is derived from.
  test.each(profiles)('$id gastoMensualHist.at(-1) === gastoMensual', (profile) => {
    expect(profile.gastoMensualHist.at(-1)).toBe(profile.gastoMensual)
  })
  test.each(profiles)('$id gastoMensualHist has 6 entries', (profile) => {
    expect(profile.gastoMensualHist).toHaveLength(6)
  })

  // ⚠ Trends asserted as COMPUTED, not as wished-for. Downstream copy must use
  // these real directions (the spec note flagged mati's liquidez is actually
  // 'sube' (+20.3%), not 'estable' — confirmed here).
  test('mati gasto trends sube (gentle rise)', () => {
    const t = trendOf(mati.gastoMensualHist)
    expect(t.direction).toBe('sube')
    expect(t.pct).toBeCloseTo(0.059361, 5)
  })
  test('mati liquidez trends sube (NOT estable — real data wins)', () => {
    const t = trendOf(mati.liquidezFinDeMes)
    expect(t.direction).toBe('sube')
    expect(t.pct).toBeCloseTo(0.20339, 4)
  })
  test('lu gasto trends estable (flat-ish)', () => {
    expect(trendOf(lu.gastoMensualHist).direction).toBe('estable')
  })
  test('lu liquidez trends estable', () => {
    expect(trendOf(lu.liquidezFinDeMes).direction).toBe('estable')
  })
  test('fede gasto trends sube (mild rise)', () => {
    expect(trendOf(fede.gastoMensualHist).direction).toBe('sube')
  })
})

// Review follow-ups (Phase 3 review): harden rounding + gasto=0 edge
describe('review hardening', () => {
  test('sweep rounds half-up, not ceil (fractional < .5 stays down)', () => {
    // 0.07 × 4.320 = 302,4 → round 302 (ceil would say 303)
    expect(sweepForPayment(4_320, 0.07)).toBe(302)
  })
  test('gastoMensual <= 0 throws in ratio-based functions', () => {
    const broke = { ...profiles[0], gastoMensual: 0 }
    expect(() => computeOptimalMargin(broke)).toThrow(ValidationError)
    expect(() => liquidityBand(broke)).toThrow(ValidationError)
  })
  test('empty ledger sweeps zero', () => {
    expect(monthlySweepTotal([], 0.07)).toBe(0)
  })
})
