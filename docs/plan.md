# roundai MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking. ALL UI tasks additionally REQUIRE the `frontend-design`
> skill — no exceptions.

**Goal:** A judged 3-minute demo: believable wallet → roundai miniapp → live Claude coach that
knows the user → sustainable round-up margin → goal/gamification screen, all inside an iPhone
frame in the browser.

**Architecture:** Single Next.js page rendering a phone-frame state machine; one pure module
(`src/lib/roundup.ts`) owns every number on screen and in the prompt; a Node API route proxies
Claude with streaming and a DEMO_MODE fallback. Spec: `docs/superpowers/specs/2026-06-06-roundai-mvp-design.md`.

**Tech stack:** Next.js 15 (App Router) · TypeScript · Tailwind v4 · `@anthropic-ai/sdk`
(`claude-sonnet-4-6`) · Vitest · pnpm · Vercel.

**Phase map** (kickoff phases reordered per spec decision: pure module before live wiring):

| Plan phase | Kickoff phase | What ships | Est. |
|---|---|---|---|
| 0 | 0 | Docs drafts, scaffold, API stubs, Day-1 Vercel deploy | 0.5 day |
| 1 | 1 | Phone frame + Nimbo wallet home (frontend-design) | 0.5 day |
| 2 | 2 | Miniapp transition + chat UI shell (frontend-design) | 0.25 day |
| 3 | 5a | `roundup.ts` pure module — TDD | 0.25 day |
| 4 | 3 | Hardcoded onboarding flow (options → proposal) | 0.25 day |
| 5 | 4 | Live Claude wiring: coach prompt, streaming, DEMO_MODE | 0.5 day |
| 6 | 5b | Goal/gamification screen (frontend-design) | 0.5 day |
| 7 | — | Demo readiness: script, rehearsal, deploy verify | 0.25 day |

---

## Phase 0 — Docs + scaffold

### Task 0.1: Manual Next.js scaffold

**Files:** Create `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`,
`.nvmrc`, `.env.example`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Write `package.json`** (deps added by pnpm next step):

