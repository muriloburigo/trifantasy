import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createPublicClient, createClient } from '~/lib/supabase/server'
import { formatDate, formatTime, daysUntil } from '~/lib/utils'
import type { Race, RaceAthlete } from '~/lib/types'
import { MapPin, Calendar, Users, Lock, Timer } from 'lucide-react'
import TeamBuilder from './TeamBuilder'
import BackLink from '~/app/components/BackLink'
import { getTranslations } from 'next-intl/server'

const COUNTRY_FLAGS: Record<string, string> = {
  'Brazil': '🇧🇷', 'Norway': '🇳🇴', 'Germany': '🇩🇪', 'Belgium': '🇧🇪',
  'Denmark': '🇩🇰', 'France': '🇫🇷', 'United States': '🇺🇸', 'Australia': '🇦🇺',
  'Great Britain': '🇬🇧', 'New Zealand': '🇳🇿', 'Canada': '🇨🇦', 'Sweden': '🇸🇪',
  'Switzerland': '🇨🇭', 'Austria': '🇦🇹', 'Spain': '🇪🇸', 'Netherlands': '🇳🇱',
  'South Africa': '🇿🇦', 'Poland': '🇵🇱', 'Italy': '🇮🇹', 'Portugal': '🇵🇹',
  'Mexico': '🇲🇽', 'Argentina': '🇦🇷', 'Chile': '🇨🇱', 'Uruguay': '🇺🇾',
}
function flag(country: string | null) { return COUNTRY_FLAGS[country ?? ''] ?? '' }

const MEDALS = ['🥇', '🥈', '🥉']

export const revalidate = 0

