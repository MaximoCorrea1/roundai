'use client'

// A tiny uppercase section label above an interactive onboarding step's controls
// (iteration 3). Quiet but legible — it orients a judge ("TU META", "ELEGÍ TU
// PLAZO") without competing with the conversation. Lives in the chat column, not
// inside a bubble. Copy comes from strings.onboarding.stepLabels.

export function StepLabel({ children }: { children: string }) {
  return (
    <div className="flex w-full items-center gap-2 pt-1">
      <span className="h-px flex-none w-3 bg-roundai-green/20" aria-hidden="true" />
      <span className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-roundai-green/45">
        {children}
      </span>
      <span className="h-px flex-1 bg-roundai-green/[0.12]" aria-hidden="true" />
    </div>
  )
}
