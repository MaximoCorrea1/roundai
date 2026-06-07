'use client'

// THE embedded-thesis cue. Everything else on this screen is a tidy, neutral
// neobank; this single element is the roundai layer dropped INTO it — deep green
// field, warm cream type, one lime ✦, a slow breathing glow. The contrast is the
// B2B pitch made visible. Never recolour the green field or the ✦.

export function RoundaiTile({
  title,
  poweredBy,
  cta,
  onOpenRoundai,
}: {
  title: string
  poweredBy: string
  cta: string
  onOpenRoundai?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpenRoundai}
      aria-label={`${title} · ${poweredBy}`}
      className="roundai-tile relative block w-full cursor-pointer overflow-hidden bg-roundai-green text-left transition-transform duration-200 active:scale-[0.985]"
      style={{ borderRadius: 'var(--radius-lg)' }}
    >
      {/* atmosphere inside the green field — soft glow + lime hint, mirrors the backdrop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 130% at 88% -10%, #12513c 0%, #0b3d2e 55%),' +
            'radial-gradient(70% 80% at 102% 110%, rgba(200,245,96,0.16) 0%, rgba(200,245,96,0) 60%)',
        }}
      />
      {/* faint inner hairline so the tile reads as a raised, distinct surface */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'inset 0 0 0 1px rgba(200,245,96,0.14)',
        }}
      />

      <div className="relative flex items-center gap-3.5 p-4">
        {/* the ✦ sweep glyph — lime on a soft lime-tinted disc, gently glinting */}
        <span
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl"
          style={{ background: 'rgba(200,245,96,0.12)' }}
          aria-hidden="true"
        >
          <span className="roundai-glint font-display text-[26px] leading-none text-lime">
            ✦
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <span className="block font-display text-[19px] font-bold leading-tight tracking-tight text-cream">
            {title}
          </span>
          <span className="block text-[12.5px] font-semibold lowercase leading-tight text-lime">
            {poweredBy}
          </span>
          <p className="mt-1 text-[14px] font-medium leading-snug text-cream/85">{cta}</p>
        </div>

        {/* chevron — invites the tap */}
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cream/10 text-lime">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M5 3l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </button>
  )
}
