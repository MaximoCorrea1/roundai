'use client'

import { useEffect, useReducer, useState } from 'react'
import type { Goal, ChatMessage, SavedGoal } from '@/lib/chat-types'
import type { RiskProfile } from '@/lib/roundup'
import type { Transaction } from '@/data/transactions'
import { WalletHome } from '@/components/wallet/WalletHome'
import { ChatScreen } from '@/components/roundai/ChatScreen'
import { PaymentSheet } from '@/components/wallet/PaymentSheet'
import { PaymentSuccess } from '@/components/wallet/PaymentSuccess'
import { ACTIVE_PROFILE_ID } from '@/data/profiles'
import { strings } from '@/data/strings'

// A paid transaction held in-session, wrapped with the sweep it generated. We
// keep the raw Transaction shape from data (never mutate its type) and pair it
// with the roundai sweep so the ledger can render the ✦ badge + subline. A sweep
// of 0 means roundai wasn't active when this payment was made.
export interface SessionTxn {
  tx: Transaction
  sweep: number
}

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

// Mocked SECONDARY goal (spec decision #29) seeded at ACCEPT_PROPOSAL so the
// multi-goal page is demoable. It carries its OWN pre-seeded progress
// (36.500/300.000 = 12%) and is flagged `simulated`, so the goal page labels it
// "simulada" and never feeds it the real-ledger base sweep — keeps the sandbox
// honesty intact. This is the one deliberate hand-placed figure; everything else
// on the goal page derives from the calculator. Its 12% is exact: 36500/300000.
const MOCK_SECONDARY_GOAL: SavedGoal = {
  id: 'mock-viaje',
  label: strings.goal.mockGoalLabel,
  amount: 300_000,
  months: 14,
  accumulated: 36_500,
  simulated: true,
}

type Screen = 'wallet' | 'miniapp'
type MiniView = 'chat' | 'goal'
// New iteration-2 flow (decisions #25, #26): greeting → quiz → goalSelect →
// goalInput → timeline → proposal → live.
type ChatPhase =
  | 'greeting'
  | 'quiz'
  | 'goalSelect'
  | 'goalInput'
  | 'timeline'
  | 'proposal'
  | 'live'

export interface AppState {
  // The active demo profile (spec decision #32). Set once from the ?perfil=
  // querystring at mount and never mutated — switching profiles is a full page
  // reload (a fresh AppShell), so this is effectively immutable per session.
  // Every consumer that used to read ACTIVE_PROFILE_ID / activeProfile() now
  // reads this instead, so one switcher drives the whole tree.
  profileId: string
  screen: Screen
  view: MiniView
  chatPhase: ChatPhase
  goal: Goal | null
  marginFraction: number | null
  // Investor profile DECLARED by the user via the quiz (decision #26) — NOT
  // inferred. Overrides profile.riskProfile everywhere downstream (proposal caps,
  // coach injection, portfolio highlight). null until the quiz completes.
  sessionRisk: RiskProfile | null
  // Committed goals (decision #29): exactly one active goal receives sweeps.
  // `goal` (above) stays populated for backward-compat this wave (8.D migrates).
  goals: SavedGoal[]
  activeGoalId: string | null
  // Round-up master switch (default ON) — 8.C's payment sheet consumes it.
  roundupEnabled: boolean
  messages: ChatMessage[]
  coachStatus: 'idle' | 'typing' | 'streaming' | 'fallback'
  payment: 'idle' | 'sheet' | 'success'
  balance: number
  goalProgress: number // accumulated sweeps from in-session payments
  // Paid-this-session transactions (newest first), each wrapped with the sweep
  // it produced. Rendered ABOVE the static ledger in TransactionList.
  sessionTxns: SessionTxn[]
  // Index into `messages` where the LIVE conversation begins (everything before
  // it is onboarding, already represented by the seeded history). Captured at
  // ACCEPT_PROPOSAL so useChat can slice live turns without recomputing the
  // boundary heuristically. -1 until the proposal is accepted.
  liveStartIndex: number
}

