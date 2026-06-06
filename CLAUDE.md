# CLAUDE.md — roundai

Hackathon MVP (fintech track): an embedded AI layer that wallets plug in, turning everyday
spending into automatic investing via round-up + an AI coach. **The demo is a web app rendering
an iPhone mockup**: fake wallet → roundai miniapp → live Claude-powered coach chat → goal screen.

**Docs are a first-class deliverable** — judges and co-developers read them. Same quality bar as code.

## Source of truth (read in this order)

1. `docs/superpowers/specs/2026-06-06-roundai-mvp-design.md` — approved design spec (decisions + contracts)
2. `docs/plan.md` — phased implementation plan (checkboxes track progress)
3. `roundai-knowledge-base.md` — product/market canon. **Currently missing** — if present, it wins
   for product/market claims; deepen `vision.md`/`context.md` from it when it lands.

## Workflow (non-negotiable)

- **Superpowers flow is active.** Route per its FLOW.md before every action: brainstorm new scope,
  plan before code, verify before any "done" claim.
- **`frontend-design` skill is MANDATORY for ALL UI work.** Every component, screen, or style
  change goes through it. No generic AI aesthetics: no Inter/Roboto/system fonts, no purple
  gradients, no default-template energy. Tokens live in `design.md` + `src/app/globals.css`.
- **TDD for pure logic only.** `src/lib/roundup.ts` is TDD'd (vitest). Do NOT write tests for UI
  components or mock data — this is a demo.
- **Small commits, clear messages.** Conventional prefixes (`feat:`, `fix:`, `docs:`, `test:`).
- **Decisions log.** Every material decision gets a row in `context.md` (date + decision + why).
- If a fork materially changes scope: **ask Maximo before building**.

## Commands

```bash
pnpm dev          # local dev server
pnpm test         # vitest (src/lib only)
pnpm build        # production build — must pass before any deploy/done claim
```

## Hard rules

- **`ANTHROPIC_API_KEY` is server-side only** — lives in `.env.local` (gitignored) + Vercel env.
  Only `src/app/api/chat/route.ts` and `src/app/api/health/route.ts` touch the Anthropic SDK. Never call
  Anthropic from client code; never expose the key.
- **Model:** `claude-sonnet-4-6`, pinned in ONE constant (`src/lib/config.ts`). Do not use
  `claude-sonnet-4-20250514` (deprecated, retires 2026-06-15). No `temperature`/`top_p`/prefills.
- **One calculator.** All money math AND formatting goes through `src/lib/roundup.ts` (pure, no
  React/server imports). UI and API route both import it. Never re-derive numbers elsewhere —
  the route injects pre-formatted figures into Claude's context as authoritative.
- **Margins are fractions** (`0.05` = 5%), variable name `marginFraction`, clamped [0.01, 0.20].
  Convert to percent only at display time.
- **All UI copy lives in `src/data/strings.ts`** — Argentine Spanish, voseo (vos/tenés/podés),
  warm, plain, never condescending. No hardcoded strings in components.
- **Compliance:** the coach never recommends specific assets/tickers/banks, never promises
  returns. Disclaimer chip ("Información general, no asesoramiento financiero") always visible
  in the miniapp; portfolio labeled "simulado".
- **Demo discipline:** golden path first, polish second. Everything except the Claude chat is
  mocked. Keep the whole experience inside the phone frame.

## Layout

```
src/app/api/chat/route.ts    Claude streaming proxy (+ DEMO_MODE fallback)
src/app/api/health/route.ts  pre-warm ping + key sanity check
src/components/AppShell.tsx  in-phone navigation state machine (useReducer)
src/components/phone/        iPhone frame (bezel, status bar, dynamic island)
src/components/wallet/       fake host-wallet home screen ("Nimbo")
src/components/roundai/      miniapp: chat, onboarding options, goal/portfolio screens
src/lib/config.ts            pinned MODEL + caps + stream sentinel (one place)
src/lib/roundup.ts           ⭐ pure math + es-AR formatting + UserProfile type (TDD)
src/lib/coach.ts             system prompt assembly + authoritative-numbers injection
src/lib/proposal.ts          templated proposal + alternation-safe history seed
src/lib/useChat.ts           streaming chat hook (watchdog → canned fallback)
src/lib/demo-transcript.ts   canned conversation (DEMO_MODE + fixture)
src/data/profiles.ts         3 hardcoded profiles (type imported from lib/roundup)
src/data/transactions.ts     fake wallet ledger (round-ups = illustration only)
src/data/strings.ts          ALL UI copy (es-AR)
```
