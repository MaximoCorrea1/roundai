'use client'

import { useEffect, useReducer, useState } from 'react'
import type { Goal, ChatMessage } from '@/lib/chat-types'
import { WalletHome } from '@/components/wallet/WalletHome'
import { ChatScreen } from '@/components/roundai/ChatScreen'

// ───────────────────────────────────────────────────────────────────────────
// The in-phone navigation state machine (spec Task 2.1). ONE owner of all
// app state: the wallet ↔ miniapp slide, the chat onboarding phases, the
// (Phase-6) payment UI. The reducer is PURE — no timers, no fetches, no side
// effects. All sequencing (staggered greetings, typing pacing, streaming)
// lives in the child components' effects, which dispatch into here.
// ───────────────────────────────────────────────────────────────────────────

// Display-only believable balance — moved here from WalletHome (spec Task 2.1).
// NOT a derived figure; never re-derive money outside the calculator.
const BALANCE_INICIAL = 326_500

type Screen = 'wallet' | 'miniapp'
type MiniView = 'chat' | 'goal'
type ChatPhase = 'greeting' | 'goalSelect' | 'goalInput' | 'proposal' | 'live'

export interface AppState {
  screen: Screen
  view: MiniView
  chatPhase: ChatPhase
  goal: Goal | null
  marginFraction: number | null
  messages: ChatMessage[]
  coachStatus: 'idle' | 'typing' | 'streaming' | 'fallback'
  payment: 'idle' | 'sheet' | 'success' // payment UI lands Phase 6; reducer support now
  balance: number
  goalProgress: number // accumulated sweeps from in-session payments
}

export type Action =
  | { type: 'OPEN_MINIAPP' }
  | { type: 'BACK_TO_WALLET' }
  | { type: 'SELECT_GOAL'; goal: Goal; phase: ChatPhase }
  | { type: 'SET_AMOUNT'; amount: number }
  | { type: 'ACCEPT_PROPOSAL'; marginFraction: number }
  | { type: 'PUSH_MESSAGE'; message: ChatMessage }
  | { type: 'APPEND_DELTA'; delta: string }
  | { type: 'SET_STATUS'; status: AppState['coachStatus'] }
  | { type: 'SET_PHASE'; phase: ChatPhase }
  | { type: 'SWITCH_VIEW'; view: MiniView }
  | { type: 'START_PAYMENT' }
  | { type: 'CONFIRM_PAYMENT'; amount: number; sweep: number }
  | { type: 'CLOSE_PAYMENT' }

const initialState: AppState = {
  screen: 'wallet',
  view: 'chat',
  chatPhase: 'greeting',
  goal: null,
  marginFraction: null,
  messages: [],
  coachStatus: 'idle',
  payment: 'idle',
  balance: BALANCE_INICIAL,
  goalProgress: 0,
}

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'OPEN_MINIAPP':
      return { ...state, screen: 'miniapp' }

    case 'BACK_TO_WALLET':
      return { ...state, screen: 'wallet' }

    case 'SELECT_GOAL':
      return { ...state, goal: action.goal, chatPhase: action.phase }

    case 'SET_AMOUNT':
      return {
        ...state,
        goal: state.goal ? { ...state.goal, amount: action.amount } : state.goal,
        chatPhase: 'proposal',
      }

    case 'ACCEPT_PROPOSAL':
      return {
        ...state,
        marginFraction: action.marginFraction,
        chatPhase: 'live',
        coachStatus: 'idle',
      }

    case 'PUSH_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] }

    case 'APPEND_DELTA': {
      // Append text to the LAST assistant message. If the last message isn't an
      // assistant turn (defensive), start one so a stray delta never vanishes.
      const last = state.messages[state.messages.length - 1]
      if (last && last.role === 'assistant') {
        const messages = state.messages.slice()
        messages[messages.length - 1] = { ...last, content: last.content + action.delta }
        return { ...state, messages }
      }
      return {
        ...state,
        messages: [...state.messages, { role: 'assistant', content: action.delta }],
      }
    }

    case 'SET_STATUS':
      return { ...state, coachStatus: action.status }

    case 'SET_PHASE':
      return { ...state, chatPhase: action.phase }

    case 'SWITCH_VIEW':
      return { ...state, view: action.view }

    case 'START_PAYMENT':
      return { ...state, payment: 'sheet' }

    case 'CONFIRM_PAYMENT':
      // balance −= amount + sweep; goalProgress += sweep; sweep is computed by
      // the caller (the calculator) and passed in — the reducer never does money math.
      return {
        ...state,
        balance: state.balance - action.amount - action.sweep,
        goalProgress: state.goalProgress + action.sweep,
        payment: 'success',
      }

    case 'CLOSE_PAYMENT':
      return { ...state, payment: 'idle' }

    default: {
      // Exhaustiveness guard: a new action without a case becomes a type error.
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}

export function AppShell() {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const animate = useAnimateSlides()

  const atMiniapp = state.screen === 'miniapp'

  return (
    // The clipping viewport, exactly the phone-screen size. We render ONE screen
    // at a time in NORMAL FLOW (a plain h-full block) — the only layout that
    // positions correctly inside the CSS-scaled PhoneFrame; absolute/transform
    // children of a scaled ancestor render in its un-scaled coordinate space and
    // mis-place. The screen change gets a directional slide-in animation, keyed on
    // `screen` so React remounts and re-triggers it. The animation is a paint-only
    // transform on an already-correctly-positioned box, so it never mis-positions;
    // it's also reduced-motion-safe (the keyframe is disabled in that media query).
    <div className="relative h-full w-full overflow-hidden">
      <style>{SLIDE_CSS}</style>
      <div
        key={state.screen}
        className={
          'h-full w-full ' +
          (animate
            ? atMiniapp
              ? 'roundai-slide-from-right'
              : 'roundai-slide-from-left'
            : '')
        }
      >
        {atMiniapp ? (
          <ChatScreen state={state} dispatch={dispatch} active />
        ) : (
          <WalletHome
            balance={state.balance}
            onOpenRoundai={() => dispatch({ type: 'OPEN_MINIAPP' })}
          />
        )}
      </div>
    </div>
  )
}

/** True unless the user prefers reduced motion (defaults to animated pre-mount). */
function useAnimateSlides(): boolean {
  const [animate, setAnimate] = useState(true)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setAnimate(!mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return animate
}

// Directional slide-in for the active screen. Transform is paint-only on a
// normal-flow, full-size box (correct position already), so it never mis-places.
// Disabled under reduced-motion. Scoped here (globals.css is out of this surface).
const SLIDE_CSS = `
@keyframes roundai-in-right {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
@keyframes roundai-in-left {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
.roundai-slide-from-right { animation: roundai-in-right 350ms cubic-bezier(0.4,0,0.2,1) both; }
.roundai-slide-from-left { animation: roundai-in-left 350ms cubic-bezier(0.4,0,0.2,1) both; }
@media (prefers-reduced-motion: reduce) {
  .roundai-slide-from-right, .roundai-slide-from-left { animation: none; }
}
`
