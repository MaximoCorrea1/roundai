// Shared chat-domain types (used by the AppShell reducer, lib/proposal.ts,
// lib/coach.ts and the /api/chat route). Kept out of roundup.ts on purpose —
// the calculator stays pure money-math.

export type GoalType = 'rendir' | 'meta' | 'ahorrar' | 'nose'

export interface Goal {
  type: GoalType
  amount?: number // ARS — present for 'meta' and 'ahorrar'
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
