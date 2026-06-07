// Templated margin proposal v2 (decisions #25, #28) — REAL math, ZERO API.
// Every figure here comes from the one calculator (src/lib/roundup.ts) via
// planGoal/trendOf/etc.; every word comes from src/data/strings.ts. Components
// receive ready-to-render text and a structured plan; they never touch copy or
// numbers themselves.
//
// The flow: amount + plazo → planGoal(profile, sessionRisk, amount, months) →
// tri-state feasibility (comodo / ajustado / inviable). The margin is rendered
// as a TAPPABLE chip by the component, so the proposal line is split into a
// prefix + the margin token + a suffix — see buildProposalPlan.

import type { Goal, ChatMessage, GoalType } from './chat-types'
import type { UserProfile, RiskProfile } from './roundup'
import {
  planGoal,
  trendOf,
  monthlyContribution,
  monthsToGoal,
  monthsAtRate,
  scenarioMonths,
  savingsCapacity,
  computeOptimalMargin,
  clampMargin,
  sweepForPayment,
  simulateReturns,
  formatARS,
  formatPct,
} from './roundup'
import { DEMO_PAYMENT } from '../data/transactions'
import { strings } from '../data/strings'

/** The display name for a goal: the user's label if set, else the type default. */
export function goalLabelOf(goal: Goal): string {
  return goal.label?.trim() || strings.onboarding.goalLabels[goal.type as GoalType]
}

type PlanStatus = 'comodo' | 'ajustado' | 'inviable'

/**
 * The structured proposal the component renders interactively (the margin is a
 * tappable chip, so it can't be plain bubble text). `marginFraction` is the
 * value to show/tweak; `monthsAtMargin` is the honest timeline at that margin
 * (null only in the degenerate no-capacity case). `text` is the full line with
 * the margin already rendered, used verbatim for the seeded coach history so
 * the live coach quotes exactly what the user saw.
 */
export interface ProposalPlan {
  status: PlanStatus
  marginFraction: number
  monthsAtMargin: number | null
  /** Full proposal line with the margin rendered inline (for seed + a11y). */
  text: string
  /** Honest copy with no CTA (degenerate inviable: no sustainable margin). */
  hasCta: boolean
  /** The capacity-derived hard ceiling for the tweaker, as a fraction. */
  capacityCapFraction: number
}

// ── PHASE 9 · THE STORY CHAIN ────────────────────────────────────────────────
// The proposal phase is ONE linear story: 5 sequential beats (S1–S5) where each
// number feeds the next, plus the StoryChainCard (a connected vertical flow that
// IS the pitch). EVERYTHING is computed once from the EFFECTIVE margin so the
// whole story is margin-reactive — tweak the chip and every figure moves.

/** Resolve the effective margin + tri-state for a goal (target-driven or open). */
function resolveStoryMargin(
  profile: UserProfile,
  goal: Goal,
  risk: RiskProfile,
  overrideMargin?: number,
): { margin: number; status: PlanStatus; hasTarget: boolean; planMargin: number } {
  const hasTarget = !!(goal.amount && goal.amount > 0 && goal.months && goal.months > 0)
  if (hasTarget) {
    const plan = planGoal(profile, risk, goal.amount!, goal.months!)
    const margin =
      overrideMargin && overrideMargin > 0 ? clampMargin(overrideMargin) : plan.marginFraction
    return { margin, status: plan.status, hasTarget, planMargin: plan.marginFraction }
  }
  const suggested = computeOptimalMargin({ ...profile, riskProfile: risk })
  const margin = overrideMargin && overrideMargin > 0 ? clampMargin(overrideMargin) : suggested
  // Open plans are always framed comodo (a sustainable open-ended habit).
  return { margin, status: 'comodo', hasTarget, planMargin: suggested }
}

/** All figures the 5-beat story + the chain card cite, computed ONCE from the effective margin. */
export interface StoryFigures {
  /** present when the goal has a sustainable margin (a story to tell). */
  hasStory: boolean
  margin: number
  pct: string
  gasto: string
  aporte: string
  capacity: string
  ingresos: string
  gastos: string
  /** true when the leftover-liquidity series trends up (S3 trailing clause). */
  sobranteSube: boolean
  aportado12: string
  total12: string
  rend12: string
}

/**
 * Compute the shared figures for the story (S1–S4 + the chain card). All derive
 * from the EFFECTIVE margin (override or plan/optimum), so they re-render as one
 * when the margin is tweaked. `hasStory` is false only in the degenerate case
 * where no sustainable margin exists at all.
 */
