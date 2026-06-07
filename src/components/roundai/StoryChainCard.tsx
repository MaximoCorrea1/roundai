'use client'

import type { StoryChain } from '@/lib/proposal'
import { strings } from '@/data/strings'

// PHASE 9 · THE CHAIN CARD — the single visual that IS the pitch. ONE connected
// vertical flow replaces both the old MechanismVisualCard and NumbersCard: each
// row feeds the next down an arrow, so a judge SEES the money travel from a
// purchase all the way to the 12-month return.
//
//   [café $ 4.350  ✦ +3,5%]   → +$ 154
//    ↓
//   [gastás $ 1.180.000/mes]
//    ↓
//   [invertís $ 41.667/mes]
//    ↓ 12 meses · FCI moderado
//   [≈ $ 588.543   (+$ 88.543 ✦ simulado)]
//
// Tabular money (.tnum) so figures line up; lime accents on the sweep + return
// rows (the value-creating steps). All values pre-rendered by proposal.ts
// (buildStoryChain) — NO math here. Re-renders with the story beats on a margin
// tweak (the parent feeds a fresh chain). Reduced-motion-safe single rise-in.

export function StoryChainCard({ chain }: { chain: StoryChain }) {
  if (!chain.hasChain) return null
  const c = strings.proposal.chain

  return (
    <div className="roundai-chain-card w-full max-w-[92%] rounded-[18px] bg-roundai-green p-4 text-cream shadow-[0_12px_32px_-16px_rgba(7,42,32,0.75)]">
      <style>{CHAIN_CSS}</style>

      {/* (1) la compra — café + the round-up badge, sweep in lime on the right */}
      <div className="flex items-center justify-between rounded-[13px] bg-cream/[0.08] px-3.5 py-2.5">
        <span className="flex items-baseline gap-2">
          <span className="text-[14px] font-medium text-cream/70">{c.cafeLabel}</span>
          <span className="tnum text-[17px] font-semibold text-cream">{chain.cafeAmount}</span>
          <span className="rounded-full bg-lime/[0.18] px-2 py-0.5 text-[12.5px] font-semibold text-lime ring-1 ring-lime/30">
            ✦ {chain.roundBadge}
          </span>
        </span>
        <span className="tnum text-[16px] font-semibold text-lime">→ +{chain.cafeSweep}</span>
      </div>

      <ChainArrow />

      {/* (2) gastás — the monthly round-up base */}
      <ChainRow label={c.gastasLabel} value={`${chain.gasto}${c.perMes}`} />

      <ChainArrow />

      {/* (3) invertís — the monthly contribution, lime (the value step) */}
      <ChainRow label={c.invertisLabel} value={`${chain.aporte}${c.perMes}`} accent />

      {/* (4) the horizon connector — 12 meses · FCI {risk}, on the arrow */}
      <ChainArrow caption={chain.horizon} />

      {/* (5) the return — the 12-month simulated total, lime, the payoff */}
      <div className="flex items-center justify-between rounded-[13px] bg-lime/[0.16] px-3.5 py-3 ring-1 ring-lime/30">
        <span className="flex flex-col">
          <span className="tnum text-[22px] font-semibold leading-none text-lime">
            ≈ {chain.total12}
          </span>
          <span className="mt-1 text-[12.5px] font-medium text-lime/80">
            ✦ {chain.returnNote}
          </span>
        </span>
      </div>
    </div>
  )
}

/** One flow row: label on the left, tabular value on the right. */
function ChainRow({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div
      className={
        'flex items-center justify-between rounded-[13px] px-3.5 py-2.5 ' +
        (accent ? 'bg-lime/[0.10] ring-1 ring-lime/20' : 'bg-cream/[0.06]')
      }
    >
      <span className={'text-[14px] font-medium ' + (accent ? 'text-lime' : 'text-cream/70')}>
        {label}
      </span>
      <span className={'tnum text-[17px] font-semibold ' + (accent ? 'text-lime' : 'text-cream')}>
        {value}
      </span>
    </div>
  )
}

/** The connector between rows: a downward arrow, optionally with a caption beside it. */
function ChainArrow({ caption }: { caption?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-1" aria-hidden="true">
      <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
        <path
          d="M7 1v11M7 12 3 8M7 12l4-4"
          stroke="var(--color-lime)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />
      </svg>
      {caption && (
        <span className="text-[12.5px] font-medium text-cream/55">{caption}</span>
      )}
    </div>
  )
}

const CHAIN_CSS = `
@keyframes roundai-chain-rise {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.roundai-chain-card { animation: roundai-chain-rise 360ms cubic-bezier(0.22,1,0.36,1) both; }
@media (prefers-reduced-motion: reduce) { .roundai-chain-card { animation: none; } }
`
