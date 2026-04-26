import { NextResponse } from 'next/server'
import { requireAdmin } from '~/lib/auth/require-admin'
import { processNotifications } from '~/lib/notifications-engine'

export const runtime = 'nodejs'

export async function POST() {
  try {
    await requireAdmin()
    const result = await processNotifications()
    return NextResponse.json(result)
  } catch (error: any) {
    // If it's a redirect error from requireAdmin, Next.js handles it.
    // If it's another error, return a clean JSON error.
    if (error.digest?.includes('NEXT_REDIRECT')) throw error
    
    console.error('[Admin Trigger] Error:', error)
    return NextResponse.json({ error: error.message || 'Erro ao disparar notificações' }, { status: 500 })
  }
}
