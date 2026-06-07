'use client'

import type { MechanismVisual } from '@/lib/proposal'
import { strings } from '@/data/strings'

// The inline MECHANISM VISUAL (iteration-4: "explicá mejor la killer feature").
// A mini card rendered in the chat column that shows the round-up at a glance,
// reusing the payment-split visual language (al comercio + a tu meta, sweep in
// lime ✦): a payment row "$ 4.350 café" splits down an arrow into the merchant
// amount (unchanged) and the round-up that travels to the goal. One short caption
// under it frames the picture. All figures come pre-rendered from proposal.ts
// (buildMechanismVisual) — no math here. Reduced-motion-safe: a single subtle
// one-shot glint on the sweep line; disabled under prefers-reduced-motion.

export function MechanismVisualCard({ visual }: { visual: MechanismVisual }) {
  const v = strings.proposal.mechanismVisual

  return (
    <div className="flex w-full flex-col gap-1.5 pt-0.5">
      <div className="roundai-mech-card w-full max-w-[88%] rounded-[16px] bg-roundai-green p-3.5 text-cream shadow-[0_10px_28px_-16px_rgba(7,42,32,0.7)]">
        <style>{MECH_CSS}</style>

        {/* the payment row — what the user taps to pay */}
        <div className="flex items-center justify-between rounded-[11px] bg-cream/[0.08] px-3 py-2">
          <span className="text-[14px] font-medium text-cream/70">{v.payLabel}</span>
          <span className="tnum text-[16.5px] font-semibold text-cream">{visual.payAmount}</span>
        </div>

        {/* split arrow — one payment fans into two destinations */}
        <div className="my-1.5 flex justify-center" aria-hidden="true">
          <svg width="20" height="18" viewBox="0 0 20 18" fill="none">
            <path
              d="M10 1v6M10 7 4 13M10 7l6 6M4 13v3M16 13v3"
              stroke="var(--color-lime)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.75"
            />
          </svg>
        </div>

        {/* the two outflows — merchant (unchanged) + the lime sweep to the goal */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-0.5 rounded-[11px] bg-cream/[0.06] px-3 py-2">
            <span className="text-[12px] font-medium text-cream/55">{v.toMerchant}</span>
            <span className="tnum text-[15.5px] font-semibold text-cream">
              {visual.toMerchant}
            </span>
          </div>
          <div className="roundai-mech-sweep flex flex-col gap-0.5 rounded-[11px] bg-lime/[0.16] px-3 py-2 ring-1 ring-lime/30">
            <span className="text-[12px] font-semibold text-lime">{v.toGoal}</span>
            <span className="tnum text-[15.5px] font-semibold text-lime">
              ✦ +{visual.toGoal}
            </span>
          </div>
        </div>
      </div>

      {/* one short caption under the picture */}
      <span className="px-1 text-[13.5px] font-medium leading-snug text-roundai-green/55">
        {strings.proposal.mechanismCaption}
      </span>
    </div>
  )
}

const MECH_CSS = `
@keyframes roundai-mech-rise {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes roundai-mech-glint {
  0%, 100% { box-shadow: 0 0 0 0 rgba(200,245,96,0); }
  45% { box-shadow: 0 0 0 4px rgba(200,245,96,0.28); }
}
.roundai-mech-card { animation: roundai-mech-rise 320ms cubic-bezier(0.22,1,0.36,1) both; }
.roundai-mech-sweep { animation: roundai-mech-glint 1.6s ease-out 360ms 1; }
@media (prefers-reduced-motion: reduce) {
  .roundai-mech-card, .roundai-mech-sweep { animation: none; }
}
`
