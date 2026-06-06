'use client'

// The live-chat hook (spec Task 5.4). Owns the POST to /api/chat, the streaming
// read, and the watchdog → fallback path so the judge NEVER sees a frozen chat.
//
// Wire contract (must match /api/chat exactly, or the route 400s):
//   { profileId, goal, marginFraction, messages: [...seedHistory, ...liveTurns] }
// The seed pair is alternation-safe (user→assistant) and always ends on the
// just-typed user turn — satisfying first-role=user / alternation / last=user.

import { useCallback, useEffect, useRef, type Dispatch } from 'react'
import type { AppState, Action } from '@/components/AppShell'
import type { ChatMessage } from '@/lib/chat-types'
import { profiles } from '@/data/profiles'
import { seedHistory } from '@/lib/proposal'
import { demoReplyFor } from '@/lib/demo-transcript'
import { MAX_HISTORY, SENTINEL } from '@/lib/config'

const FIRST_BYTE_TIMEOUT_MS = 6000 // no first byte by 6s → fallback
const FALLBACK_CHUNK_MS = 24 // local fake-stream cadence (matches server streamPlain)

/**
 * Drop the oldest live PAIRS until the wire history fits MAX_HISTORY, always
 * keeping the 2-message seed. Live turns alternate user/assistant, so dropping
 * two at a time preserves alternation; the result still ends on the user turn.
 */
function capHistory(seed: ChatMessage[], liveTurns: ChatMessage[]): ChatMessage[] {
  let live = liveTurns
  while (seed.length + live.length > MAX_HISTORY) {
    if (live.length <= 1) break // never drop below the final user turn
    live = live.slice(2) // drop the oldest user+assistant pair
  }
  return [...seed, ...live]
}

export function useChat(state: AppState, dispatch: Dispatch<Action>) {
  // Track the in-flight request so we can abort it on unmount (and only ever
  // run one send at a time). Held in a ref — never triggers a re-render.
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      if (state.goal == null || state.marginFraction == null) return

      const profile = profiles.find((p) => p.id === state.profileId)!
      const goal = state.goal
      const margin = state.marginFraction
      // Session risk declared via the quiz (decision #26); moderado fallback.
      const risk = state.sessionRisk ?? 'moderado'

      // Live turns = everything after the proposal-acceptance boundary, plus the
      // turn the user is sending now. liveStartIndex is captured at ACCEPT_PROPOSAL.
      const start = state.liveStartIndex >= 0 ? state.liveStartIndex : state.messages.length
      const priorLive = state.messages.slice(start)
      const userTurn: ChatMessage = { role: 'user', content: trimmed }
      const liveTurns = [...priorLive, userTurn]

      const seed = seedHistory(profile, goal, margin, risk)
      const wireMessages = capHistory(seed, liveTurns)

      // Optimistic UI: show the user turn + the typing indicator immediately.
      dispatch({ type: 'PUSH_MESSAGE', message: userTurn })
      dispatch({ type: 'SET_STATUS', status: 'typing' })

      // The canned reply used by EVERY fallback branch — derived for THIS profile
      // at the COMMITTED margin (decision #34).
      const fallbackReply = () => demoReplyFor(profile, margin, wireMessages)

      const controller = new AbortController()
      abortRef.current?.abort()
      abortRef.current = controller

      // Watchdog: if no first byte lands in 6s, abort and fall back.
      let firstByteSeen = false
      const watchdog = setTimeout(() => {
        if (!firstByteSeen) controller.abort()
      }, FIRST_BYTE_TIMEOUT_MS)

      // Tracks whether we've opened the assistant bubble yet, so a fallback after
      // the first byte reuses the SAME bubble (no double bubble).
      let assistantStarted = false

      const startAssistant = () => {
        if (assistantStarted) return
        assistantStarted = true
        dispatch({ type: 'SET_STATUS', status: 'streaming' })
        dispatch({ type: 'PUSH_MESSAGE', message: { role: 'assistant', content: '' } })
      }

      // Locally fake-stream the canned reply word-by-word into the assistant
      // bubble (fresh one if none started yet).
      const runFallback = async () => {
        dispatch({ type: 'SET_STATUS', status: 'fallback' })
        startAssistant()
        const reply = fallbackReply()
        for (const word of reply.split(/(?<=\s)/)) {
          if (controller.signal.aborted && !firstByteSeen) {
            // aborted by the watchdog — keep streaming the fallback regardless;
            // the abort only killed the (dead) fetch, not the fallback.
          }
          dispatch({ type: 'APPEND_DELTA', delta: word })
          await new Promise((r) => setTimeout(r, FALLBACK_CHUNK_MS))
        }
        dispatch({ type: 'SET_STATUS', status: 'idle' })
      }

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            profileId: state.profileId,
            goal,
            marginFraction: margin,
            risk, // quiz-declared session risk (decision #26) — server whitelists it
            messages: wireMessages,
          }),
        })

        if (!res.ok || !res.body) {
          clearTimeout(watchdog)
          await runFallback()
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          if (!chunk) continue

          // Sentinel = server hit an error mid/pre-stream → switch to fallback.
          if (chunk.includes(SENTINEL)) {
            firstByteSeen = true // we got a (bad) byte; don't let the watchdog re-fire
            clearTimeout(watchdog)
            // Strip the sentinel; if there was real text before it, keep that.
            const visible = chunk.split(SENTINEL).join('')
            if (visible) {
              startAssistant()
              dispatch({ type: 'APPEND_DELTA', delta: visible })
            }
            await runFallback()
            return
          }

          if (!firstByteSeen) {
            firstByteSeen = true
            clearTimeout(watchdog)
          }
          startAssistant()
          dispatch({ type: 'APPEND_DELTA', delta: chunk })
        }

        clearTimeout(watchdog)
        // Stream ended with no bytes at all (e.g. empty body) → fallback.
        if (!assistantStarted) {
          await runFallback()
          return
        }
        dispatch({ type: 'SET_STATUS', status: 'idle' })
      } catch {
        // fetch rejected OR aborted by the watchdog → fallback (still streams).
        clearTimeout(watchdog)
        await runFallback()
      }
    },
    [state.profileId, state.goal, state.marginFraction, state.sessionRisk, state.messages, state.liveStartIndex, dispatch],
  )

  return { sendMessage }
}
