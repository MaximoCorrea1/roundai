'use client'

import { useState } from 'react'
import type { Transaction } from '@/data/transactions'
import type { RiskProfile } from '@/lib/roundup'
import { DEMO_PAYMENT } from '@/data/transactions'
import { sweepForPayment, simulateReturns, formatARS, formatPct } from '@/lib/roundup'
import { strings } from '@/data/strings'

// The mock payment sheet, v2 (spec decision #31: "the toggle IS the
// counterfactual"). A slide-up modal that lives INSIDE the phone screen: a dim
// scrim covers the wallet, a cream sheet rises from the bottom. Merchant +
// amount come from DEMO_PAYMENT; with roundai active the sheet previews the
// split before you confirm, so the sweep is no surprise — and a live round-up
// toggle lets you watch the split appear/collapse. Toggle OFF = the "sin
// roundai" before; we no longer need a static counterfactual because you can
// flip it yourself.
//
// Money math/formatting stays in the calculator (roundup.ts): sweep via
// sweepForPayment, the 12-month value via simulateReturns, every figure via
// formatARS/formatPct. The reducer receives a raw Transaction + the pre-computed
// sweep and does no math.

// The paid transaction we hand to the reducer — DEMO_PAYMENT shaped as a ledger
// Transaction (its merchant matches the static Café Martínez row, intentionally:
// the badged session copy tops the ledger as the live receipt).
const PAID_TX: Transaction = {
  id: 'session-cafe-martinez',
  merchant: DEMO_PAYMENT.merchant,
  amount: DEMO_PAYMENT.amount,
  category: 'gastronomia',
}

// 12-month horizon for the per-sweep micro-projection (always "simulado" in UI).
const PROJECTION_MONTHS = 12