export function buildStoryFigures(
  profile: UserProfile,
  goal: Goal,
  risk: RiskProfile,
  overrideMargin?: number,
): StoryFigures {
  const { margin } = resolveStoryMargin(profile, goal, risk, overrideMargin)
  if (margin <= 0) {
    return {
      hasStory: false,
      margin: 0,
      pct: '',
      gasto: '',
      aporte: '',
      capacity: '',
      ingresos: '',
      gastos: '',
      sobranteSube: false,
      aportado12: '',
      total12: '',
      rend12: '',
    }
  }
  const aporte = monthlyContribution(profile, margin)
  const sim = simulateReturns(aporte, 12)
  return {
    hasStory: true,
    margin,
    pct: formatPct(margin),
    gasto: formatARS(profile.gastoMensual),
    aporte: formatARS(aporte),
    capacity: formatARS(savingsCapacity(profile)),
    ingresos: formatARS(profile.ingresoMensual),
    gastos: formatARS(profile.gastoMensual),
    sobranteSube: trendOf(profile.liquidezFinDeMes).direction === 'sube',
    aportado12: formatARS(sim.aportado),
    total12: formatARS(sim.total),
    rend12: formatARS(sim.rendimiento),
  }
}

/**
 * The 5-beat sequential story (S1–S5), as ordered rendered strings — paced by the
 * ChatScreen with a typing indicator between beats. Every figure derives from the
 * EFFECTIVE margin so a margin tweak re-renders ALL beats together. S5 is
 * tri-state (comodo / ajustado / inviable) and LEADS with the returns-aware
 * (esperado) timeline. Open goals (rendir/nose) drop S5's deadline framing.
 *
 * The degenerate no-capacity case (no sustainable margin) returns a single honest
 * line (p.unreachable) instead of the story. Each line is ≤2 rendered lines at
 * 393px and may carry *bold* emphasis (rendered by MessageBubble.renderEmphasis).
 */
export function buildStoryBeats(
  profile: UserProfile,
  goal: Goal,
  risk: RiskProfile,
  overrideMargin?: number,
): string[] {
  const p = strings.proposal
  const fig = buildStoryFigures(profile, goal, risk, overrideMargin)
  if (!fig.hasStory) return [p.unreachable]

  const s = p.story
  const s1 = interpolate(s.s1, { pct: fig.pct })
  const s2 = interpolate(s.s2, { gasto: fig.gasto, pct: fig.pct, aporte: fig.aporte })
  const s3 = interpolate(s.s3, {
    capacity: fig.capacity,
    ingresos: fig.ingresos,
    gastos: fig.gastos,
    sobranteTrend: fig.sobranteSube ? s.s3SobranteSube : '',
  })
  const s4 = interpolate(s.s4, {
    aportado12: fig.aportado12,
    total12: fig.total12,
    rend12: fig.rend12,
  })
  const s5 = buildStoryPlanBeat(profile, goal, risk, overrideMargin)

  return [s1, s2, s3, s4, s5]
}

/** S5 — the closing PLAN beat: tri-state, returns-aware, leads with esperado. */
export function buildStoryPlanBeat(
  profile: UserProfile,
  goal: Goal,
  risk: RiskProfile,
  overrideMargin?: number,
): string {
  const s = strings.proposal.story
  const { margin, status, hasTarget } = resolveStoryMargin(profile, goal, risk, overrideMargin)
  const goalLabel = goalLabelOf(goal)
  const capacity = formatARS(savingsCapacity(profile))

  // Open plan (rendir/nose): no deadline → no timeline framing.
  if (!hasTarget) {
    return interpolate(s.s5Open, {
      margen: formatPct(margin),
      aporte: formatARS(monthlyContribution(profile, margin)),
      capacity,
    })
  }

  const amount = goal.amount!
  const months = goal.months!
  const monthly = monthlyContribution(profile, margin)
  const sin = monthsAtRate(amount, monthly).months
  const sc = scenarioMonths(monthly, amount)
  // Honest fallbacks when a scenario can't be reached (never NaN/Infinity on screen).
  const mesesEsperado = sc.esperado != null ? String(sc.esperado) : (sin != null ? String(sin) : '—')
  const mesesSin = sin != null ? String(sin) : '—'
  const optimista = sc.optimista != null ? String(sc.optimista) : mesesEsperado
  const pesimista = sc.pesimista != null ? String(sc.pesimista) : mesesEsperado

  const shared = {
    goalLabel,
    amount: formatARS(amount),
    months: String(months),
    margen: formatPct(margin),
    mesesEsperado,
    mesesSin,
    optimista,
    pesimista,
    capacity,
  }

  switch (status) {
    case 'comodo':
      return interpolate(s.s5Comodo, shared)
    case 'ajustado':
      return interpolate(s.s5Ajustado, {
        ...shared,
        required: formatARS(amount / months),
        risk: strings.onboarding.quiz.labels[risk].toLowerCase(),
      })
    case 'inviable':
      return interpolate(s.s5Inviable, shared)
  }
}

