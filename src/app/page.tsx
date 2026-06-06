import { PhoneFrame } from '@/components/phone/PhoneFrame'
import { AppShell } from '@/components/AppShell'

// The browser canvas AROUND the phone — the only place (with the RoundaiTile)
// where the roundai brand appears in Phase 1. Deep green field with atmosphere:
// a soft gradient mesh + faint grain so it reads as a designed surface, not a
// flat fill. The wordmark + pitch line sit in a corner, deliberately NOT
// competing with the device.

export default function Home() {
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
        <p className="mt-2 font-display text-[clamp(13px,1.2vw,16px)] font-medium leading-snug text-cream/70">
          el copiloto financiero embebido en tu billetera
        </p>
      </div>

      {/* the device */}
      <PhoneFrame>
        <AppShell />
      </PhoneFrame>

      {/* footer hairline — quiet B2B framing, bottom-right */}
      <div className="pointer-events-none absolute bottom-[clamp(16px,3vh,40px)] right-[clamp(20px,4vw,64px)] z-10 hidden text-right sm:block">
        <p className="font-display text-[11px] font-medium uppercase tracking-[0.22em] text-cream/35">
          la capa que las billeteras enchufan
        </p>
      </div>
    </main>
  )
}
