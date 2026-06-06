'use client'

import { profiles } from '@/data/profiles'
import { transactionsFor } from '@/data/transactions'
import { strings } from '@/data/strings'
import { formatARS } from '@/lib/roundup'
import type { SessionTxn } from '@/components/AppShell'
import { useCueActive } from '@/components/AppShell'
import { CueDot } from '@/components/CueDot'
import { BalanceCard } from './BalanceCard'
import { TransactionList } from './TransactionList'
import { BottomNav } from './BottomNav'
import { RoundaiTile } from './RoundaiTile'

// Nimbo wallet home — the deliberately-conventional host. Header (avatar +
// saludo) · balance card · action row · the roundai tile (the one thing that
// breaks the neutral palette) · scrolling ledger · bottom nav. Everything fits
// the 393×852 screen with NO vertical overflow; only the ledger scrolls.

// Balance is owned by the AppShell reducer (so payments can decrement it) and
// passed in. NOT a derived figure — never re-derive money outside the calculator
// (formatARS is the calculator's es-AR formatter).

export function WalletHome({
  profileId,
  balance,
  sessionTxns = [],
  onOpenRoundai,
  onPay,
}: {
  // The active demo profile (from AppShell state, set by the ?perfil= switcher).
  profileId: string
  balance: number
  sessionTxns?: SessionTxn[]
  onOpenRoundai?: () => void
  onPay?: () => void
}) {
  const profile = profiles.find((p) => p.id === profileId) ?? profiles[0]
  const transactions = transactionsFor(profileId)
  const w = strings.wallet
  const showTileCue = useCueActive('tile')
  const showPayCue = useCueActive('pay')

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
            aria-label={strings.a11y.notifications}
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
          <BalanceCard label={w.balanceLabel} amount={formatARS(balance)} />
        </div>

        {/* action row */}
        <div className="grid shrink-0 grid-cols-3 gap-2.5">
          <div className="relative">
            <ActionButton label={w.actions.pay} onClick={onPay}>
              <PayIcon />
            </ActionButton>
            {/* demo cue (decision #32): mark Pagar once roundai is live + unpaid */}
            <CueDot
              show={showPayCue}
              label={strings.demo.cueLabels.pay}
              className="absolute -right-1 -top-1"
            />
          </div>
          <ActionButton label={w.actions.transfer}>
            <TransferIcon />
          </ActionButton>
          <ActionButton label={w.actions.topUp}>
            <TopUpIcon />
          </ActionButton>
        </div>

        {/* THE roundai tile — between balance and ledger, prominent */}
        <div className="relative shrink-0">
          <RoundaiTile
            title={w.roundaiTile.title}
            poweredBy={w.roundaiTile.poweredBy}
            cta={w.roundaiTile.cta}
            onOpenRoundai={onOpenRoundai}
          />
          {/* demo cue (decision #32): mark the entry tile before onboarding starts */}
          <CueDot
            show={showTileCue}
            label={strings.demo.cueLabels.tile}
            className="absolute right-2 top-2"
          />
        </div>

        {/* ledger — the only scrolling element. Session payments (newest first)
            render above the static ledger; the roundai-swept one is badged. */}
        <TransactionList
          title={w.ledgerTitle}
          transactions={transactions}
          sessionTxns={sessionTxns}
        />
      </div>

      <BottomNav labels={w.nav} />
    </div>
  )
}

function ActionButton({
  label,
  children,
  onClick,
}: {
  label: string
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
