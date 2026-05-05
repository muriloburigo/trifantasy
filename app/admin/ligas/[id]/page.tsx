import { requireAdmin } from '~/lib/auth/require-admin'
import { createAdminClient } from '~/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { EditLeagueForm } from './_components/EditLeagueForm'
import { MembersManager } from './_components/MembersManager'

export default async function AdminEditLigaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const sb = createAdminClient()

  const [{ data: league }, { data: members }, { data: allUsers }] = await Promise.all([
    sb.from('leagues').select('*').eq('id', id).single(),
    sb
      .from('league_members')
      .select('user_id, joined_at')
      .eq('league_id', id)
      .order('joined_at', { ascending: false }),
    sb.from('profiles').select('id, name, photo_url').order('name'),
  ])

  if (!league) notFound()

  const memberIds = new Set(members?.map((m) => m.user_id) ?? [])
  const enrichedMembers = (members ?? []).map((m) => ({
    ...m,
    profile: allUsers?.find((u) => u.id === m.user_id) ?? null,
  }))
  const nonMembers = (allUsers ?? []).filter((u) => !memberIds.has(u.id))

  return (
    <div className="space-y-5 text-white px-4 sm:px-0 py-2 max-w-4xl">
      <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <Link href="/admin/ligas" className="hover:text-white transition-colors">← Ligas</Link>
        <span>/</span>
        <span className="text-white font-medium">{league.name}</span>
      </div>

      <EditLeagueForm league={league} />
      <MembersManager leagueId={league.id} members={enrichedMembers} nonMembers={nonMembers} />
    </div>
  )
}
