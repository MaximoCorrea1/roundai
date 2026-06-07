'use client'

import type { Dispatch } from 'react'
import type { AppState, Action } from '@/components/AppShell'
import { strings } from '@/data/strings'

// The miniapp chrome — and the boundary between the two worlds. A deep-green bar
// sits at the top of the cream surface: back chevron (returns to Nimbo), the
// lowercase roundai wordmark + lime ✦ in the display face, the always-visible
// compliance disclaimer chip, and the segmented Coach | Mi meta control. The
// "Mi meta" tab stays dimmed and inert until a margin is accepted
// (marginFraction != null) — no tooltip, just a clearly disabled affordance.

export function MiniappHeader({
  state,
  dispatch,
}: {
  state: AppState
  dispatch: Dispatch<Action>
}) {
  const goalEnabled = state.marginFraction != null
  const m = strings.miniapp

  return (
    <header className="relative shrink-0 bg-roundai-green pt-[52px]">
      {/* atmosphere: a faint lime glow upper-right so the green field has depth */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(80% 120% at 100% -20%, rgba(200,245,96,0.12) 0%, rgba(200,245,96,0) 55%)',
        }}
      />

      <div className="relative px-3.5 pb-3">
        {/* top row: back · wordmark · disclaimer */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => dispatch({ type: 'BACK_TO_WALLET' })}
            aria-label={strings.a11y.backToWallet}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream/10 text-cream transition-colors active:bg-cream/[0.18]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M10 3 5 8l5 5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="flex flex-1 items-baseline gap-1.5">
            <span className="font-display text-[19px] font-semibold lowercase tracking-tight text-cream">
              {m.title}
            </span>
            <span aria-hidden="true" className="text-[14px] text-lime">
              ✦
            </span>
          </div>

          {/* persistent compliance chip — small, quiet, always visible */}
          <span className="shrink-0 rounded-full bg-cream/[0.08] px-2.5 py-1 text-[9.5px] font-medium leading-tight text-cream/55 ring-1 ring-cream/[0.08]">
            {m.disclaimer}
          </span>
        </div>

        {/* segmented tabs */}
        <div className="mt-3 flex gap-1 rounded-full bg-roundai-green-deep/40 p-1">
          <Tab
            label={m.tabs.chat}
            active={state.view === 'chat'}
            enabled
            onClick={() => dispatch({ type: 'SWITCH_VIEW', view: 'chat' })}
          />
          <div className="flex flex-1">
            <Tab
              label={m.tabs.goal}
              active={state.view === 'goal'}
              enabled={goalEnabled}
              onClick={() => goalEnabled && dispatch({ type: 'SWITCH_VIEW', view: 'goal' })}
            />
          </div>
        </div>
      </div>
    </header>
  )
}

function Tab({
  label,
  active,
  enabled,
  onClick,
}: {
  label: string
  active: boolean
  enabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      aria-disabled={!enabled}
      className={
        'flex-1 rounded-full py-1.5 text-[12.5px] font-semibold transition-all ' +
        (active
          ? 'bg-lime text-roundai-green-deep shadow-[0_2px_8px_-4px_rgba(0,0,0,0.4)]'
          : enabled
            ? 'text-cream/70 active:text-cream'
            : 'cursor-not-allowed text-cream/25')
      }
    >
      {label}
    </button>
  )
}
