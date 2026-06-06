'use client'

import { useEffect, useState } from 'react'
import type { AppState } from '@/components/AppShell'
import type { RiskProfile } from '@/lib/roundup'
import {
  monthlySweepTotal,
  simulateReturns,
  monthsAtRate,
  formatARS,
} from '@/lib/roundup'
import { activeProfile, ACTIVE_PROFILE_ID } from '@/data/profiles'
import { transactionsFor } from '@/data/transactions'
import { strings } from '@/data/strings'
import { ProgressRing } from './ProgressRing'
import { PortfolioCard } from './PortfolioCard'
import { RecalcNote } from './RecalcNote'

// The emotional payoff (spec #24): spending becomes a concrete goal, and EVERY
// number is hand-recomputable from the visible ledger. All figures flow from the
// one calculator (roundup.ts) — this component does no money math, only layout.
//
//   accumulated = monthlySweepTotal(ledger, margin)  +  state.goalProgress
//                 └ "este mes · simulado"                └ live in-session sweeps
//   rendimiento = simulateReturns(monthlySweepTotal(ledger, margin), 1).rendimiento
//   remaining   = goal.amount − accumulated − rendimiento, floored at 0
//   pace        = monthsAtRate(remaining, monthlySweepTotal(ledger, margin)).months
//
// THE one celebration: when goalProgress increases (a payment landed) and this
// screen next mounts/updates, the ring sweeps the delta and the centre ✦ pulses
// once. Tracked via a ref so it fires exactly once per increase.

const RISK_LEVELS: RiskProfile[] = ['conservador', 'moderado', 'agresivo']

export function GoalScreen({ state }: { state: AppState }) {
  const profile = activeProfile()
  const margin = state.marginFraction ?? 0
  const goal = state.goal
  const hasTarget = !!(goal && goal.amount && goal.amount > 0)

  // ── all numbers from the calculator ──
  const ledger = transactionsFor(ACTIVE_PROFILE_ID)
  const baseSweep = monthlySweepTotal(ledger, margin) // simulated prior month
  const accumulated = baseSweep + state.goalProgress // + live in-session sweeps
  const rendimiento = simulateReturns(baseSweep, 1).rendimiento
  const ringValue = accumulated + rendimiento

  const goalAmount = hasTarget ? goal!.amount! : 0
  const remaining = hasTarget ? Math.max(0, goalAmount - accumulated - rendimiento) : 0
  const pace = hasTarget ? monthsAtRate(remaining, baseSweep) : null

  // ── celebration: fire once whenever goalProgress increases ──
  const celebrate = useCelebrateOnIncrease(state.goalProgress)

  return (
    <div className="no-scrollbar flex-1 overflow-y-auto bg-cream px-4 pb-6 pt-5">
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

      {/* this-month accumulated label + live yield */}
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <Stat value={formatARS(accumulated)} label={strings.goal.accumulatedLabel} />
        <Stat value={formatARS(rendimiento)} label={stripAmountToken(strings.goal.yield)} />
      </div>

      {/* pace — only with a concrete target */}
      {hasTarget && pace?.reachable && pace.months != null && (
        <div className="mt-2.5 flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-roundai-green px-4 py-2.5 text-cream">
          <span aria-hidden="true" className="text-lime">
            ↗
          </span>
          <span className="text-[12.5px] font-medium">
            {strings.goal.pace.replace('{meses}', String(pace.months))}
          </span>
        </div>
      )}

      {/* portfolio — simulated FCI sandbox */}
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
              active={level === profile.riskProfile}
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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-roundai-green/[0.04] px-3.5 py-3 ring-1 ring-roundai-green/10">
      <p className="tnum text-[17px] font-semibold text-roundai-green">{value}</p>
      <p className="mt-0.5 text-[10.5px] font-medium leading-tight text-roundai-green/50">{label}</p>
    </div>
  )
}

// "tu plata rindió {monto} ✦ simulado" → label without the {monto} token, so the
// figure lives in the Stat value and the caption reads cleanly.
function stripAmountToken(template: string): string {
  return template.replace('{monto}', '').replace(/\s+/g, ' ').trim()
}

// Session-scoped record of the goalProgress values we've already celebrated.
// Survives the goal view's unmount/remount (it lives outside React), so flipping
// between Chat and Mi meta after the sweep landed does NOT re-fire the pulse —
// each new sweep value celebrates exactly once. Resets on a full page reload
// (fresh demo session), which is what we want.
let celebratedProgress = 0

/**
 * THE one celebration trigger. Fires (true for ~one window) when this screen
 * mounts or updates with a goalProgress that's GREATER than any value already
 * celebrated this session — i.e. a fresh sweep just landed. This covers the
 * primary demo path: the sweep lands on the WALLET screen, then the goal screen
 * mounts for the first time already holding that progress, and celebrates on
 * mount. Re-opening the screen at the same progress does nothing.
 */
function useCelebrateOnIncrease(progress: number): boolean {
  const [celebrate, setCelebrate] = useState(false)

  useEffect(() => {
    if (progress > celebratedProgress) {
      celebratedProgress = progress
      setCelebrate(true)
      const id = setTimeout(() => setCelebrate(false), 800) // clear after the pulse
      return () => clearTimeout(id)
    }
  }, [progress])

  return celebrate
}
