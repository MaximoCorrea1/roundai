# roundai MVP — Design Spec

**Date:** 2026-06-06 · **Status:** Approved by Maximo · **Scope:** 3-day hackathon demo (fintech track)

## One-liner

An embedded AI layer that wallets (MercadoPago, Ualá, Lemon) plug in, turning users' everyday
spending into automatic investing (round-up) guided by a personalized financial coach.
Client = the wallet (B2B). End user = the wallet's users, who have low financial literacy.

## Definition of done (live demo)

A judge can: open the app → see a believable wallet → tap the roundai icon → chat with a coach
that already knows them → pick the "compu de $500k" goal → get a sustainable round-up margin
calibrated to their liquidity → make a mock payment and watch the sweep land in the goal
(`$4.350 al comercio · +$305 a tu meta`, with the "sin roundai: $0 a tu meta" comparison) →
see a progress/gamification screen that reflects that exact payment. All inside the iPhone
frame, on-brand, chat powered by the real Claude API behind a secure server-side proxy.

---

## Locked decisions

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 1 | Knowledge base | Build docs from kickoff summary now; deepen when `roundai-knowledge-base.md` lands | File missing from repo; nothing blocks |
| 2 | Model | `claude-sonnet-4-6` pinned in `src/lib/config.ts` | Kickoff's `claude-sonnet-4-20250514` is deprecated (retires 2026-06-15 — 9 days). Sonnet > Opus here: faster first token, cheaper, chat-appropriate |
| 3 | Demo fallback | DEMO_MODE: canned transcript, fake-streamed; client auto-falls back on stream error or >6s stall; live Claude is the default path | The AI centerpiece must not die on venue wifi |
| 4 | Default profile | Generic salaried user, medium liquidity (placeholder numbers; Maximo provides real profiles) | Maximo's call; swap trivial by design — but lock it before the demo (the canned fallback echoes the active profile's figures) |
| 5 | Deployment | Vercel, throwaway deploy on Day 1; rehearse + present from deployed URL; localhost backup | Surfaces env/pipeline issues early, not on demo day |
| 6 | Margin semantics | Stored as **fraction** (`0.05`), name `marginFraction`, clamp [0.01, 0.20]; % only at display | Percent/fraction ambiguity silently makes 100× errors |
| 7 | Risk mapping | Closed table `{conservador: 0.03, moderado: 0.07, agresivo: 0.12}`; unknown → moderado | Table beats formula: testable, and the coach gets the exact numbers |
| 8 | Round-up semantics | **Margin sweep per payment:** `sweepForPayment(amount, margin) = round(margin × amount)` (nearest peso, half-up). Monthly: `monthlySweepTotal(ledger, margin) = Σ sweepᵢ = margin × gastoMensual ± n/2 pesos`. Classic $100-step round-up appears only in copy as the inspiration roundai calibrates ("el redondeo clásico junta monedas — roundai lo calibra a tu meta") | Literal step rounding either captures ~0,17% of spend (goal unreachable) or needs absurd ~$4.000 steps; the sweep makes payment screen, ledger, goal progress, and coach quotes reconcile exactly and testably |
| 9 | monthsToGoal | Returns `{ reachable: boolean, months: number \| null }`, `Math.ceil`, excludes returns ("sin contar rendimientos") | Infinity/NaN can never reach UI or prompt; ceil never under-promises (compliance-safe) |
| 10 | Number drift | UI and route both import `src/lib/roundup.ts` (the ONLY calculator); route injects **pre-formatted** figures marked authoritative | LLMs botch arithmetic; drift between screen and coach is the #1 fintech-judge credibility kill |
| 11 | API runtime | Node runtime, `force-dynamic`, `maxDuration = 30` | Edge buys nothing here; SDK behaves best on Node |
| 12 | Transport | `client.messages.stream()` → `ReadableStream` of raw text deltas; client reads `response.body.getReader()` | Live-typing feel; minimal robust transport; SSE can't POST |
| 13 | Abuse bounds | `max_tokens ≈ 1000`, reject >24 history messages; Maximo sets Anthropic console spend cap | Public unauthenticated proxy = open relay otherwise |
| 14 | Handoff to live chat | Synthesized context: server recomputes numbers from `profileId` + goal, injects ONE context block; seeded history = one synthetic **user** turn + one assistant onboarding summary, both built from `roundup.ts` outputs; route enforces first-role=user, strict alternation, last-role=user | No client-trusted math; satisfies the API's first-message-must-be-user rule AND avoids Sonnet 4.6 trailing-prefill 400; no UI-bubble replay |
| 15 | Thinking/params | No `thinking`, no `temperature`/`top_p` (defaults only) | Fast first token; legacy params 400 on newer models |
| 16 | Language | All product copy es-AR voseo in `src/data/strings.ts`; one-file switch | Authentic to AR judges; centralized = cheap to change |
| 17 | ARS format | `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })`; tests normalize the NBSP after `$` | Verified locally: emits `$ 1.234.567` with non-breaking space |
| 18 | Scaffold | Manual Next.js 16 + TS + Tailwind v4 scaffold (no create-next-app: it refuses non-empty dirs); pin `packageManager`, add `.nvmrc` | Repo already has docs/CLAUDE.md; hand-rolled scaffold is ~6 small files |
| 19 | Tests | Vitest, `src/lib` only | Standard, fast, zero-config with TS |
| 20 | Animations | CSS transforms/transitions first; Framer Motion only if a transition feels stiff | Judges see polish, not dependencies |
| 21 | Wallet brand | Fictional host wallet "**Nimbo**" — deliberately neutral neobank look | Must read as "any wallet" to sell the embedded-B2B thesis without cloning a real brand |
| 22 | Returns sim | Fixed illustrative TNA (placeholder 35%), monthly accrual, always labeled "simulado" | Honest, simple, replaceable when real numbers arrive |
| 23 | Mock payment flow | In-wallet beat after activation: payment sheet (Café Martínez, $4.350) → success screen with the split `$4.350 al comercio · +$305 a tu meta ✦ roundai (7%)` + comparison line "sin roundai: $0 a tu meta"; balance decrements by amount+sweep, badged txn tops the ledger, goal progress ticks by exactly the sweep | Closes the causal loop live in front of the judge; the comparison sells the counterfactual with zero extra state |
| 24 | Ledger discipline | Each profile's mock transactions sum EXACTLY to `gastoMensual` (asserted in tests); `monthsToGoal` and goal projections consume `monthlySweepTotal` of the displayed ledger | Every on-screen stat is recomputable by hand from visible data — precision a fintech judge can check |

