'use client'

import { Fragment, type ReactNode } from 'react'
import type { ChatMessage } from '@/lib/chat-types'

// One chat turn. Coach turns are the roundai voice: cream type on a green-tinted
// surface, warm and grounded. User turns are the inverse — a solid green field
// with cream type — so the conversation reads as two clearly different speakers.
// Money inside copy still aligns because the .tnum face is applied per-span by
// the calculator's consumers; bubbles themselves stay text-only.
//
// Copy may carry lightweight *emphasis* (goal names: "Para *La compu*…") — we
// render the asterisk-wrapped spans as a semibold accent rather than leaking the
// raw markers. Nothing else is parsed; pre-wrap still preserves intentional breaks.

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isCoach = message.role === 'assistant'

  return (
    <div
      className={
        isCoach
          ? 'flex w-full justify-start'
          : 'flex w-full justify-end'
      }
    >
      <div
        className={
          isCoach
            ? 'max-w-[80%] rounded-[16px] rounded-tl-[6px] bg-roundai-green/[0.06] px-3.5 py-2.5 text-[15.5px] leading-[1.55] text-roundai-green ring-1 ring-roundai-green/[0.06]'
            : 'max-w-[80%] rounded-[16px] rounded-br-[6px] bg-roundai-green px-3.5 py-2.5 text-[15.5px] leading-[1.55] text-cream shadow-[0_4px_14px_-8px_rgba(7,42,32,0.5)]'
        }
        style={{ whiteSpace: 'pre-wrap' }}
      >
        {renderEmphasis(message.content)}
      </div>
    </div>
  )
}

/** Render `*emphasis*` spans as semibold; leave everything else untouched. */
export function renderEmphasis(text: string): ReactNode {
  const parts = text.split(/(\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
      return (
        <span key={i} className="font-semibold">
          {part.slice(1, -1)}
        </span>
      )
    }
    return <Fragment key={i}>{part}</Fragment>
  })
}
