/**
 * Dynamic market: adjusts athlete prices after each race result.
 *
 * Rules:
 *  PRO  — 1st: +4 | 2nd-3rd: +3 | 4th-5th: +2 | 6th-10th: +1
 *          11th-20th: 0 | 21st+: −1 | DNF/DNS: −2
 *          Segment leader: +1 each | Course record: +2
 *
 *  AG   — 1st: +3 | 2nd-3rd: +2 | top 25%: +1 | 25-50%: 0
 *          50-75%: −1 | 75%+: −1 | DNF/DNS: −2
 *          Segment leader in AG: +1 each | Kona slot: +2
 *
 * Prices are clamped between T$1 and T$35.
 * After updating athletes.current_price, all open/upcoming
 * race_athletes rows for that athlete are also updated.
 */

import { createAdminClient } from '~/lib/supabase/server'

export interface MarketUpdate {
  athlete_id: string
  athlete_name: string
  old_price: number
  new_price: number
  delta: number
  reasons: string[]
}

const MIN_PRICE = 1
const MAX_PRICE = 35

function proMarketDelta(
  pos: number | null,
  dnf: boolean,
  dns: boolean,
  swimFastest: boolean,
  bikeFastest: boolean,
  runFastest: boolean,
  courseRecord: boolean,
): { delta: number; reasons: string[] } {
  const reasons: string[] = []
  let delta = 0

  if (dns)      { delta -= 2; reasons.push('DNS −2') }
  else if (dnf) { delta -= 2; reasons.push('DNF −2') }
  else {
    const p = pos ?? 99
    if      (p === 1)       { delta += 4; reasons.push('1º lugar +4') }
    else if (p <= 3)        { delta += 3; reasons.push(`${p}º lugar +3`) }
    else if (p <= 5)        { delta += 2; reasons.push(`${p}º lugar +2`) }
    else if (p <= 10)       { delta += 1; reasons.push(`${p}º lugar +1`) }
    else if (p <= 20)       {             reasons.push(`${p}º lugar 0`) }
    else                    { delta -= 1; reasons.push(`${p}º lugar −1`) }

    if (swimFastest) { delta += 1; reasons.push('Melhor natação +1') }
    if (bikeFastest) { delta += 1; reasons.push('Melhor bike +1') }
    if (runFastest)  { delta += 1; reasons.push('Melhor corrida +1') }
    if (courseRecord){ delta += 2; reasons.push('Course record +2') }
  }

  return { delta, reasons }
}

function agMarketDelta(
  pos: number | null,
  total: number,
  dnf: boolean,
  dns: boolean,
  swimFastest: boolean,
  bikeFastest: boolean,
  runFastest: boolean,
  konaSlot: boolean,
): { delta: number; reasons: string[] } {
  const reasons: string[] = []
  let delta = 0

  if (dns)      { delta -= 2; reasons.push('DNS −2') }
  else if (dnf) { delta -= 2; reasons.push('DNF −2') }
  else {
    const p = pos ?? 99
    const pct = total > 0 ? p / total : 1

    if      (p === 1)       { delta += 3; reasons.push('1º no AG +3') }
    else if (p <= 3)        { delta += 2; reasons.push(`${p}º no AG +2`) }
    else if (pct <= 0.25)   { delta += 1; reasons.push('Top 25% +1') }
    else if (pct <= 0.50)   {             reasons.push('Top 50% 0') }
    else                    { delta -= 1; reasons.push('Abaixo 50% −1') }

    if (swimFastest) { delta += 1; reasons.push('Melhor natação no AG +1') }
    if (bikeFastest) { delta += 1; reasons.push('Melhor bike no AG +1') }
    if (runFastest)  { delta += 1; reasons.push('Melhor corrida no AG +1') }
    if (konaSlot)    { delta += 2; reasons.push('Kona slot +2') }
  }

  return { delta, reasons }
}

export async function updateMarket(raceId: string): Promise<MarketUpdate[]> {
  const supabase = createAdminClient()

  // Fetch results with athlete data
  const { data: results } = await supabase
    .from('results')
    .select('*, athlete:athletes(id, name, type, age_group, gender, current_price)')
    .eq('race_id', raceId)

  if (!results?.length) return []

  const finishers = results.filter(r => !r.dnf && !r.dns)

  // Best times PRO
  const proFinishers = finishers.filter(r => (r.athlete as any)?.type === 'pro')
  const bestSwimPro  = Math.min(...proFinishers.map(r => r.swim_time ?? Infinity))
  const bestBikePro  = Math.min(...proFinishers.map(r => r.bike_time ?? Infinity))
  const bestRunPro   = Math.min(...proFinishers.map(r => r.run_time  ?? Infinity))

  // Best times per AG
  const agFinishers = finishers.filter(r => (r.athlete as any)?.type === 'age_grouper')
  const agGroups: Record<string, typeof agFinishers> = {}
  for (const r of agFinishers) {
    const key = (r.athlete as any)?.age_group ?? '__ag__'
    agGroups[key] = agGroups[key] ?? []
    agGroups[key].push(r)
  }
  const bestInAg = (ag: string, field: 'swim_time' | 'bike_time' | 'run_time') =>
    Math.min(...(agGroups[ag] ?? []).map(r => r[field] ?? Infinity))

  const updates: MarketUpdate[] = []

  for (const r of results) {
    const athlete = r.athlete as any
    if (!athlete?.id) continue

    const oldPrice = Number(athlete.current_price ?? 10)
    let delta = 0
    let reasons: string[] = []

    if (athlete.type === 'pro') {
      const res = proMarketDelta(
        r.pro_pos, r.dnf, r.dns,
        r.swim_time === bestSwimPro,
        r.bike_time === bestBikePro,
        r.run_time  === bestRunPro,
        r.kona_slot ?? false,
      )
      delta = res.delta; reasons = res.reasons
    } else {
      const ag = athlete.age_group ?? '__ag__'
      const total = agGroups[ag]?.length ?? 1
      const res = agMarketDelta(
        r.ag_pos, total, r.dnf, r.dns,
        r.swim_time === bestInAg(ag, 'swim_time'),
        r.bike_time === bestInAg(ag, 'bike_time'),
        r.run_time  === bestInAg(ag, 'run_time'),
        r.kona_slot ?? false,
      )
      delta = res.delta; reasons = res.reasons
    }

    const newPrice = Math.min(MAX_PRICE, Math.max(MIN_PRICE, oldPrice + delta))
    const actualDelta = newPrice - oldPrice

    // Update athlete current_price
    await supabase
      .from('athletes')
      .update({ current_price: newPrice, price_change: actualDelta })
      .eq('id', athlete.id)

    // Propagate to open/upcoming races
    const { data: futurePart } = await supabase
      .from('race_athletes')
      .select('id, race_id, races!inner(status)')
      .eq('athlete_id', athlete.id)
      .in('races.status', ['open', 'upcoming'])

    if (futurePart?.length) {
      await supabase
        .from('race_athletes')
        .update({ price: newPrice })
        .in('id', futurePart.map(rp => rp.id))
    }

    updates.push({
      athlete_id:   athlete.id,
      athlete_name: athlete.name,
      old_price:    oldPrice,
      new_price:    newPrice,
      delta:        actualDelta,
      reasons,
    })
  }

  return updates
}
