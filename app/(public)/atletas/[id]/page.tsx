import { notFound } from 'next/navigation'
import { createPublicClient, createAdminClient } from '~/lib/supabase/server'
import BackLink from '~/app/components/BackLink'
import { formatDate, formatTime } from '~/lib/utils'
import { TrendingUp, TrendingDown, Minus, Trophy, Flag, Timer, Bike, PersonStanding, Waves } from 'lucide-react'

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
  return COUNTRY_FLAGS[country ?? ''] ?? '🌍'
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function PriceTrend({ change }: { change: number }) {
  if (change > 0) return (
    <span className="flex items-center gap-1 text-[var(--color-success)] font-bold">
      <TrendingUp size={14} />+{change.toFixed(1)}
    </span>
  )
  if (change < 0) return (
    <span className="flex items-center gap-1 text-[var(--color-danger)] font-bold">
      <TrendingDown size={14} />{change.toFixed(1)}
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-[var(--color-muted)]">
      <Minus size={14} />0.0
    </span>
  )
}

export default async function AthleteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const pub   = createPublicClient()
  const admin = createAdminClient()

  // Fetch athlete
  const { data: athlete } = await pub
    .from('athletes')
    .select('*')
    .eq('id', id)
    .single()

  if (!athlete) notFound()

  // Fetch race history: races this athlete is registered for + results
  const { data: raceAthletes } = await pub
    .from('race_athletes')
    .select('race_id, bib, price, races(id, name, slug, date, location, country, distance, status)')
    .eq('athlete_id', id)
    .order('races(date)', { ascending: false })

  const raceIds = (raceAthletes ?? []).map((ra: any) => ra.race_id)

  // Fetch results for this athlete in all races
  const { data: results } = raceIds.length > 0
    ? await pub
        .from('results')
        .select('race_id, overall_pos, pro_pos, ag_pos, swim_time, t1_time, bike_time, t2_time, run_time, finish_time, dnf, dns, kona_slot')
        .eq('athlete_id', id)
        .in('race_id', raceIds)
    : { data: [] }

  // How many fantasy teams picked this athlete
  const { count: pickedCount } = await admin
    .from('team_athletes')
    .select('*', { count: 'exact', head: true })
    .eq('athlete_id', id)

  // Best fantasy score contribution from scores.breakdown JSONB
  const { data: scoreRows } = await admin
    .from('scores')
    .select('total_points, breakdown, teams(races(name, date))')
    .not('breakdown', 'is', null)
    .limit(500)

  // Find entries where this athlete contributed
  const contributions: { race: string; points: number; detail: string[] }[] = []
  for (const row of scoreRows ?? []) {
    const breakdown = row.breakdown as any[]
    if (!Array.isArray(breakdown)) continue
    const entry = breakdown.find((b: any) => b.athlete_id === id)
    if (entry) {
      contributions.push({
        race: (row.teams as any)?.races?.name ?? '—',
        points: Number(entry.total ?? entry.base_points ?? 0),
        detail: entry.detail ?? [],
      })
    }
  }
  const bestContribution = contributions.sort((a, b) => b.points - a.points)[0] ?? null

  // Build result map by race_id
  const resultMap: Record<string, any> = {}
  for (const r of results ?? []) {
    resultMap[r.race_id] = r
  }

  const isPro = athlete.type === 'pro'
  const priceChange = Number(athlete.price_change ?? 0)

  // Summary stats
  const finishedRaces = (raceAthletes ?? []).filter((ra: any) => ra.races?.status === 'finished')
  const dnfCount = finishedRaces.filter((ra: any) => resultMap[ra.race_id]?.dnf).length
  const konaSlots = (results ?? []).filter(r => r.kona_slot).length
  const bestPos = (results ?? [])
    .filter(r => !r.dnf && !r.dns)
    .map(r => isPro ? (r.pro_pos ?? r.overall_pos) : (r.ag_pos ?? r.overall_pos))
    .filter(Boolean)
    .sort((a, b) => a - b)[0] ?? null

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <BackLink href="/atletas" label="Mercado de Atletas" />

      {/* Hero */}
      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-6 mb-6 flex gap-5 items-center">
        {/* Avatar */}
        <div className={`w-20 h-20 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-xl font-black text-white ${
          !athlete.photo_url
            ? isPro
              ? 'bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)]'
              : 'bg-gradient-to-br from-[var(--color-purple)] to-[#3B1F8C]'
            : ''
        }`}>
          {athlete.photo_url
            ? <img src={athlete.photo_url} alt={athlete.name} className="w-full h-full object-cover" />
            : initials(athlete.name)
          }
        </div>

        <div className="flex-1 min-w-0">
          {/* Type badge */}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded mb-1 inline-block ${
            isPro
              ? 'bg-[var(--color-orange)]/15 text-[var(--color-orange)]'
              : 'bg-[var(--color-purple)]/15 text-[var(--color-purple)]'
          }`}>
            {isPro ? 'PRO' : athlete.age_group ?? 'Age Grouper'}
          </span>

          <h1 className="text-2xl font-black leading-tight">{athlete.name}</h1>

          <div className="flex items-center gap-3 mt-1 text-sm text-[var(--color-muted)] flex-wrap">
            <span>{flag(athlete.country)} {athlete.country}</span>
            {athlete.pto_rank && <span>#{athlete.pto_rank} PTO</span>}
            {athlete.club && <span>· {athlete.club}</span>}
          </div>
        </div>

        {/* Price block */}
        <div className="text-right shrink-0">
          <p className="text-3xl font-black text-[var(--color-orange)]">T${Number(athlete.current_price).toFixed(0)}</p>
          <div className="mt-1">
            <PriceTrend change={priceChange} />
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-3 text-center">
          <p className="text-xl font-black">{(raceAthletes ?? []).length}</p>
          <p className="text-[11px] text-[var(--color-muted)] mt-0.5">Provas</p>
        </div>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-3 text-center">
          <p className="text-xl font-black text-[var(--color-success)]">
            {bestPos ? `#${bestPos}` : '—'}
          </p>
          <p className="text-[11px] text-[var(--color-muted)] mt-0.5">Melhor pos.</p>
        </div>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-3 text-center">
          <p className="text-xl font-black text-[var(--color-orange)]">{pickedCount ?? 0}</p>
          <p className="text-[11px] text-[var(--color-muted)] mt-0.5">Times</p>
        </div>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-3 text-center">
          <p className="text-xl font-black">{konaSlots > 0 ? konaSlots : dnfCount > 0 ? dnfCount : '—'}</p>
          <p className="text-[11px] text-[var(--color-muted)] mt-0.5">{konaSlots > 0 ? 'Kona slots' : dnfCount > 0 ? 'DNFs' : 'Kona slots'}</p>
        </div>
      </div>

      {/* Race history */}
      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-[var(--color-navy-border)]">
          <h2 className="text-sm font-bold">Histórico de Provas</h2>
        </div>

        {(raceAthletes ?? []).length === 0 ? (
          <p className="text-center py-10 text-sm text-[var(--color-muted)]">Nenhuma prova registrada.</p>
        ) : (
          <div>
            {(raceAthletes ?? []).map((ra: any) => {
              const race = ra.races
              if (!race) return null
              const result = resultMap[ra.race_id]
              const hasResult = !!result
              const isDNF = result?.dnf
              const isDNS = result?.dns
              const pos = isPro ? (result?.pro_pos ?? result?.overall_pos) : (result?.ag_pos ?? result?.overall_pos)
              const isFinished = race.status === 'finished'

              return (
                <div key={ra.race_id} className="px-4 py-4 border-b border-[var(--color-navy-border)] last:border-0">
                  {/* Race header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-[10px] font-semibold text-[var(--color-orange)] uppercase tracking-wider">
                        {race.distance === 'full' ? 'Full Triathlon' : '70.3'}
                      </p>
                      <p className="font-bold text-sm">{race.name}</p>
                      <p className="text-[11px] text-[var(--color-muted)] mt-0.5">
                        {race.location}, {race.country} · {formatDate(race.date)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-[var(--color-muted)]">Preço na prova</p>
                      <p className="font-black text-[var(--color-orange)]">T${Number(ra.price).toFixed(0)}</p>
                    </div>
                  </div>

                  {/* Result */}
                  {isFinished && hasResult && (
                    <div>
                      {isDNF && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--color-danger)]/15 text-[var(--color-danger)] text-xs font-bold">
                          DNF — Não finalizou
                        </span>
                      )}
                      {isDNS && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--color-muted)]/15 text-[var(--color-muted)] text-xs font-bold">
                          DNS — Não largou
                        </span>
                      )}
                      {!isDNF && !isDNS && (
                        <div>
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            {pos && (
                              <span className={`text-2xl font-black ${pos === 1 ? 'text-yellow-400' : pos <= 3 ? 'text-[var(--color-orange)]' : ''}`}>
                                #{pos}
                              </span>
                            )}
                            {result.finish_time && (
                              <span className="text-sm font-bold">{formatTime(result.finish_time)}</span>
                            )}
                            {result.kona_slot && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-yellow-400/15 text-yellow-400 text-xs font-bold">
                                🌺 Kona Slot
                              </span>
                            )}
                          </div>
                          {/* Segment times */}
                          {(result.swim_time || result.bike_time || result.run_time) && (
                            <div className="flex gap-3 flex-wrap text-[11px] text-[var(--color-muted)]">
                              {result.swim_time && (
                                <span className="flex items-center gap-1">
                                  <Waves size={10} />{formatTime(result.swim_time)}
                                </span>
                              )}
                              {result.bike_time && (
                                <span className="flex items-center gap-1">
                                  <Bike size={10} />{formatTime(result.bike_time)}
                                </span>
                              )}
                              {result.run_time && (
                                <span className="flex items-center gap-1">
                                  <PersonStanding size={10} />{formatTime(result.run_time)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {isFinished && !hasResult && (
                    <span className="text-[11px] text-[var(--color-muted)]">Resultado não disponível</span>
                  )}
                  {!isFinished && (
                    <span className={`text-[11px] font-medium ${race.status === 'open' ? 'text-[var(--color-success)]' : 'text-[var(--color-muted)]'}`}>
                      {race.status === 'open' ? '● Aberto para escalação' : race.status === 'locked' ? 'Encerrado para escalação' : 'Em breve'}
                    </span>
                  )}

                  {/* Price change indicator */}
                  {priceChange !== 0 && isFinished && (
                    <div className="mt-2 pt-2 border-t border-[var(--color-navy-border)]/50">
                      <span className="text-[11px] text-[var(--color-muted)]">Variação de preço após esta prova: </span>
                      <span className={`text-[11px] font-bold ${priceChange > 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                        {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)} T$
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Fantasy performance */}
      {bestContribution && (
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--color-navy-border)]">
            <h2 className="text-sm font-bold">Melhor Performance no TriFantasy</h2>
          </div>
          <div className="px-4 py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">{bestContribution.race}</p>
              <span className="text-lg font-black text-[var(--color-orange)]">{bestContribution.points} pts</span>
            </div>
            {bestContribution.detail.length > 0 && (
              <ul className="flex flex-col gap-1 mt-2">
                {bestContribution.detail.map((d: string, i: number) => (
                  <li key={i} className="text-[11px] text-[var(--color-muted)] flex items-start gap-1.5">
                    <span className="text-[var(--color-orange)] mt-0.5">·</span>{d}
                  </li>
                ))}
              </ul>
            )}
            {contributions.length > 1 && (
              <p className="text-[11px] text-[var(--color-muted)] mt-3">
                Contribuiu em {contributions.length} time{contributions.length > 1 ? 's' : ''} ao total
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