export function PaymentSheet({
  marginFraction,
  roundupEnabled,
  sessionRisk,
  onToggle,
  onConfirm,
  onClose,
}: {
  marginFraction: number | null
  // Round-up master switch (state.roundupEnabled). Optional so the sheet still
  // type-checks / works in isolation; AppShell threads the real value + onToggle.
  roundupEnabled?: boolean
  // Session investor profile (state.sessionRisk) — names the FCI the sweep funds.
  sessionRisk?: RiskProfile | null
  // Flip the master switch (dispatch TOGGLE_ROUNDUP). When absent the sheet
  // falls back to local state so it stays interactive standalone.
  onToggle?: () => void
  onConfirm: (tx: Transaction, sweep: number) => void
  onClose: () => void
}) {
  const p = strings.payment
  const active = marginFraction != null

  // Local mirror used only when AppShell hasn't wired the master switch yet.
  const [localOn, setLocalOn] = useState(true)
  const controlled = roundupEnabled != null
  const on = controlled ? (roundupEnabled as boolean) : localOn
  const toggle = () => {
    if (onToggle) onToggle()
    if (!controlled) setLocalOn((v) => !v)
  }

  // The toggle IS the counterfactual: ON → sweep committed; OFF → plain payment.
  const sweep = active && on ? sweepForPayment(DEMO_PAYMENT.amount, marginFraction) : 0
  const toMerchant = DEMO_PAYMENT.amount // the comercio always gets the full amount
  // 12-month simulated value of THIS one sweep (annuity of a single deposit ≈ its
  // compounded growth) — only meaningful when something is actually swept.
  const projected = active && on ? simulateReturns(sweep, PROJECTION_MONTHS).total : 0

  return (
    <div className="absolute inset-0">
      <style>{SHEET_CSS}</style>

      {/* scrim — tap to dismiss; sits over the wallet only, inside the screen */}
      <button
        type="button"
        aria-label={strings.a11y.closePayment}
        onClick={onClose}
        className="roundai-sheet-scrim absolute inset-0 bg-ink/45"
      />

      {/* the sheet */}
      <div
        className="roundai-sheet absolute inset-x-0 bottom-0 flex flex-col gap-4 bg-cream px-5 pb-8 pt-3 shadow-[var(--shadow-sheet)]"
        style={{ borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' }}
        role="dialog"
        aria-modal="true"
      >
        {/* grab handle */}
        <span className="mx-auto h-1 w-10 shrink-0 rounded-full bg-roundai-green/15" aria-hidden="true" />

        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-[19px] font-semibold tracking-tight text-roundai-green">
              {p.payTitle}
            </h2>
            <p className="mt-0.5 text-[12.5px] text-roundai-green/55">{p.sheetSubtitle}</p>
          </div>
          <button
            type="button"
            aria-label={strings.a11y.closePayment}
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-roundai-green/[0.06] text-roundai-green/70 transition-colors active:bg-roundai-green/10"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* merchant + amount — the headline figure in the mono face */}
        <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-roundai-green px-4 py-4 text-cream">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-cream/10 text-lime" aria-hidden="true">
              <CupIcon />
            </span>
            <div className="leading-tight">
              <p className="text-[14px] font-semibold">{DEMO_PAYMENT.merchant}</p>
              <p className="text-[11.5px] text-cream/55">Pago con tarjeta Nimbo</p>
            </div>
          </div>
          <span className="tnum text-[20px] font-semibold">{formatARS(DEMO_PAYMENT.amount)}</span>
        </div>

        {/* round-up zone — only when roundai is activated (a committed margin
            exists). Pre-activation there is nothing to toggle, so we render
            nothing, preserving the original pre-activation sheet. */}
        {active && (
          <div className="rounded-[var(--radius-md)] bg-lime/15 px-4 pt-3.5 pb-3 ring-1 ring-lime-deep/30">
            {/* the toggle row — label + iOS-style switch */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-roundai-green">
                <span aria-hidden="true" className="text-lime-deep">
                  ✦
                </span>
                {p.roundupToggle}
              </span>
              <RoundupSwitch on={on} onToggle={toggle} label={p.roundupToggle} />
            </div>

            {/* split + destination + projection — they grow in when ON, collapse
                smoothly when OFF. A grid-rows trick animates auto height. */}
            <div className={'roundai-split-wrap' + (on ? ' is-open' : '')} aria-hidden={!on}>
              <div className="roundai-split-inner">
                <div className="mt-3 mb-1 h-px bg-roundai-green/10" />
                <SplitRow label={p.toMerchant} value={formatARS(toMerchant)} />
                <div className="my-2 h-px bg-roundai-green/10" />
                <SplitRow
                  label={p.toGoal}
                  value={`+${formatARS(sweep)}`}
                  accent
                  badge={interpolate(p.sweepBadgeWithMargin, { margen: formatPct(marginFraction) })}
                />
                {/* a dónde va — names the FCI the sweep funds (sessionRisk) */}
                {sessionRisk && (
                  <p className="mt-2.5 text-[11px] text-roundai-green/55">
                    {interpolate(p.destination, { perfil: sessionRisk })}
                  </p>
                )}
                {/* micro-projection — what this single sweep could be worth at 12m */}
                <p className="mt-1 text-[11px] font-medium text-lime-deep">
                  {interpolate(p.microProjection, { monto: formatARS(projected) })}
                </p>
              </div>
            </div>

            {/* quiet hint shown only when the toggle is OFF — the counterfactual */}
            <div className={'roundai-hint-wrap' + (on ? '' : ' is-open')} aria-hidden={on}>
              <div className="roundai-hint-inner">
                <p className="mt-3 text-[11.5px] text-roundai-green/45">{p.toggleOffHint}</p>
              </div>
            </div>
          </div>
        )}

        {/* confirm — ref guard hardens against synthetic same-tick double-fire */}
        <button
          type="button"
          onClick={(e) => {
            const btn = e.currentTarget
            if (btn.dataset.submitted) return
            btn.dataset.submitted = '1'
            onConfirm(PAID_TX, sweep)
          }}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-roundai-green py-3.5 text-[15px] font-semibold text-lime shadow-[0_10px_26px_-12px_rgba(7,42,32,0.7)] transition-transform active:scale-[0.985]"
        >
          {p.confirm}
        </button>
      </div>
    </div>
  )
}

// iOS-style switch — a pill track + sliding knob. Lime when ON (the sweep
// accent), muted green when OFF. role=switch + aria-checked for a11y; the slide
// is a paint-only transform, disabled under reduced-motion (see SHEET_CSS).
function RoundupSwitch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={
        'roundai-switch relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-200 ' +
        (on ? 'bg-roundai-green' : 'bg-roundai-green/20')
      }
    >
      <span
        aria-hidden="true"
        className={
          'roundai-switch-knob absolute top-[3px] left-[3px] h-5 w-5 rounded-full shadow-[0_1px_3px_rgba(7,42,32,0.35)] ' +
          (on ? 'bg-lime' : 'bg-cream')
        }
      />
    </button>
  )
}

function SplitRow({
  label,
  value,
  accent,
  badge,
}: {
  label: string
  value: string
  accent?: boolean
  badge?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={'text-[13px] ' + (accent ? 'font-semibold text-roundai-green' : 'text-roundai-green/65')}>
          {label}
        </span>
        {badge && (
          <span className="rounded-full bg-roundai-green px-2 py-[3px] text-[9.5px] font-semibold leading-none text-lime">
            {badge}
          </span>
        )}
      </div>
      <span
        className={
          'tnum text-[15px] font-semibold ' + (accent ? 'text-lime-deep' : 'text-roundai-green')
        }
      >
        {value}
      </span>
    </div>
  )
}

function CupIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M3.5 6.5h9v4a4 4 0 0 1-4 4H7.5a4 4 0 0 1-4-4v-4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 7.5h1.8a1.7 1.7 0 0 1 0 3.4h-1.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6 2.5c-.6.7-.6 1.3 0 2M9 2.5c-.6.7-.6 1.3 0 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

/** Replace every {key} token with its value (kept local — copy lives in strings.ts). */
function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, key: string) => (key in values ? values[key] : m))
}

// Scrim fade + sheet slide-up, plus the live split/hint reveal. The split and
// hint each use a grid-rows 0fr→1fr collapse so height animates smoothly (~200ms)
// without measuring; opacity rides along. The switch knob slides with a paint-only
// transform. Reduced-motion: everything snaps, no transitions.
const SHEET_CSS = `
@keyframes roundai-scrim-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes roundai-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
.roundai-sheet-scrim { animation: roundai-scrim-in 220ms ease-out both; }
.roundai-sheet { animation: roundai-sheet-up 320ms cubic-bezier(0.22,1,0.36,1) both; }

.roundai-split-wrap, .roundai-hint-wrap {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 200ms ease, opacity 200ms ease;
}
.roundai-split-wrap.is-open, .roundai-hint-wrap.is-open {
  grid-template-rows: 1fr;
  opacity: 1;
}
.roundai-split-inner, .roundai-hint-inner { overflow: hidden; min-height: 0; }

.roundai-switch-knob { transition: transform 200ms cubic-bezier(0.22,1,0.36,1); }
.roundai-switch[aria-checked="true"] .roundai-switch-knob { transform: translateX(18px); }

@media (prefers-reduced-motion: reduce) {
  .roundai-sheet-scrim, .roundai-sheet { animation: none; }
  .roundai-split-wrap, .roundai-hint-wrap, .roundai-switch-knob { transition: none; }
}
`
