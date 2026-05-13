/**
 * Seed script: 2026 WTCS Yokohama
 * Run from /tmp/trifantasy-fresh: node scripts/seed-yokohama-2026.mjs
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envPath = resolve(__dirname, '../.env.local')
const envContent = readFileSync(envPath, 'utf8')
const env = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=\s][^=]*)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    const val = match[2].trim().replace(/^"(.*)"$/, '$1')
    env[key] = val
  }
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const headers = {
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'apikey': SERVICE_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
}

async function supabase(path, method = 'GET', body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: body ? headers : { ...headers, 'Content-Type': undefined },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`)
  return text ? JSON.parse(text) : null
}

function normalizeName(name) {
  return name.trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
}

// ── Race ─────────────────────────────────────────────────────────────────────
const RACE = {
  name: '2026 World Triathlon Championship Series Yokohama',
  slug: '2026-world-triathlon-championship-series-yokohama',
  date: '2026-05-16',
  location: 'Yokohama',
  country: 'Japan',
  country_code: 'JPN',
  distance: 'olympic',
  has_pro_field: true,
  status: 'upcoming',
}

// ── Athletes ──────────────────────────────────────────────────────────────────
const MEN = [
  // Great Britain (5)
  { name: 'Alex Yee',        country: 'Great Britain', country_code: 'GBR' },
  { name: 'Hugo Milner',     country: 'Great Britain', country_code: 'GBR' },
  { name: 'Jack Willis',     country: 'Great Britain', country_code: 'GBR' },
  { name: 'Harry Leleu',     country: 'Great Britain', country_code: 'GBR' },
  { name: 'Max Stapley',     country: 'Great Britain', country_code: 'GBR' },
  // Australia (4)
  { name: 'Matthew Hauser',    country: 'Australia', country_code: 'AUS' },
  { name: 'Luke Willian',      country: 'Australia', country_code: 'AUS' },
  { name: 'Brandon Copeland',  country: 'Australia', country_code: 'AUS' },
  { name: 'Bradley Course',    country: 'Australia', country_code: 'AUS' },
  // United States (5)
  { name: 'Morgan Pearson',    country: 'United States', country_code: 'USA' },
  { name: 'John Reed',         country: 'United States', country_code: 'USA' },
  { name: 'Reese Vannerson',   country: 'United States', country_code: 'USA' },
  { name: 'Darr Smith',        country: 'United States', country_code: 'USA' },
  { name: 'Chase McQueen',     country: 'United States', country_code: 'USA' },
  // Germany (4)
  { name: 'Tim Hellwig',       country: 'Germany', country_code: 'GER' },
  { name: 'Valentin Wernz',    country: 'Germany', country_code: 'GER' },
  { name: 'Jonas Osterholt',   country: 'Germany', country_code: 'GER' },
  { name: 'Chris Ziehmer',     country: 'Germany', country_code: 'GER' },
  // Canada (3)
  { name: 'Charles Paquet',    country: 'Canada', country_code: 'CAN' },
  { name: 'Mathis Beaulieu',   country: 'Canada', country_code: 'CAN' },
  { name: 'Martin Sobey',      country: 'Canada', country_code: 'CAN' },
  // Belgium (3)
  { name: 'Arnaud Mengal',        country: 'Belgium', country_code: 'BEL' },
  { name: 'Erwin Vanderplancke',  country: 'Belgium', country_code: 'BEL' },
  { name: 'Marten van Riel',      country: 'Belgium', country_code: 'BEL' },
  // Hungary (2)
  { name: 'Marton Kropko',    country: 'Hungary', country_code: 'HUN' },
  { name: 'Zsombor Devay',    country: 'Hungary', country_code: 'HUN' },
  // Norway (2)
  { name: 'Vetle Bergsvik Thorn', country: 'Norway', country_code: 'NOR' },
  { name: 'Sebastian Wernersen',  country: 'Norway', country_code: 'NOR' },
  // Luxembourg (2)
  { name: 'Theo Marti',       country: 'Luxembourg', country_code: 'LUX' },
  { name: 'Gregor Payet',     country: 'Luxembourg', country_code: 'LUX' },
  // Single-athlete nations
  { name: 'Miguel Hidalgo',         country: 'Brazil',       country_code: 'BRA' },
  { name: 'Max Studer',             country: 'Switzerland',  country_code: 'SUI' },
  { name: 'Izan Edo Aguilar',       country: 'Spain',        country_code: 'ESP' },
  { name: 'Diego Moya',             country: 'Chile',        country_code: 'CHI' },
  { name: 'Aram Penaflor Moysen',   country: 'Mexico',       country_code: 'MEX' },
  { name: 'Vasco Vilaca',           country: 'Portugal',     country_code: 'POR' },
  // Japan (10)
  { name: 'Takumi Hojo',      country: 'Japan', country_code: 'JPN' },
  { name: 'Takuto Oshima',    country: 'Japan', country_code: 'JPN' },
  { name: 'Aoba Yasumatsu',   country: 'Japan', country_code: 'JPN' },
  { name: 'Kenji Nener',      country: 'Japan', country_code: 'JPN' },
  { name: 'Genta Uchida',     country: 'Japan', country_code: 'JPN' },
  { name: 'Kazushi Jozuka',   country: 'Japan', country_code: 'JPN' },
  { name: 'Ren Sato',         country: 'Japan', country_code: 'JPN' },
  { name: 'Koki Iwamoto',     country: 'Japan', country_code: 'JPN' },
  { name: 'Satoshi Iwamoto',  country: 'Japan', country_code: 'JPN' },
  { name: 'Kenshin Mori',     country: 'Japan', country_code: 'JPN' },
].map(a => ({ ...a, gender: 'male', type: 'pro' }))

const WOMEN = [
  // Great Britain (4)
  { name: 'Beth Potter',     country: 'Great Britain', country_code: 'GBR' },
  { name: 'Kate Waugh',      country: 'Great Britain', country_code: 'GBR' },
  { name: 'Sian Rainsley',   country: 'Great Britain', country_code: 'GBR' },
  { name: 'Jess Fullagar',   country: 'Great Britain', country_code: 'GBR' },
  // Germany (6)
  { name: 'Lisa Tertsch',      country: 'Germany', country_code: 'GER' },
  { name: 'Laura Lindemann',   country: 'Germany', country_code: 'GER' },
  { name: 'Nina Eim',          country: 'Germany', country_code: 'GER' },
  { name: 'Annika Koch',       country: 'Germany', country_code: 'GER' },
  { name: 'Franka Rust',       country: 'Germany', country_code: 'GER' },
  { name: 'Julia Brocker',     country: 'Germany', country_code: 'GER' },
  // Luxembourg (2)
  { name: 'Jeanne Lehair',    country: 'Luxembourg', country_code: 'LUX' },
  { name: 'Eva Daniels',      country: 'Luxembourg', country_code: 'LUX' },
  // France (1)
  { name: 'Emma Lombardi',    country: 'France', country_code: 'FRA' },
  // United States (5)
  { name: 'Taylor Spivey',    country: 'United States', country_code: 'USA' },
  { name: 'Kirsten Kasper',   country: 'United States', country_code: 'USA' },
  { name: 'Gwen Jorgensen',   country: 'United States', country_code: 'USA' },
  { name: 'Katie Zaferes',    country: 'United States', country_code: 'USA' },
  { name: 'Taylor Knibb',     country: 'United States', country_code: 'USA' },
  // Australia (1)
  { name: 'Richelle Hill',    country: 'Australia', country_code: 'AUS' },
  // Sweden (1)
  { name: 'Tilda Mansson',    country: 'Sweden', country_code: 'SWE' },
  // Japan (8)
  { name: 'Manami Hayashi',    country: 'Japan', country_code: 'JPN' },
  { name: 'Kanae Takenaka',    country: 'Japan', country_code: 'JPN' },
  { name: 'Sarika Nakayama',   country: 'Japan', country_code: 'JPN' },
  { name: 'Miyu Sakai',        country: 'Japan', country_code: 'JPN' },
  { name: 'Himeka Sato',       country: 'Japan', country_code: 'JPN' },
  { name: 'Minori Ikeno',      country: 'Japan', country_code: 'JPN' },
  { name: 'Mako Hiraizumi',    country: 'Japan', country_code: 'JPN' },
  { name: 'Yoshiko Sato',      country: 'Japan', country_code: 'JPN' },
  // AIN – Authorized Individual Neutral (3)
  { name: 'Diana Isakova',       country: 'AIN', country_code: 'AIN' },
  { name: 'Valentina Riasova',   country: 'AIN', country_code: 'AIN' },
  { name: 'Iana Chenskaia',      country: 'AIN', country_code: 'AIN' },
  // Portugal (1)
  { name: 'Maria Tome',          country: 'Portugal',       country_code: 'POR' },
  // Spain (2)
  { name: 'Miriam Casillas Garcia',      country: 'Spain', country_code: 'ESP' },
  { name: 'Cecilia Santamaria Surroca',  country: 'Spain', country_code: 'ESP' },
  // Czech Republic (2)
  { name: 'Tereza Zimovjanova',  country: 'Czech Republic', country_code: 'CZE' },
  { name: 'Heidi Jurankova',     country: 'Czech Republic', country_code: 'CZE' },
  // Hungary (1)
  { name: 'Marta Kropko',        country: 'Hungary',  country_code: 'HUN' },
  // Brazil (1)
  { name: 'Djenyfer Arnold',     country: 'Brazil',   country_code: 'BRA' },
].map(a => ({ ...a, gender: 'female', type: 'pro' }))

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🏁 Seeding 2026 WTCS Yokohama...\n')

  // 1. Upsert race
  console.log('📅 Creating race...')
  const existing = await supabase(`races?slug=eq.${RACE.slug}&select=id`, 'GET')
  let raceId

  if (existing?.length > 0) {
    raceId = existing[0].id
    await supabase(`races?id=eq.${raceId}`, 'PATCH', RACE)
    console.log(`   ↩ Updated existing race: ${raceId}`)
  } else {
    const created = await supabase('races', 'POST', RACE)
    raceId = created[0].id
    console.log(`   ✅ Created race: ${raceId}`)
  }

  // 2. Process athletes
  const allAthletes = [...MEN, ...WOMEN]
  let newCount = 0
  let updatedCount = 0
  const newAthletes = []

  console.log(`\n👥 Processing ${MEN.length} men + ${WOMEN.length} women = ${allAthletes.length} athletes...\n`)

  for (const raw of allAthletes) {
    const name = normalizeName(raw.name)

    // Check if athlete exists
    const found = await supabase(
      `athletes?name=eq.${encodeURIComponent(name)}&gender=eq.${raw.gender}&type=eq.${raw.type}&select=id`,
      'GET'
    )

    let athleteId
    if (found?.length > 0) {
      athleteId = found[0].id
      // Update country info
      await supabase(`athletes?id=eq.${athleteId}`, 'PATCH', {
        country: raw.country,
        country_code: raw.country_code,
      })
      updatedCount++
    } else {
      // Create new athlete
      const created = await supabase('athletes', 'POST', {
        name,
        gender: raw.gender,
        type: raw.type,
        country: raw.country,
        country_code: raw.country_code,
      })
      athleteId = created[0].id
      newCount++
      newAthletes.push(`${name} (${raw.country_code})`)
    }

    // Link to race (upsert)
    await supabase(`race_athletes?on_conflict=race_id,athlete_id`, 'POST', {
      race_id: raceId,
      athlete_id: athleteId,
      price: 10,
    })
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('─'.repeat(60))
  console.log(`✅ Done!`)
  console.log(`   Race ID : ${raceId}`)
  console.log(`   Men     : ${MEN.length}`)
  console.log(`   Women   : ${WOMEN.length} (NOTE: official list has 39, verify 1 may be missing)`)
  console.log(`   New athletes created : ${newCount}`)
  console.log(`   Existing updated     : ${updatedCount}`)

  if (newAthletes.length > 0) {
    console.log('\n🆕 New athletes (not previously in system):')
    newAthletes.forEach(a => console.log(`   • ${a}`))
  }

  console.log('\n⚠️  Prices set to T$10 default — update via /admin/atletas')
  console.log('⚠️  Check official startlist for the 1 possible missing woman athlete')
}

main().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
