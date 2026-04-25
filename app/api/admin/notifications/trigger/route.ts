import { NextResponse } from 'next/server'
import { requireAdmin } from '~/lib/auth/require-admin'

export const runtime = 'nodejs'

export async function POST() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Re-use the cron handler logic by calling it internally
  const secret = process.env.CRON_SECRET ?? ''
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.trixer.app'

  const res = await fetch(`${siteUrl}/api/cron/notifications`, {
    headers: { Authorization: `Bearer ${secret}` },
  })

  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
