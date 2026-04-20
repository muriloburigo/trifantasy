/**
 * Insert IRONMAN South Africa 2026 results (April 19, 2026)
 * MPRO: 21 finishers + 12 DNF | FPRO: 15 finishers + 3 DNF
 * Source: https://protrinews.com/race/im-south-africa-2026
 *
 * Inserts results, marks race finished, and runs market update inline.
 * Run: node scripts/insert-south-africa-results.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

// ── 1. Get race ID ────────────────────────────────────────────────────────────
const { data: race, error: raceErr } = await sb
  .from('races')
  .select('id, name, status')
  .eq('slug', 'ironman-south-africa-2026')
  .single()

if (raceErr || !race) {
  console.error('Race not found:', raceErr)
  process.exit(1)
}
console.log(`→ Race: ${race.name} (${race.id}) — status: ${race.status}`)
const RACE_ID = race.id

// ── 2. Results data ───────────────────────────────────────────────────────────
// finish_time / swim_time / bike_time / run_time in seconds
// null for athletes where we don't have split data

const MPRO = [
  // Finishers
  { name: 'Matthew Marquardt',      gender: 'M', country: 'United States', pro_pos: 1,  swim_time: 3040,  bike_time: 14975, run_time: 9547,  finish_time: 27776, dnf: false, dns: false },
  { name: 'Joe Skipper',            gender: 'M', country: 'Great Britain',  pro_pos: 2,  swim_time: 3342,  bike_time: 15365, run_time: 9660,  finish_time: 28578, dnf: false, dns: false },
  { name: 'Tristan Olij',           gender: 'M', country: 'Netherlands',   pro_pos: 3,  swim_time: 3236,  bike_time: 15418, run_time: 9839,  finish_time: 28708, dnf: false, dns: false },
  { name: 'Mikel Ugarte Ramos',     gender: 'M', country: 'Spain',         pro_pos: 4,  swim_time: 3144,  bike_time: 15800, run_time: 9561,  finish_time: 28740, dnf: false, dns: false },
  { name: 'Florian Angert',         gender: 'M', country: 'Germany',       pro_pos: 5,  swim_time: 2977,  bike_time: 15870, run_time: 9901,  finish_time: 28980, dnf: false, dns: false },
  { name: 'Paul Loiseaux',          gender: 'M', country: 'France',        pro_pos: 6,  swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Michael Weiss',          gender: 'M', country: 'Austria',       pro_pos: 7,  swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Wojciech Kopycinski',    gender: 'M', country: 'Poland',        pro_pos: 8,  swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Cameron MacNair',        gender: 'M', country: 'South Africa',  pro_pos: 9,  swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Benjamin Hill',          gender: 'M', country: 'Great Britain', pro_pos: 10, swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Marc Eggeling',          gender: 'M', country: 'Germany',       pro_pos: 11, swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Louis Richard',          gender: 'M', country: 'France',        pro_pos: 12, swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Andreas Dreitz',         gender: 'M', country: 'Germany',       pro_pos: 13, swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Dominik Sowieja',        gender: 'M', country: 'Poland',        pro_pos: 14, swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Pim Van Diemen',         gender: 'M', country: 'Netherlands',   pro_pos: 15, swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Zoran Nikolics',         gender: 'M', country: 'Serbia',        pro_pos: 16, swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Andrew Horsfall-Turner', gender: 'M', country: 'Great Britain', pro_pos: 17, swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Tim Gosnjak',            gender: 'M', country: 'Austria',       pro_pos: 18, swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Keegan Cooke',           gender: 'M', country: 'South Africa',  pro_pos: 19, swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Giel Meesen',            gender: 'M', country: 'Belgium',       pro_pos: 20, swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Jamie Riddle',           gender: 'M', country: 'South Africa',  pro_pos: 21, swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  // DNF
  { name: 'Pieter Heemeryck',       gender: 'M', country: 'Belgium',       pro_pos: null, swim_time: null, bike_time: null, run_time: null, finish_time: null, dnf: true, dns: false },
  { name: 'Matthew Ralphs',         gender: 'M', country: 'Great Britain', pro_pos: null, swim_time: null, bike_time: null, run_time: null, finish_time: null, dnf: true, dns: false },
  { name: 'Rasmus Svenningsson',    gender: 'M', country: 'Sweden',        pro_pos: null, swim_time: null, bike_time: null, run_time: null, finish_time: null, dnf: true, dns: false },
  { name: 'Stenn Goetstouwers',     gender: 'M', country: 'Belgium',       pro_pos: null, swim_time: null, bike_time: null, run_time: null, finish_time: null, dnf: true, dns: false },
  { name: 'Oliver Turner',          gender: 'M', country: 'Great Britain', pro_pos: null, swim_time: null, bike_time: null, run_time: null, finish_time: null, dnf: true, dns: false },
  { name: 'Adam Lennell',           gender: 'M', country: 'Sweden',        pro_pos: null, swim_time: null, bike_time: null, run_time: null, finish_time: null, dnf: true, dns: false },
  { name: 'Pascal Franken',         gender: 'M', country: 'Germany',       pro_pos: null, swim_time: null, bike_time: null, run_time: null, finish_time: null, dnf: true, dns: false },
  { name: 'Jacob Lind Knudsen',     gender: 'M', country: 'Denmark',       pro_pos: null, swim_time: null, bike_time: null, run_time: null, finish_time: null, dnf: true, dns: false },
  { name: 'Matt Burton',            gender: 'M', country: 'Australia',     pro_pos: null, swim_time: null, bike_time: null, run_time: null, finish_time: null, dnf: true, dns: false },
  { name: 'Mattia Ceccarelli',      gender: 'M', country: 'Italy',         pro_pos: null, swim_time: null, bike_time: null, run_time: null, finish_time: null, dnf: true, dns: false },
  { name: 'Gregory Barnaby',        gender: 'M', country: 'France',        pro_pos: null, swim_time: null, bike_time: null, run_time: null, finish_time: null, dnf: true, dns: false },
  { name: 'Bradley Weiss',          gender: 'M', country: 'South Africa',  pro_pos: null, swim_time: null, bike_time: null, run_time: null, finish_time: null, dnf: true, dns: false },
]

const FPRO = [
  // Finishers
  { name: 'Daisy Davies',                    gender: 'F', country: 'Great Britain', pro_pos: 1,  swim_time: 3304,  bike_time: 16780, run_time: 11290, finish_time: 31590, dnf: false, dns: false },
  { name: 'Katrine Græsbøll Christensen',    gender: 'F', country: 'Denmark',       pro_pos: 2,  swim_time: 3761,  bike_time: 17714, run_time: 10564, finish_time: 32278, dnf: false, dns: false },
  { name: 'Daniela Bleymehl',                gender: 'F', country: 'Germany',       pro_pos: 3,  swim_time: 3653,  bike_time: 17324, run_time: 11152, finish_time: 32394, dnf: false, dns: false },
  { name: 'Henrike Güber',                   gender: 'F', country: 'Germany',       pro_pos: 4,  swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Anna Pabinger',                   gender: 'F', country: 'Austria',       pro_pos: 5,  swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Merle Brunnée',                   gender: 'F', country: 'Germany',       pro_pos: 6,  swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Laura Jansen',                    gender: 'F', country: 'Germany',       pro_pos: 7,  swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Kyra Meulenberg',                 gender: 'F', country: 'Netherlands',   pro_pos: 8,  swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Julia Skala',                     gender: 'F', country: 'Germany',       pro_pos: 9,  swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Michelle Krebs',                  gender: 'F', country: 'Germany',       pro_pos: 10, swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Antonia Milowsky',                gender: 'F', country: 'Germany',       pro_pos: 11, swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Claire Hann',                     gender: 'F', country: 'Australia',     pro_pos: 12, swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Penny Slater',                    gender: 'F', country: 'Australia',     pro_pos: 13, swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Katie Colville',                  gender: 'F', country: 'Great Britain', pro_pos: 14, swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  { name: 'Clarice Chastang',               gender: 'F', country: 'France',        pro_pos: 15, swim_time: null,  bike_time: null,  run_time: null,  finish_time: null,  dnf: false, dns: false },
  // DNF
  { name: 'Fiona Moriarty',                  gender: 'F', country: 'Australia',     pro_pos: null, swim_time: null, bike_time: null, run_time: null, finish_time: null, dnf: true, dns: false },
  { name: 'Rebecca Andersson',               gender: 'F', country: 'Sweden',        pro_pos: null, swim_time: null, bike_time: null, run_time: null, finish_time: null, dnf: true, dns: false },
  { name: 'Marit Lindemann',                 gender: 'F', country: 'Germany',       pro_pos: null, swim_time: null, bike_time: null, run_time: null, finish_time: null, dnf: true, dns: false },
]

const ALL_ATHLETES = [...MPRO, ...FPRO]

// ── 3. Fetch all athletes from DB ────────────────────────────────────────────
const { data: dbAthletes } = await sb.from('athletes').select('id, name, gender, type, current_price')
const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
const dbMap = new Map()
for (const a of (dbAthletes ?? [])) {
  dbMap.set(`${normalize(a.name)}|${a.gender}`, a)
}

// ── 4. Ensure all athletes exist in DB ──────────────────────────────────────
const toUpsert = []
for (const r of ALL_ATHLETES) {
  const key = `${normalize(r.name)}|${r.gender}`
  if (!dbMap.has(key)) {
    // New athlete — assign a base price based on position
    let basePrice = 10
    if (r.pro_pos === 1) basePrice = 20
    else if (r.pro_pos === 2) basePrice = 17
    else if (r.pro_pos === 3) basePrice = 15
    else if (r.pro_pos && r.pro_pos <= 5) basePrice = 13
    else if (r.pro_pos && r.pro_pos <= 10) basePrice = 11
    toUpsert.push({
      name: r.name,
      gender: r.gender,
      type: 'pro',
      country: r.country,
      current_price: basePrice,
      price_change: 0,
      pto_rank: null,
      age_group: null,
      club: null,
    })
  }
}

if (toUpsert.length > 0) {
  console.log(`→ Inserting ${toUpsert.length} new athletes not in DB:`)
  toUpsert.forEach(a => console.log(`   + ${a.name} (${a.gender})`))

  const { data: newAthletes, error: upsertErr } = await sb
    .from('athletes')
    .upsert(toUpsert, { onConflict: 'name,gender,type' })
    .select('id, name, gender, current_price')

  if (upsertErr) { console.error('Upsert athletes error:', upsertErr); process.exit(1) }

  for (const a of (newAthletes ?? [])) {
    dbMap.set(`${normalize(a.name)}|${a.gender}`, a)
  }
  console.log(`  ✅ ${newAthletes?.length ?? 0} athletes inserted`)
} else {
  console.log('→ All athletes already in DB')
}

// Refresh DB map with latest data (including newly inserted)
const { data: freshAthletes } = await sb.from('athletes').select('id, name, gender, type, current_price')
const freshMap = new Map()
for (const a of (freshAthletes ?? [])) {
  freshMap.set(`${normalize(a.name)}|${a.gender}`, a)
}

// ── 5. Build result rows ──────────────────────────────────────────────────────
const rows = []
const notFound = []

for (const r of ALL_ATHLETES) {
  const key = `${normalize(r.name)}|${r.gender}`
  const athlete = freshMap.get(key)
  if (!athlete) {
    notFound.push(r.name)
    continue
  }
  rows.push({
    race_id:     RACE_ID,
    athlete_id:  athlete.id,
    pro_pos:     r.pro_pos,
    swim_time:   r.swim_time,
    bike_time:   r.bike_time,
    run_time:    r.run_time,
    finish_time: r.finish_time,
    dnf:         r.dnf,
    dns:         r.dns,
    kona_slot:   false,
  })
}

if (notFound.length > 0) {
  console.warn(`\n⚠️  Athletes not found in DB:`, notFound)
}

// ── 6. Upsert results ─────────────────────────────────────────────────────────
console.log(`\n→ Upserting ${rows.length} results...`)
const { error: insErr } = await sb.from('results').upsert(rows, { onConflict: 'race_id,athlete_id' })
if (insErr) { console.error('Insert results error:', insErr); process.exit(1) }
console.log(`  ✅ ${rows.length} results saved`)

// ── 7. Mark race as finished ──────────────────────────────────────────────────
const { error: statusErr } = await sb.from('races').update({ status: 'finished' }).eq('id', RACE_ID)
if (statusErr) { console.error('Race status update error:', statusErr) }
else console.log('  ✅ Race marked as finished')

// ── 8. Market update (inline port of lib/scoring/market.ts) ──────────────────
console.log('\n→ Running market update...')

// Fetch results with athlete data for market calc
const { data: raceResults } = await sb
  .from('results')
  .select('*, athlete:athletes(id, name, type, age_group, gender, current_price)')
  .eq('race_id', RACE_ID)

if (!raceResults?.length) {
  console.warn('No results found for market update')
  process.exit(0)
}

const MIN_PRICE = 1

function proMarketDelta(pos, dnf, dns, swimFastest, bikeFastest, runFastest) {
  const reasons = []
  let delta = 0
  if (dns)      { delta -= 2; reasons.push('DNS −2') }
  else if (dnf) { delta -= 2; reasons.push('DNF −2') }
  else {
    const p = pos ?? 99
    if      (p === 1)  { delta += 4; reasons.push('1st +4') }
    else if (p <= 3)   { delta += 3; reasons.push(`${p}th +3`) }
    else if (p <= 5)   { delta += 2; reasons.push(`${p}th +2`) }
    else if (p <= 10)  { delta += 1; reasons.push(`${p}th +1`) }
    else if (p <= 20)  {             reasons.push(`${p}th 0`) }
    else               { delta -= 1; reasons.push(`${p}th −1`) }

    if (swimFastest) { delta += 1; reasons.push('Best swim +1') }
    if (bikeFastest) { delta += 1; reasons.push('Best bike +1') }
    if (runFastest)  { delta += 1; reasons.push('Best run +1') }
  }
  return { delta, reasons }
}

// Compute best times for segment bonuses
const proFinishers = raceResults.filter(r => !r.dnf && !r.dns && r.athlete?.type === 'pro')
const bestSwim = Math.min(...proFinishers.map(r => r.swim_time ?? Infinity))
const bestBike = Math.min(...proFinishers.map(r => r.bike_time ?? Infinity))
const bestRun  = Math.min(...proFinishers.map(r => r.run_time  ?? Infinity))

const marketLog = []

for (const r of raceResults) {
  const athlete = r.athlete
  if (!athlete?.id || athlete.type !== 'pro') continue

  const oldPrice = Number(athlete.current_price ?? 10)
  const { delta, reasons } = proMarketDelta(
    r.pro_pos, r.dnf, r.dns,
    r.swim_time != null && r.swim_time === bestSwim,
    r.bike_time != null && r.bike_time === bestBike,
    r.run_time  != null && r.run_time  === bestRun,
  )

  const newPrice = Math.max(MIN_PRICE, oldPrice + delta)
  const actualDelta = newPrice - oldPrice

  // Update athlete price
  const { error: priceErr } = await sb
    .from('athletes')
    .update({ current_price: newPrice, price_change: actualDelta })
    .eq('id', athlete.id)
  if (priceErr) { console.error(`Price update error for ${athlete.name}:`, priceErr); continue }

  // Log to price history
  await sb.from('athlete_price_history').insert({
    athlete_id: athlete.id,
    price: newPrice,
    change: actualDelta,
    reason: 'race_result',
    race_id: RACE_ID,
  })

  // Propagate to open/upcoming race_athletes
  const { data: futureParts } = await sb
    .from('race_athletes')
    .select('id, race_id, races!inner(status)')
    .eq('athlete_id', athlete.id)
    .in('races.status', ['open', 'upcoming'])

  if (futureParts?.length) {
    await sb
      .from('race_athletes')
      .update({ price: newPrice })
      .in('id', futureParts.map(rp => rp.id))
  }

  marketLog.push({ name: athlete.name, oldPrice, newPrice, delta: actualDelta, reasons })
}

// ── 9. Summary ────────────────────────────────────────────────────────────────
console.log('\n📊 Market Update Summary:')
console.log('─'.repeat(60))
for (const m of marketLog.sort((a, b) => b.delta - a.delta)) {
  const arrow = m.delta > 0 ? '▲' : m.delta < 0 ? '▼' : '─'
  const sign  = m.delta > 0 ? '+' : ''
  console.log(`  ${arrow} ${m.name.padEnd(28)} T$${String(m.oldPrice).padStart(2)} → T$${String(m.newPrice).padStart(2)} (${sign}${m.delta})  [${m.reasons.join(', ')}]`)
}
console.log('─'.repeat(60))
console.log(`\n✅ Done! IRONMAN South Africa 2026 results saved and market updated.`)
