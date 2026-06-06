'use client'

import type { SavedGoal } from '@/lib/chat-types'
import { formatARS } from '@/lib/roundup'
import { strings } from '@/data/strings'

// "Tus metas" secondary list (spec decision #29): the active goal is the ring
// hero above; this renders every OTHER committed goal as a compact card — label,
// mini progress bar, monto target, plazo, and an "Activar" selector. Tapping
// Activar fires SET_ACTIVE_GOAL: the card becomes the hero and starts receiving
// sweeps (the reducer folds the outgoing goal's live progress into its banked
// total first, so sweeps never double-count). Each secondary carries its OWN
// progress (`accumulated`) — mocked for the seeded "simulada" goal. No money math
// here: the % is the only derived value and it's exact (accumulated/amount).

export function GoalList({
  goals,
  onActivate,
}: {
  goals: SavedGoal[] // the SECONDARY goals (active hero already rendered above)
  onActivate: (id: string) => void
}) {
  if (goals.length === 0) return null

  return (
    <section className="mt-6">
      <h3 className="mb-2.5 px-0.5 font-display text-[14px] font-semibold text-roundai-green">
        {strings.goal.goalsTitle}
      </h3>
      <div className="flex flex-col gap-2.5">
        {goals.map((g) => (
          <SecondaryCard key={g.id} goal={g} onActivate={() => onActivate(g.id)} />
        ))}
      </div>
    </section>
  )
}

function SecondaryCard({ goal, onActivate }: { goal: SavedGoal; onActivate: () => void }) {
  // Exact, hand-checkable: pct = accumulated / amount, clamped [0,1].
  const pct =
    goal.amount > 0 ? Math.min(1, Math.max(0, goal.accumulated / goal.amount)) : 0
  const pctLabel = Math.round(pct * 100)

  return (
    <div className="rounded-[var(--radius-md)] bg-roundai-green/[0.04] px-3.5 py-3 ring-1 ring-roundai-green/10">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[13px] font-semibold text-roundai-green">
            {goal.label}
          </span>
          {goal.simulated && (
            <span className="shrink-0 rounded-full bg-roundai-green/[0.06] px-1.5 py-[2px] text-[8.5px] font-medium leading-none text-roundai-green/55">
              {strings.goal.simulatedBadge}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onActivate}
          className="shrink-0 rounded-full bg-roundai-green px-2.5 py-[5px] text-[10px] font-semibold text-cream transition-opacity hover:opacity-90 active:opacity-80"
        >
          {strings.goal.activate}
        </button>
      </div>

      {/* mini progress bar */}
      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-roundai-green/10">
        <div
          className="h-full rounded-full bg-lime-deep"
          style={{ width: `${pctLabel}%` }}
          aria-hidden="true"
        />
      </div>

      {/* monto + plazo, tabular */}
      <div className="mt-2 flex items-center justify-between text-[10.5px] font-medium text-roundai-green/55">
        <span className="tnum">
          {formatARS(goal.accumulated)} / {formatARS(goal.amount)}
        </span>
        <span className="tnum">{goal.months} meses</span>
      </div>
    </div>
  )
}
