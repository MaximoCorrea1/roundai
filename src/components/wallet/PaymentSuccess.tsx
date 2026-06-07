'use client'

import type { RiskProfile } from '@/lib/roundup'
import { DEMO_PAYMENT } from '@/data/transactions'
import { formatARS, formatPct } from '@/lib/roundup'
import { strings } from '@/data/strings'

// Payment success, v3 (iteration 3) — FULL-SCREEN, the causal-loop payoff and
// the moment of delight. A check lands (one well-timed entrance, ~400ms), then
// THE SPLIT is the hero: the biggest thing on screen is the money that moved
// (al comercio + a tu meta, the sweep in lime, display font), then the quiet
// line naming where the sweep went, then the counterfactual that sells the
// before/after. No confetti. Done CTA pinned to the thumb zone.
//
// Three states, all derivable from the props already in hand:
// - swept (active && sweep > 0): full split + destination + "sin roundai" line.
// - toggle OFF (active && sweep === 0): the user flipped round-up off on the
//   pay screen — show ONE quiet line (toggleOffHint), no split.
// - pre-activation (marginFraction == null): a PLAIN success — no split, no
//   hint — the implicit "before" if the presenter pays before activating.
//
// All money comes pre-computed: `sweep` is the reducer's stored sweep for this
// payment; formatting is the calculator's (formatARS / formatPct). No math here.

export function PaymentSuccess({
  sweep,
  marginFraction,
  sessionRisk,
  onClose,
}: {
  sweep: number
  marginFraction: number | null
  // Session investor profile (state.sessionRisk) — names the FCI the sweep funds.
  // Optional so the success screen still type-checks before AppShell threads it.
  sessionRisk?: RiskProfile | null
  onClose: () => void
}) {
  const p = strings.payment
  const active = marginFraction != null
  const swept = active && sweep > 0
  const toggledOff = active && sweep === 0 // round-up was switched off on the pay screen

  return (
    <div className="roundai-ok absolute inset-0 flex flex-col bg-cream">
      <style>{SUCCESS_CSS}</style>

      {/* the check + headline — the delight beat */}
      <div className="flex shrink-0 flex-col items-center px-6 pt-[120px] text-center">
        <span className="roundai-check grid h-[88px] w-[88px] place-items-center rounded-full bg-roundai-green text-lime shadow-[0_18px_44px_-18px_rgba(7,42,32,0.7)]">
          <svg width="42" height="42" viewBox="0 0 32 32" fill="none" aria-hidden="true">
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
        <h1 className="roundai-ok-head mt-6 font-display text-[28px] font-semibold tracking-tight text-roundai-green">
          {p.success}
        </h1>
        <p className="roundai-ok-head mt-1.5 text-[15px] text-roundai-green/55">
          {p.successSubtitle.replace('{comercio}', DEMO_PAYMENT.merchant)}
        </p>
      </div>

      {/* the split — the hero when a sweep happened */}
      <div className="flex min-h-0 flex-1 flex-col justify-center px-6">
        {swept && (
          <div>
            <div className="roundai-split-card rounded-[var(--radius-lg)] bg-roundai-green p-6 text-cream shadow-[0_20px_48px_-22px_rgba(7,42,32,0.85)]">
              {/* al comercio */}
              <div className="flex items-center justify-between">
                <span className="text-[15px] text-cream/65">{p.toMerchant}</span>
                <span className="tnum text-[22px] font-semibold text-cream">
                  {formatARS(DEMO_PAYMENT.amount)}
                </span>
              </div>

              <div className="my-4 h-px bg-cream/12" />

              {/* a tu meta — the lime line, the one that grew. Display font, huge. */}
              <div className="roundai-sweep-line flex items-end justify-between">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[15px] font-semibold text-lime">{p.toGoal}</span>
                  <span className="w-fit rounded-full bg-lime px-2.5 py-1 text-[12px] font-semibold leading-none text-roundai-green">
                    {interpolate(p.sweepBadgeWithMargin, { margen: formatPct(marginFraction) })}
                  </span>
                </div>
                <span className="tnum font-display text-[40px] font-semibold leading-none text-lime">
                  +{formatARS(sweep)}
                </span>
              </div>

              {/* a dónde va — names the FCI the sweep funds (sessionRisk) */}
              {sessionRisk && (
                <p className="roundai-sweep-caption mt-4 text-[13.5px] text-cream/60">
                  {interpolate(p.destination, { perfil: sessionRisk })}
                </p>
              )}
            </div>

            {/* the moment line + the quiet counterfactual — reinforce the payoff */}
            <p className="roundai-sweep-caption mt-5 text-center text-[15px] font-medium text-lime-deep">
              {p.sweepLanded}
            </p>
            <p className="roundai-sweep-caption mt-1.5 text-center text-[13px] text-roundai-green/45">
              {p.withoutRoundai}
            </p>
          </div>
        )}

        {/* toggle was OFF — one quiet line instead of the split */}
        {toggledOff && (
          <p className="roundai-ok-head text-center text-[15px] text-roundai-green/50">{p.toggleOffHint}</p>
        )}
      </div>

      {/* done — pinned to the thumb zone */}
      <div className="shrink-0 px-6 pt-2 pb-9">
        <button
          type="button"
          onClick={onClose}
          className="flex w-full items-center justify-center rounded-full bg-roundai-green py-4 text-[17px] font-semibold text-lime shadow-[0_12px_30px_-12px_rgba(7,42,32,0.7)] transition-transform active:scale-[0.985]"
        >
          {p.done}
        </button>
      </div>
    </div>
  )
}

/** Replace every {key} token with its value. */
function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, key: string) => (key in values ? values[key] : m))
}

// One restrained celebration: the surface fades up, the check draws on, then the
// split card rises and the sweep line glints once. No confetti. Reduced-motion:
// everything is just present, no animation.
const SUCCESS_CSS = `
@keyframes roundai-ok-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes roundai-check-pop {
  0% { transform: scale(0.6); opacity: 0; }
  60% { transform: scale(1.06); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes roundai-check-draw {
  from { stroke-dasharray: 28; stroke-dashoffset: 28; }
  to { stroke-dasharray: 28; stroke-dashoffset: 0; }
}
@keyframes roundai-rise {
  from { transform: translateY(12px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.roundai-ok { animation: roundai-ok-in 200ms ease-out both; }
.roundai-check { animation: roundai-check-pop 420ms cubic-bezier(0.22,1,0.36,1) both; }
.roundai-check-mark { animation: roundai-check-draw 360ms ease-out 280ms both; }
.roundai-ok-head { animation: roundai-rise 420ms ease-out 220ms both; }
.roundai-split-card { animation: roundai-rise 460ms cubic-bezier(0.22,1,0.36,1) 360ms both; }
.roundai-sweep-line { animation: roundai-rise 420ms ease-out 460ms both; }
.roundai-sweep-caption { animation: roundai-rise 420ms ease-out 560ms both; }
@media (prefers-reduced-motion: reduce) {
  .roundai-ok, .roundai-check, .roundai-check-mark, .roundai-ok-head,
  .roundai-split-card, .roundai-sweep-line, .roundai-sweep-caption { animation: none; }
  .roundai-check-mark { stroke-dasharray: none; stroke-dashoffset: 0; }
}
`