export type Action =
  | { type: 'OPEN_MINIAPP' }
  | { type: 'BACK_TO_WALLET' }
  | { type: 'SET_RISK'; risk: RiskProfile }
  | { type: 'SELECT_GOAL'; goal: Goal; phase: ChatPhase }
  | { type: 'SET_AMOUNT'; amount: number }
  | { type: 'SET_TIMELINE'; months: number }
  | { type: 'SET_MARGIN'; marginFraction: number }
  | { type: 'ACCEPT_PROPOSAL'; marginFraction: number; savedGoal: SavedGoal }
  | { type: 'TOGGLE_ROUNDUP' }
  | { type: 'SET_ACTIVE_GOAL'; id: string }
  | { type: 'PUSH_MESSAGE'; message: ChatMessage }
  | { type: 'APPEND_DELTA'; delta: string }
  | { type: 'SET_STATUS'; status: AppState['coachStatus'] }
  | { type: 'SET_PHASE'; phase: ChatPhase }
  | { type: 'SWITCH_VIEW'; view: MiniView }
  | { type: 'START_PAYMENT' }
  | { type: 'CONFIRM_PAYMENT'; tx: Transaction; sweep: number }
  | { type: 'CLOSE_PAYMENT' }

// Built from the profile chosen by the ?perfil= switcher (spec decision #32).
// A fresh shell mounts per profile (page.tsx re-keys on profileId), so this runs
// once and `profileId` is stable for the whole session.
function makeInitialState(profileId: string): AppState {
  return { ...initialState, profileId }
}

