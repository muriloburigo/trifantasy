import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '~/lib/supabase/server'
import type { Athlete, Race, PodiumEntry, Roster, LeagueStanding } from '~/lib/trixerTypes'
import SharePageClient from './SharePageClient'

// ── helpers ──────────────────────────────────────────────────────────────────

const countryFlag = (iso: string) =>
  (iso ?? '').toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))

const mapAthlete = (a: any): Athlete | null => {
  if (!a) return null
  return {
    id: a.id,
    name: a.name,
    country: a.country ?? '',
    countryFlag: countryFlag(a.country ?? ''),
    photoUrl: a.photo_url ?? undefined,
    currentT: Number(a.current_price ?? 0),
    deltaT: Number(a.price_change ?? 0),
    rank: a.pto_rank ?? undefined,
  }
}

// ── page ─────────────────────────────────────────────────────────────────────

export default async function SharePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const today = new Date().toISOString().slice(0, 10)

  const [
    { data: risingRaw },
    { data: fallingRaw },
    { data: upcomingRacesRaw },
    { data: finishedRacesRaw },
    { data: profileRaw },
    { data: portfolioRaw },
    { data: memberLeagues },
  ] = await Promise.all([
    admin
      .from('athletes')
      .select('id, name, country, current_price, price_change, photo_url, pto_rank')
      .gt('price_change', 0)
      .order('price_change', { ascending: false })
      .limit(7),

    admin
      .from('athletes')
      .select('id, name, country, current_price, price_change, photo_url, pto_rank')
      .lt('price_change', 0)
      .order('price_change', { ascending: true })
      .limit(7),

    // All upcoming/open races with startlists
    admin
      .from('races')
      .select('id, name, date, location, distance, race_athletes(athlete_id, athlete:athletes(id, name, country, current_price, price_change, photo_url, pto_rank))')
      .in('status', ['upcoming', 'open'])
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(20),

    // All finished races (most recent first)
    admin
      .from('races')
      .select('id, name, date, location, distance')
      .eq('status', 'finished')
      .order('date', { ascending: false })
      .limit(20),

    admin
      .from('profiles')
      .select('name, wallet')
      .eq('id', user.id)
      .single(),

    admin
      .from('portfolio')
      .select('athlete_id, athlete:athletes(id, name, country, current_price, price_change, photo_url, pto_rank)')
      .eq('user_id', user.id),

    admin
      .from('league_members')
      .select('league:leagues(id, name, is_global)')
      .eq('user_id', user.id),
  ])

  // ── Rising / Falling ──────────────────────────────────────────────────────
  const rising  = (risingRaw  ?? []).map(mapAthlete).filter(Boolean) as Athlete[]
  const falling = (fallingRaw ?? []).map(mapAthlete).filter(Boolean) as Athlete[]

  // ── Upcoming races (for race-preview) ─────────────────────────────────────
  const upcomingRaces = (upcomingRacesRaw ?? [])
    .filter((r: any) => (r.race_athletes?.length ?? 0) > 0)
    .map((r: any) => {
      const raceDate  = new Date(r.date).getTime()
      const todayMs   = new Date(today).getTime()
      const daysUntil = Math.round((raceDate - todayMs) / 86400000)
      const favorites = (r.race_athletes as any[])
        .map((ra: any) => mapAthlete(ra.athlete))
        .filter((a): a is Athlete => !!a?.id)
        .sort((a: Athlete, b: Athlete) => b.currentT - a.currentT)
        .slice(0, 5)
      return {
        race: { id: r.id, name: r.name, date: r.date, location: r.location ?? '', distance: r.distance ?? '' } as Race,
        favorites,
        daysUntil,
      }
    })

  // ── Finished races with results (for race-recap) ───────────────────────────
  // Fetch podiums for all finished races in one query, then group
  const finishedIds = (finishedRacesRaw ?? []).map((r: any) => r.id)

  let podiumsByRace: Record<string, PodiumEntry[]> = {}
  if (finishedIds.length > 0) {
    const { data: allResults } = await admin
      .from('results')
      .select('race_id, pro_pos, finish_time, athlete:athletes(id, name, country, current_price, price_change, photo_url, pto_rank)')
      .in('race_id', finishedIds)
      .not('pro_pos', 'is', null)
      .lte('pro_pos', 3)
      .order('race_id')
      .order('pro_pos', { ascending: true })

    for (const r of (allResults ?? [])) {
      if (!podiumsByRace[r.race_id]) podiumsByRace[r.race_id] = []
      const pos = podiumsByRace[r.race_id].length + 1
      const winner = podiumsByRace[r.race_id][0]
      let gap = '—'
      if (pos > 1 && winner?.time && r.finish_time) {
        const toSec = (t: string) => t.split(':').reduce((acc, v, i, a) => acc + Number(v) * Math.pow(60, a.length - 1 - i), 0)
        const diff = toSec(r.finish_time) - toSec(winner.time)
        const m = Math.floor(diff / 60)
        const s = diff % 60
        gap = `+${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      }
      const mappedAthlete = mapAthlete((r as any).athlete)
      if (!mappedAthlete) continue
      podiumsByRace[r.race_id].push({
        athlete: mappedAthlete,
        time: r.finish_time ?? '—',
        gap,
      })
    }
  }

  const finishedRaces = (finishedRacesRaw ?? []).map((r: any) => ({
    race: { id: r.id, name: r.name, date: r.date, location: r.location ?? '', distance: r.distance ?? '' } as Race,
    podium: podiumsByRace[r.id] ?? [],
  }))

  // ── My Roster ─────────────────────────────────────────────────────────────
  let roster: Roster | null = null
  if (portfolioRaw && portfolioRaw.length > 0) {
    const athletes  = portfolioRaw.map((p: any) => mapAthlete(p.athlete)).filter((a): a is Athlete => !!a?.id)
    const athletesT = athletes.reduce((sum, a) => sum + a.currentT, 0)
    const walletT   = Number(profileRaw?.wallet ?? 0)
    roster = {
      trixerName: profileRaw?.name ?? 'Trixer',
      leagueName: 'Global Trix League',
      athletes,
      totalT: Math.round(walletT + athletesT),
    }
  }

  // ── League Standings ──────────────────────────────────────────────────────
  let leagueStandings: { leagueName: string; standings: LeagueStanding[] } | null = null
  const firstLeague = (memberLeagues ?? [])
    .map((m: any) => m.league)
    .find((l: any) => l && !l.is_global)

  if (firstLeague) {
    const { data: leagueMembers } = await admin
      .from('league_members')
      .select('user_id')
      .eq('league_id', firstLeague.id)

    const memberIds = (leagueMembers ?? []).map((m: any) => m.user_id)

    if (memberIds.length > 0) {
      const [{ data: memberProfiles }, { data: memberPortfolios }] = await Promise.all([
        admin.from('profiles').select('id, name, wallet').in('id', memberIds),
        admin.from('portfolio').select('user_id, athlete:athletes(current_price)').in('user_id', memberIds),
      ])

      const athletesByUser: Record<string, number> = {}
      for (const p of memberPortfolios ?? []) {
        athletesByUser[p.user_id] = (athletesByUser[p.user_id] ?? 0) + Number((p.athlete as any)?.current_price ?? 0)
      }

      const standings: LeagueStanding[] = (memberProfiles ?? [])
        .map((p: any) => {
          const walletT   = Number(p.wallet ?? 0)
          const athletesT = athletesByUser[p.id] ?? 0
          return {
            position:  0,
            name:      p.name ?? 'Trixer',
            walletT:   Math.round(walletT),
            athletesT: Math.round(athletesT),
            totalT:    Math.round(walletT + athletesT),
            initials:  (p.name ?? 'T').split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase(),
          }
        })
        .sort((a: LeagueStanding, b: LeagueStanding) => b.totalT - a.totalT)
        .map((s: LeagueStanding, i: number) => ({ ...s, position: i + 1 }))

      leagueStandings = { leagueName: firstLeague.name, standings }
    }
  }

  return (
    <Suspense>
      <SharePageClient
        rising={rising}
        falling={falling}
        upcomingRaces={upcomingRaces}
        finishedRaces={finishedRaces}
        roster={roster}
        leagueStandings={leagueStandings}
      />
    </Suspense>
  )
}
