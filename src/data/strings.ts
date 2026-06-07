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
    // Tiny uppercase section labels above each interactive step's controls
    // (iteration 3): quiet but legible orientation so a judge always knows
    // what this step is. Rendered in the chat column, never inside a bubble.
    stepLabels: {
      quiz: 'Tu perfil inversor',
      goalSelect: 'Tu meta',
      amount: '¿Cuánto necesitás?',
      goalName: 'Ponele nombre',
      timeline: 'Elegí tu plazo',
      proposal: 'Tu plan',
    },
    goalOptions: {
      rendir: 'Quiero que mi plata rinda',
      meta: 'Quiero llegar a esta meta',
      ahorrar: 'Quiero ahorrar',
      nose: 'No sé',
    },
    // Label of the SavedGoal created on accept — by goal type, never invented.
    // Used as the FALLBACK when the user skips the optional name step.
    goalLabels: {
      rendir: 'Mi plata rindiendo',
      meta: 'Mi meta',
      ahorrar: 'Mi ahorro',
      nose: 'Mi meta',
    },
    amountPrompt: '¿De cuánto hablamos?',
    accept: 'Dale, activalo',
    // Optional goal-name step (iteration 3): after the amount, "ponele nombre" so
    // the proposal + goal page can address it by name. Skippable; chips offer
    // quick presets. The user turn echoes "Le pongo: {nombre}".
    goalName: {
      label: 'Dale un nombre (opcional)',
      placeholder: 'ej: La compu',
      confirm: 'Listo',
      skip: 'Saltar',
      // {nombre} → the chosen/typed name, echoed as the user turn.
      userEcho: 'Le pongo: {nombre}',
      chips: { compu: 'La compu', viaje: 'Un viaje', colchon: 'Mi colchón financiero' },
    },
    // Greeting — 3 short bubbles (copy diet, decision #33). The 3rd interpolates
    // the user's REAL idle liquidity ({capacity} from savingsCapacity) so a judge
    // grasps the premise: "you leave money sitting; let it work."
    greeting: {
      hola: 'Hola {nombre} 👋 soy tu coach de roundai. Miré tus últimos 6 meses en Nimbo.',
      // {capacity} = formatARS(savingsCapacity(profile)) — interpolated, never hardcoded.
      premise:
        'Cada fin de mes te quedan ~{capacity} sin usar. Esa plata puede trabajar para vos.',
      pregunta:
        'Arranquemos con 3 preguntas: por regulación, tu perfil inversor lo definís vos.',
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
    // Confirms AND teaches the next step (iteration 3 — replaces the removed
    // judge cues). {margen} = formatPct(committed margin); {goalLabel} = goal name.
    activated:
      '✦ Listo: cada pago redondea {margen} a *{goalLabel}*. Probalo: volvé a la billetera y pagá el café.',
    // Heading above the post-activation suggested-question chips (iteration 3) —
    // judges shouldn't have to invent questions. Chips send the DEMO_PROMPTS on tap.
    suggestedQuestions: 'Probá preguntarme',
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
    // ── sheet v2 (spec decision #31) — the toggle IS the counterfactual ──
    roundupToggle: 'Redondeo roundai',
    toggleOffHint: 'sin redondeo, tu meta no avanza',
    // {perfil} = session risk — where the sweep is invested
    destination: 'va a tu FCI {perfil} · simulado',
    // {monto} = formatARS of the 12-month value of THIS sweep
    microProjection: 'este barrido valdría ~{monto} en 12 meses · simulado',
    // ── full-screen pay (iter 3) ──
    headerTitle: 'Pagar',
    totalLabel: 'total a debitar',
    back: 'Volver',
  },
  goal: {
    // ── v3 TEXT DIET ──
    // The goal's NAME is the screen title; labels below are ≤3 words. Numbers
    // carry the meaning, copy stays out of the way.
    accumulatedLabel: 'este mes · simulado',
    heroCaption: 'lo tuyo', // ring centre caption — the accumulated is "yours"
    remaining: 'te falta {monto}', // ≤3 words; the ring already says "for your goal"
    reached: '¡Llegaste! ✦',
    yield: 'tu plata rindió {monto} ✦ simulado',
    yieldLabel12m: 'rendiría en 12 meses ✦ simulado',
    // OLD pace line (kept for back-compat / tests). The v3 screen uses paceV3 +
    // the ETA anchor below instead — self-explanatory, no "¿qué significa?".
    pace: 'a este ritmo: {meses} meses',
    // v3 PACE, EXPLAINED — the "¿qué significa eso?" fix. {sweep} = ~monthly base
    // sweep (formatARS), {meses} = calculator-derived months. Reads as a full
    // sentence; the ETA month (computed in-component) is the emotional anchor.
    paceV3: 'con ~{sweep}/mes en redondeos, llegás en ~{meses} meses',
    paceArrived: 'ya llegaste a esta meta ✦', // remaining == 0
    etaPrefix: 'llegás en', // tiny label above the big ETA month
    // SURPRISE: after a payment lands, how many days closer this one coffee got
    // you. {dias} = whole days (computed in-component from the live sweep ÷ daily
    // rate). Singular/plural handled by picking the matching key.
    nudgeDays: 'tu café de hoy te acercó {dias} días ✦',
    nudgeDay: 'tu café de hoy te acercó 1 día ✦',
    sandbox: 'simulado',
    active: 'tu perfil',
    comingSoon: 'Tu meta, en breve.',
    // ── Multi-goal (#29) — quieter in v3 ──
    goalsTitle: 'Otras metas', // was "Tus metas" — the hero IS a meta; these are the rest
    activeBadge: 'activa', // ≤3 words; "recibe tus redondeos" was bloat next to the name
    simulatedBadge: 'simulada',
    activate: 'Activar',
    mockGoalLabel: 'Viaje a Bariloche',
    streak: '✦ 1 mes', // streak chip — quieter (was "✦ racha: 1 mes")
    // ── Tu cartera (holdings + composition by profile) — v3 merged block ──
    cartera: {
      title: 'Tu cartera',
      sub: 'según tu perfil · simulado', // composition is educational, clearly simulated
      // position figures (≤3 words each)
      aportado: 'aportado',
      rendimiento: 'rinde · simulado',
      total: 'total',
      projection: 'a 12 meses ~{monto} ✦ simulado', // conditional, never a promise
      // composition heading
      mixLabel: 'cómo se reparte',
      // generic CATEGORY names ONLY — NO instruments (compliance).
      cats: {
        mm: 'mercado de dinero',
        rf: 'renta fija',
        rv: 'renta variable',
      },
    },
    // Educational composition per risk level (hardcoded, generic categories,
    // "· simulado"). Percentages must sum to 100. NO named instruments.
    composition: {
      conservador: { mm: 80, rf: 15, rv: 5 },
      moderado: { mm: 55, rf: 30, rv: 15 },
      agresivo: { mm: 25, rf: 40, rv: 35 },
    },
    profileLabels: { conservador: 'Conservador', moderado: 'Moderado', agresivo: 'Agresivo' },
  },
  // Proposal v2 (decisions #25, #28, #33) — interpolated in src/lib/proposal.ts
  // from roundup.ts outputs ONLY (planGoal + trendOf). Tri-state, ≤2 lines per
  // bubble. Components never see these directly; they receive ready ChatMessages.
  proposal: {
    // (0) tendencies line — REAL data via trendOf(gastoHist) + trendOf(liquidez).
    //     {gasto}/{gastoPct}/{liqPct} pre-rendered in proposal.ts. Plain words,
    //     ≤2 lines: what you spend (drifting up) + that your leftover is growing.
    tendencies:
      'Gastás ~{gasto}/mes ({gastoPct}) y lo que te sobra a fin de mes viene creciendo ({liqPct}).',
    // direction verbs (criollo, ≤2 words) keyed by trendOf direction.
    trendVerb: { sube: 'suben suave', estable: 'están estables', baja: 'bajan' },
    trendVerbLiq: { sube: 'también sube', estable: 'está estable', baja: 'baja' },
    // (M) mechanism — taught BEFORE the proposal (iteration 3). {cafe} = café
    //     amount; {sweep} = sweepForPayment(café, default margin). The point a
    //     judge has to leave with: each purchase rounds an extra, no willpower.
    //     ≤2 lines.
    mechanism:
      'Cada compra redondea un extra a tu meta: un café de {cafe} → {sweep}, sin que lo pienses.',
    // (A) comodo — deadline met at the floored required margin. Pedagogical &
    //     ≤2 lines: need/month → {margen} IS both the margin AND that share of
    //     your spending (in comodo they're equal by construction — the chip token
    //     is {margen}, the only percent, so the split never collides).
    //     {goalLabel}/{amount}/{months}/{monthly}/{margen}/{capacity}
    comodo:
      'Para *{goalLabel}*: {amount} en {months} meses = {monthly}/mes, el {margen} de tu gasto. Te sigue sobrando ~{capacity}.',
    // (A') comodo, no deadline ('rendir'/'nose'): sustainable open-ended plan.
    //     {margen}/{monthly}/{capacity}
    comodoOpen:
      'Margen {margen}: ~{monthly}/mes hacia tu plata, dentro de los ~{capacity} que te sobran.',
    // (B) ajustado — capped at the risk-profile rate; deadline slips.
    //     {goalLabel}/{months}/{required}/{risk}/{margen}/{monthsAtMargin}
    ajustado:
      'Para *{goalLabel}* en {months} meses harían falta {required}/mes, más que el tope de tu perfil {risk}. A {margen} llegás en {monthsAtMargin} meses.',
    // (C) inviable — even full capacity misses the deadline; honest best timeline.
    //     {goalLabel}/{capacity}/{months}/{margen}/{monthsAtMargin}
    inviable:
      'Para *{goalLabel}*: ni usando todo tu sobrante ({capacity}/mes) llegás en {months}. A tu máximo ({margen}) son {monthsAtMargin} meses.',
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
  // Backdrop demo chrome (spec decision #32) — lives OUTSIDE the phone, never in
  // the product. Profile switcher + the one-word pulse-dot cue hints.
  demo: {
    // Profile switcher (querystring ?perfil=). Plain links → full reload = clean
    // session, so switching never carries stale state across.
    switcherLabel: 'perfil demo',
    profiles: { mati: 'Mati', lu: 'Lu', fede: 'Fede' },
    // Single-word cue labels beside the pulse-dot, by target.
    cueLabels: {
      tile: 'tocá',
      marginChip: 'tocá',
      pay: 'pagá',
      goalTab: 'mirá',
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
