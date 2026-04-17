import { createAdminClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/auth/require-admin'
import { formatDate } from '~/lib/utils'
import TriggerScoring from './TriggerScoring'
import { BarChart2 } from 'lucide-react'

export default async function AdminPontuacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ race_id?: string }>
}) {
  await requireAdmin()
  const supabase = createAdminClient()
  const { race_id } = await searchParams

  const { data: races } = await supabase
    .from('races')
    .select('id, name, date, status, distance')
    .in('status', ['locked', 'finished', 'open'])
    .order('date', { ascending: false })

  const selectedRaceId = race_id ?? races?.[0]?.id ?? ''

  // Teams with scores for selected race
  const { data: teams } = selectedRaceId
    ? await supabase
        .from('teams')
        .select('id, user_id, profile:profiles(name), score:scores(total_points, calculated_at)')
        .eq('race_id', selectedRaceId)
        .order('created_at')
    : { data: [] }

  const sorted = (teams ?? [])
    .map((t: any) => ({ ...t, pts: t.score?.total_points ?? null }))
    .sort((a: any, b: any) => (b.pts ?? -1) - (a.pts ?? -1))

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Pontuação</h1>

      {/* Race selector */}
      <form method="GET" className="mb-6">
        <div className="flex gap-2">
          <select name="race_id" defaultValue={selectedRaceId}
            className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]">
            {(races ?? []).map((r: any) => (
              <option key={r.id} value={r.id}>
                {r.name} — {formatDate(r.date)} ({r.status})
              </option>
            ))}
          </select>
          <button type="submit"
            className="bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] px-4 py-2 rounded-lg text-sm hover:border-[var(--color-orange)] transition-colors">
            Selecionar
          </button>
        </div>
      </form>

      {selectedRaceId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trigger */}
          <div className="lg:col-span-1">
            <TriggerScoring raceId={selectedRaceId} />
          </div>

          {/* Ranking preview */}
          <div className="lg:col-span-2">
            <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--color-navy-border)] flex items-center gap-2">
                <BarChart2 size={15} className="text-[var(--color-orange)]" />
                <span className="font-bold text-sm">Ranking Geral</span>
                <span className="ml-auto text-xs text-[var(--color-muted)]">{sorted.length} times</span>
              </div>
              <div className="divide-y divide-[var(--color-navy-border)] max-h-[600px] overflow-y-auto">
                {sorted.map((team: any, i: number) => (
                  <div key={team.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-sm text-[var(--color-muted)] w-6 text-center">{i + 1}</span>
                    <span className="flex-1 text-sm truncate">{team.profile?.name ?? team.user_id.slice(0, 8)}</span>
                    {team.pts !== null ? (
                      <span className="font-bold text-[var(--color-orange)] text-sm">{team.pts} pts</span>
                    ) : (
                      <span className="text-xs text-[var(--color-muted)]">sem pontuação</span>
                    )}
                  </div>
                ))}
                {sorted.length === 0 && (
                  <div className="text-center py-10 text-sm text-[var(--color-muted)]">
                    Nenhum time cadastrado.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
