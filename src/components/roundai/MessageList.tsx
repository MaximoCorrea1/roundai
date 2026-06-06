'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import type { ChatMessage } from '@/lib/chat-types'
import { MessageBubble } from './MessageBubble'
import { TypingIndicator } from './TypingIndicator'

// The scrolling conversation. Auto-scrolls to newest content on TWO triggers:
// (1) a message is added/removed (messages.length), and (2) the LAST message's
// content grows — so streaming deltas keep the latest text in view, not just
// new bubbles. The typing indicator and any onboarding chips (children) live at
// the bottom of the same scroll region so they're always pinned into view too.

export function MessageList({
  messages,
  showTyping,
  children,
}: {
  messages: ChatMessage[]
  showTyping: boolean
  children?: ReactNode
}) {
  const endRef = useRef<HTMLDivElement>(null)
  const lastContent = messages[messages.length - 1]?.content ?? ''

  useEffect(() => {
    // 'auto' (not 'smooth') so rapid streaming deltas don't queue a backlog of
    // smooth animations that lag behind the text.
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, lastContent, showTyping])

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