```json
{
  "name": "roundai",
  "private": true,
  "packageManager": "pnpm@10.33.0",
  "engines": { "node": ">=20" },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Install deps** (let pnpm resolve current versions — do NOT hand-pin guesses):

```bash
pnpm add next react react-dom @anthropic-ai/sdk
pnpm add -D typescript @types/node @types/react @types/react-dom tailwindcss @tailwindcss/postcss vitest
```

- [ ] **Write `tsconfig.json`** — Next defaults + `"paths": { "@/*": ["./src/*"] }`, `"strict": true`
- [ ] **Write `postcss.config.mjs`**: `export default { plugins: { "@tailwindcss/postcss": {} } }`
- [ ] **Write `next.config.ts`**: default export of empty config (typed)
- [ ] **Write `src/app/globals.css`**: `@import "tailwindcss";` + empty `@theme` block (tokens land in Phase 1)
- [ ] **Write minimal `src/app/layout.tsx` + `src/app/page.tsx`** ("roundai — en construcción" placeholder, `lang="es"`)
- [ ] **Write `.nvmrc`**: `23`
- [ ] **Write `.env.example`**:

```bash
# Server-side only — never exposed to the browser. Get yours at console.anthropic.com
ANTHROPIC_API_KEY=
# Set to 1 to force the canned demo transcript (no live API calls)
DEMO_MODE=
```

- [ ] **Verify:** `pnpm dev` serves the placeholder at `localhost:3000`; `pnpm build` passes
- [ ] **Commit:** `feat: scaffold Next.js 15 + TS + Tailwind v4`

### Task 0.2: API stubs

**Files:** Create `src/app/api/health/route.ts`, `src/app/api/chat/route.ts`, `src/lib/config.ts`

- [ ] **Write `src/lib/config.ts`:**

```ts
export const MODEL = 'claude-sonnet-4-6' // pinned — see spec decision #2
export const MAX_TOKENS = 1000
export const MAX_HISTORY = 24
export const MAX_TOTAL_CHARS = 16_000
export const TNA_SIMULADA = 0.35 // placeholder illustrative annual rate, always labeled "simulado"
```

- [ ] **Write `/api/health` stub** returning `{ ok: true, model: MODEL, demoMode: process.env.DEMO_MODE === '1', keyPresent: Boolean(process.env.ANTHROPIC_API_KEY) }` (no key value ever)
- [ ] **Write `/api/chat` stub** echoing `{ todo: true }` with the runtime exports already in place (`runtime = 'nodejs'`, `dynamic = 'force-dynamic'`, `maxDuration = 30`)
- [ ] **Verify:** `curl localhost:3000/api/health` → `keyPresent` reflects `.env.local`
- [ ] **Commit:** `feat: health + chat route stubs, pinned model config`

### Task 0.3: Doc set drafts (judged deliverables — draft quality, real content)

**Files:** Create `README.md`, `vision.md`, `context.md`, `brand.md`, `design.md`,
`docs/architecture.md`, `docs/coach-system-prompt.md`, `docs/demo-script.md`

- [ ] `README.md` — what roundai is (one-liner), demo GIF placeholder, quickstart (`pnpm i`, `.env.local`, `pnpm dev`), doc map, security note (key server-side only)
- [ ] `vision.md` — problem (28% financial literacy AR, no discipline, no tangible goals) + wallet pain (TVL/retention) + the bet (round-up + coach = AUM/retention for wallet, automatic understandable investing for user). Short, sharp.
- [ ] `context.md` — hackathon track + deliverables; CAF data from kickoff (939 fintechs; AI #1 opportunity 62%; embedded finance 33%; financial education #1 challenge 57%; B2B 64%); Rappi bonus problem (mark `[deepen from KB]`); **decisions log seeded with spec decisions #1–22**
- [ ] `brand.md` — name (lowercase "roundai"), positioning, tone of voice (es-AR voseo, warm, plain, never condescending), palette + type (from spec aesthetic direction), logo/icon usage, the Nimbo host-wallet contrast principle
- [ ] `design.md` — design tokens (colors/spacing/radii/shadows as CSS vars), iPhone frame spec (393×852, dynamic island, status bar 9:41, home indicator), screen inventory (wallet home, miniapp chat, goal screen), component list, motion rules (in-phone slides, one celebration moment), frontend-design skill conventions referenced
- [ ] `docs/architecture.md` — the diagram + data flow from the spec, "one calculator" rule, security model, DEMO_MODE design
- [ ] `docs/coach-system-prompt.md` — the full Spanish persona prompt (kickoff draft + compliance hardening + the authoritative-numbers contract; final text in Task 5.1 — keep in sync)
- [ ] `docs/demo-script.md` — skeleton: narrative beats, [exact prompts TBD in Phase 7], pre-demo checklist stub
- [ ] **Commit:** `docs: judged doc set drafts + decisions log`

### Task 0.4: Day-1 Vercel deploy (requires Maximo: Vercel login + ANTHROPIC_API_KEY)

- [ ] `pnpm dlx vercel` — link project, deploy
- [ ] Set `ANTHROPIC_API_KEY` in Vercel → Production AND Preview; redeploy
- [ ] **Verify:** deployed `/api/health` shows `keyPresent: true`
- [ ] Maximo sets a **spend cap** in the Anthropic console (manual, console-side)
- [ ] **Commit:** `chore: vercel project config`

---

## Phase 1 — Phone frame + Nimbo wallet *(frontend-design skill MANDATORY)*

### Task 1.1: Design tokens + fonts

**Files:** Modify `src/app/globals.css`, `src/app/layout.tsx`; sync `design.md`

- [ ] Define `@theme` tokens: roundai layer (deep green ≈`#0B3D2E`, cream ≈`#FAF5EC`, lime accent ≈`#C8F560`) + Nimbo layer (neutral slate/blue neobank) + spacing/radius/shadow scale. Final values are a frontend-design decision — record them in `design.md` when locked
- [ ] Load fonts via `next/font` (self-hosted at build = projector-safe): characterful display + refined body + `font-variant-numeric: tabular-nums` for ALL money. **Banned: Inter/Roboto/Arial/system stacks**
- [ ] **Commit:** `feat: design tokens + typography`

