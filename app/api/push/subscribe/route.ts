import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '~/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const endpoint: string = body.endpoint
  const p256dh: string = body.keys?.p256dh
  const auth: string = body.keys?.auth

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  const admin = createAdminClient()
  await admin.from('push_subscriptions').upsert(
    { user_id: user.id, endpoint, p256dh, auth },
    { onConflict: 'endpoint' }
  )

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = await req.json()
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })

  const admin = createAdminClient()
  await admin.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
