'use client'

import { strings } from '@/data/strings'
import { DEMO_PROMPTS } from '@/lib/demo-transcript'

// Post-activation coach suggestions (iteration 3): 2-3 tappable suggested
// questions rendered ABOVE the composer once the chat is live, so a judge never
// has to invent a question. Tapping sends the prompt straight to the coach. The
// prompts are the canonical DEMO_PROMPTS (the same set the demo transcript
// answers), so taps always land a coherent, on-brand reply. Hidden while the
// coach is busy (typing/streaming) so they can't double-fire.

export function SuggestedQuestions({
  onPick,
  disabled,
}: {
  onPick: (text: string) => void
  disabled: boolean
}) {
  // Show the first 3 — keeps the strip to one tidy row group, ≤ the 4 canonical.
  const prompts = DEMO_PROMPTS.slice(0, 3)

  return (
    <div className="shrink-0 bg-cream px-3 pt-2">
      <span className="px-1 text-[11.5px] font-bold uppercase tracking-[0.12em] text-roundai-green/40">
        {strings.onboarding.suggestedQuestions}
      </span>
      <div className="no-scrollbar mt-1.5 flex gap-2 overflow-x-auto pb-0.5">
        {prompts.map((p) => (
          <button
            key={p}
            type="button"
            disabled={disabled}
            onClick={() => onPick(p)}
            className="shrink-0 whitespace-nowrap rounded-full bg-roundai-green/[0.06] px-3 py-1.5 text-[13.5px] font-medium text-roundai-green ring-1 ring-roundai-green/[0.12] transition-all active:scale-[0.97] active:bg-roundai-green/[0.10] disabled:opacity-40"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}
