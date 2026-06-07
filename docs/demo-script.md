# Demo script

> **Final run-of-show (iteration 2).** Every figure below was verified rendered on screen
> (final review, 2026-06-06) on the **locked path**: profile **mati**, quiz **m/m/m**, meta
> **$ 500.000**, plazo **12 meses**, margin **tweaked to 7% and confirmed in the tweaker**.
> ⚠️ The numbers are path-dependent: if you accept the proposal at 3,5% instead, the whole
> number set changes (sweep +$ 152/154, not +$ 305). Stick to the path or re-derive.
> Total budget: **3 minutes.** Live chat unlocks only after "Dale, activalo".

## Run-of-show (beats in order)

| # | Beat | What to do | Say | Budget |
|---|---|---|---|---|
| 0 | **Open** | Deployed URL, pre-loaded tab, hard-refreshed. Subtle cues (lime dots) guide the way; `?guia=0` disables them. | "Esto es una billetera cualquiera." | 0:08 |
| 1 | **Wallet + B2B thesis** | Nimbo wallet home; point at the green roundai tile (cue pulsing on it). | "La billetera es genérica a propósito. roundai es la capa que se enchufa adentro — el cliente es la billetera." | 0:15 |
| 2 | **Tap the tile** | Miniapp slides in; coach greets by name with **$ 108.333** (real ledger math). | "Ya te conoce — eso sale de SUS movimientos." | 0:10 |
| 3 | **Quiz inversor** | Answer the 3 chips (middle option ×3) → "**Tu perfil: Moderado ✦**". | "Por regulación el perfil inversor lo declara el usuario — no lo infiere la IA. Compliance desde el diseño." | 0:18 |
| 4 | **Meta + plazo** | "Quiero llegar a esta meta" → **$ 500.000** → plazo **12 meses**. | "Meta concreta, plazo concreto." | 0:15 |
| 5 | **Propuesta con data** | Tendencias: "gastos **+5,9%**, liquidez **+20,3%**". Proposal: "**$ 41.667/mes → margen 3,5%**. Entra cómodo: te sobran ~$ 108.333." | "Lee mis tendencias reales y me propone lo MÍNIMO que necesito. Honesto." | 0:18 |
| 6 | **El margen se toca** ⭐ | Tap the lime **3,5%** chip → tweaker. Step up to **7%**: "aporte **$ 82.600/mes** · llegás en **7 meses** · un café suma **$ 305**". Confirm AT 7%. Accept ("Dale, activalo"). | "Y acá está el producto: el margen no es una caja negra. Subo al tope de mi perfil… y llego en 7 meses en vez de 12. Yo decido, informado." | 0:25 |
| 7 | **Coach en vivo (Claude real)** | Send ONE live prompt (pick by energy): ① `¿Por qué este margen?` ② `¿Qué es un FCI?` ④ `¿Me conviene comprar dólares?` ← the spicy one — watch it deflect. | "Claude en vivo, con los números inyectados como autoritativos — no inventa cifras. Y no recomienda activos: educa." | 0:30 |
| 8 | **Pagar** | Back to wallet (cue on Pagar) → Café Martínez **$ 4.350**. Flip the round-up toggle OFF ("**sin redondeo, tu meta no avanza**") → ON → split `+$ 305 a tu meta ✦ roundai (7%)` · "va a tu **FCI moderado** · simulado" · "este barrido valdría **~$ 4.308** en 12 meses". Confirm. Balance → **$ 321.845**; badged txn tops the ledger. | "Pago un café. El redondeo es opt-in — lo apago, lo prendo. $ 305 al FCI. Sin roundai: cero." | 0:25 |
| 9 | **Mi meta** | Cue on Mi meta → ring **$ 82.906** (mes simulado $ 82.601 + café $ 305) · "estás a **$ 417.094**" · "a este ritmo: **6 meses**" · "rendiría en 12 meses **~$ 175.529** ✦ simulado" · holdings $ 82.906 / $ 0 / $ 82.906 · racha 1 mes · **Viaje a Bariloche 12%** (simulada). *(Time permitting: tap Activar on Viaje — sweeps follow the active goal, no double-count.)* | "La meta se movió justo $ 305. Cada número se recalcula a mano desde el ledger. Y con varias metas, el redondeo sigue a la activa." | 0:26 |
| 10 | **Cierre** | Closing line. | "Gastar todos los días se volvió invertir hacia algo concreto. AUM y retención para la billetera; un coach que la gente entiende." | 0:10 |

**Profile switching (judges or Q&A):** pills under the phone — `?perfil=lu` (Conservadora: $ 200.000/12m → **1,9%**, café **+$ 83**) / `?perfil=fede`. Full reload = clean session.

## Per-beat fallback actions

| Beat | If it goes wrong | Action |
|---|---|---|
| 0 / wifi | Page won't load | Switch to the localhost backup tab (already running). |
| 6 (tweaker) | Stepped past 7% by mistake | Step back — it caps at 9,2% (capacity) anyway; numbers stay consistent at ANY committed margin. But the script's figures assume 7%. |
| 7 (live coach) | Stream frozen >6s | **It auto-switches to the canned reply — keep talking.** The canned answers cite the same 7% figures. |
| 7 (live coach) | Worst case | `DEMO_MODE=1` deploy is the deterministic fallback build. |
| 8 (pay) | Numbers questioned | Recompute live on stage: 7% de $ 4.350 = $ 304,50 → redondeo $ 305. One calculator, zero drift. |
| 9 (ring) | Ring didn't move | Hard-refresh and replay from beat 6 (state is in-session, ~40s). |

## Pre-demo checklist

- [ ] Phone hotspot on (do not trust venue wifi).
- [ ] Deployed `/api/health?ping=1` → `live: true` (key working) AND warms the function.
- [ ] **Do Not Disturb** on (laptop + phone).
- [ ] Clean **fullscreen** browser profile; devtools closed.
- [ ] One pre-loaded tab on the deployed URL; **hard refresh** right before presenting.
- [ ] Localhost backup running in a second tab.
- [ ] `DEMO_MODE=1` fallback deploy reachable.
- [ ] Decide cues: default ON (judges self-navigate); `?guia=0` for a chrome-free run.
- [ ] Layout spot-check on a **1280 × 720** window.
- [ ] Two timed rehearsals on the deployed URL — one with wifi killed mid-beat-7 (the fallback must be invisible).

## Timing budget

**3:00 total.** Beat 7 (live coach) is the elastic one — if Claude streams fast, bank the time
for beat 9's multi-goal moment. Beats 6 and 8 are where the demo wins: the margin you can
touch, and the payment that visibly funds the goal.
