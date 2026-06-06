export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export function POST() {
  return Response.json({ todo: true })
}
