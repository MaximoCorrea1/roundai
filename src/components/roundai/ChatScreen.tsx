'use client'

import { useEffect, useRef, type Dispatch } from 'react'
import type { AppState, Action } from '@/components/AppShell'
import type { GoalType } from '@/lib/chat-types'
import { activeProfile } from '@/data/profiles'
import { savingsCapacity, formatARS } from '@/lib/roundup'
import { strings } from '@/data/strings'
import { MiniappHeader } from './MiniappHeader'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { OptionButtons } from './OptionButtons'
import { AmountInput } from './AmountInput'

// The roundai miniapp surface — a visibly different world from Nimbo: warm cream
// background, deep-green chrome, one lime accent, same phone. Composes the
// header, the scrolling conversation, the onboarding chips/input, and the
// composer.
//
// SEQUENCING lives here (in effects), never in the reducer: the staggered
// greeting (typing indicator → bubble, ~500ms apart) and, later, the proposal
// pacing. Timers are tracked and cleared on unmount so a fast back-out never
// leaks a dispatch into a stale tree.

const STEP = 500 // ms between staggered greeting beats

export function ChatScreen({
  state,
  dispatch,
  active,
}: {
  state: AppState
  dispatch: Dispatch<Action>
  active: boolean
}) {
  const isLive = state.chatPhase === 'live'
  const greetingStarted = useRef(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  // Clear any pending timers on unmount.
  useEffect(() => {
    const list = timers.current
    return () => {
      for (const t of list) clearTimeout(t)
    }
  }, [])

  // Staggered greeting: fires once, the first time the miniapp is opened.
  useEffect(() => {
    if (!active || greetingStarted.current || state.messages.length > 0) return
    if (state.chatPhase !== 'greeting') return
    greetingStarted.current = true

    const profile = activeProfile()
    const g = strings.onboarding.greeting
    const capacidad = formatARS(savingsCapacity(profile))
    const bubbles = [
      g.hola.replace('{nombre}', profile.nombre),
      g.dato.replace('{capacidad}', capacidad),
      g.pregunta,
    ]

    const schedule = (fn: () => void, at: number) => {
      timers.current.push(setTimeout(fn, at))
    }

    let t = 0
    bubbles.forEach((text, i) => {
      // typing indicator on, then the bubble lands STEP later
      schedule(() => dispatch({ type: 'SET_STATUS', status: 'typing' }), t)
      t += STEP
      schedule(() => {
        dispatch({ type: 'PUSH_MESSAGE', message: { role: 'assistant', content: text } })
        dispatch({ type: 'SET_STATUS', status: 'idle' })
        // after the last bubble, open the goal picker
        if (i === bubbles.length - 1) dispatch({ type: 'SET_PHASE', phase: 'goalSelect' })
      }, t)
      t += STEP
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  function handleSelectGoal(type: GoalType) {
    const label = strings.onboarding.goalOptions[type]
    // echo the choice as a user turn so the transcript reads naturally
    dispatch({ type: 'PUSH_MESSAGE', message: { role: 'user', content: label } })
    // 'meta'/'ahorrar' need an amount; the rest skip straight to the proposal
    const needsAmount = type === 'meta' || type === 'ahorrar'
    dispatch({
      type: 'SELECT_GOAL',
      goal: { type },
      phase: needsAmount ? 'goalInput' : 'proposal',
    })
  }

  function handleConfirmAmount(amount: number) {
    dispatch({
      type: 'PUSH_MESSAGE',
      message: { role: 'user', content: formatARS(amount) },
    })
    dispatch({ type: 'SET_AMOUNT', amount }) // → chatPhase 'proposal'
  }

  return (
    <div className="flex h-full w-full flex-col bg-cream">
      <MiniappHeader state={state} dispatch={dispatch} />

      {state.view === 'chat' ? (
        <>
          <MessageList
            messages={state.messages}
            showTyping={state.coachStatus === 'typing'}
          >
            {state.chatPhase === 'goalSelect' && (
              <OptionButtons onSelect={handleSelectGoal} />
            )}
            {state.chatPhase === 'goalInput' && (
              <AmountInput onConfirm={handleConfirmAmount} />
            )}
          </MessageList>
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
