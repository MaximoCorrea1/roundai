'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import type { ChatMessage } from '@/lib/chat-types'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'

// The scrolling conversation. Auto-scrolls to newest content on several
// triggers: a message added/removed (messages.length); the LAST message's
// content growing (streaming deltas stay in view); the typing indicator
// toggling; and `pinKey` — bumped by the parent when interactive content
// (options / amount input / consent CTA) appears below the messages, so those
// are pinned into view too. The endRef sits AFTER the children, so any of them
// scroll into the viewport.

export function MessageList({
  messages,
  showTyping,
  pinKey,
  children,
}: {
  messages: ChatMessage[]
  showTyping: boolean
  pinKey?: string | number
  children?: ReactNode
}) {
  const endRef = useRef<HTMLDivElement>(null)
  const lastContent = messages[messages.length - 1]?.content ?? ''

  useEffect(() => {
    // 'auto' (not 'smooth') so rapid streaming deltas don't queue a backlog of
    // smooth animations that lag behind the text.
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, lastContent, showTyping, pinKey])

  return (
    <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
      <div className="flex flex-col gap-3">
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
        {showTyping && <TypingIndicator />}
        {children}
        <div ref={endRef} className="h-px w-full" />
      </div>
    </div>
  )
}
