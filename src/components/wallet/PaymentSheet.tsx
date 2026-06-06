'use client'

import type { Transaction } from '@/data/transactions'
import { DEMO_PAYMENT } from '@/data/transactions'
import { sweepForPayment, formatARS, formatPct } from '@/lib/roundup'
import { strings } from '@/data/strings'

// The mock payment sheet (spec #23) — a slide-up modal that lives INSIDE the
// phone screen. A dim scrim covers the wallet, a cream sheet rises from the
// bottom. Merchant + amount come from DEMO_PAYMENT; with roundai active the
// sheet PREVIEWS the split before you confirm, so the sweep is no surprise.
//
// Money math/formatting stays in the calculator (roundup.ts): sweep via
// sweepForPayment, every figure via formatARS/formatPct. The reducer receives a
// raw Transaction + the pre-computed sweep and does no math.

// The paid transaction we hand to the reducer — DEMO_PAYMENT shaped as a ledger
// Transaction (its merchant matches the static Café Martínez row, intentionally:
// the badged session copy tops the ledger as the live receipt).
const PAID_TX: Transaction = {
  id: 'session-cafe-martinez',
  merchant: DEMO_PAYMENT.merchant,
  amount: DEMO_PAYMENT.amount,
  category: 'gastronomia',
}

export function PaymentSheet({
  marginFraction,
  onConfirm,
  onClose,
}: {
  marginFraction: number | null
  onConfirm: (tx: Transaction, sweep: number) => void
  onClose: () => void
}) {
  const p = strings.payment
  const active = marginFraction != null
  const sweep = active ? sweepForPayment(DEMO_PAYMENT.amount, marginFraction) : 0
  const toMerchant = DEMO_PAYMENT.amount // the comercio always gets the full amount

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

        {/* split preview — only when roundai is active */}
        {active && (
          <div className="rounded-[var(--radius-md)] bg-lime/15 px-4 py-3.5 ring-1 ring-lime-deep/30">
            <p className="mb-2.5 flex items-center gap-1.5 text-[11.5px] font-medium text-roundai-green/70">
              <span aria-hidden="true" className="text-lime-deep">
                ✦
              </span>
              {p.splitPreview}
            </p>
            <SplitRow label={p.toMerchant} value={formatARS(toMerchant)} />
            <div className="my-2 h-px bg-roundai-green/10" />
            <SplitRow
              label={p.toGoal}
              value={`+${formatARS(sweep)}`}
              accent
              badge={interpolate(p.sweepBadgeWithMargin, { margen: formatPct(marginFraction) })}
            />
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

// Scrim fade + sheet slide-up. Reduced-motion: both appear instantly.
const SHEET_CSS = `
@keyframes roundai-scrim-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes roundai-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
.roundai-sheet-scrim { animation: roundai-scrim-in 220ms ease-out both; }
.roundai-sheet { animation: roundai-sheet-up 320ms cubic-bezier(0.22,1,0.36,1) both; }
@media (prefers-reduced-motion: reduce) {
  .roundai-sheet-scrim, .roundai-sheet { animation: none; }
}
`
