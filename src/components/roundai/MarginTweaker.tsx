'use client'

import { useState } from 'react'
import type { UserProfile, RiskProfile } from '@/lib/roundup'
import {
  monthlyContribution,
  monthsAtRate,
  sweepForPayment,
  savingsCapacity,
  RISK_TO_MARGIN,
  formatARS,
  formatPct,
} from '@/lib/roundup'
import { DEMO_PAYMENT } from '@/data/transactions'
import { strings } from '@/data/strings'

// The interactive margin tweaker (decision #27). Opened by tapping the margin
// chip in the proposal. A −/+ stepper in 0.5% steps over [1%, min(capacityCap,
// 20%)]; live rows recompute on every step: aporte/mes, llegás en, café-sweep,
// and a sustainability bar that turns amber above the SESSION-risk cap (the
// margin the user's declared profile allows). Confirm commits the margin —
// the proposal re-renders to match.
//
// All money math/formatting flows through the calculator (roundup.ts). DEMO_PAYMENT
// is imported READ-ONLY for the café row.

const STEP = 0.005 // 0.5% steps
const FLOOR = 0.01
const CEIL = 0.2
const CAFE = DEMO_PAYMENT.amount
// Warm amber for the "over your profile cap" warning — picked to sit on cream
// without clashing with the green/lime brand (not a generic alert red).
const AMBER = '#e6a23c'
const AMBER_TEXT = '#b5781f'

export function MarginTweaker({
  profile,
  risk,
  amount,
  initialMargin,
  capacityCapFraction,
  onConfirm,
}: {
  profile: UserProfile
  risk: RiskProfile
  /** Target amount for the "llegás en" projection; undefined for open goals. */
  amount?: number
  initialMargin: number
  /** Hard ceiling from capacity (savingsCapacity / gasto), as a fraction. */
  capacityCapFraction: number
  onConfirm: (margin: number) => void
}) {
  const tw = strings.tweaker
  // Effective range: at least the floor, never above the capacity cap or 20%.
  const max = Math.max(FLOOR, Math.min(capacityCapFraction, CEIL))
  const clamp = (m: number) => Math.min(max, Math.max(FLOOR, m))
  // Keep the initial margin EXACT (it's the proposal's unsnapped plan margin —
  // snapping it here made the tweaker open showing different numbers than the
  // bubble beside it: 13 meses/$152 vs 12 meses/$154). Snap only on user steps.
  const [margin, setMargin] = useState(() => clamp(initialMargin))

  const capacity = savingsCapacity(profile)
  const contribution = monthlyContribution(profile, margin)
  const cafeSweep = sweepForPayment(CAFE, margin)
  const months = amount && amount > 0 ? monthsAtRate(amount, contribution).months : null

  // Sustainability: amber once the margin exceeds the SESSION-risk cap.
  const riskCap = RISK_TO_MARGIN[risk]
  const overCap = margin > riskCap + 1e-9
  // Bar fill = contribution / capacity (clamped to [0,1] for display).
  const fill = capacity > 0 ? Math.min(1, contribution / capacity) : 1

  const canDown = margin > FLOOR + 1e-9
  const canUp = margin < max - 1e-9

  return (
    <div className="flex w-full flex-col gap-3 rounded-[16px] bg-roundai-green/[0.05] p-3.5 ring-1 ring-roundai-green/[0.12]">
      <div className="flex items-center justify-between">
        <span className="text-[13.5px] font-semibold text-roundai-green/70">{tw.title}</span>
        <span aria-hidden="true" className="text-[13.5px] text-lime-deep">
          ✦
        </span>
      </div>

      {/* stepper — big mono margin, −/+ on the sides */}
      <div className="flex items-center justify-between gap-3">
        <StepBtn
          dir="down"
          label={tw.stepDown}
          disabled={!canDown}
          onClick={() => setMargin((m) => clamp(snap(m - STEP)))}
        />
        <span className="tnum text-[30px] font-semibold leading-none text-roundai-green">
          {formatPct(margin)}
        </span>
        <StepBtn
          dir="up"
          label={tw.stepUp}
          disabled={!canUp}
          onClick={() => setMargin((m) => clamp(snap(m + STEP)))}
        />
      </div>

      {/* live rows */}
      <div className="flex flex-col gap-1.5">
        <Row label={tw.rowAporte} value={`${formatARS(contribution)}/mes`} />
        {amount != null && amount > 0 && (
          <Row
            label={tw.rowMonths}
            value={
              months != null
                ? tw.monthsValue.replace('{meses}', String(months))
                : tw.monthsUnreachable
            }
          />
        )}
        <Row
          label={tw.rowCafe.replace('{cafe}', formatARS(CAFE))}
          value={formatARS(cafeSweep)}
        />
      </div>

      {/* sustainability bar — lime within the profile cap, warm amber above it */}
      <div className="flex flex-col gap-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-roundai-green/[0.10]">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.round(fill * 100)}%`,
              backgroundColor: overCap ? AMBER : 'var(--color-lime-deep)',
            }}
          />
        </div>
        <span
          className={'text-[12px] font-medium ' + (overCap ? '' : 'text-roundai-green/45')}
          style={overCap ? { color: AMBER_TEXT } : undefined}
        >
          {(overCap ? tw.overCap : tw.withinCap).replace(
            '{risk}',
            strings.onboarding.quiz.labels[risk].toLowerCase(),
          )}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onConfirm(margin)}
        className="rounded-[12px] bg-roundai-green py-2.5 text-[15.5px] font-semibold text-lime transition-transform active:scale-[0.99]"
      >
        {tw.confirm}
      </button>
    </div>
  )
}

/** Snap a fraction to the 0.5% step grid (nearest), rounded to avoid fp drift. */
function snap(m: number): number {
  return Math.round(m / STEP) * STEP
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[12.5px]">
      <span className="text-roundai-green/55">{label}</span>
      <span className="tnum font-semibold text-roundai-green">{value}</span>
    </div>
  )
}

function StepBtn({
  dir,
  label,
  disabled,
  onClick,
}: {
  dir: 'up' | 'down'
  label: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={
        'grid h-11 w-11 shrink-0 place-items-center rounded-full text-roundai-green ring-1 ring-roundai-green/[0.14] transition-all active:scale-95 ' +
        (disabled ? 'opacity-30' : 'bg-roundai-green/[0.06] active:bg-roundai-green/[0.12]')
      }
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        {dir === 'up' ? (
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <path d="M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        )}
      </svg>
    </button>
  )
}
