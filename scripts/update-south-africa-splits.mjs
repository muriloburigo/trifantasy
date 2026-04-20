/**
 * Update IRONMAN South Africa 2026 with complete splits for all PRO finishers.
 * Also corrects market segment bonuses (wrong best-swim M and best-run F).
 *
 * Run: node scripts/update-south-africa-splits.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const { data: race } = await sb.from('races').select('id').eq('slug', 'ironman-south-africa-2026').single()
const RACE_ID = race.id

// ── Complete splits for all finishers (source: PTO Stats) ─────────────────────
const ALL_RESULTS = [
  // MPRO
  { name: 'Matthew Marquardt',      gender: 'M', pro_pos: 1,  swim: 3040,  bike: 14975, run: 9547,  finish: 27776 },
  { name: 'Joe Skipper',            gender: 'M', pro_pos: 2,  swim: 3342,  bike: 15365, run: 9660,  finish: 28578 },
  { name: 'Tristan Olij',           gender: 'M', pro_pos: 3,  swim: 3236,  bike: 15418, run: 9839,  finish: 28708 },
  { name: 'Mikel Ugarte Ramos',     gender: 'M', pro_pos: 4,  swim: 3144,  bike: 15800, run: 9561,  finish: 28740 },
  { name: 'Florian Angert',         gender: 'M', pro_pos: 5,  swim: 2977,  bike: 15870, run: 9901,  finish: 28980 },
  { name: 'Paul Loiseaux',          gender: 'M', pro_pos: 6,  swim: 3359,  bike: 15570, run: 9845,  finish: 29034 },
  { name: 'Michael Weiss',          gender: 'M', pro_pos: 7,  swim: 3376,  bike: 15472, run: 9992,  finish: 29068 },
  { name: 'Wojciech Kopycinski',    gender: 'M', pro_pos: 8,  swim: 3334,  bike: 15529, run: 10044, finish: 29164 },
  { name: 'Cameron MacNair',        gender: 'M', pro_pos: 9,  swim: 3229,  bike: 15958, run: 9861,  finish: 29295 },
  { name: 'Benjamin Hill',          gender: 'M', pro_pos: 10, swim: 3316,  bike: 16218, run: 9591,  finish: 29362 },
  { name: 'Marc Eggeling',          gender: 'M', pro_pos: 11, swim: 3277,  bike: 15737, run: 10207, finish: 29472 },
  { name: 'Louis Richard',          gender: 'M', pro_pos: 12, swim: 4399,  bike: 15178, run: 9693,  finish: 29520 },
  { name: 'Andreas Dreitz',         gender: 'M', pro_pos: 13, swim: 3320,  bike: 15822, run: 10204, finish: 29587 },
  { name: 'Dominik Sowieja',        gender: 'M', pro_pos: 14, swim: 3382,  bike: 16167, run: 9839,  finish: 29639 },
  { name: 'Pim Van Diemen',         gender: 'M', pro_pos: 15, swim: 3397,  bike: 15809, run: 11135, finish: 30556 },
  { name: 'Zoran Nikolics',         gender: 'M', pro_pos: 16, swim: 3443,  bike: 16696, run: 11164, finish: 31538 },
  { name: 'Andrew Horsfall-Turner', gender: 'M', pro_pos: 17, swim: 2970,  bike: 15642, run: 12702, finish: 31568 },
  { name: 'Tim Gosnjak',            gender: 'M', pro_pos: 18, swim: 3844,  bike: 17008, run: 10660, finish: 31803 },
  { name: 'Keegan Cooke',           gender: 'M', pro_pos: 19, swim: 3373,  bike: 17400, run: 10943, finish: 31974 },
  { name: 'Giel Meesen',            gender: 'M', pro_pos: 20, swim: 3405,  bike: 15784, run: 12692, finish: 32122 },
  { name: 'Jamie Riddle',           gender: 'M', pro_pos: 21, swim: 2867,  bike: 15283, run: 14868, finish: 33249 },
  // FPRO
  { name: 'Daisy Davies',                   gender: 'F', pro_pos: 1,  swim: 3304,  bike: 16780, run: 11290, finish: 31590 },
  { name: 'Katrine Græsbøll Christensen',   gender: 'F', pro_pos: 2,  swim: 3761,  bike: 17714, run: 10564, finish: 32278 },
  { name: 'Daniela Bleymehl',               gender: 'F', pro_pos: 3,  swim: 3653,  bike: 17324, run: 11152, finish: 32394 },
  { name: 'Henrike Güber',                  gender: 'F', pro_pos: 4,  swim: 4025,  bike: 17101, run: 11210, finish: 32566 },
  { name: 'Anna Pabinger',                  gender: 'F', pro_pos: 5,  swim: 4517,  bike: 17563, run: 10540, finish: 32866 },
  { name: 'Merle Brunnée',                  gender: 'F', pro_pos: 6,  swim: 4303,  bike: 17085, run: 11286, finish: 32898 },
  { name: 'Laura Jansen',                   gender: 'F', pro_pos: 7,  swim: 3689,  bike: 17681, run: 11310, finish: 32976 },
  { name: 'Kyra Meulenberg',                gender: 'F', pro_pos: 8,  swim: 4306,  bike: 18470, run: 10656, finish: 33726 },
  { name: 'Julia Skala',                    gender: 'F', pro_pos: 9,  swim: 4039,  bike: 17528, run: 12148, finish: 33979 },
  { name: 'Michelle Krebs',                 gender: 'F', pro_pos: 10, swim: 3934,  bike: 18000, run: 12083, finish: 34269 },
  { name: 'Antonia Milowsky',               gender: 'F', pro_pos: 11, swim: 3646,  bike: 18456, run: 12178, finish: 34540 },
  { name: 'Claire Hann',                    gender: 'F', pro_pos: 12, swim: 3561,  bike: 18508, run: 12695, finish: 35056 },
  { name: 'Penny Slater',                   gender: 'F', pro_pos: 13, swim: 3650,  bike: 17473, run: 13825, finish: 35243 },
  { name: 'Katie Colville',                 gender: 'F', pro_pos: 14, swim: 4006,  bike: 19604, run: 11836, finish: 35767 },
  { name: 'Clarice Chastang',               gender: 'F', pro_pos: 15, swim: 4653,  bike: 20046, run: 12592, finish: 37601 },
]

// ── Fetch all athletes to build lookup ────────────────────────────────────────
const { data: dbAthletes } = await sb.from('athletes').select('id, name, gender, current_price')
const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
const byKey = new Map(dbAthletes.map(a => [`${normalize(a.name)}|${a.gender}`, a]))

// ── Fetch existing results to get athlete_ids ─────────────────────────────────
const { data: existingResults } = await sb
  .from('results')
  .select('id, athlete_id, pro_pos, athlete:athletes(name, gender)')
  .eq('race_id', RACE_ID)
  .not('pro_pos', 'is', null)

const byPos = new Map()
for (const r of (existingResults ?? [])) {
  byPos.set(`${r.pro_pos}|${r.athlete?.gender}`, r)
}

// ── Update splits for each finisher ──────────────────────────────────────────
console.log('→ Updating splits for all finishers...')
let updated = 0, skipped = 0

for (const r of ALL_RESULTS) {
  // Find existing result by position + gender
  const existing = byPos.get(`${r.pro_pos}|${r.gender}`)
  if (!existing) {
    console.warn(`  ⚠️  No existing result for pos ${r.pro_pos} ${r.gender}`)
    skipped++
    continue
  }

  const { error } = await sb
    .from('results')
    .update({ swim_time: r.swim, bike_time: r.bike, run_time: r.run, finish_time: r.finish })
    .eq('id', existing.id)

  if (error) {
    console.error(`  ✗ ${r.name}:`, error.message)
  } else {
    updated++
  }
}
console.log(`  ✅ ${updated} results updated, ${skipped} skipped`)

// ── Correct market segment bonuses ────────────────────────────────────────────
// With full data:
//   M best swim: Jamie Riddle 2867 (was incorrectly Angert 2977 → fix)
//   F best run:  Anna Pabinger 10540 (was not awarded to anyone → fix)
//
// Adjustments needed:
//   Florian Angert:  -1 (revoke incorrect swim bonus)
//   Jamie Riddle:    +1 (grant correct swim bonus) — but Riddle is at pos 21 (already −1), so net = 0
//   Anna Pabinger:   +1 (grant correct run bonus) — already got +2 for 5th, so net = +3

console.log('\n→ Correcting market segment bonuses...')

const corrections = [
  { name: 'Florian Angert',  gender: 'M', adj: -1, reason: 'Revoke incorrect best-swim M (Riddle 2867 < Angert 2977)' },
  { name: 'Jamie Riddle',    gender: 'M', adj: +1, reason: 'Grant correct best-swim M (2867s)' },
  { name: 'Anna Pabinger',   gender: 'F', adj: +1, reason: 'Grant correct best-run F (10540s < Christensen 10564s)' },
]

const MIN_PRICE = 1
for (const c of corrections) {
  // Try exact name match first, then normalized
  let athlete = byKey.get(`${normalize(c.name)}|${c.gender}`)
  if (!athlete) {
    console.warn(`  ⚠️  Athlete not found: ${c.name}`)
    continue
  }

  const oldPrice = Number(athlete.current_price)
  const newPrice = Math.max(MIN_PRICE, oldPrice + c.adj)
  const actualAdj = newPrice - oldPrice

  const { error: priceErr } = await sb
    .from('athletes')
    .update({ current_price: newPrice, price_change: actualAdj })
    .eq('id', athlete.id)

  if (priceErr) { console.error(`  ✗ ${c.name}:`, priceErr.message); continue }

  await sb.from('athlete_price_history').insert({
    athlete_id: athlete.id,
    price: newPrice,
    change: actualAdj,
    reason: 'market_correction',
    race_id: RACE_ID,
  })

  // Propagate to open/upcoming race_athletes
  const { data: futureParts } = await sb
    .from('race_athletes')
    .select('id, races!inner(status)')
    .eq('athlete_id', athlete.id)
    .in('races.status', ['open', 'upcoming'])

  if (futureParts?.length) {
    await sb.from('race_athletes').update({ price: newPrice }).in('id', futureParts.map(rp => rp.id))
  }

  const sign = actualAdj > 0 ? '+' : ''
  console.log(`  ${actualAdj > 0 ? '▲' : '▼'} ${c.name.padEnd(24)} T$${oldPrice} → T$${newPrice} (${sign}${actualAdj})  — ${c.reason}`)
  // update local cache for subsequent lookups
  athlete.current_price = newPrice
}

console.log('\n✅ Done! All splits updated and market corrections applied.')
