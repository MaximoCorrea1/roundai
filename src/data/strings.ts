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
    // Label of the SavedGoal created on accept — by goal type, never invented.
    goalLabels: {
      rendir: 'Mi plata rindiendo',
      meta: 'Mi meta',
      ahorrar: 'Mi ahorro',
      nose: 'Mi meta',
    },
    amountPrompt: '¿De cuánto hablamos?',
    accept: 'Dale, activalo',
    // Greeting — 2 bubbles max (copy diet, decision #33). {nombre} + the quiz
    // intro that frames the regulatory profiling (decision #26).
    greeting: {
      hola: 'Hola {nombre} 👋 soy tu coach de roundai.',
      pregunta:
        'Antes de arrancar: 3 preguntas. Por regulación, tu perfil inversor lo definís vos — no lo infiero yo.',
    },
    // Investor-profile quiz (decision #26): 3 chip questions, majority → riskProfile.
    quiz: {
      q1: {
        prompt: 'Si tu inversión baja 10% en un mes…',
        c: 'La saco ya',
        m: 'Espero que se recupere',
        a: 'Aprovecho y sumo',
      },
      q2: {
        prompt: '¿Tu experiencia invirtiendo?',
        c: 'Nunca invertí',
        m: 'Algo probé',
        a: 'Hace años',
      },
      q3: {
        prompt: '¿Qué buscás?',
        c: 'Cuidar mi plata',
        m: 'Equilibrio',
        a: 'Crecimiento máximo',
      },
      // Result bubble: "Tu perfil: {perfil} ✦" + one-line meaning, by risk level.
      result: 'Tu perfil: {perfil} ✦',
      labels: { conservador: 'Conservador', moderado: 'Moderado', agresivo: 'Agresivo' },
      meaning: {
        conservador: 'priorizás cuidar tu plata antes que arriesgar.',
        moderado: 'buscás equilibrio entre crecer y dormir tranquilo.',
        agresivo: 'vas por el máximo crecimiento, bancando los saltos.',
      },
    },
    // Timeline step (decision #25): plazo chips + custom-months input.
    timeline: {
      prompt: '¿Para cuándo?',
      chips: { m6: '6 meses', m12: '12 meses', m24: '24 meses', otro: 'otro' },
      values: { m6: 6, m12: 12, m24: 24 },
      customLabel: '¿En cuántos meses?',
      customPlaceholder: 'meses',
      customConfirm: 'Listo',
      customUnit: 'meses',
    },
    // ARS amount entry (for 'meta' / 'ahorrar')
    amount: {
      label: 'Monto de tu meta',
      placeholder: '0',
      confirm: 'Listo',
      quick: { lo: '$ 500.000', mid: '$ 1.000.000', hi: '$ 2.000.000' },
      quickValues: { lo: 500_000, mid: 1_000_000, hi: 2_000_000 },
    },
    // Inline confirmation bubble after the proposal is accepted (≤2 lines).
    activated: 'Listo, lo activé ✦ Cada pago suma a tu meta. Preguntame lo que quieras.',
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
  // Proposal v2 (decisions #25, #28, #33) — interpolated in src/lib/proposal.ts
  // from roundup.ts outputs ONLY (planGoal + trendOf). Tri-state, ≤2 lines per
  // bubble. Components never see these directly; they receive ready ChatMessages.
  proposal: {
    // (0) tendencies line — REAL data via trendOf(gastoHist) + trendOf(liquidez).
    //     {gastoDir}/{gastoPct}/{liqDir}/{liqPct} pre-rendered in proposal.ts.
    tendencies:
      'Tus gastos {gastoDir} ({gastoPct}) y tu liquidez {liqDir} ({liqPct}) — esto se recalcula solo cada mes.',
    // direction verbs (criollo, ≤2 words) keyed by trendOf direction.
    trendVerb: { sube: 'suben suave', estable: 'están estables', baja: 'bajan' },
    trendVerbLiq: { sube: 'también sube', estable: 'está estable', baja: 'baja' },
    // (A) comodo — deadline met at the floored required margin.
    //     {amount}/{months}/{monthly}/{margen}/{capacity}
    comodo:
      'Para {amount} en {months} meses: {monthly}/mes → margen {margen}. Entra cómodo: te sobran ~{capacity}.',
    // (A') comodo, no deadline ('rendir'/'nose'): sustainable open-ended plan.
    //     {margen}/{monthly}/{capacity}
    comodoOpen:
      'Margen {margen}: ~{monthly}/mes hacia tu plata. Entra cómodo dentro de los ~{capacity} que te sobran.',
    // (B) ajustado — capped at the risk-profile rate; deadline slips.
    //     {months}/{required}/{risk}/{margen}/{monthsAtMargin}
    ajustado:
      'En {months} meses harían falta {required}/mes — más que el tope de tu perfil {risk}. A {margen} llegás en {monthsAtMargin} meses.',
    // (C) inviable — even full capacity misses the deadline; honest best timeline.
    //     {capacity}/{months}/{margen}/{monthsAtMargin}
    inviable:
      'Ni usando todo tu sobrante ({capacity}/mes) llegás en {months}. A tu máximo ({margen}) son {monthsAtMargin} meses.',
    // degenerate inviable: no sustainable margin exists at all — no CTA.
    unreachable:
      'Con tu liquidez de hoy no me da para un aporte sostenible. Arrancamos cuando tengas más aire a fin de mes — no te vendo humo.',
    // tri-state CTA chip labels (rendered as buttons next to/after the proposal)
    ctas: {
      acceptDefault: 'Dale, activalo',
      acceptMonths: 'Dale, {meses} meses',
      changeTimeline: 'Cambiar plazo',
      changeGoal: 'Cambiar meta',
    },
  },
  // Interactive margin tweaker (decision #27) — the margin chip taps open this.
  tweaker: {
    chipHint: 'tocá para ajustar',
    title: 'Ajustá tu margen',
    rowAporte: 'aporte/mes',
    rowMonths: 'llegás en',
    rowCafe: 'un café de {cafe} suma',
    monthsValue: '{meses} meses',
    monthsUnreachable: 'no llega',
    // sustainability bar caption when contribution exceeds the session-risk cap.
    overCap: 'por encima de tu perfil {risk}',
    withinCap: 'sostenible para tu perfil {risk}',
    confirm: 'Confirmar margen',
    stepDown: 'Bajar margen',
    stepUp: 'Subir margen',
  },
} as const
