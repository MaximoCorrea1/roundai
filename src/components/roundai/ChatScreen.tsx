'use client'

import type { Dispatch } from 'react'
import type { AppState, Action } from '@/components/AppShell'

// The roundai miniapp surface — a visibly different world from Nimbo: warm cream
// background, deep-green chrome, one lime accent. Full chat UI lands in Task 2.2;
// this shell wires the slide-in and the back affordance for Task 2.1.

export function ChatScreen({
  state,
  dispatch,
}: {
  state: AppState
  dispatch: Dispatch<Action>
  active: boolean
}) {
  void state
  return (
    <div className="flex h-full w-full flex-col bg-cream">
      <div className="flex shrink-0 items-center gap-2 px-4 pt-[58px] pb-3">
        <button
          type="button"
          onClick={() => dispatch({ type: 'BACK_TO_WALLET' })}
          aria-label="Volver a la billetera"
          className="grid h-9 w-9 place-items-center rounded-full bg-roundai-green/5 text-roundai-green"
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
        <span className="font-display text-[18px] font-semibold lowercase tracking-tight text-roundai-green">
          roundai
        </span>
        <span aria-hidden="true" className="text-lime-deep">
          ✦
        </span>
      </div>
      <div className="flex-1" />
    </div>
  )
}
