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
  savingsCapacity,
  computeOptimalMargin,
  clampMargin,
  sweepForPayment,
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

/** The es-AR rendering of the tendencies line (REAL trend data, plain words). */
function tendenciesLine(profile: UserProfile): string {
  const p = strings.proposal
  const gasto = trendOf(profile.gastoMensualHist)
  const liq = trendOf(profile.liquidezFinDeMes)
  // pct sign: keep the "+5,9%" / "-3,1%" feel; formatPct already adds the sign
  // for negatives, so prepend "+" only for non-negative non-zero values.
  const pct = (f: number) => {
    const s = formatPct(f)
    return f > 0 ? `+${s}` : s
  }
  return interpolate(p.tendencies, {
    gasto: formatARS(profile.gastoMensual),
    gastoPct: pct(gasto.pct),
    liqPct: pct(liq.pct),
  })
}

/**
 * The MECHANISM bubble (iteration 3): teach the round-up before the proposal so a
 * judge understands the product. The café→sweep example uses the DEMO_PAYMENT
 * amount and the suggested margin for this profile+goal (or the open optimum),
 * so the number a judge sees here matches what they'll see paying the café.
 */
function mechanismLine(profile: UserProfile, goal: Goal, risk: RiskProfile): string {
  const p = strings.proposal
  const hasTarget = !!(goal.amount && goal.amount > 0 && goal.months && goal.months > 0)
  const margin = hasTarget
    ? planGoal(profile, risk, goal.amount!, goal.months!).marginFraction
    : computeOptimalMargin({ ...profile, riskProfile: risk })
  const cafe = DEMO_PAYMENT.amount
  const sweep = margin > 0 ? sweepForPayment(cafe, margin) : 0
  return interpolate(p.mechanism, {
    cafe: formatARS(cafe),
    sweep: formatARS(sweep),
  })
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

/**
 * The bubbles shown BEFORE the interactive proposal block (iteration 3): the
 * plain-words tendencies line (decision #28) THEN the mechanism bubble that
 * teaches the round-up (café → sweep). The tri-state proposal itself is rendered
 * interactively by the component (tappable margin chip + CTAs), not a bubble.
 * One idea per bubble, ≤2 lines each.
 */
export function buildProposalMessages(
  profile: UserProfile,
  goal: Goal,
  risk: RiskProfile,
): ChatMessage[] {
  return [assistant(tendenciesLine(profile)), assistant(mechanismLine(profile, goal, risk))]
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
