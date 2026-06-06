import { MODEL } from '@/lib/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export function GET() {
  return Response.json({
    ok: true,
    model: MODEL,
    demoMode: process.env.DEMO_MODE === '1',
    keyPresent: Boolean(process.env.ANTHROPIC_API_KEY),
  })
}
