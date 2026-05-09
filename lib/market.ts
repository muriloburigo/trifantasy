import type { SupabaseClient } from '@supabase/supabase-js'

export interface MarketStatus {
  locked: boolean
  reasonKey?: 'ongoing' | 'closingSoon' | 'admin'
  lockRace?: { id: string; name: string; date: string }
  override?: boolean | null  // null = auto, true = force open, false = force closed
}

/**
 * Market is locked when the closest upcoming/open race is ≤24h away.
 * It reopens automatically once that race is marked 'finished'.
 * Admins can override this via the settings table (market_override key).
 */
export async function getMarketStatus(supabase: SupabaseClient): Promise<MarketStatus> {
  // Check for admin override first
  const { data: settingRows } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'market_override')
    .limit(1)

  const override = settingRows?.[0]?.value as boolean | null | undefined

  if (override === true)  return { locked: false, override: true }
  if (override === false) return { locked: true, reasonKey: 'admin', override: false }

  // Auto mode: compute from race schedule
  const now = new Date()

  const { data: races } = await supabase
    .from('races')
    .select('id, name, slug, date, status')
    .in('status', ['open', 'upcoming', 'locked'])
    .order('date', { ascending: true })
    .limit(1)

  if (!races?.length) return { locked: false, override: null }

  const race = races[0] as any

  // Race start is assumed at 23:00 UTC (= 20:00 BRT / 08:00 AEST) on race day.
  // Market locks 24h before that, i.e. 23:00 UTC the day before.
  const raceDate = new Date(race.date + 'T23:00:00Z')
  const hoursUntil = (raceDate.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (race.status === 'locked' || hoursUntil <= 24) {
    return {
      locked: true,
      reasonKey: hoursUntil <= 0 ? 'ongoing' : 'closingSoon',
      lockRace: race,
      override: null,
    }
  }

  return { locked: false, override: null }
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
