import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createPublicClient, createClient } from '~/lib/supabase/server'
import { formatDate, formatTime, daysUntil } from '~/lib/utils'
import type { Race, RaceAthlete, Team } from '~/lib/types'
import { MapPin, Calendar, Users, Lock, Timer } from 'lucide-react'
import TeamBuilder from './TeamBuilder'
import BackLink from '~/app/components/BackLink'

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

export const revalidate = 3600

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
  return {
    title: race.name,
    description: `Escale seu time para o ${race.name} — ${race.location}, ${race.country}. ${formatDate(race.date)}.`,
  }
}

export default async function RacePage({ params }: { params: Promise<{ slug: string }> }) {
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

  // Check if user has a team + portfolio
  const authSupabase = await createClient()
  const { data: { user } } = await authSupabase.auth.getUser()

  let myTeam: Team | null = null
  let ownedAthleteIds: Set<string> = new Set()
  let wallet: number = 0

  if (user) {
    const [teamRes, portfolioRes, profileRes] = await Promise.all([
      authSupabase
        .from('teams')
        .select('*, team_athletes(athlete_id)')
        .eq('user_id', user.id)
        .maybeSingle(),
      authSupabase
        .from('portfolio')
        .select('athlete_id')
        .eq('user_id', user.id),
      authSupabase
        .from('profiles')
        .select('wallet')
        .eq('id', user.id)
        .single(),
    ])
    myTeam = teamRes.data as Team | null
    ownedAthleteIds = new Set((portfolioRes.data ?? []).map((p: any) => p.athlete_id))
    wallet = Number(profileRes.data?.wallet ?? 0)
  }

  // Fetch results if race is finished
  let proResults: any[] = []
  if (race.status === 'finished') {
    const { data: resultsData } = await supabase
      .from('results')
      .select('pro_pos, finish_time, dnf, dns, athlete:athletes(id, name, country, gender, photo_url)')
      .eq('race_id', race.id)
      .not('pro_pos', 'is', null)
      .order('pro_pos', { ascending: true })
    proResults = resultsData ?? []
  }

  const menResults   = proResults.filter((r: any) => (r.athlete as any)?.gender === 'M')
  const womenResults = proResults.filter((r: any) => (r.athlete as any)?.gender === 'F')

  const days = daysUntil(race.date)
  const isOpen = race.status === 'open'
  const isFinished = race.status === 'finished'

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <BackLink href="/provas" />
      {/* Race header */}
      <div className="mb-8">
        <span className="text-xs font-semibold text-[var(--color-orange)] uppercase tracking-wider">
          {race.distance === 'full' ? 'Full Triathlon' : 'Middle Distance'}
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold mt-1 mb-3">{race.name}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-muted)]">
          <span className="flex items-center gap-1.5"><MapPin size={14} />{race.location}, {race.country}</span>
          <span className="flex items-center gap-1.5">
            <Calendar size={14} />{formatDate(race.date)}
            {days > 0 && <span className="text-[var(--color-orange)] ml-1">{days} dias</span>}
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={14} />{raceAthletes?.length ?? 0} atletas cadastrados
          </span>
          {!isOpen && !isFinished && (
            <span className="flex items-center gap-1.5 text-yellow-400">
              <Lock size={14} />Montagem de time em breve
            </span>
          )}
        </div>
      </div>

      {/* Team builder or results view */}
      {isFinished ? (
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
            <span className="text-xl">🏁</span>
            <span>Prova encerrada</span>
          </div>

          {proResults.length === 0 ? (
            <div className="text-center py-16 text-[var(--color-muted)] bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl">
              <p className="text-3xl mb-3">⏳</p>
              <p className="font-medium">Resultados em processamento...</p>
              <p className="text-sm mt-1">Volte em breve para ver o resultado oficial.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[{ label: 'MPRO — Masculino', data: menResults }, { label: 'FPRO — Feminino', data: womenResults }].map(({ label, data }) => (
                data.length > 0 && (
                  <div key={label} className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[var(--color-navy-border)]">
                      <h2 className="font-bold text-sm">{label}</h2>
                    </div>
                    <div>
                      {data.map((r: any, i: number) => {
                        const ath = r.athlete as any
                        const top3 = i < 3
                        return (
                          <div key={r.pro_pos} className={`flex items-center gap-3 px-4 py-3 border-b border-[var(--color-navy-border)] last:border-0 ${top3 ? 'bg-[var(--color-navy-elevated)]/30' : ''}`}>
                            {/* Position */}
                            <div className="w-8 text-center shrink-0">
                              {top3
                                ? <span className="text-xl">{MEDALS[i]}</span>
                                : <span className="text-sm font-bold text-[var(--color-muted)]">{r.pro_pos}</span>
                              }
                            </div>
                            {/* Photo */}
                            {ath?.photo_url ? (
                              <img src={ath.photo_url} alt={ath.name} className="w-9 h-9 rounded-full object-cover shrink-0 bg-[var(--color-navy-elevated)]" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-purple)] to-[#3B1F8C] flex items-center justify-center text-xs font-black text-white shrink-0">
                                {ath?.name?.split(' ').slice(0,2).map((w: string) => w[0]).join('').toUpperCase()}
                              </div>
                            )}
                            {/* Name + country */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">
                                {ath?.name}
                                {ath?.country && <span className="ml-1 text-xs">{flag(ath.country)}</span>}
                              </p>
                            </div>
                            {/* Time */}
                            <div className="text-right shrink-0">
                              {r.dnf ? (
                                <span className="text-xs text-[var(--color-danger)] font-bold">DNF</span>
                              ) : r.dns ? (
                                <span className="text-xs text-[var(--color-muted)] font-bold">DNS</span>
                              ) : r.finish_time ? (
                                <div className="flex items-center gap-1 text-sm font-mono tabular-nums">
                                  <Timer size={11} className="text-[var(--color-muted)]" />
                                  <span className={top3 ? 'text-[var(--color-orange)] font-bold' : ''}>{formatTime(r.finish_time)}</span>
                                </div>
                              ) : null}
                            </div>
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
          myTeam={myTeam}
          userId={user?.id ?? null}
          isOpen={isOpen}
          ownedAthleteIds={Array.from(ownedAthleteIds)}
          raceAthleteIds={(raceAthletes ?? []).map(ra => ra.athlete_id)}
          wallet={wallet}
        />
      )}
    </div>
  )
}
