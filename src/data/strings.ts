// ALL UI copy lives here (spec decision #16). Argentine Spanish, voseo
// (vos/tenés/podés), warm, plain, never condescending. One idea per message.
// No hardcoded strings in components — extend these groups per screen.

export const strings = {
  wallet: {
    brand: 'Nimbo',
    greeting: 'Hola, {nombre} 👋',
    balanceLabel: 'Saldo disponible',
    actions: { pay: 'Pagar', transfer: 'Transferir', topUp: 'Cargar' },
    ledgerTitle: 'Últimos movimientos',
    roundaiTile: {
      title: 'Inversiones',
      poweredBy: 'powered by roundai',
      cta: 'Hacé que tu plata rinda',
    },
    nav: { home: 'Inicio', cards: 'Tarjetas', pay: 'Pagar', help: 'Ayuda' },
  },
  miniapp: {
    title: 'roundai',
    disclaimer: 'Información general, no asesoramiento financiero',
    tabs: { chat: 'Coach', goal: 'Mi meta' },
    inputPlaceholder: 'Escribile a tu coach…',
  },
  onboarding: {
    goalOptions: {
      rendir: 'Quiero que mi plata rinda',
      meta: 'Quiero llegar a esta meta',
      ahorrar: 'Quiero ahorrar',
      nose: 'No sé',
    },
    amountPrompt: '¿De cuánto hablamos?',
    accept: 'Dale, activalo',
    // Staggered greeting bubbles on first open. {nombre} + ONE real data point
    // ({capacidad} = formatARS(savingsCapacity(profile))) — no invented numbers.
    greeting: {
      hola: 'Hola {nombre} 👋 soy tu coach de roundai.',
      dato: 'Ya le eché un ojo a tus movimientos: te quedaron ~{capacidad} a fin de mes, en promedio.',
      pregunta: '¿Con qué te puedo dar una mano?',
    },
    // ARS amount entry (for 'meta' / 'ahorrar')
    amount: {
      label: 'Monto de tu meta',
      placeholder: '0',
      confirm: 'Listo',
      quick: { lo: '$ 500.000', mid: '$ 1.000.000', hi: '$ 2.000.000' },
      quickValues: { lo: 500_000, mid: 1_000_000, hi: 2_000_000 },
    },
    // Inline confirmation bubble after the proposal is accepted.
    activated: 'Listo, lo activé ✦ Desde ahora cada pago suma a tu meta. Preguntame lo que quieras.',
  },
  payment: {
    payTitle: 'Pagar',
    confirm: 'Confirmar pago',
    toMerchant: 'al comercio',
    toGoal: 'a tu meta',
    sweepBadge: '✦ roundai',
    withoutRoundai: 'sin roundai: $0 a tu meta',
    success: 'Pago realizado',
  },
  goal: {
    remaining: 'estás a {monto} de tu meta',
    yield: 'tu plata rindió {monto} ✦ simulado',
    pace: 'a este ritmo: {meses} meses',
    sandbox: 'fondos simulados — sandbox',
    recalc: 'tu margen se reajusta solo: liquidez prevista {prevista} vs real {real}',
  },
} as const
