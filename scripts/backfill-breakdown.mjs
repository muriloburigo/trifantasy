/**
 * Backfill script — reconstructs breakdown for athlete_price_history entries
 * that were saved with empty or incomplete breakdown arrays.
 *
 * Run: node scripts/backfill-breakdown.mjs
 */
import { createClient } from '../node_modules/@supabase/supabase-js/dist/index.cjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!supabaseUrl || !serviceKey) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.')
  process.exit(1)
}
const sb = createClient(supabaseUrl, serviceKey)

// ── Same breakdown logic as lib/scoring/market.ts ────────────────────────────

function proBreakdown(pos, dnf, dns, swimFastest, bikeFastest, runFastest) {
  const items = []
  if (dns) {
    items.push({ code: 'dns', label: 'DNS −2', delta: -2, category: 'status' })
  } else if (dnf) {
    items.push({ code: 'dnf', label: 'DNF −2', delta: -2, category: 'status' })
  } else {
    const p = pos ?? 99
    let positionDelta = 0
    let positionLabel = `${p}º lugar 0`
    if (p === 1)       { positionDelta = 4;  positionLabel = '1º lugar +4' }
    else if (p <= 3)   { positionDelta = 3;  positionLabel = `${p}º lugar +3` }
    else if (p <= 5)   { positionDelta = 2;  positionLabel = `${p}º lugar +2` }
    else if (p <= 10)  { positionDelta = 1;  positionLabel = `${p}º lugar +1` }
    else if (p > 20)   { positionDelta = -1; positionLabel = `${p}º lugar −1` }
    items.push({ code: 'pro_position', label: positionLabel, delta: positionDelta, category: 'position', metadata: { position: p } })
    if (swimFastest) items.push({ code: 'fastest_swim_overall', label: 'Melhor natação +1', delta: 1, category: 'segment' })
    if (bikeFastest) items.push({ code: 'fastest_bike_overall', label: 'Melhor bike +1',    delta: 1, category: 'segment' })
    if (runFastest)  items.push({ code: 'fastest_run_overall',  label: 'Melhor corrida +1', delta: 1, category: 'segment' })
  }
  return items
}

function agBreakdown(pos, total, dnf, dns, swimFastest, bikeFastest, runFastest) {
  const items = []
  if (dns) {
    items.push({ code: 'dns', label: 'DNS −2', delta: -2, category: 'status' })
  } else if (dnf) {
    items.push({ code: 'dnf', label: 'DNF −2', delta: -2, category: 'status' })
  } else {
    const p = pos ?? 99
    const pct = total > 0 ? p / total : 1
    let positionDelta = 0
    let positionLabel = 'Top 50% 0'
    if (p === 1)         { positionDelta = 3;  positionLabel = '1º no AG +3' }
    else if (p <= 3)     { positionDelta = 2;  positionLabel = `${p}º no AG +2` }
    else if (pct <= 0.25){ positionDelta = 1;  positionLabel = 'Top 25% +1' }
    else if (pct > 0.50) { positionDelta = -1; positionLabel = 'Abaixo 50% −1' }
    items.push({ code: 'ag_position', label: positionLabel, delta: positionDelta, category: 'position', metadata: { position: p, total_finishers: total, percentile: pct } })
    if (swimFastest) items.push({ code: 'fastest_swim_ag', label: 'Melhor natação no AG +1', delta: 1, category: 'segment' })
    if (bikeFastest) items.push({ code: 'fastest_bike_ag', label: 'Melhor bike no AG +1',    delta: 1, category: 'segment' })
    if (runFastest)  items.push({ code: 'fastest_run_ag',  label: 'Melhor corrida no AG +1', delta: 1, category: 'segment' })
  }
  return items
}

// ── Main ─────────────────────────────────────────────────────────────────────

// Fetch all history entries with empty breakdown
const { data: entries, error: err1 } = await sb
  .from('athlete_price_history')
  .select('id, race_id, athlete_id, change, breakdown')
  .eq('reason', 'race_result')
  .order('recorded_at')

if (err1) { console.error('fetch error:', err1.message); process.exit(1) }

const needsFix = (entries ?? []).filter(e => {
  const bd = Array.isArray(e.breakdown) ? e.breakdown : []
  if (bd.length === 0) return true
  // Old bug: has segment bonus but missing position item (and not a DNS/DNF status-only entry)
  const hasPosition = bd.some(i => i.category === 'position')
  const hasStatus   = bd.some(i => i.category === 'status')
  const hasSegment  = bd.some(i => i.category === 'segment')
  if (hasSegment && !hasPosition && !hasStatus) return true
  return false
})
console.log(`Total history entries: ${entries.length} | Need backfill: ${needsFix.length}`)

