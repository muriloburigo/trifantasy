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
    .select('id, name, date, status')
    .in('status', ['open', 'upcoming', 'locked'])
    .order('date', { ascending: true })
    .limit(1)

  if (!races?.length) return { locked: false }

  const race = races[0]

  // Race date at midnight UTC
  const raceDate = new Date(race.date + 'T00:00:00Z')
  const hoursUntil = (raceDate.getTime() - now.getTime()) / (1000 * 60 * 60)

  // Lock if race status is 'locked' OR within 24h
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
  const raceDate = new Date(dateStr + 'T00:00:00Z')
  const h = Math.round((raceDate.getTime() - now.getTime()) / (1000 * 60 * 60))
  if (h <= 0) return 'Em andamento'
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return `${d} dia${d !== 1 ? 's' : ''}`
}
