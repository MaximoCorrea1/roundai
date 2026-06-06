import type { ReactNode } from 'react'
import { StatusBar } from './StatusBar'

// iPhone 15-class device shell. The SCREEN content area is exactly 393×852 px.
// A CSS-only scaler (--phone-scale, defined in globals.css) shrinks the whole
// frame so it always fits the viewport with ~24px margin — 852px is taller than
// a 720p projector, so the height is usually the binding constraint. No JS, no
// resize listeners; transform-origin is centre so it stays put on the backdrop.

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative shrink-0"
      style={{
        transform: 'scale(var(--phone-scale))',
        transformOrigin: 'center center',
      }}
    >
      {/* Outer titanium frame edge */}
      <div
        className="relative bg-[#1b1d22] p-[12px] shadow-[var(--shadow-phone)]"
        style={{ borderRadius: 'var(--radius-phone)' }}
      >
        {/* subtle edge highlight so it reads as brushed metal, not a flat block */}
        <div
          className="pointer-events-none absolute inset-0 z-30"
          style={{
            borderRadius: 'var(--radius-phone)',
            boxShadow:
              'inset 0 0 0 2px rgba(255,255,255,0.06), inset 0 1px 1px rgba(255,255,255,0.18)',
          }}
        />

        {/* The screen — exactly 393×852, clips everything inside it */}
        <div
          className="relative overflow-hidden bg-nimbo-bg"
          style={{
            width: 'var(--phone-w)',
            height: 'var(--phone-h)',
            borderRadius: 'calc(var(--radius-phone) - 12px)',
          }}
        >
          {/* App content layer (screens slide within this in later phases) */}
          <div className="absolute inset-0">{children}</div>

          {/* Status bar — above app content, below the island */}
          <StatusBar />

          {/* Dynamic island — centred pill, sits over the status-bar gap */}
          <div
            className="pointer-events-none absolute left-1/2 top-[11px] z-30 h-[34px] w-[124px] -translate-x-1/2 rounded-full bg-black"
            aria-hidden="true"
          >
            {/* camera dot, faint, on the right of the island */}
            <span className="absolute right-[12px] top-1/2 h-[9px] w-[9px] -translate-y-1/2 rounded-full bg-[#0c1418] ring-1 ring-white/5" />
          </div>

          {/* Home indicator — centred pill at the bottom */}
          <div
            className="pointer-events-none absolute bottom-[9px] left-1/2 z-30 h-[5px] w-[140px] -translate-x-1/2 rounded-full bg-ink/30"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  )
}
