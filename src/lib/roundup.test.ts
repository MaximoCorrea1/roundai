import { describe, expect, test } from 'vitest'
import { profiles } from '../data/profiles'
import { transactionsFor } from '../data/transactions'
import { savingsCapacity } from './roundup'

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
