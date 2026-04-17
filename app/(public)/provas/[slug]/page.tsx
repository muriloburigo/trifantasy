import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createPublicClient, createClient } from '~/lib/supabase/server'
import { formatDate, daysUntil } from '~/lib/utils'
import type { Race, RaceAthlete, Team } from '~/lib/types'
import { MapPin, Calendar, Users, Lock } from 'lucide-react'
import TeamBuilder from './TeamBuilder'

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
    .select('*, athlete:athletes(*)')
    .eq('race_id', race.id)
    .order('price', { ascending: false })

  // Check if user has a team
  const authSupabase = await createClient()
  const { data: { user } } = await authSupabase.auth.getUser()

  let myTeam: Team | null = null
  if (user) {
    const { data: team } = await authSupabase
      .from('teams')
      .select('*, team_athletes(athlete_id)')
      .eq('user_id', user.id)
      .eq('race_id', race.id)
      .maybeSingle()
    myTeam = team as Team | null
  }

  const days = daysUntil(race.date)
  const isOpen = race.status === 'open'
  const isFinished = race.status === 'finished'

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
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
        <div className="text-center py-20 text-[var(--color-muted)]">
          <p className="text-4xl mb-4">🏁</p>
          <p className="text-lg font-medium">Prova finalizada</p>
          <p className="text-sm mt-1">Veja os rankings e pontuações das ligas.</p>
        </div>
      ) : (
        <TeamBuilder
          race={race as Race}
          raceAthletes={(raceAthletes ?? []) as RaceAthlete[]}
          myTeam={myTeam}
          userId={user?.id ?? null}
          isOpen={isOpen}
        />
      )}
    </div>
  )
}
