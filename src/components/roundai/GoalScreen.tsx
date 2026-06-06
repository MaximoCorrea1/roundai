'use client'

import { useEffect, useState } from 'react'
import type { Dispatch } from 'react'
import type { AppState, Action } from '@/components/AppShell'
import type { SavedGoal } from '@/lib/chat-types'
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
import { PortfolioCard } from './PortfolioCard'
import { RecalcNote } from './RecalcNote'
import { GoalList } from './GoalList'
import { Holdings } from './Holdings'

// The emotional payoff (spec #24): spending becomes a concrete goal, and EVERY
// number is hand-recomputable from the visible ledger. All figures flow from the
// one calculator (roundup.ts) — this component does no money math, only layout.
//
// MULTI-GOAL MODEL (spec decision #29). State carries:
//   • goals[]            committed SavedGoals; exactly one is active
//   • activeGoalId       which one receives sweeps
//   • goalProgress       LIVE in-session sweeps accrued to the ACTIVE goal
//   • SavedGoal.accumulated   BANKED progress (live progress is folded in on
//                             goal switch by SET_ACTIVE_GOAL — see AppShell)
// The active goal is the ring HERO; secondary goals render as cards (GoalList).
// Tapping "Activar" → SET_ACTIVE_GOAL: the outgoing goal banks its live progress,
// goalProgress resets to 0, the new goal becomes active. Sweeps never double-count.
//
//   baseSweep    = monthlySweepTotal(ledger, margin)   ← simulated prior month,
//                  attributed ONLY to the REAL goal (the mocked goal carries its
//                  own seeded progress and is never fed the real-ledger sweep).
//   accumulated  = activeGoal.accumulated + goalProgress + baseSweepForActive
//   rendimiento  = simulateReturns(accumulated, 1).rendimiento  ← ACCRUED, ~$0 at
//                  1 month (honest); the 12m PROJECTION is shown separately.
//   remaining    = goal.amount − accumulated − rendimiento, floored at 0
//   pace         = monthsAtRate(remaining, baseSweep).months
//
// THE one celebration: when goalProgress increases (a payment landed) and this
// screen next mounts/updates, the ring sweeps the delta and the centre ✦ pulses
// once. Keyed on (activeGoalId, goalProgress) so switching goals never re-fires.

