// Canned demo transcript (spec decision #3). When DEMO_MODE=1 the route streams
// these instead of calling Claude, and the client fake-streams them as the
// watchdog/sentinel fallback so the judge NEVER sees a frozen chat.
//
// Every reply is parameterized by profile and derives ALL numbers from
// roundup.ts for THAT profile (spec decision #4: lock ACTIVE_PROFILE_ID before
// the demo — fallback fidelity is guaranteed only for the active profile).
// Voseo, SHORT (≤5 short lines), one idea, persona-consistent with coach.ts.

import type { ChatMessage } from './chat-types'
import type { UserProfile } from './roundup'
import {
  computeOptimalMargin,
  monthlyContribution,
  savingsCapacity,
  clampMargin,
  simulateReturns,
  formatARS,
  formatPct,
} from './roundup'

// The canonical phrasings, exported for the Phase-7 demo script (copy-paste).
// (iteration-4) added "¿Y si me arrepiento?" — a common first-timer fear; the
// answer is educational (pausar/bajar cuando quieras, sin penalidad).
// (iteration-6) "¿Cómo lo calculaste?" goes FIRST — chips render in array order
// and judges should see the derivation question up front; its canned answer is
// the step-by-step cuenta (WHAT/WHY/HOW/HOW-WE-CALCULATED, all from real data).
export const DEMO_PROMPTS: string[] = [
  '¿Cómo lo calculaste?',
  '¿Por qué este margen y no más?',
  '¿Qué es un FCI?',
  'Este mes no me alcanza, ¿puedo bajarlo?',
  '¿Y si me arrepiento?',
  '¿Me conviene comprar dólares?',
]

/**
 * Pick the rehearsed reply for the last user message. Numbers derive from the
 * COMMITTED session margin (decision #34) — whatever the user consented to,
 * post-tweak — not a recomputed default. Falls back to the sustainable optimum
 * if the passed margin is invalid. `messages` is the full history; only the last
 * user turn is matched.
 */
export function demoReplyFor(
  profile: UserProfile,
  marginFraction: number,
  messages: ChatMessage[],
): string {
  let margin: number
  try {
    margin = clampMargin(marginFraction)
  } catch {
    margin = computeOptimalMargin(profile)
  }
  const capacity = savingsCapacity(profile)
  const contribution = monthlyContribution(profile, margin)
  const pct = formatPct(margin)
  const cap = formatARS(capacity)
  const aporte = formatARS(contribution)

  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const text = (lastUser?.content ?? '').toLowerCase()

  // Replies follow ONE shape (iteration-6 format pass): a lead line → short,
  // numbered/broken lines → a close. Every load-bearing figure is *bold*, ≤5
  // lines each, one idea, persona-consistent with coach.ts. Real '\n' breaks
  // (MessageBubble renders whitespace-pre-line). Substance unchanged.

  // 1. derivation — "¿cómo lo calculaste?" the judge question: the cuenta step by
  //    step with the session's real numbers (committed margin). MUST be checked
  //    BEFORE the margin-why branch so "cómo lo calculaste" never falls into it.
  if (/c[oó]mo lo calcul|de d[oó]nde sale|qu[eé] cuenta|c[oó]mo sab[eé]s/.test(text)) {
    const sim = simulateReturns(contribution, 12)
    return `Te muestro la cuenta:\n1. Tus gastos promedio: *${formatARS(profile.gastoMensual)}*/mes (salen de tus movimientos).\n2. Margen ${pct} → ${formatARS(profile.gastoMensual)} × ${pct} = *${aporte}*/mes.\n3. Chequeo: te sobran ~${cap}/mes a fin de mes — el aporte entra cómodo.\n4. FCI 12 meses: ~${formatARS(sim.aportado)} aportado → ~*${formatARS(sim.total)}* con retorno esperado (TNA simulada).\nNada está inventado — todo sale de tu data.`
  }

  // 2. arrepentimiento — pausar/bajar cuando quieras, sin penalidad (educational).
  //    Checked BEFORE "bajar" so "¿y si me arrepiento?" never falls into the
  //    tight-month branch.
  if (/arrepient|me arrepiento|cancel|dar.*baja|salir|me sale mal|y si no/.test(text)) {
    return `Tranqui, no hay letra chica.\nLo pausás o lo bajás cuando quieras, sin penalidad ni costo.\nLo que ya juntaste sigue siendo *tuyo*: lo retirás o lo dejás rindiendo.\nLa idea es que pruebes sin miedo.`
  }

  // 3. margin-why — define WHAT the % is (per-purchase round-up), tie it to
  //    average spending, then sustainability + simulated returns (not a piggy
  //    bank — the money compounds; iteration-5 clarity fix).
  if (/por\s*qué|porque|\d\s*%|margen/.test(text)) {
    const sim = simulateReturns(contribution, 12)
    return `*${pct}* significa: cada compra se redondea un ${pct} para arriba, y ese extra se invierte solo.\n1. Con tus gastos (~${formatARS(profile.gastoMensual)}/mes) eso junta ~*${aporte}*/mes.\n2. Entra cómodo: te sobran ~${cap} a fin de mes.\n3. No es alcancía: en 12 meses aportás ~${formatARS(sim.aportado)} → ~*${formatARS(sim.total)}* con retorno esperado (+${formatARS(sim.rendimiento)} · simulado).`
  }

  // 4. fci-explainer — qué es un FCI en criollo, riesgo por niveles, sin instrumentos.
  if (/fci|fondo/.test(text)) {
    const sim = simulateReturns(contribution, 12)
    return `Un FCI es una canasta: juntás tu plata con la de otros y un equipo la administra por vos.\n1. No elegís nada a mano — y tu plata rinde, no queda quieta.\n2. Con tu ritmo (~${aporte}/mes), en 12 meses serían ~*${formatARS(sim.total)}* (+${formatARS(sim.rendimiento)} de retorno esperado · simulado).\nHay de menos a más riesgo — elegís el nivel con el que dormís tranquilo.`
  }

  // 5. tight-month — el margen se reajusta solo; podés pausarlo cuando quieras.
  if (/no me alcanza|mes\s+(flojo|apretado)|bajar|pausar|pausarlo/.test(text)) {
    return `Tranqui, está pensado para eso.\n1. El margen se reajusta solo según tu liquidez real: un mes flojo aporta *menos* sin que hagas nada.\n2. Y si querés, lo pausás cuando quieras y lo retomás después.`
  }

  // 6. compliance-deflection — warm, no recomienda activos, vuelve a la meta.
  if (/d[oó]lar|bitcoin|cripto|acci[oó]n|invierto en/.test(text)) {
    return `Esto es una demo educativa, así que no te voy a recomendar un activo puntual.\n1. Lo que sí hacemos es armar el hábito: cada pago suma *${pct}* a tu meta.\n2. De a poco aprendés en el camino.`
  }

  // Generic warm fallback — short, returns to the goal.
  return `Buena pregunta.\n1. Acá lo importante es el hábito: cada pago barre *${pct}* (~${aporte}/mes) hacia tu meta, sin que lo sientas.\n¿Querés que lo veamos sobre tu meta?`
}
