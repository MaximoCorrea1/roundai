'use client'

import { DEMO_PAYMENT } from '@/data/transactions'
import { formatARS, formatPct } from '@/lib/roundup'
import { strings } from '@/data/strings'

// Payment success (spec #23) — the causal-loop payoff. A check lands, then (with
// roundai active) the split unfolds: the comercio got the full amount, AND a
// slice quietly swept into the goal. The quiet counterfactual ("sin roundai: $0
// a tu meta") sells the before/after with zero extra state.
//
// With roundai INACTIVE (marginFraction == null, sweep 0): a PLAIN success — no
// split, no counterfactual — which is the implicit "before" if the presenter
// pays before activating.
//
// All money comes pre-computed: `sweep` is the reducer's stored sweep for this
// payment; formatting is the calculator's (formatARS / formatPct). No math here.

export function PaymentSuccess({
  sweep,
  marginFraction,
  onClose,
}: {
  sweep: number
  marginFraction: number | null
  onClose: () => void
}) {
  const p = strings.payment
  const active = marginFraction != null

  return (
    <div className="absolute inset-0">
      <style>{SUCCESS_CSS}</style>

      {/* full cream surface — this is a moment, it owns the screen */}
      <div className="flex h-full w-full flex-col bg-cream px-6 pb-9 pt-[96px]">
        {/* close */}
        <div className="flex justify-end">
          <button
            type="button"
            aria-label={strings.a11y.closePayment}
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-roundai-green/[0.06] text-roundai-green/70 transition-colors active:bg-roundai-green/10"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path d="M3.5 3.5l8 8M11.5 3.5l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* the check + headline */}
        <div className="mt-6 flex flex-col items-center text-center">
          <span className="roundai-check grid h-[68px] w-[68px] place-items-center rounded-full bg-roundai-green text-lime">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path
                className="roundai-check-mark"
                d="M9 16.5l4.5 4.5L23 11"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h2 className="mt-4 font-display text-[22px] font-semibold tracking-tight text-roundai-green">
            {p.success}
          </h2>
          <p className="mt-1 text-[13px] text-roundai-green/55">
            {p.successSubtitle.replace('{comercio}', DEMO_PAYMENT.merchant)}
          </p>
        </div>

        {/* the split — only with roundai active */}
        {active ? (
          <div className="mt-8">
            <div className="rounded-[var(--radius-lg)] bg-nimbo-surface p-5 shadow-[var(--shadow-card)]">
              {/* al comercio */}
              <div className="flex items-center justify-between">
                <span className="text-[13.5px] text-roundai-green/65">{p.toMerchant}</span>
                <span className="tnum text-[17px] font-semibold text-roundai-green">
                  {formatARS(DEMO_PAYMENT.amount)}
                </span>
              </div>

              <div className="my-3.5 h-px bg-roundai-green/10" />

              {/* a tu meta — the lime line, the one that grew */}
              <div className="roundai-sweep-line flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-semibold text-roundai-green">{p.toGoal}</span>
                  <span className="rounded-full bg-roundai-green px-2 py-[3px] text-[9.5px] font-semibold leading-none text-lime">
                    {interpolate(p.sweepBadgeWithMargin, { margen: formatPct(marginFraction) })}
                  </span>
                </div>
                <span className="tnum text-[19px] font-semibold text-lime-deep">+{formatARS(sweep)}</span>
              </div>
            </div>

            {/* sweep-landed micro-headline */}
            <p className="roundai-sweep-caption mt-3 text-center text-[12.5px] font-medium text-roundai-green/70">
              {p.sweepLanded}
            </p>

            {/* the quiet counterfactual */}
            <p className="mt-1.5 text-center text-[11.5px] text-roundai-green/40">{p.withoutRoundai}</p>
          </div>
        ) : null}

        {/* done */}
        <div className="mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center rounded-full bg-roundai-green py-3.5 text-[15px] font-semibold text-lime shadow-[0_10px_26px_-12px_rgba(7,42,32,0.7)] transition-transform active:scale-[0.985]"
          >
            {p.done}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Replace every {key} token with its value. */
function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, key: string) => (key in values ? values[key] : m))
}

// One restrained celebration: the check draws on, then the sweep line glints
// once. No confetti. Reduced-motion: everything is just present, no animation.
const SUCCESS_CSS = `
@keyframes roundai-check-pop {
  0% { transform: scale(0.6); opacity: 0; }
  60% { transform: scale(1.06); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes roundai-check-draw {
  from { stroke-dasharray: 28; stroke-dashoffset: 28; }
  to { stroke-dasharray: 28; stroke-dashoffset: 0; }
}
@keyframes roundai-sweep-rise {
  from { transform: translateY(8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.roundai-check { animation: roundai-check-pop 420ms cubic-bezier(0.22,1,0.36,1) both; }
.roundai-check-mark { animation: roundai-check-draw 360ms ease-out 280ms both; }
.roundai-sweep-line { animation: roundai-sweep-rise 420ms ease-out 420ms both; }
.roundai-sweep-caption { animation: roundai-sweep-rise 420ms ease-out 560ms both; }
@media (prefers-reduced-motion: reduce) {
  .roundai-check, .roundai-check-mark, .roundai-sweep-line, .roundai-sweep-caption { animation: none; }
  .roundai-check-mark { stroke-dasharray: none; stroke-dashoffset: 0; }
}
`
