'use client'

import type { GoalType } from '@/lib/chat-types'
import { strings } from '@/data/strings'

// The four goal chips. Tappable, full-bleed pills in the roundai voice (green
// outline on cream, lime tick on the leading edge). The user's choice becomes a
// synthetic user turn upstream; here we just surface the options and report the
// picked GoalType. Disabled once a goal is chosen so the row can't be re-fired.

const ORDER: GoalType[] = ['rendir', 'meta', 'ahorrar', 'nose']

export function OptionButtons({
  onSelect,
  disabled = false,
}: {
  onSelect: (type: GoalType) => void
  disabled?: boolean
}) {
  const opts = strings.onboarding.goalOptions

  return (
    <div className="flex w-full flex-col gap-2 pt-1">
      {ORDER.map((type) => (
        <button
          key={type}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(type)}
          className={
            'group flex items-center gap-2.5 rounded-[14px] bg-roundai-green/[0.04] px-3.5 py-3 text-left text-[15.5px] font-medium text-roundai-green ring-1 ring-roundai-green/[0.10] transition-all ' +
            (disabled
              ? 'cursor-default opacity-45'
              : 'active:scale-[0.99] active:bg-roundai-green/[0.08]')
          }
        >
          <span
            aria-hidden="true"
            className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-lime/30 text-roundai-green"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path
                d="M2.5 5.8 4.4 7.7 8.5 3.3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="flex-1">{opts[type]}</span>
        </button>
      ))}
    </div>
  )
}
