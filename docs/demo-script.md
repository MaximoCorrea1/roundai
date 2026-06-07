# Demo script

> **Final run-of-show (iteration 3).** Every figure and quote below was verified rendered
> on screen (integration audit, 2026-06-07) on the **locked path**: profile **mati**, quiz
> **m/m/m**, meta **$ 500.000** named **"La compu"**, plazo **12 meses**, margin **tweaked
> to 7% and confirmed in the tweaker**. ⚠️ Numbers are path-dependent: accept at the
> proposed 3,5% instead and the whole set changes (+$ 154, not +$ 305). Total: **3 minutes.**
> The flow self-narrates (step labels, explanative coach, suggested-question chips) — no
> external pointers needed.

## Run-of-show (beats in order)

| # | Beat | What to do | Say | Budget |
|---|---|---|---|---|
| 0 | **Open** | Deployed URL, pre-loaded tab, hard-refreshed. | "Esto es una billetera cualquiera." | 0:08 |
| 1 | **Wallet + B2B thesis** | Nimbo home; the breathing green roundai tile is the only brand break. | "La billetera es genérica a propósito. roundai es la capa que se enchufa adentro — el cliente es la billetera." | 0:13 |
| 2 | **Tap the tile** | Coach: "Miré tus últimos 6 meses en Nimbo" → "Cada fin de mes te quedan **~$ 108.333** sin usar. Esa plata puede trabajar para vos." | "Ya conoce sus movimientos — ese número sale del ledger real." | 0:12 |
| 3 | **Quiz inversor** | 3 chips (middle ×3) → "**Tu perfil: Moderado ✦**". | "Por regulación el perfil inversor lo declara el usuario — no lo infiere la IA." | 0:16 |
| 4 | **Meta con nombre + plazo** | "Quiero llegar a esta meta" → **$ 500.000** → chip **"La compu"** → **12 meses**. Step labels guide each input. | "Meta concreta, con nombre, con fecha." | 0:18 |
| 5 | **Propuesta que enseña** | Coach: gastos **+5,9%** / sobrante **+20,3%** → mecanismo: "un café de $ 4.350 → $ 154, sin que lo pienses" → plan: "**$ 41.667/mes, el 3,5%** de tu gasto". | "Tendencias reales, el mecanismo explicado, y el MÍNIMO que necesita. Honesto." | 0:18 |
| 6 | **El margen se toca** ⭐ | Tap the lime **3,5%** chip → tweaker (opens at the exact 3,5%): step to **7%** → "aporte **$ 82.600/mes** · llegás en **7 meses** · café suma **$ 305**" → **Confirmar margen** → "✦ Dale, activalo". Activated: "cada pago redondea 7% a *La compu*. Probalo: volvé a la billetera y pagá el café." | "El margen no es caja negra: lo subo al tope de mi perfil y llego en 7 meses en vez de 12. Decido yo, informado. Y mirá — el coach me dice el próximo paso." | 0:25 |
| 7 | **Coach en vivo (Claude real)** | Tap ONE suggested chip ("PROBÁ PREGUNTARME"): `¿Qué es un FCI?` — or type the spicy one: `¿Me conviene comprar dólares?` (watch it deflect). | "Claude en vivo con los números inyectados como autoritativos — no inventa cifras, no recomienda activos. Educa." | 0:28 |
| 8 | **Pagar (pantalla completa)** | Wallet → **Pagar** → full-screen: Café Martínez, **TOTAL A DEBITAR $ 4.655**. Flip the toggle **OFF** (total drops to $ 4.350 — "sin redondeo, tu meta no avanza") → **ON** → split: `$ 4.350 al comercio · +$ 305 a tu meta ✦ roundai (7%)` · "va a tu FCI moderado · simulado" · "este barrido valdría ~$ 4.308 en 12 meses". Confirm → success split → balance **$ 321.845**, badged txn tops the ledger. | "El redondeo es opt-in: lo apago, el total baja; lo prendo, $ 305 van al FCI. Transparencia total." | 0:28 |
| 9 | **Mi meta** | Goal page "**La compu**": lo tuyo **$ 82.906** · te falta **$ 417.094** · "con ~**$ 82.601**/mes en redondeos, llegás en ~**6 meses**" → **LLEGÁS EN {mes año}** (renders relative to demo day) · "tu café de hoy te acercó **1 día** ✦" · Tu cartera: total $ 82.906, "a 12 meses ~**$ 1.166.741** ✦ simulado", reparto Moderado **55/30/15** · Otras metas: Viaje a Bariloche (simulada). | "El café se volvió un día menos de espera, con fecha concreta. Y la cartera se arma según SU perfil. Cada número se recalcula a mano desde el ledger." | 0:24 |
| 10 | **Cierre** | Closing line. | "Gastar todos los días se volvió invertir hacia algo con nombre y fecha. AUM y retención para la billetera; un coach que la gente entiende." | 0:10 |

**Profile switching (Q&A):** pills under the phone — `?perfil=lu` (Conservadora, capacity ~$ 17.500) / `?perfil=fede`. Full reload = clean session.

## Per-beat fallback actions

| Beat | If it goes wrong | Action |
|---|---|---|
| 0 / wifi | Page won't load | Switch to the localhost backup tab (already running). |
| 6 (tweaker) | Stepped past 7% | Step back — it caps at 9,2% (capacity). The script's figures assume confirming at exactly 7%. |
| 7 (live coach) | Stream frozen >6s | **It auto-switches to the canned reply — keep talking.** Canned answers cite the same committed-margin figures. |
| 7 (live coach) | Worst case | `DEMO_MODE=1` deploy is the deterministic fallback build. |
| 8 (pay) | Numbers questioned | Recompute on stage: 7% de $ 4.350 = $ 304,50 → redondeo $ 305. One calculator, zero drift. |
| 9 (goal) | Ring didn't move | Hard-refresh, replay from beat 6 (~40s — state is in-session). |

## Pre-demo checklist

- [ ] Phone hotspot on (do not trust venue wifi).
- [ ] Deployed `/api/health?ping=1` → `live: true` AND warms the function.
- [ ] **Do Not Disturb** on (laptop + phone).
- [ ] Clean **fullscreen** browser profile; devtools closed.
- [ ] One pre-loaded tab on the deployed URL; **hard refresh** right before presenting.
- [ ] Localhost backup running in a second tab.
- [ ] `DEMO_MODE=1` fallback deploy reachable.
- [ ] Layout spot-check on a **1280 × 720** window.
- [ ] Two timed rehearsals on the deployed URL — one with wifi killed mid-beat-7 (the fallback must be invisible).

## Timing budget

**3:00 total.** Beat 7 (live coach) is the elastic one — if Claude streams fast, bank time for
beats 8–9, where the demo wins: the toggle that makes the counterfactual visible, and the café
that becomes "1 día menos" toward a dated goal.