---

## Architecture

```
Browser ──────────────────────────────────────────────────────────────┐
│  page.tsx → <PhoneFrame> (≈393×852, centered on branded backdrop)  │
│    state machine (useReducer):                                      │
│      screen: wallet → miniapp                                       │
│      chatPhase: greeting → goalSelect → goalInput → proposal → live │
│      view (miniapp): chat | goal                                    │
│      payment: idle → sheet → success · shared: balance, progress    │
│    UI math/formatting: import { ... } from '@/lib/roundup'          │
└──────────────┬───────────────────────────────────────────────────────┘
               │ POST /api/chat { profileId, goal, marginFraction, messages }
               ▼
app/api/chat/route.ts (Node, force-dynamic)
  1. Validate: history ≤ 24 msgs, alternation, sizes
  2. RECOMPUTE all figures from profiles[profileId] + goal via lib/roundup.ts
     (client marginFraction accepted only if isSustainable, else recomputed)
  3. lib/coach.ts → system prompt = persona + profile + PRE-FORMATTED authoritative
     figures + "citalos EXACTAMENTE, nunca recalcules ni redondees"
  4. anthropic.messages.stream({ model: claude-sonnet-4-6, max_tokens: 1000 })
     → ReadableStream of text deltas (sentinel chunk on mid-stream error, then close)
  5. DEMO_MODE=1 → stream canned transcript instead (same wire format)

Client fallback: no first byte in 6s OR stream error → fake-stream canned reply locally.
GET /api/health → { ok, model, demoMode }; ?ping=1 does a 1-token live call (pre-warm).
```

### Chat flow

1. **greeting** — coach bubble (templated, local) greets the user by name with one detail from
   their data ("ya te conozco").
