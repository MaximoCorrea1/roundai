// Seed-vs-proposal number parity (decisions #10, #14, #25): the figures in the
// seeded onboarding summary MUST equal the figures in the on-screen proposal
// (the live coach quotes the seed). The seed now also carries the chosen plazo
// (decision #25). Relative imports: vitest doesn't resolve tsconfig `@/` paths.

import { describe, expect, test } from 'vitest'
import {
  buildProposalPlan,
  buildOpenPlan,
  buildStoryBeats,
  buildStoryFigures,
  buildStoryPlanBeat,
  buildStoryChain,
  goalLabelOf,
  seedHistory,
  hasSustainableProposal,
} from './proposal'
import { profiles, activeProfile } from '../data/profiles'
import {
  planGoal,
  scenarioMonths,
  monthsAtRate,
  savingsCapacity,
  simulateReturns,
  computeOptimalMargin,
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

// ── PHASE 9 · THE STORY CHAIN ────────────────────────────────────────────────

describe('buildStoryBeats (PHASE 9 — the 5-beat sequential story)', () => {
  test('comodo goal → exactly 5 ordered beats (S1–S5)', () => {
    const beats = buildStoryBeats(profile, goal, risk)
    expect(beats).toHaveLength(5)
    beats.forEach((b) => expect(typeof b).toBe('string'))
  })

  test('degenerate (no sustainable margin) → a single honest beat, no story', () => {
    // A profile with zero leftover liquidity has no sustainable margin at all.
    const broke = { ...lu, liquidezFinDeMes: [0, 0, 0, 0, 0, 0] }
    const beats = buildStoryBeats(broke, goal, risk)
    expect(beats).toHaveLength(1)
    // honest no-CTA copy — not a numbered story beat.
    expect(beats[0]).not.toContain('Así funciona')
    expect(buildStoryFigures(broke, goal, risk).hasStory).toBe(false)
    expect(buildStoryChain(broke, goal, risk).hasChain).toBe(false)
  })

  test('each beat carries its load-bearing figure (margin chain, mati @ 3,5%)', () => {
    const [s1, s2, s3, s4, s5] = buildStoryBeats(profile, goal, risk)
    const fig = buildStoryFigures(profile, goal, risk)
    // S1 defines the %.
    expect(s1).toContain(fig.pct)
    // S2: gasto → aporte.
    expect(s2).toContain(fig.gasto)
    expect(s2).toContain(fig.aporte)
    // S3: liquidity breakdown (capacity, ingresos, gastos).
    expect(s3).toContain(fig.capacity)
    expect(s3).toContain(fig.ingresos)
    // S4: the return (aportado12, total12, rend12 + "simulado").
    expect(s4).toContain(fig.aportado12)
    expect(s4).toContain(fig.total12)
    expect(s4).toContain(fig.rend12)
    expect(s4).toContain('simulado')
    // S5: the plan, returns-aware, names the goal + cites both timelines.
    expect(s5).toContain(goalLabelOf(goal))
    expect(s5).toContain(formatARS(goal.amount!))
  })

  test('S3 trailing trend clause appears only when leftover liquidity rises', () => {
    // mati's liquidity trends up → the clause shows.
    const mati3 = buildStoryBeats(profile, goal, risk)[2]
    expect(mati3).toContain('ese sobrante viene subiendo')
    // lu's liquidity is estable → no trend clause.
    const lu3 = buildStoryBeats(lu, { type: 'rendir' }, 'conservador')[2]
    expect(lu3).not.toContain('ese sobrante viene subiendo')
  })
})

describe('buildStoryFigures (PHASE 9 — shared figures, margin-reactive)', () => {
  test('mati @ 3,5% (default plan margin) — exact ground-truth figures', () => {
    const fig = buildStoryFigures(profile, goal, risk)
    const m = planGoal(profile, risk, goal.amount!, goal.months!).marginFraction
    const sim = simulateReturns(monthlyContribution(profile, m), 12)
    expect(fig.pct).toBe('3,5%')
    expect(fig.gasto).toBe(formatARS(profile.gastoMensual)) // $ 1.180.000
    expect(fig.aporte).toBe(formatARS(monthlyContribution(profile, m))) // $ 41.667
    expect(fig.capacity).toBe(formatARS(savingsCapacity(profile))) // $ 108.333
    expect(fig.ingresos).toBe(formatARS(profile.ingresoMensual)) // $ 1.450.000
    expect(fig.aportado12).toBe(formatARS(sim.aportado)) // $ 500.000
    expect(fig.total12).toBe(formatARS(sim.total)) // $ 588.543
    expect(fig.rend12).toBe(formatARS(sim.rendimiento)) // $ 88.543
    expect(fig.sobranteSube).toBe(true)
  })

  test('the whole story is margin-reactive: 7% override moves every figure', () => {
    const fig = buildStoryFigures(profile, goal, risk, 0.07)
    const sim = simulateReturns(monthlyContribution(profile, 0.07), 12)
    expect(fig.pct).toBe('7%')
    expect(fig.aporte).toBe(formatARS(monthlyContribution(profile, 0.07))) // $ 82.600
    expect(fig.aportado12).toBe(formatARS(sim.aportado)) // $ 991.200
    expect(fig.total12).toBe(formatARS(sim.total)) // $ 1.166.727
    expect(fig.rend12).toBe(formatARS(sim.rendimiento)) // +$ 175.527
  })
})

describe('buildStoryPlanBeat (PHASE 9 — S5 tri-state, LEADS with esperado)', () => {
  test('comodo: leads with the returns-aware (esperado) timeline, then sin/rango', () => {
    const s5 = buildStoryPlanBeat(profile, goal, risk)
    const monthly = monthlyContribution(profile, margin)
    const sin = monthsAtRate(500_000, monthly).months
    const sc = scenarioMonths(monthly, 500_000)
    // ground-truth (client-called figures): esperado 11, sin 12, rango 10–12.
    expect(sin).toBe(12)
    expect(sc).toEqual({ pesimista: 12, esperado: 11, optimista: 10 })
    expect(s5).toContain(`~*${sc.esperado}* meses`) // the esperado leads, in bold
    expect(s5).toContain(`${sin} sin rendimientos`)
    expect(s5).toContain(`${sc.optimista}–${sc.pesimista}`)
    expect(s5).toContain('simulado, no garantizado')
  })

  test('ajustado: $500.000 / 6 meses moderado → names the perfil cap + returns-aware esperado', () => {
    const tight: ChatGoal = { type: 'meta', amount: 500_000, months: 6 }
    const s5 = buildStoryPlanBeat(profile, tight, 'moderado')
    expect(s5).toContain('tope de tu perfil moderado')
    // capped at 7% → esperado scenario at that monthly.
    const monthly = monthlyContribution(profile, 0.07)
    const sc = scenarioMonths(monthly, 500_000)
    expect(s5).toContain(`~*${sc.esperado}* meses`)
  })

  test('open (rendir): no deadline framing — sustainable open plan', () => {
    const m = computeOptimalMargin({ ...profile, riskProfile: risk })
    const s5 = buildStoryPlanBeat(profile, { type: 'rendir' }, risk)
    expect(s5).toContain(formatPct(m))
    expect(s5).toContain(formatARS(monthlyContribution(profile, m)))
    expect(s5).not.toContain('sin rendimientos')
  })
})

describe('buildStoryChain (PHASE 9 — the connected flow card)', () => {
  test('café→sweep, gastás, invertís, 12-mo total — all from the effective margin', () => {
    const chain = buildStoryChain(profile, goal, risk)
    const fig = buildStoryFigures(profile, goal, risk)
    expect(chain.hasChain).toBe(true)
    expect(chain.roundBadge).toBe(`+${fig.pct}`)
    expect(chain.cafeAmount).toBe(formatARS(DEMO_PAYMENT.amount))
    expect(chain.cafeSweep).toBe(formatARS(sweepForPayment(DEMO_PAYMENT.amount, fig.margin))) // $ 154
    expect(chain.gasto).toBe(fig.gasto)
    expect(chain.aporte).toBe(fig.aporte)
    expect(chain.total12).toBe(fig.total12)
    expect(chain.returnNote).toContain(fig.rend12)
  })

  test('margin-reactive: 7% override moves the café sweep + total', () => {
    const chain = buildStoryChain(profile, goal, risk, 0.07)
    expect(chain.roundBadge).toBe('+7%')
    expect(chain.cafeSweep).toBe(formatARS(sweepForPayment(DEMO_PAYMENT.amount, 0.07))) // $ 305
    expect(chain.total12).toBe(formatARS(simulateReturns(monthlyContribution(profile, 0.07), 12).total))
  })
})
