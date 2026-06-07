'use client'

import { useEffect, useRef, useState, type Dispatch } from 'react'
import type { Action } from '@/components/AppShell'
import type { RiskProfile } from '@/lib/roundup'
import { strings } from '@/data/strings'

// The investor-profile quiz (decision #26 — REGULATORY, never AI-inferred). Three
// chip questions, one coach bubble each; the chips advance. Majority of C/M/A
// answers → riskProfile (tie → moderado). The result is a chip-style coach bubble
// "Tu perfil: {Moderado} ✦" + a one-line meaning, then SET_RISK advances the
// flow to goalSelect.
//
// SELF-CONTAINED: this component owns the quiz sequence end-to-end (question
// index, answers, the typing pauses, pushing the question/answer/result bubbles),
// mirroring the greeting effect's strict-mode-safe timer discipline. ChatScreen
// just renders <QuizStep> while chatPhase === 'quiz'.

type Letter = 'c' | 'm' | 'a'
const LETTER_TO_RISK: Record<Letter, RiskProfile> = {
  c: 'conservador',
  m: 'moderado',
  a: 'agresivo',
}

const Q_KEYS = ['q1', 'q2', 'q3'] as const
const STEP = 480 // ms typing pause before each pushed bubble

/** Majority of answers → risk; ties resolve to moderado (decision #26). */
export function riskFromAnswers(answers: Letter[]): RiskProfile {
  const tally: Record<Letter, number> = { c: 0, m: 0, a: 0 }
  for (const a of answers) tally[a] += 1
  const max = Math.max(tally.c, tally.m, tally.a)
  // tie → moderado: only return c or a when they are the SOLE maximum.
  if (tally.m === max) return 'moderado'
  if (tally.c === max && tally.a < max) return 'conservador'
  if (tally.a === max && tally.c < max) return 'agresivo'
  return 'moderado'
}

export function QuizStep({ dispatch }: { dispatch: Dispatch<Action> }) {
  const q = strings.onboarding.quiz
  // step = index of the question whose CHIPS are currently shown (0..2).
  // -1 means the question bubble hasn't landed yet; chips are hidden mid-typing.
  const [step, setStep] = useState(0)
  const [chipsReady, setChipsReady] = useState(false)
  const answersRef = useRef<Letter[]>([])
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  function clearTimers() {
    for (const id of timers.current) clearTimeout(id)
    timers.current = []
  }

  // Push the question bubble for the current step with a typing pause, then
  // reveal its chips. Re-runs whenever `step` advances. Strict-mode-safe.
  useEffect(() => {
    if (step < 0 || step >= Q_KEYS.length) return
    setChipsReady(false)
    clearTimers()
    timers.current.push(
      setTimeout(() => dispatch({ type: 'SET_STATUS', status: 'typing' }), 0),
    )
    timers.current.push(
      setTimeout(() => {
        const prompt = q[Q_KEYS[step]].prompt
        dispatch({ type: 'PUSH_MESSAGE', message: { role: 'assistant', content: prompt } })
        dispatch({ type: 'SET_STATUS', status: 'idle' })
        setChipsReady(true)
      }, STEP),
    )
    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  function answer(letter: Letter) {
    if (!chipsReady) return
    const key = Q_KEYS[step]
    const label = q[key][letter]
    dispatch({ type: 'PUSH_MESSAGE', message: { role: 'user', content: label } })
    const answers = [...answersRef.current, letter]
    answersRef.current = answers

    if (step < Q_KEYS.length - 1) {
      setStep(step + 1)
      return
    }

    // Final answer → compute the profile and reveal the result bubble.
    setChipsReady(false)
    const risk = riskFromAnswers(answers)
    const label2 = q.labels[risk]
    const resultText = `${q.result.replace('{perfil}', label2)} ${q.meaning[risk]}`
    clearTimers()
    timers.current.push(
      setTimeout(() => dispatch({ type: 'SET_STATUS', status: 'typing' }), 0),
    )
    timers.current.push(
      setTimeout(() => {
        dispatch({ type: 'PUSH_MESSAGE', message: { role: 'assistant', content: resultText } })
        dispatch({ type: 'SET_STATUS', status: 'idle' })
        // SET_RISK advances chatPhase to goalSelect (reducer).
        dispatch({ type: 'SET_RISK', risk })
      }, STEP),
    )
  }

  // Only render chips for the currently-shown, landed question.
  if (step < 0 || step >= Q_KEYS.length || !chipsReady) return null
  const key = Q_KEYS[step]

  return (
    <div className="flex w-full flex-col gap-2 pt-1">
      {(['c', 'm', 'a'] as Letter[]).map((letter) => (
        <button
          key={letter}
          type="button"
          onClick={() => answer(letter)}
          className="group flex items-center gap-2.5 rounded-[14px] bg-roundai-green/[0.04] px-3.5 py-3 text-left text-[16.5px] font-medium text-roundai-green ring-1 ring-roundai-green/[0.10] transition-all active:scale-[0.99] active:bg-roundai-green/[0.08]"
        >
          <span
            aria-hidden="true"
            className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-lime/30 text-[12.5px] font-semibold text-roundai-green"
          >
            {letter.toUpperCase()}
          </span>
          <span className="flex-1">{q[key][letter]}</span>
        </button>
      ))}
    </div>
  )
}