export async function generateStaticParams() {
  const supabase = createPublicClient()
  const { data } = await supabase.from('races').select('slug')
  return (data ?? []).map(r => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = createPublicClient()
  const { data: race } = await supabase.from('races').select('name, location, country, date').eq('slug', slug).single()
  if (!race) return {}
  
  const title = `${race.name} | Escale seu Time`
  const description = `Confira o field PRO e acompanhe os resultados de ${race.name} em ${race.location}, ${race.country} no Trixer. ${formatDate(race.date)}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    }
  }
}

export default async function RacePage({ params }: { params: Promise<{ slug: string }> }) {
  const t = await getTranslations('races')
  const { slug } = await params
  const supabase = createPublicClient()

  const { data: race } = await supabase
    .from('races')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!race) notFound()

  // Fetch race athletes with athlete data
  const { data: raceAthletes } = await supabase
    .from('race_athletes')
    .select('*, athlete:athletes(*, price_change, current_price)')
    .eq('race_id', race.id)
    .order('price', { ascending: false })

  // Check current roster + User Score
  const authSupabase = await createClient()
  const { data: { user } } = await authSupabase.auth.getUser()

  let ownedMap: Record<string, number> = {}
  let wallet: number = 0
  let userScore: any = null

  if (user) {
    const [portfolioRes, profileRes, scoreRes] = await Promise.all([
      authSupabase
        .from('portfolio')
        .select('athlete_id, bought_price')
        .eq('user_id', user.id),
      authSupabase
        .from('profiles')
        .select('wallet')
        .eq('id', user.id)
        .single(),
      authSupabase
        .from('scores')
        .select('id, total_points, teams!inner(user_id)')
        .eq('race_id', race.id)
        .eq('teams.user_id', user.id)
        .maybeSingle()
    ])
    ownedMap = Object.fromEntries((portfolioRes.data ?? []).map((p: any) => [p.athlete_id, Number(p.bought_price)]))
    wallet = Number(profileRes.data?.wallet ?? 0)
    userScore = scoreRes.data
  }
  // Fetch results if race is finished
  let proResults: any[] = []
  if (race.status === 'finished') {
    const { data: resultsData } = await supabase
      .from('results')
      .select('pro_pos, swim_time, bike_time, run_time, finish_time, dnf, dns, athlete:athletes(id, name, country, gender, photo_url)')
      .eq('race_id', race.id)
      .not('pro_pos', 'is', null)
      .order('pro_pos', { ascending: true })
    proResults = resultsData ?? []
  }

  const menResults   = proResults.filter((r: any) => (r.athlete as any)?.gender === 'M')
  const womenResults = proResults.filter((r: any) => (r.athlete as any)?.gender === 'F')

  // Best segment times per gender (for highlighting leaders)
  const bestOf = (arr: any[], field: string) => Math.min(...arr.filter(r => r[field]).map(r => r[field]))
  const mBestSwim = bestOf(menResults,   'swim_time')
  const mBestBike = bestOf(menResults,   'bike_time')
  const mBestRun  = bestOf(menResults,   'run_time')
  const fBestSwim = bestOf(womenResults, 'swim_time')
  const fBestBike = bestOf(womenResults, 'bike_time')
  const fBestRun  = bestOf(womenResults, 'run_time')

  const days = daysUntil(race.date)
  const isOpen = race.status === 'open'
  const isFinished = race.status === 'finished'

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <BackLink href="/provas" />
      {/* Race header */}
      <div className="mb-8">
        <span className="text-xs font-semibold text-[var(--color-orange)] uppercase tracking-wider">
          {race.distance === 'full' ? t('full') : t('middle')}
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold mt-1 mb-3">{race.name}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-muted)]">
          <span className="flex items-center gap-1.5"><MapPin size={14} />{race.location}, {race.country}</span>
          <span className="flex items-center gap-1.5">
            <Calendar size={14} />{formatDate(race.date)}
            {days > 0 && <span className="text-[var(--color-orange)] ml-1">{t('seeDays', { n: days })}</span>}
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={14} />{t('athletes', { n: raceAthletes?.length ?? 0 })}
          </span>
          {!isOpen && !isFinished && (
            <span className="flex items-center gap-1.5 text-yellow-400">
              <Lock size={14} />{t('lockSoon')}
            </span>
          )}
        </div>
      </div>

      {/* Team builder or results view */}
      {isFinished ? (
        <div className="space-y-6">
          {userScore && (
            <div className="bg-gradient-to-r from-[var(--color-navy-card)] to-[var(--color-navy-elevated)] border border-[var(--color-orange)]/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--color-orange)]/10 flex items-center justify-center text-[var(--color-orange)]">
                  <Trophy size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest">Sua Pontuação</p>
                  <p className="text-2xl font-black text-white">{userScore.total_points} pts</p>
                </div>
              </div>
              <Link 
                href={`/meu-time/${userScore.id}`}
                className="bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-[var(--color-orange)]/20"
              >
                Ver Detalhamento
              </Link>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <span className="text-xl">🏁</span>
            <span>{t('finished')}</span>
          </div>

          {proResults.length === 0 ? (
            <div className="text-center py-16 text-[var(--color-muted)] bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl">
              <p className="text-3xl mb-3">⏳</p>
              <p className="font-medium">{t('resultsProcessing')}</p>
              <p className="text-sm mt-1">{t('resultsProcessingDesc')}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {[
                { label: t('mproLabel'), data: menResults,   bestSwim: mBestSwim, bestBike: mBestBike, bestRun: mBestRun },
                { label: t('fproLabel'), data: womenResults, bestSwim: fBestSwim, bestBike: fBestBike, bestRun: fBestRun },
              ].map(({ label, data, bestSwim, bestBike, bestRun }) => (
                data.length > 0 && (
                  <div key={label} className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-[var(--color-navy-border)] flex items-center justify-between">
                      <h2 className="font-bold text-sm">{label}</h2>
                      <div className="hidden sm:flex items-center gap-4 text-[10px] text-[var(--color-muted)] font-mono">
                        <span className="w-16 text-right">🏊</span>
                        <span className="w-16 text-right">🚴</span>
                        <span className="w-16 text-right">🏃</span>
                        <span className="w-16 text-right">⏱</span>
                      </div>
                    </div>
                    <div>
                      {data.map((r: any, i: number) => {
                        const ath = r.athlete as any
                        const top3 = i < 3
                        const isBestSwim = r.swim_time && r.swim_time === bestSwim
                        const isBestBike = r.bike_time && r.bike_time === bestBike
                        const isBestRun  = r.run_time  && r.run_time  === bestRun
                        return (
                          <div key={r.pro_pos} className={`flex items-center gap-3 px-4 py-2.5 border-b border-[var(--color-navy-border)] last:border-0 ${top3 ? 'bg-[var(--color-navy-elevated)]/30' : ''}`}>
                            {/* Position */}
                            <div className="w-8 text-center shrink-0">
                              {top3
                                ? <span className="text-xl">{MEDALS[i]}</span>
                                : <span className="text-sm font-bold text-[var(--color-muted)]">{r.pro_pos}</span>
                              }
                            </div>
                            {/* Photo */}
                            {ath?.photo_url ? (
                              <img src={ath.photo_url} alt={ath.name} className="w-8 h-8 rounded-full object-cover shrink-0 bg-[var(--color-navy-elevated)]" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-purple)] to-[#3B1F8C] flex items-center justify-center text-xs font-black text-white shrink-0">
                                {ath?.name?.split(' ').slice(0,2).map((w: string) => w[0]).join('').toUpperCase()}
                              </div>
                            )}
                            {/* Name + country */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">
                                {ath?.name}
                                {ath?.country && <span className="ml-1 text-xs">{flag(ath.country)}</span>}
                              </p>
                              {/* Mobile splits */}
                              {!r.dnf && !r.dns && r.swim_time && (
                                <p className="sm:hidden text-[10px] text-[var(--color-muted)] font-mono mt-0.5 flex gap-2">
                                  <span className={isBestSwim ? 'text-[var(--color-orange)] font-bold' : ''}>🏊{formatTime(r.swim_time)}</span>
                                  <span className={isBestBike ? 'text-[var(--color-orange)] font-bold' : ''}>🚴{formatTime(r.bike_time)}</span>
                                  <span className={isBestRun  ? 'text-[var(--color-orange)] font-bold' : ''}>🏃{formatTime(r.run_time)}</span>
                                </p>
                              )}
                            </div>
                            {/* Desktop splits + finish */}
                            {r.dnf ? (
                              <span className="text-xs text-[var(--color-danger)] font-bold ml-auto">DNF</span>
                            ) : r.dns ? (
                              <span className="text-xs text-[var(--color-muted)] font-bold ml-auto">DNS</span>
                            ) : (
                              <div className="hidden sm:flex items-center gap-4 text-xs font-mono tabular-nums shrink-0">
                                <span className={`w-16 text-right ${isBestSwim ? 'text-[var(--color-orange)] font-bold' : 'text-[var(--color-muted)]'}`}>
                                  {r.swim_time ? formatTime(r.swim_time) : '—'}
                                </span>
                                <span className={`w-16 text-right ${isBestBike ? 'text-[var(--color-orange)] font-bold' : 'text-[var(--color-muted)]'}`}>
                                  {r.bike_time ? formatTime(r.bike_time) : '—'}
                                </span>
                                <span className={`w-16 text-right ${isBestRun ? 'text-[var(--color-orange)] font-bold' : 'text-[var(--color-muted)]'}`}>
                                  {r.run_time ? formatTime(r.run_time) : '—'}
                                </span>
                                <span className={`w-16 text-right ${top3 ? 'text-[var(--color-orange)] font-bold' : ''}`}>
                                  {r.finish_time ? formatTime(r.finish_time) : '—'}
                                </span>
                              </div>
                            )}
                            {/* Mobile finish time */}
                            {!r.dnf && !r.dns && (
                              <div className="sm:hidden flex items-center gap-1 text-sm font-mono tabular-nums shrink-0">
                                <Timer size={11} className="text-[var(--color-muted)]" />
                                <span className={top3 ? 'text-[var(--color-orange)] font-bold' : ''}>
                                  {r.finish_time ? formatTime(r.finish_time) : '—'}
                                </span>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
      ) : (
        <TeamBuilder
          race={race as Race}
          raceAthletes={(raceAthletes ?? []) as RaceAthlete[]}
          userId={user?.id ?? null}
          isOpen={isOpen}
          ownedMap={ownedMap}
          wallet={wallet}
        />
      )}
    </div>
  )
}
