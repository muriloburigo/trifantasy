import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '~/lib/supabase/server'
import { formatDate } from '~/lib/utils'
import { Trophy, Copy, Users, Medal } from 'lucide-react'
import CopyButton from './CopyButton'
import BackLink from '~/app/components/BackLink'

export default async function LeaguePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: league } = await supabase
    .from('leagues')
    .select('*, race:races(id, name, date, slug, status, distance)')
    .eq('id', id)
    .single()

  if (!league) notFound()

  // Verify membership
  const { data: membership } = await supabase
    .from('league_members')
    .select('user_id')
    .eq('league_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) redirect('/ligas')

  // Fetch all members with their teams and scores
  const { data: members } = await supabase
    .from('league_members')
    .select(`
      user_id, joined_at,
      profile:profiles(name),
      team:teams!inner(
        id,
        score:scores(total_points, breakdown),
        team_athletes(athlete_id, athlete:athletes(name, type, age_group))
      )
    `)
    .eq('league_id', id)
    .eq('team.race_id', league.race_id)

  // Sort by score desc
  const ranked = (members ?? [])
    .map((m: any) => ({
      ...m,
      total: m.team?.[0]?.score?.total_points ?? null,
    }))
    .sort((a: any, b: any) => {
      if (a.total === null && b.total === null) return 0
      if (a.total === null) return 1
      if (b.total === null) return -1
      return b.total - a.total
    })

  const isFinished = league.race?.status === 'finished'

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <BackLink href="/ligas" />
        <div className="flex items-start justify-between mt-3 gap-4">
          <div>
            <h1 className="text-2xl font-bold">{league.name}</h1>
            {league.race && (
              <Link href={`/provas/${league.race.slug}`} className="text-sm text-[var(--color-muted)] hover:text-[var(--color-orange)] transition-colors mt-1 block">
                {league.race.name} · {formatDate(league.race.date)}
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-xs text-[var(--color-muted)]">
              Código: <span className="font-mono text-[var(--color-text)] font-semibold">{league.invite_code}</span>
            </div>
            <CopyButton code={league.invite_code} />
          </div>
        </div>
      </div>

      {/* Ranking */}
      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[var(--color-navy-border)] flex items-center gap-2">
          <Trophy size={16} className="text-[var(--color-orange)]" />
          <h2 className="font-bold">Ranking {isFinished ? 'Final' : 'Parcial'}</h2>
          <span className="ml-auto text-sm text-[var(--color-muted)] flex items-center gap-1">
            <Users size={13} />
            {ranked.length} participantes
          </span>
        </div>

        {ranked.length === 0 ? (
          <div className="text-center py-12 text-[var(--color-muted)] text-sm">
            Nenhum membro tem time salvo ainda.
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-navy-border)]">
            {ranked.map((member: any, i: number) => {
              const isMe = member.user_id === user.id
              const team = member.team?.[0]
              const athletes = team?.team_athletes ?? []
              const score = team?.score

              return (
                <div
                  key={member.user_id}
                  className={`p-4 flex items-center gap-4 ${isMe ? 'bg-[var(--color-orange-dim)]' : ''}`}
                >
                  {/* Position */}
                  <div className="w-8 text-center shrink-0">
                    {i === 0 ? <Medal size={18} className="text-yellow-400 mx-auto" />
                      : i === 1 ? <Medal size={18} className="text-gray-400 mx-auto" />
                      : i === 2 ? <Medal size={18} className="text-amber-600 mx-auto" />
                      : <span className="text-sm text-[var(--color-muted)]">{i + 1}</span>}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {member.profile?.name ?? 'Usuário'}
                      {isMe && <span className="text-[var(--color-orange)] ml-1 text-xs">(você)</span>}
                    </p>
                    {athletes.length > 0 && (
                      <p className="text-xs text-[var(--color-muted)] truncate">
                        {athletes.slice(0, 3).map((ta: any) => ta.athlete?.name).join(', ')}
                        {athletes.length > 3 && ` +${athletes.length - 3}`}
                      </p>
                    )}
                    {athletes.length === 0 && (
                      <p className="text-xs text-[var(--color-muted)]">Sem time cadastrado</p>
                    )}
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    {score ? (
                      <span className="font-bold text-[var(--color-orange)]">{score.total_points} pts</span>
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
    </div>
  )
}
