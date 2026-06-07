'use client'

import { useEffect, useRef, useState } from 'react'
import type { RiskProfile } from '@/lib/roundup'
import { formatARS } from '@/lib/roundup'
import { strings } from '@/data/strings'

// "Tu cartera" (goal screen v3 — spec #3): ONE block that merges the user's
// honest holdings position (aportado / rinde / total) with an educational
// composition-by-profile visual (a single clean stacked bar). This absorbs the
// old PortfolioCard trio AND the Holdings card — three sections collapsed into
// one, the biggest single cut in the text diet.
//
// Honesty rules preserved:
//   • All money figures arrive pre-computed from the one calculator (roundup.ts);
//     this component does NO money math — only the segment widths, which are the
//     hardcoded educational percentages (display geometry, not finance).
//   • The composition is GENERIC categories only (mercado de dinero / renta fija
//     / renta variable) — NO instruments, NO tickers — and is clearly "· simulado".
//   • rendimiento is the ACCRUED yield (~$0 at 1 month) — we never fake it; the
//     12-month figure stays a conditional projection on its own line.

const CATS = ['mm', 'rf', 'rv'] as const
type Cat = (typeof CATS)[number]

// Each category's segment colour — one accent family (lime → green), so the bar
// reads as "more lime = more growth/risk" without a carnival of hues.
const CAT_FILL: Record<Cat, string> = {
  mm: 'var(--color-roundai-green)', // mercado de dinero — the steady base
  rf: 'var(--color-roundai-green-soft)', // renta fija — middle
  rv: 'var(--color-lime-deep)', // renta variable — the growth accent
}

export function Cartera({
  profile,
  aportado,
  rendimiento,
  total,
  projection12m,
}: {
  profile: RiskProfile // session risk (declared via quiz) → drives the composition
  aportado: number // accrued contributions toward the active goal
  rendimiento: number // accrued (honest) yield — ~$0 at 1 month
  total: number // aportado + rendimiento
  projection12m: number // 12m projected total (simulated, conditional)
}) {
  const c = strings.goal.cartera
  const mix = strings.goal.composition[profile]
  const reduced = usePrefersReducedMotion()

  return (
    <section className="mt-7">
      <div className="mb-2.5 flex items-baseline justify-between px-0.5">
        <h3 className="font-display text-[15.5px] font-semibold text-roundai-green">{c.title}</h3>
        <span className="text-[11.5px] font-medium text-roundai-green/45">{c.sub}</span>
      </div>

      <div className="rounded-[var(--radius-md)] bg-roundai-green/[0.04] px-4 py-4 ring-1 ring-roundai-green/10">
        {/* position figures — aportado / rinde / total */}
        <div className="grid grid-cols-3 gap-2">
          <Figure label={c.aportado} value={formatARS(aportado)} />
          <Figure label={c.rendimiento} value={formatARS(rendimiento)} />
          <Figure label={c.total} value={formatARS(total)} accent />
        </div>

        {/* 12-month projection — conditional tense, always labeled simulado */}
        <p className="mt-3 text-[12px] font-medium text-roundai-green/55">
          {c.projection.replace('{monto}', formatARS(projection12m))}
        </p>

        {/* divider into the composition block */}
        <div className="mt-4 border-t border-roundai-green/10 pt-3.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-semibold uppercase tracking-wide text-roundai-green/55">
              {c.mixLabel}
            </span>
            <span className="rounded-full bg-lime/25 px-2 py-[3px] text-[11px] font-semibold leading-none text-roundai-green-deep">
              {strings.goal.profileLabels[profile]}
            </span>
          </div>

          {/* the one stacked bar — segment widths = hardcoded educational % */}
          <div
            className="flex h-3 w-full overflow-hidden rounded-full ring-1 ring-roundai-green/10"
            role="img"
            aria-label={CATS.map((k) => `${c.cats[k]} ${mix[k]}%`).join(', ')}
          >
            {CATS.map((k, i) => (
              <span
                key={k}
                className="h-full first:rounded-l-full last:rounded-r-full"
                style={{
                  width: `${mix[k]}%`,
                  background: CAT_FILL[k],
                  // a hairline gap between segments without a real gap
                  boxShadow: i > 0 ? 'inset 1px 0 0 var(--color-cream)' : undefined,
                  transition: reduced ? 'none' : 'width 700ms cubic-bezier(0.22,1,0.36,1)',
                }}
              />
            ))}
          </div>

          {/* legend — category · % (generic names, tabular %) */}
          <ul className="mt-3 flex flex-col gap-1.5">
            {CATS.map((k) => (
              <li key={k} className="flex items-center gap-2 text-[13px] text-roundai-green/70">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                  style={{ background: CAT_FILL[k] }}
                />
                <span className="flex-1">{c.cats[k]}</span>
                <span className="tnum font-semibold text-roundai-green">{mix[k]}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function Figure({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p
        className={
          'tnum text-[16.5px] font-semibold leading-none ' +
          (accent ? 'text-lime-deep' : 'text-roundai-green')
        }
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] font-medium leading-tight text-roundai-green/50">{label}</p>
    </div>
  )
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return reduced
}
