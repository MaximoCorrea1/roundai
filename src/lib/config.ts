export const MODEL = 'claude-sonnet-4-6' // pinned — see spec decision #2
export const MAX_TOKENS = 1000
export const MAX_HISTORY = 24
export const MAX_TOTAL_CHARS = 16_000
export const TNA_SIMULADA = 0.35 // placeholder illustrative annual rate, always labeled "simulado"
export const SENTINEL = '​' // impossible in real model output; client switches to fallback on sight
