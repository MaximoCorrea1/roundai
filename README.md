# roundai

**El copiloto financiero embebido en tu billetera.**

roundai is an embedded AI layer that digital wallets (think MercadoPago, Ualá, Lemon) plug in, turning users' everyday spending into automatic investing: every payment rounds up a calibrated margin into a concrete, named goal, and an AI coach that already knows the user explains every number along the way. The client is the wallet (B2B); the end users are the wallet's users — most of whom have low financial literacy and will never go looking for an investment app.

This repo is the hackathon MVP (fintech track): a web app that renders an iPhone inside the browser. You tap through a believable host wallet, open the roundai miniapp, get coached, set a goal with a name and a deadline, make a mock payment, and watch the round-up land in that goal — with the chat powered by the real Claude API behind a secure server-side proxy. Everything else is deliberately mocked.

**Live demo:** _URL pending — see deploy section below._

## Try it (3-minute walkthrough)

The flow self-narrates (step labels, suggested-question chips), but this is the golden path:

1. **Wallet home.** A deliberately neutral neobank ("Nimbo"). The breathing green **roundai tile** is the only brand break — that contrast *is* the B2B pitch: a generic wallet, with roundai plugged in. Tap it.
2. **The coach already knows you.** It read the (mock) ledger: *"Cada fin de mes te quedan ~$ 108.333 sin usar."* That number is computed from the transactions you can see in the wallet.
3. **Investor profile quiz.** 3 quick chips. By regulation, the suitability profile is *declared by the user, not inferred by the AI* — done visibly, on purpose. Your answer caps how aggressive the round-up can get.
4. **A goal with a name and a date.** "Quiero llegar a esta meta" → **$ 500.000** → name it ("La compu") → pick a plazo (12 meses).
5. **The story.** The coach walks you through one connected chain of real numbers: how the round-up works → what you spend → what you'd invest per month → why it's sustainable for *your* liquidity → what it returns in 12 months (simulated) → when you reach the goal. **Tap the margin chip** to tweak it — every number in the story recomputes live. Then *"Dale, activalo"*.
6. **Ask the live coach anything.** This is real Claude (`claude-sonnet-4-6`), streaming, with your exact on-screen figures injected as authoritative. Try the suggested chips, or try to break it: *"¿Me conviene comprar dólares?"* — it deflects; it never recommends assets or promises returns.
7. **Pay.** Back in the wallet → **Pagar** → Café Martínez, $ 4.350. Flip the round-up toggle off and on to see the counterfactual: without roundai, $ 0 to your goal; with it, the split — *`$ 4.350 al comercio · +$ 305 a tu meta ✦ roundai (7%)`*.
8. **The payoff.** Open **Mi meta**: the ring moved by exactly that sweep, your café became "1 día menos" toward a dated goal, and the portfolio (labeled *simulado*) shows where the money sits. Every number on screen is hand-recomputable from the visible ledger.

**Switch demo users:** pills under the phone, or `?perfil=lu` (tight budget, conservadora) / `?perfil=fede` (high income, agresivo) in the URL. Full reload = clean session.

## Run it locally

```bash
pnpm install
cp .env.example .env.local      # add your ANTHROPIC_API_KEY
pnpm dev                        # http://localhost:3000
pnpm test                       # vitest — the money math (src/lib only)
pnpm build                      # production build
```

No API key handy? `DEMO_MODE=1 pnpm dev` serves a canned coach transcript over the same wire format — the full demo runs without a single live call. Even in live mode, the chat auto-falls back to canned replies if a stream stalls (>6s) or errors, so the demo never freezes on stage.

> pnpm only — `npm install` / `yarn` are guarded against. Node ≥ 20 (`.nvmrc` provided).

## How it's built

```
Browser ─ one page, an iPhone frame (393×852) with a state machine inside:
  wallet (Nimbo) ⇄ roundai miniapp (chat ⇄ goal screen) + payment sheet
        │  POST /api/chat { profileId, goal, marginFraction, messages }
        ▼
/api/chat (Node runtime) — validates history, RECOMPUTES every figure
  server-side, injects them pre-formatted into Claude's system prompt
  as authoritative, streams text deltas back. DEMO_MODE streams canned text.
```

Three rules keep a fintech demo honest:

- **One calculator.** `src/lib/roundup.ts` is the only place money math and formatting happen (pure, TDD'd, 113 tests). The UI and the API route both import it; the coach is *forbidden* from doing arithmetic — it quotes pre-computed figures. Screen, prompt, and canned fallback can never drift.
- **Hand-checkable numbers.** Each profile's mock ledger sums exactly to its `gastoMensual` (asserted in tests). A skeptical judge can recompute any on-screen stat from visible data: 7% de $ 4.350 = $ 304,50 → $ 305.
- **Compliance by design.** The user declares their investor profile (never AI-inferred); the coach never names assets, tickers, or banks and never promises returns; projections are labeled *simulado, no garantizado*; the disclaimer chip ("Información general, no asesoramiento financiero") is always visible.

## Security

- **`ANTHROPIC_API_KEY` is server-side only** — `.env.local` (gitignored) + Vercel env. Only the two API routes touch the Anthropic SDK; the browser talks exclusively to `/api/chat`.
- The proxy bounds abuse: `max_tokens` 1000, history capped at 24 messages, strict shape/alternation/size validation.
- A spend cap in the Anthropic console bounds total exposure for the public demo URL.

## Doc map

| Doc | What it covers |
|---|---|
| [`vision.md`](vision.md) | The problem, the wallet's pain, and the bet |
| [`context.md`](context.md) | Hackathon + market context, and the full decisions log |
| [`brand.md`](brand.md) | Naming, tone of voice (es-AR, voseo), palette, the Nimbo contrast principle |
| [`design.md`](design.md) | Design tokens, iPhone frame spec, screens, motion |
| [`docs/architecture.md`](docs/architecture.md) | Data flow, the one-calculator rule, security model, DEMO_MODE |
| [`docs/coach-system-prompt.md`](docs/coach-system-prompt.md) | The Claude persona + authoritative-numbers contract + compliance limits |
| [`docs/demo-script.md`](docs/demo-script.md) | The rehearsed 3-minute run-of-show with per-beat fallbacks |
| [`docs/plan.md`](docs/plan.md) | Phased implementation plan |
| [`docs/superpowers/specs/`](docs/superpowers/specs/) | The approved design spec — 34 locked decisions, source of truth |

## What's mocked vs real

| Real | Mocked |
|---|---|
| The Claude coach (streaming, server proxy) | The wallet, balances, transactions |
| All money math + projections (one tested calculator) | Returns (fixed illustrative TNA, labeled *simulado*) |
| The compliance posture (quiz, guardrails, disclaimers) | Broker/PSAV/payment rails, auth, persistence |

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · `@anthropic-ai/sdk` (`claude-sonnet-4-6`, pinned) · Vitest · pnpm · Vercel.