### Task 1.2: PhoneFrame component

**Files:** Create `src/components/phone/PhoneFrame.tsx`, `src/components/phone/StatusBar.tsx`

- [ ] Fixed **393×852** screen, CSS bezel + dynamic island + home indicator, centered on a branded page backdrop (subtle texture/gradient mesh + one pitch line: "el copiloto financiero embebido en tu billetera"). Must fit a 1280×720 projector with margin
- [ ] StatusBar: 9:41, signal/wifi/battery glyphs (inline SVG, no icon dep needed)
- [ ] Screen content area = `overflow-hidden` + `position: relative` (transitions happen inside)
- [ ] **Acceptance:** screenshot reads as an iPhone at a glance; nothing overflows the bezel
- [ ] **Commit:** `feat: iPhone frame + status bar`

### Task 1.3: Mock data

**Files:** Create `src/data/profiles.ts`, `src/data/transactions.ts`, `src/data/strings.ts`

- [ ] `profiles.ts` — `UserProfile` type imported from `@/lib/roundup` (type only; module lands Phase 3 — define the interface file-first in `src/lib/roundup.ts` with types + empty impls if needed). Three profiles, **default `mati` (generic salaried, medium liquidity)**:

```ts
export const profiles: UserProfile[] = [
  { id: 'mati',  nombre: 'Mati',  riskProfile: 'moderado',    ingresoMensual: 1_450_000, gastoMensual: 1_180_000, liquidezFinDeMes: [95_000, 120_000, 80_000, 140_000, 110_000, 105_000] },
  { id: 'lu',    nombre: 'Lu',    riskProfile: 'conservador', ingresoMensual: 900_000,   gastoMensual: 870_000,   liquidezFinDeMes: [15_000, 30_000, 8_000, 22_000, 12_000, 18_000] },
  { id: 'fede',  nombre: 'Fede',  riskProfile: 'agresivo',    ingresoMensual: 2_600_000, gastoMensual: 1_700_000, liquidezFinDeMes: [420_000, 510_000, 380_000, 460_000, 490_000, 445_000] },
]
export const ACTIVE_PROFILE_ID = 'mati' // swap here (placeholder numbers — Maximo provides real ones)
```

- [ ] `transactions.ts` — ~8 believable AR transactions (super, SUBE, café, farmacia, streaming…) with amounts + per-transaction round-up annotation (illustration only, never summed into goal math)
- [ ] `strings.ts` — every UI string, es-AR voseo, grouped by screen
- [ ] **Commit:** `feat: mock profiles, ledger, centralized copy`

### Task 1.4: Nimbo wallet home

**Files:** Create `src/components/wallet/WalletHome.tsx`, `src/components/wallet/BalanceCard.tsx`, `src/components/wallet/TransactionList.tsx`, `src/components/wallet/BottomNav.tsx`, `src/components/wallet/RoundaiTile.tsx`

- [ ] Believable neutral neobank: header with avatar + saludo, balance card, QR/pagar/transferir actions, transactions list, bottom nav
- [ ] **RoundaiTile**: visually distinct (roundai green on neutral wallet — the embedded-thesis contrast), clearly tappable, "Inversiones · powered by roundai" + subtle pulse to draw the judge's eye
- [ ] **Acceptance:** a judge believes it's a real wallet; the roundai entry point is unmissable
- [ ] **Commit:** `feat: Nimbo wallet home screen`

---

## Phase 2 — Miniapp shell + chat UI *(frontend-design skill MANDATORY)*

