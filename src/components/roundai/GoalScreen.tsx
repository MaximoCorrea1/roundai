'use client'

import { useEffect, useState } from 'react'
import type { Dispatch } from 'react'
import type { AppState, Action } from '@/components/AppShell'
import type { RiskProfile } from '@/lib/roundup'
import {
  monthlySweepTotal,
  simulateReturns,
  monthsAtRate,
  formatARS,
} from '@/lib/roundup'
import { profiles } from '@/data/profiles'
import { transactionsFor } from '@/data/transactions'
import { strings } from '@/data/strings'
import { ProgressRing } from './ProgressRing'
import { PaceEta } from './PaceEta'
import { Cartera } from './Cartera'
import { GoalList } from './GoalList'

// GOAL SCREEN v3 (client feedback: "reducir text bloat · mostrá tu cartera ·
// '¿qué significa a este ritmo?' · sorprendeme"). Every number is still
// calculator-derived (roundup.ts); this component does no money math, only layout
// and ONE display-only date (the ETA, inside PaceEta). The v3 moves:
//
//   1. TEXT DIET — the goal's NAME is the screen title; labels are ≤3 words; the
//      old "Tu plata, invertida" trio + "Tu posición" card + recalc note all
//      collapse into ONE "Tu cartera" block (Cartera.tsx). Streak chip + the
//      secondary-goals list go quieter.
//   2. PACE, EXPLAINED — "a este ritmo: 12 meses" → a full sentence with the
//      monthly sweep rate AND an ETA month anchor ("mayo 2027"). See PaceEta.tsx.
//   3. TU CARTERA — holdings position + an educational composition bar by profile
//      (generic categories, "· simulado"). See Cartera.tsx.
//   4. SURPRISE — "tu café de hoy te acercó {x} días ✦": right after a payment
//      lands this session, we translate the live sweep into days shaved off the
//      goal at its required daily pace. Honest (calculator-derived), reduced-motion
//      -safe (it's static text), and it reframes a $154 coffee as real progress.
//
// MULTI-GOAL MODEL (unchanged from v2): state.goals[] with exactly one active;
// goalProgress is the LIVE in-session sweep on the active goal; switching folds
// live progress into the outgoing goal's banked accumulated (SET_ACTIVE_GOAL),
// so sweeps never double-count.

export function GoalScreen({
  state,
  dispatch,
}: {
  state: AppState
  dispatch: Dispatch<Action>
}) {
  const profile = profiles.find((p) => p.id === state.profileId) ?? profiles[0]
  const margin = state.marginFraction ?? 0

  // ── the active goal (post-accept) or the in-flight `state.goal` fallback ──
  const activeGoal = state.goals.find((g) => g.id === state.activeGoalId) ?? null
  const secondaryGoals = state.goals.filter((g) => g.id !== state.activeGoalId)

  const goalAmount = activeGoal?.amount ?? state.goal?.amount ?? 0
  const hasTarget = goalAmount > 0
  // The screen title: the goal's NAME (v3 #1). Falls back to the in-flight label
  // or the generic "Mi meta" before a goal is committed.
  const goalName =
    activeGoal?.label ?? state.goal?.label ?? strings.onboarding.goalLabels.meta
  const goalMonths = activeGoal?.months ?? state.goal?.months ?? 0

  // ── all numbers from the calculator ──
  const ledger = transactionsFor(state.profileId)
  const baseSweep = monthlySweepTotal(ledger, margin) // simulated prior month (real ledger)

  // Base sweep belongs to the REAL goal only; the mocked goal carries its
  // progress entirely in `accumulated` and is never fed the sweep.
  const isSimulatedActive = activeGoal?.simulated === true
  const baseForActive = isSimulatedActive ? 0 : baseSweep

  const banked = activeGoal?.accumulated ?? 0
  // aportado = banked + live in-session sweeps + simulated prior month (real goal)
  const aportado = banked + state.goalProgress + baseForActive
  // ACCRUED (honest) yield on the position — ~$0 at 1 month by design.
  const rendimiento = simulateReturns(aportado, 1).rendimiento
  const total = aportado + rendimiento
  // 12-month PROJECTION (conditional). Mocked goal projects its own position.
  const projection12m = simulateReturns(isSimulatedActive ? aportado : baseSweep, 12).total

  const ringValue = total
  const remaining = hasTarget ? Math.max(0, goalAmount - total) : 0
  const paceRate = isSimulatedActive ? 0 : baseSweep
  const pace = hasTarget ? monthsAtRate(remaining, paceRate) : null

  // ── SURPRISE: days this session's live sweep shaved off the goal ──
  // At the goal's REQUIRED daily pace (amount / (months × 30)), how many days does
  // the in-session sweep cover? Calculator-derived inputs; ceil so a single café
  // always reads as ≥1 día, and it grows as more payments land. Only meaningful
  // for a real, target goal with a committed plazo and a fresh sweep this session.
  const nudgeDays =
    hasTarget && !isSimulatedActive && goalMonths > 0 && state.goalProgress > 0
      ? Math.ceil(state.goalProgress / (goalAmount / (goalMonths * 30)))
      : null

  // ── celebration: fire once whenever the active goal's live progress increases ──
  const celebrate = useCelebrateOnIncrease(state.activeGoalId, state.goalProgress)

  function handleActivate(id: string) {
    dispatch({ type: 'SET_ACTIVE_GOAL', id })
  }

  return (
    <div className="no-scrollbar flex-1 overflow-y-auto bg-cream px-4 pb-6 pt-5">
      {/* TITLE: the goal's NAME (v3 #1) + a quiet streak chip + active/simulated tag */}
      <div className="mb-4 flex flex-col items-center gap-1.5 text-center">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-[22px] font-semibold leading-none text-roundai-green">
            {goalName}
          </h2>
          {activeGoal && (
            <span className="rounded-full bg-lime/25 px-2 py-[3px] text-[11px] font-semibold uppercase leading-none tracking-wide text-roundai-green-deep">
              {isSimulatedActive ? strings.goal.simulatedBadge : strings.goal.activeBadge}
            </span>
          )}
        </div>
        <span className="text-[12px] font-medium text-roundai-green/45">{strings.goal.streak}</span>
      </div>

      {hasTarget ? (
        <ProgressRing
          accumulated={ringValue}
          goalAmount={goalAmount}
          remaining={remaining}
          celebrate={celebrate}
        />
      ) : (
        <NoTargetHero accumulated={ringValue} celebrate={celebrate} />
      )}

      {/* PACE, EXPLAINED + ETA anchor + the surprise nudge (v3 #2, #4) */}
      {hasTarget && pace?.reachable && pace.months != null && pace.months > 0 && (
        <PaceEta monthlySweep={baseSweep} months={pace.months} nudgeDays={nudgeDays} />
      )}

      {/* TU CARTERA: position + composition by profile (v3 #3) — absorbs the old
          holdings card AND the portfolio trio AND the recalc note into one block */}
      <Cartera
        profile={highlightedRisk(state, profile.riskProfile)}
        aportado={aportado}
        rendimiento={rendimiento}
        total={total}
        projection12m={projection12m}
      />

      {/* secondary goals — quieter, below the cartera (v3 #5) */}
      <GoalList goals={secondaryGoals} onActivate={handleActivate} />
    </div>
  )
}

