'use client'

// The judge-affordance pulse-dot (spec decision #32). A tiny 7px lime dot with a
// soft 2s ring pulse, optionally trailing a single-word label ("tocá"/"pagá"/
// "mirá"). It marks the ONE next demo action — quiet, on-brand, never carnival.
// Mounted at four targets (RoundaiTile, the proposal margin chip, the wallet
// Pagar action, the "Mi meta" tab); whether it shows at all is decided upstream
// by nextCue(state), so this component is dumb: render when `show`, else nothing.
//
// Reduced-motion: the ring is static (no pulse), still visible as a steady dot.
// pointer-events-none throughout so it never intercepts the tap it's pointing at.

export function CueDot({
  show,
  label,
  className = '',
}: {
  show: boolean
  /** Optional one-word hint shown beside the dot (e.g. "tocá", "pagá", "mirá"). */
  label?: string
  /** Positioning utilities from the parent (the parent must be `relative`). */
  className?: string
}) {
  if (!show) return null

  return (
    <span
      aria-hidden="true"
      className={'pointer-events-none z-30 inline-flex items-center gap-1 ' + className}
    >
      <style>{CUE_DOT_CSS}</style>
      <span className="roundai-cue-dot relative h-[7px] w-[7px] shrink-0 rounded-full bg-lime">
        {/* the expanding ring — paint-only, disabled under reduced-motion */}
        <span className="roundai-cue-ring absolute inset-0 rounded-full bg-lime" />
      </span>
      {label && (
        <span className="roundai-cue-label rounded-full bg-roundai-green px-1.5 py-[2px] text-[9px] font-semibold leading-none text-lime shadow-[0_2px_8px_-3px_rgba(7,42,32,0.6)]">
          {label}
        </span>
      )}
    </span>
  )
}

// A soft 2s pulse: the inner dot breathes slightly while a faint ring expands out
// and fades. Both keyframes are paint-only (transform/opacity), so the dot never
// shifts layout. Reduced-motion stops both — a steady lime dot remains.
const CUE_DOT_CSS = `
@keyframes roundai-cue-ring {
  0% { transform: scale(1); opacity: 0.55; }
  70% { transform: scale(2.6); opacity: 0; }
  100% { transform: scale(2.6); opacity: 0; }
}
@keyframes roundai-cue-core {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.18); }
}
.roundai-cue-dot { animation: roundai-cue-core 2s ease-in-out infinite; box-shadow: 0 0 6px rgba(200,245,96,0.5); }
.roundai-cue-ring { animation: roundai-cue-ring 2s ease-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .roundai-cue-dot, .roundai-cue-ring { animation: none; }
  .roundai-cue-ring { opacity: 0; }
}
`
