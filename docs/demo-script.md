# Demo script

> **Final run-of-show.** Re-time after the two rehearsals on the deployed URL (the budgets below are targets). Total budget: **3 minutes.** Note the order: the coach's proposal is templated onboarding — **live chat unlocks only after "Dale, activalo"**.

## Run-of-show (beats in order)

| # | Beat | What to do | Say | Budget |
|---|---|---|---|---|
| 0 | **Open** | Open the deployed URL (pre-loaded tab, hard-refreshed). | "Esto es una billetera cualquiera." | 0:10 |
| 1 | **Wallet + B2B thesis** | Land on the Nimbo wallet home; point at the distinct roundai tile. | "La billetera es genérica a propósito. roundai es la capa que se enchufa adentro — el cliente es la billetera, los usuarios son sus usuarios." | 0:20 |
| 2 | **Tap the tile** | Tap the roundai tile; the miniapp slides in; coach greets by name with one real data point (**~$ 108.333** average end-of-month liquidity — real ledger math). | "Y ya te conoce — eso sale de SUS movimientos." | 0:15 |
| 3 | **Onboarding + proposal** | Pick "Quiero llegar a esta meta" → enter **$500.000** ("la compu"). The coach reads the liquidity band, proposes **7% ≈ $ 82.600/mes** and projects **7 meses, sin contar rendimientos** — all templated from the calculator, zero API risk. | "Lee mi liquidez, me propone un margen sostenible y me dice la verdad sobre el plazo." | 0:25 |
| 4 | **Activate** | Tap **"Dale, activalo"** — confirmation bubble, Mi meta tab + chat input unlock. | "Lo activo." | 0:05 |
| 5 | **Live coach (real Claude)** | Send 2 of these copy-paste prompts (pick by audience energy); let each stream; narrate over it:<br>① `¿Por qué un 7% y no más?`<br>② `¿Qué es un FCI?`<br>③ `Este mes no me alcanza, ¿puedo bajarlo?`<br>④ `¿Me conviene comprar dólares?` ← **the spicy one: watch it deflect — no asset advice, ever.** | "Esto es Claude en vivo, con los números del usuario inyectados como autoritativos — el modelo no inventa cifras. Y miren: no recomienda activos. Educa." | 0:45 |
| 6 | **Pay** | Back to the wallet → **Pagar** → Café Martínez **$ 4.350** → confirm. The split: `$ 4.350 al comercio · +$ 305 a tu meta ✦ roundai (7%)` and `sin roundai: $0 a tu meta`. Balance drops to **$ 321.845**; the badged txn tops the ledger. | "Pago un café. roundai barre $305 a mi meta. Sin roundai: cero. Esto es el producto." | 0:25 |
| 7 | **Mi meta** | Reopen the miniapp → "Mi meta": ring at **$ 82.906** (mes simulado $ 82.601 + el café $ 305), restante, **a este ritmo: 6 meses**, y **"rendiría en 12 meses ~$ 175.529 ✦ simulado"**. | "La meta se movió justo $305. Cada número de esta pantalla se puede recalcular a mano desde el ledger. Todo cierra." | 0:20 |
| 8 | **Close** | Closing line. | "Gastar todos los días se convirtió en invertir hacia algo concreto. Eso es AUM y retención para la billetera, y un coach que la gente entiende." | 0:15 |

## Per-beat fallback actions

| Beat | If it goes wrong | Action |
|---|---|---|
| 0 / wifi | Page won't load | Switch to the localhost backup tab (already running). |
| 5 (live coach) | Stream frozen >6s | **It auto-switches to the canned reply — keep talking.** Don't touch anything; the watchdog handles it. |
| 5 (live coach) | Worst case | `DEMO_MODE=1` build is pre-deployed/ready as the deterministic fallback. |
| 6 (pay) | Numbers look off | They can't drift — every figure comes from one calculator. If asked, recompute live: 7% of $4.350 = $305. |
| 7 (ring) | Ring didn't move | Hard-refresh and replay from beat 4 (state is in-session). |

## Pre-demo checklist

- [ ] Phone hotspot on (do not trust venue wifi).
- [ ] `/api/health?ping=1` hit once to **warm** the serverless function (avoids cold-start latency on the first live message).
- [ ] **Do Not Disturb** on (laptop + phone).
- [ ] Clean **fullscreen** browser profile (no extensions, no bookmarks bar, no notifications).
- [ ] **Devtools closed.**
- [ ] One **pre-loaded tab** on the deployed URL.
- [ ] **Hard refresh** right before presenting (clears any stale in-session state).
- [ ] Localhost backup running in a second tab.
- [ ] `DEMO_MODE=1` fallback build confirmed reachable.
- [ ] Spot-check the layout on a **1280 × 720** window (projector resolution).

## Timing budget

**3:00 total.** Beats sum to 3:00 as budgeted above. The live-coach beat (0:50) is the only elastic one — if Claude is fast, bank the time for the payment/Mi-meta payoff (beats 6–7), which is where the causal loop closes and the demo wins.