const RISK_LEVELS: RiskProfile[] = ['conservador', 'moderado', 'agresivo']

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
  // After ACCEPT_PROPOSAL the hero follows the active SavedGoal. Before it (the
  // goal tab unlocks once a margin is set in the proposal), we fall back to the
  // in-flight goal so the screen still renders something coherent.
  const activeGoal = state.goals.find((g) => g.id === state.activeGoalId) ?? null
  const secondaryGoals = state.goals.filter((g) => g.id !== state.activeGoalId)

  const goalAmount = activeGoal?.amount ?? state.goal?.amount ?? 0
  const hasTarget = goalAmount > 0

  // ── all numbers from the calculator ──
  const ledger = transactionsFor(state.profileId)
  const baseSweep = monthlySweepTotal(ledger, margin) // simulated prior month (real ledger)

  // The base sweep belongs to the REAL goal only. The mocked secondary goal
  // carries its progress entirely in `accumulated` and is never fed the sweep.
  const isSimulatedActive = activeGoal?.simulated === true
  const baseForActive = isSimulatedActive ? 0 : baseSweep

  // Banked progress of the active goal (0 in the pre-accept fallback).
  const banked = activeGoal?.accumulated ?? 0
  // aportado = banked + live in-session sweeps + simulated prior month (real goal)
  const aportado = banked + state.goalProgress + baseForActive
  // ACCRUED (honest) yield on the position — ~$0 at 1 month by design.
  const rendimiento = simulateReturns(aportado, 1).rendimiento
  const total = aportado + rendimiento
  // 12-month PROJECTION of the monthly base sweep (conditional, simulated). For
  // the mocked goal (no base sweep) we project its own accrued position instead.
  const projection12m = simulateReturns(isSimulatedActive ? aportado : baseSweep, 12).total

  const ringValue = total
  const remaining = hasTarget ? Math.max(0, goalAmount - total) : 0
  // Pace uses the real monthly sweep rate; the mocked goal has no real rate.
  const paceRate = isSimulatedActive ? 0 : baseSweep
  const pace = hasTarget ? monthsAtRate(remaining, paceRate) : null

  // ── celebration: fire once whenever the active goal's live progress increases ──
  const celebrate = useCelebrateOnIncrease(state.activeGoalId, state.goalProgress)

  function handleActivate(id: string) {
    dispatch({ type: 'SET_ACTIVE_GOAL', id })
  }

  return (
    <div className="no-scrollbar flex-1 overflow-y-auto bg-cream px-4 pb-6 pt-5">
      {/* streak chip (mocked, labeled) — near the hero */}
      <div className="mb-3 flex justify-center">
        <span className="rounded-full bg-lime/20 px-3 py-1 text-[11px] font-semibold text-roundai-green ring-1 ring-lime-deep/30">
          {strings.goal.streak}
        </span>
      </div>

      {hasTarget ? (
        <ProgressRing
          accumulated={ringValue}
          goalAmount={goalAmount}
          remaining={remaining}
          celebrate={celebrate}
        />
      ) : (
        // Goals without a target amount ('rendir' / 'nose'): show the accumulated
        // figure as a hero, but no ring and no pace (there's nothing to count toward).
        <NoTargetHero accumulated={ringValue} celebrate={celebrate} />
      )}

      {/* active goal label (post-accept): name + "recibe tus redondeos" badge */}
      {activeGoal && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="font-display text-[15px] font-semibold text-roundai-green">
            {activeGoal.label}
          </span>
          <span className="rounded-full bg-lime/25 px-2 py-[3px] text-[9px] font-semibold uppercase leading-none tracking-wide text-roundai-green-deep">
            {isSimulatedActive ? strings.goal.simulatedBadge : strings.goal.activeBadge}
          </span>
        </div>
      )}

      {/* pace — only with a concrete target and a real sweep rate */}
      {hasTarget && pace?.reachable && pace.months != null && (
        <div className="mt-3 flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-roundai-green px-4 py-2.5 text-cream">
          <span aria-hidden="true" className="text-lime">
            ↗
          </span>
          <span className="text-[12.5px] font-medium">
            {strings.goal.pace.replace('{meses}', String(pace.months))}
          </span>
        </div>
      )}

      {/* secondary goals (decision #29): compact cards + Activar selector */}
      <GoalList goals={secondaryGoals} onActivate={handleActivate} />

      {/* holdings (decision #30): aportado / rendimiento simulado / total */}
      <Holdings
        aportado={aportado}
        rendimiento={rendimiento}
        total={total}
        projection12m={projection12m}
      />

      {/* portfolio — simulated FCI sandbox, highlighted by the QUIZ result */}
      <section className="mt-6">
        <div className="mb-2.5 flex items-center justify-between px-0.5">
          <h3 className="font-display text-[14px] font-semibold text-roundai-green">
            {strings.goal.portfolioTitle}
          </h3>
          <span className="rounded-full bg-roundai-green/[0.06] px-2 py-1 text-[9.5px] font-medium text-roundai-green/55">
            {strings.goal.sandbox}
          </span>
        </div>
        <div className="flex flex-col gap-2.5">
          {RISK_LEVELS.map((level) => (
            <PortfolioCard
              key={level}
              level={level}
              active={level === highlightedRisk(state, profile.riskProfile)}
            />
          ))}
        </div>
      </section>

      {/* recalc note */}
      <div className="mt-4">
        <RecalcNote profile={profile} />
      </div>
    </div>
  )
}

// Portfolio highlight follows the QUIZ-declared session risk (decision #26), not
// the profile's inferred risk; fall back to the profile only before the quiz runs.
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
      <span className="mt-2 text-[11px] font-medium text-roundai-green/45">
        {strings.goal.heroCaption}
      </span>
    </div>
  )
}

// Session-scoped record of the (goalId, progress) we've already celebrated.
// Survives the goal view's unmount/remount (it lives outside React), so flipping
// between Chat and Mi meta after the sweep landed does NOT re-fire the pulse —
// each new sweep value celebrates exactly once PER active goal. Switching goals
// resets goalProgress to 0 in the reducer, so a fresh sweep on the new goal still
// reads as an increase against that goal's last-celebrated value. Resets on a
// full page reload (fresh demo session), which is what we want.
const celebrated = new Map<string, number>()

/**
 * THE one celebration trigger. Fires (true for ~one window) when this screen
 * mounts or updates with a goalProgress GREATER than the last value already
 * celebrated for the CURRENTLY ACTIVE goal — i.e. a fresh sweep just landed on
 * it. Keyed on activeGoalId so switching goals (which zeroes goalProgress) never
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
