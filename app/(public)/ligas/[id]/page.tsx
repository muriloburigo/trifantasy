import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '~/lib/supabase/server'
import { Trophy, Users, Medal, Globe, Lock } from 'lucide-react'
import CopyButton from './CopyButton'
import AddMemberForm from './AddMemberForm'
import BackLink from '~/app/components/BackLink'

export const revalidate = 0

export default async function LeaguePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: league } = await supabase
    .from('leagues')
    .select('id, name, invite_code, owner_id, is_public')
    .eq('id', id)
    .single()

  if (!league) notFound()

  // Check membership
  const { data: membership } = await supabase
    .from('league_members')
    .select('user_id')
    .eq('league_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  // Non-members can only see public leagues (not ranked)
  const isMember = !!membership
  const isOwner = league.owner_id === user.id

  if (!isMember && !league.is_public) redirect('/ligas')

  // Fetch all members with their total scores across all races
  const { data: members } = await supabase
    .from('league_members')
    .select(`
      user_id, joined_at,
      profile:profiles(name)
    `)
    .eq('league_id', id)

  // For each member, sum all their team scores
  const memberIds = (members ?? []).map((m: any) => m.user_id)

  // Fetch teams for all members
  const { data: memberTeams } = memberIds.length > 0
    ? await supabase
        .from('teams')
        .select('id, user_id')
        .in('user_id', memberIds)
    : { data: [] }

  const teamIds = (memberTeams ?? []).map((t: any) => t.id)

  // Fetch scores with race info
  const { data: allScores } = teamIds.length > 0
    ? await supabase
        .from('scores')
        .select('total_points, team_id, race_id, race:races(name, slug)')
        .in('team_id', teamIds)
    : { data: [] }

  const teamMap = new Map((memberTeams ?? []).map((t: any) => [t.id, t]))

  // Aggregate scores per user
  const scoresByUser: Record<string, { total: number; races: { name: string; slug: string; pts: number }[] }> = {}
  for (const score of allScores ?? []) {
    const team = teamMap.get((score as any).team_id)
    if (!team) continue
    const uid = team.user_id
    if (!scoresByUser[uid]) scoresByUser[uid] = { total: 0, races: [] }
    scoresByUser[uid].total += Number(score.total_points ?? 0)
    scoresByUser[uid].races.push({
      name: (score as any).race?.name ?? '—',
      slug: (score as any).race?.slug ?? '',
      pts: Number(score.total_points ?? 0),
    })
  }

  const ranked = (members ?? [])
    .map((m: any) => ({
      ...m,
      total: scoresByUser[m.user_id]?.total ?? null,
      races: scoresByUser[m.user_id]?.races ?? [],
    }))
    .sort((a: any, b: any) => {
      if (a.total === null && b.total === null) return 0
      if (a.total === null) return 1
      if (b.total === null) return -1
      return b.total - a.total
    })

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <BackLink href="/ligas" />
      <div className="flex items-start justify-between mt-3 gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {league.is_public
              ? <Globe size={13} className="text-[var(--color-muted)]" />
              : <Lock size={13} className="text-[var(--color-muted)]" />}
            <span className="text-xs text-[var(--color-muted)]">{league.is_public ? 'Liga pública' : 'Liga privada'}</span>
          </div>
          <h1 className="text-2xl font-bold">{league.name}</h1>
          <p className="text-sm text-[var(--color-muted)] mt-0.5 flex items-center gap-1">
            <Users size={12} />{ranked.length} participante{ranked.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-xs text-[var(--color-muted)] text-right">
            <p className="mb-0.5">Código de convite</p>
            <span className="font-mono text-sm text-white font-semibold">{league.invite_code}</span>
          </div>
          <CopyButton code={league.invite_code} />
        </div>
      </div>

      {/* Join button for non-members of public league */}
      {!isMember && league.is_public && (
        <form action={`/api/ligas/${id}/join`} method="POST" className="mb-6">
          <Link
            href={`/ligas/${id}/entrar`}
            className="inline-flex items-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            Participar desta liga
          </Link>
        </form>
      )}

      {/* Ranking */}
      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden mb-6">
        <div className="p-4 border-b border-[var(--color-navy-border)] flex items-center gap-2">
          <Trophy size={16} className="text-[var(--color-orange)]" />
          <h2 className="font-bold">Ranking Acumulado</h2>
          <span className="text-xs text-[var(--color-muted)] ml-auto">pontos de todas as provas</span>
        </div>

        {ranked.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-muted)] text-sm">Nenhum membro ainda.</div>
        ) : (
          <div className="divide-y divide-[var(--color-navy-border)]">
            {ranked.map((member: any, i: number) => {
              const isMe = member.user_id === user.id
              return (
                <div
                  key={member.user_id}
                  className={`px-4 py-3 flex items-center gap-4 ${isMe ? 'bg-[var(--color-orange-dim)]' : ''}`}
                >
                  {/* Position */}
                  <div className="w-7 text-center shrink-0">
                    {i === 0 ? <Medal size={17} className="text-yellow-400 mx-auto" />
                      : i === 1 ? <Medal size={17} className="text-gray-400 mx-auto" />
                      : i === 2 ? <Medal size={17} className="text-amber-600 mx-auto" />
                      : <span className="text-sm text-[var(--color-muted)]">{i + 1}</span>}
                  </div>

                  {/* Name + races */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">
                      {member.profile?.name ?? 'Usuário'}
                      {isMe && <span className="text-[var(--color-orange)] ml-1 text-xs">(você)</span>}
                    </p>
                    {member.races.length > 0 && (
                      <p className="text-[11px] text-[var(--color-muted)] truncate">
                        {member.races
                          .sort((a: any, b: any) => b.pts - a.pts)
                          .slice(0, 3)
                          .map((r: any) => `${r.name.replace('IRONMAN ', '').replace('70.3 ', '')} (${r.pts}pts)`)
                          .join(' · ')}
                      </p>
                    )}
                    {member.races.length === 0 && (
                      <p className="text-[11px] text-[var(--color-muted)]">Sem pontuação ainda</p>
                    )}
                  </div>

                  {/* Total score */}
                  <div className="text-right shrink-0">
                    {member.total !== null ? (
                      <span className="font-bold text-[var(--color-orange)]">{member.total} pts</span>
                    ) : (
                      <span className="text-xs text-[var(--color-muted)]">—</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Owner: add member by name */}
      {isOwner && (
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5">
          <h3 className="font-bold text-sm mb-1">Adicionar membro</h3>
          <p className="text-xs text-[var(--color-muted)] mb-3">Digite o nome de usuário cadastrado no Trixer.</p>
          <AddMemberForm leagueId={id} />
        </div>
      )}
    </div>
  )
}