### Task 2.1: App state machine

**Files:** Create `src/components/AppShell.tsx` (client component owning the reducer)

- [ ] ```ts
  type Screen = 'wallet' | 'miniapp'
  type MiniView = 'chat' | 'goal'
  type ChatPhase = 'greeting' | 'goalSelect' | 'goalInput' | 'proposal' | 'live'
  type Goal = { type: 'rendir' | 'meta' | 'ahorrar' | 'nose'; amount?: number }
  type ChatMessage = { role: 'user' | 'assistant'; content: string }
  interface AppState {
    screen: Screen; view: MiniView; chatPhase: ChatPhase
    goal: Goal | null; marginFraction: number | null
    messages: ChatMessage[]
    coachStatus: 'idle' | 'typing' | 'streaming' | 'fallback'
  }
  ```
  `useReducer` with actions: `OPEN_MINIAPP`, `BACK_TO_WALLET`, `SELECT_GOAL`, `SET_AMOUNT`,
  `ACCEPT_PROPOSAL`, `PUSH_MESSAGE`, `APPEND_DELTA`, `SET_STATUS`, `SWITCH_VIEW`
- [ ] Wallet ↔ miniapp slide transition via CSS transform on a track inside the phone screen
- [ ] **Commit:** `feat: in-phone navigation state machine`

### Task 2.2: Chat UI

**Files:** Create `src/components/roundai/ChatScreen.tsx`, `MessageList.tsx`, `MessageBubble.tsx`, `TypingIndicator.tsx`, `ChatInput.tsx`, `MiniappHeader.tsx`

- [ ] MiniappHeader: roundai brand + back button + persistent disclaimer chip ("Información general, no asesoramiento financiero")
- [ ] MessageList: auto-scroll to newest content (incl. during streaming); coach/user bubble styles per tokens
- [ ] TypingIndicator shows the instant a request fires (never a blank pause — demo rhythm)
- [ ] ChatInput: disabled until `chatPhase === 'live'`
- [ ] **Acceptance:** scripted dummy messages render beautifully; streaming text never overflows; auto-scroll works
- [ ] **Commit:** `feat: roundai chat UI shell`

---

## Phase 3 — Pure module, TDD (`src/lib/roundup.ts`)

### Task 3.1: Vitest setup

- [ ] `vitest.config.ts` (node env, include `src/lib/**/*.test.ts`); `pnpm test` runs green on an empty suite placeholder
- [ ] **Commit:** `test: vitest setup`

### Task 3.2–3.8: TDD cycle per function — for EACH: write failing test → `pnpm test` (expect FAIL) → minimal impl → `pnpm test` (expect PASS) → commit

**Files:** Create `src/lib/roundup.ts`, `src/lib/roundup.test.ts`

- [ ] **3.2 `savingsCapacity` + types** — avg of `liquidezFinDeMes`; `[]` → 0

```ts
test('savingsCapacity averages 6 months of liquidity', () => {
  expect(savingsCapacity(mati)).toBeCloseTo(108_333.33, 1)
})
test('savingsCapacity of empty history is 0', () => {
  expect(savingsCapacity({ ...mati, liquidezFinDeMes: [] })).toBe(0)
})
```

- [ ] **3.3 `clampMargin` + unit guard** — clamp [0.01, 0.20]; values > 1 throw `ValidationError` ("did you pass percent instead of fraction?")

```ts
test('rejects percent-style input', () => {
  expect(() => clampMargin(5)).toThrow(ValidationError) // 5 means 500%, caller meant 0.05
})
```

- [ ] **3.4 `computeOptimalMargin`** — `clamp(min(RISK_TO_MARGIN[risk], capacity/gasto))`; capacity ≤ 0 → 0. Tests: the 3 seed profiles (moderado capped by capacity vs not), zero-capacity profile → 0
- [ ] **3.5 `monthlyContribution` + `isSustainable`** — contribution ≤ capacity && margin > 0; negative inputs throw `ValidationError`
- [ ] **3.6 `monthsToGoal`** — `{ reachable, months }`; contribution ≤ 0 → `{ reachable: false, months: null }`; `Math.ceil(goal / contribution)`; test the honest branch with `lu` + meta $2.000.000

