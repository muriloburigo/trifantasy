import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '~/lib/supabase/server'
import { scrapeUrl } from '~/lib/scrapers'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { url?: string; type?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }) }

  const { url, type } = body
  if (!url || !type || !['startlist', 'results'].includes(type)) {
    return NextResponse.json({ error: 'url e type (startlist|results) são obrigatórios' }, { status: 400 })
  }

  const result = await scrapeUrl(url, type as 'startlist' | 'results')
  return NextResponse.json(result)
}
