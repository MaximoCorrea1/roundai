import Anthropic from '@anthropic-ai/sdk'
import { profiles } from '@/data/profiles'
import { buildSystemPrompt } from '@/lib/coach'
import { computeOptimalMargin, isSustainable, clampMargin } from '@/lib/roundup'
import { MODEL, MAX_TOKENS, MAX_HISTORY, MAX_TOTAL_CHARS, SENTINEL } from '@/lib/config'
import { demoReplyFor } from '@/lib/demo-transcript'
import type { Goal } from '@/lib/chat-types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const client = new Anthropic() // reads ANTHROPIC_API_KEY server-side

type Msg = { role: 'user' | 'assistant'; content: string }

// The Anthropic API 400s on: first message not 'user', consecutive same-role turns,
// and (on Sonnet 4.6) a trailing assistant turn (prefill). Reject all of it here —
// otherwise a malformed seed silently pushes every live call into the fallback.
function historyError(messages: unknown): string | null {
  if (!Array.isArray(messages) || messages.length === 0) return 'empty history'
  if (messages.length > MAX_HISTORY) return 'history too long'
  let total = 0
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i] as Msg
    if ((m?.role !== 'user' && m?.role !== 'assistant') || typeof m?.content !== 'string')
      return 'bad message shape'
    if (i > 0 && (messages[i - 1] as Msg).role === m.role) return 'roles must alternate'
    total += m.content.length
  }
  if ((messages[0] as Msg).role !== 'user') return 'first message must be user'
  if ((messages[messages.length - 1] as Msg).role !== 'user') return 'last message must be user'
  if (total > MAX_TOTAL_CHARS) return 'history too large'
  return null
}

export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null)
  const b = (body ?? {}) as {
    profileId?: unknown
    messages?: unknown
    marginFraction?: unknown
    goal?: unknown
  }

  const profile = profiles.find((p) => p.id === b.profileId)
  if (!profile) return Response.json({ error: 'unknown profile' }, { status: 400 })

  const invalid = historyError(b.messages)
  if (invalid) return Response.json({ error: invalid }, { status: 400 })
  const messages = b.messages as Msg[]

  // Never trust client math: re-validate the agreed margin, else recompute.
  let margin: number
  try {
    margin = clampMargin(Number(b.marginFraction))
  } catch {
    margin = computeOptimalMargin(profile)
  }
  if (!isSustainable(profile, margin)) margin = computeOptimalMargin(profile)

  // Pass the validated, committed margin (decision #34) so canned answers cite
  // exactly what the user consented to.
  if (process.env.DEMO_MODE === '1') return streamPlain(demoReplyFor(profile, margin, messages))

  const goal = (b.goal ?? null) as Goal | null
  const system = buildSystemPrompt(profile, goal, margin)
  const encoder = new TextEncoder()
  return new Response(
    new ReadableStream({
      async start(controller) {
        try {
          // created INSIDE the try: auth/rate-limit failures become a clean
          // sentinel + close (client falls back) — never a hung reader
          const stream = client.messages.stream({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
          })
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta')
              controller.enqueue(encoder.encode(event.delta.text))
          }
        } catch {
          controller.enqueue(encoder.encode(SENTINEL)) // client switches to canned fallback
        } finally {
          controller.close() // never leave the reader hanging
        }
      },
    }),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } },
  )
}

function streamPlain(text: string): Response {
  const encoder = new TextEncoder()
  return new Response(
    new ReadableStream({
      async start(controller) {
        for (const word of text.split(/(?<=\s)/)) {
          controller.enqueue(encoder.encode(word))
          await new Promise((r) => setTimeout(r, 24)) // believable typing cadence
        }
        controller.close()
      },
    }),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } },
  )
}
