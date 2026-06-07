'use client'

import { useState } from 'react'
import { strings } from '@/data/strings'

// The composer. Locked (and visibly dimmed) until the onboarding completes
// (chatPhase === 'live'); Phase 5 wires onSend — until then the default is a
// no-op so the row is inert but never errors. Enter sends, Shift+Enter inserts
// a newline. The textarea grows to a small cap, then scrolls.

export function ChatInput({
  enabled,
  onSend = () => {},
}: {
  enabled: boolean
  onSend?: (text: string) => void
}) {
  const [value, setValue] = useState('')
  const trimmed = value.trim()
  const canSend = enabled && trimmed.length > 0

  function send() {
    if (!canSend) return
    onSend(trimmed)
    setValue('')
  }

  return (
    <div className="shrink-0 border-t border-roundai-green/[0.08] bg-cream px-3 pb-5 pt-2.5">
      <div
        className={
          'flex items-end gap-2 rounded-[20px] px-2 py-1.5 transition-colors ' +
          (enabled
            ? 'bg-roundai-green/[0.05] ring-1 ring-roundai-green/[0.10]'
            : 'bg-roundai-green/[0.03] ring-1 ring-roundai-green/[0.06]')
        }
      >
        <textarea
          rows={1}
          value={value}
          disabled={!enabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          placeholder={strings.miniapp.inputPlaceholder}
          aria-label={strings.miniapp.inputPlaceholder}
          className={
            'no-scrollbar max-h-24 min-h-[24px] flex-1 resize-none border-0 bg-transparent px-2 py-1 text-[15.5px] leading-snug text-roundai-green outline-none placeholder:text-roundai-green/35 disabled:cursor-not-allowed ' +
            (enabled ? '' : 'opacity-50')
          }
        />
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          aria-label={strings.a11y.sendMessage}
          className={
            'grid h-9 w-9 shrink-0 place-items-center rounded-full transition-all ' +
            (canSend
              ? 'bg-roundai-green text-lime active:scale-95'
              : 'bg-roundai-green/15 text-roundai-green/30')
          }
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M2.5 8h9M8 4.5 11.5 8 8 11.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
