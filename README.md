# roundai

An embedded AI layer that wallets (MercadoPago, Ualá, Lemon) plug in, turning users' everyday spending into automatic investing (round-up) guided by a personalized financial coach. Client = the wallet (B2B). End user = the wallet's users, who have low financial literacy.

This repo is the hackathon MVP: a web app that renders an iPhone inside the browser. A judge taps through a believable host wallet, opens the roundai miniapp, chats with a coach that already knows them, sets a goal, makes a mock payment, and watches the round-up sweep land in that goal — all on-brand, with the chat powered by the real Claude API behind a secure server-side proxy.

## Demo

> 🎬 *Demo GIF pending — record during the Phase 7 rehearsal and drop it at `docs/assets/demo.gif`, then restore:* `![roundai demo](docs/assets/demo.gif)`

### 30-second narrative

1. **Wallet home.** A neutral neobank ("Nimbo") — balance, transactions, bottom nav. Reads as *any* wallet. A distinct roundai tile is the only thing that stands out.
2. **Tap the tile.** The roundai miniapp slides in: a chat coach greets the user *by name*, citing one real detail from their data ("ya te conozco").
3. **Set a goal.** Pick "Quiero llegar a esta meta" → "una compu de $500.000". The coach reads the user's liquidity, proposes a sustainable round-up margin (7%), and projects the timeline honestly (7 meses, sin contar rendimientos).
4. **Pay.** Back in the wallet, pay Café Martínez $4.350. The success screen splits it: `$4.350 al comercio · +$305 a tu meta ✦ roundai (7%)`, with the counterfactual `sin roundai: $0 a tu meta`.
5. **The payoff.** Reopen the miniapp's "Mi meta" screen: the progress ring has ticked by exactly $305. Spending just became a concrete goal.

## Quickstart

```bash
pnpm install
cp .env.example .env.local      # then add your ANTHROPIC_API_KEY
pnpm dev                        # http://localhost:3000
pnpm test                       # vitest, src/lib only
```

No key handy? Run with `DEMO_MODE=1 pnpm dev` to serve the canned transcript (no live API calls). The chat also auto-falls back to canned text if a live stream stalls or errors, so the demo never freezes.

## Doc map

| Doc | What it covers |
|---|---|
| [`vision.md`](vision.md) | The problem, who we serve, and the bet |
| [`context.md`](context.md) | Hackathon + market context, the Rappi bonus problem, the decisions log |
| [`brand.md`](brand.md) | Name, positioning, tone of voice, palette, typography, icon usage |
| [`design.md`](design.md) | Design system: tokens, iPhone frame, screen inventory, motion |
| [`docs/plan.md`](docs/plan.md) | Phased implementation plan (checkboxes track progress) |
| [`docs/architecture.md`](docs/architecture.md) | System diagram, data flow, the "one calculator" rule, security, DEMO_MODE |
| [`docs/coach-system-prompt.md`](docs/coach-system-prompt.md) | The in-app Claude persona + numbers contract + compliance limits |
| [`docs/demo-script.md`](docs/demo-script.md) | Live run-of-show, fallbacks, pre-demo checklist |
| [`docs/superpowers/specs/2026-06-06-roundai-mvp-design.md`](docs/superpowers/specs/2026-06-06-roundai-mvp-design.md) | The approved design spec (24 locked decisions — source of truth) |

## Security

- **`ANTHROPIC_API_KEY` is server-side only.** It lives in `.env.local` (gitignored) and in Vercel's env. Only `src/app/api/chat/route.ts` and `src/app/api/health/route.ts` touch the Anthropic SDK. The browser never sees the key and never calls Anthropic directly — the React chat calls our own `/api/chat`.
- The `/api/chat` proxy is a public unauthenticated endpoint, so it bounds abuse: `max_tokens ≈ 1000`, history rejected above 24 messages, and strict shape/alternation validation.
- **Recommended:** set a spend cap in the Anthropic console before any public/demo deploy. The proxy bounds per-request cost; the console cap bounds total exposure.

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · `@anthropic-ai/sdk` (`claude-sonnet-4-6`) · Vitest · pnpm · Vercel.
