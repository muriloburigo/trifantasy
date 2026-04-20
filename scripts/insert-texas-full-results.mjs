/**
 * Insert/update IRONMAN Texas 2026 complete PRO results (April 18, 2026)
 * Source: stats.protriathletes.org
 * MPRO: 56 finishers + 18 DNF | FPRO: 19 finishers + 4 DNF
 *
 * Run: node scripts/insert-texas-full-results.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const { data: race } = await sb.from('races').select('id, name').eq('slug', 'ironman-texas-2026').single()
if (!race) { console.error('Race not found'); process.exit(1) }
console.log(`→ Race: ${race.name} (${race.id})`)
const RACE_ID = race.id

// ── Complete results data ─────────────────────────────────────────────────────
const MPRO_FIN = [
  { name: 'Kristian Blummenfelt',  country: 'Norway',        pro_pos: 1,  swim: 2913, bike: 14266, run: 9047,  finish: 26484 },
  { name: 'Marten Van Riel',       country: 'Belgium',       pro_pos: 2,  swim: 2897, bike: 14282, run: 9161,  finish: 26576 },
  { name: 'Casper Stornes',        country: 'Norway',        pro_pos: 3,  swim: 2906, bike: 14225, run: 9180,  finish: 26630 },
  { name: 'Vincent Luis',          country: 'France',        pro_pos: 4,  swim: 2898, bike: 14290, run: 9292,  finish: 26729 },
  { name: 'Rudy Von Berg',         country: 'United States', pro_pos: 5,  swim: 2998, bike: 14135, run: 9603,  finish: 26974 },
  { name: 'Brock Hoel',            country: 'Canada',        pro_pos: 6,  swim: 2902, bike: 14282, run: 9564,  finish: 26996 },
  { name: 'Jonas Schomburg',       country: 'Germany',       pro_pos: 7,  swim: 2896, bike: 14296, run: 9576,  finish: 27010 },
  { name: 'Gustav Iden',           country: 'Norway',        pro_pos: 8,  swim: 3009, bike: 14146, run: 9611,  finish: 27048 },
  { name: 'Kieran Lindars',        country: 'Great Britain', pro_pos: 9,  swim: 2907, bike: 14291, run: 9685,  finish: 27123 },
  { name: 'Cameron Main',          country: 'Great Britain', pro_pos: 10, swim: 2904, bike: 14271, run: 9786,  finish: 27182 },
  { name: 'Matt Hanson',           country: 'United States', pro_pos: 11, swim: 3125, bike: 14791, run: 9110,  finish: 27260 },
  { name: 'Kristian Høgenhaug',    country: 'Denmark',       pro_pos: 12, swim: 3022, bike: 14043, run: 9971,  finish: 27340 },
  { name: 'Kacper Stepniak',       country: 'Poland',        pro_pos: 13, swim: 2901, bike: 14280, run: 9930,  finish: 27354 },
  { name: 'Ben Kanute',            country: 'United States', pro_pos: 14, swim: 2900, bike: 14271, run: 10088, finish: 27486 },
  { name: 'Sam Long',              country: 'United States', pro_pos: 15, swim: 3251, bike: 14347, run: 9749,  finish: 27596 },
  { name: 'Jan Stratmann',         country: 'Germany',       pro_pos: 16, swim: 2912, bike: 14241, run: 10328, finish: 27730 },
  { name: 'Federico Scarabino',    country: 'Uruguay',       pro_pos: 17, swim: 3005, bike: 14452, run: 10057, finish: 27824 },
  { name: 'Nick Thompson',         country: 'Australia',     pro_pos: 18, swim: 3010, bike: 14156, run: 10374, finish: 27844 },
  { name: 'Jonas Hoffmann',        country: 'Germany',       pro_pos: 19, swim: 3019, bike: 14806, run: 9787,  finish: 27873 },
  { name: 'Paul Schuster',         country: 'Germany',       pro_pos: 20, swim: 3006, bike: 14764, run: 10181, finish: 28223 },
  { name: 'Pamphiel Pareyn',       country: 'Belgium',       pro_pos: 21, swim: 3010, bike: 14862, run: 10168, finish: 28315 },
  { name: 'Mitch Wismans',         country: 'Netherlands',   pro_pos: 22, swim: 3111, bike: 14968, run: 10244, finish: 28612 },
  { name: 'Dries Matthys',         country: 'Belgium',       pro_pos: 23, swim: 3016, bike: 15223, run: 10129, finish: 28628 },
  { name: 'Mathias Lyngsø Petersen', country: 'Denmark',     pro_pos: 24, swim: 2922, bike: 14518, run: 10955, finish: 28678 },
  { name: 'Cory Mayfield',         country: 'United States', pro_pos: 25, swim: 2919, bike: 15363, run: 10162, finish: 28754 },
  { name: 'Julian Becker',         country: 'Germany',       pro_pos: 26, swim: 3015, bike: 15315, run: 10190, finish: 28825 },
  { name: 'Mathieu Merland',       country: 'France',        pro_pos: 27, swim: 3136, bike: 15538, run: 9901,  finish: 28843 },
  { name: 'Andrea Salvisberg',     country: 'Sweden',        pro_pos: 28, swim: 2893, bike: 14761, run: 10956, finish: 28872 },
  { name: 'Robert Wilkowiecki',    country: 'Poland',        pro_pos: 29, swim: 3019, bike: 15290, run: 10205, finish: 28883 },
  { name: 'Ognjen Stojanovic',     country: 'Serbia',        pro_pos: 30, swim: 2907, bike: 15103, run: 10689, finish: 29022 },
  { name: 'John Killeen',          country: 'United States', pro_pos: 31, swim: 3626, bike: 14750, run: 10412, finish: 29058 },
  { name: 'Leonard Arnold',        country: 'Germany',       pro_pos: 32, swim: 3253, bike: 14335, run: 11252, finish: 29106 },
  { name: 'Filipe Azevedo',        country: 'Portugal',      pro_pos: 33, swim: 3015, bike: 15127, run: 10683, finish: 29152 },
  { name: 'Andy Krueger',          country: 'United States', pro_pos: 34, swim: 3439, bike: 15159, run: 10373, finish: 29277 },
  { name: 'Luke Jones',            country: 'United States', pro_pos: 35, swim: 3140, bike: 15408, run: 10557, finish: 29383 },
  { name: 'Matthew Collins',       country: 'Great Britain', pro_pos: 36, swim: 3014, bike: 14839, run: 11388, finish: 29525 },
  { name: 'Tomasz Szala',          country: 'Poland',        pro_pos: 37, swim: 3036, bike: 15105, run: 11269, finish: 29699 },
  { name: 'Romain Rezsohazy',      country: 'Belgium',       pro_pos: 38, swim: 3445, bike: 15287, run: 10734, finish: 29767 },
  { name: 'Adam Feigh',            country: 'United States', pro_pos: 39, swim: 3436, bike: 15778, run: 10102, finish: 29781 },
  { name: 'Fraser Minnican',       country: 'Great Britain', pro_pos: 40, swim: 2908, bike: 15280, run: 11592, finish: 30069 },
  { name: 'Connor Weaver',         country: 'United States', pro_pos: 41, swim: 3403, bike: 16555, run: 9814,  finish: 30077 },
  { name: 'Matthew Richard',       country: 'United States', pro_pos: 42, swim: 3690, bike: 15738, run: 10533, finish: 30253 },
  { name: 'Emil Holm',             country: 'Denmark',       pro_pos: 43, swim: 3012, bike: 15034, run: 11842, finish: 30393 },
  { name: 'Lukas Stahl',           country: 'Germany',       pro_pos: 44, swim: 3463, bike: 16079, run: 10909, finish: 30805 },
  { name: 'Lionel Sanders',        country: 'Canada',        pro_pos: 45, swim: 3245, bike: 14594, run: 12698, finish: 30849 },
  { name: 'Ole-Bernard Fuskevåg',  country: 'Norway',        pro_pos: 46, swim: 3580, bike: 15784, run: 11257, finish: 30904 },
  { name: 'Albert Askengren',      country: 'Sweden',        pro_pos: 47, swim: 3238, bike: 15785, run: 11628, finish: 30961 },
  { name: 'Jan Kepinski',          country: 'Poland',        pro_pos: 48, swim: 3577, bike: 15510, run: 11668, finish: 31097 },
  { name: 'Connor Readman',        country: 'United States', pro_pos: 49, swim: 3630, bike: 16232, run: 11007, finish: 31207 },
  { name: 'Mark Saroni',           country: 'United States', pro_pos: 50, swim: 3687, bike: 16553, run: 10765, finish: 31330 },
  { name: 'Matt Jackson',          country: 'United States', pro_pos: 51, swim: 3620, bike: 16677, run: 10924, finish: 31499 },
  { name: 'Tom Vaelen',            country: 'Belgium',       pro_pos: 52, swim: 3006, bike: 14447, run: 14035, finish: 31761 },
  { name: 'Jason Quinn',           country: 'United States', pro_pos: 53, swim: 3016, bike: 16513, run: 11709, finish: 31853 },
  { name: 'Levente Lukacs',        country: 'Hungary',       pro_pos: 54, swim: 3008, bike: 16364, run: 12534, finish: 32208 },
  { name: 'Alex Ion',              country: 'Romania',       pro_pos: 55, swim: 3027, bike: 16507, run: 13451, finish: 33298 },
  { name: 'Simon Shi',             country: 'United States', pro_pos: 56, swim: 2916, bike: 15714, run: 15575, finish: 34511 },
]

const MPRO_DNF = [
  { name: 'Jelle Geens',            country: 'Belgium',       swim: 2909, bike: 14260, run: null,  finish: null },
  { name: 'Antonio Benito López',   country: 'Spain',         swim: 2899, bike: 14266, run: null,  finish: null },
  { name: 'Scott Steenberg',        country: 'Denmark',       swim: 3024, bike: 14974, run: null,  finish: null },
  { name: 'Nicholas Chase',         country: 'United States', swim: 3134, bike: 14977, run: null,  finish: null },
  { name: 'Almog Elazary',          country: 'Israel',        swim: 3001, bike: 15561, run: null,  finish: null },
  { name: 'Elliot Bach',            country: 'United States', swim: 3249, bike: 15590, run: null,  finish: null },
  { name: 'Brad Bischoff',          country: 'United States', swim: 3241, bike: 15991, run: null,  finish: null },
  { name: 'Jason West',             country: 'United States', swim: 2917, bike: 14844, run: null,  finish: null },
  { name: 'Robert Kallin',          country: 'Sweden',        swim: 3129, bike: 16531, run: null,  finish: null },
  { name: 'Strahinja Trakic',       country: 'Serbia',        swim: 3132, bike: 16757, run: null,  finish: null },
  { name: 'Michael Arishita',       country: 'United States', swim: 3242, bike: 16617, run: null,  finish: null },
  { name: 'David Reynolds',         country: 'United States', swim: 3306, bike: 16716, run: null,  finish: null },
  { name: 'Arnaud Guilloux',        country: 'France',        swim: 3014, bike: null,  run: null,  finish: null },
  { name: 'Patrick Lange',          country: 'Germany',       swim: 3127, bike: null,  run: null,  finish: null },
  { name: 'Matt Kerr',              country: 'New Zealand',   swim: 3246, bike: null,  run: null,  finish: null },
  { name: 'Marius Bjerkeset',       country: 'Norway',        swim: 3309, bike: null,  run: null,  finish: null },
  { name: 'Jason Pohl',             country: 'Canada',        swim: 3421, bike: null,  run: null,  finish: null },
  { name: 'Zack Cooper',            country: 'Great Britain', swim: 3572, bike: null,  run: null,  finish: null },
]

const FPRO_FIN = [
  { name: 'Solveig Løvseth',    country: 'Norway',        pro_pos: 1,  swim: 3404, bike: 15622, run: 10192, finish: 29469 },
  { name: 'Taylor Knibb',       country: 'United States', pro_pos: 2,  swim: 3216, bike: 15746, run: 10446, finish: 29688 },
  { name: 'Marta Sánchez',      country: 'Spain',         pro_pos: 3,  swim: 3211, bike: 16376, run: 10781, finish: 30666 },
  { name: 'Jackie Hering',      country: 'United States', pro_pos: 4,  swim: 3419, bike: 16531, run: 10724, finish: 30986 },
  { name: 'Grace Thek',         country: 'Australia',     pro_pos: 5,  swim: 3414, bike: 16569, run: 10982, finish: 31244 },
  { name: 'Sara Svensk',        country: 'Sweden',        pro_pos: 6,  swim: 3916, bike: 16399, run: 10690, finish: 31298 },
  { name: 'Hannah Berry',       country: 'New Zealand',   pro_pos: 7,  swim: 3389, bike: 16163, run: 11561, finish: 31396 },
  { name: 'Jana Uderstadt',     country: 'Germany',       pro_pos: 8,  swim: 3866, bike: 16558, run: 11456, finish: 32134 },
  { name: 'Kate Curran',        country: 'Great Britain', pro_pos: 9,  swim: 3417, bike: 17368, run: 11368, finish: 32440 },
  { name: 'Gabrielle Lumkes',   country: 'United States', pro_pos: 10, swim: 3433, bike: 16717, run: 12272, finish: 32692 },
  { name: 'Rebecca Kawaoka',    country: 'United States', pro_pos: 11, swim: 3938, bike: 17436, run: 11120, finish: 32787 },
  { name: 'Katie Remond',       country: 'Australia',     pro_pos: 12, swim: 3917, bike: 17461, run: 11565, finish: 33243 },
  { name: 'Johanna Ahrens',     country: 'Germany',       pro_pos: 13, swim: 3430, bike: 16813, run: 12794, finish: 33312 },
  { name: 'Margarita Ryan',     country: 'United States', pro_pos: 14, swim: 3205, bike: 18727, run: 11431, finish: 33691 },
  { name: 'Carolyn Olsen',      country: 'United States', pro_pos: 15, swim: 4210, bike: 17711, run: 11849, finish: 34087 },
  { name: 'Leslie Homol',       country: 'United States', pro_pos: 16, swim: 4129, bike: 17780, run: 11945, finish: 34173 },
  { name: 'Joanna Ryter',       country: 'Switzerland',   pro_pos: 17, swim: 4132, bike: 17413, run: 12815, finish: 34587 },
  { name: 'Olivia Dietzel',     country: 'United States', pro_pos: 18, swim: 5169, bike: 19758, run: 11532, finish: 36393 },
  { name: 'Sarah Karpinski',    country: 'United States', pro_pos: 19, swim: 4493, bike: 18821, run: 12670, finish: 36489 },
]

const FPRO_DNF = [
  { name: 'Lottie Lucas',        country: 'UAE',           swim: 3419, bike: 17548, run: null, finish: null },
  { name: 'Kat Matthews',        country: 'Great Britain', swim: 3409, bike: null,  run: null, finish: null },
  { name: 'Annamarie Strehlow',  country: 'United States', swim: 3868, bike: null,  run: null, finish: null },
  { name: 'Danielle Lewis',      country: 'United States', swim: 3915, bike: null,  run: null, finish: null },
]

// ── Fetch all athletes to build lookup ────────────────────────────────────────
const { data: dbAthletes } = await sb.from('athletes').select('id, name, gender, current_price')
const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
const byKey = new Map(dbAthletes.map(a => [`${normalize(a.name)}|${a.gender}`, a]))

// ── Ensure all athletes exist ────────────────────────────────────────────────
const allEntries = [
  ...MPRO_FIN.map(r => ({ ...r, gender: 'M', dnf: false })),
  ...MPRO_DNF.map(r => ({ ...r, gender: 'M', dnf: true,  pro_pos: null })),
  ...FPRO_FIN.map(r => ({ ...r, gender: 'F', dnf: false })),
  ...FPRO_DNF.map(r => ({ ...r, gender: 'F', dnf: true,  pro_pos: null })),
]

const toCreate = []
for (const r of allEntries) {
  const key = `${normalize(r.name)}|${r.gender}`
  if (!byKey.has(key)) {
    let basePrice = 10
    if (r.pro_pos === 1) basePrice = 22
    else if (r.pro_pos === 2) basePrice = 18
    else if (r.pro_pos === 3) basePrice = 15
    else if (r.pro_pos && r.pro_pos <= 5) basePrice = 13
    else if (r.pro_pos && r.pro_pos <= 10) basePrice = 11
    toCreate.push({ name: r.name, gender: r.gender, type: 'pro', country: r.country, current_price: basePrice, price_change: 0, pto_rank: null, age_group: null, club: null })
  }
}

if (toCreate.length > 0) {
  console.log(`→ Creating ${toCreate.length} missing athletes:`)
  toCreate.forEach(a => console.log(`   + ${a.name} (${a.gender})`))
  const { data: created, error } = await sb.from('athletes').upsert(toCreate, { onConflict: 'name,gender,type' }).select('id, name, gender, current_price')
  if (error) { console.error('Error creating athletes:', error); process.exit(1) }
  for (const a of created) byKey.set(`${normalize(a.name)}|${a.gender}`, a)
  console.log(`  ✅ ${created.length} created`)
}

// Refresh map with latest prices
const { data: freshAthletes } = await sb.from('athletes').select('id, name, gender, current_price')
const freshMap = new Map(freshAthletes.map(a => [`${normalize(a.name)}|${a.gender}`, a]))

// ── Build and upsert result rows ──────────────────────────────────────────────
const rows = []
const missing = []
for (const r of allEntries) {
  const key = `${normalize(r.name)}|${r.gender}`
  const athlete = freshMap.get(key)
  if (!athlete) { missing.push(r.name); continue }
  rows.push({
    race_id: RACE_ID,
    athlete_id: athlete.id,
    pro_pos: r.pro_pos ?? null,
    swim_time: r.swim ?? null,
    bike_time: r.bike ?? null,
    run_time: r.run ?? null,
    finish_time: r.finish ?? null,
    dnf: r.dnf,
    dns: false,
    kona_slot: false,
  })
}

if (missing.length) console.warn('⚠️  Not found:', missing)

console.log(`\n→ Upserting ${rows.length} results...`)
const { error: insErr } = await sb.from('results').upsert(rows, { onConflict: 'race_id,athlete_id' })
if (insErr) { console.error('Upsert error:', insErr); process.exit(1) }
console.log(`  ✅ ${rows.length} results saved`)

// ── Market update ─────────────────────────────────────────────────────────────
console.log('\n→ Running market update...')
const { data: raceResults } = await sb
  .from('results')
  .select('*, athlete:athletes(id, name, type, current_price)')
  .eq('race_id', RACE_ID)

const MIN_PRICE = 1
const proFinishers = raceResults.filter(r => !r.dnf && !r.dns && r.athlete?.type === 'pro')
const bestSwimM = Math.min(...proFinishers.filter(r => r.athlete && freshMap.get(`${normalize(r.athlete.name)}|M`)).map(r => r.swim_time ?? Infinity))
const bestBikeM = Math.min(...proFinishers.filter(r => r.athlete && freshMap.get(`${normalize(r.athlete.name)}|M`)).map(r => r.bike_time ?? Infinity))
const bestRunM  = Math.min(...proFinishers.filter(r => r.athlete && freshMap.get(`${normalize(r.athlete.name)}|M`)).map(r => r.run_time  ?? Infinity))
const bestSwimF = Math.min(...proFinishers.filter(r => r.athlete && freshMap.get(`${normalize(r.athlete.name)}|F`)).map(r => r.swim_time ?? Infinity))
const bestBikeF = Math.min(...proFinishers.filter(r => r.athlete && freshMap.get(`${normalize(r.athlete.name)}|F`)).map(r => r.bike_time ?? Infinity))
const bestRunF  = Math.min(...proFinishers.filter(r => r.athlete && freshMap.get(`${normalize(r.athlete.name)}|F`)).map(r => r.run_time  ?? Infinity))

// Determine gender from freshMap
const getGender = (athleteName) => {
  for (const [key, a] of freshMap) {
    if (normalize(a.name) === normalize(athleteName)) return key.split('|')[1]
  }
  return null
}

function proMarketDelta(pos, dnf, dns, swimFastest, bikeFastest, runFastest) {
  const reasons = []; let delta = 0
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

const marketLog = []
for (const r of raceResults) {
  const athlete = r.athlete
  if (!athlete?.id || athlete.type !== 'pro') continue

  // Look up gender from freshMap (join doesn't include gender)
  const athleteInMap = [...freshMap.values()].find(a => a.id === athlete.id)
  const gender = athleteInMap ? [...freshMap.entries()].find(([k, a]) => a.id === athlete.id)?.[0].split('|')[1] : null

  const bestSwim = gender === 'F' ? bestSwimF : bestSwimM
  const bestBike = gender === 'F' ? bestBikeF : bestBikeM
  const bestRun  = gender === 'F' ? bestRunF  : bestRunM

  const oldPrice = Number(athlete.current_price ?? 10)
  const { delta, reasons } = proMarketDelta(
    r.pro_pos, r.dnf, r.dns,
    r.swim_time != null && r.swim_time === bestSwim,
    r.bike_time != null && r.bike_time === bestBike,
    r.run_time  != null && r.run_time  === bestRun,
  )

  const newPrice = Math.max(MIN_PRICE, oldPrice + delta)
  const actualDelta = newPrice - oldPrice

  await sb.from('athletes').update({ current_price: newPrice, price_change: actualDelta }).eq('id', athlete.id)
  await sb.from('athlete_price_history').insert({ athlete_id: athlete.id, price: newPrice, change: actualDelta, reason: 'race_result', race_id: RACE_ID })

  const { data: futureParts } = await sb.from('race_athletes').select('id, races!inner(status)').eq('athlete_id', athlete.id).in('races.status', ['open', 'upcoming'])
  if (futureParts?.length) await sb.from('race_athletes').update({ price: newPrice }).in('id', futureParts.map(rp => rp.id))

  marketLog.push({ name: athlete.name, gender, oldPrice, newPrice, delta: actualDelta, reasons })
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n  Best segments — M swim:${bestSwimM}s bike:${bestBikeM}s run:${bestRunM}s`)
console.log(`                  F swim:${bestSwimF}s bike:${bestBikeF}s run:${bestRunF}s`)
console.log('\n📊 Market Update Summary:')
console.log('─'.repeat(65))
for (const m of marketLog.sort((a, b) => b.delta - a.delta)) {
  const arrow = m.delta > 0 ? '▲' : m.delta < 0 ? '▼' : '─'
  const sign  = m.delta > 0 ? '+' : ''
  console.log(`  ${arrow} ${(m.gender ?? '?')} ${m.name.padEnd(26)} T$${String(m.oldPrice).padStart(2)} → T$${String(m.newPrice).padStart(2)} (${sign}${m.delta})`)
}
console.log('─'.repeat(65))
console.log(`\n✅ IRONMAN Texas 2026 — ${rows.length} results + market updated.`)
