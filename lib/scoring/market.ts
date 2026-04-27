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
 *          Segment leader in AG: +1 each
 *
 * Prices are clamped between T$1 and T$35.
 * After updating athletes.current_price, all open/upcoming
 * race_athletes rows for that athlete are also updated.
 */

import { createAdminClient } from '~/lib/supabase/server'

export interface MarketBreakdownItem {
  code: string
  label: string
  delta: number
  category: 'position' | 'segment' | 'status' | 'ranking' | 'manual'
  metadata?: Record<string, unknown>
}

export interface MarketUpdate {
  athlete_id: string
  athlete_name: string
  old_price: number
  new_price: number
  delta: number
  reasons: string[]
  breakdown: MarketBreakdownItem[]
}

const MIN_PRICE = 1

interface MarketDeltaResult {
  delta: number
  reasons: string[]
  breakdown: MarketBreakdownItem[]
}

function addBreakdown(
  breakdown: MarketBreakdownItem[],
  reasons: string[],
  item: MarketBreakdownItem,
) {
  breakdown.push(item)
  reasons.push(item.label)
}

function proMarketDelta(
  pos: number | null,
  dnf: boolean,
  dns: boolean,
  swimFastest: boolean,
  bikeFastest: boolean,
  runFastest: boolean,
  courseRecord: boolean, // reserved, unused
): MarketDeltaResult {
  const reasons: string[] = []
  const breakdown: MarketBreakdownItem[] = []
  let delta = 0

  if (dns) {
    delta -= 2
    addBreakdown(breakdown, reasons, {
      code: 'dns',
      label: 'DNS −2',
      delta: -2,
      category: 'status',
    })
  } else if (dnf) {
    delta -= 2
    addBreakdown(breakdown, reasons, {
      code: 'dnf',
      label: 'DNF −2',
      delta: -2,
      category: 'status',
    })
  }
  else {
    const p = pos ?? 99
    let positionDelta = 0
    let positionLabel = `${p}º lugar 0`

    if (p === 1) {
      positionDelta = 4
      positionLabel = '1º lugar +4'
    } else if (p <= 3) {
      positionDelta = 3
      positionLabel = `${p}º lugar +3`
    } else if (p <= 5) {
      positionDelta = 2
      positionLabel = `${p}º lugar +2`
    } else if (p <= 10) {
      positionDelta = 1
      positionLabel = `${p}º lugar +1`
    } else if (p > 20) {
      positionDelta = -1
      positionLabel = `${p}º lugar −1`
    }

    delta += positionDelta
    addBreakdown(breakdown, reasons, {
      code: 'pro_position',
      label: positionLabel,
      delta: positionDelta,
      category: 'position',
      metadata: { position: p },
    })

    if (swimFastest) {
      delta += 1
      addBreakdown(breakdown, reasons, {
        code: 'fastest_swim_overall',
        label: 'Melhor natação +1',
        delta: 1,
        category: 'segment',
      })
    }
    if (bikeFastest) {
      delta += 1
      addBreakdown(breakdown, reasons, {
        code: 'fastest_bike_overall',
        label: 'Melhor bike +1',
        delta: 1,
        category: 'segment',
      })
    }
    if (runFastest) {
      delta += 1
      addBreakdown(breakdown, reasons, {
        code: 'fastest_run_overall',
        label: 'Melhor corrida +1',
        delta: 1,
        category: 'segment',
      })
    }
    if (courseRecord) {
      delta += 2
      addBreakdown(breakdown, reasons, {
        code: 'course_record',
        label: 'Course record +2',
        delta: 2,
        category: 'segment',
      })
    }
  }

  return { delta, reasons, breakdown }
}

