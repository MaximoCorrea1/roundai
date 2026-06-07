// Seed-vs-proposal number parity (decisions #10, #14, #25): the figures in the
// seeded onboarding summary MUST equal the figures in the on-screen proposal
// (the live coach quotes the seed). The seed now also carries the chosen plazo
// (decision #25). Relative imports: vitest doesn't resolve tsconfig `@/` paths.

import { describe, expect, test } from 'vitest'
import {
  buildProposalPlan,
  buildProposalMessages,
  buildOpenPlan,
  buildMechanismVisual,
  buildNumbersBreakdown,
  buildMarginAnchor,
  buildScenariosLine,
  goalLabelOf,
  seedHistory,
  hasSustainableProposal,
} from './proposal'
import { profiles, activeProfile } from '../data/profiles'
import {
  planGoal,
  trendOf,
  scenarioMonths,
  monthsAtRate,
  savingsCapacity,
  formatARS,
  formatPct,
  monthlyContribution,
  sweepForPayment,
} from './roundup'
import { DEMO_PAYMENT } from '../data/transactions'
import type { RiskProfile } from './roundup'
import type { Goal as ChatGoal } from './chat-types'

const profile = activeProfile()
const lu = profiles.find((p) => p.id === 'lu')!
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

// ── iteration 3: goal name + explanative coach copy ─────────────────────────

describe('goalLabelOf (iteration 3)', () => {
  test('uses the user-given label when present', () => {
    expect(goalLabelOf({ type: 'meta', label: 'La compu' })).toBe('La compu')
  })
  test('trims whitespace', () => {
    expect(goalLabelOf({ type: 'meta', label: '  La compu  ' })).toBe('La compu')
  })
  test('falls back to the type default when no/blank label', () => {
    expect(goalLabelOf({ type: 'meta' })).toBe('Mi meta')
    expect(goalLabelOf({ type: 'ahorrar', label: '   ' })).toBe('Mi ahorro')
  })
})

describe('proposal cites the goal by name (iteration 3)', () => {
  test('comodo text names the goal', () => {
    const named: ChatGoal = { type: 'meta', amount: 500_000, months: 12, label: 'La compu' }
    const plan = buildProposalPlan(profile, named, 'moderado')
    expect(plan.text).toContain('La compu')
  })
  test('seed user turn carries the goal name', () => {
    const named: ChatGoal = { type: 'meta', amount: 500_000, months: 12, label: 'La compu' }
    const seed = seedHistory(profile, named, margin, risk)
    expect(seed[0].content).toContain('La compu')
  })
})

describe('buildProposalMessages (iteration 4 — direction-aware tendencies only)', () => {
  test('emits exactly the tendencies bubble (mechanism is now a visual card)', () => {
    const msgs = buildProposalMessages(profile)
    expect(msgs).toHaveLength(1)
    expect(msgs[0].role).toBe('assistant')
    // tendencies cites the spend figure.
    expect(msgs[0].content).toContain(formatARS(profile.gastoMensual))
  })
})

// ── iteration 4: direction-aware tendencies (CLIENT BUG FIX) ─────────────────

describe('tendencies are DIRECTION-AWARE per series (iteration 4 bug fix)', () => {
  test('mati (both series rising) reads "viene subiendo (+X%)" for both, no contradiction', () => {
    const msg = buildProposalMessages(profile)[0].content
    const gasto = trendOf(profile.gastoMensualHist)
    const liq = trendOf(profile.liquidezFinDeMes)
    expect(gasto.direction).toBe('sube')
    expect(liq.direction).toBe('sube')
    // both phrased as rising; the contradictory "viene creciendo (−1,9%)" can't occur.
    expect(msg).toContain('viene subiendo')
    expect(msg).not.toContain('viene bajando')
    // closing anchor present exactly once.
    expect(msg).toContain('comparando tus últimos meses')
  })

  test('lu (both series estable) reads "se mantiene estable" with NO percentage', () => {
    const msg = buildProposalMessages(lu)[0].content
    const gasto = trendOf(lu.gastoMensualHist)
    const liq = trendOf(lu.liquidezFinDeMes)
    expect(gasto.direction).toBe('estable')
    expect(liq.direction).toBe('estable')
    expect(msg).toContain('se mantiene estable')
    // estable carries NO % — neither the +0,8% nor the −1,9% leaks in.
    expect(msg).not.toContain('0,8%')
    expect(msg).not.toContain('1,9%')
    expect(msg).not.toContain('viene subiendo')
    expect(msg).not.toContain('viene bajando')
    expect(msg).not.toContain('viene creciendo')
  })
})

describe('buildMechanismVisual (iteration 4 — inline split card data)', () => {
  test('payAmount/toMerchant = café; toGoal = sweep at the suggested margin', () => {
    const v = buildMechanismVisual(profile, goal, risk)
    const m = planGoal(profile, risk, goal.amount!, goal.months!).marginFraction
    expect(v.payAmount).toBe(formatARS(DEMO_PAYMENT.amount))
    expect(v.toMerchant).toBe(formatARS(DEMO_PAYMENT.amount))
    expect(v.toGoal).toBe(formatARS(sweepForPayment(DEMO_PAYMENT.amount, m)))
  })
})

describe('buildNumbersBreakdown (iteration 4 — TUS NÚMEROS)', () => {
  test('ingresos/gastos/te-queda + margin formula all calculator-derived', () => {
    const n = buildNumbersBreakdown(profile, margin)
    expect(n.ingresos).toBe(formatARS(profile.ingresoMensual))
    expect(n.gastos).toBe(formatARS(profile.gastoMensual))
    expect(n.queda).toBe(formatARS(savingsCapacity(profile)))
    expect(n.aporte).toBe(formatARS(monthlyContribution(profile, margin)))
    expect(n.margenPct).toBe(formatPct(margin))
  })
})

describe('buildMarginAnchor (iteration 4 — plain-words % anchor)', () => {
  test('reads "{pct} = de cada $ 100, {pesos} a tu meta" via sweepForPayment(100)', () => {
    const anchor = buildMarginAnchor(margin)
    expect(anchor).toContain(formatPct(margin))
    expect(anchor).toContain(formatARS(100))
    expect(anchor).toContain(formatARS(sweepForPayment(100, margin)))
  })
  test('margin ≤ 0 → empty (no anchor)', () => {
    expect(buildMarginAnchor(0)).toBe('')
  })
})

describe('buildScenariosLine (iteration 4 — returns-aware range)', () => {
  test('mati 3,5% / $500.000 → sin 12, esperado ~11, rango 10–12', () => {
    const line = buildScenariosLine(profile, margin, 500_000)
    const monthly = monthlyContribution(profile, margin)
    const sin = monthsAtRate(500_000, monthly).months
    const s = scenarioMonths(monthly, 500_000)
    expect(line).toContain(`${sin} meses`)
    expect(line).toContain(`~${s.esperado} meses`)
    expect(line).toContain(`${s.optimista}–${s.pesimista}`)
    expect(line).toContain('simulado, no garantizado')
    // ground-truth the demo figures the client called out.
    expect(sin).toBe(12)
    expect(s).toEqual({ pesimista: 12, esperado: 11, optimista: 10 })
  })
  test('amount ≤ 0 or margin ≤ 0 → empty', () => {
    expect(buildScenariosLine(profile, margin, 0)).toBe('')
    expect(buildScenariosLine(profile, 0, 500_000)).toBe('')
  })
})
