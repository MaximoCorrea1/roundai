'use client'

import type { Dispatch } from 'react'
import type { AppState, Action } from '@/components/AppShell'
import { MiniappHeader } from './MiniappHeader'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'

// The roundai miniapp surface — a visibly different world from Nimbo: warm cream
// background, deep-green chrome, one lime accent, same phone. Composes the
// header, the scrolling conversation, and the (onboarding-gated) composer.
// Onboarding sequencing + the "Mi meta" goal screen arrive in later phases;
// this is the chat shell (Task 2.2).

export function ChatScreen({
  state,
  dispatch,
}: {
  state: AppState
  dispatch: Dispatch<Action>
  active: boolean
}) {
  const isLive = state.chatPhase === 'live'

  return (
    <div className="flex h-full w-full flex-col bg-cream">
      <MiniappHeader state={state} dispatch={dispatch} />

      {state.view === 'chat' ? (
        <>
          <MessageList
            messages={state.messages}
            showTyping={state.coachStatus === 'typing'}
          />
          <ChatInput enabled={isLive} />
        </>
      ) : (
        // "Mi meta" goal screen lands in Phase 6. Placeholder keeps the tab inert
        // but coherent for anyone who toggles to it post-activation.
        <div className="flex flex-1 items-center justify-center px-8 text-center">
          <p className="font-display text-[15px] font-medium text-roundai-green/45">
            Tu meta, en breve.
          </p>
        </div>
      )}
    </div>
  )
}
