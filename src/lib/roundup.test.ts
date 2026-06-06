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
  monthsToGoal,
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
