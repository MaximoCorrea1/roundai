'use client'

import type { UserProfile } from '@/lib/roundup'
import { savingsCapacity, formatARS } from '@/lib/roundup'
import { strings } from '@/data/strings'

// "tu margen se reajusta solo: liquidez prevista {prevista} vs real {real}" —
// the round-up adapts to the user's actual end-of-month liquidity.
//
// prevista is the calculator's savingsCapacity(profile). `real` applies a
// DISPLAY-ONLY mocked delta (×0.93) to illustrate "this month came in a bit
// under forecast" — there is no real recalculation engine in the MVP. The 0.93
// is the ONLY number in Phase 6 computed outside roundup.ts, and it is a
// deliberate cosmetic mock, not a financial figure.
const MOCKED_REAL_DELTA = 0.93 // DISPLAY-ONLY mock — not a calculated value (see above)

export function RecalcNote({ profile }: { profile: UserProfile }) {
  const prevista = savingsCapacity(profile)
  const real = prevista * MOCKED_REAL_DELTA // mocked delta — cosmetic only

  const text = strings.goal.recalc
    .replace('{prevista}', formatARS(prevista))
    .replace('{real}', formatARS(real))

  return (
    <div className="flex items-start gap-2 rounded-[var(--radius-md)] bg-roundai-green/[0.04] px-3.5 py-3 ring-1 ring-roundai-green/10">
      <span className="mt-[1px] shrink-0 text-lime-deep" aria-hidden="true">
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path
            d="M2 7.5a5.5 5.5 0 0 1 9.4-3.9M13 7.5a5.5 5.5 0 0 1-9.4 3.9"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path d="M11.5 1.5v2.6h-2.6M3.5 13.5v-2.6h2.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <p className="text-[11.5px] leading-snug text-roundai-green/65">
        {/* split so the two figures land in the mono face for column alignment */}
        {renderWithMono(text)}
      </p>
    </div>
  )
}

// The recalc copy has two ARS figures; wrap the $-prefixed tokens in .tnum so
// they render in the mono face like every other money figure.
function renderWithMono(text: string) {
  const parts = text.split(/(\$ ?[\d.]+)/g)
  return parts.map((part, i) =>
    /^\$/.test(part) ? (
      <span key={i} className="tnum font-medium text-roundai-green/80">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}
