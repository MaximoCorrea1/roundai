'use client'

import { useEffect, useState, type Dispatch } from 'react'
import type { AppState, Action } from '@/components/AppShell'
import type { GoalType, Goal, SavedGoal } from '@/lib/chat-types'
import type { RiskProfile } from '@/lib/roundup'
import { activeProfile } from '@/data/profiles'
import { formatARS, formatPct } from '@/lib/roundup'
import {
  buildProposalMessages,
  buildProposalPlan,
  buildOpenPlan,
  type ProposalPlan,
} from '@/lib/proposal'
import { useChat } from '@/lib/useChat'
import { strings } from '@/data/strings'
import { MiniappHeader } from './MiniappHeader'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { OptionButtons } from './OptionButtons'
import { AmountInput } from './AmountInput'
import { QuizStep } from './QuizStep'
import { TimelineStep } from './TimelineStep'
import { MarginTweaker } from './MarginTweaker'
import { GoalScreen } from './GoalScreen'

// The roundai miniapp surface — a visibly different world from Nimbo: warm cream
// background, deep-green chrome, one lime accent, same phone. Composes the
// header, the scrolling conversation, the onboarding chips/inputs, and the
// composer.
//
// NEW FLOW (iteration 2): greeting (2 bubbles) → quiz → goalSelect → goalInput
// → timeline → proposal (planGoal-driven, tappable margin chip → tweaker) → live.
//
// SEQUENCING lives here (in effects), never in the reducer. Timers are tracked
// and cleared on unmount so a fast back-out never leaks a dispatch.

const STEP = 500 // ms between staggered greeting beats
const PROPOSAL_STEP = 700 // ms between proposal bubbles (a touch slower — the pitch)

