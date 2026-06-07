// Shared chat-domain types (used by the AppShell reducer, lib/proposal.ts,
// lib/coach.ts and the /api/chat route). Kept out of roundup.ts on purpose —
// the calculator stays pure money-math.

export type GoalType = 'rendir' | 'meta' | 'ahorrar' | 'nose'

export interface Goal {
  type: GoalType
  amount?: number // ARS — present for 'meta' and 'ahorrar'
  months?: number // plazo chosen in the timeline step (spec decision #25)
  // User-given name for the goal (iteration 3): optional, captured after the
  // amount step ("ej: La compu"). Falls back to the type's default goalLabel
  // wherever it's missing. The proposal + activated bubble cite it by name.
  label?: string
}

/**
 * A committed goal in the multi-goal state (spec decision #29). Exactly one
 * goal is active and receives sweeps; secondary goals carry their own mocked
 * `accumulated` progress.
 */
export interface SavedGoal {
  id: string
  label: string
  amount: number // ARS target
  months: number // plazo
  accumulated: number // ARS banked toward this goal (live sweeps are folded in on goal switch)
  // Mocked secondary goal (decision #29) — carries its own pre-seeded progress
  // and is never fed the real-ledger base sweep. Labeled "simulada" in the UI.
  simulated?: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