/**
 * The StoryChainCard data: a vertical connected flow that IS the pitch —
 * compra(+pct) → gastás/mes → invertís/mes → ≈total12 (+rend). Every value
 * pre-rendered from the EFFECTIVE margin so the card re-renders with the beats on
 * a tweak. `hasChain` mirrors StoryFigures.hasStory.
 */
export interface StoryChain {
  hasChain: boolean
  /** round-up badge text, e.g. "+3,5%". */
  roundBadge: string
  /** café example amount (DEMO_PAYMENT) + its sweep at the margin. */
  cafeAmount: string
  cafeSweep: string
  /** monthly spend (the round-up base). */
  gasto: string
  /** monthly contribution at the margin. */
  aporte: string
  /** "12 meses · FCI {risk}" connector. */
  horizon: string
  /** the 12-month simulated total + the return delta note. */
  total12: string
  returnNote: string
}

export function buildStoryChain(
  profile: UserProfile,
  goal: Goal,
  risk: RiskProfile,
  overrideMargin?: number,
): StoryChain {
  const c = strings.proposal.chain
  const fig = buildStoryFigures(profile, goal, risk, overrideMargin)
  if (!fig.hasStory) {
    return {
      hasChain: false,
      roundBadge: '',
      cafeAmount: '',
      cafeSweep: '',
      gasto: '',
      aporte: '',
      horizon: '',
      total12: '',
      returnNote: '',
    }
  }
  const cafe = DEMO_PAYMENT.amount
  return {
    hasChain: true,
    roundBadge: interpolate(c.roundBadge, { pct: fig.pct }),
    cafeAmount: formatARS(cafe),
    cafeSweep: formatARS(sweepForPayment(cafe, fig.margin)),
    gasto: fig.gasto,
    aporte: fig.aporte,
    horizon: interpolate(c.twelveMonths, {
      risk: strings.onboarding.quiz.labels[risk].toLowerCase(),
    }),
    total12: fig.total12,
    returnNote: interpolate(c.returnNote, { rend: fig.rend12 }),
  }
}

/** Capacity cap as a fraction (savingsCapacity / gastoMensual), floored at 0. */
function capacityCapFraction(profile: UserProfile): number {
  if (profile.gastoMensual <= 0) return 0
  return Math.max(0, savingsCapacity(profile) / profile.gastoMensual)
}

/**
 * Build the interactive proposal plan from planGoal. `goal.amount` and
 * `goal.months` must both be present for a target-driven plan (meta/ahorrar);
 * amount-less goals (rendir/nose) never reach here — they use buildOpenPlan.
 *
 * `overrideMargin` (decision #27): when the user tweaks the margin chip, re-render
 * the SAME tri-state framing but with the override's monthly + months figures.
 * The status classification still comes from the deadline math (planGoal); the
 * override only re-renders the cited margin/contribution/timeline.
 */
export function buildProposalPlan(
  profile: UserProfile,
  goal: Goal,
  risk: RiskProfile,
  overrideMargin?: number,
): ProposalPlan {
  const p = strings.proposal
  const amount = goal.amount ?? 0
  const months = goal.months ?? 0
  const plan = planGoal(profile, risk, amount, months)
  const capCap = capacityCapFraction(profile)

  // Degenerate inviable: no sustainable margin exists at all → honest, no CTA.
  if (plan.status === 'inviable' && plan.monthsAtMargin === null) {
    return {
      status: 'inviable',
      marginFraction: 0,
      monthsAtMargin: null,
      text: p.unreachable,
      hasCta: false,
      capacityCapFraction: capCap,
    }
  }

  // Effective margin: the override (if a positive one was committed) else the
  // plan's suggested margin. All cited figures derive from this.
  const margin =
    overrideMargin && overrideMargin > 0 ? clampMargin(overrideMargin) : plan.marginFraction
  const capacity = savingsCapacity(profile)
  const monthly = monthlyContribution(profile, margin)
  const monthsAtMargin = monthsAtRate(amount, monthly).months
  const margen = formatPct(margin)
  const goalLabel = goalLabelOf(goal)
  let text: string

  switch (plan.status) {
    case 'comodo':
      text = interpolate(p.comodo, {
        goalLabel,
        amount: formatARS(amount),
        months: String(monthsAtMargin ?? months),
        monthly: formatARS(monthly),
        margen,
        capacity: formatARS(capacity),
      })
      break
    case 'ajustado':
      text = interpolate(p.ajustado, {
        goalLabel,
        months: String(months),
        required: formatARS(amount / months),
        risk: strings.onboarding.quiz.labels[risk].toLowerCase(),
        margen,
        monthsAtMargin: String(monthsAtMargin),
      })
      break
    case 'inviable':
      text = interpolate(p.inviable, {
        goalLabel,
        capacity: formatARS(capacity),
        months: String(months),
        margen,
        monthsAtMargin: String(monthsAtMargin),
      })
      break
  }

  return {
    status: plan.status,
    marginFraction: margin,
    monthsAtMargin,
    text,
    hasCta: true,
    capacityCapFraction: capCap,
  }
}

