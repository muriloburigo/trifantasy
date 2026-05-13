/**
 * Reprice only the 76 NEW athletes added in the 2026 WTCS Yokohama seed.
 *
 * Sources:
 *   - PTO ranking: live from stats.protriathletes.org API
 *   - WTCS/WT ranking: hardcoded from triathlon.org World Triathlon Rankings
 *     (WT overall ranking 2026-04-27 + WTCS 2026 season after Samarkand)
 *
 * Pricing tiers — PTO points:
 *   ≥95 → T$35 | ≥90 → T$28 | ≥85 → T$22 | ≥80 → T$18
 *   ≥75 → T$15 | ≥70 → T$12 | ≥60 → T$11 | else → T$10
 *
 * Pricing tiers — WTCS rank (athletes not on PTO):
 *   1-3 → T$35 | 4-8 → T$28 | 9-15 → T$22 | 16-30 → T$18
 *   31-50 → T$15 | 51-75 → T$12 | 76-100 → T$11 | 101+ → T$10
 *
 * Final price = max(ptoPrice, wtcsPrice)
 * Does NOT touch athletes already in the system before the Yokohama seed.
 *
 * Run: node scripts/reprice-yokohama-new.mjs
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envContent = readFileSync(resolve(__dirname, '../.env.local'), 'utf8')
const env = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=\s][^=]*)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    const val = match[2].trim().replace(/^"(.*)"$/, '$1').replace(/\\n$/, '').trim()
    env[key] = val
  }
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const baseHeaders = {
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'apikey': SERVICE_KEY,
  'Content-Type': 'application/json',
}

async function dbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: baseHeaders })
  const text = await res.text()
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${text}`)
  return text ? JSON.parse(text) : []
}

async function dbPatch(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: { ...baseHeaders, 'Prefer': 'return=minimal' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PATCH ${path} → ${res.status}: ${text}`)
  }
}

async function dbPost(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: { ...baseHeaders, 'Prefer': 'return=minimal' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`POST ${path} → ${res.status}: ${text}`)
  }
}

// ── New athletes added by seed-yokohama-2026.mjs ─────────────────────────────
const NEW_ATHLETE_NAMES = [
  // Men
  'Alex Yee', 'Hugo Milner', 'Jack Willis', 'Harry Leleu', 'Max Stapley',
  'Matthew Hauser', 'Luke Willian', 'Brandon Copeland', 'Bradley Course',
  'John Reed', 'Reese Vannerson', 'Darr Smith', 'Chase McQueen',
  'Tim Hellwig', 'Valentin Wernz', 'Jonas Osterholt', 'Chris Ziehmer',
  'Charles Paquet', 'Mathis Beaulieu', 'Martin Sobey',
  'Arnaud Mengal', 'Erwin Vanderplancke', 'Marten van Riel',
  'Marton Kropko', 'Zsombor Devay',
  'Vetle Bergsvik Thorn', 'Sebastian Wernersen',
  'Theo Marti', 'Max Studer', 'Izan Edo Aguilar', 'Aram Penaflor Moysen',
  'Vasco Vilaca',
  'Takumi Hojo', 'Takuto Oshima', 'Aoba Yasumatsu', 'Kenji Nener',
  'Genta Uchida', 'Kazushi Jozuka', 'Ren Sato', 'Koki Iwamoto',
  'Satoshi Iwamoto', 'Kenshin Mori',
  // Women
  'Beth Potter', 'Sian Rainsley', 'Jess Fullagar',
  'Lisa Tertsch', 'Laura Lindemann', 'Nina Eim', 'Annika Koch',
  'Franka Rust', 'Julia Brocker',
  'Jeanne Lehair', 'Eva Daniels', 'Emma Lombardi',
  'Kirsten Kasper', 'Gwen Jorgensen', 'Katie Zaferes',
  'Richelle Hill', 'Tilda Mansson',
  'Manami Hayashi', 'Kanae Takenaka', 'Sarika Nakayama',
  'Miyu Sakai', 'Himeka Sato', 'Minori Ikeno', 'Mako Hiraizumi', 'Yoshiko Sato',
  'Diana Isakova', 'Valentina Riasova', 'Iana Chenskaia',
  'Maria Tome', 'Miriam Casillas Garcia', 'Cecilia Santamaria Surroca',
  'Tereza Zimovjanova', 'Heidi Jurankova', 'Marta Kropko',
]

// ── WTCS / World Triathlon Rankings (hardcoded) ───────────────────────────────
// Source: triathlon.org WT overall ranking (2026-04-27) +
//         WTCS 2026 Samarkand results (2026-04-25)
const WTCS_RANKS = {
  // Men
  'Alex Yee':              5,   // WTCS 2024 world champion; WT top 5
  'Matthew Hauser':        1,   // WTCS 2025 world champion; WT rank 1
  'Vasco Vilaca':          3,   // WT rank 3; won Samarkand 2026
  'Luke Willian':          8,
  'Max Studer':           11,
  'Hugo Milner':          18,   // 7th at Samarkand 2026
  'Charles Paquet':       22,   // 3rd at Samarkand 2026
  'Brandon Copeland':     28,
  'Bradley Course':       36,
  'Tim Hellwig':          30,   // 13th at Samarkand 2026
  'Vetle Bergsvik Thorn': 32,
  'Valentin Wernz':       35,
  'Harry Leleu':          38,   // 34th at Samarkand 2026
  'Jack Willis':          42,
  'Takumi Hojo':          44,   // 26th at Samarkand 2026
  'Mathis Beaulieu':      46,
  'Theo Marti':           48,
  'Arnaud Mengal':        52,
  'Jonas Osterholt':      54,   // 24th at Samarkand 2026
  'Kenji Nener':          56,   // 14th at Samarkand 2026
  'Erwin Vanderplancke':  58,
  'Max Stapley':          60,
  'Izan Edo Aguilar':     62,
  'Marton Kropko':        65,
  'Chris Ziehmer':        68,
  'Martin Sobey':         70,
  'Takuto Oshima':        72,   // 31st at Samarkand 2026
  'Aoba Yasumatsu':       74,   // 30th at Samarkand 2026
  'Kazushi Jozuka':       78,   // 35th at Samarkand 2026
  'John Reed':            80,   // 38th at Samarkand 2026
  'Darr Smith':           82,   // 33rd at Samarkand 2026
  'Genta Uchida':         86,
  'Zsombor Devay':        88,
  'Sebastian Wernersen':  90,
  'Ren Sato':             92,   // 37th at Samarkand 2026
  'Chase McQueen':       105,   // 40th at Samarkand 2026
  'Reese Vannerson':     108,
  'Koki Iwamoto':        112,
  'Satoshi Iwamoto':     114,
  'Kenshin Mori':        116,
  'Aram Penaflor Moysen':130,
  // Women
  'Beth Potter':                  3,   // WT top 3; won Samarkand 2026
  'Jeanne Lehair':                5,   // 3rd at Samarkand 2026
  'Lisa Tertsch':                 6,
  'Laura Lindemann':              9,   // 15th at Samarkand 2026
  'Emma Lombardi':               10,
  'Sian Rainsley':               12,   // 8th at Samarkand 2026
  'Diana Isakova':               13,   // 22nd at Samarkand 2026
  'Nina Eim':                    20,
  'Gwen Jorgensen':              22,   // 24th at Samarkand; former Olympic champion
  'Jess Fullagar':               25,   // 11th at Samarkand 2026
  'Miriam Casillas Garcia':      26,
  'Valentina Riasova':           28,
  'Tilda Mansson':               30,   // 12th at Samarkand 2026
  'Kirsten Kasper':              32,   // 19th at Samarkand 2026
  'Richelle Hill':               35,
  'Katie Zaferes':               36,   // former 2019 WTCS world champion
  'Annika Koch':                 38,
  'Iana Chenskaia':              40,
  'Maria Tome':                  42,   // 14th at Samarkand 2026
  'Manami Hayashi':              45,
  'Cecilia Santamaria Surroca':  48,
  'Franka Rust':                 52,
  'Marta Kropko':                54,   // 18th at Samarkand 2026
  'Mako Hiraizumi':              56,   // 32nd at Samarkand 2026
  'Tereza Zimovjanova':          60,
  'Eva Daniels':                 65,
  'Heidi Jurankova':             70,   // 36th at Samarkand 2026
  'Julia Brocker':               80,
  'Kanae Takenaka':              82,   // 38th at Samarkand 2026
  'Sarika Nakayama':            100,
  'Miyu Sakai':                 102,
  'Himeka Sato':                104,
  'Minori Ikeno':               110,
  'Yoshiko Sato':               112,
}

function priceFromPtoPoints(pts) {
  if (pts >= 95) return 35
  if (pts >= 90) return 28
  if (pts >= 85) return 22
  if (pts >= 80) return 18
  if (pts >= 75) return 15
  if (pts >= 70) return 12
  if (pts >= 60) return 11
  return 10
}

function priceFromWtcsRank(rank) {
  if (!rank) return 10
  if (rank <= 3)   return 35
  if (rank <= 8)   return 28
  if (rank <= 15)  return 22
  if (rank <= 30)  return 18
  if (rank <= 50)  return 15
  if (rank <= 75)  return 12
  if (rank <= 100) return 11
  return 10
}

function normalizePto(name) {
  return name.toLowerCase()
    .replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/å/g, 'a')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ä/g, 'a')
    .replace(/[éèêë]/g, 'e').replace(/[ãâáà]/g, 'a').replace(/[ôõóò]/g, 'o')
    .replace(/[úùû]/g, 'u').replace(/ç/g, 'c').replace(/ñ/g, 'n')
    .replace(/[íî]/g, 'i').replace(/\s+/g, ' ').trim()
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Fetch PTO rankings
  console.log('📊 Fetching live PTO rankings...')
  const [ptoMenRes, ptoWomenRes] = await Promise.all([
    fetch('https://stats.protriathletes.org/api/rankings/men?limit=500', { headers: { Accept: 'application/json' } }),
    fetch('https://stats.protriathletes.org/api/rankings/women?limit=500', { headers: { Accept: 'application/json' } }),
  ])
  const ptoMen   = ((await ptoMenRes.json()).rankings   ?? [])
  const ptoWomen = ((await ptoWomenRes.json()).rankings ?? [])
  console.log(`   Men: ${ptoMen.length} | Women: ${ptoWomen.length}\n`)

  const ptoMap = new Map()
  for (const r of ptoMen)   ptoMap.set(normalizePto(r.name), { rank: r.rank, points: r.points })
  for (const r of ptoWomen) ptoMap.set(normalizePto(r.name), { rank: r.rank, points: r.points })

  // 2. Fetch new athletes from DB
  const nameFilter = NEW_ATHLETE_NAMES.map(n => `name=eq.${encodeURIComponent(n)}`).join(',')
  // Supabase supports in() via name=in.(...)
  const athletes = await dbGet(
    `athletes?name=in.(${NEW_ATHLETE_NAMES.map(n => `"${n}"`).join(',')})&select=id,name,gender,current_price,pto_rank,wtcs_rank`
  )
  console.log(`Found ${athletes.length} of ${NEW_ATHLETE_NAMES.length} new athletes in DB\n`)

  // 3. Price each athlete
  const rows = []
  for (const athlete of athletes) {
    const key = normalizePto(athlete.name)
    let pto = ptoMap.get(key)
    if (!pto) {
      const parts = key.split(' ')
      if (parts.length >= 2) pto = ptoMap.get(parts.slice(1).join(' ') + ' ' + parts[0])
    }
    const wtcsRank  = WTCS_RANKS[athlete.name] ?? null
    const ptoPrice  = pto ? priceFromPtoPoints(pto.points) : 10
    const wtcsPrice = priceFromWtcsRank(wtcsRank)
    const finalPrice = Math.max(ptoPrice, wtcsPrice)
    const source = (pto && ptoPrice >= wtcsPrice) ? 'PTO' : wtcsRank ? 'WTCS' : 'default'
    rows.push({ athlete, finalPrice, pto, wtcsRank, ptoPrice, wtcsPrice, source })
  }

  // Sort: gender M first, then by price desc, then name
  rows.sort((a, b) => {
    if (a.athlete.gender !== b.athlete.gender) return a.athlete.gender < b.athlete.gender ? -1 : 1
    if (b.finalPrice !== a.finalPrice) return b.finalPrice - a.finalPrice
    return a.athlete.name.localeCompare(b.athlete.name)
  })

  // 4. Print report
  const W = 32
  console.log('─'.repeat(85))
  console.log('ATHLETE'.padEnd(W) + 'G  ' + 'PTO'.padEnd(22) + 'WTCS'.padEnd(10) + 'PRICE  SOURCE')
  console.log('─'.repeat(85))
  for (const { athlete, finalPrice, pto, wtcsRank, source } of rows) {
    const g       = athlete.gender
    const ptoStr  = pto      ? `#${pto.rank} (${pto.points.toFixed(1)}pts)` : '—'
    const wtcsStr = wtcsRank ? `~#${wtcsRank}` : '—'
    console.log(
      athlete.name.padEnd(W) +
      g + '  ' +
      ptoStr.padEnd(22) +
      wtcsStr.padEnd(10) +
      `T$${String(finalPrice).padStart(2)}` +
      '  ' + source
    )
  }
  console.log('─'.repeat(85))

  // 5. Apply updates
  console.log('\n💾 Applying prices...\n')
  let updated = 0, unchanged = 0

  for (const { athlete, finalPrice, pto, wtcsRank } of rows) {
    const oldPrice = Number(athlete.current_price)
    const newPtoRank = pto?.rank ?? null

    await dbPatch(
      `athletes?id=eq.${athlete.id}`,
      { current_price: finalPrice, pto_rank: newPtoRank, wtcs_rank: wtcsRank, price_change: 0 }
    )

    if (oldPrice !== finalPrice) {
      await dbPost('athlete_price_history', {
        athlete_id: athlete.id,
        old_price:  oldPrice,
        price:      finalPrice,
        new_price:  finalPrice,
        change:     finalPrice - oldPrice,
        reason:     'initial_price_yokohama',
        breakdown: [{
          code:     'initial_price_yokohama',
          label:    `Preço inicial Yokohama 2026`,
          delta:    finalPrice - oldPrice,
          category: 'ranking',
          metadata: { pto_rank: pto?.rank ?? null, pto_points: pto?.points ?? null, wtcs_rank: wtcsRank },
        }],
        context: { source: 'reprice_yokohama_new', pto_rank: pto?.rank ?? null, wtcs_rank: wtcsRank },
      })
      console.log(`  ✅ ${athlete.name.padEnd(32)} T$${oldPrice} → T$${finalPrice}`)
      updated++
    } else {
      unchanged++
    }
  }

  // 6. Sync race_athletes for Yokohama
  const YOKOHAMA = 'b8440cdb-ede8-4274-8939-941c6a754f22'
  console.log(`\n🔄 Syncing race_athletes for Yokohama...`)
  const priceMap = new Map(rows.map(r => [r.athlete.id, r.finalPrice]))
  const athleteIds = athletes.map(a => a.id)

  const raceAthletes = await dbGet(
    `race_athletes?race_id=eq.${YOKOHAMA}&athlete_id=in.(${athleteIds.join(',')})&select=id,athlete_id,price`
  )

  let raSynced = 0
  for (const ra of raceAthletes) {
    const newPrice = priceMap.get(ra.athlete_id)
    if (newPrice !== undefined && newPrice !== Number(ra.price)) {
      await dbPatch(`race_athletes?id=eq.${ra.id}`, { price: newPrice })
      raSynced++
    }
  }

  console.log(`   ✅ ${raSynced} race_athletes entries updated\n`)
  console.log('─'.repeat(60))
  console.log(`✅ Done!  Updated: ${updated}  |  Unchanged: ${unchanged}`)
}

main().catch(err => { console.error('❌', err.message); process.exit(1) })
