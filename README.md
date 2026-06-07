# roundai

**El copiloto financiero embebido en tu billetera.**

roundai es una capa de IA embebida que las billeteras digitales (pensá MercadoPago, Ualá, Lemon) enchufan adentro, y que convierte el gasto cotidiano de sus usuarios en inversión automática: cada pago redondea un margen calibrado hacia una meta concreta y con nombre, y un coach de IA que ya conoce al usuario le explica cada número en el camino. El cliente es la billetera (B2B); los usuarios finales son los de la billetera — la mayoría con baja educación financiera, que jamás va a ir a buscar una app de inversión.

Este repo es el MVP de hackathon (track fintech): una web app que renderiza un iPhone dentro del navegador. Tocás una billetera creíble, abrís la miniapp de roundai, el coach te guía, definís una meta con nombre y plazo, hacés un pago de prueba y ves el redondeo caer en esa meta — con el chat impulsado por la API real de Claude detrás de un proxy seguro del lado del servidor. Todo lo demás está deliberadamente mockeado.

**Demo en vivo:** [**roundai.vercel.app**](https://roundai.vercel.app) — hoy corre en `DEMO_MODE` (coach enlatado, cero llamadas a la API); al cargar `ANTHROPIC_API_KEY` en el env de Vercel y quitar `DEMO_MODE`, el coach pasa a Claude en vivo sin tocar código.

## Probalo (recorrido de 3 minutos)

El flujo se narra solo (etiquetas por paso, chips de preguntas sugeridas), pero este es el camino dorado:

1. **Home de la billetera.** Un neobanco deliberadamente neutro ("Nimbo"). El **tile verde de roundai** que respira es la única ruptura de marca — ese contraste *es* el pitch B2B: una billetera genérica, con roundai enchufado adentro. Tocalo.
2. **El coach ya te conoce.** Leyó el ledger (mock): *"Cada fin de mes te quedan ~$ 108.333 sin usar."* Ese número sale de las transacciones que ves en la billetera.
3. **Quiz de perfil inversor.** 3 chips rápidos. Por regulación, el perfil de idoneidad lo *declara el usuario, no lo infiere la IA* — y se hace visible a propósito. Tu respuesta pone el techo de qué tan agresivo puede ser el redondeo.
4. **Una meta con nombre y fecha.** "Quiero llegar a esta meta" → **$ 500.000** → ponele nombre ("La compu") → elegí un plazo (12 meses).
5. **La historia.** El coach te lleva por una cadena conectada de números reales: cómo funciona el redondeo → cuánto gastás → cuánto invertirías por mes → por qué es sostenible para *tu* liquidez → cuánto rinde en 12 meses (simulado) → cuándo llegás a la meta. **Tocá el chip del margen** para ajustarlo — cada número de la historia se recalcula en vivo. Después, *"Dale, activalo"*.
6. **Preguntale lo que quieras al coach en vivo.** Esto es Claude real (`claude-sonnet-4-6`), streaming, con tus cifras exactas de pantalla inyectadas como autoritativas. Probá los chips sugeridos, o tratá de romperlo: *"¿Me conviene comprar dólares?"* — esquiva; nunca recomienda activos ni promete retornos.
7. **Pagá.** De vuelta en la billetera → **Pagar** → Café Martínez, $ 4.350. Apagá y prendé el toggle de redondeo para ver el contrafáctico: sin roundai, $ 0 a tu meta; con roundai, el split — *`$ 4.350 al comercio · +$ 305 a tu meta ✦ roundai (7%)`*.
8. **La recompensa.** Abrí **Mi meta**: el anillo se movió exactamente ese barrido, tu café se volvió "1 día menos" hacia una meta con fecha, y la cartera (etiquetada *simulado*) muestra dónde está la plata. Cada número en pantalla se puede recalcular a mano desde el ledger visible.

**Cambiar de usuario demo:** pills debajo del teléfono, o `?perfil=lu` (presupuesto justo, conservadora) / `?perfil=fede` (ingresos altos, agresivo) en la URL. Recarga completa = sesión limpia.

## Correlo local

```bash
pnpm install
cp .env.example .env.local      # agregá tu ANTHROPIC_API_KEY
pnpm dev                        # http://localhost:3000
pnpm test                       # vitest — la matemática de la plata (solo src/lib)
pnpm build                      # build de producción
```

¿No tenés API key a mano? `DEMO_MODE=1 pnpm dev` sirve una transcripción enlatada del coach por el mismo formato de wire — la demo completa corre sin una sola llamada en vivo. Incluso en modo live, el chat cae automáticamente a respuestas enlatadas si un stream se cuelga (>6s) o falla, así la demo nunca se congela en el escenario.

> Solo pnpm — `npm install` / `yarn` están bloqueados. Node ≥ 20 (`.nvmrc` incluido).

## Cómo está construido

```
Navegador ─ una página, un marco de iPhone (393×852) con una máquina de estados adentro:
  billetera (Nimbo) ⇄ miniapp roundai (chat ⇄ pantalla de meta) + sheet de pago
        │  POST /api/chat { profileId, goal, marginFraction, messages }
        ▼
/api/chat (runtime Node) — valida el historial, RECALCULA cada cifra
  del lado del servidor, las inyecta pre-formateadas en el system prompt
  de Claude como autoritativas, y streamea los deltas de texto de vuelta.
  DEMO_MODE streamea texto enlatado por el mismo canal.
```

Tres reglas mantienen honesta a una demo fintech:

- **Una sola calculadora.** `src/lib/roundup.ts` es el único lugar donde se calcula y formatea plata (puro, con TDD, 113 tests). La UI y la ruta de API lo importan los dos; al coach le está *prohibido* hacer aritmética — cita cifras pre-calculadas. Pantalla, prompt y fallback enlatado no pueden divergir nunca.
- **Números verificables a mano.** El ledger mock de cada perfil suma exactamente su `gastoMensual` (asegurado por tests). Un jurado escéptico puede recalcular cualquier cifra en pantalla desde los datos visibles: 7% de $ 4.350 = $ 304,50 → $ 305.
- **Compliance por diseño.** El perfil inversor lo declara el usuario (nunca lo infiere la IA); el coach jamás nombra activos, tickers ni bancos y nunca promete retornos; las proyecciones van etiquetadas *simulado, no garantizado*; el chip de disclaimer ("Información general, no asesoramiento financiero") está siempre visible.

## Seguridad

- **`ANTHROPIC_API_KEY` vive solo en el servidor** — `.env.local` (gitignored) + env de Vercel. Solo las dos rutas de API tocan el SDK de Anthropic; el navegador habla exclusivamente con `/api/chat`.
- El proxy acota el abuso: `max_tokens` 1000, historial limitado a 24 mensajes, validación estricta de forma/alternancia/tamaño.
- Un tope de gasto en la consola de Anthropic acota la exposición total de la URL pública de demo.

## Mapa de docs

| Doc | Qué cubre |
|---|---|
| [`vision.md`](vision.md) | El problema, el dolor de la billetera y la apuesta |
| [`context.md`](context.md) | Contexto de hackathon + mercado, y el log completo de decisiones |
| [`brand.md`](brand.md) | Nombre, tono de voz (es-AR, voseo), paleta, el principio de contraste con Nimbo |
| [`design.md`](design.md) | Tokens de diseño, spec del marco de iPhone, pantallas, motion |
| [`docs/architecture.md`](docs/architecture.md) | Flujo de datos, la regla de una-calculadora, modelo de seguridad, DEMO_MODE |
| [`docs/coach-system-prompt.md`](docs/coach-system-prompt.md) | La persona de Claude + el contrato de números autoritativos + límites de compliance |
| [`docs/demo-script.md`](docs/demo-script.md) | El guion ensayado de 3 minutos con fallbacks por beat |
| [`docs/plan.md`](docs/plan.md) | Plan de implementación por fases |
| [`docs/superpowers/specs/`](docs/superpowers/specs/) | El spec de diseño aprobado — 34 decisiones cerradas, fuente de verdad |

## Qué es real y qué es mock

| Real | Mock |
|---|---|
| El coach Claude (streaming, proxy en servidor) | La billetera, saldos, transacciones |
| Toda la matemática de plata + proyecciones (una calculadora testeada) | Los retornos (TNA ilustrativa fija, etiquetada *simulado*) |
| La postura de compliance (quiz, guardrails, disclaimers) | Rails de broker/PSAV/pagos, auth, persistencia |

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · `@anthropic-ai/sdk` (`claude-sonnet-4-6`, fijado) · Vitest · pnpm · Vercel.