/**
 * Amount-less goals ('rendir' / 'nose'): no deadline, no planGoal. The margin is
 * the sustainable optimum (computeOptimalMargin uses the SESSION risk, injected
 * by the caller via a risk-overridden profile). Returns a comodo-style plan or
 * the degenerate honest branch when no margin is sustainable.
 */
export function buildOpenPlan(
  profile: UserProfile,
  risk: RiskProfile,
  overrideMargin?: number,
): ProposalPlan {
  const p = strings.proposal
  const capCap = capacityCapFraction(profile)
  // Risk override: computeOptimalMargin reads profile.riskProfile, so swap it.
  const suggested = computeOptimalMargin({ ...profile, riskProfile: risk })

  if (suggested <= 0) {
    return {
      status: 'inviable',
      marginFraction: 0,
      monthsAtMargin: null,
      text: p.unreachable,
      hasCta: false,
      capacityCapFraction: capCap,
    }
  }

  const margin = overrideMargin && overrideMargin > 0 ? clampMargin(overrideMargin) : suggested
  const capacity = savingsCapacity(profile)
  const aporte = monthlyContribution(profile, margin)
  const text = interpolate(p.comodoOpen, {
    margen: formatPct(margin),
    monthly: formatARS(aporte),
    capacity: formatARS(capacity),
  })

  return {
    status: 'comodo',
    marginFraction: margin,
    monthsAtMargin: null,
    text,
    hasCta: true,
    capacityCapFraction: capCap,
  }
}

/** Does this profile+risk+goal support a proposal with a CTA at all? */
export function hasSustainableProposal(
  profile: UserProfile,
  goal: Goal,
  risk: RiskProfile,
): boolean {
  const plan =
    goal.amount && goal.amount > 0 && goal.months && goal.months > 0
      ? buildProposalPlan(profile, goal, risk)
      : buildOpenPlan(profile, risk)
  return plan.hasCta
}

/**
 * Build the alternation-safe seed PAIR injected at the top of the live-chat
 * history (decision #14): one synthetic USER turn (goal + plazo) + one ASSISTANT
 * onboarding summary built from the SAME planGoal/roundup calls — so the seed
 * numbers can NEVER drift from the proposal on screen. `margin` is the COMMITTED
 * (post-tweak) margin (decision #34). `risk` is the SESSION risk (decision #26).
 */
export function seedHistory(
  profile: UserProfile,
  goal: Goal,
  margin: number,
  risk: RiskProfile,
): ChatMessage[] {
  // (1) synthetic USER turn — goal option + (its name) + amount + plazo, rendered
  // from strings. When the user named the goal, lead with the name so the live
  // coach can address it ("Para La compu…").
  const goalOption = strings.onboarding.goalOptions[goal.type as GoalType]
  const named = goal.label?.trim()
  const parts: string[] = [named ? `${goalOption} (${named})` : goalOption]
  if (goal.amount && goal.amount > 0) parts.push(formatARS(goal.amount))
  if (goal.months && goal.months > 0) parts.push(`${goal.months} meses`)
  const userTurn = parts.join(', ')

  // (2) ASSISTANT onboarding summary — same roundup calls as the proposal.
  const aporte = monthlyContribution(profile, margin)
  const riskLabel = strings.onboarding.quiz.labels[risk].toLowerCase()
  let summary = `Tu perfil es ${riskLabel}. Quedamos en un margen del ${formatPct(
    margin,
  )}, ~${formatARS(aporte)} por mes.`

  if (goal.amount && goal.amount > 0) {
    const { reachable, months } = monthsToGoal(profile, margin, goal.amount)
    if (reachable && months != null) {
      summary += ` A ese ritmo llegás en ~${months} meses, sin contar rendimientos.`
    }
  }
  summary += ' Preguntame lo que quieras.'

  return [{ role: 'user', content: userTurn }, assistant(summary)]
}

function assistant(content: string): ChatMessage {
  return { role: 'assistant', content }
}

/** Replace every {key} token with its value. Keys with no value are left intact. */
function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? values[key] : match,
  )
}
