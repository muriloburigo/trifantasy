/**
 * Reprice athletes based on PTO world ranking points.
 *
 * Pricing tiers (budget is T$100 for 5 athletes):
 *   ≥ 95 pts  (rank ~1-7)   → T$35  ← elite stars
 *   ≥ 90 pts  (rank ~8-15)  → T$28  ← established pros
 *   ≥ 85 pts  (rank ~16-25) → T$22  ← strong pros
 *   ≥ 80 pts  (rank ~26-40) → T$18  ← competitive
 *   ≥ 75 pts  (rank ~41-60) → T$15  ← solid
 *   ≥ 70 pts  (rank ~61-80) → T$12  ← ranked
 *   ≥ 60 pts  (rank ~81-120)→ T$11  ← lower ranked
 *   unranked PRO            → T$10  ← base
 *
 * Run: node scripts/reprice-athletes.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

// ─── Fetch PTO rankings ───────────────────────────────────────────────────────

async function fetchPtoRankings(gender) {
  const url = `https://stats.protriathletes.org/api/rankings/${gender === 'M' ? 'men' : 'women'}?limit=1000`
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
  if (!res.ok) throw new Error(`PTO ${gender} rankings failed: ${res.status}`)
  const data = await res.json()
  return data.rankings ?? []
}

// ─── Name normalisation for fuzzy matching ────────────────────────────────────

function normalize(name) {
  return name.toLowerCase()
    .replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/å/g, 'a')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ä/g, 'a')
    .replace(/é/g, 'e').replace(/è/g, 'e').replace(/ê/g, 'e').replace(/ë/g, 'e')
    .replace(/ã/g, 'a').replace(/â/g, 'a').replace(/á/g, 'a').replace(/à/g, 'a')
    .replace(/ô/g, 'o').replace(/õ/g, 'o').replace(/ó/g, 'o').replace(/ò/g, 'o')
    .replace(/ú/g, 'u').replace(/ù/g, 'u').replace(/û/g, 'u')
    .replace(/ç/g, 'c').replace(/ñ/g, 'n').replace(/í/g, 'i').replace(/î/g, 'i')
    .replace(/é/g, 'e').replace(/\s+/g, ' ').trim()
}

// ─── Pricing formula ─────────────────────────────────────────────────────────

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

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('→ Fetching PTO rankings...')
const [menRankings, womenRankings] = await Promise.all([
  fetchPtoRankings('M'),
  fetchPtoRankings('F'),
])
console.log(`  Men: ${menRankings.length} | Women: ${womenRankings.length}`)

// Build lookup: normalized name → { rank, points, gender }
const rankMap = new Map()
for (const r of menRankings) {
  rankMap.set(normalize(r.name), { rank: r.rank, points: r.points, gender: 'M' })
}
for (const r of womenRankings) {
  rankMap.set(normalize(r.name), { rank: r.rank, points: r.points, gender: 'F' })
}

// Fetch all athletes from DB
const { data: athletes, error } = await sb
  .from('athletes')
  .select('id, name, gender, type, current_price, pto_rank')
  .order('name')

if (error || !athletes?.length) { console.error('Error:', error); process.exit(1) }

console.log(`\n→ Repricing ${athletes.length} athletes...\n`)

const stats = { updated: 0, unchanged: 0, noRank: 0 }
const unmatched = []

for (const athlete of athletes) {
  if (athlete.type === 'age_grouper') {
    // age groupers no longer in use — skip
    stats.unchanged++
    continue
  }

  // Try exact normalized match
  const key = normalize(athlete.name)
  let pto = rankMap.get(key)

  // Try first-last name reverse (some PTO names have different order)
  if (!pto) {
    const parts = key.split(' ')
    if (parts.length >= 2) {
      const reversed = parts.slice(1).join(' ') + ' ' + parts[0]
      pto = rankMap.get(reversed)
    }
  }

  // Try partial match (last name only for disambiguation)
  if (!pto) {
    const lastName = normalize(athlete.name).split(' ').pop()
    const candidates = [...rankMap.entries()].filter(([k]) => k.endsWith(lastName) || k.startsWith(lastName))
    if (candidates.length === 1) {
      // Only use if there's exactly one match to avoid false positives
      const firstNameAthlete = normalize(athlete.name).split(' ')[0]
      const firstNamePto = candidates[0][0].split(' ')[0]
      if (firstNameAthlete === firstNamePto || firstNameAthlete.startsWith(firstNamePto.slice(0,3))) {
        pto = candidates[0][1]
      }
    }
  }

  const newPrice = pto ? priceFromPoints(pto.points) : 10
  const newRank  = pto?.rank ?? null

  const priceChanged = Number(athlete.current_price) !== newPrice
  const rankChanged  = athlete.pto_rank !== newRank

  if (priceChanged || rankChanged) {
    const { error: upErr } = await sb.from('athletes')
      .update({ current_price: newPrice, pto_rank: newRank, price_change: 0 })
      .eq('id', athlete.id)

    if (!upErr) {
      stats.updated++
      const arrow = newPrice > Number(athlete.current_price) ? '↑' : newPrice < Number(athlete.current_price) ? '↓' : '→'
      const rankStr = pto ? `#${pto.rank} (${pto.points.toFixed(1)}pts)` : 'unranked'
      console.log(`  ${arrow} ${athlete.name.padEnd(35)} T$${String(athlete.current_price).padStart(2)} → T$${String(newPrice).padStart(2)}  ${rankStr}`)

      if (priceChanged) {
        await sb.from('athlete_price_history').insert({
          athlete_id: athlete.id,
          old_price: Number(athlete.current_price),
          price: newPrice,
          new_price: newPrice,
          change: newPrice - Number(athlete.current_price),
          reason: 'reprice_pto',
          breakdown: [
            {
              code: 'pto_reprice',
              label: `Repricing PTO ${newPrice - Number(athlete.current_price) >= 0 ? '+' : ''}${newPrice - Number(athlete.current_price)}`,
              delta: newPrice - Number(athlete.current_price),
              category: 'ranking',
              metadata: {
                previous_rank: athlete.pto_rank,
                new_rank: newRank,
                pto_points: pto?.points ?? null,
              },
            },
          ],
          context: {
            source: 'reprice_pto',
            previous_rank: athlete.pto_rank,
            new_rank: newRank,
            pto_points: pto?.points ?? null,
          },
        })
      }
    }
  } else {
    stats.unchanged++
  }

  if (!pto) unmatched.push(athlete.name)
}

console.log(`\n✅ Atualizado: ${stats.updated}  |  Sem mudança: ${stats.unchanged}`)
console.log(`\n⚠ Atletas PROs sem ranking PTO (${unmatched.length}):`)
unmatched.slice(0, 30).forEach(n => console.log(`   - ${n}`))

// ─── Sync race_athletes.price for non-finished races ─────────────────────────

console.log('\n→ Sincronizando race_athletes.price (todas as provas)...')

{
  const { data: raceAthletes } = await sb
    .from('race_athletes')
    .select('id, athlete_id, price')

  // Re-fetch prices from DB after updates
  const { data: freshAthletes } = await sb.from('athletes').select('id, current_price')
  const priceMap = new Map((freshAthletes ?? []).map(a => [a.id, Number(a.current_price)]))

  let synced = 0
  for (const ra of raceAthletes ?? []) {
    const currentPrice = priceMap.get(ra.athlete_id)
    if (currentPrice !== undefined && currentPrice !== Number(ra.price)) {
      await sb.from('race_athletes').update({ price: currentPrice }).eq('id', ra.id)
      synced++
    }
  }
  console.log(`  ✅ ${synced} entradas de race_athletes sincronizadas.`)
}
