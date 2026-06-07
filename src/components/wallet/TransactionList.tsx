import type { Transaction, TxCategory } from '@/data/transactions'
import type { SessionTxn } from '@/components/AppShell'
import { formatARS } from '@/lib/roundup'
import { strings } from '@/data/strings'

// Nimbo transaction ledger. Each row: category icon (inline SVG, mapped from
// TxCategory) · merchant · right-aligned tabular amount. The list scrolls
// INTERNALLY so the wallet never overflows the 393×852 screen.
//
// Session payments (newest first) render ABOVE the static ledger. A roundai-
// swept one (sweep > 0) carries a ✦ badge + "+{sweep} a tu meta" subline — the
// live receipt that closes the causal loop. Money formatting is the calculator's
// (formatARS), never re-derived here.

export function TransactionList({
  title,
  transactions,
  sessionTxns = [],
}: {
  title: string
  transactions: Transaction[]
  sessionTxns?: SessionTxn[]
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <h2 className="mb-2 shrink-0 px-1 text-[17px] font-bold tracking-tight text-nimbo-slate-deep">
        {title}
      </h2>

      <div
        className="no-scrollbar min-h-0 flex-1 overflow-y-auto bg-nimbo-surface shadow-[var(--shadow-card)]"
        style={{ borderRadius: 'var(--radius-md)' }}
      >
        <ul>
          {/* session payments first, badged when roundai swept */}
          {sessionTxns.map((s, i) => (
            <li key={`session-${s.tx.id}-${i}`}>
              <div className="flex items-center gap-3 bg-lime/[0.07] px-4 py-[11px]">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-roundai-green text-lime"
                  aria-hidden="true"
                >
                  <CategoryIcon category={s.tx.category} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-[15px] font-semibold leading-tight text-ink">
                    {s.tx.merchant}
                    {s.sweep > 0 && (
                      <span
                        className="shrink-0 rounded-full bg-roundai-green px-1.5 py-[3px] text-[11px] font-semibold leading-none text-lime"
                        aria-label={strings.payment.sweepBadge}
                      >
                        ✦
                      </span>
                    )}
                  </p>
                  {s.sweep > 0 ? (
                    <p className="tnum text-[13px] font-semibold leading-tight text-lime-deep">
                      {strings.payment.ledgerSweep.replace('{monto}', formatARS(s.sweep))}
                    </p>
                  ) : (
                    <p className="text-[13px] font-medium capitalize leading-tight text-muted">
                      {categoryLabel(s.tx.category)}
                    </p>
                  )}
                </div>

                <span className="tnum shrink-0 text-[15px] font-bold text-ink">
                  −{formatARS(s.tx.amount)}
                </span>
              </div>
              <div className="ml-[60px] h-px bg-nimbo-line" />
            </li>
          ))}

          {/* static ledger */}
          {transactions.map((tx, i) => (
            <li key={tx.id}>
              <div className="flex items-center gap-3 px-4 py-[11px]">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-nimbo-tint text-nimbo-slate-deep"
                  aria-hidden="true"
                >
                  <CategoryIcon category={tx.category} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold leading-tight text-ink">
                    {tx.merchant}
                  </p>
                  <p className="text-[13px] font-medium capitalize leading-tight text-muted">
                    {categoryLabel(tx.category)}
                  </p>
                </div>

                <span className="tnum shrink-0 text-[15px] font-bold text-ink">
                  −{formatARS(tx.amount)}
                </span>
              </div>
              {i < transactions.length - 1 && (
                <div className="ml-[60px] h-px bg-nimbo-line" />
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function categoryLabel(c: TxCategory): string {
  const map: Record<TxCategory, string> = {
    super: 'Supermercado',
    transporte: 'Transporte',
    servicios: 'Servicios',
    gastronomia: 'Gastronomía',
    hogar: 'Hogar',
    compras: 'Compras',
    otros: 'Otros',
  }
  return map[c]
}

function CategoryIcon({ category }: { category: TxCategory }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 18 18',
    fill: 'none',
    'aria-hidden': true as const,
  }
  const stroke = {
    stroke: 'currentColor',
    strokeWidth: 1.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (category) {
    case 'super': // shopping cart
      return (
        <svg {...common}>
          <path d="M1.5 2h2l1.7 8.5a1 1 0 0 0 1 .8h6.4a1 1 0 0 0 1-.8L16 5H4.3" {...stroke} />
          <circle cx="7" cy="15" r="1.1" {...stroke} />
          <circle cx="13" cy="15" r="1.1" {...stroke} />
        </svg>
      )
    case 'transporte': // fuel pump
      return (
        <svg {...common}>
          <path d="M3 16V4a1.5 1.5 0 0 1 1.5-1.5H9A1.5 1.5 0 0 1 10.5 4v12M2 16h9.5" {...stroke} />
          <path d="M3 9h7.5" {...stroke} />
          <path d="M10.5 6.5l2.3 2.3a1.5 1.5 0 0 1 .4 1V13a1.3 1.3 0 0 0 2.6 0V7l-2-2" {...stroke} />
        </svg>
      )
    case 'servicios': // lightning bolt
      return (
        <svg {...common}>
          <path d="M10 1.5 3.5 10h4l-1 6.5L14 7.5h-4l1.5-6Z" {...stroke} />
        </svg>
      )
    case 'gastronomia': // cup
      return (
        <svg {...common}>
          <path d="M3.5 6.5h9v4a4 4 0 0 1-4 4H7.5a4 4 0 0 1-4-4v-4Z" {...stroke} />
          <path d="M12.5 7.5h1.8a1.7 1.7 0 0 1 0 3.4h-1.5" {...stroke} />
          <path d="M6 2.5c-.6.7-.6 1.3 0 2M9 2.5c-.6.7-.6 1.3 0 2" {...stroke} />
        </svg>
      )
    case 'hogar': // house
      return (
        <svg {...common}>
          <path d="M2.5 8 9 2.5 15.5 8" {...stroke} />
          <path d="M4 7v8.5h10V7" {...stroke} />
          <path d="M7.5 15.5v-4h3v4" {...stroke} />
        </svg>
      )
    case 'compras': // shopping bag
      return (
        <svg {...common}>
          <path d="M4 5.5h10l-.8 9.5a1 1 0 0 1-1 .9H5.8a1 1 0 0 1-1-.9L4 5.5Z" {...stroke} />
          <path d="M6.5 6.5V5a2.5 2.5 0 0 1 5 0v1.5" {...stroke} />
        </svg>
      )
    case 'otros': // receipt
      return (
        <svg {...common}>
          <path d="M4 2.5h10v13l-2-1.2-2 1.2-2-1.2-2 1.2-2-1.2V2.5Z" {...stroke} />
          <path d="M6.5 6h5M6.5 9h5M6.5 12h3" {...stroke} />
        </svg>
      )
  }
}
