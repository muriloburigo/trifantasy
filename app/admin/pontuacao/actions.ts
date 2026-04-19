'use server'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/auth/require-admin'
import { scoreAthlete, type AthleteForScoring } from '~/lib/scoring/calculate'
import { updateMarket } from '~/lib/scoring/market'

export async function calculateScores(raceId: string): Promise<{
  success?: boolean
  teamsScored?: number
  error?: string
  marketUpdates?: import('~/lib/scoring/market').MarketUpdate[]
}> {
  await requireAdmin()
  const supabase = createAdminClient()

  // 1. Fetch all results for this race
  const { data: results, error: rErr } = await supabase
    .from('results')
    .select('*, athlete:athletes(id, name, type, age_group, gender)')
    .eq('race_id', raceId)

  if (rErr || !results?.length) return { error: 'Nenhum resultado encontrado para esta prova.' }

  // 2. Pre-compute context for bonuses

  // Best overall swim/bike/run (among all finishers)
  const finishers = results.filter(r => !r.dnf && !r.dns)
  const best = (field: 'swim_time' | 'bike_time' | 'run_time') =>
    Math.min(...finishers.map(r => r[field] ?? Infinity))

  const bestSwimOverall = best('swim_time')
  const bestBikeOverall = best('bike_time')
  const bestRunOverall  = best('run_time')

  // Best per AG
  const agGroups: Record<string, typeof results> = {}
  for (const r of finishers) {
    const ag = (r.athlete as any)?.age_group ?? '__pro__'
    if (!agGroups[ag]) agGroups[ag] = []
    agGroups[ag].push(r)
  }

  const bestInAg = (ag: string, field: 'swim_time' | 'bike_time' | 'run_time') =>
    Math.min(...(agGroups[ag] ?? []).map((r: any) => r[field] ?? Infinity))

  // AG total finishers
  const agTotals: Record<string, number> = {}
  for (const [ag, rows] of Object.entries(agGroups)) {
    agTotals[ag] = rows.length
  }

  // 3. Build scoring input per result
  const athleteInputs: AthleteForScoring[] = results.map(r => {
    const athlete = r.athlete as any
    const ag = athlete?.age_group ?? '__pro__'
    const isPro = athlete?.type === 'pro'

    return {
      athlete_id:   athlete?.id ?? '',
      athlete_name: athlete?.name ?? '',
      type:         athlete?.type ?? 'age_grouper',
      result:       r as any,
      fastest_swim_overall: isPro ? bestSwimOverall : undefined,
      fastest_bike_overall: isPro ? bestBikeOverall : undefined,
      fastest_run_overall:  isPro ? bestRunOverall  : undefined,
      fastest_swim_ag: !isPro ? bestInAg(ag, 'swim_time') : undefined,
      fastest_bike_ag: !isPro ? bestInAg(ag, 'bike_time') : undefined,
      fastest_run_ag:  !isPro ? bestInAg(ag, 'run_time')  : undefined,
      ag_total_finishers: !isPro ? agTotals[ag] : undefined,
    }
  })

  // 4. Score each athlete
  const breakdownByAthlete: Record<string, ReturnType<typeof scoreAthlete>> = {}
  for (const input of athleteInputs) {
    breakdownByAthlete[input.athlete_id] = scoreAthlete(input)
  }

  // 5. Fetch all teams (global — not race-specific)
  const { data: teams } = await supabase
    .from('teams')
    .select('id, team_athletes(athlete_id)')

  if (!teams?.length) return { error: 'Nenhum time encontrado.' }

  // 6. Calculate and upsert scores for each team (only athletes in this race count)
  let teamsScored = 0
  for (const team of teams) {
    const athleteIds = (team.team_athletes as any[]).map((ta: any) => ta.athlete_id)
    const breakdown = athleteIds.map(id => breakdownByAthlete[id]).filter(Boolean)
    const total = breakdown.reduce((sum, b) => sum + (b?.total ?? 0), 0)

    await supabase.from('scores').upsert(
      { team_id: team.id, race_id: raceId, total_points: total, breakdown, calculated_at: new Date().toISOString() },
      { onConflict: 'team_id,race_id' }
    )
    teamsScored++
  }

  // 7. Mark race as finished
  await supabase.from('races').update({ status: 'finished' }).eq('id', raceId)

  // 8. Update dynamic market prices
  const marketUpdates = await updateMarket(raceId)

  revalidatePath('/')
  revalidatePath('/admin/pontuacao')
  revalidatePath('/admin/mercado')

  return { success: true, teamsScored, marketUpdates }
}
