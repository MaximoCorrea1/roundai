# Design system

> **Token values are LOCKED Phase 1 (Task 1.1).** They live in `src/app/globals.css` under the Tailwind v4 `@theme` block and are mirrored here — this doc and that file move together. Locked via the `frontend-design` skill.
>
> **Mandate: every UI task goes through the `frontend-design` skill — no exceptions.** No generic AI aesthetics: no Inter/Roboto/system fonts, no purple gradients, no default-template energy.

## Design tokens

Tokens are declared as CSS variables inside `@theme` in `src/app/globals.css`. Names below are the contract (see `brand.md` for palette/type rationale).

### Color (locked Phase 1)

| Token | Value | Use |
|---|---|---|
| `--color-roundai-green` | `#0B3D2E` | roundai layer primary field |
| `--color-roundai-green-deep` | `#072A20` | roundai shadow / mesh base |
| `--color-roundai-green-soft` | `#12513C` | raised surface inside the green field |
| `--color-cream` | `#FAF5EC` | roundai warm surface |
| `--color-cream-dim` | `#ECE3D2` | cream hairline / muted |
| `--color-lime` | `#C8F560` | the single accent — round-up / growth / the sweep |
| `--color-lime-deep` | `#A9DA3E` | lime pressed / on cream for contrast |
| `--color-nimbo-surface` | `#FFFFFF` | host wallet card surfaces |
| `--color-nimbo-bg` | `#F4F6F9` | host wallet app canvas (cool off-white) |
| `--color-nimbo-slate` | `#4F5D73` | host wallet neutral chrome / secondary text (darkened iter 3 → ≥4.5:1 on white) |
| `--color-nimbo-slate-deep` | `#243345` | slate headings / active nav (darkened iter 3) |
| `--color-nimbo-line` | `#E6EAF0` | hairline borders / dividers |
| `--color-nimbo-tint` | `#EEF2F8` | chip / action-button fill |
| `--color-nimbo-blue` | `#2F6DF0` | the wallet's restrained primary blue |
| `--color-ink` | `#0E141D` | primary text (darkened iter 3 → ≥7:1 on white & cream) |
| `--color-muted` | `#5D6B82` | secondary text (darkened iter 3 → ≥4.5:1 on white) |

> **Contrast pass (iteration 3):** `ink`, `muted`, `nimbo-slate`, and `nimbo-slate-deep` were darkened so text clears WCAG AA/AAA when projected. Body/label font-weights were also bumped (medium → semibold) where thin type washed out.

### Typography (locked Phase 1)

Loaded via `next/font/google` in `src/app/layout.tsx`, exposed as CSS variables and wired into `@theme`.

| Token | Family | Use |
|---|---|---|
| `--font-display` | **Bricolage Grotesque** (variable, no weight key) | wordmark, headings, the roundai personality |
| `--font-body` | **Hanken Grotesk** | body copy, chat, chrome (refined, non-generic; NOT Inter/Roboto) |
| `--font-mono` | **Spline Sans Mono** | ALL monetary figures — guarantees tabular column alignment (`.tnum` utility: `font-variant-numeric: tabular-nums`) |

**Type scale (iteration 3 — projector legibility):** the global rem base is **17.5px** (`html { font-size: 17.5px }`, up from the browser-default 16px) so every rem-based size scales ~9% larger. Arbitrary `px` text in components was swept up to the new intent: body ≥15px, section titles ≥17px (bold), nav/labels ≥12px, the balance hero 42px bold. Nothing functional renders below ~13px.

### Radius (locked Phase 1)

| Token | Value | Use |
|---|---|---|
| `--radius-sm` | 8px | chips, small controls |
| `--radius-md` | 16px | cards, bubbles |
| `--radius-lg` | 24px | sheets, the balance card |
| `--radius-xl` | 32px | large panels |
| `--radius-phone` | 58px | iPhone bezel corner |

### Shadow (locked Phase 1)

| Token | Value | Use |
|---|---|---|
| `--shadow-card` | `0 1px 2px rgba(20,30,45,.04), 0 8px 24px -12px rgba(20,30,45,.12)` | wallet cards |
| `--shadow-sheet` | `0 -8px 40px -8px rgba(20,30,45,.22)` | payment sheet / modals (upward) |
| `--shadow-phone` | `0 50px 120px -30px rgba(0,0,0,.55), 0 12px 40px -12px rgba(0,0,0,.4)` | the phone frame on the backdrop |
| `--shadow-tile` | `0 10px 30px -10px rgba(7,42,32,.55)` | roundai tile lift on white |

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

Neutral, believable neobank. **Balance card** (tabular numerals, 42px hero), **action row** — **Pagar is the PRIMARY action** (filled roundai-green, lime icon disc, bold cream label, spans 2 of 4 columns, breathing lime highlight) with **Transferir / Cargar** as quiet secondary white cards; the hierarchy must read instantly (iteration 3 fix — the old three-equal-cards row had no primary). **Transaction ledger** (≈8 believable AR transactions summing exactly to `gastoMensual`), **bottom nav**, and the **roundai tile** — visually distinct (roundai green on the neutral wallet), clearly tappable, labeled "Inversiones · powered by roundai," with a slow breath + persistent lime ring to draw the judge's eye. The tile is the only thing that breaks the neutral palette — that contrast is the embedded-thesis cue.

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
- **Judge-magnet "breath" (iteration 3):** the two elements judges should want to touch — the **roundai tile** and the **Pagar CTA** — share one slow breath language: `scale(1) → scale(1.02)` + a soft lime glow, `3.5s ease-in-out infinite alternate` (`roundai-breath` / `pay-breath` keyframes). Each also carries a *persistent* lime highlight at rest (the tile a 1px lime ring, Pagar a `ring-lime/40`) so they read as "touch me" even when motion is off. The tile keeps its `roundai-glint` ✦. **All breath/glint animations are killed under `prefers-reduced-motion: reduce`.** One accent (lime), no carnival.
- CSS transforms/transitions first; reach for Framer Motion only if a specific transition feels stiff.
