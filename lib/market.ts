import type { SupabaseClient } from '@supabase/supabase-js'

export interface MarketStatus {
  locked: boolean
  reasonKey?: 'ongoing' | 'closingSoon'
  lockRace?: { id: string; name: string; date: string }
}

/**
 * Market is locked when the closest upcoming/open race is ≤24h away.
 * It reopens automatically once that race is marked 'finished'.
 */
export async function getMarketStatus(supabase: SupabaseClient): Promise<MarketStatus> {
  const now = new Date()

  // Find the earliest open/upcoming race
  const { data: races } = await supabase
    .from('races')
    .select('id, name, slug, date, status')
    .in('status', ['open', 'upcoming', 'locked'])
    .order('date', { ascending: true })
    .limit(1)

  if (!races?.length) return { locked: false }

  const race = races[0] as any

  // Race start is assumed at 23:00 UTC (= 20:00 BRT / 08:00 AEST) on race day.
  // Market locks 24h before that, i.e. 23:00 UTC the day before.
  const raceDate = new Date(race.date + 'T23:00:00Z')
  const hoursUntil = (raceDate.getTime() - now.getTime()) / (1000 * 60 * 60)

  // Lock if race status is 'locked' OR within 24h of race start
  if (race.status === 'locked' || hoursUntil <= 24) {
    return {
      locked: true,
      reasonKey: hoursUntil <= 0 ? 'ongoing' : 'closingSoon',
      lockRace: race,
    }
  }

  return { locked: false }
}

export function formatHoursUntil(dateStr: string): string {
  const now = new Date()
  const raceDate = new Date(dateStr + 'T23:00:00Z')
  const h = Math.round((raceDate.getTime() - now.getTime()) / (1000 * 60 * 60))
  if (h <= 0) return 'Em andamento'
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d} dia${d !== 1 ? 's' : ''}`
}