if (!needsFix.length) { console.log('Nothing to fix.'); process.exit(0) }

// Get unique race IDs
const raceIds = [...new Set(needsFix.map(e => e.race_id))]
console.log(`Races to process: ${raceIds.length}`)

for (const raceId of raceIds) {
  // Fetch all results for this race
  const { data: results } = await sb
    .from('results')
    .select('athlete_id, pro_pos, ag_pos, overall_pos, swim_time, bike_time, run_time, dnf, dns')
    .eq('race_id', raceId)

  if (!results?.length) { console.log(`  Race ${raceId}: no results found, skipping`); continue }

  // Fetch athlete types + genders + age_groups
  const athleteIds = [...new Set(results.map(r => r.athlete_id))]
  const { data: athletes } = await sb
    .from('athletes')
    .select('id, type, gender, age_group')
    .in('id', athleteIds)

  const athleteMap = Object.fromEntries((athletes ?? []).map(a => [a.id, a]))
  const finishers = results.filter(r => !r.dnf && !r.dns)

  // Best times PRO per gender
  const proFinishers = finishers.filter(r => athleteMap[r.athlete_id]?.type === 'pro')
  const bestOf = (arr, field) => arr.length ? Math.min(...arr.map(r => r[field] ?? Infinity)) : Infinity
  const bestSwimM = bestOf(proFinishers.filter(r => athleteMap[r.athlete_id]?.gender === 'M'), 'swim_time')
  const bestBikeM = bestOf(proFinishers.filter(r => athleteMap[r.athlete_id]?.gender === 'M'), 'bike_time')
  const bestRunM  = bestOf(proFinishers.filter(r => athleteMap[r.athlete_id]?.gender === 'M'), 'run_time')
  const bestSwimF = bestOf(proFinishers.filter(r => athleteMap[r.athlete_id]?.gender === 'F'), 'swim_time')
  const bestBikeF = bestOf(proFinishers.filter(r => athleteMap[r.athlete_id]?.gender === 'F'), 'bike_time')
  const bestRunF  = bestOf(proFinishers.filter(r => athleteMap[r.athlete_id]?.gender === 'F'), 'run_time')

  // Best times AG per group
  const agFinishers = finishers.filter(r => athleteMap[r.athlete_id]?.type === 'age_grouper')
  const agGroups = {}
  for (const r of agFinishers) {
    const key = athleteMap[r.athlete_id]?.age_group ?? '__ag__'
    agGroups[key] = agGroups[key] ?? []
    agGroups[key].push(r)
  }
  const bestInAg = (ag, field) => agGroups[ag]?.length ? Math.min(...agGroups[ag].map(r => r[field] ?? Infinity)) : Infinity

  // Result map by athlete_id
  const resultMap = Object.fromEntries(results.map(r => [r.athlete_id, r]))

  // Process entries for this race that need fixing
  const raceEntries = needsFix.filter(e => e.race_id === raceId)
  console.log(`  Race ${raceId}: fixing ${raceEntries.length} entries...`)

  let fixed = 0
  for (const entry of raceEntries) {
    const result = resultMap[entry.athlete_id]
    if (!result) { console.log(`    No result for athlete ${entry.athlete_id}, skipping`); continue }

    const athlete = athleteMap[entry.athlete_id]
    if (!athlete) { console.log(`    No athlete for ${entry.athlete_id}, skipping`); continue }

    let breakdown
    if (athlete.type === 'pro') {
      const isMale = athlete.gender === 'M'
      breakdown = proBreakdown(
        result.pro_pos,
        result.dnf, result.dns,
        result.swim_time === (isMale ? bestSwimM : bestSwimF),
        result.bike_time === (isMale ? bestBikeM : bestBikeF),
        result.run_time  === (isMale ? bestRunM  : bestRunF),
      )
    } else {
      const ag = athlete.age_group ?? '__ag__'
      const total = agGroups[ag]?.length ?? 1
      breakdown = agBreakdown(
        result.ag_pos, total,
        result.dnf, result.dns,
        result.swim_time === bestInAg(ag, 'swim_time'),
        result.bike_time === bestInAg(ag, 'bike_time'),
        result.run_time  === bestInAg(ag, 'run_time'),
      )
    }

    const { error } = await sb
      .from('athlete_price_history')
      .update({ breakdown })
      .eq('id', entry.id)

    if (error) {
      console.log(`    Error updating ${entry.id}: ${error.message}`)
    } else {
      fixed++
    }
  }
  console.log(`  ✓ Fixed ${fixed}/${raceEntries.length} entries for race ${raceId}`)
}

console.log('\nDone.')