```ts
test('unrealistic goal returns honest unreachable', () => {
  expect(monthsToGoal(lu, 0, 2_000_000)).toEqual({ reachable: false, months: null })
})
test('months are ceiled, never under-promised', () => {
  // mati @ 7% of 1.180.000 = 82.600/mes → 500.000 / 82.600 = 6.05 → 7 meses
  expect(monthsToGoal(mati, 0.07, 500_000)).toEqual({ reachable: true, months: 7 })
})
```

- [ ] **3.7 `formatARS` / `formatPct` / `liquidityBand`** — es-AR output; **normalize NBSP in assertions** (`.replace(/ /g, ' ')`); bands: capacity/gasto < 0.05 baja, < 0.25 media, else alta
- [ ] **3.8 `simulateReturns`** — monthly accrual at `TNA_SIMULADA / 12`, returns accumulated + "rendiste" delta; label decisions stay in UI
- [ ] **Final:** `pnpm test` — full suite green. **Commit per function** (`test+feat: roundup <fn>`)

---

## Phase 4 — Hardcoded onboarding flow

### Task 4.1: Greeting + goal options

**Files:** Create `src/components/roundai/OptionButtons.tsx`, `AmountInput.tsx`; modify `AppShell.tsx`, `strings.ts`

- [ ] On `OPEN_MINIAPP`: coach greeting bubbles appear with staggered delay (templated from `strings.ts` + profile name + one data point — "ya vi que te quedaron ~$108.000 a fin de mes")
- [ ] Goal options as tappable chips: "Quiero que mi plata rinda" / "Quiero llegar a esta meta" / "Quiero ahorrar" / "No sé" — `meta`/`ahorrar` open `AmountInput` (ARS-masked numeric)
- [ ] **Commit:** `feat: onboarding greeting + goal selection`

### Task 4.2: Proposal templating (real numbers, zero API)

**Files:** Create `src/lib/proposal.ts`; modify `AppShell.tsx`

- [ ] `buildProposalMessages(profile, goal): ChatMessage[]` — uses ONLY `roundup.ts`: liquidity band line → round-up explainer ("redondeamos tus gastos: esto equivale a ~{pct} mensual") → proposed margin + contribution → monthsToGoal projection ("sin contar rendimientos") OR honest unreachable branch with alternatives → consent CTA "Dale, activalo"
- [ ] On `ACCEPT_PROPOSAL`: store `marginFraction`, fire celebration micro-moment, `chatPhase = 'live'`, enable input
- [ ] **Acceptance:** full onboarding runs offline (no key needed); numbers match a hand calculation
- [ ] **Commit:** `feat: templated margin proposal with real math`

---

## Phase 5 — Live Claude wiring

### Task 5.1: Coach prompt

**Files:** Create `src/lib/coach.ts`; finalize `docs/coach-system-prompt.md` (same text, kept in sync)

- [ ] Persona: kickoff draft (es rioplatense, cálido, CORTO, una idea por mensaje, explica en criollo) + hardening: never reveal ser un LLM/internals, out-of-scope deflection, **no asset/ticker/bank recommendations, no promised returns, no tax/legal advice**
- [ ] Injection block built from `roundup.ts` outputs, pre-formatted:

```
DATOS AUTORITATIVOS (pre-calculados por el sistema — citalos EXACTAMENTE,
nunca recalcules ni redondees; si un número no está acá, decí que no lo tenés):
- Usuario: {nombre} · Perfil: {riskProfile}
- Liquidez fin de mes (prom. 6m): {formatARS(capacity)} → banda {band}
- Gasto mensual: {formatARS(gasto)} · Margen acordado: {formatPct(margin)}
- Aporte mensual: {formatARS(contribution)}
- Meta: {goal} → {reachable ? `${months} meses (sin contar rendimientos)` : 'no alcanzable a margen sostenible'}
```

