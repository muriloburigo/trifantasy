import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '~/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  const leagueId = req.nextUrl.searchParams.get('league_id')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  const admin = createAdminClient()

  // Collect IDs to exclude: current user + existing members
  const excludeIds: string[] = [user.id]
  if (leagueId) {
    const { data: members } = await admin
      .from('league_members')
      .select('user_id')
      .eq('league_id', leagueId)
    for (const m of members ?? []) excludeIds.push(m.user_id)
  }

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, name, photo_url')
    .ilike('name', `%${q}%`)
    .not('id', 'in', `(${excludeIds.join(',')})`)
    .limit(8)

  return NextResponse.json(profiles ?? [])
}
