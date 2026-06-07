'use client'

import { formatARS } from '@/lib/roundup'
import { strings } from '@/data/strings'

// PACE, EXPLAINED + ETA anchor (goal screen v3 — spec #2, the "¿qué significa
// eso?" fix). Replaces the old cryptic "a este ritmo: 12 meses" with:
//
//   con ~$41.668/mes en redondeos, llegás en ~11 meses
//                    llegás en
//                  ┌──────────┐
//                  │ mayo 2027 │   ← the emotional anchor (big-ish display font)
//                  └──────────┘
//
// EVERY figure is calculator-derived: {sweep} is the monthly base sweep and
// {meses} is monthsAtRate(...).months, both passed in pre-computed. The ETA
// MONTH STRING is the ONLY thing computed here, and it is DISPLAY-ONLY: today's
// date + `months` months, formatted es-AR via Intl. The months count itself is
// never recomputed — we only turn it into a friendly date so "11 meses" becomes
// "mayo 2027", which a human actually feels.

export function PaceEta({
  monthlySweep,
  months,
  etaMonths,
  optimista,
  pesimista,
  nudgeDays,
}: {
  monthlySweep: number // base monthly sweep (ARS) — formatARS'd for the line
  months: number // flat-sweep months (no returns) — drives the honest pace SENTENCE
  // returns-aware expected months — the ETA anchors on this (still "simulado").
  // Defaults to `months` if scenarios are unavailable.
  etaMonths: number
  optimista: number | null // best-case months (✦ edge of the range subtext)
  pesimista: number | null // worst-case months (other edge)
  nudgeDays: number | null // SURPRISE: days this session's payment shaved off, or null
}) {
  // The ETA date anchors on the EXPECTED (returns-aware) months — the case a user
  // should plan around — while the pace sentence keeps the honest flat months.
  const etaLabel = etaMonth(etaMonths)
  const hasRange = optimista != null && pesimista != null

  const line = strings.goal.paceV3
    .replace('{sweep}', formatARS(monthlySweep))
    .replace('{meses}', String(months))

  return (
    <div className="mt-4 rounded-[var(--radius-md)] bg-roundai-green px-4 py-3.5 text-cream">
      {/* the explained pace sentence — self-contained, no jargon */}
      <p className="flex items-start gap-1.5 text-[13px] leading-snug text-cream/85">
        <span aria-hidden="true" className="mt-[1px] shrink-0 text-lime">
          ↗
        </span>
        <span>
          {/* split so the money + months land in the mono face */}
          {renderWithMono(line)}
        </span>
      </p>

      {/* ETA anchor — the date you actually feel (expected, returns-aware) */}
      <div className="mt-3 border-t border-cream/10 pt-3">
        <div className="flex items-baseline gap-2">
          <span className="text-[11.5px] font-medium uppercase tracking-wide text-cream/55">
            {strings.goal.etaPrefix}
          </span>
          <span className="font-display text-[22px] font-semibold leading-none text-lime">
            {etaLabel}
          </span>
        </div>
        {/* honest scenario range — a tiny ✦ optimista–pesimista marker, simulado */}
        {hasRange && (
          <p className="tnum mt-1.5 text-[11.5px] font-medium text-cream/55">
            {strings.goal.etaRange
              .replace('{optimista}', String(optimista))
              .replace('{pesimista}', String(pesimista))}
          </p>
        )}
      </div>

      {/* SURPRISE: "tu café de hoy te acercó {x} días" — only right after a
          payment lands this session, and only when it's a positive whole day. */}
      {nudgeDays != null && nudgeDays > 0 && (
        <p className="mt-2.5 text-[12.5px] font-medium text-lime/90">
          {nudgeDays === 1
            ? strings.goal.nudgeDay
            : strings.goal.nudgeDays.replace('{dias}', String(nudgeDays))}
        </p>
      )}
    </div>
  )
}

// DISPLAY-ONLY: today + `months` months → "mayo 2027" (es-AR, lowercase month;
// the heading uses capitalize). We anchor on the 1st of the month so day-of-month
// arithmetic never rolls a short month into the next. Not a calculated financial
// figure — purely the friendly rendering of the calculator's `months`.
function etaMonth(months: number): string {
  const now = new Date()
  const eta = new Date(now.getFullYear(), now.getMonth() + months, 1)
  // es-AR gives lowercase "mayo de 2027"; capitalize the FIRST letter only (CSS
  // `capitalize` would also uppercase the "De", which reads wrong in Spanish).
  const s = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(eta)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// The pace line carries one ARS figure and one bare month count; wrap the
// $-prefixed token and the "~N meses" run in .tnum so figures stay tabular.
function renderWithMono(text: string) {
  const parts = text.split(/(\$ ?[\d.]+|~\d+ meses)/g)
  return parts.map((part, i) =>
    /^\$|^~\d/.test(part) ? (
      <span key={i} className="tnum font-semibold text-cream">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}
