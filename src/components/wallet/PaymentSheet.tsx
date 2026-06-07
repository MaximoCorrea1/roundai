'use client'

import { useState } from 'react'
import type { Transaction } from '@/data/transactions'
import type { RiskProfile } from '@/lib/roundup'
import { DEMO_PAYMENT } from '@/data/transactions'
import { sweepForPayment, simulateReturns, formatARS, formatPct } from '@/lib/roundup'
import { strings } from '@/data/strings'

// The mock payment experience, v3 (iteration 3): FULL-SCREEN, no more bottom
// sheet + scrim. A cream surface rises from the bottom and owns the whole
// 393×852 viewport. Hierarchy top→bottom: back control · headerTitle · merchant
// identity BIG (name + glyph — make Café Martínez feel real) · the amount HERO
// (display font, huge, tabular) · the roundai block as a clearly separated card
// (the toggle IS the counterfactual, spec decision #31) where, when ON, the split
// is made VISUAL — a flow bar that splits the amount into "al comercio" and the
// lime sweep "a tu meta" — plus destination + micro-projection; when OFF it
// collapses to a single quiet hint · confirm CTA full-width in the thumb zone.
//
// Pre-activation (marginFraction == null) there is no margin committed yet, so we
// render NO roundai card at all — a plain pay screen, the implicit "before".
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
  // Round-up master switch (state.roundupEnabled). Optional so the screen still
  // type-checks / works in isolation; AppShell threads the real value + onToggle.
  roundupEnabled?: boolean
  // Session investor profile (state.sessionRisk) — names the FCI the sweep funds.
  sessionRisk?: RiskProfile | null
  // Flip the master switch (dispatch TOGGLE_ROUNDUP). When absent the screen
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
  const total = toMerchant + sweep // total debited from the wallet
  // 12-month simulated value of THIS one sweep (annuity of a single deposit ≈ its
  // compounded growth) — only meaningful when something is actually swept.
  const projected = active && on ? simulateReturns(sweep, PROJECTION_MONTHS).total : 0

  // Visual proportions of the flow bar: the sweep is a tiny slice of the whole,
  // so a literal ratio would be invisible. We floor the lime slice at a legible
  // width so the SPLIT reads, while the merchant slice keeps the lion's share.
  const limePct = sweep > 0 ? Math.max(14, Math.round((sweep / total) * 100)) : 0

  return (
    <div className="roundai-pay absolute inset-0 flex flex-col bg-cream">
      <style>{PAY_CSS}</style>

      {/* ── top bar: back control + header title ──────────────────────────── */}
      <div className="flex shrink-0 items-center gap-3 px-5 pt-[58px] pb-2">
        <button
          type="button"
          aria-label={strings.a11y.closePayment}
          onClick={onClose}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-roundai-green/[0.06] text-roundai-green transition-colors active:bg-roundai-green/12"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="font-display text-[20px] font-semibold tracking-tight text-roundai-green">
          {p.headerTitle}
        </h1>
      </div>

      {/* ── scrollable body (keeps the CTA pinned even on short viewports) ─── */}
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-4">
        {/* merchant identity — BIG. A glyph disc + the name, so the comercio
            feels real, not a row in a table. */}
        <div className="roundai-pay-stagger mt-3 flex items-center gap-4" style={{ ['--d' as string]: '60ms' }}>
          <span
            className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] bg-roundai-green text-lime shadow-[0_10px_24px_-12px_rgba(7,42,32,0.6)]"
            aria-hidden="true"
          >
            <CupIcon />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate font-display text-[24px] font-semibold tracking-tight text-roundai-green">
              {DEMO_PAYMENT.merchant}
            </p>
            <p className="mt-0.5 text-[14px] text-roundai-green/55">Pago con tarjeta Nimbo</p>
          </div>
        </div>

        {/* the amount HERO — display font, huge, tabular. The single biggest
            figure on screen. */}
        <div className="roundai-pay-stagger mt-9 flex flex-col items-center text-center" style={{ ['--d' as string]: '120ms' }}>
          <span className="text-[13px] font-medium uppercase tracking-[0.14em] text-roundai-green/45">
            {p.totalLabel}
          </span>
          <span className="tnum mt-2 font-display text-[56px] font-semibold leading-none tracking-tight text-roundai-green">
            {formatARS(total)}
          </span>
          {/* when a sweep rides along, the total ≠ the merchant amount; whisper
              the merchant figure so the hero stays honest. */}
          {sweep > 0 && (
            <span className="tnum mt-2 text-[14px] text-roundai-green/50">
              {formatARS(toMerchant)} {p.toMerchant}
            </span>
          )}
        </div>

        {/* ── the roundai card — only when roundai is activated. Pre-activation
            there is nothing to toggle, so we render nothing (the plain "before"
            pay screen). ──────────────────────────────────────────────────── */}
        {active && (
          <div className="roundai-pay-stagger mt-9 rounded-[var(--radius-lg)] bg-roundai-green px-5 pt-5 pb-5 text-cream shadow-[0_18px_44px_-22px_rgba(7,42,32,0.8)]" style={{ ['--d' as string]: '180ms' }}>
            {/* toggle row — label + iOS-style switch */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[16px] font-semibold">
                <span aria-hidden="true" className="text-lime">
                  ✦
                </span>
                {p.roundupToggle}
              </span>
              <RoundupSwitch on={on} onToggle={toggle} label={p.roundupToggle} />
            </div>

            {/* the split made VISUAL — grows in when ON, collapses when OFF. */}
            <div className={'roundai-split-wrap' + (on ? ' is-open' : '')} aria-hidden={!on}>
              <div className="roundai-split-inner">
                {/* the flow bar: the amount splitting into comercio + the lime
                    sweep. The proportions are floored so the sweep is legible. */}
                <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-cream/12">
                  <span
                    className="h-full rounded-l-full bg-cream/35 transition-[width] duration-300"
                    style={{ width: `${100 - limePct}%` }}
                  />
                  <span
                    className="roundai-flow-lime h-full rounded-r-full bg-lime transition-[width] duration-300"
                    style={{ width: `${limePct}%` }}
                  />
                </div>

                {/* the two legs of the split, labeled + figured */}
                <div className="mt-4 flex items-stretch gap-3">
                  <div className="flex-1 rounded-[14px] bg-cream/[0.08] px-3.5 py-3">
                    <p className="text-[13px] text-cream/60">{p.toMerchant}</p>
                    <p className="tnum mt-1 text-[18px] font-semibold text-cream">
                      {formatARS(toMerchant)}
                    </p>
                  </div>
                  <div className="flex-1 rounded-[14px] bg-lime/15 px-3.5 py-3 ring-1 ring-lime/35">
                    <p className="flex items-center gap-1 text-[13px] text-lime">
                      <span aria-hidden="true">✦</span>
                      {p.toGoal}
                    </p>
                    <p className="tnum mt-1 text-[18px] font-semibold text-lime">
                      +{formatARS(sweep)}
                    </p>
                  </div>
                </div>

                {/* the round-up rate chip — what fraction this is */}
                <div className="mt-3.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px]">
                  <span className="rounded-full bg-lime px-2.5 py-1 text-[12px] font-semibold leading-none text-roundai-green">
                    {interpolate(p.sweepBadgeWithMargin, { margen: formatPct(marginFraction) })}
                  </span>
                  {/* a dónde va — names the FCI the sweep funds (sessionRisk) */}
                  {sessionRisk && (
                    <span className="text-cream/60">
                      {interpolate(p.destination, { perfil: sessionRisk })}
                    </span>
                  )}
                </div>

                {/* micro-projection — what this single sweep could be worth at 12m */}
                <p className="mt-2.5 text-[13.5px] font-medium text-lime">
                  {interpolate(p.microProjection, { monto: formatARS(projected) })}
                </p>
              </div>
            </div>

            {/* quiet hint shown only when the toggle is OFF — the counterfactual */}
            <div className={'roundai-hint-wrap' + (on ? '' : ' is-open')} aria-hidden={on}>
              <div className="roundai-hint-inner">
                <p className="mt-4 text-[14px] text-cream/55">{p.toggleOffHint}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── confirm CTA — full-width, pinned to the thumb zone ─────────────── */}
      <div className="shrink-0 px-5 pt-2 pb-9">
        <button
          type="button"
          onClick={(e) => {
            const btn = e.currentTarget
            if (btn.dataset.submitted) return
            btn.dataset.submitted = '1'
            onConfirm(PAID_TX, sweep)
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-roundai-green py-4 text-[17px] font-semibold text-lime shadow-[0_12px_30px_-12px_rgba(7,42,32,0.7)] transition-transform active:scale-[0.985]"
        >
          {p.confirm}
        </button>
      </div>
    </div>
  )
}

// iOS-style switch — a pill track + sliding knob. Lime when ON (the sweep
// accent), muted when OFF. role=switch + aria-checked for a11y; the slide is a
// paint-only transform, disabled under reduced-motion (see PAY_CSS).
function RoundupSwitch({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={
        'roundai-switch relative h-[30px] w-[52px] shrink-0 rounded-full transition-colors duration-200 ' +
        (on ? 'bg-lime' : 'bg-cream/20')
      }
    >
      <span
        aria-hidden="true"
        className={
          'roundai-switch-knob absolute top-[3px] left-[3px] h-6 w-6 rounded-full shadow-[0_1px_3px_rgba(7,42,32,0.35)] ' +
          (on ? 'bg-roundai-green' : 'bg-cream')
        }
      />
    </button>
  )
}

function CupIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 18 18" fill="none" aria-hidden="true">
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

// Full-screen slide-up, a soft content stagger, plus the live split/hint reveal.
// The whole surface rises from the bottom (~360ms). Inside, a few blocks fade-rise
// in sequence (one well-timed entrance). The split and hint each use a grid-rows
// 0fr→1fr collapse so height animates smoothly without measuring; opacity rides
// along. The switch knob slides with a paint-only transform. Reduced-motion:
// everything snaps, no transitions, no entrance.
const PAY_CSS = `
@keyframes roundai-pay-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes roundai-pay-rise { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.roundai-pay { animation: roundai-pay-up 360ms cubic-bezier(0.22,1,0.36,1) both; }
.roundai-pay-stagger { animation: roundai-pay-rise 420ms ease-out both; animation-delay: var(--d, 0ms); }

.roundai-split-wrap, .roundai-hint-wrap {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows 220ms ease, opacity 220ms ease;
}
.roundai-split-wrap.is-open, .roundai-hint-wrap.is-open {
  grid-template-rows: 1fr;
  opacity: 1;
}
.roundai-split-inner, .roundai-hint-inner { overflow: hidden; min-height: 0; }

.roundai-switch-knob { transition: transform 200ms cubic-bezier(0.22,1,0.36,1); }
.roundai-switch[aria-checked="true"] .roundai-switch-knob { transform: translateX(22px); }

@media (prefers-reduced-motion: reduce) {
  .roundai-pay, .roundai-pay-stagger { animation: none; }
  .roundai-split-wrap, .roundai-hint-wrap, .roundai-switch-knob, .roundai-flow-lime { transition: none; }
}
`
