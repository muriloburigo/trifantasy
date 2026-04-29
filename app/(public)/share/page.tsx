import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '~/lib/supabase/server'
import type { Athlete, Race, PodiumEntry, Roster, LeagueStanding } from '~/lib/trixerTypes'
import SharePageClient from './SharePageClient'

// ── helpers ──────────────────────────────────────────────────────────────────

const countryFlag = (iso: string) =>
  (iso ?? '').toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)))

const mapAthlete = (a: any): Athlete => ({
  id: a.id,
  name: a.name,
  country: a.country ?? '',
  countryFlag: countryFlag(a.country ?? ''),
  photoUrl: a.photo_url ?? undefined,
  currentT: Number(a.current_price ?? 0),
  deltaT: Number(a.price_change ?? 0),
  rank: a.pto_rank ?? undefined,
})

// ── page ─────────────────────────────────────────────────────────────────────

export default async function SharePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // ── Parallel fetches ──────────────────────────────────────────────────────

  const [
    { data: risingRaw },
    { data: fallingRaw },
    { data: nextRaceRaw },
    { data: profileRaw },
    { data: portfolioRaw },
    { data: memberLeagues },
  ] = await Promise.all([
    // Rising athletes (sorted by price_change desc)
    admin
      .from('athletes')
      .select('id, name, country, current_price, price_change, photo_url, pto_rank')
      .gt('price_change', 0)
      .order('price_change', { ascending: false })
      .limit(7),

    // Falling athletes
    admin
      .from('athletes')
      .select('id, name, country, current_price, price_change, photo_url, pto_rank')
      .lt('price_change', 0)
      .order('price_change', { ascending: true })
      .limit(7),

    // Next upcoming race with startlist
    admin
      .from('races')
      .select('id, name, date, location, distance, race_athletes(athlete_id, athlete:athletes(id, name, country, current_price, price_change, photo_url, pto_rank))')
      .in('status', ['upcoming', 'open'])
      .gte('date', new Date().toISOString().slice(0, 10))
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle(),

    // Current user profile
    admin
      .from('profiles')
      .select('name, wallet')
      .eq('id', user.id)
      .single(),

    // User portfolio
    admin
      .from('portfolio')
      .select('athlete_id, athlete:athletes(id, name, country, current_price, price_change, photo_url, pto_rank)')
      .eq('user_id', user.id),

    // User league memberships (non-global)
    admin
      .from('league_members')
      .select('league:leagues(id, name, is_global)')
      .eq('user_id', user.id),
  ])

  // ── Rising / Falling ──────────────────────────────────────────────────────
  const rising  = (risingRaw  ?? []).map(mapAthlete)
  const falling = (fallingRaw ?? []).map(mapAthlete)

  // ── Next race ─────────────────────────────────────────────────────────────
  let nextRace: { race: Race; favorites: Athlete[]; daysUntil: number } | null = null
  if (nextRaceRaw) {
    const raceDate  = new Date(nextRaceRaw.date).getTime()
    const today     = new Date(new Date().toISOString().slice(0, 10)).getTime()
    const daysUntil = Math.round((raceDate - today) / 86400000)

    const favorites = ((nextRaceRaw as any).race_athletes ?? [])
      .map((ra: any) => mapAthlete(ra.athlete))
      .filter((a: Athlete) => a.id)
      .sort((a: Athlete, b: Athlete) => b.currentT - a.currentT)
      .slice(0, 5)

    nextRace = {
      race: {
        id:       nextRaceRaw.id,
        name:     nextRaceRaw.name,
        date:     nextRaceRaw.date,
        location: nextRaceRaw.location ?? '',
        distance: nextRaceRaw.distance ?? '',
      },
      favorites,
      daysUntil,
    }
  }

  // ── My Roster ─────────────────────────────────────────────────────────────
  let roster: Roster | null = null
  if (portfolioRaw && portfolioRaw.length > 0) {
    const athletes = portfolioRaw.map((p: any) => mapAthlete(p.athlete)).filter((a) => a.id)
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
        admin
          .from('profiles')
          .select('id, name, wallet')
          .in('id', memberIds),
        admin
          .from('portfolio')
          .select('user_id, athlete:athletes(current_price)')
          .in('user_id', memberIds),
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
            position:  0, // assigned after sort
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
        nextRace={nextRace}
        lastRace={null}
        roster={roster}
        leagueStandings={leagueStandings}
      />
    </Suspense>
  )
}
