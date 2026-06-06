// Judge-affordance cue derivation (spec decision #32, plan Task 8.E). A PURE
// function of AppState: it names the ONE next demo action a judge should take,
// so a single lime pulse-dot can mark it. Backdrop chrome only — the in-phone
// product never knows it exists. Cues advance and disappear automatically as the
// state machine moves forward (no timers, no dismiss bookkeeping).
//
// The four targets, in demo order:
//   'tile'       → the RoundaiTile on the wallet home (tap to open the miniapp)
//   'marginChip' → the tappable margin chip in the proposal (tap to tweak/understand)
//   'pay'        → the wallet "Pagar" action (make the demo payment so a sweep lands)
//   'goalTab'    → the "Mi meta" header tab (see the sweep land in the goal page)

import type { AppState } from '@/components/AppShell'

export type Cue = 'tile' | 'marginChip' | 'pay' | 'goalTab'

/**
 * The single next-action cue, derived purely from state. Returns null when no
 * cue should show (the judge has nothing pending, or they're mid-step on a
 * surface we don't mark). Each branch is mutually exclusive by construction —
 * the first match wins, so ordering encodes the demo flow.
 */
export function nextCue(state: AppState): Cue | null {
  const live = state.chatPhase === 'live'

  // (1) Pre-onboarding: sitting on the wallet, nothing configured yet → tap the
  //     tile to enter roundai. (marginFraction is the "have we proposed?" flag.)
  if (state.screen === 'wallet' && state.marginFraction == null) return 'tile'

  // (2) In the proposal: the margin chip wants a tap (tweak or understand it). A
  //     one-time hint — fine to show whenever we're on the proposal step.
  if (state.chatPhase === 'proposal') return 'marginChip'

  // (3) Activated, no payment made yet → go pay so a sweep lands. Only marked on
  //     the WALLET screen (that's where the Pagar action lives); inside the
  //     miniapp there's nothing to point at, so no cue.
  if (live && state.sessionTxns.length === 0) {
    return state.screen === 'wallet' ? 'pay' : null
  }

  // (4) A payment landed → look at the goal page to watch the sweep arrive.
  //     Dismisses itself once you're already on the goal view.
  if (live && state.sessionTxns.length > 0 && state.view !== 'goal') return 'goalTab'

  return null
}
