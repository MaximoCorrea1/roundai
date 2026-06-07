'use client'

import { useEffect, useRef, useState } from 'react'
import { formatARS } from '@/lib/roundup'
import { strings } from '@/data/strings'

// The hero of the goal screen: an animated SVG ring with a display-font number
// at its centre. progress = (accumulated + rendimiento) / goal.amount, clamped
// [0,1]. THE single celebration moment (spec / design.md): when a payment lands
// (goalProgress increases) and this screen next mounts/updates, the ring sweeps
// the delta and the centre ✦ gives ONE lime pulse (~600ms). Reduced-motion → the
// ring is drawn at its final value instantly, no pulse.
//
// Money/format come pre-computed from the calculator (formatARS). No math here
// beyond the geometric progress fraction, which is display-only.

const SIZE = 200
const STROKE = 14
const R = (SIZE - STROKE) / 2
const C = 2 * Math.PI * R
// Ring milestones (spec decision #30): subtle ticks at 25 / 50 / 75%.
const MILESTONES = [0.25, 0.5, 0.75] as const

export function ProgressRing({
  accumulated,
  goalAmount,
  remaining,
  celebrate,
}: {
  accumulated: number // accumulated + rendimiento, the value the ring represents
  goalAmount: number
  remaining: number
  celebrate: boolean // a fresh sweep just landed → run the one celebration
}) {
  const reduced = usePrefersReducedMotion()
  const target = clamp01(goalAmount > 0 ? accumulated / goalAmount : 0)

  // Animated fraction the ring actually paints. Starts at 0 on mount (so the
  // first reveal always sweeps in), then rAF-eases to target. Under reduced
  // motion it's pinned to target with no transition.
  const [shown, setShown] = useState(reduced ? target : 0)

  useEffect(() => {
    if (reduced) {
      setShown(target)
      return
    }
    // next frame so the browser registers the 0 (or previous) value first,
    // then transitions the stroke to target via CSS.
    const id = requestAnimationFrame(() => setShown(target))
    return () => cancelAnimationFrame(id)
  }, [target, reduced])

  const offset = C * (1 - shown)
  const reached = remaining <= 0

  return (
    <div className="relative flex flex-col items-center">
      <style>{RING_CSS}</style>

      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={strings.a11y.progressRing}
          className="-rotate-90"
        >
          {/* track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            className="text-roundai-green/10"
          />
          {/* progress arc */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="url(#roundai-ring-grad)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            style={{
              transition: reduced ? 'none' : 'stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)',
            }}
          />
          {/* milestone ticks at 25 / 50 / 75% (spec decision #30): subtle radial
              marks across the stroke band; lime once the target progress crosses
              them, muted otherwise. Pure geometry on the same -90° frame as the
              arc, so they sit exactly where each quarter lands. */}
          {MILESTONES.map((m) => {
            const angle = m * 2 * Math.PI // 0 at 3 o'clock; the -90° group rotation puts 0% at top
            const cx = SIZE / 2 + R * Math.cos(angle)
            const cy = SIZE / 2 + R * Math.sin(angle)
            const crossed = target >= m
            return (
              <circle
                key={m}
                cx={cx}
                cy={cy}
                r={STROKE / 2 - 4}
                fill={crossed ? 'var(--color-lime-deep)' : 'var(--color-cream)'}
                stroke={crossed ? 'var(--color-roundai-green)' : 'var(--color-roundai-green)'}
                strokeOpacity={crossed ? 0.25 : 0.12}
                strokeWidth={1}
              />
            )
          })}
          <defs>
            <linearGradient id="roundai-ring-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--color-lime-deep)" />
              <stop offset="100%" stopColor="var(--color-lime)" />
            </linearGradient>
          </defs>
        </svg>

        {/* centre: the ✦ (pulses on celebrate) + the hero accumulated figure */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            aria-hidden="true"
            className={
              'text-[16.5px] text-lime-deep ' + (celebrate && !reduced ? 'roundai-spark-pulse' : '')
            }
          >
            ✦
          </span>
          <span className="tnum mt-0.5 font-display text-[30px] font-semibold leading-none tracking-tight text-roundai-green">
            {formatARS(accumulated)}
          </span>
          <span className="mt-1.5 text-[12px] font-medium text-roundai-green/45">
            {strings.goal.heroCaption}
          </span>
        </div>
      </div>

      {/* remaining / reached caption */}
      <p className="mt-4 text-center text-[13.5px] font-medium text-roundai-green/70">
        {reached
          ? strings.goal.reached
          : strings.goal.remaining.replace('{monto}', formatARS(remaining))}
      </p>
    </div>
  )
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
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

// One lime pulse on the centre ✦ — the single celebration. ~600ms, once.
const RING_CSS = `
@keyframes roundai-spark-pulse {
  0% { transform: scale(1); text-shadow: 0 0 0 rgba(200,245,96,0); }
  40% { transform: scale(1.5); text-shadow: 0 0 14px rgba(200,245,96,0.7); }
  100% { transform: scale(1); text-shadow: 0 0 0 rgba(200,245,96,0); }
}
.roundai-spark-pulse { animation: roundai-spark-pulse 600ms cubic-bezier(0.22,1,0.36,1) 1; }
@media (prefers-reduced-motion: reduce) {
  .roundai-spark-pulse { animation: none; }
}
`
