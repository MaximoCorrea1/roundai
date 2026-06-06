'use client'

import { useEffect, useState, type Dispatch } from 'react'
import type { AppState, Action } from '@/components/AppShell'
import type { GoalType } from '@/lib/chat-types'
import { activeProfile } from '@/data/profiles'
import { savingsCapacity, computeOptimalMargin, formatARS } from '@/lib/roundup'
import { buildProposalMessages, hasSustainableProposal } from '@/lib/proposal'
import { useChat } from '@/lib/useChat'
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
// greeting and the proposal pacing (each bubble preceded by a typing pause).
// Timers are tracked and cleared on unmount so a fast back-out never leaks a
// dispatch into a stale tree.

const STEP = 500 // ms between staggered greeting beats
const PROPOSAL_STEP = 700 // ms between proposal bubbles (a touch slower — it's the pitch)

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
  const { sendMessage } = useChat(state, dispatch)
  // Composer is enabled only when live AND the coach is idle — blocks double-send
  // while typing/streaming/fallback, re-enabled the moment the turn completes.
  const canSend = isLive && state.coachStatus === 'idle'
  // Local UI flag (not reducer state): the proposal sequence has fully landed,
  // so it's time to reveal the consent CTA. Avoids flashing it between bubbles.
  const [proposalReady, setProposalReady] = useState(false)

  // Staggered greeting: fires once on first open. Strict-Mode-safe — each run
  // owns its own timer list and clears it on cleanup, so the dev double-invoke
  // (mount → cleanup → mount) simply re-schedules from scratch. The reducer's
  // message state (guarded below) keeps it from doubling in production.
  useEffect(() => {
    if (!active || state.messages.length > 0 || state.chatPhase !== 'greeting') return

    const profile = activeProfile()
    const g = strings.onboarding.greeting
    const capacidad = formatARS(savingsCapacity(profile))
    const bubbles = [
      g.hola.replace('{nombre}', profile.nombre),
      g.dato.replace('{capacidad}', capacidad),
      g.pregunta,
    ]

    const local: ReturnType<typeof setTimeout>[] = []
    let t = 0
    bubbles.forEach((text, i) => {
      local.push(setTimeout(() => dispatch({ type: 'SET_STATUS', status: 'typing' }), t))
      t += STEP
      local.push(
        setTimeout(() => {
          dispatch({ type: 'PUSH_MESSAGE', message: { role: 'assistant', content: text } })
          dispatch({ type: 'SET_STATUS', status: 'idle' })
          if (i === bubbles.length - 1) dispatch({ type: 'SET_PHASE', phase: 'goalSelect' })
        }, t),
      )
      t += STEP
    })
    return () => {
      for (const id of local) clearTimeout(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  // Proposal pacing: on entering 'proposal', push the templated bubbles one at a
  // time with typing pauses. Strict-Mode-safe (self-clearing timers); idempotent
  // across a remount — if an assistant bubble already follows the last user turn
  // the proposal has begun, so we just reveal the CTA instead of re-pushing.
  useEffect(() => {
    if (state.chatPhase !== 'proposal' || !state.goal) return
    const last = state.messages[state.messages.length - 1]
    if (last && last.role === 'assistant') {
      setProposalReady(true)
      return
    }

    const profile = activeProfile()
    const bubbles = buildProposalMessages(profile, state.goal)

    const local: ReturnType<typeof setTimeout>[] = []
    let t = PROPOSAL_STEP // a small beat before the first line
    bubbles.forEach((msg, i) => {
      local.push(setTimeout(() => dispatch({ type: 'SET_STATUS', status: 'typing' }), t))
      t += PROPOSAL_STEP
      local.push(
        setTimeout(() => {
          dispatch({ type: 'PUSH_MESSAGE', message: msg })
          dispatch({ type: 'SET_STATUS', status: 'idle' })
          // reveal the CTA only after the FINAL bubble has landed
          if (i === bubbles.length - 1) setProposalReady(true)
        }, t),
      )
      t += PROPOSAL_STEP
    })
    return () => {
      for (const id of local) clearTimeout(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.chatPhase])

  function handleSelectGoal(type: GoalType) {
    const label = strings.onboarding.goalOptions[type]
    dispatch({ type: 'PUSH_MESSAGE', message: { role: 'user', content: label } })
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

  function handleAccept() {
    const margin = computeOptimalMargin(activeProfile())
    dispatch({ type: 'ACCEPT_PROPOSAL', marginFraction: margin })
    dispatch({
      type: 'PUSH_MESSAGE',
      message: { role: 'assistant', content: strings.onboarding.activated },
    })
  }

  // The consent CTA shows only once the proposal bubbles have all landed AND a
  // sustainable margin actually exists (the unreachable branch shows no CTA).
  const proposalDone =
    state.chatPhase === 'proposal' &&
    proposalReady &&
    hasSustainableProposal(activeProfile())

  return (
    <div className="flex h-full w-full flex-col bg-cream">
      <MiniappHeader state={state} dispatch={dispatch} />

      {state.view === 'chat' ? (
        <>
          <MessageList
            messages={state.messages}
            showTyping={state.coachStatus === 'typing'}
            pinKey={`${state.chatPhase}:${proposalDone}`}
          >
            {state.chatPhase === 'goalSelect' && (
              <OptionButtons onSelect={handleSelectGoal} />
            )}
            {state.chatPhase === 'goalInput' && (
              <AmountInput onConfirm={handleConfirmAmount} />
            )}
            {proposalDone && <ConsentCTA onAccept={handleAccept} />}
          </MessageList>
          <ChatInput enabled={canSend} onSend={sendMessage} />
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center px-8 text-center">
          <p className="font-display text-[15px] font-medium text-roundai-green/45">
            {strings.goal.comingSoon}
          </p>
        </div>
      )}
    </div>
  )
}

// The single consent moment — a lime call-to-action in the roundai voice.
function ConsentCTA({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="flex w-full justify-center pt-1">
      <button
        type="button"
        onClick={onAccept}
        className="flex items-center gap-2 rounded-full bg-roundai-green px-5 py-3 text-[14px] font-semibold text-lime shadow-[0_8px_22px_-10px_rgba(7,42,32,0.6)] transition-transform active:scale-[0.98]"
      >
        <span aria-hidden="true">✦</span>
        {strings.onboarding.accept}
      </button>
    </div>
  )
}
