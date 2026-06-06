import Anthropic from '@anthropic-ai/sdk'
import { MODEL } from '@/lib/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const client = new Anthropic() // reads ANTHROPIC_API_KEY server-side

export async function GET(req: Request) {
  const base = {
    ok: true,
    model: MODEL,
    demoMode: process.env.DEMO_MODE === '1',
    keyPresent: Boolean(process.env.ANTHROPIC_API_KEY),
  }

  // ?ping=1 → a 1-token live call that also pre-warms the serverless function +
  // the Anthropic connection. Wrapped in try/catch so a missing/invalid key (or
  // any API error) reports live:false without ever failing the health check.
  if (new URL(req.url).searchParams.get('ping') === '1') {
    let live = false
    try {
      await client.messages.create({
        model: MODEL,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'ping' }],
      })
      live = true
    } catch {
      live = false
    }
    return Response.json({ ...base, live })
  }

  return Response.json(base)
}