function agMarketDelta(
  pos: number | null,
  total: number,
  dnf: boolean,
  dns: boolean,
  swimFastest: boolean,
  bikeFastest: boolean,
  runFastest: boolean,
): MarketDeltaResult {
  const reasons: string[] = []
  const breakdown: MarketBreakdownItem[] = []
  let delta = 0

  if (dns) {
    delta -= 2
    addBreakdown(breakdown, reasons, {
      code: 'dns',
      label: 'DNS −2',
      delta: -2,
      category: 'status',
    })
  } else if (dnf) {
    delta -= 2
    addBreakdown(breakdown, reasons, {
      code: 'dnf',
      label: 'DNF −2',
      delta: -2,
      category: 'status',
    })
  }
  else {
    const p = pos ?? 99
    const pct = total > 0 ? p / total : 1
    let positionDelta = 0
    let positionLabel = 'Top 50% 0'

    if (p === 1) {
      positionDelta = 3
      positionLabel = '1º no AG +3'
    } else if (p <= 3) {
      positionDelta = 2
      positionLabel = `${p}º no AG +2`
    } else if (pct <= 0.25) {
      positionDelta = 1
      positionLabel = 'Top 25% +1'
    } else if (pct > 0.50) {
      positionDelta = -1
      positionLabel = 'Abaixo 50% −1'
    }

    delta += positionDelta
    addBreakdown(breakdown, reasons, {
      code: 'ag_position',
      label: positionLabel,
      delta: positionDelta,
      category: 'position',
      metadata: { position: p, total_finishers: total, percentile: pct },
    })

    if (swimFastest) {
      delta += 1
      addBreakdown(breakdown, reasons, {
        code: 'fastest_swim_ag',
        label: 'Melhor natação no AG +1',
        delta: 1,
        category: 'segment',
      })
    }
    if (bikeFastest) {
      delta += 1
      addBreakdown(breakdown, reasons, {
        code: 'fastest_bike_ag',
        label: 'Melhor bike no AG +1',
        delta: 1,
        category: 'segment',
      })
    }
    if (runFastest) {
      delta += 1
      addBreakdown(breakdown, reasons, {
        code: 'fastest_run_ag',
        label: 'Melhor corrida no AG +1',
        delta: 1,
        category: 'segment',
      })
    }
  }

  return { delta, reasons, breakdown }
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

  // Best times PRO — computed separately per gender
  const proFinishers = finishers.filter(r => (r.athlete as any)?.type === 'pro')
  const proMen   = proFinishers.filter(r => (r.athlete as any)?.gender === 'M')
  const proWomen = proFinishers.filter(r => (r.athlete as any)?.gender === 'F')

  const bestOf = (arr: typeof proFinishers, field: 'swim_time' | 'bike_time' | 'run_time') =>
    Math.min(...arr.map(r => r[field] ?? Infinity))

  const bestSwimM = bestOf(proMen,   'swim_time')
  const bestBikeM = bestOf(proMen,   'bike_time')
  const bestRunM  = bestOf(proMen,   'run_time')
  const bestSwimF = bestOf(proWomen, 'swim_time')
  const bestBikeF = bestOf(proWomen, 'bike_time')
  const bestRunF  = bestOf(proWomen, 'run_time')

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
    let breakdown: MarketBreakdownItem[] = []

    if (athlete.type === 'pro') {
      const isMale = athlete.gender === 'M'
      const bSwim = isMale ? bestSwimM : bestSwimF
      const bBike = isMale ? bestBikeM : bestBikeF
      const bRun  = isMale ? bestRunM  : bestRunF
      const res = proMarketDelta(
        r.pro_pos, r.dnf, r.dns,
        r.swim_time === bSwim,
        r.bike_time === bBike,
        r.run_time  === bRun,
        false,
      )
      delta = res.delta; reasons = res.reasons; breakdown = res.breakdown
    } else {
      const ag = athlete.age_group ?? '__ag__'
      const total = agGroups[ag]?.length ?? 1
      const res = agMarketDelta(
        r.ag_pos, total, r.dnf, r.dns,
        r.swim_time === bestInAg(ag, 'swim_time'),
        r.bike_time === bestInAg(ag, 'bike_time'),
        r.run_time  === bestInAg(ag, 'run_time'),
      )
      delta = res.delta; reasons = res.reasons; breakdown = res.breakdown
    }

    const newPrice = Math.max(MIN_PRICE, oldPrice + delta)
    const actualDelta = newPrice - oldPrice

    // Update athlete current_price
    await supabase
      .from('athletes')
      .update({ current_price: newPrice, price_change: actualDelta })
      .eq('id', athlete.id)

    // Log price change to history
    await supabase.from('athlete_price_history').insert({
      athlete_id: athlete.id,
      old_price: oldPrice,
      price: newPrice,
      new_price: newPrice,
      change: actualDelta,
      reason: 'race_result',
      race_id: raceId,
      breakdown,
      context: {
        athlete_type: athlete.type,
        athlete_gender: athlete.gender,
        age_group: athlete.age_group ?? null,
        result: {
          overall_pos: r.overall_pos,
          pro_pos: r.pro_pos,
          ag_pos: r.ag_pos,
          dnf: r.dnf,
          dns: r.dns,
        },
        raw_delta: delta,
        applied_delta: actualDelta,
        clamped_by_floor: newPrice !== oldPrice + delta,
        min_price: MIN_PRICE,
      },
    })

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
      breakdown,
    })
  }

  return updates
}
