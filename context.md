# Context

## Hackathon

- **Track:** fintech.
- **Constraint:** 3-day build.
- **Deliverable:** a judged live demo — a believable wallet → roundai miniapp → live Claude coach → sustainable round-up margin → mock payment whose sweep lands in the goal → goal/gamification screen reflecting that exact payment. All inside an iPhone frame in the browser.
- **Bar:** docs are scored alongside code; same quality bar. Read by hackathon judges *and* co-developers.

## Market (from the CAF report, via the product kickoff)

| Signal | Figure | Why it matters for roundai |
|---|---|---|
| Fintechs in the market | **939** | A crowded, commoditized field — features alone don't differentiate. |
| #1 named opportunity | **AI, at 62%** | The market itself says AI is the top opening. roundai's coach is exactly that. |
| Embedded finance | **33%** | A third of the market is already on the embedded thesis roundai is built around. |
| #1 named challenge | **Financial education, at 57%** | The biggest stated problem — and the coach's core job. |
| Market that is B2B | **64%** | roundai sells to wallets, not consumers. The majority of the market works this way. |

> [deepen from KB: full CAF citation (title, year, page) and any segment-level breakdowns, once `roundai-knowledge-base.md` lands]

## The Rappi bonus problem

Variable-income workers receive bonuses that evaporate without a savings mechanism. roundai's round-up rail captures a slice of that income automatically, at the moment it's spent, instead of letting it leak away.

> [deepen from KB: the full Rappi bonus story — the specific worker segment, the size of the leak, and the original framing — once `roundai-knowledge-base.md` lands. The kickoff references it without detail.]

---

## Decisions log

Every material decision gets a row here (date · decision · why). Seeded from the design spec's 24 locked decisions (`docs/superpowers/specs/2026-06-06-roundai-mvp-design.md`). New decisions append below.

| Date | Decision | Why |
|---|---|---|
| 2026-06-06 | Build docs from the kickoff summary now; deepen when `roundai-knowledge-base.md` lands | KB file is missing from the repo; nothing blocks starting. |
| 2026-06-06 | Pin model `claude-sonnet-4-6` in `src/lib/config.ts` | Kickoff's `claude-sonnet-4-20250514` retires 2026-06-15; Sonnet is faster, cheaper, chat-appropriate. |
| 2026-06-06 | DEMO_MODE: canned fake-streamed transcript; client auto-falls back on stream error or >6s stall; live Claude is default | The AI centerpiece must not die on venue wifi. |
| 2026-06-06 | Default profile = generic salaried, medium liquidity (placeholder numbers); lock before demo | Maximo's call; swap is trivial, but the canned fallback echoes the active profile's figures. |
| 2026-06-06 | Deploy to Vercel Day 1; rehearse and present from the deployed URL; localhost backup | Surfaces env/pipeline issues early, not on demo day. |
| 2026-06-06 | Store margin as a fraction (`0.05`), name `marginFraction`, clamp [0.01, 0.20]; show % only at display | Percent/fraction ambiguity silently causes 100× errors. |
| 2026-06-06 | Risk → margin via closed table `{conservador: 0.03, moderado: 0.07, agresivo: 0.12}`; unknown → moderado | A table is testable and gives the coach exact numbers; beats a formula. |
| 2026-06-06 | Round-up = margin sweep per payment: `sweepForPayment(amount, margin) = round(margin × amount)`; classic step round-up is copy-only inspiration | Literal step rounding either captures too little or needs absurd steps; the sweep makes every screen and coach quote reconcile exactly. |
| 2026-06-06 | `monthsToGoal` returns `{reachable, months}`, `Math.ceil`, excludes returns | Infinity/NaN never reach the UI or prompt; ceil never under-promises (compliance-safe). |
| 2026-06-06 | UI and route both import `src/lib/roundup.ts` (the only calculator); route injects pre-formatted authoritative figures | LLMs botch arithmetic; screen/coach drift is the #1 fintech-judge credibility kill. |
| 2026-06-06 | API route: Node runtime, `force-dynamic`, `maxDuration = 30` | Edge buys nothing here; the SDK behaves best on Node. |
| 2026-06-06 | Transport: `client.messages.stream()` → `ReadableStream` of raw text deltas; client reads `getReader()` | Live-typing feel with minimal robust transport; SSE can't POST. |
| 2026-06-06 | Abuse bounds: `max_tokens ≈ 1000`, reject >24 history messages; Maximo sets a console spend cap | A public unauthenticated proxy is an open relay otherwise. |
| 2026-06-06 | Live-chat handoff: server recomputes numbers from `profileId`+goal, injects one context block; seeded history = synthetic user turn + assistant onboarding summary; enforce first-role=user, strict alternation, last-role=user | No client-trusted math; satisfies the API's first-message-must-be-user rule and avoids the Sonnet 4.6 trailing-prefill 400. |
| 2026-06-06 | No `thinking`, no `temperature`/`top_p` (defaults only) | Fast first token; legacy params 400 on newer models. |
| 2026-06-06 | All product copy es-AR voseo in `src/data/strings.ts`; one-file switch | Authentic to AR judges; centralized = cheap to change. |
| 2026-06-06 | ARS via `Intl.NumberFormat('es-AR', …, maximumFractionDigits: 0)`; tests normalize the NBSP after `$` | Verified locally: emits `$ 1.234.567` with a non-breaking space. |
| 2026-06-06 | Manual Next.js 16 + TS + Tailwind v4 scaffold (no create-next-app); pin `packageManager`, add `.nvmrc` | create-next-app refuses non-empty dirs; the repo already has docs/CLAUDE.md. |
| 2026-06-06 | Tests: Vitest, `src/lib` only | Standard, fast, zero-config with TS; UI/mocks aren't tested (it's a demo). |
| 2026-06-06 | Animations: CSS transforms/transitions first; Framer Motion only if a transition feels stiff | Judges see polish, not dependencies. |
| 2026-06-06 | Host wallet is a fictional, deliberately neutral neobank, "Nimbo" | Must read as "any wallet" to sell the embedded-B2B thesis without cloning a real brand. |
| 2026-06-06 | Returns simulated at a fixed illustrative TNA (placeholder 35%), monthly accrual, always labeled "simulado" | Honest, simple, replaceable when real numbers arrive. |
| 2026-06-06 | Mock payment flow: payment sheet (Café Martínez, $4.350) → success with split `$4.350 al comercio · +$305 a tu meta ✦ roundai (7%)` + `sin roundai: $0 a tu meta`; balance −= amount+sweep, badged txn tops ledger, goal ticks by exactly the sweep | Closes the causal loop live in front of the judge; the comparison sells the counterfactual with zero extra state. |
| 2026-06-06 | Ledger discipline: each profile's mock transactions sum exactly to `gastoMensual` (asserted in tests); goal projections consume `monthlySweepTotal` of the displayed ledger | Every on-screen stat is recomputable by hand from visible data — precision a fintech judge can check. |
| 2026-06-06 | Next.js 16 (pnpm resolved latest; plan said 15) — build, dev, and routes verified green | Do-not-hand-pin rule beats a stale doc string; staying on what is installed and verified. |
| 2026-06-06 | Stream sentinel = U+0000 NUL, escaped in source (`\\u0000`) | Truly impossible in model output, greppable in code; an invisible-but-typeable char is not. |
