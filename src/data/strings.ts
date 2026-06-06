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
  // Screen-reader labels (no hardcoded aria-label strings in components).
  a11y: {
    sendMessage: 'Enviar',
    backToWallet: 'Volver a la billetera',
    coachTyping: 'El coach está escribiendo',
    notifications: 'Notificaciones',
    showBalance: 'Mostrar saldo',
    hideBalance: 'Ocultar saldo',
    closePayment: 'Cerrar',
    progressRing: 'Progreso hacia tu meta',
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
    sheetSubtitle: 'Confirmá el pago en un toque',
    splitPreview: 'Con roundai, este pago también suma a tu meta',
    confirm: 'Confirmar pago',
    toMerchant: 'al comercio',
    toGoal: 'a tu meta',
    sweepBadge: '✦ roundai',
    // {margen} = formatPct(marginFraction) — shown on the success split chip
    sweepBadgeWithMargin: '✦ roundai ({margen})',
    withoutRoundai: 'sin roundai: $0 a tu meta',
    success: 'Pago realizado',
    successSubtitle: 'Listo, {comercio} cobrado.',
    sweepLanded: 'Tu meta acaba de crecer ✦',
    done: 'Listo',
    // {monto} = formatARS(sweep) — subline on the badged session txn in the ledger
    ledgerSweep: '+{monto} a tu meta',
  },
  goal: {
    accumulatedLabel: 'este mes · simulado',
    heroCaption: 'acumulado para tu meta',
    remaining: 'estás a {monto} de tu meta',
    reached: '¡Llegaste a tu meta! ✦',
    yield: 'tu plata rindió {monto} ✦ simulado',
    // 12-month PROJECTION (conditional tense — never a promise): a just-activated
    // account has $0 accrued, which is honest but reads dead in the demo.
    yieldLabel12m: 'rendiría en 12 meses ✦ simulado',
    pace: 'a este ritmo: {meses} meses',
    sandbox: 'fondos simulados — sandbox',
    portfolioTitle: 'Tu plata, invertida',
    active: 'tu perfil',
    recalc: 'tu margen se reajusta solo: liquidez prevista {prevista} vs real {real}',
    comingSoon: 'Tu meta, en breve.',
    // Three FCI risk levels — educational, no named instruments, "en criollo".
    portfolio: {
      conservador: {
        name: 'Conservador',
        copy: 'Casi todo en plazos cortos y pesos estables. Crece despacio, pero casi no se mueve para abajo.',
      },
      moderado: {
        name: 'Moderado',
        copy: 'Una mezcla: parte tranquila, parte con más empuje. Equilibra crecer con dormir tranquilo.',
      },
      agresivo: {
        name: 'Agresivo',
        copy: 'Más peso en activos que pueden volar… o caer. Apunta a rendir más a la larga, bancando los saltos.',
      },
    },
  },
  // Proposal bubbles — interpolated in src/lib/proposal.ts from roundup.ts
  // outputs ONLY. Components never see these directly; they receive ready
  // ChatMessages. One idea per bubble, voseo, warm and concrete.
  proposal: {
    // (1) liquidity read — picked by liquidityBand(profile)
    liquidity: {
      baja: 'Tu liquidez a fin de mes es baja: te queda poco margen, así que voy a ir con cuidado para no apretarte.',
      media: 'Tu liquidez a fin de mes es intermedia: hay lugar para guardar algo sin que se te note en el día a día.',
      alta: 'Tenés buena liquidez a fin de mes: hay margen de sobra para hacer crecer tu plata.',
    },
    // (2) round-up explainer + concrete café example ({margen}, {cafe}, {sweepCafe})
    roundup:
      'El redondeo clásico junta monedas — roundai lo calibra a tu meta: cada pago suma su {margen}. Un café de {cafe} suma {sweepCafe} sin que lo sientas.',
    // (3) the proposal — margin + monthly contribution + sustainability framing
    //     ({margen}, {aporte}, {capacidad})
    proposalLine:
      'Mi propuesta: un margen del {margen}. Son ~{aporte} por mes, y entra cómodo dentro de los ~{capacidad} que te suelen sobrar.',
    // (4) months-to-goal projection ({meses}) — appended only when goal has amount
    projection: 'Con eso llegás a tu meta en ~{meses} meses, sin contar rendimientos.',
    // honest branch: reachable but slow (> 24 meses) — offer alternatives
    slow:
      'Siendo honesto: a este ritmo sostenible te tomaría ~{meses} meses, que es bastante. Podemos ajustar el plazo, recortar algún gasto, o arrancar más chico y subir después. ¿Cómo lo ves?',
    // honest branch: unreachable (contribution 0) — no CTA
    unreachable:
      'Te soy sincero: con tu liquidez de hoy no me da para proponerte un aporte que sea sostenible. Mejor arrancamos cuando tengas un poco más de aire a fin de mes — no quiero venderte humo.',
  },
} as const
