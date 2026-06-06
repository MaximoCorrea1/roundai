# Brand

> Palette and type values below are **provisional** — they come from the spec's aesthetic direction and are locked for real in [`design.md`](design.md) during Phase 1, executed via the `frontend-design` skill.

## Name

**roundai** — always lowercase, one word. Not "RoundAI", not "Round AI", not "Roundai". It's a wordmark, not an acronym.

## Positioning

**"el copiloto financiero embebido en tu billetera."**

A copilot, not an advisor — it sits next to you, knows you, and does the steering you'd skip. *Embebido* (embedded) is load-bearing: roundai lives inside the wallet, it isn't a separate app you download.

## Tone of voice

Argentine Spanish, **voseo** (vos / tenés / podés / mirá). Warm, plain-spoken, never condescending.

- **One idea per message.** It's a chat on a phone. Short bubbles, not paragraphs.
- **Explains "en criollo."** When a concept shows up (diversificar, FCI, redondeo), it gets a one-line plain explanation in passing — never a lecture, never assumed knowledge.
- **Never shames.** Low financial literacy is the starting point, not a failing. The coach meets the user where they are.
- **Honest over hype.** It says "tu plata *puede* rendir," never a guaranteed number. If a goal isn't realistic in the timeframe, it says so with tact and offers alternatives.

Example register: *"Ya vi que te quedan unos $108.000 a fin de mes. Con eso, redondeando el 7% de lo que gastás, llegás a tu compu en 7 meses. ¿Le damos?"* (The casual *"unos $108.000"* is the coach's spoken register for the exact `$108.333` from the calculator — on-screen and quoted figures always use the precise value.)

## The two-layer brand principle

roundai is always shown **inside a host wallet**, and the contrast between the two is the B2B pitch made visible.

- **Nimbo (the host wallet)** — deliberately neutral, credible neobank. Cool slate/blue, white surfaces, tidy cards. Reads as "any wallet." Intentionally a little bland.
- **roundai (the embedded layer)** — the memorable one. Deep green field, warm cream, a single vivid lime accent for round-up/growth moments. Characterful display type. This is the layer a judge remembers.

When you see the neutral wallet and then the distinct roundai tile drop into it, you've understood the product: *roundai is the layer wallets plug in.* Never let roundai's styling bleed into Nimbo, or Nimbo's blandness into roundai — the gap between them is the message.

## Palette (provisional)

| Role | Value (provisional) | Use |
|---|---|---|
| roundai deep green | `≈ #0B3D2E` | The roundai layer's primary field. |
| Cream | `≈ #FAF5EC` | Warm surfaces inside the roundai layer. |
| Lime accent | `≈ #C8F560` | The *one* accent — round-up moments, growth, the sweep. Used sparingly. |
| Nimbo neutral | cool slate/blue, white | The host wallet — neutral neobank, no roundai green. |

## Typography (provisional)

- **Display:** a characterful display face, e.g. **Bricolage Grotesque**. Personality lives here.
- **Body:** a clean, refined body face for chat and copy.
- **Money:** **tabular numerals for ALL money**, everywhere, always. Amounts must align and not jitter as they change.

## Icon & usage rules

- The **roundai tile** inside a wallet is always the **deep-green field + the `✦` sweep glyph**. The ✦ is roundai's mark for a round-up landing.
- **Never recolor** the tile or the glyph. The green field and the ✦ are constant across host wallets — that consistency is what makes the embedded layer recognizable from one wallet to the next.
- Inside the roundai layer, the lime accent marks growth/round-up; outside those moments, restraint.

## Banned aesthetics

- **No Inter / Roboto / Arial / system-font stacks.** Default type reads as a template.
- **No purple gradients / "AI slop"** styling.
- **No default-Bootstrap / default-template energy.** If it looks like an untouched starter, it's wrong.
