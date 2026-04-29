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

    const secsToHms = (secs: number) => {
      const h = Math.floor(secs / 3600)
      const m = Math.floor((secs % 3600) / 60)
      const s = secs % 60
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }

    for (const r of (allResults ?? [])) {
      if (!podiumsByRace[r.race_id]) podiumsByRace[r.race_id] = []
      const pos = podiumsByRace[r.race_id].length + 1
      const winnerSecs: number | null = (podiumsByRace[r.race_id][0] as any)?._rawSecs ?? null
      let gap = '—'
      if (pos > 1 && winnerSecs != null && r.finish_time != null) {
        const diff = (r.finish_time as number) - winnerSecs
        const m = Math.floor(diff / 60)
        const s = diff % 60
        gap = `+${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      }
      const mappedAthlete = mapAthlete((r as any).athlete)
      if (!mappedAthlete) continue
      const entry: PodiumEntry & { _rawSecs?: number } = {
        athlete: mappedAthlete,
        time: r.finish_time != null ? secsToHms(r.finish_time as number) : '—',
        gap,
        _rawSecs: r.finish_time != null ? (r.finish_time as number) : undefined,
      }
      podiumsByRace[r.race_id].push(entry)
    }

    // strip the helper field before passing to client
    for (const raceId of Object.keys(podiumsByRace)) {
      podiumsByRace[raceId] = podiumsByRace[raceId].map(({ _rawSecs: _, ...rest }: any) => rest)
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

  // ── League Standings (all non-global leagues) ─────────────────────────────
  const allLeagues = (memberLeagues ?? [])
    .map((m: any) => m.league)
    .filter((l: any) => l && !l.is_global)

  const allLeagueStandings: { leagueId: string; leagueName: string; standings: LeagueStanding[] }[] = []

  for (const league of allLeagues) {
    const { data: leagueMembers } = await admin
      .from('league_members')
      .select('user_id')
      .eq('league_id', league.id)

    const memberIds = (leagueMembers ?? []).map((m: any) => m.user_id)
    if (memberIds.length === 0) continue

    const [{ data: memberProfiles }, { data: memberPortfolios }] = await Promise.all([
      admin.from('profiles').select('id, name, wallet, photo_url').in('id', memberIds),
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
          initials:  (p.name ?? 'T').split(' ').slice(0, 2).map((w: string) => w[0] ?? '').join('').toUpperCase(),
          avatarUrl: (p as any).photo_url ?? undefined,
        }
      })
      .sort((a: LeagueStanding, b: LeagueStanding) => b.totalT - a.totalT)
      .map((s: LeagueStanding, i: number) => ({ ...s, position: i + 1 }))

    allLeagueStandings.push({ leagueId: league.id, leagueName: league.name, standings })
  }

  return (
    <Suspense>
      <SharePageClient
        rising={rising}
        falling={falling}
        upcomingRaces={upcomingRaces}
        finishedRaces={finishedRaces}
        roster={roster}
        allLeagueStandings={allLeagueStandings}
      />
    </Suspense>
  )
}
