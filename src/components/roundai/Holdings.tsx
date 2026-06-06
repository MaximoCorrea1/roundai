'use client'

import { formatARS } from '@/lib/roundup'
import { strings } from '@/data/strings'

// "Tu posición" (spec decision #30): the honest holdings breakdown for the ACTIVE
// goal's ACCRUED position — aportado / rendimiento (· simulado) / total. The
// figures come pre-computed from the one calculator (roundup.ts) in GoalScreen;
// this component only lays them out. Honesty rule: a just-activated account has
// ~$0 of ACCRUED rendimiento (simulateReturns of the position at 1 month rounds
// to 0), so we show it as $0 — and put the 12-month PROJECTION (conditional
// "rendiría", never a promise) on its own line beneath. We never fake accrued
// returns to make the demo look livelier.

export function Holdings({
  aportado,
  rendimiento,
  total,
  projection12m,
}: {
  aportado: number // accrued contributions toward the active goal
  rendimiento: number // accrued (honest) yield on that position — ~$0 at 1 month
  total: number // aportado + rendimiento
  projection12m: number // 12m projected total of the monthly base sweep (simulated)
}) {
  return (
    <section className="mt-6">
      <h3 className="mb-2.5 px-0.5 font-display text-[14px] font-semibold text-roundai-green">
        {strings.goal.holdingsTitle}
      </h3>

      <div className="rounded-[var(--radius-md)] bg-roundai-green/[0.04] px-4 py-3.5 ring-1 ring-roundai-green/10">
        <div className="grid grid-cols-3 gap-2">
          <Figure label={strings.goal.holdingsAportado} value={formatARS(aportado)} />
          <Figure label={strings.goal.holdingsRendimiento} value={formatARS(rendimiento)} />
          <Figure label={strings.goal.holdingsTotal} value={formatARS(total)} accent />
        </div>

        {/* 12-month projection — conditional tense, always labeled simulado */}
        <p className="mt-3 border-t border-roundai-green/10 pt-2.5 text-[11px] font-medium text-roundai-green/55">
          {strings.goal.holdingsProjection.replace('{monto}', formatARS(projection12m))}
        </p>
      </div>
    </section>
  )
}

function Figure({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p
        className={
          'tnum text-[15px] font-semibold leading-none ' +
          (accent ? 'text-lime-deep' : 'text-roundai-green')
        }
      >
        {value}
      </p>
      <p className="mt-1 text-[9.5px] font-medium leading-tight text-roundai-green/50">{label}</p>
    </div>
  )
}
