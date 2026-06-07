export const MODEL = 'claude-sonnet-4-6' // pinned — see spec decision #2
export const MAX_TOKENS = 1000
export const MAX_HISTORY = 24
export const MAX_TOTAL_CHARS = 16_000
export const TNA_SIMULADA = 0.35 // placeholder illustrative annual rate, always labeled "simulado"
// Scenario TNAs for goal projections — placeholders, always labeled "simulado".
// 'esperado' intentionally equals TNA_SIMULADA so all projections agree.
export const TNA_ESCENARIOS = { pesimista: 0.15, esperado: 0.35, optimista: 0.55 } as const
export const SENTINEL = '\u0000' // NUL — impossible in real model output; client switches to fallback on sight
