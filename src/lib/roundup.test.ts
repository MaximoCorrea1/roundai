import { describe, expect, test } from 'vitest'
import { profiles } from '../data/profiles'
import { transactionsFor } from '../data/transactions'
import {
  computeOptimalMargin,
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