/** The session risk to use everywhere downstream; falls back to moderado. */
function sessionRiskOf(state: AppState): RiskProfile {
  return state.sessionRisk ?? 'moderado'
}

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
  const canSend = isLive && state.coachStatus === 'idle'
  // Local UI flag: the proposal sequence (tendencies bubble) has fully landed,
  // so it's time to reveal the interactive proposal block.
  const [proposalReady, setProposalReady] = useState(false)

  // Staggered greeting: 2 bubbles (hola + the quiz intro), then → quiz.
  useEffect(() => {
    if (!active || state.messages.length > 0 || state.chatPhase !== 'greeting') return

    const profile = activeProfile()
    const g = strings.onboarding.greeting
    const bubbles = [g.hola.replace('{nombre}', profile.nombre), g.pregunta]

    const local: ReturnType<typeof setTimeout>[] = []
    let t = 0
    bubbles.forEach((text, i) => {
      local.push(setTimeout(() => dispatch({ type: 'SET_STATUS', status: 'typing' }), t))
      t += STEP
      local.push(
        setTimeout(() => {
          dispatch({ type: 'PUSH_MESSAGE', message: { role: 'assistant', content: text } })
          dispatch({ type: 'SET_STATUS', status: 'idle' })
          if (i === bubbles.length - 1) dispatch({ type: 'SET_PHASE', phase: 'quiz' })
        }, t),
      )
      t += STEP
    })
    return () => {
      for (const id of local) clearTimeout(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  // Proposal pacing: on entering 'proposal', push the tendencies bubble (after a
  // typing pause), commit the plan's default margin to state (so the chip/tweaker
  // read from one source), then reveal the interactive block. Idempotent across a
  // remount: if a tendencies bubble already follows the last user turn, just
  // reveal the block.
  useEffect(() => {
    if (state.chatPhase !== 'proposal' || !state.goal) return

    const profile = activeProfile()
    const risk = sessionRiskOf(state)
    const plan = planFor(profile, state.goal, risk)

    // Commit the plan's default margin once (only if not already set this round).
    if (state.marginFraction == null && plan.marginFraction > 0) {
      dispatch({ type: 'SET_MARGIN', marginFraction: plan.marginFraction })
    }

    const last = state.messages[state.messages.length - 1]
    if (last && last.role === 'assistant') {
      setProposalReady(true)
      return
    }

    const bubbles = buildProposalMessages(profile)
    const local: ReturnType<typeof setTimeout>[] = []
    let t = PROPOSAL_STEP
    bubbles.forEach((msg, i) => {
      local.push(setTimeout(() => dispatch({ type: 'SET_STATUS', status: 'typing' }), t))
      t += PROPOSAL_STEP
      local.push(
        setTimeout(() => {
          dispatch({ type: 'PUSH_MESSAGE', message: msg })
          dispatch({ type: 'SET_STATUS', status: 'idle' })
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
    // rendir/nose carry no amount → skip goalInput AND timeline, straight to proposal.
    dispatch({
      type: 'SELECT_GOAL',
      goal: { type },
      phase: needsAmount ? 'goalInput' : 'proposal',
    })
  }

  function handleConfirmAmount(amount: number) {
    dispatch({ type: 'PUSH_MESSAGE', message: { role: 'user', content: formatARS(amount) } })
    dispatch({ type: 'SET_AMOUNT', amount }) // → chatPhase 'timeline'
  }

  function handleConfirmTimeline(months: number) {
    dispatch({
      type: 'PUSH_MESSAGE',
      message: { role: 'user', content: `${months} meses` },
    })
    dispatch({ type: 'SET_TIMELINE', months }) // → chatPhase 'proposal'
  }

  // Tweaker commit: re-render the proposal at the new margin.
  function handleCommitMargin(margin: number) {
    dispatch({ type: 'SET_MARGIN', marginFraction: margin })
  }

  // Tri-state CTA: accept the proposal at the committed margin.
  function handleAccept(margin: number) {
    const goal = state.goal!
    const saved: SavedGoal = {
      id: `goal-${Date.now()}`,
      label: strings.onboarding.goalLabels[goal.type as GoalType],
      amount: goal.amount ?? 0,
      months: goal.months ?? 0,
      accumulated: 0,
    }
    dispatch({ type: 'ACCEPT_PROPOSAL', marginFraction: margin, savedGoal: saved })
    dispatch({
      type: 'PUSH_MESSAGE',
      message: { role: 'assistant', content: strings.onboarding.activated },
    })
  }

  // "Cambiar plazo" → back to timeline; "Cambiar meta" → back to goalInput. Both
  // clear the committed margin so the next proposal recomputes from scratch.
  function handleChangeTimeline() {
    dispatch({ type: 'SET_MARGIN', marginFraction: 0 }) // sentinel; re-set on re-entry
    dispatch({ type: 'SET_PHASE', phase: 'timeline' })
    setProposalReady(false)
  }
  function handleChangeGoal() {
    dispatch({ type: 'SET_MARGIN', marginFraction: 0 })
    dispatch({ type: 'SET_PHASE', phase: 'goalInput' })
    setProposalReady(false)
  }

  const profile = activeProfile()
  const risk = sessionRiskOf(state)
  const proposalDone = state.chatPhase === 'proposal' && proposalReady && state.goal != null
  // The committed (post-tweak) margin if positive; 0 = "cleared" sentinel.
  const committed = state.marginFraction && state.marginFraction > 0 ? state.marginFraction : undefined
  // Re-render the plan text at the committed margin so every cited figure matches
  // the chip (decision #27: "proposal numbers re-render to match").
  const plan = proposalDone ? planFor(profile, state.goal!, risk, committed) : null
  const displayMargin = plan?.marginFraction ?? 0

  return (
    <div className="flex h-full w-full flex-col bg-cream">
      <MiniappHeader state={state} dispatch={dispatch} />

      {state.view === 'chat' ? (
        <>
          <MessageList
            messages={state.messages}
            showTyping={state.coachStatus === 'typing'}
            pinKey={`${state.chatPhase}:${proposalDone}:${displayMargin}`}
          >
            {state.chatPhase === 'quiz' && <QuizStep dispatch={dispatch} />}
            {state.chatPhase === 'goalSelect' && <OptionButtons onSelect={handleSelectGoal} />}
            {state.chatPhase === 'goalInput' && <AmountInput onConfirm={handleConfirmAmount} />}
            {state.chatPhase === 'timeline' && (
              <TimelineStep onConfirm={handleConfirmTimeline} />
            )}
            {proposalDone && plan && (
              <ProposalBlock
                plan={plan}
                displayMargin={displayMargin}
                profile={profile}
                risk={risk}
                amount={state.goal?.amount}
                onCommitMargin={handleCommitMargin}
                onAccept={handleAccept}
                onChangeTimeline={handleChangeTimeline}
                onChangeGoal={handleChangeGoal}
              />
            )}
          </MessageList>
          <ChatInput enabled={canSend} onSend={sendMessage} />
        </>
      ) : (
        <GoalScreen state={state} />
      )}
    </div>
  )
}

/** Pick the right plan builder for a goal (target-driven vs open-ended). */
function planFor(
  profile: ReturnType<typeof activeProfile>,
  goal: Goal,
  risk: RiskProfile,
  overrideMargin?: number,
): ProposalPlan {
  const hasTarget = !!(goal.amount && goal.amount > 0 && goal.months && goal.months > 0)
  return hasTarget
    ? buildProposalPlan(profile, goal, risk, overrideMargin)
    : buildOpenPlan(profile, risk, overrideMargin)
}

// ── The interactive proposal block ──────────────────────────────────────────
// Renders the tri-state proposal text with the margin as a TAPPABLE lime chip
// (✦, one subtle pulse). Tapping opens the inline MarginTweaker; confirming there
// commits the margin and the text re-renders. Below: the tri-state CTAs.
function ProposalBlock({
  plan,
  displayMargin,
  profile,
  risk,
  amount,
  onCommitMargin,
  onAccept,
  onChangeTimeline,
  onChangeGoal,
}: {
  plan: ProposalPlan
  displayMargin: number
  profile: ReturnType<typeof activeProfile>
  risk: RiskProfile
  amount?: number
  onCommitMargin: (margin: number) => void
  onAccept: (margin: number) => void
  onChangeTimeline: () => void
  onChangeGoal: () => void
}) {
  const p = strings.proposal
  const [open, setOpen] = useState(false)

  // Degenerate inviable: honest copy, NO CTA, no tappable margin.
  if (!plan.hasCta) {
    return (
      <div className="flex w-full justify-start">
        <div className="max-w-[88%] rounded-[16px] rounded-tl-[6px] bg-roundai-green/[0.06] px-3.5 py-2.5 text-[14px] leading-[1.55] text-roundai-green ring-1 ring-roundai-green/[0.06]">
          {plan.text}
        </div>
      </div>
    )
  }

  // Split the proposal text on the rendered default margin so we can swap in a
  // tappable chip showing the CURRENT (committed/tweaked) margin.
  const renderedDefault = formatPct(plan.marginFraction)
  const renderedCurrent = formatPct(displayMargin)
  const [before, after] = splitOnce(plan.text, renderedDefault)

  return (
    <div className="flex w-full flex-col gap-2.5 pt-1">
      {/* the proposal bubble — coach voice, margin as a tappable lime chip */}
      <div className="flex w-full justify-start">
        <div className="max-w-[88%] rounded-[16px] rounded-tl-[6px] bg-roundai-green/[0.06] px-3.5 py-2.5 text-[14px] leading-[1.55] text-roundai-green ring-1 ring-roundai-green/[0.06]">
          {before}
          <MarginChip label={renderedCurrent} onTap={() => setOpen((v) => !v)} />
          {after}
        </div>
      </div>

      {/* inline tweaker */}
      {open && (
        <MarginTweaker
          profile={profile}
          risk={risk}
          amount={amount}
          initialMargin={displayMargin}
          capacityCapFraction={plan.capacityCapFraction}
          onConfirm={(m) => {
            onCommitMargin(m)
            setOpen(false)
          }}
        />
      )}

      {/* tri-state CTAs */}
      <ProposalCtas
        status={plan.status}
        monthsAtMargin={plan.monthsAtMargin}
        onAccept={() => onAccept(displayMargin)}
        onChangeTimeline={onChangeTimeline}
        onChangeGoal={onChangeGoal}
      />
    </div>
  )
}

// The lime, ✦, subtly-pulsing tappable margin chip (decision #27).
function MarginChip({ label, onTap }: { label: string; onTap: () => void }) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="roundai-margin-chip mx-0.5 inline-flex items-center gap-1 rounded-full bg-lime px-2 py-0.5 align-baseline text-[13px] font-semibold text-roundai-green-deep ring-1 ring-lime-deep/40 transition-transform active:scale-95"
    >
      <style>{MARGIN_CHIP_CSS}</style>
      <span aria-hidden="true" className="text-[10px]">
        ✦
      </span>
      <span className="tnum">{label}</span>
      <span className="text-[9px] font-medium text-roundai-green/60">
        {strings.tweaker.chipHint}
      </span>
    </button>
  )
}

const MARGIN_CHIP_CSS = `
@keyframes roundai-chip-pulse {
  0% { box-shadow: 0 0 0 0 rgba(200,245,96,0.6); }
  100% { box-shadow: 0 0 0 8px rgba(200,245,96,0); }
}
.roundai-margin-chip { animation: roundai-chip-pulse 1.4s ease-out 1; }
@media (prefers-reduced-motion: reduce) { .roundai-margin-chip { animation: none; } }
`

// The tri-state CTAs (decision #25): comodo → one accept; ajustado → accept-at-N
// + change plazo; inviable → accept + change meta.
function ProposalCtas({
  status,
  monthsAtMargin,
  onAccept,
  onChangeTimeline,
  onChangeGoal,
}: {
  status: ProposalPlan['status']
  monthsAtMargin: number | null
  onAccept: () => void
  onChangeTimeline: () => void
  onChangeGoal: () => void
}) {
  const c = strings.proposal.ctas
  const acceptLabel =
    status === 'comodo' || monthsAtMargin == null
      ? c.acceptDefault
      : c.acceptMonths.replace('{meses}', String(monthsAtMargin))

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onAccept}
        className="flex items-center gap-2 rounded-full bg-roundai-green px-5 py-2.5 text-[14px] font-semibold text-lime shadow-[0_8px_22px_-10px_rgba(7,42,32,0.6)] transition-transform active:scale-[0.98]"
      >
        <span aria-hidden="true">✦</span>
        {acceptLabel}
      </button>
      {status === 'ajustado' && (
        <SecondaryCta label={c.changeTimeline} onClick={onChangeTimeline} />
      )}
      {status === 'inviable' && <SecondaryCta label={c.changeGoal} onClick={onChangeGoal} />}
    </div>
  )
}

function SecondaryCta({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-roundai-green/[0.06] px-4 py-2.5 text-[13px] font-semibold text-roundai-green ring-1 ring-roundai-green/[0.12] transition-transform active:scale-[0.98]"
    >
      {label}
    </button>
  )
}

/** Split a string once on `needle`; if absent, return [text, '']. */
function splitOnce(text: string, needle: string): [string, string] {
  const i = text.indexOf(needle)
  if (i < 0) return [text, '']
  return [text.slice(0, i), text.slice(i + needle.length)]
}
