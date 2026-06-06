// Canned demo transcript (spec decision #3). When DEMO_MODE=1 the route streams
// these instead of calling Claude, and the client fake-streams them as the
// watchdog/sentinel fallback so the judge NEVER sees a frozen chat.
//
// Every reply is parameterized by profile and derives ALL numbers from
// roundup.ts for THAT profile (spec decision #4: lock ACTIVE_PROFILE_ID before
// the demo — fallback fidelity is guaranteed only for the active profile).
// Voseo, SHORT (2-3 sentences), one idea, persona-consistent with coach.ts.

import type { ChatMessage } from './chat-types'
import type { UserProfile } from './roundup'
import {
  computeOptimalMargin,
  monthlyContribution,
  savingsCapacity,
  clampMargin,
  formatARS,
  formatPct,
} from './roundup'

// The 4 canonical phrasings, exported for the Phase-7 demo script (copy-paste).
export const DEMO_PROMPTS: string[] = [
  '¿Por qué este margen y no más?',
  '¿Qué es un FCI?',
  'Este mes no me alcanza, ¿puedo bajarlo?',
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

  // 1. margin-why — sustainability vs capacity, cite the committed margin.
  if (/por\s*qué|porque|\d\s*%|margen/.test(text)) {
    return `Elegí ${pct} porque entra cómodo en los ~${cap} que te suelen sobrar a fin de mes: son ~${aporte} por mes y no te aprietan. Si subiéramos más, dejaría de ser sostenible y lo terminarías pausando.`
  }

  // 2. fci-explainer — qué es un FCI en criollo, riesgo por niveles, sin instrumentos.
  if (/fci|fondo/.test(text)) {
    return `Un FCI es una canasta donde juntás tu plata con la de otros y un equipo la administra por vos: no tenés que elegir nada a mano. Hay de menos a más riesgo, y vos elegís el nivel con el que dormís tranquilo.`
  }

  // 3. tight-month — el margen se reajusta solo; podés pausarlo cuando quieras.
  if (/no me alcanza|mes\s+(flojo|apretado)|bajar|pausar|pausarlo/.test(text)) {
    return `Tranqui: el margen se reajusta solo según tu liquidez real, así que un mes flojo aporta menos sin que hagas nada. Y si querés, lo pausás cuando quieras y lo retomás después.`
  }

  // 4. compliance-deflection — warm, no recomienda activos, vuelve a la meta.
  if (/d[oó]lar|bitcoin|cripto|acci[oó]n|invierto en/.test(text)) {
    return `Esto es una demo educativa, así que no te voy a recomendar un activo puntual. Lo que sí hacemos es armar el hábito: cada pago suma ${pct} a tu meta, y de a poco aprendés en el camino.`
  }

  // Generic warm fallback — short, returns to the goal.
  return `Buena pregunta. Acá lo importante es el hábito: cada pago barre ${pct} (~${aporte} por mes) hacia tu meta, sin que lo sientas. ¿Querés que lo veamos sobre tu meta?`
}
