import { PhoneFrame } from '@/components/phone/PhoneFrame'
import { AppShell } from '@/components/AppShell'
import { ACTIVE_PROFILE_ID } from '@/data/profiles'
import { strings } from '@/data/strings'

// The browser canvas AROUND the phone — the only place (with the RoundaiTile)
// where the roundai brand appears in Phase 1. Deep green field with atmosphere:
// a soft gradient mesh + faint grain so it reads as a designed surface, not a
// flat fill. The wordmark + pitch line sit in a corner, deliberately NOT
// competing with the device.
//
// This is also the demo-chrome layer (spec decision #32): a querystring profile
// switcher (?perfil=mati|lu|fede). It's read server-side here and threaded into
// AppShell — switching is a plain <a> reload, so every switch = a clean session
// with zero state plumbing.

const PROFILE_IDS = ['mati', 'lu', 'fede'] as const
type ProfileId = (typeof PROFILE_IDS)[number]

/** Whitelist the ?perfil= value; anything off-list falls back to the locked default. */
function resolveProfileId(raw: string | string[] | undefined): ProfileId {
  const v = Array.isArray(raw) ? raw[0] : raw
  return (PROFILE_IDS as readonly string[]).includes(v ?? '')
    ? (v as ProfileId)
    : (ACTIVE_PROFILE_ID as ProfileId)
}

export default async function Home({
  searchParams,
}: {
  // Next 16: searchParams is async.
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const profileId = resolveProfileId(sp.perfil)

  const profileHref = (id: ProfileId) => `/?perfil=${id}`

  const d = strings.demo

  return (
    <main className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-roundai-green-deep">
      {/* gradient mesh — warm green glow upper-left, lime hint lower-right */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 18% 8%, #12513c 0%, #0b3d2e 42%, #072a20 100%),' +
            'radial-gradient(60% 50% at 88% 96%, rgba(200,245,96,0.10) 0%, rgba(200,245,96,0) 60%)',
        }}
      />
      {/* faint grain overlay for texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* brand corner — top-left, restrained */}
      <div className="pointer-events-none absolute left-[clamp(20px,4vw,64px)] top-[clamp(20px,4vh,48px)] z-10 max-w-[min(38ch,42vw)]">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[clamp(22px,2.4vw,30px)] font-semibold lowercase tracking-tight text-cream">
            roundai
          </span>
          <span
            aria-hidden="true"
            className="text-[clamp(15px,1.6vw,20px)] text-lime"
          >
            ✦
          </span>
        </div>
        <p className="mt-2 font-display text-[clamp(14px,1.3vw,17px)] font-medium leading-snug text-cream/85">
          el copiloto financiero embebido en tu billetera
        </p>
      </div>

      {/* the device — re-keyed on profileId so a switch fully remounts the shell */}
      <PhoneFrame>
        <AppShell key={profileId} profileId={profileId} />
      </PhoneFrame>

      {/* demo chrome — profile switcher (bottom-left, quiet, clearly NOT product).
          Plain <a> links so a switch is a full reload = clean session. */}
      <nav
        aria-label={d.switcherLabel}
        className="absolute bottom-[clamp(16px,3vh,40px)] left-[clamp(20px,4vw,64px)] z-10 hidden sm:block"
      >
        <p className="mb-1.5 font-display text-[10px] font-medium uppercase tracking-[0.18em] text-cream/35">
          {d.switcherLabel}
        </p>
        <div className="inline-flex items-center gap-1 rounded-full bg-roundai-green-soft/40 p-1 ring-1 ring-cream/[0.06] backdrop-blur-sm">
          {PROFILE_IDS.map((id) => {
            const current = id === profileId
            return (
              <a
                key={id}
                href={profileHref(id)}
                aria-current={current ? 'page' : undefined}
                className={
                  'rounded-full px-3 py-1 text-[13px] font-semibold transition-colors ' +
                  (current
                    ? 'bg-lime text-roundai-green-deep'
                    : 'text-cream/65 hover:text-cream/90')
                }
              >
                {d.profiles[id]}
              </a>
            )
          })}
        </div>
      </nav>

      {/* footer hairline — quiet B2B framing, bottom-right */}
      <div className="pointer-events-none absolute bottom-[clamp(16px,3vh,40px)] right-[clamp(20px,4vw,64px)] z-10 hidden text-right sm:block">
        <p className="font-display text-[11px] font-medium uppercase tracking-[0.22em] text-cream/35">
          la capa que las billeteras enchufan
        </p>
      </div>
    </main>
  )
}
