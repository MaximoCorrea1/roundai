# Demo script

> **Skeleton run-of-show.** Exact live prompts and final timings are locked in Phase 7 (Task 7.1) after two timed rehearsals on the deployed URL. Total budget: **3 minutes.**

## Run-of-show (beats in order)

| # | Beat | What to do | Say | Budget |
|---|---|---|---|---|
| 0 | **Open** | Open the deployed URL (pre-loaded tab, hard-refreshed). | "Esto es una billetera cualquiera." | 0:10 |
| 1 | **Wallet + B2B thesis** | Land on the Nimbo wallet home; point at the distinct roundai tile. | "La billetera es genérica a propósito. roundai es la capa que se enchufa adentro — el cliente es la billetera, los usuarios son sus usuarios." | 0:20 |
| 2 | **Tap the tile** | Tap the roundai tile; the miniapp slides in; coach greets by name with one real data point. | "Y ya te conoce." | 0:15 |
| 3 | **Onboarding** | Pick "Quiero llegar a esta meta" → enter **"compu de $500.000"**. | "Le pongo una meta concreta." | 0:20 |
| 4 | **Live coach** | Send **2–3 live prompts** [exact copy-paste prompts TBD — Phase 7]; let each stream; narrate over it. The coach reads liquidity, proposes a 7% margin, projects 7 meses honestly. | "Mirá: lee mi liquidez, me propone un margen sostenible y me dice la verdad sobre el plazo." | 0:50 |
| 5 | **Activate + back to wallet** | Accept the proposal ("Dale, activalo") — the one celebration moment fires; go back to the wallet. | "Lo activo." | 0:10 |
| 6 | **Pay** | Pay **Café Martínez $4.350**; on success, the split shows `+$305 a tu meta ✦ roundai (7%)` and `sin roundai: $0 a tu meta`. | "Pago un café. roundai barre $305 a mi meta. Sin roundai: cero." | 0:25 |
| 7 | **Mi meta** | Reopen the miniapp → "Mi meta": the ring has moved by **exactly $305**. | "La meta se movió justo $305. Todo cierra." | 0:20 |
| 8 | **Close** | Closing line. | "Gastar todos los días se convirtió en invertir hacia algo concreto. Eso es AUM y retención para la billetera, y un coach que la gente entiende." | 0:10 |

## Per-beat fallback actions

| Beat | If it goes wrong | Action |
|---|---|---|
| 0 / wifi | Page won't load | Switch to the localhost backup tab (already running). |
| 4 (live coach) | Stream frozen >6s | **It auto-switches to the canned reply — keep talking.** Don't touch anything; the watchdog handles it. |
| 4 (live coach) | Worst case | `DEMO_MODE=1` build is pre-deployed/ready as the deterministic fallback. |
| 6 (pay) | Numbers look off | They can't drift — every figure comes from one calculator. If asked, recompute live: 7% of $4.350 = $305. |
| 7 (ring) | Ring didn't move | Hard-refresh and replay from beat 5 (state is in-session). |

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
