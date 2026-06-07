'use client'

import { useState } from 'react'
import { strings } from '@/data/strings'

// Nimbo balance card — deliberately conventional neobank surface: white card,
// cool slate label, tabular figure, a quiet hide/show eye toggle. Restraint on
// purpose; roundai's character lives in the tile, not here.

export function BalanceCard({
  label,
  amount,
}: {
  label: string
  amount: string
}) {
  const [hidden, setHidden] = useState(false)

  return (
    <div
      className="relative overflow-hidden bg-nimbo-surface p-5 shadow-[var(--shadow-card)]"
      style={{ borderRadius: 'var(--radius-lg)' }}
    >
      {/* faint slate wash so the card has depth without breaking neutrality */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(120% 100% at 100% 0%, #f7f9fc 0%, #ffffff 55%)',
        }}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-semibold tracking-wide text-nimbo-slate">
            {label}
          </span>
          <button
            type="button"
            onClick={() => setHidden((v) => !v)}
            aria-label={hidden ? strings.a11y.showBalance : strings.a11y.hideBalance}
            className="grid h-8 w-8 place-items-center rounded-full text-nimbo-slate transition-colors hover:bg-nimbo-tint"
          >
            {hidden ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        <div className="mt-2.5 flex items-end gap-1">
          {hidden ? (
            <span className="text-[42px] font-bold leading-none tracking-tight text-ink">
              ••••••
            </span>
          ) : (
            <span className="tnum text-[42px] font-bold leading-none tracking-tight text-ink">
              {amount}
            </span>
          )}
        </div>

        <div className="mt-3.5 flex items-center gap-1.5 text-[13.5px] font-medium text-nimbo-slate">
          <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-nimbo-tint text-nimbo-slate-deep">
            <CardChipIcon />
          </span>
          <span>•••• 4827 · cuenta en pesos</span>
        </div>
      </div>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M1 9s3-5.5 8-5.5S17 9 17 9s-3 5.5-8 5.5S1 9 1 9Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M7.2 3.7C7.8 3.6 8.4 3.5 9 3.5c5 0 8 5.5 8 5.5a14 14 0 0 1-2.3 2.9M4.4 4.9A14 14 0 0 0 1 9s3 5.5 8 5.5c1 0 1.9-.2 2.7-.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.4 7.4a2.3 2.3 0 0 0 3.2 3.2M2 2l14 14"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CardChipIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden="true">
      <rect x="0.7" y="1.5" width="7.6" height="6" rx="1.4" stroke="currentColor" strokeWidth="1" />
      <path d="M3 1.5v6M6 1.5v6" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  )
}
