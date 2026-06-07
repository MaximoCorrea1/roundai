'use client'

import { Fragment, useEffect, useState, type Dispatch } from 'react'
import type { AppState, Action } from '@/components/AppShell'
import type { Goal, SavedGoal } from '@/lib/chat-types'
import type { RiskProfile, UserProfile } from '@/lib/roundup'
import { profiles } from '@/data/profiles'
import { formatARS, formatPct } from '@/lib/roundup'
import {
  buildProposalPlan,
  buildOpenPlan,
  buildStoryBeats,
  buildStoryChain,
  goalLabelOf,
  type ProposalPlan,
  type StoryChain,
} from '@/lib/proposal'
import { useChat } from '@/lib/useChat'
import { strings } from '@/data/strings'
import { savingsCapacity } from '@/lib/roundup'
import { MiniappHeader } from './MiniappHeader'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { GoalSelectV2 } from './GoalSelectV2'
import { StoryChainCard } from './StoryChainCard'
import { TypingIndicator } from './TypingIndicator'
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
  // PHASE 9 · THE STORY CHAIN. The proposal phase is ONE linear 5-beat story
  // (S1–S5) paced with a typing indicator between beats, like the greeting. The
  // beats are NOT frozen into message history — they're rendered live from the
  // EFFECTIVE margin so a margin tweak re-renders the WHOLE story (one knob,
  // every number moves). `revealedBeats` drives the staged reveal; the typing
  // flag shows the indicator between beats. Once all 5 land, the controls (the
  // chain card lives mid-story; the margin chip + CTAs follow) become tappable.
  const [revealedBeats, setRevealedBeats] = useState(0)
  const [storyTyping, setStoryTyping] = useState(false)

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

  // Proposal pacing (PHASE 9): on entering 'proposal', commit the plan's default
  // margin once (so the chip/tweaker read from one source), then reveal the 5
  // story beats one at a time with a typing indicator between them — same pacing
  // as the greeting. The beats themselves are rendered live (margin-reactive),
  // so this effect only drives the reveal COUNTER, never the text. It runs once
  // per proposal entry (keyed on chatPhase); a margin tweak does NOT re-pace.
  useEffect(() => {
    if (state.chatPhase !== 'proposal' || !state.goal) return

    const profile = profileOf(state)
    const risk = sessionRiskOf(state)
    const plan = planFor(profile, state.goal, risk)

    // Commit the plan's default margin once (only if not already set this round).
    if (state.marginFraction == null && plan.marginFraction > 0) {
      dispatch({ type: 'SET_MARGIN', marginFraction: plan.marginFraction })
    }

    const beatCount = buildStoryBeats(profile, state.goal, risk).length

    // Already fully revealed (remount / margin already committed this round):
    // skip the animation and show the whole story.
    if (revealedBeats >= beatCount) return

    const local: ReturnType<typeof setTimeout>[] = []
    let t = 0
    for (let i = 0; i < beatCount; i++) {
      local.push(setTimeout(() => setStoryTyping(true), t))
      t += PROPOSAL_STEP
      local.push(
        setTimeout(() => {
          setStoryTyping(false)
          setRevealedBeats(i + 1)
        }, t),
      )
      t += PROPOSAL_STEP
    }
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
    resetStory()
  }
  function handleChangeGoal() {
    dispatch({ type: 'SET_MARGIN', marginFraction: 0 })
    // v2: the amount lives in the goalSelect card, so "Cambiar meta" returns to
    // the goal-select surface (re-pick + re-enter the monto) rather than the
    // now-folded standalone amount step.
    dispatch({ type: 'SET_PHASE', phase: 'goalSelect' })
    resetStory()
  }

  /** Rewind the staged story so a re-entry re-paces from S1. */
  function resetStory() {
    setRevealedBeats(0)
    setStoryTyping(false)
  }

  const profile = profileOf(state)
  const risk = sessionRiskOf(state)
  const inProposal = state.chatPhase === 'proposal' && state.goal != null
  // The committed (post-tweak) margin if positive; 0 = "cleared" sentinel.
  const committed = state.marginFraction && state.marginFraction > 0 ? state.marginFraction : undefined
  // PHASE 9: the whole story re-renders at the committed margin (one knob, every
  // number moves). Beats + chain + plan are recomputed each render from `committed`.
  const storyBeats = inProposal ? buildStoryBeats(profile, state.goal!, risk, committed) : []
  const storyChain = inProposal ? buildStoryChain(profile, state.goal!, risk, committed) : null
  const plan = inProposal ? planFor(profile, state.goal!, risk, committed) : null
  const displayMargin = plan?.marginFraction ?? 0
  // All beats have landed → reveal the interactive controls (margin chip + CTAs).
  const storyDone = inProposal && revealedBeats >= storyBeats.length
  const stepLabels = strings.onboarding.stepLabels

  return (
    <div className="flex h-full w-full flex-col bg-cream">
      <MiniappHeader state={state} dispatch={dispatch} />

      {state.view === 'chat' ? (
        <>
          <MessageList
            messages={state.messages}
            showTyping={state.coachStatus === 'typing'}
            pinKey={`${state.chatPhase}:${revealedBeats}:${storyTyping}:${displayMargin}`}
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
            {inProposal && plan && storyChain && (
              <>
                <StepLabel>{stepLabels.proposal}</StepLabel>
                <StoryProposal
                  beats={storyBeats}
                  chain={storyChain}
                  revealed={revealedBeats}
                  typing={storyTyping}
                  done={storyDone}
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

// ── PHASE 9 · THE STORY CHAIN — the interactive proposal block ───────────────
// The proposal phase is ONE linear 5-beat story (S1–S5), revealed with typing
// pacing. Each beat is a coach bubble; the StoryChainCard is pinned after S4 (the
// connected flow that IS the pitch). The CLOSING beat (S5) carries the TAPPABLE
// lime margin chip — tapping opens the inline MarginTweaker; confirming commits a
// new margin and the WHOLE story (all beats + the chain card) re-renders (the
// parent recomputes `beats`/`chain` at the new margin). Once every beat has
// landed, the tri-state CTAs appear.
//
// Degenerate inviable (no sustainable margin) yields a single honest beat: no
// chip, no chain, no CTA.
function StoryProposal({
  beats,
  chain,
  revealed,
  typing,
  done,
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
  beats: string[]
  chain: StoryChain
  revealed: number
  typing: boolean
  done: boolean
  plan: ProposalPlan
  displayMargin: number
  profile: UserProfile
  risk: RiskProfile
  amount?: number
  onCommitMargin: (margin: number) => void
  onAccept: (margin: number) => void
  onChangeTimeline: () => void
  onChangeGoal: () => void
}) {
  const [open, setOpen] = useState(false)
  const renderedCurrent = formatPct(displayMargin)
  const isStory = plan.hasCta // story (5 beats) vs degenerate (1 honest beat)
  // The chain card pins right after S4 (beat index 3) lands — the payoff visual
  // sits between the return beat and the closing plan.
  const chainAfter = 3
  const lastIndex = beats.length - 1

  return (
    <div className="flex w-full flex-col gap-2.5 pt-1">
      {beats.slice(0, revealed).map((text, i) => {
        const isClosing = isStory && i === lastIndex // S5 carries the margin chip
        return (
          <Fragment key={i}>
            {isClosing ? (
              <ClosingBeat text={text} marginLabel={renderedCurrent} onTapChip={() => setOpen((v) => !v)} />
            ) : (
              <BeatBubble text={text} />
            )}
            {/* pin the chain card after S4 (only in the full 5-beat story) */}
            {isStory && i === chainAfter && <StoryChainCard chain={chain} />}
          </Fragment>
        )
      })}

      {typing && <TypingIndicator />}

      {/* inline tweaker — opened by tapping the chip in S5 */}
      {done && isStory && open && (
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

      {/* tri-state CTAs — only once the whole story has landed and a plan exists */}
      {done && isStory && (
        <ProposalCtas
          status={plan.status}
          monthsAtMargin={plan.monthsAtMargin}
          onAccept={() => onAccept(displayMargin)}
          onChangeTimeline={onChangeTimeline}
          onChangeGoal={onChangeGoal}
        />
      )}
    </div>
  )
}

/** One story beat as a coach bubble (≤2 lines at 393px; *bold* supported). */
function BeatBubble({ text }: { text: string }) {
  return (
    <div className="flex w-full justify-start">
      <div className="max-w-[88%] rounded-[16px] rounded-tl-[6px] bg-roundai-green/[0.06] px-3.5 py-2.5 text-[16.5px] leading-[1.5] text-roundai-green ring-1 ring-roundai-green/[0.06]">
        {renderEmphasis(text)}
      </div>
    </div>
  )
}

/** The closing beat (S5): same bubble, but the margin % is a TAPPABLE lime chip. */
function ClosingBeat({
  text,
  marginLabel,
  onTapChip,
}: {
  text: string
  marginLabel: string
  onTapChip: () => void
}) {
  // Split the beat on the first occurrence of the rendered margin so the chip can
  // replace it inline. If absent (e.g. a margin not cited verbatim), append it.
  const [before, after] = splitOnce(text, marginLabel)
  return (
    <div className="flex w-full justify-start">
      <div className="max-w-[88%] rounded-[16px] rounded-tl-[6px] bg-roundai-green/[0.06] px-3.5 py-2.5 text-[16.5px] leading-[1.5] text-roundai-green ring-1 ring-roundai-green/[0.06]">
        {renderEmphasis(before)}
        <MarginChip label={marginLabel} onTap={onTapChip} />
        {renderEmphasis(after)}
      </div>
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
