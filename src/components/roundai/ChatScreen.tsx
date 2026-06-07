'use client'

import { useEffect, useState, type Dispatch } from 'react'
import type { AppState, Action } from '@/components/AppShell'
import type { Goal, SavedGoal } from '@/lib/chat-types'
import type { RiskProfile, UserProfile } from '@/lib/roundup'
import { profiles } from '@/data/profiles'
import { formatARS, formatPct } from '@/lib/roundup'
import {
  buildProposalMessages,
  buildProposalPlan,
  buildOpenPlan,
  goalLabelOf,
  type ProposalPlan,
} from '@/lib/proposal'
import { useChat } from '@/lib/useChat'
import { strings } from '@/data/strings'
import { savingsCapacity } from '@/lib/roundup'
import {
  buildMechanismVisual,
  buildNumbersBreakdown,
  buildMarginAnchor,
  buildScenariosLine,
} from '@/lib/proposal'
import { MiniappHeader } from './MiniappHeader'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { GoalSelectV2 } from './GoalSelectV2'
import { MechanismVisualCard } from './MechanismVisualCard'
import { NumbersCard } from './NumbersCard'
import { AmountInput } from './AmountInput'
import { GoalNameInput } from './GoalNameInput'
import { QuizStep } from './QuizStep'
import { TimelineStep } from './TimelineStep'
import { MarginTweaker } from './MarginTweaker'
import { GoalScreen } from './GoalScreen'
import { StepLabel } from './StepLabel'
import { SuggestedQuestions } from './SuggestedQuestions'
import { renderEmphasis } from './MessageBubble'

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

