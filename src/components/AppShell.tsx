'use client'

import { useReducer } from 'react'
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

  const atMiniapp = state.screen === 'miniapp'

  return (
    // Two screens on a horizontal track inside the phone screen area. The track
    // is 200% wide; a CSS transform slides it ~350ms ease. overflow-hidden lives
    // on the PhoneFrame screen, so nothing escapes the bezel.
    <div
      className="flex h-full w-[200%] motion-safe:transition-transform motion-safe:duration-[350ms] motion-safe:ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{ transform: atMiniapp ? 'translateX(-50%)' : 'translateX(0)' }}
    >
      <div className="h-full w-1/2 shrink-0" aria-hidden={atMiniapp}>
        <WalletHome
          balance={state.balance}
          onOpenRoundai={() => dispatch({ type: 'OPEN_MINIAPP' })}
        />
      </div>
      <div className="h-full w-1/2 shrink-0" aria-hidden={!atMiniapp}>
        <ChatScreen state={state} dispatch={dispatch} active={atMiniapp} />
      </div>
    </div>
  )
}
