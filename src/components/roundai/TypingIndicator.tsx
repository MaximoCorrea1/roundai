'use client'

import { strings } from '@/data/strings'

// Three-dot pulse in a coach-style bubble — shown the instant a turn is pending
// (coachStatus === 'typing'), so the demo never shows a blank pause. Reduced-
// motion users get three static dots. Keyframes are scoped here (the shared
// globals.css is out of this surface), guarded by prefers-reduced-motion.

export function TypingIndicator() {
  return (
    <div
      className="flex w-full justify-start"
      aria-live="polite"
      aria-label={strings.a11y.coachTyping}
    >
      <style>{TYPING_CSS}</style>
      <div className="flex items-center gap-1.5 rounded-[16px] rounded-tl-[6px] bg-roundai-green/[0.06] px-3.5 py-3 ring-1 ring-roundai-green/[0.06]">
        <Dot delay="0ms" />
        <Dot delay="160ms" />
        <Dot delay="320ms" />
      </div>
    </div>
  )
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="roundai-typing-dot h-1.5 w-1.5 rounded-full bg-roundai-green/45"
      style={{ animationDelay: delay }}
    />
  )
}

const TYPING_CSS = `
@keyframes roundai-typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.45; }
  30% { transform: translateY(-3px); opacity: 1; }
}
.roundai-typing-dot {
  animation: roundai-typing 1.3s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .roundai-typing-dot { animation: none; }
}
`