// Portfolio composition follows the QUIZ-declared session risk (decision #26),
// not the profile's inferred risk; fall back to the profile before the quiz runs.
function highlightedRisk(state: AppState, fallback: RiskProfile): RiskProfile {
  return state.sessionRisk ?? fallback
}

// Hero for amount-less goals: accumulated figure, ✦, no ring.
function NoTargetHero({ accumulated, celebrate }: { accumulated: number; celebrate: boolean }) {
  return (
    <div className="flex flex-col items-center pt-3 text-center">
      <style>{`
        @keyframes roundai-spark-pulse-2 {
          0% { transform: scale(1); text-shadow: 0 0 0 rgba(200,245,96,0); }
          40% { transform: scale(1.5); text-shadow: 0 0 14px rgba(200,245,96,0.7); }
          100% { transform: scale(1); text-shadow: 0 0 0 rgba(200,245,96,0); }
        }
        .roundai-spark-pulse-2 { animation: roundai-spark-pulse-2 600ms cubic-bezier(0.22,1,0.36,1) 1; }
        @media (prefers-reduced-motion: reduce) { .roundai-spark-pulse-2 { animation: none; } }
      `}</style>
      <span aria-hidden="true" className={'text-[18px] text-lime-deep ' + (celebrate ? 'roundai-spark-pulse-2' : '')}>
        ✦
      </span>
      <span className="tnum mt-1 font-display text-[36px] font-semibold leading-none tracking-tight text-roundai-green">
        {formatARS(accumulated)}
      </span>
      <span className="mt-2 text-[12.5px] font-medium text-roundai-green/45">
        {strings.goal.heroCaption}
      </span>
    </div>
  )
}

// Session-scoped record of the (goalId, progress) we've already celebrated.
// Survives the goal view's unmount/remount, so flipping between Chat and Mi meta
// after the sweep landed does NOT re-fire the pulse — each new sweep value
// celebrates exactly once PER active goal. Switching goals resets goalProgress to
// 0 in the reducer, so a fresh sweep on the new goal still reads as an increase
// against that goal's last-celebrated value. Resets on a full page reload.
const celebrated = new Map<string, number>()

/**
 * THE one celebration trigger. Fires (true for ~one window) when this screen
 * mounts or updates with a goalProgress GREATER than the last value already
 * celebrated for the CURRENTLY ACTIVE goal — i.e. a fresh sweep just landed.
 * Keyed on activeGoalId so switching goals (which zeroes goalProgress) never
 * mistakes the reset for a celebration, and each goal celebrates its own sweeps.
 */
function useCelebrateOnIncrease(activeGoalId: string | null, progress: number): boolean {
  const [celebrate, setCelebrate] = useState(false)
  const key = activeGoalId ?? '__none__'

  useEffect(() => {
    const last = celebrated.get(key) ?? 0
    if (progress > last) {
      celebrated.set(key, progress)
      setCelebrate(true)
      const id = setTimeout(() => setCelebrate(false), 800) // clear after the pulse
      return () => clearTimeout(id)
    }
  }, [key, progress])

  return celebrate
}
