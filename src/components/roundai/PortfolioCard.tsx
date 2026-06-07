'use client'

import type { RiskProfile } from '@/lib/roundup'
import { strings } from '@/data/strings'

// One simulated FCI risk level (spec #24 / design.md): educational copy in
// criollo, NO named instruments. The card matching the user's profile.riskProfile
// is highlighted (lime ring + "tu perfil" tag). Copy lives in strings.goal.portfolio.

export function PortfolioCard({
  level,
  active,
}: {
  level: RiskProfile
  active: boolean
}) {
  const data = strings.goal.portfolio[level]

  return (
    <div
      className={
        'relative rounded-[var(--radius-md)] p-3.5 transition-colors ' +
        (active
          ? 'bg-roundai-green text-cream ring-2 ring-lime'
          : 'bg-roundai-green/[0.04] text-roundai-green ring-1 ring-roundai-green/10')
      }
    >
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RiskGlyph level={level} active={active} />
          <span className="text-[13.5px] font-semibold">{data.name}</span>
        </div>
        {active && (
          <span className="rounded-full bg-lime px-2 py-[3px] text-[11px] font-semibold uppercase leading-none tracking-wide text-roundai-green-deep">
            {strings.goal.active}
          </span>
        )}
      </div>
      <p className={'text-[14.5px] leading-snug ' + (active ? 'text-cream/75' : 'text-roundai-green/60')}>
        {data.copy}
      </p>
    </div>
  )
}

// A tiny risk meter: 1 / 2 / 3 filled bars for conservador / moderado / agresivo.
function RiskGlyph({ level, active }: { level: RiskProfile; active: boolean }) {
  const filled = level === 'conservador' ? 1 : level === 'moderado' ? 2 : 3
  const onColor = active ? 'bg-lime' : 'bg-lime-deep'
  const offColor = active ? 'bg-cream/20' : 'bg-roundai-green/15'
  return (
    <span className="flex items-end gap-[2px]" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={
            'w-[3px] rounded-full ' +
            (i < filled ? onColor : offColor) +
            ' ' +
            (i === 0 ? 'h-2' : i === 1 ? 'h-3' : 'h-4')
          }
        />
      ))}
    </span>
  )
}
