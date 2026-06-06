// Seed-vs-proposal number parity (spec decisions #10, #14): the figures in the
// seeded onboarding summary MUST equal the figures in the on-screen proposal
// bubbles — otherwise the live coach quotes numbers that don't match what the
// user just saw. Relative imports: vitest doesn't resolve tsconfig `@/` paths.

import { describe, expect, test } from 'vitest'
import { buildProposalMessages, seedHistory } from './proposal'
import { activeProfile } from '../data/profiles'
import { computeOptimalMargin, formatARS, formatPct, monthlyContribution } from './roundup'
import type { Goal } from './chat-types'

const profile = activeProfile()
const goal: Goal = { type: 'meta', amount: 500_000 }
const margin = computeOptimalMargin(profile)

/** Extract the months figure from a "~N meses" rendering. */
function monthsIn(text: string): string | null {
  const m = text.match(/~?(\d+)\s+meses/)
  return m ? m[1] : null
}

describe('seedHistory', () => {
  test('returns an alternation-safe user→assistant pair', () => {
    const seed = seedHistory(profile, goal, margin)
    expect(seed).toHaveLength(2)
    expect(seed[0].role).toBe('user')
    expect(seed[1].role).toBe('assistant')
  })

  test('user turn renders the goal label + amount', () => {
    const seed = seedHistory(profile, goal, margin)
    expect(seed[0].content).toContain('Quiero llegar a esta meta')
    expect(seed[0].content).toContain(formatARS(goal.amount!))
  })

  test('seed summary figures === proposal-bubble figures', () => {
    const seed = seedHistory(profile, goal, margin)
    const summary = seed[1].content
    const proposalText = buildProposalMessages(profile, goal)
      .map((m) => m.content)
      .join('\n')

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
})
