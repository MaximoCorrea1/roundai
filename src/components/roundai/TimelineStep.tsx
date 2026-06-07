'use client'

import { useState } from 'react'
import { strings } from '@/data/strings'

// The plazo step (decision #25): after the amount, "¿Para cuándo?" — chips
// 6 / 12 / 24 meses + "otro". Picking "otro" reveals an integer-months input
// (≥ 1). Confirm reports the chosen months upstream (→ SET_TIMELINE), which
// drives planGoal and the proposal margin. Mirrors AmountInput's affordances.

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '')
}

export function TimelineStep({
  onConfirm,
  disabled = false,
}: {
  onConfirm: (months: number) => void
  disabled?: boolean
}) {
  const t = strings.onboarding.timeline
  const [custom, setCustom] = useState(false)
  const [raw, setRaw] = useState('') // digit string, no separators
  const months = raw === '' ? 0 : Number(raw)
  const canConfirm = !disabled && months >= 1

  if (!custom) {
    return (
      <div className="flex w-full flex-col gap-2 pt-1">
        <div className="grid grid-cols-3 gap-2">
          <Chip
            label={t.chips.m6}
            disabled={disabled}
            onClick={() => onConfirm(t.values.m6)}
          />
          <Chip
            label={t.chips.m12}
            disabled={disabled}
            onClick={() => onConfirm(t.values.m12)}
          />
          <Chip
            label={t.chips.m24}
            disabled={disabled}
            onClick={() => onConfirm(t.values.m24)}
          />
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={() => setCustom(true)}
          className="rounded-[12px] bg-roundai-green/[0.04] py-2.5 text-[15.5px] font-semibold text-roundai-green/70 ring-1 ring-roundai-green/[0.10] transition-all active:scale-[0.99] active:bg-roundai-green/[0.08] disabled:opacity-45"
        >
          {t.chips.otro}
        </button>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-2.5 rounded-[16px] bg-roundai-green/[0.04] p-3.5 ring-1 ring-roundai-green/[0.10]">
      <label className="text-[13.5px] font-medium text-roundai-green/60">{t.customLabel}</label>
      <div className="flex items-baseline gap-1.5 rounded-[12px] bg-cream px-3 py-2.5 ring-1 ring-roundai-green/[0.12]">
        <input
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          disabled={disabled}
          value={raw}
          placeholder={t.customPlaceholder}
          onChange={(e) => setRaw(digitsOnly(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canConfirm) {
              e.preventDefault()
              onConfirm(months)
            }
          }}
          aria-label={t.customLabel}
          className="tnum w-full bg-transparent text-[20px] font-semibold text-roundai-green outline-none placeholder:text-roundai-green/25"
        />
        <span className="text-[14.5px] font-medium text-roundai-green/40">{t.customUnit}</span>
      </div>
      <button
        type="button"
        disabled={!canConfirm}
        onClick={() => onConfirm(months)}
        className={
          'mt-0.5 rounded-[12px] py-2.5 text-[15.5px] font-semibold transition-all ' +
          (canConfirm
            ? 'bg-roundai-green text-lime active:scale-[0.99]'
            : 'bg-roundai-green/15 text-roundai-green/30')
        }
      >
        {t.customConfirm}
      </button>
    </div>
  )
}

function Chip({
  label,
  disabled,
  onClick,
}: {
  label: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="tnum rounded-[12px] bg-roundai-green/[0.06] py-3 text-[15.5px] font-semibold text-roundai-green ring-1 ring-roundai-green/[0.10] transition-all active:scale-[0.97] active:bg-roundai-green/[0.10] disabled:opacity-45"
    >
      {label}
    </button>
  )
}
