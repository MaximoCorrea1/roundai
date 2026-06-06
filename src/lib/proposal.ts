// Templated margin proposal — REAL math, ZERO API. Every figure here comes from
// the one calculator (src/lib/roundup.ts); every word comes from src/data/strings.ts.
// Components receive ready-to-render ChatMessages and never touch copy or numbers.
//
// The pacing (push one bubble at a time with typing pauses) lives in the
// ChatScreen effect — this module is pure: same profile + goal → same messages.

import type { Goal, ChatMessage } from './chat-types'
import type { UserProfile } from './roundup'
import {
  computeOptimalMargin,
  monthlyContribution,
  monthsToGoal,
  liquidityBand,
  sweepForPayment,
  savingsCapacity,
  formatARS,
  formatPct,
} from './roundup'
import { DEMO_PAYMENT } from '../data/transactions'
import { strings } from '../data/strings'

const CAFE = DEMO_PAYMENT.amount // single source: the scripted demo payment (spec #23)
const MAX_REASONABLE_MONTHS = 24 // beyond this, switch to the honest "alternatives" line

/** Does this profile support a sustainable proposal at all? (margin > 0) */
export function hasSustainableProposal(profile: UserProfile): boolean {
  return computeOptimalMargin(profile) > 0
}

/**
 * Build the assistant proposal bubbles for a profile + goal, from roundup.ts
 * outputs ONLY:
 *   1. liquidity read (band → one warm line)
 *   2. round-up explainer + concrete café example
 *   3. the proposal: margin + monthly contribution + sustainability framing
 *   4. IF goal has amount: monthsToGoal projection — with the honest branch
 *      when it's slow (> 24 meses).
 * If no sustainable margin exists (contribution would be 0), returns a single
 * honest bubble and NO proposal (the caller should not show the consent CTA —
 * use hasSustainableProposal to gate it).
 */
export function buildProposalMessages(profile: UserProfile, goal: Goal): ChatMessage[] {
  const p = strings.proposal
  const margin = computeOptimalMargin(profile)

  // Unreachable: no sustainable aporte → honest copy, no proposal, no CTA.
  if (margin <= 0) {
    return [assistant(p.unreachable)]
  }

  const band = liquidityBand(profile)
  const aporte = monthlyContribution(profile, margin)
  const capacidad = savingsCapacity(profile)

  const messages: ChatMessage[] = [
    assistant(p.liquidity[band]),
    assistant(
      interpolate(p.roundup, {
        margen: formatPct(margin),
        cafe: formatARS(CAFE),
        sweepCafe: formatARS(sweepForPayment(CAFE, margin)),
      }),
    ),
    assistant(
      interpolate(p.proposalLine, {
        margen: formatPct(margin),
        aporte: formatARS(aporte),
        capacidad: formatARS(capacidad),
      }),
    ),
  ]

  // Projection only when there's a concrete target amount.
  if (goal.amount && goal.amount > 0) {
    const { reachable, months } = monthsToGoal(profile, margin, goal.amount)
    if (reachable && months != null) {
      const line =
        months > MAX_REASONABLE_MONTHS
          ? interpolate(p.slow, { meses: String(months) })
          : interpolate(p.projection, { meses: String(months) })
      messages.push(assistant(line))
    }
  }

  return messages
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
