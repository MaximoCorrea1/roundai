'use client'

import { useState } from 'react'
import { strings } from '@/data/strings'

// Optional goal-name step (iteration 3): after the amount, "ponele nombre" so the
// proposal and goal page can address the goal by name. A free-text field plus
// 2-3 quick preset chips. Confirm reports the trimmed name upstream (→
// SET_GOAL_LABEL); "Saltar" reports undefined so the type's default label stands.
// Mirrors AmountInput's affordances; advancing always lands on the timeline step.

export function GoalNameInput({
  onConfirm,
  onSkip,
  disabled = false,
}: {
  onConfirm: (label: string) => void
  onSkip: () => void
  disabled?: boolean
}) {
  const n = strings.onboarding.goalName
  const [value, setValue] = useState('')
  const trimmed = value.trim()
  const canConfirm = !disabled && trimmed.length > 0

  return (
    <div className="flex w-full flex-col gap-2.5 rounded-[16px] bg-roundai-green/[0.04] p-3.5 ring-1 ring-roundai-green/[0.10]">
      <label className="text-[13.5px] font-medium text-roundai-green/60">{n.label}</label>

      {/* the name field */}
      <div className="rounded-[12px] bg-cream px-3 py-2.5 ring-1 ring-roundai-green/[0.12]">
        <input
          type="text"
          autoComplete="off"
          maxLength={32}
          disabled={disabled}
          value={value}
          placeholder={n.placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canConfirm) {
              e.preventDefault()
              onConfirm(trimmed)
            }
          }}
          aria-label={n.label}
          className="w-full bg-transparent text-[16px] font-semibold text-roundai-green outline-none placeholder:text-roundai-green/25"
        />
      </div>

      {/* quick preset chips */}
      <div className="flex flex-wrap gap-2">
        <PresetChip label={n.chips.compu} disabled={disabled} onClick={() => setValue(n.chips.compu)} />
        <PresetChip label={n.chips.viaje} disabled={disabled} onClick={() => setValue(n.chips.viaje)} />
        <PresetChip
          label={n.chips.colchon}
          disabled={disabled}
          onClick={() => setValue(n.chips.colchon)}
        />
      </div>

      <div className="mt-0.5 flex items-center gap-2">
        <button
          type="button"
          disabled={!canConfirm}
          onClick={() => onConfirm(trimmed)}
          className={
            'flex-1 rounded-[12px] py-2.5 text-[16.5px] font-semibold transition-all ' +
            (canConfirm
              ? 'bg-roundai-green text-lime active:scale-[0.99]'
              : 'bg-roundai-green/15 text-roundai-green/30')
          }
        >
          {n.confirm}
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onSkip}
          className="rounded-[12px] bg-roundai-green/[0.06] px-4 py-2.5 text-[14.5px] font-semibold text-roundai-green/70 ring-1 ring-roundai-green/[0.10] transition-all active:scale-[0.99] active:bg-roundai-green/[0.08] disabled:opacity-45"
        >
          {n.skip}
        </button>
      </div>
    </div>
  )
}

function PresetChip({
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
      className="rounded-full bg-roundai-green/[0.06] px-3 py-1.5 text-[13.5px] font-semibold text-roundai-green ring-1 ring-roundai-green/[0.10] transition-all active:scale-[0.97] active:bg-roundai-green/[0.10] disabled:opacity-45"
    >
      {label}
    </button>
  )
}
