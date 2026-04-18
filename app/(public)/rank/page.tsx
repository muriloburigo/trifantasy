import { createAdminClient } from '~/lib/supabase/server'

export const revalidate = 600

function initials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const MEDALS = ['🥇', '🥈', '🥉']

export default async function RankPage() {
  const admin = createAdminClient()

  const { data: scores } = await admin
    .from('scores')
    .select('total_points, calculated_at, teams(user_id, races(name, date), profiles(name, country))')
    .order('total_points', { ascending: false })
    .limit(100)

  const entries = (scores ?? []).filter(s => s.teams)

  // Group by user — keep best score per user
  const byUser: Record<string, any> = {}
  for (const s of entries) {
    const uid = (s.teams as any)?.user_id
    if (!uid) continue
    if (!byUser[uid] || Number(s.total_points) > Number(byUser[uid].total_points)) {
      byUser[uid] = s
    }
  }

  const ranked = Object.values(byUser)
    .sort((a, b) => Number(b.total_points) - Number(a.total_points))
    .slice(0, 50)

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Trix Rank Global</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Top Trixers por pontuação acumulada · {ranked.length} jogadores
        </p>
      </div>

      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_auto] gap-3 px-4 py-2.5 border-b border-[var(--color-navy-border)] text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
          <span>#</span>
          <span>Trixter</span>
          <span>Pts</span>
        </div>

        {ranked.length === 0 && (
          <div className="py-16 text-center text-[var(--color-muted)]">
            <p className="text-4xl mb-3">🏊</p>
            <p className="font-medium">Nenhuma pontuação ainda.</p>
          </div>
        )}

        {ranked.map((entry, i) => {
          const name: string = (entry.teams as any)?.profiles?.name ?? 'Trixter'
          const race: string = (entry.teams as any)?.races?.name ?? '—'
          const pts = Number(entry.total_points ?? 0)
          const top3 = i < 3

          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3.5 border-b border-[var(--color-navy-border)] last:border-0 ${top3 ? 'bg-[var(--color-navy-elevated)]/40' : ''}`}
            >
              {/* Position */}
              <div className="w-8 text-center shrink-0">
                {top3
                  ? <span className="text-xl">{MEDALS[i]}</span>
                  : <span className="text-sm font-bold text-[var(--color-muted)]">{i + 1}</span>
                }
              </div>

              {/* Avatar */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 ${
                top3
                  ? 'bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)]'
                  : 'bg-[var(--color-navy-elevated)] text-[var(--color-muted)]'
              }`}>
                {initials(name)}
              </div>

              {/* Name + race */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{name}</p>
                <p className="text-[11px] text-[var(--color-muted)] truncate">{race}</p>
              </div>

              {/* Score */}
              <div className="text-right shrink-0">
                <p className={`text-base font-black tabular-nums ${top3 ? 'text-[var(--color-orange)]' : ''}`}>
                  {pts}
                </p>
                <p className="text-[10px] text-[var(--color-muted)]">pts</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
