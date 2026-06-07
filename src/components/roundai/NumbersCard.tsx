'use client'

import type { NumbersBreakdown } from '@/lib/proposal'
import { strings } from '@/data/strings'

// "TUS NÚMEROS" card (iteration-4: "mostrá el desglose — ingresos/gastos,
// liquidez media, y el cálculo del margen"). A compact, tabular chat-inline card
// shown with the proposal: ingresos − gastos → te queda ~X/mes, then the margin
// explained as a formula (aporte ÷ gastos = pct). EVERY figure is pre-derived by
// the calculator via proposal.ts (buildNumbersBreakdown) — no math here, only
// layout. Tabular figures (.tnum) so the column lines up.

export function NumbersCard({ data }: { data: NumbersBreakdown }) {
  const n = strings.proposal.numbers

  return (
    <div className="w-full max-w-[88%] rounded-[16px] bg-roundai-green/[0.05] p-3.5 ring-1 ring-roundai-green/[0.10]">
      <span className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-roundai-green/45">
        {n.title}
      </span>

      {/* ingresos − gastos → te queda */}
      <div className="mt-2.5 flex flex-col gap-1.5">
        <NumRow label={n.ingresos} value={data.ingresos} />
        <NumRow label={`− ${n.gastos}`} value={data.gastos} />
        <div className="my-0.5 h-px w-full bg-roundai-green/10" />
        <div className="flex items-baseline justify-between">
          <span className="text-[13.5px] font-semibold text-roundai-green">{n.queda}</span>
          <span className="tnum text-[16px] font-semibold text-roundai-green">
            ~{data.queda}
            <span className="ml-1 text-[12px] font-medium text-roundai-green/45">
              {n.quedaSub}
            </span>
          </span>
        </div>
      </div>

      {/* margen = aporte ÷ gastos = pct */}
      <div className="mt-3 flex items-center justify-between rounded-[11px] bg-lime/[0.18] px-3 py-2 ring-1 ring-lime/30">
        <span className="flex flex-col">
          <span className="text-[13.5px] font-semibold text-roundai-green-deep">
            {n.margenLabel}
          </span>
          <span className="text-[12px] font-medium text-roundai-green/55">{n.margenFormula}</span>
        </span>
        <span className="tnum text-[18px] font-semibold text-roundai-green-deep">
          ✦ {data.margenPct}
        </span>
      </div>
    </div>
  )
}

function NumRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[13.5px]">
      <span className="text-roundai-green/60">{label}</span>
      <span className="tnum font-semibold text-roundai-green">{value}</span>
    </div>
  )
}
