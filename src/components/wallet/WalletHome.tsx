'use client'

import { activeProfile, ACTIVE_PROFILE_ID } from '@/data/profiles'
import { transactionsFor } from '@/data/transactions'
import { strings } from '@/data/strings'
import { BalanceCard } from './BalanceCard'
import { TransactionList } from './TransactionList'
import { BottomNav } from './BottomNav'
import { RoundaiTile } from './RoundaiTile'

// Nimbo wallet home — the deliberately-conventional host. Header (avatar +
// saludo) · balance card · action row · the roundai tile (the one thing that
// breaks the neutral palette) · scrolling ledger · bottom nav. Everything fits
// the 393×852 screen with NO vertical overflow; only the ledger scrolls.

// Balance is owned by the AppShell reducer (so payments can decrement it) and
// passed in. NOT a derived figure — never re-derive money outside the calculator.
const ars = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
})

export function WalletHome({
  balance,
  onOpenRoundai,
}: {
  balance: number
  onOpenRoundai?: () => void
}) {
  const profile = activeProfile()
  const transactions = transactionsFor(ACTIVE_PROFILE_ID)
  const w = strings.wallet

  const greeting = w.greeting.replace('{nombre}', profile.nombre)
  const initial = profile.nombre.charAt(0).toUpperCase()

  return (
    <div className="flex h-full w-full flex-col bg-nimbo-bg">
      {/* scrolling region: everything above the nav. pt clears status bar +
          dynamic island; the ledger inside takes the remaining height. */}
      <div className="flex min-h-0 flex-1 flex-col gap-3.5 px-4 pb-3 pt-[62px]">
        {/* header */}
        <header className="flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-nimbo-slate-deep font-display text-[16px] font-semibold text-white">
              {initial}
            </span>
            <div>
              <p className="text-[15px] font-semibold leading-tight text-ink">
                {greeting}
              </p>
              <p className="text-[12px] leading-tight text-muted">
                {w.brand}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Notificaciones"
            className="relative grid h-10 w-10 place-items-center rounded-full bg-nimbo-surface text-nimbo-slate-deep shadow-[var(--shadow-card)]"
          >
            <svg width="19" height="19" viewBox="0 0 19 19" fill="none" aria-hidden="true">
              <path
                d="M9.5 2.5a4.5 4.5 0 0 0-4.5 4.5c0 4-1.5 5.5-1.5 5.5h12s-1.5-1.5-1.5-5.5A4.5 4.5 0 0 0 9.5 2.5Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M8 15.5a1.6 1.6 0 0 0 3 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-nimbo-blue ring-2 ring-nimbo-surface" />
          </button>
        </header>

        {/* balance */}
        <div className="shrink-0">
          <BalanceCard label={w.balanceLabel} amount={ars.format(balance)} />
        </div>

        {/* action row */}
        <div className="grid shrink-0 grid-cols-3 gap-2.5">
          <ActionButton label={w.actions.pay}>
            <PayIcon />
          </ActionButton>
          <ActionButton label={w.actions.transfer}>
            <TransferIcon />
          </ActionButton>
          <ActionButton label={w.actions.topUp}>
            <TopUpIcon />
          </ActionButton>
        </div>

        {/* THE roundai tile — between balance and ledger, prominent */}
        <div className="shrink-0">
          <RoundaiTile
            title={w.roundaiTile.title}
            poweredBy={w.roundaiTile.poweredBy}
            cta={w.roundaiTile.cta}
            onOpenRoundai={onOpenRoundai}
          />
        </div>

        {/* ledger — the only scrolling element */}
        <TransactionList title={w.ledgerTitle} transactions={transactions} />
      </div>

      <BottomNav labels={w.nav} />
    </div>
  )
}

function ActionButton({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      className="flex flex-col items-center gap-1.5 rounded-2xl bg-nimbo-surface py-3 shadow-[var(--shadow-card)] transition-transform active:scale-[0.97]"
    >
      <span className="grid h-9 w-9 place-items-center rounded-full bg-nimbo-tint text-nimbo-slate-deep">
        {children}
      </span>
      <span className="text-[12px] font-medium text-ink">{label}</span>
    </button>
  )
}

function PayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="2.5" y="3.5" width="13" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 7h13" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 11h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function TransferIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4 6.5h10M4 6.5 6.5 4M4 6.5 6.5 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 11.5H4M14 11.5 11.5 9M14 11.5 11.5 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TopUpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 5.5v7M5.5 9h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
