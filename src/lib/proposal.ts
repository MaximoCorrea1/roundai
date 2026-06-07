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

/**
 * The es-AR rendering of the tendencies line (REAL trend data, plain words).
 *
 * DIRECTION-AWARE (iteration-4 bug fix): each series (spend, leftover) is phrased
 * from its OWN trendOf().direction — "viene subiendo (+X%)" / "viene bajando
 * (−X%)" / "se mantiene estable". The estable branch carries NO percentage (a
 * ±2% number beside "estable" only confuses). The percent is anchored ONCE by the
 * closing "comparando tus últimos meses" clause in the template, not per-number.
 */
function tendenciesLine(profile: UserProfile): string {
  const p = strings.proposal
  const gasto = trendOf(profile.gastoMensualHist)
  const liq = trendOf(profile.liquidezFinDeMes)
  return interpolate(p.tendencies, {
    gasto: formatARS(profile.gastoMensual),
    gastoPhrase: trendPhrase(p.tendencyVerbs.gasto, gasto),
    liqPhrase: trendPhrase(p.tendencyVerbs.liq, liq),
  })
}

/** Build one direction-aware phrase: sube/baja get a signed pct; estable gets none. */
function trendPhrase(
  verbs: { sube: string; baja: string; estable: string },
  trend: { direction: 'sube' | 'estable' | 'baja'; pct: number },
): string {
  if (trend.direction === 'estable') return verbs.estable
  // formatPct already prefixes "-" for negatives; add "+" for the positive case.
  const s = formatPct(trend.pct)
  const signed = trend.pct > 0 ? `+${s}` : s
  return verbs[trend.direction].replace('{pct}', signed)
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

/**
 * Structured inputs for the inline mechanism VISUAL (iteration-4): the payment
 * row + the split into merchant + sweep. Reuses the payment split language so one
 * glance = understood. All figures calculator-derived (café amount, sweep at the
 * effective margin). The component renders the arrow/card; this hands it numbers.
 */
export interface MechanismVisual {
  /** café label + amount (the row at the top of the card). */
  payAmount: string
  /** what the merchant gets (= the café amount; the payment is unchanged). */
  toMerchant: string
  /** the round-up that travels to the goal (sweepForPayment at the margin). */
  toGoal: string
}

export function buildMechanismVisual(
  profile: UserProfile,
  goal: Goal,
  risk: RiskProfile,
): MechanismVisual {
  const hasTarget = !!(goal.amount && goal.amount > 0 && goal.months && goal.months > 0)
  const margin = hasTarget
    ? planGoal(profile, risk, goal.amount!, goal.months!).marginFraction
    : computeOptimalMargin({ ...profile, riskProfile: risk })
  const cafe = DEMO_PAYMENT.amount
  const sweep = margin > 0 ? sweepForPayment(cafe, margin) : 0
  return {
    payAmount: formatARS(cafe),
    toMerchant: formatARS(cafe),
    toGoal: formatARS(sweep),
  }
}

/**
 * Structured "TUS NÚMEROS" breakdown (iteration-4): ingresos − gastos → te queda,
 * plus margen = aporte ÷ gastos. ALL figures from the calculator; the component
 * renders compact tabular rows. `margin` is the effective (committed/plan) margin
 * so the aporte + percent match the proposal on screen.
 */
export interface NumbersBreakdown {
  ingresos: string
  gastos: string
  queda: string
  aporte: string
  margenPct: string
}

export function buildNumbersBreakdown(profile: UserProfile, margin: number): NumbersBreakdown {
  return {
    ingresos: formatARS(profile.ingresoMensual),
    gastos: formatARS(profile.gastoMensual),
    queda: formatARS(savingsCapacity(profile)),
    aporte: formatARS(monthlyContribution(profile, margin)),
    margenPct: formatPct(margin),
  }
}

/**
 * The plain-words anchor for the margin % (iteration-4 "explicá los % mejor"):
 * "{pct} = de cada $ 100 que gastás, {pesos} van a tu meta". {pesos} derives via
 * sweepForPayment(100, margin) so the anchor uses the SAME per-payment math the
 * round-up uses everywhere (no separate rounding). margin ≤ 0 → empty (no anchor).
 */
export function buildMarginAnchor(margin: number): string {
  if (margin <= 0) return ''
  return interpolate(strings.proposal.marginAnchor, {
    pct: formatPct(margin),
    cien: formatARS(100),
    pesos: formatARS(sweepForPayment(100, margin)),
  })
}

/**
 * The SCENARIOS line (iteration-4): the proposal is an INVESTMENT, not a piggy
 * bank — show the sweep-only timeline AND the returns-aware range. {sin} =
 * monthsAtRate (flat sweep), {esperado}/{optimista}/{pesimista} =
 * scenarioMonths(monthly, amount). Returns '' for open/amount-less plans or when
 * any scenario is unreachable (no honest range to show). `margin` is the
 * effective margin; `amount` the goal target.
 */
export function buildScenariosLine(profile: UserProfile, margin: number, amount: number): string {
  if (!(amount > 0) || margin <= 0) return ''
  const monthly = monthlyContribution(profile, margin)
  const sin = monthsAtRate(amount, monthly).months
  const s = scenarioMonths(monthly, amount)
  if (sin == null || s.esperado == null || s.optimista == null || s.pesimista == null) return ''
  return interpolate(strings.proposal.scenarios, {
    sin: String(sin),
    esperado: String(s.esperado),
    optimista: String(s.optimista),
    pesimista: String(s.pesimista),
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
 * The bubble(s) shown BEFORE the interactive proposal block. Iteration-4: only
 * the plain-words, DIRECTION-AWARE tendencies line is a staged bubble now — the
 * mechanism is rendered as an inline VISUAL card (buildMechanismVisual), and the
 * TUS NÚMEROS breakdown + margin anchor + scenarios line live in the proposal
 * block. The tri-state proposal itself is rendered interactively by the component
 * (tappable margin chip + CTAs), not a bubble.
 *
 * `mechanismLine` is retained (exported via tests/coach parity) as the textual
 * fallback for the mechanism; the live UI uses the visual card.
 */
export function buildProposalMessages(profile: UserProfile): ChatMessage[] {
  return [assistant(tendenciesLine(profile))]
}

/** Textual mechanism line — retained for tests + as a non-visual fallback. */
export function mechanismText(profile: UserProfile, goal: Goal, risk: RiskProfile): string {
  return mechanismLine(profile, goal, risk)
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
