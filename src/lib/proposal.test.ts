// Seed-vs-proposal number parity (decisions #10, #14, #25): the figures in the
// seeded onboarding summary MUST equal the figures in the on-screen proposal
// (the live coach quotes the seed). The seed now also carries the chosen plazo
// (decision #25). Relative imports: vitest doesn't resolve tsconfig `@/` paths.

import { describe, expect, test } from 'vitest'
import {
  buildProposalPlan,
  buildOpenPlan,
  seedHistory,
  hasSustainableProposal,
} from './proposal'
import { activeProfile } from '../data/profiles'
import { planGoal, formatARS, formatPct, monthlyContribution } from './roundup'
import type { RiskProfile } from './roundup'
import type { Goal as ChatGoal } from './chat-types'

const profile = activeProfile()
// Canonical comodo case: $500.000 in 12 months, moderado (ground-truth 3,5%).
const goal: ChatGoal = { type: 'meta', amount: 500_000, months: 12 }
const risk: RiskProfile = 'moderado'
const margin = planGoal(profile, risk, goal.amount!, goal.months!).marginFraction

/** Extract the months figure from a "~N meses" / "N meses" rendering. */
function monthsIn(text: string): string | null {
  const m = text.match(/~?(\d+)\s+meses/)
  return m ? m[1] : null
}

describe('seedHistory', () => {
  test('returns an alternation-safe user→assistant pair', () => {
    const seed = seedHistory(profile, goal, margin, risk)
    expect(seed).toHaveLength(2)
    expect(seed[0].role).toBe('user')
    expect(seed[1].role).toBe('assistant')
  })

  test('user turn renders the goal label + amount + plazo', () => {
    const seed = seedHistory(profile, goal, margin, risk)
    expect(seed[0].content).toContain('Quiero llegar a esta meta')
    expect(seed[0].content).toContain(formatARS(goal.amount!))
    expect(seed[0].content).toContain('12 meses') // the chosen plazo (decision #25)
  })

  test('seed summary figures === proposal figures (margin %, aporte, meses)', () => {
    const seed = seedHistory(profile, goal, margin, risk)
    const summary = seed[1].content
    const proposalText = buildProposalPlan(profile, goal, risk).text

    const renderedPct = formatPct(margin)
    const renderedAporte = formatARS(monthlyContribution(profile, margin))

    // margin % and monthly contribution appear in BOTH, identically rendered.
    expect(summary).toContain(renderedPct)
    expect(proposalText).toContain(renderedPct)
    expect(summary).toContain(renderedAporte)
    expect(proposalText).toContain(renderedAporte)

    // months projection matches between seed and proposal.
    const seedMonths = monthsIn(summary)
    const proposalMonths = monthsIn(proposalText)
    expect(seedMonths).not.toBeNull()
    expect(seedMonths).toBe(proposalMonths)
  })

  test('seed summary names the declared risk profile', () => {
    const seed = seedHistory(profile, goal, margin, 'agresivo')
    expect(seed[1].content.toLowerCase()).toContain('agresivo')
  })
})

describe('buildProposalPlan (planGoal-driven tri-state)', () => {
  test('comodo: $500.000 / 12 meses moderado → 3,5%, on time', () => {
    const plan = buildProposalPlan(profile, { type: 'meta', amount: 500_000, months: 12 }, 'moderado')
    expect(plan.status).toBe('comodo')
    expect(formatPct(plan.marginFraction)).toBe('3,5%')
    expect(plan.text).toContain('12 meses')
    expect(plan.hasCta).toBe(true)
  })

  test('ajustado: $500.000 / 6 meses moderado → capped at 7%, slips to 7 meses', () => {
    const plan = buildProposalPlan(profile, { type: 'meta', amount: 500_000, months: 6 }, 'moderado')
    expect(plan.status).toBe('ajustado')
    expect(formatPct(plan.marginFraction)).toBe('7%')
    expect(plan.monthsAtMargin).toBe(7)
  })

  test('inviable: $1.000.000 / 3 meses agresivo → best 9,2%, honest 10 meses', () => {
    const plan = buildProposalPlan(profile, { type: 'meta', amount: 1_000_000, months: 3 }, 'agresivo')
    expect(plan.status).toBe('inviable')
    expect(formatPct(plan.marginFraction)).toBe('9,2%')
    expect(plan.monthsAtMargin).toBe(10)
    expect(plan.hasCta).toBe(true)
  })

  test('overrideMargin re-renders cited figures (decision #27)', () => {
    const plan = buildProposalPlan(
      profile,
      { type: 'meta', amount: 500_000, months: 12 },
      'moderado',
      0.03,
    )
    expect(formatPct(plan.marginFraction)).toBe('3%')
    expect(plan.text).toContain(formatARS(monthlyContribution(profile, 0.03)))
  })
})

describe('buildOpenPlan (amount-less rendir/nose)', () => {
  test('uses computeOptimalMargin at the session risk; conservador < moderado', () => {
    const cons = buildOpenPlan(profile, 'conservador')
    const mod = buildOpenPlan(profile, 'moderado')
    expect(cons.marginFraction).toBeLessThan(mod.marginFraction)
    expect(cons.hasCta).toBe(true)
  })
})

describe('hasSustainableProposal', () => {
  test('true for the canonical comodo goal', () => {
    expect(hasSustainableProposal(profile, goal, risk)).toBe(true)
  })
})
