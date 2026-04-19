/**
 * Fix athlete prices after double-update bug (insert-texas-results + updateMarket).
 *
 * Strategy:
 *   1. Fetch PTO rankings → correct base price for every athlete
 *   2. Fetch Texas results from DB
 *   3. Compute correct updateMarket delta (same logic as lib/scoring/market.ts)
 *   4. Final price = clamp(ptoBase + delta, 1, 35)
 *   5. Update athletes + log to athlete_price_history
 *
 * Run: node scripts/fix-texas-prices.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const RACE_SLUG = 'ironman-texas-2026'
const MIN_PRICE = 1
const MAX_PRICE = 35

// ── PTO pricing tiers (same as reprice-athletes.mjs) ─────────────────────────
function normalize(name) {
  return name.toLowerCase()
    .replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/å/g, 'a')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ä/g, 'a')
    .replace(/é/g, 'e').replace(/è/g, 'e').replace(/ê/g, 'e').replace(/ë/g, 'e')
    .replace(/ã/g, 'a').replace(/â/g, 'a').replace(/á/g, 'a').replace(/à/g, 'a')
    .replace(/ô/g, 'o').replace(/õ/g, 'o').replace(/ó/g, 'o').replace(/ò/g, 'o')
    .replace(/ú/g, 'u').replace(/ù/g, 'u').replace(/û/g, 'u')
    .replace(/ç/g, 'c').replace(/ñ/g, 'n').replace(/í/g, 'i').replace(/î/g, 'i')
    .replace(/\s+/g, ' ').trim()
}

function priceFromPoints(pts) {
  if (pts >= 95) return 35
  if (pts >= 90) return 28
  if (pts >= 85) return 22
  if (pts >= 80) return 18
  if (pts >= 75) return 15
  if (pts >= 70) return 12
  if (pts >= 60) return 11
  return 10
}

// ── Market delta (same rules as lib/scoring/market.ts) ────────────────────────
function proMarketDelta(pos, dnf, dns, swimFastest, bikeFastest, runFastest) {
  if (dns) return -2
  if (dnf) return -2
  const p = pos ?? 99
  let delta = 0
  if      (p === 1)  delta += 4
  else if (p <= 3)   delta += 3
  else if (p <= 5)   delta += 2
  else if (p <= 10)  delta += 1
  else if (p <= 20)  delta += 0
  else               delta -= 1
  if (swimFastest) delta += 1
  if (bikeFastest) delta += 1
  if (runFastest)  delta += 1
  return delta
}

// ── Fetch PTO rankings ────────────────────────────────────────────────────────
console.log('→ Fetching PTO rankings...')
const [menRaw, womenRaw] = await Promise.all([
  fetch('https://stats.protriathletes.org/api/rankings/men?limit=1000').then(r => r.json()),
  fetch('https://stats.protriathletes.org/api/rankings/women?limit=1000').then(r => r.json()),
])
const rankMap = new Map()
for (const r of menRaw.rankings ?? [])   rankMap.set(normalize(r.name), { points: r.points })
for (const r of womenRaw.rankings ?? []) rankMap.set(normalize(r.name), { points: r.points })
console.log(`  ${rankMap.size} atletas no ranking PTO`)

// ── Fetch race + results ──────────────────────────────────────────────────────
const { data: race } = await sb.from('races').select('id').eq('slug', RACE_SLUG).single()
if (!race) { console.error('Prova não encontrada.'); process.exit(1) }

const { data: results } = await sb
  .from('results')
  .select('athlete_id, pro_pos, swim_time, bike_time, run_time, finish_time, dnf, dns, athlete:athletes(id, name, current_price)')
  .eq('race_id', race.id)

if (!results?.length) { console.error('Sem resultados.'); process.exit(1) }
console.log(`\n→ ${results.length} resultados encontrados para ${RACE_SLUG}`)

// ── Best times for segment bonuses ───────────────────────────────────────────
const finishers = results.filter(r => !r.dnf && !r.dns)
const best = (field) => Math.min(...finishers.map(r => r[field] ?? Infinity))
const bestSwim = best('swim_time')
const bestBike = best('bike_time')
const bestRun  = best('run_time')

// ── Fix each athlete ──────────────────────────────────────────────────────────
console.log('\n Atleta                              PTO base  Delta  Correto  Atual   Status')
console.log(' ' + '─'.repeat(82))

let fixed = 0

for (const r of results) {
  const ath = r.athlete
  if (!ath) continue

  // 1. Find PTO base price
  const key = normalize(ath.name)
  let pto = rankMap.get(key)
  if (!pto) {
    const parts = key.split(' ')
    if (parts.length >= 2) {
      const rev = parts.slice(1).join(' ') + ' ' + parts[0]
      pto = rankMap.get(rev)
    }
  }
  const ptoBase = pto ? priceFromPoints(pto.points) : 10

  // 2. Compute correct delta
  const delta = proMarketDelta(
    r.pro_pos, r.dnf, r.dns,
    r.swim_time === bestSwim,
    r.bike_time === bestBike,
    r.run_time  === bestRun,
  )

  // 3. Correct final price
  const correctPrice = Math.min(MAX_PRICE, Math.max(MIN_PRICE, ptoBase + delta))
  const currentPrice = Number(ath.current_price)
  const status = correctPrice === currentPrice ? '✓ ok' : `✗ era ${currentPrice}`

  const name = ath.name.padEnd(36)
  console.log(` ${name} T$${String(ptoBase).padStart(2)}      ${delta >= 0 ? '+' : ''}${delta}     T$${String(correctPrice).padStart(2)}     T$${String(currentPrice).padStart(2)}   ${status}`)

  if (correctPrice !== currentPrice) {
    const actualChange = correctPrice - ptoBase

    const { error } = await sb.from('athletes')
      .update({ current_price: correctPrice, price_change: actualChange })
      .eq('id', ath.id)

    if (!error) {
      // Log correction to price history
      await sb.from('athlete_price_history').insert({
        athlete_id: ath.id,
        price: correctPrice,
        change: actualChange,
        reason: 'race_result',
        race_id: race.id,
      })

      // Sync race_athletes for open/upcoming races
      const { data: futurePart } = await sb
        .from('race_athletes')
        .select('id, race_id, races!inner(status)')
        .eq('athlete_id', ath.id)
        .in('races.status', ['open', 'upcoming'])

      if (futurePart?.length) {
        await sb.from('race_athletes').update({ price: correctPrice }).in('id', futurePart.map(rp => rp.id))
      }

      fixed++
    }
  }
}

console.log(`\n✅ ${fixed} atletas corrigidos.`)
