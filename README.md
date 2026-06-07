# roundai

**El copiloto financiero embebido en tu billetera.**

roundai es una capa de inteligencia artificial que las billeteras digitales (pensá MercadoPago, Ualá, Lemon) enchufan adentro, y que convierte el gasto cotidiano de sus usuarios en inversión automática: cada pago redondea un margen calibrado hacia una meta concreta y con nombre, y un coach de IA que ya conoce al usuario le explica cada número en el camino. El cliente es la billetera (negocio entre empresas, B2B); los usuarios finales son los de la billetera — la mayoría con baja educación financiera, que jamás va a ir a buscar una aplicación de inversión.

Este repositorio es el prototipo de hackatón (categoría fintech): una aplicación web que dibuja un iPhone dentro del navegador. Tocás una billetera creíble, abrís la miniaplicación de roundai, el coach te guía, definís una meta con nombre y plazo, hacés un pago de prueba y ves el redondeo caer en esa meta — con el chat impulsado por la API real de Claude detrás de un intermediario seguro del lado del servidor. Todo lo demás está deliberadamente simulado.

**Demo en vivo:** [**roundai.vercel.app**](https://roundai.vercel.app) — hoy corre en modo demo (`DEMO_MODE`, coach con respuestas pregrabadas, cero llamadas a la API); al cargar la clave `ANTHROPIC_API_KEY` en Vercel y quitar `DEMO_MODE`, el coach pasa a Claude en vivo sin tocar código.

## Probalo (recorrido de 3 minutos)

El flujo se narra solo (etiquetas en cada paso, preguntas sugeridas), pero este es el camino ideal:

1. **Pantalla principal de la billetera.** Un banco digital deliberadamente neutro ("Nimbo"). La **tarjeta verde de roundai** que respira es la única ruptura de marca — ese contraste *es* la propuesta comercial: una billetera genérica, con roundai enchufado adentro. Tocala.
2. **El coach ya te conoce.** Leyó tus movimientos (simulados): *"Cada fin de mes te quedan ~$ 108.333 sin usar."* Ese número sale de las transacciones que ves en la billetera.
3. **Cuestionario de perfil inversor.** Tres preguntas rápidas. Por regulación, el perfil inversor lo *declara el usuario, no lo deduce la IA* — y se hace visible a propósito. Tu respuesta pone el techo de qué tan agresivo puede ser el redondeo.
4. **Una meta con nombre y fecha.** "Quiero llegar a esta meta" → **$ 500.000** → ponele nombre ("La compu") → elegí un plazo (12 meses).
5. **La historia.** El coach te lleva por una cadena conectada de números reales: cómo funciona el redondeo → cuánto gastás → cuánto invertirías por mes → por qué es sostenible para *tu* liquidez → cuánto rinde en 12 meses (simulado) → cuándo llegás a la meta. **Tocá la ficha del margen** para ajustarlo — cada número de la historia se recalcula en vivo. Después, *"Dale, activalo"*.
6. **Preguntale lo que quieras al coach en vivo.** Esto es Claude de verdad (`claude-sonnet-4-6`), respondiendo en tiempo real, con tus cifras exactas de pantalla inyectadas como autoritativas. Probá las preguntas sugeridas, o tratá de romperlo: *"¿Me conviene comprar dólares?"* — esquiva; nunca recomienda activos ni promete retornos.
7. **Pagá.** De vuelta en la billetera → **Pagar** → Café Martínez, $ 4.350. Apagá y prendé el interruptor de redondeo para ver la comparación: sin roundai, $ 0 a tu meta; con roundai, la división — *`$ 4.350 al comercio · +$ 305 a tu meta ✦ roundai (7%)`*.
8. **La recompensa.** Abrí **Mi meta**: el anillo avanzó exactamente ese barrido, tu café se volvió "1 día menos" hacia una meta con fecha, y la cartera (etiquetada *simulado*) muestra dónde está la plata. Cada número en pantalla se puede recalcular a mano desde los movimientos visibles.

**Cambiar de usuario de demo:** botones debajo del teléfono, o `?perfil=lu` (presupuesto justo, conservadora) / `?perfil=fede` (ingresos altos, agresivo) en la dirección. Recarga completa = sesión limpia.

## Correlo en tu máquina

```bash
pnpm install
cp .env.example .env.local      # agregá tu ANTHROPIC_API_KEY
pnpm dev                        # http://localhost:3000
pnpm test                       # las pruebas de la matemática de la plata (solo src/lib)
pnpm build                      # compilación de producción
```

¿No tenés clave de API a mano? `DEMO_MODE=1 pnpm dev` sirve una conversación pregrabada del coach por el mismo canal — la demo completa corre sin una sola llamada externa. Incluso en modo vivo, el chat cae automáticamente a las respuestas pregrabadas si la conexión se cuelga (más de 6 segundos) o falla, así la demo nunca se congela en el escenario.

> Solo pnpm — `npm install` y `yarn` están bloqueados. Node 20 o superior (archivo `.nvmrc` incluido).

## Cómo está construido

```
Navegador ─ una sola página, un marco de iPhone (393×852) con una máquina de estados adentro:
  billetera (Nimbo) ⇄ miniaplicación roundai (chat ⇄ pantalla de meta) + pantalla de pago
        │  POST /api/chat { profileId, goal, marginFraction, messages }
        ▼
/api/chat (servidor Node) — valida el historial, RECALCULA cada cifra
  del lado del servidor, las inyecta ya formateadas en las instrucciones
  de Claude como autoritativas, y devuelve la respuesta en tiempo real.
  Con DEMO_MODE devuelve texto pregrabado por el mismo canal.
```

Tres reglas mantienen honesta a una demo fintech:

- **Una sola calculadora.** `src/lib/roundup.ts` es el único lugar donde se calcula y formatea plata (módulo puro, desarrollado con pruebas primero, 113 pruebas). La interfaz y la ruta de API lo importan los dos; al coach le está *prohibido* hacer aritmética — cita cifras ya calculadas. Pantalla, instrucciones y respaldo pregrabado no pueden divergir nunca.
- **Números verificables a mano.** Los movimientos simulados de cada perfil suman exactamente su `gastoMensual` (asegurado por pruebas). Un jurado escéptico puede recalcular cualquier cifra en pantalla desde los datos visibles: 7% de $ 4.350 = $ 304,50 → $ 305.
- **Cumplimiento normativo por diseño.** El perfil inversor lo declara el usuario (nunca lo deduce la IA); el coach jamás nombra activos, especies ni bancos y nunca promete retornos; las proyecciones van etiquetadas *simulado, no garantizado*; el aviso ("Información general, no asesoramiento financiero") está siempre visible.

## Seguridad

- **La clave `ANTHROPIC_API_KEY` vive solo en el servidor** — en `.env.local` (ignorado por git) y en las variables de entorno de Vercel. Solo las dos rutas de API tocan el SDK de Anthropic; el navegador habla exclusivamente con `/api/chat`.
- El intermediario acota el abuso: máximo 1000 tokens por respuesta, historial limitado a 24 mensajes, validación estricta de forma, alternancia y tamaño.
- Un tope de gasto en la consola de Anthropic acota la exposición total de la dirección pública de la demo.

## Mapa de documentación

| Documento | Qué cubre |
|---|---|
| [`vision.md`](vision.md) | El problema, el dolor de la billetera y la apuesta |
| [`context.md`](context.md) | Contexto de hackatón y mercado, y el registro completo de decisiones |
| [`brand.md`](brand.md) | Nombre, tono de voz (español rioplatense, voseo), paleta, el principio de contraste con Nimbo |
| [`design.md`](design.md) | Sistema de diseño: variables, marco de iPhone, pantallas, animaciones |
| [`docs/architecture.md`](docs/architecture.md) | Flujo de datos, la regla de una-sola-calculadora, modelo de seguridad, modo demo |
| [`docs/coach-system-prompt.md`](docs/coach-system-prompt.md) | La personalidad de Claude + el contrato de números autoritativos + límites normativos |
| [`docs/demo-script.md`](docs/demo-script.md) | El guion ensayado de 3 minutos con plan de respaldo por escena |
| [`docs/plan.md`](docs/plan.md) | Plan de implementación por fases |
| [`docs/superpowers/specs/`](docs/superpowers/specs/) | La especificación de diseño aprobada — 34 decisiones cerradas, fuente de verdad |

## Qué es real y qué es simulado

| Real | Simulado |
|---|---|
| El coach Claude (en vivo, con intermediario en el servidor) | La billetera, los saldos, las transacciones |
| Toda la matemática de plata y las proyecciones (una calculadora con pruebas) | Los retornos (tasa ilustrativa fija, etiquetada *simulado*) |
| La postura de cumplimiento normativo (cuestionario, límites, avisos) | Conexiones con agentes de bolsa, pagos reales, cuentas de usuario, persistencia |

## Tecnologías

Next.js 16 · TypeScript · Tailwind CSS v4 · SDK de Anthropic (`claude-sonnet-4-6`, versión fijada) · Vitest · pnpm · Vercel.