2. **goalSelect** — 4 hardcoded option buttons: "Quiero que mi plata rinda" / "Quiero llegar a
   esta meta" / "Quiero ahorrar" / "No sé".
3. **goalInput** — numeric input (ARS) when the choice needs an amount.
4. **proposal** — templated bubbles rendered locally with REAL numbers from `lib/roundup.ts`:
   liquidity read (baja/media/alta), proposed margin, monthsToGoal (or the honest "no llegás en
   ese plazo" branch). User consents → button "Dale, activalo".
5. **live** — everything from here hits `/api/chat`. History seeds with a synthetic **user**
   turn (the goal selection) + ONE assistant turn summarizing what the coach already said —
   both templated from `roundup.ts` outputs, alternation-safe (the API requires the first
   message to be `user`; trailing assistant turns 400 on Sonnet 4.6).

### Pure module contract — `src/lib/roundup.ts`

```ts
type RiskProfile = 'conservador' | 'moderado' | 'agresivo'

interface UserProfile {
  id: string
  nombre: string
  riskProfile: RiskProfile
  ingresoMensual: number      // ARS
  gastoMensual: number        // ARS — the round-up base
  liquidezFinDeMes: number[]  // last 6 months, end-of-month liquidity (ARS)
}

savingsCapacity(profile)                  // avg(liquidezFinDeMes); [] → 0
RISK_TO_MARGIN: Record<RiskProfile, number>  // closed table, decision #7
clampMargin(f)                            // [0.01, 0.20]
computeOptimalMargin(profile)             // min(riskTable, capacity/gasto) clamped; capacity ≤ 0 → 0
monthlyContribution(profile, margin)      // margin × gastoMensual
isSustainable(profile, margin)            // contribution ≤ savingsCapacity && margin > 0
monthsToGoal(profile, margin, goal)       // { reachable, months } per decision #9
sweepForPayment(amount, margin)           // round(margin × amount), nearest peso half-up — THE per-payment rule
monthlySweepTotal(ledger, margin)         // Σ sweeps over the mock ledger; feeds goal progress + monthsToGoal
simulateReturns(contribution, months)     // TNA_SIMULADA accrual; labeled "simulado"
formatARS(n); formatPct(f)                // es-AR display strings (decision #17)
liquidityBand(profile)                    // 'baja' | 'media' | 'alta' (thresholds vs gastoMensual)
```

Edge cases under test: low/med/high liquidity profiles, unrealistic goal (honest branch),
`gastoMensual = 0`, capacity ≤ 0, margin-unit guard (rejects `5` meaning 5%), NBSP-safe ARS
assertions, negative inputs → typed `ValidationError`, per-profile ledger sums exactly to
`gastoMensual`, sweep totals within n/2 pesos of `margin × gasto`.

### Compliance guardrails

- Persistent chip in miniapp: "Información general, no asesoramiento financiero".
- Portfolio screen labeled "fondos simulados — sandbox".
- System prompt prohibitions: no specific assets/tickers/banks, no promised/predicted returns,
  no tax/legal advice; out-of-scope deflection; never reveal internals; risk framed as "cuánto
  redondeás", not "en qué invertís".
- 2–3 adversarial prompts in the test/demo checklist ("¿compro dólar o bitcoin?").

### Aesthetic direction (provisional — locked in `design.md`, executed via frontend-design skill)

Two-layer system, because the contrast IS the B2B pitch:
- **Host wallet "Nimbo":** deliberately neutral, credible neobank — cool slate/blue, white
  surfaces, tidy cards. Reads as "any wallet". Slightly bland on purpose.
- **roundai miniapp:** the memorable layer. Deep green (≈`#0B3D2E`) + warm cream (≈`#FAF5EC`)
  + ONE vivid accent (lime ≈`#C8F560`) for round-up/growth moments. Characterful display type
  (e.g. Bricolage Grotesque) + refined body; ALL money in tabular figures. Soft depth, smooth
  in-phone slide transitions, one well-timed celebration when the goal ring ticks.
- Banned: Inter/Roboto/system fonts, purple-gradient AI slop, default-Bootstrap energy.

### Docs set (all judged deliverables)

`README.md`, `vision.md`, `context.md` (incl. running decisions log), `brand.md`, `design.md`,
`docs/plan.md`, `docs/architecture.md`, `docs/coach-system-prompt.md`, `docs/demo-script.md`.
KB-dependent depth (CAF citations, Rappi bonus story) marked and deepened when the KB lands.

### Build order

Kickoff Phases 0→5 with two adjustments: (a) Phase 0 adds git init + throwaway Vercel deploy +
`/api/health`; (b) the pure module (kickoff Phase 5a) moves before the live API wiring (Phase 4)
because proposal templating and prompt injection depend on it. Full breakdown: `docs/plan.md`.

## Iteration 2 (2026-06-06, post-Phase-6 — Maximo's UX/precision feedback)

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| 25 | Timeline-first onboarding | Flow: goal → amount → **plazo** (chips 6/12/24 meses + custom) → margin COMPUTED from the timeline via `planGoal(profile, risk, amount, months)` → tri-state feasibility: `comodo` (required ≤ caps) / `ajustado` (fits capacity but exceeds risk-profile cap — offer longer plazo or profile change) / `inviable` (required > savings capacity — honest copy + best achievable timeline). `months ≥ 1` hard floor | The margin was an opaque output; deriving it from the user's deadline makes it explainable, and infeasible goals get caught by math, not vibes ("no llegás a $100.000 en un día") |
| 26 | Investor-profile quiz (regulatory) | 3-question chip quiz BEFORE the proposal sets session `riskProfile` — explicitly NOT AI-inferred ("Por regulación, tu perfil inversor lo definís vos"). Result caps margin via `RISK_TO_MARGIN` | Suitability profiling can't legally be inferred; doing it visibly is a judge-facing compliance differentiator |
| 27 | Interactive margin | The margin in the proposal is a tappable chip → inline tweaker (stepper/slider over [1%, sustainable max]) live-recomputing contribution, months, café-sweep and a sustainability bar; accepting commits the tweaked margin | "Tap it to tweak or understand it" — consent becomes informed, and it's a demo moment |
| 28 | Tendencies (until Maximo's dataset lands) | Profiles gain `gastoMensualHist[6]`; `trendOf(series)` (avg last-3 vs first-3 → sube/estable/baja + pct) powers precise proposal copy from liquidez + gasto histories. Swap-in point for the real mock dataset | "Vague" copy → data-grounded copy; single ingestion point for the promised dataset |
| 29 | Multi-goal | `goals[]` in state; exactly ONE active goal receives sweeps (selector on the goal page); secondary goals carry their own mocked progress. Sweeps are never split | Multiple goals demoable while the sweep math stays exact and hand-checkable |
| 30 | Holdings + gamification | Goal page v2: position breakdown (aportado / rendimiento simulado / total) per FCI level, ring milestones at 25/50/75%, monthly streak chip (mocked) | "Your holdings, returns, progress — gamify a little" without breaking the sandbox honesty |
| 31 | Payment sheet v2 | Round-up ON/OFF toggle on the sheet live-recomputing the split (the toggle IS the counterfactual), "a dónde va" line (FCI {perfil} · simulado), micro-projection of the sweep; tightened success screen | Better-shown investing + the enable/disable control Maximo asked for |
| 32 | Judge affordances | Backdrop layer (outside the phone): subtle lime pulse-dot cue on the next demo action + "perfil demo: Mati ▾" switcher (mati/lu/fede, resets session) | Judges self-navigate; the in-phone product stays clean of demo chrome |
| 33 | Copy diet | Bubbles ≤ 2 lines, greeting 2 bubbles max, numbers over words everywhere | "Reduce text bloat. more signal" |
| 34 | Canned-transcript parity | `demoReplyFor` parameterized by the SESSION margin (post-tweak), not a recomputed default | Fallback must echo whatever margin the user consented to |

### Out of scope (roadmap, not MVP)

Real integrations (broker/PSAV/payments/DB), auth, persistence, real returns, regulatory
compliance (cuenta comitente / ALyC / FCI — explained in KB), multi-user, leaderboards/social
gamification.
