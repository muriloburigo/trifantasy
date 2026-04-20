import { createAdminClient, createPublicClient } from '~/lib/supabase/server'
import BackLink from '~/app/components/BackLink'

export const revalidate = 600

const COUNTRY_FLAGS: Record<string, string> = {
  'Brazil': '🇧🇷', 'Norway': '🇳🇴', 'Germany': '🇩🇪', 'Belgium': '🇧🇪',
  'Denmark': '🇩🇰', 'France': '🇫🇷', 'United States': '🇺🇸', 'Australia': '🇦🇺',
  'Great Britain': '🇬🇧', 'New Zealand': '🇳🇿', 'Canada': '🇨🇦', 'Sweden': '🇸🇪',
  'Switzerland': '🇨🇭', 'Austria': '🇦🇹', 'Spain': '🇪🇸', 'Netherlands': '🇳🇱',
  'South Africa': '🇿🇦', 'Poland': '🇵🇱', 'Italy': '🇮🇹', 'Portugal': '🇵🇹',
  'Mexico': '🇲🇽', 'Argentina': '🇦🇷', 'Chile': '🇨🇱', 'Uruguay': '🇺🇾',
}

function flag(country: string | null) {
  return COUNTRY_FLAGS[country ?? ''] ?? ''
}

function initials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const MEDALS = ['🥇', '🥈', '🥉']

export default async function TrixersPage() {
  const admin = createAdminClient()
  const pub   = createPublicClient()

  const [scoresRes, profilesRes, teamsRes] = await Promise.all([
    admin
      .from('scores')
      .select('total_points, race:races(name, date), teams(user_id, profiles(name, country))')
      .order('total_points', { ascending: false })
      .limit(500),
    pub.from('profiles').select('id', { count: 'exact', head: true }),
    admin.from('teams').select('user_id', { count: 'exact', head: true }),
  ])

  const entries = (scoresRes.data ?? []).filter(s => s.teams)

  // Aggregate per user: best score, races played, best race name
  const byUser: Record<string, {
    name: string
    country: string | null
    bestScore: number
    bestRace: string
    racesPlayed: number
  }> = {}

  for (const s of entries) {
    const t = s.teams as any
    const uid = t?.user_id
    if (!uid) continue
    const pts = Number(s.total_points ?? 0)
    if (!byUser[uid]) {
      byUser[uid] = {
        name: t.profiles?.name ?? 'Trixter',
        country: t.profiles?.country ?? null,
        bestScore: pts,
        bestRace: (s as any).race?.name ?? '—',
        racesPlayed: 1,
      }
    } else {
      byUser[uid].racesPlayed++
      if (pts > byUser[uid].bestScore) {
        byUser[uid].bestScore = pts
        byUser[uid].bestRace = (s as any).race?.name ?? '—'
      }
    }
  }

  const ranked = Object.values(byUser)
    .sort((a, b) => b.bestScore - a.bestScore)

  const totalTrixers  = profilesRes.count ?? 0
  const activeTrixers = ranked.length
  const totalTeams    = teamsRes.count ?? 0

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <BackLink href="/" />
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Comunidade Trixers</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Rankings e estatísticas da comunidade TriFantasy
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-[var(--color-orange)]">{totalTrixers}</p>
          <p className="text-xs text-[var(--color-muted)] mt-1">Trixers</p>
        </div>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-[var(--color-success)]">{activeTrixers}</p>
          <p className="text-xs text-[var(--color-muted)] mt-1">Jogaram</p>
        </div>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-black">{totalTeams}</p>
          <p className="text-xs text-[var(--color-muted)] mt-1">Times montados</p>
        </div>
      </div>

      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_60px_70px] gap-2 px-4 py-2.5 border-b border-[var(--color-navy-border)] text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
          <span>#</span>
          <span>Trixter</span>
          <span className="text-center">Provas</span>
          <span className="text-right">Melhor</span>
        </div>

        {ranked.length === 0 && (
          <div className="py-16 text-center text-[var(--color-muted)]">
            <p className="text-4xl mb-3">🏊</p>
            <p className="font-medium">Nenhuma pontuação ainda.</p>
            <p className="text-sm mt-1">Seja o primeiro Trixter a jogar!</p>
          </div>
        )}

        {ranked.map((trixter, i) => {
          const top3 = i < 3
          return (
            <div
              key={i}
              className={`grid grid-cols-[40px_1fr_60px_70px] gap-2 items-center px-4 py-3.5 border-b border-[var(--color-navy-border)] last:border-0 ${top3 ? 'bg-[var(--color-navy-elevated)]/40' : ''}`}
            >
              {/* Position */}
              <div className="text-center shrink-0">
                {top3
                  ? <span className="text-xl">{MEDALS[i]}</span>
                  : <span className="text-sm font-bold text-[var(--color-muted)]">{i + 1}</span>
                }
              </div>

              {/* Avatar + name */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 ${
                  top3
                    ? 'bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)]'
                    : 'bg-gradient-to-br from-[var(--color-purple)] to-[#3B1F8C]'
                }`}>
                  {initials(trixter.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {trixter.name}
                    {trixter.country && <span className="ml-1 text-xs">{flag(trixter.country)}</span>}
                  </p>
                  <p className="text-[11px] text-[var(--color-muted)] truncate">{trixter.bestRace}</p>
                </div>
              </div>

              {/* Races played */}
              <div className="text-center">
                <span className="text-sm font-semibold tabular-nums">{trixter.racesPlayed}</span>
              </div>

              {/* Best score */}
              <div className="text-right">
                <p className={`text-base font-black tabular-nums ${top3 ? 'text-[var(--color-orange)]' : ''}`}>
                  {trixter.bestScore}
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
