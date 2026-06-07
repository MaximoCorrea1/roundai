'use client'

import { useState } from 'react'
import { strings } from '@/data/strings'

// Goal-select v2 (iteration-4: "reducí las opciones a dos"). Replaces the 4-chip
// OptionButtons with exactly TWO cards:
//
//   1. "Quiero llegar a esta meta" — a card with a VISIBLE inline amount input +
//      a go-arrow embedded in the card. Typing a monto and confirming reports it
//      upstream (replacing the separate amount step): name → timeline as before.
//   2. "Quiero que mi plata rinda" — the open plan; tapping it skips amount AND
//      timeline straight to the proposal.
//
// 'ahorrar' / 'nose' are intentionally NOT rendered (kept in types/strings for
// compat). All copy from strings; no money math here — we report a plain number.

const nf = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '')
}

export function GoalSelectV2({
  onSelectMeta,
  onSelectRendir,
  disabled = false,
}: {
  /** "Quiero llegar a esta meta" with the inline amount the user typed (ARS). */
  onSelectMeta: (amount: number) => void
  /** "Quiero que mi plata rinda" — open plan, no amount. */
  onSelectRendir: () => void
  disabled?: boolean
}) {
  const s = strings.onboarding.goalSelectV2
  const [raw, setRaw] = useState('')
  const value = raw === '' ? 0 : Number(raw)
  const display = raw === '' ? '' : nf.format(value)
  const canGo = !disabled && value > 0

  return (
    <div className="flex w-full flex-col gap-2.5 pt-1">
      {/* META — card with the inline amount input + embedded go-arrow */}
      <div className="flex flex-col gap-2.5 rounded-[16px] bg-roundai-green/[0.04] p-3.5 ring-1 ring-roundai-green/[0.10]">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-lime/30 text-roundai-green"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path
                d="M2.5 5.8 4.4 7.7 8.5 3.3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="flex-1 text-[16.5px] font-semibold leading-tight text-roundai-green">
            {s.metaTitle}
          </span>
        </div>

        {/* the inline monto field + embedded go-arrow button */}
        <div className="flex items-center gap-2 rounded-[12px] bg-cream px-3 py-2 ring-1 ring-roundai-green/[0.12]">
          <span className="tnum text-[19px] font-semibold text-roundai-green/40">$</span>
          <input
            inputMode="numeric"
            autoComplete="off"
            disabled={disabled}
            value={display}
            placeholder={s.metaPlaceholder}
            onChange={(e) => setRaw(digitsOnly(e.target.value))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canGo) {
                e.preventDefault()
                onSelectMeta(value)
              }
            }}
            aria-label={s.metaInputLabel}
            className="tnum w-full bg-transparent text-[19px] font-semibold text-roundai-green outline-none placeholder:text-roundai-green/25"
          />
          <button
            type="button"
            disabled={!canGo}
            onClick={() => onSelectMeta(value)}
            aria-label={s.metaGo}
            className={
              'grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all ' +
              (canGo
                ? 'bg-roundai-green text-lime active:scale-95'
                : 'bg-roundai-green/15 text-roundai-green/30')
            }
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <span className="px-0.5 text-[13px] font-medium text-roundai-green/45">{s.metaHint}</span>
      </div>

      {/* RENDIR — the open plan card (skips amount + timeline) */}
      <button
        type="button"
        disabled={disabled}
        onClick={onSelectRendir}
        className={
          'group flex items-center gap-2.5 rounded-[16px] bg-roundai-green/[0.04] px-3.5 py-3.5 text-left ring-1 ring-roundai-green/[0.10] transition-all ' +
          (disabled
            ? 'cursor-default opacity-45'
            : 'active:scale-[0.99] active:bg-roundai-green/[0.08]')
        }
      >
        <span
          aria-hidden="true"
          className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-lime/30 text-roundai-green"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path
              d="M2.5 5.8 4.4 7.7 8.5 3.3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[16.5px] font-semibold leading-tight text-roundai-green">
            {s.rendirTitle}
          </span>
          <span className="mt-0.5 text-[13px] font-medium text-roundai-green/45">
            {s.rendirHint}
          </span>
        </span>
      </button>
    </div>
  )
}
