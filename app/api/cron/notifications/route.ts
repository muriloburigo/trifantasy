import { NextRequest, NextResponse } from 'next/server'
import { processNotifications } from '~/lib/notifications-engine'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function auth(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  return secret === process.env.CRON_SECRET
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await processNotifications()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[Cron] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
