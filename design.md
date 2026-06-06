# Design system

> **All values below are provisional** until locked in Phase 1 (Task 1.1). Final values are a `frontend-design` decision and live in `src/app/globals.css` under the Tailwind v4 `@theme` block — this doc and that file move together.
>
> **Mandate: every UI task goes through the `frontend-design` skill — no exceptions.** No generic AI aesthetics: no Inter/Roboto/system fonts, no purple gradients, no default-template energy.

## Design tokens

Tokens are declared as CSS variables inside `@theme` in `src/app/globals.css`. Names below are the contract; values are provisional (see `brand.md` for palette/type rationale).

### Color

| Token | Provisional value | Use |
|---|---|---|
| `--color-roundai-green` | `#0B3D2E` | roundai layer primary field |
| `--color-cream` | `#FAF5EC` | roundai warm surface |
| `--color-lime` | `#C8F560` | the single accent — round-up / growth / the sweep |
| `--color-nimbo-surface` | white | host wallet card surfaces |
| `--color-nimbo-slate` | cool slate/blue | host wallet neutral chrome |
| `--color-ink` | near-black | primary text |
| `--color-muted` | mid-gray | secondary text |

### Spacing

| Token | Provisional value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-6` | 24px |
| `--space-8` | 32px |

### Radius

| Token | Provisional value | Use |
|---|---|---|
| `--radius-sm` | 8px | chips, small controls |
| `--radius-md` | 16px | cards, bubbles |
| `--radius-lg` | 24px | sheets, the balance card |
| `--radius-phone` | 56px | iPhone bezel corner |

### Shadow

| Token | Provisional value | Use |
|---|---|---|
| `--shadow-card` | soft, low-spread | wallet cards |
| `--shadow-sheet` | larger, upward | payment sheet / modals |
| `--shadow-phone` | deep ambient | the phone frame on the backdrop |

## iPhone frame spec

- **Screen content area: 393 × 852** (logical points — iPhone 15-class).
- **CSS bezel** around the screen, corner radius `--radius-phone`; **deep ambient shadow** (`--shadow-phone`) so it reads as a physical device.
- **Dynamic island** centered at the top of the screen (pill, dark).
- **Status bar:** time fixed at **9:41**, plus signal / wifi / battery glyphs (inline SVG, no icon dependency).
- **Home indicator:** centered pill at the bottom.
- **Backdrop:** the phone is centered on a branded page backdrop (subtle texture/gradient mesh) carrying one pitch line: *"el copiloto financiero embebido en tu billetera."*
- **Projector fit:** the whole frame + backdrop must fit a **1280 × 720** projector with margin to spare. Nothing overflows the bezel; transitions happen *inside* the screen (`overflow-hidden`, `position: relative`).

## Screen inventory

### Wallet home (Nimbo)

Neutral, believable neobank. **Balance card** (tabular numerals), **action row** (QR / pagar / transferir), **transaction ledger** (≈8 believable AR transactions summing exactly to `gastoMensual`), **bottom nav**, and the **roundai tile** — visually distinct (roundai green on the neutral wallet), clearly tappable, labeled "Inversiones · powered by roundai," with a subtle pulse to draw the judge's eye. The tile is the only thing that breaks the neutral palette — that contrast is the embedded-thesis cue.

### Payment sheet + payment success

- **Payment sheet:** a modal inside the phone — merchant + amount from `DEMO_PAYMENT` (Café Martínez, $4.350), confirm button. With roundai active, the sheet previews the split via `sweepForPayment(amount, marginFraction)`.
- **Payment success:** the split, front and center —
  `$4.350 al comercio · +$305 a tu meta ✦ roundai (7%)` —
  with the sweep animating toward the goal, and the quiet counterfactual line:
  `sin roundai: $0 a tu meta`.
  (Paying *before* activating roundai shows a plain success with no split — the implicit before/after.)

### Miniapp chat

- **Header:** roundai brand + back button + a **persistent disclaimer chip**: `Información general, no asesoramiento financiero`.
- **Bubbles:** distinct coach vs user styling per tokens; coach in the roundai layer, money in tabular figures.
- **Typing indicator:** appears the instant a request fires — never a blank pause.
- **Option chips:** the 4 hardcoded goal choices ("Quiero que mi plata rinda" / "Quiero llegar a esta meta" / "Quiero ahorrar" / "No sé"); `meta`/`ahorrar` open an ARS numeric input.

### Goal screen ("Mi meta")

- **Progress ring:** animated SVG — *"estás a {restante} de tu meta."*
- **Returns line:** *"tu plata rindió {monto} ✦ simulado"* (via `simulateReturns`, always labeled *simulado*).
- **3 FCI risk cards:** conservador / moderado / agresivo — educational copy, **no named instruments**, active one highlighted, labeled "fondos simulados — sandbox."
- **Recalc note:** *"tu margen se reajusta solo: liquidez prevista {X} vs real {Y}"* (mocked delta) — shows the round-up adapts to real liquidity.
- All figures fed by `monthlySweepTotal(ledger, margin)` so a judge can hand-recompute them from the visible ledger.

## Motion rules

- **In-phone slide transitions** between screens (CSS transform on a track inside the phone screen). Smooth, short.
- **One celebration moment, exactly one:** the first sweep landing in the goal ring. A single well-timed animation — habit-formation framing.
- **No confetti spam.** Restraint everywhere else; the one celebration earns its weight by being the only one.
- CSS transforms/transitions first; reach for Framer Motion only if a specific transition feels stiff.
