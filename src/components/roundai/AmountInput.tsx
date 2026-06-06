'use client'

import { useState } from 'react'
import { strings } from '@/data/strings'

// ARS amount entry for 'meta' / 'ahorrar'. Numeric only; formatted live with
// es-AR thousands separators (dots) as the user types. Three quick-amount chips
// jump to common targets. Confirm reports a plain number upstream (→ SET_AMOUNT),
// which then drives the real proposal math. No decimals — pesos only.

const nf = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 })

function digitsOnly(s: string): string {
  return s.replace(/\D/g, '')
}

export function AmountInput({
  onConfirm,
  disabled = false,
}: {
  onConfirm: (amount: number) => void
  disabled?: boolean
}) {
  const a = strings.onboarding.amount
  const [raw, setRaw] = useState('') // canonical: digit string, no separators
  const value = raw === '' ? 0 : Number(raw)
  const display = raw === '' ? '' : nf.format(value)
  const canConfirm = !disabled && value > 0

  return (
    <div className="flex w-full flex-col gap-2.5 rounded-[16px] bg-roundai-green/[0.04] p-3.5 ring-1 ring-roundai-green/[0.10]">
      <label className="text-[12px] font-medium text-roundai-green/60">{a.label}</label>

      {/* the masked field — big mono figure, leading $ */}
      <div className="flex items-baseline gap-1.5 rounded-[12px] bg-cream px-3 py-2.5 ring-1 ring-roundai-green/[0.12]">
        <span className="tnum text-[20px] font-semibold text-roundai-green/40">$</span>
        <input
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          value={display}
          placeholder={a.placeholder}
          onChange={(e) => setRaw(digitsOnly(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canConfirm) {
              e.preventDefault()
              onConfirm(value)
            }
          }}
          aria-label={a.label}
          className="tnum w-full bg-transparent text-[20px] font-semibold text-roundai-green outline-none placeholder:text-roundai-green/25"
        />
      </div>

      {/* quick-amount chips */}
      <div className="grid grid-cols-3 gap-2">
        <QuickChip
          label={a.quick.lo}
          disabled={disabled}
          onClick={() => setRaw(String(a.quickValues.lo))}
        />
        <QuickChip
          label={a.quick.mid}
          disabled={disabled}
          onClick={() => setRaw(String(a.quickValues.mid))}
        />
        <QuickChip
          label={a.quick.hi}
          disabled={disabled}
          onClick={() => setRaw(String(a.quickValues.hi))}
        />
      </div>

      <button
        type="button"
        disabled={!canConfirm}
        onClick={() => onConfirm(value)}
        className={
          'mt-0.5 rounded-[12px] py-2.5 text-[14px] font-semibold transition-all ' +
          (canConfirm
            ? 'bg-roundai-green text-lime active:scale-[0.99]'
            : 'bg-roundai-green/15 text-roundai-green/30')
        }
      >
        {a.confirm}
      </button>
    </div>
  )
}

function QuickChip({
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
      className="tnum rounded-[10px] bg-roundai-green/[0.06] py-2 text-[12px] font-semibold text-roundai-green ring-1 ring-roundai-green/[0.08] transition-all active:scale-[0.97] active:bg-roundai-green/[0.10] disabled:opacity-45"
    >
      {label}
    </button>
  )
}