/** The active demo profile (from state.profileId — set by the ?perfil= switcher). */
function profileOf(state: AppState): UserProfile {
  return profiles.find((p) => p.id === state.profileId) ?? profiles[0]
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

  // Staggered greeting: 3 bubbles (hola + the premise w/ REAL idle liquidity +
  // the quiz intro), then → quiz. The premise interpolates savingsCapacity so a
  // judge grasps the product's reason for being from the chat alone.
  useEffect(() => {
    if (!active || state.messages.length > 0 || state.chatPhase !== 'greeting') return

    const profile = profileOf(state)
    const g = strings.onboarding.greeting
    const bubbles = [
      g.hola.replace('{nombre}', profile.nombre),
      g.premise.replace('{capacity}', formatARS(savingsCapacity(profile))),
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

    const profile = profileOf(state)
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

  // Goal-select v2 (iteration-4): only TWO options. The 'meta' card carries an
  // inline amount input, so picking it ALSO fixes the amount in one step (echoed
  // as one user turn: "<meta option> · <monto>") → straight to the name step.
  function handleSelectMeta(amount: number) {
    const label = strings.onboarding.goalOptions.meta
    dispatch({
      type: 'PUSH_MESSAGE',
      message: { role: 'user', content: `${label} · ${formatARS(amount)}` },
    })
    // SELECT_GOAL with the amount baked in, jumping to the name step (the
    // separate amount step is now folded into the card).
    dispatch({ type: 'SELECT_GOAL', goal: { type: 'meta', amount }, phase: 'goalName' })
  }

  function handleSelectRendir() {
    dispatch({
      type: 'PUSH_MESSAGE',
      message: { role: 'user', content: strings.onboarding.goalOptions.rendir },
    })
    // rendir carries no amount → skip goalInput AND timeline, straight to proposal.
    dispatch({ type: 'SELECT_GOAL', goal: { type: 'rendir' }, phase: 'proposal' })
  }

  function handleConfirmAmount(amount: number) {
    dispatch({ type: 'PUSH_MESSAGE', message: { role: 'user', content: formatARS(amount) } })
    dispatch({ type: 'SET_AMOUNT', amount }) // → chatPhase 'goalName'
  }

  // Optional goal name: confirm echoes "Le pongo: {nombre}"; skip carries no turn.
  function handleConfirmGoalName(label: string) {
    dispatch({
      type: 'PUSH_MESSAGE',
      message: {
        role: 'user',
        content: strings.onboarding.goalName.userEcho.replace('{nombre}', label),
      },
    })
    dispatch({ type: 'SET_GOAL_LABEL', label }) // → chatPhase 'timeline'
  }
  function handleSkipGoalName() {
    dispatch({ type: 'SET_GOAL_LABEL', label: undefined }) // → chatPhase 'timeline'
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
    // The goal name carries through to the SavedGoal (wave-2 goal page shows it);
    // falls back to the type default when the user skipped the name step.
    const goalLabel = goalLabelOf(goal)
    const saved: SavedGoal = {
      id: `goal-${Date.now()}`,
      label: goalLabel,
      amount: goal.amount ?? 0,
      months: goal.months ?? 0,
      accumulated: 0,
    }
    dispatch({ type: 'ACCEPT_PROPOSAL', marginFraction: margin, savedGoal: saved })
    // Confirm + TEACH the next step (iteration 3): cite the committed margin and
    // the goal by name, then point the judge at the wallet to try a payment.
    const activated = strings.onboarding.activated
      .replace('{margen}', formatPct(margin))
      .replace('{goalLabel}', goalLabel)
    dispatch({
      type: 'PUSH_MESSAGE',
      message: { role: 'assistant', content: activated },
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
    // v2: the amount lives in the goalSelect card, so "Cambiar meta" returns to
    // the goal-select surface (re-pick + re-enter the monto) rather than the
    // now-folded standalone amount step.
    dispatch({ type: 'SET_PHASE', phase: 'goalSelect' })
    setProposalReady(false)
  }

  const profile = profileOf(state)
  const risk = sessionRiskOf(state)
  const proposalDone = state.chatPhase === 'proposal' && proposalReady && state.goal != null
  // The committed (post-tweak) margin if positive; 0 = "cleared" sentinel.
  const committed = state.marginFraction && state.marginFraction > 0 ? state.marginFraction : undefined
  // Re-render the plan text at the committed margin so every cited figure matches
  // the chip (decision #27: "proposal numbers re-render to match").
  const plan = proposalDone ? planFor(profile, state.goal!, risk, committed) : null
  const displayMargin = plan?.marginFraction ?? 0
  const stepLabels = strings.onboarding.stepLabels

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
            {/* Every interactive step gets a tiny uppercase section label above
                its controls (iteration 3) so a judge always knows where they are. */}
            {state.chatPhase === 'quiz' && (
              <>
                <StepLabel>{stepLabels.quiz}</StepLabel>
                <QuizStep dispatch={dispatch} />
              </>
            )}
            {state.chatPhase === 'goalSelect' && (
              <>
                <StepLabel>{stepLabels.goalSelect}</StepLabel>
                <GoalSelectV2
                  onSelectMeta={handleSelectMeta}
                  onSelectRendir={handleSelectRendir}
                />
              </>
            )}
            {/* goalInput: legacy standalone amount step. v2 folds the monto into
                the goal-select card, so this is only a compat fallback for any
                path that still routes here. */}
            {state.chatPhase === 'goalInput' && (
              <>
                <StepLabel>{stepLabels.amount}</StepLabel>
                <AmountInput onConfirm={handleConfirmAmount} />
              </>
            )}
            {state.chatPhase === 'goalName' && (
              <>
                <StepLabel>{stepLabels.goalName}</StepLabel>
                <GoalNameInput
                  onConfirm={handleConfirmGoalName}
                  onSkip={handleSkipGoalName}
                />
              </>
            )}
            {state.chatPhase === 'timeline' && (
              <>
                <StepLabel>{stepLabels.timeline}</StepLabel>
                <TimelineStep onConfirm={handleConfirmTimeline} />
              </>
            )}
            {proposalDone && plan && (
              <>
                <StepLabel>{stepLabels.proposal}</StepLabel>
                <ProposalBlock
                  plan={plan}
                  displayMargin={displayMargin}
                  profile={profile}
                  risk={risk}
                  goal={state.goal!}
                  amount={state.goal?.amount}
                  onCommitMargin={handleCommitMargin}
                  onAccept={handleAccept}
                  onChangeTimeline={handleChangeTimeline}
                  onChangeGoal={handleChangeGoal}
                />
              </>
            )}
          </MessageList>
          {/* Post-activation: tappable suggested questions so judges don't have to
              invent them. Only while live; hidden when the coach is busy. */}
          {isLive && (
            <SuggestedQuestions onPick={sendMessage} disabled={!canSend} />
          )}
          <ChatInput enabled={canSend} onSend={sendMessage} />
        </>
      ) : (
        <GoalScreen state={state} dispatch={dispatch} />
      )}
    </div>
  )
}

/** Pick the right plan builder for a goal (target-driven vs open-ended). */
function planFor(
  profile: UserProfile,
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
  goal,
  amount,
  onCommitMargin,
  onAccept,
  onChangeTimeline,
  onChangeGoal,
}: {
  plan: ProposalPlan
  displayMargin: number
  profile: UserProfile
  risk: RiskProfile
  goal: Goal
  amount?: number
  onCommitMargin: (margin: number) => void
  onAccept: (margin: number) => void
  onChangeTimeline: () => void
  onChangeGoal: () => void
}) {
  const [open, setOpen] = useState(false)

  // Inline VISUAL + breakdown shown WITH the proposal (iteration-4): the
  // mechanism split card teaches the round-up at a glance; the TUS NÚMEROS card
  // shows the ingresos/gastos/te-queda breakdown + the margin formula. Both are
  // calculator-derived via proposal.ts. The numbers card uses the effective
  // (committed/plan) margin so its aporte/percent match the proposal bubble.
  const mechVisual = buildMechanismVisual(profile, goal, risk)
  const numbers = buildNumbersBreakdown(profile, displayMargin)

  // Degenerate inviable: honest copy, NO CTA, no tappable margin. Still show the
  // mechanism visual so the judge understands the product even without a plan.
  if (!plan.hasCta) {
    return (
      <div className="flex w-full flex-col gap-2.5 pt-1">
        <MechanismVisualCard visual={mechVisual} />
        <div className="flex w-full justify-start">
          <div className="max-w-[88%] rounded-[16px] rounded-tl-[6px] bg-roundai-green/[0.06] px-3.5 py-2.5 text-[16.5px] leading-[1.5] text-roundai-green ring-1 ring-roundai-green/[0.06]">
            {renderEmphasis(plan.text)}
          </div>
        </div>
      </div>
    )
  }

  // Split the proposal text on the rendered default margin so we can swap in a
  // tappable chip showing the CURRENT (committed/tweaked) margin.
  const renderedDefault = formatPct(plan.marginFraction)
  const renderedCurrent = formatPct(displayMargin)
  const [before, after] = splitOnce(plan.text, renderedDefault)

  // Plain-words anchor for the % + the scenarios (returns-aware) line — both
  // calculator-derived; scenarios is '' for open/amount-less plans.
  const marginAnchor = buildMarginAnchor(displayMargin)
  const scenariosLine =
    amount && amount > 0 ? buildScenariosLine(profile, displayMargin, amount) : ''

  return (
    <div className="flex w-full flex-col gap-2.5 pt-1">
      {/* (1) the inline mechanism VISUAL — the killer feature at a glance */}
      <MechanismVisualCard visual={mechVisual} />

      {/* (2) TUS NÚMEROS — the desglose the client asked for */}
      <NumbersCard data={numbers} />

      {/* (3) the proposal bubble — coach voice, margin as a tappable lime chip */}
      <div className="flex w-full justify-start">
        <div className="max-w-[88%] rounded-[16px] rounded-tl-[6px] bg-roundai-green/[0.06] px-3.5 py-2.5 text-[16.5px] leading-[1.5] text-roundai-green ring-1 ring-roundai-green/[0.06]">
          {renderEmphasis(before)}
          <MarginChip label={renderedCurrent} onTap={() => setOpen((v) => !v)} />
          {renderEmphasis(after)}
        </div>
      </div>

      {/* (4) plain-words anchor for the % — "de cada $ 100, $ 4 a tu meta" */}
      {marginAnchor && (
        <div className="flex w-full justify-start">
          <div className="max-w-[88%] rounded-[14px] bg-lime/[0.16] px-3.5 py-2 text-[14.5px] leading-snug text-roundai-green-deep ring-1 ring-lime/30">
            {renderEmphasis(marginAnchor)}
          </div>
        </div>
      )}

      {/* (5) SCENARIOS — the proposal is an investment, not a piggy bank */}
      {scenariosLine && (
        <div className="flex w-full justify-start">
          <div className="max-w-[88%] rounded-[14px] bg-roundai-green/[0.05] px-3.5 py-2 text-[13.5px] leading-snug text-roundai-green/75 ring-1 ring-roundai-green/[0.08]">
            {renderEmphasis(scenariosLine)}
          </div>
        </div>
      )}

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
function MarginChip({
  label,
  onTap,
}: {
  label: string
  onTap: () => void
}) {
  return (
    // mx-1.5 (~6px) gives the chip breathing room from the words on either side
    // (iteration-4 spacing fix — "las palabras al lado del margen están muy
    // pegadas"). The trailing space keeps the right edge honest when text wraps.
    <span className="mx-1.5 inline-flex items-center align-baseline">
      <button
        type="button"
        onClick={onTap}
        className="roundai-margin-chip inline-flex items-center gap-1 rounded-full bg-lime px-2.5 py-0.5 align-baseline text-[15px] font-semibold text-roundai-green-deep ring-1 ring-lime-deep/40 transition-transform active:scale-95"
      >
        <style>{MARGIN_CHIP_CSS}</style>
        <span aria-hidden="true" className="text-[12px]">
          ✦
        </span>
        <span className="tnum">{label}</span>
        <span className="text-[11.5px] font-medium text-roundai-green/60">
          {strings.tweaker.chipHint}
        </span>
      </button>
    </span>
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
        className="flex items-center gap-2 rounded-full bg-roundai-green px-5 py-2.5 text-[16.5px] font-semibold text-lime shadow-[0_8px_22px_-10px_rgba(7,42,32,0.6)] transition-transform active:scale-[0.98]"
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
      className="rounded-full bg-roundai-green/[0.06] px-4 py-2.5 text-[15.5px] font-semibold text-roundai-green ring-1 ring-roundai-green/[0.12] transition-transform active:scale-[0.98]"
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