- [ ] **Commit:** `feat: coach system prompt + authoritative injection`

### Task 5.2: `/api/chat` full implementation

**Files:** Modify `src/app/api/chat/route.ts`

```ts
import Anthropic from '@anthropic-ai/sdk'
import { profiles } from '@/data/profiles'
import { buildSystemPrompt } from '@/lib/coach'
import { computeOptimalMargin, isSustainable, clampMargin } from '@/lib/roundup'
import { MODEL, MAX_TOKENS, MAX_HISTORY, MAX_TOTAL_CHARS } from '@/lib/config'
import { demoReplyFor } from '@/lib/demo-transcript'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const client = new Anthropic() // reads ANTHROPIC_API_KEY server-side

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const profile = profiles.find((p) => p.id === body?.profileId)
  const messages = body?.messages
  if (!profile || !Array.isArray(messages) || messages.length === 0)
    return Response.json({ error: 'bad request' }, { status: 400 })
  if (messages.length > MAX_HISTORY) return Response.json({ error: 'history too long' }, { status: 400 })
  const totalChars = messages.reduce((n: number, m: any) => n + String(m?.content ?? '').length, 0)
  if (totalChars > MAX_TOTAL_CHARS) return Response.json({ error: 'history too large' }, { status: 400 })

  // Never trust client math: re-validate the agreed margin, else recompute
  let margin: number
  try { margin = clampMargin(Number(body?.marginFraction)) } catch { margin = computeOptimalMargin(profile) }
  if (!isSustainable(profile, margin)) margin = computeOptimalMargin(profile)

  if (process.env.DEMO_MODE === '1') return streamPlain(demoReplyFor(messages))

  const system = buildSystemPrompt(profile, body?.goal ?? null, margin)
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages: messages.map((m: any) => ({ role: m.role, content: String(m.content) })),
  })

  const encoder = new TextEncoder()
  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta')
              controller.enqueue(encoder.encode(event.delta.text))
          }
        } catch {
          controller.enqueue(encoder.encode('⚠')) // sentinel: client switches to fallback
        } finally {
          controller.close() // never leave the reader hanging
        }
      },
    }),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } },
  )
}

function streamPlain(text: string): Response {
  const encoder = new TextEncoder()
  return new Response(
    new ReadableStream({
      async start(controller) {
        for (const word of text.split(/(?<=\s)/)) {
          controller.enqueue(encoder.encode(word))
          await new Promise((r) => setTimeout(r, 24)) // believable typing cadence
        }
        controller.close()
      },
    }),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } },
  )
}
```

- [ ] **Verify (manual):** `curl -N` a real conversation; bad payloads → 400; `DEMO_MODE=1 pnpm dev` streams canned text
- [ ] **Commit:** `feat: streaming Claude proxy with validation + demo mode`

### Task 5.3: Client chat hook with watchdog fallback

**Files:** Create `src/lib/useChat.ts`; modify `AppShell.tsx`, `ChatScreen.tsx`

- [ ] `sendMessage(text)`: push user msg → `coachStatus: 'typing'` → POST `/api/chat` → read `response.body.getReader()`, `APPEND_DELTA` per chunk (`coachStatus: 'streaming'`)
- [ ] **Watchdog:** no first byte in **6s**, fetch rejects, non-OK status, or sentinel `⚠` received → `coachStatus: 'fallback'` → fake-stream the matching canned reply from `demo-transcript.ts` locally. The judge never sees a frozen chat
- [ ] History sent = onboarding summary turn + live turns (see Task 5.4), capped client-side at 24
- [ ] **Commit:** `feat: streaming chat hook with auto-fallback`

### Task 5.4: Demo transcript + history seed

**Files:** Create `src/lib/demo-transcript.ts`; modify `src/lib/proposal.ts`