const initialState: AppState = {
  profileId: ACTIVE_PROFILE_ID,
  screen: 'wallet',
  view: 'chat',
  chatPhase: 'greeting',
  goal: null,
  marginFraction: null,
  sessionRisk: null,
  goals: [],
  activeGoalId: null,
  roundupEnabled: true,
  messages: [],
  coachStatus: 'idle',
  payment: 'idle',
  balance: BALANCE_INICIAL,
  goalProgress: 0,
  sessionTxns: [],
  liveStartIndex: -1,
}

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'OPEN_MINIAPP':
      return { ...state, screen: 'miniapp' }

    case 'BACK_TO_WALLET':
      return { ...state, screen: 'wallet' }

    case 'SET_RISK':
      // Quiz result: declare the session investor profile, advance to goalSelect.
      return { ...state, sessionRisk: action.risk, chatPhase: 'goalSelect' }

    case 'SELECT_GOAL':
      return { ...state, goal: action.goal, chatPhase: action.phase }

    case 'SET_AMOUNT':
      // Amount captured → on to the timeline step (decision #25). NOT proposal.
      return {
        ...state,
        goal: state.goal ? { ...state.goal, amount: action.amount } : state.goal,
        chatPhase: 'timeline',
      }

    case 'SET_TIMELINE':
      // Plazo captured → proposal. planGoal drives the margin downstream.
      return {
        ...state,
        goal: state.goal ? { ...state.goal, months: action.months } : state.goal,
        chatPhase: 'proposal',
      }

    case 'SET_MARGIN':
      // Tweaker commit (decision #27): re-render the proposal at this margin.
      return { ...state, marginFraction: action.marginFraction }

    case 'TOGGLE_ROUNDUP':
      return { ...state, roundupEnabled: !state.roundupEnabled }

    case 'SET_ACTIVE_GOAL': {
      // Selector (decision #29): exactly one goal receives sweeps. `goalProgress`
      // is the LIVE in-session sweep counter for whatever goal is currently
      // active. To switch without double-counting, we FOLD the outgoing goal's
      // live progress into its banked `accumulated`, RESET `goalProgress` to 0,
      // then make the new goal active so it starts accruing fresh. Re-activating
      // the original goal later restores its banked progress — sweeps are never
      // split and never counted twice. (No-op if it's already active.)
      if (action.id === state.activeGoalId) return state
      const goals = state.goals.map((g) =>
        g.id === state.activeGoalId
          ? { ...g, accumulated: g.accumulated + state.goalProgress }
          : g,
      )
      return { ...state, goals, activeGoalId: action.id, goalProgress: 0 }
    }

    case 'ACCEPT_PROPOSAL':
      // Commit the margin + create the SavedGoal (decision #29), make it active.
      // We ALSO seed ONE mocked secondary goal so multi-goal is demoable: it
      // carries its own pre-seeded progress (decision #29 — secondary goals
      // have their own mocked progress) and is flagged `simulated` so the UI
      // labels it "simulada" and never feeds it the real-ledger base sweep.
      // The real goal goes FIRST so it stays the hero on accept.
      // Live turns begin AFTER the activated-confirmation bubble that ChatScreen
      // pushes immediately after this action (hence +1). Everything up to and
      // including that bubble is onboarding, replaced by seedHistory on the wire.
      return {
        ...state,
        marginFraction: action.marginFraction,
        goals: [...state.goals, action.savedGoal, MOCK_SECONDARY_GOAL],
        activeGoalId: action.savedGoal.id,
        chatPhase: 'live',
        coachStatus: 'idle',
        liveStartIndex: state.messages.length + 1,
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
      // balance −= amount + sweep; goalProgress += sweep; PREPEND the paid txn
      // (wrapped with its sweep) so the ledger shows it on top. The sweep is
      // computed by the caller (the calculator) and passed in — the reducer
      // never does money math.
      return {
        ...state,
        balance: state.balance - action.tx.amount - action.sweep,
        goalProgress: state.goalProgress + action.sweep,
        sessionTxns: [{ tx: action.tx, sweep: action.sweep }, ...state.sessionTxns],
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

export function AppShell({
  profileId = ACTIVE_PROFILE_ID,
}: {
  profileId?: string
} = {}) {
  const [state, dispatch] = useReducer(appReducer, profileId, makeInitialState)
  const animate = useAnimateSlides()

  // Silent serverless pre-warm: hit /api/health once on mount so the first real
  // /api/chat call doesn't pay cold-start latency. Fire-and-forget; never blocks
  // or surfaces UI. (Use ?ping=1 in the demo checklist for a live 1-token warm.)
  useEffect(() => {
    fetch('/api/health').catch(() => {})
  }, [])

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
            profileId={state.profileId}
            balance={state.balance}
            sessionTxns={state.sessionTxns}
            onOpenRoundai={() => dispatch({ type: 'OPEN_MINIAPP' })}
            onPay={() => dispatch({ type: 'START_PAYMENT' })}
          />
        )}
      </div>

      {/* Payment layer — a modal sheet/success that lives INSIDE the phone screen
          (its scrim covers only this 393×852 viewport, never the bezel). Mounted
          as a sibling of the screen track, above it, but the dynamic island /
          home indicator (z-30, in PhoneFrame) still paint on top of it. */}
      {state.payment !== 'idle' && (
        <div className="absolute inset-0 z-20">
          {state.payment === 'sheet' ? (
            <PaymentSheet
              marginFraction={state.marginFraction}
              roundupEnabled={state.roundupEnabled}
              sessionRisk={state.sessionRisk}
              onToggle={() => dispatch({ type: 'TOGGLE_ROUNDUP' })}
              onConfirm={(tx, sweep) => dispatch({ type: 'CONFIRM_PAYMENT', tx, sweep })}
              onClose={() => dispatch({ type: 'CLOSE_PAYMENT' })}
            />
          ) : (
            <PaymentSuccess
              sweep={state.sessionTxns[0]?.sweep ?? 0}
              marginFraction={state.marginFraction}
              sessionRisk={state.sessionRisk}
              onClose={() => dispatch({ type: 'CLOSE_PAYMENT' })}
            />
          )}
        </div>
      )}
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
