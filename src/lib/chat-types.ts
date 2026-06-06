// Shared chat-domain types (used by the AppShell reducer, lib/proposal.ts,
// lib/coach.ts and the /api/chat route). Kept out of roundup.ts on purpose —
// the calculator stays pure money-math.

export type GoalType = 'rendir' | 'meta' | 'ahorrar' | 'nose'

export interface Goal {
  type: GoalType
  amount?: number // ARS — present for 'meta' and 'ahorrar'
  months?: number // plazo chosen in the timeline step (spec decision #25)
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
  accumulated: number // ARS swept toward this goal so far
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