- [ ] `seedHistory(profile, goal, margin): ChatMessage[]` — ONE assistant turn summarizing the onboarding ("Te propuse un margen de 7% (~$82.600/mes) para tu meta de $500.000 — llegás en 7 meses…") so Claude knows its prior statements. Never replay UI bubbles
- [ ] `demoReplyFor(messages)`: canned, on-script answers for the 4 rehearsed demo prompts + 1 generic warm fallback; same numbers as `roundup.ts` outputs for `mati`
- [ ] **Commit:** `feat: canned transcript + history seeding`

### Task 5.5: Health ping + page pre-warm

- [ ] `/api/health?ping=1` → 1-token `client.messages.create` wrapped in try/catch → `{ ok, live: true|false }`
- [ ] `AppShell` fires `fetch('/api/health')` on mount (silent serverless pre-warm)
- [ ] **Verify:** adversarial prompts ("¿compro bitcoin?", "¿qué acción me recomendás?") get compliant deflections; numbers quoted match the screen
- [ ] **Commit:** `feat: health ping + pre-warm`

---

## Phase 6 — Goal / gamification screen *(frontend-design skill MANDATORY)*

### Task 6.1: Goal progress + portfolio

**Files:** Create `src/components/roundai/GoalScreen.tsx`, `ProgressRing.tsx`, `PortfolioCard.tsx`, `RecalcNote.tsx`

- [ ] Segmented control in miniapp: Chat | Mi meta
- [ ] ProgressRing: animated SVG ring — "estás a {formatARS(restante)} de tu meta"; simulated accumulated contributions + "tu plata rindió {formatARS(rendimiento)} ✦ simulado" (via `simulateReturns`)
- [ ] PortfolioCard ×3 risk levels (FCI conservador/moderado/agresivo) — educational copy, **no named instruments**; active one highlighted; "fondos simulados — sandbox" label
- [ ] RecalcNote: "tu margen se reajusta solo: liquidez prevista {X} vs real {Y}" (mocked delta)
- [ ] **The one celebration moment:** when proposal is accepted (Phase 4 hook), the round-up ring ticks up with a single well-timed animation — habit formation framing, no confetti spam
- [ ] **Acceptance:** the emotional payoff screen — a judge sees spending becoming a concrete goal
- [ ] **Commit:** `feat: goal progress + simulated portfolio`

---

## Phase 7 — Demo readiness

### Task 7.1: Demo script + rehearsal

**Files:** Finalize `docs/demo-script.md`; final pass on `README.md`, `context.md` decisions log

- [ ] Exact run-of-show: open deployed URL → wallet beat (B2B thesis line) → tap tile → onboarding (goal: "compu de $500k") → 3–4 **exact copy-paste live prompts** with what to say over each stream → switch to Mi meta → closing line. Per-step fallback action ("if frozen >6s: it auto-switches — keep talking")
- [ ] Pre-demo checklist: hotspot on, `/api/health?ping=1` warm, DND, clean fullscreen browser profile, devtools closed, one pre-loaded tab, hard refresh
- [ ] **Verify:** 2 timed rehearsals on the DEPLOYED URL — one with wifi killed mid-chat (fallback must be seamless)
- [ ] `pnpm build && pnpm test` green; deployed URL spot-check on a 1280×720 window
- [ ] **Commit:** `docs: final demo script + readiness checklist`

---

## Self-review (writing-plans checklist)

- **Spec coverage:** decisions #1–22 each map to a task (✓ traced); all kickoff phases + doc set covered; KB-dependent items marked.
- **No placeholders:** the only deliberate TBDs are Phase-7 demo prompts (depend on built product) and final design-token values (frontend-design decision at build time, recorded in `design.md`).
- **Type consistency:** `UserProfile`/`ChatMessage`/`Goal` defined once (Tasks 1.3/2.1), reused verbatim in Tasks 3.x/4.x/5.x.
