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
    const val = match[2].trim().replace(/^"(.*)"$/, '$1').replace(/\\n$/, '').trim()
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
}

async function supabase(path, method = 'GET', body, prefer = 'return=representation') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { ...headers, ...(body ? { 'Prefer': prefer } : {}) },
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
  country_code: 'JP',
  distance: 'olympic',
  has_pro_field: true,
  status: 'upcoming',
}

// ── Athletes ──────────────────────────────────────────────────────────────────
const MEN = [
  // Great Britain (5)
  { name: 'Alex Yee',        country: 'Great Britain', country_code: 'GB' },
  { name: 'Hugo Milner',     country: 'Great Britain', country_code: 'GB' },
  { name: 'Jack Willis',     country: 'Great Britain', country_code: 'GB' },
  { name: 'Harry Leleu',     country: 'Great Britain', country_code: 'GB' },
  { name: 'Max Stapley',     country: 'Great Britain', country_code: 'GB' },
  // Australia (4)
  { name: 'Matthew Hauser',    country: 'Australia', country_code: 'AU' },
  { name: 'Luke Willian',      country: 'Australia', country_code: 'AU' },
  { name: 'Brandon Copeland',  country: 'Australia', country_code: 'AU' },
  { name: 'Bradley Course',    country: 'Australia', country_code: 'AU' },
  // United States (5)
  { name: 'Morgan Pearson',    country: 'United States', country_code: 'US' },
  { name: 'John Reed',         country: 'United States', country_code: 'US' },
  { name: 'Reese Vannerson',   country: 'United States', country_code: 'US' },
  { name: 'Darr Smith',        country: 'United States', country_code: 'US' },
  { name: 'Chase McQueen',     country: 'United States', country_code: 'US' },
  // Germany (4)
  { name: 'Tim Hellwig',       country: 'Germany', country_code: 'DE' },
  { name: 'Valentin Wernz',    country: 'Germany', country_code: 'DE' },
  { name: 'Jonas Osterholt',   country: 'Germany', country_code: 'DE' },
  { name: 'Chris Ziehmer',     country: 'Germany', country_code: 'DE' },
  // Canada (3)
  { name: 'Charles Paquet',    country: 'Canada', country_code: 'CA' },
  { name: 'Mathis Beaulieu',   country: 'Canada', country_code: 'CA' },
  { name: 'Martin Sobey',      country: 'Canada', country_code: 'CA' },
  // Belgium (3)
  { name: 'Arnaud Mengal',        country: 'Belgium', country_code: 'BE' },
  { name: 'Erwin Vanderplancke',  country: 'Belgium', country_code: 'BE' },
  { name: 'Marten van Riel',      country: 'Belgium', country_code: 'BE' },
  // Hungary (2)
  { name: 'Marton Kropko',    country: 'Hungary', country_code: 'HU' },
  { name: 'Zsombor Devay',    country: 'Hungary', country_code: 'HU' },
  // Norway (2)
  { name: 'Vetle Bergsvik Thorn', country: 'Norway', country_code: 'NO' },
  { name: 'Sebastian Wernersen',  country: 'Norway', country_code: 'NO' },
  // Luxembourg (2)
  { name: 'Theo Marti',       country: 'Luxembourg', country_code: 'LU' },
  { name: 'Gregor Payet',     country: 'Luxembourg', country_code: 'LU' },
  // Single-athlete nations
  { name: 'Miguel Hidalgo',         country: 'Brazil',       country_code: 'BR' },
  { name: 'Max Studer',             country: 'Switzerland',  country_code: 'CH' },
  { name: 'Izan Edo Aguilar',       country: 'Spain',        country_code: 'ES' },
  { name: 'Diego Moya',             country: 'Chile',        country_code: 'CL' },
  { name: 'Aram Penaflor Moysen',   country: 'Mexico',       country_code: 'MX' },
  { name: 'Vasco Vilaca',           country: 'Portugal',     country_code: 'PT' },
  // Japan (10)
  { name: 'Takumi Hojo',      country: 'Japan', country_code: 'JP' },
  { name: 'Takuto Oshima',    country: 'Japan', country_code: 'JP' },
  { name: 'Aoba Yasumatsu',   country: 'Japan', country_code: 'JP' },
  { name: 'Kenji Nener',      country: 'Japan', country_code: 'JP' },
  { name: 'Genta Uchida',     country: 'Japan', country_code: 'JP' },
  { name: 'Kazushi Jozuka',   country: 'Japan', country_code: 'JP' },
  { name: 'Ren Sato',         country: 'Japan', country_code: 'JP' },
  { name: 'Koki Iwamoto',     country: 'Japan', country_code: 'JP' },
  { name: 'Satoshi Iwamoto',  country: 'Japan', country_code: 'JP' },
  { name: 'Kenshin Mori',     country: 'Japan', country_code: 'JP' },
].map(a => ({ ...a, gender: 'M', type: 'pro' }))

const WOMEN = [
  // Great Britain (4)
  { name: 'Beth Potter',     country: 'Great Britain', country_code: 'GB' },
  { name: 'Kate Waugh',      country: 'Great Britain', country_code: 'GB' },
  { name: 'Sian Rainsley',   country: 'Great Britain', country_code: 'GB' },
  { name: 'Jess Fullagar',   country: 'Great Britain', country_code: 'GB' },
  // Germany (6)
  { name: 'Lisa Tertsch',      country: 'Germany', country_code: 'DE' },
  { name: 'Laura Lindemann',   country: 'Germany', country_code: 'DE' },
  { name: 'Nina Eim',          country: 'Germany', country_code: 'DE' },
  { name: 'Annika Koch',       country: 'Germany', country_code: 'DE' },
  { name: 'Franka Rust',       country: 'Germany', country_code: 'DE' },
  { name: 'Julia Brocker',     country: 'Germany', country_code: 'DE' },
  // Luxembourg (2)
  { name: 'Jeanne Lehair',    country: 'Luxembourg', country_code: 'LU' },
  { name: 'Eva Daniels',      country: 'Luxembourg', country_code: 'LU' },
  // France (1)
  { name: 'Emma Lombardi',    country: 'France', country_code: 'FR' },
  // United States (5)
  { name: 'Taylor Spivey',    country: 'United States', country_code: 'US' },
  { name: 'Kirsten Kasper',   country: 'United States', country_code: 'US' },
  { name: 'Gwen Jorgensen',   country: 'United States', country_code: 'US' },
  { name: 'Katie Zaferes',    country: 'United States', country_code: 'US' },
  { name: 'Taylor Knibb',     country: 'United States', country_code: 'US' },
  // Australia (1)
  { name: 'Richelle Hill',    country: 'Australia', country_code: 'AU' },
  // Sweden (1)
  { name: 'Tilda Mansson',    country: 'Sweden', country_code: 'SE' },
  // Japan (8)
  { name: 'Manami Hayashi',    country: 'Japan', country_code: 'JP' },
  { name: 'Kanae Takenaka',    country: 'Japan', country_code: 'JP' },
  { name: 'Sarika Nakayama',   country: 'Japan', country_code: 'JP' },
  { name: 'Miyu Sakai',        country: 'Japan', country_code: 'JP' },
  { name: 'Himeka Sato',       country: 'Japan', country_code: 'JP' },
  { name: 'Minori Ikeno',      country: 'Japan', country_code: 'JP' },
  { name: 'Mako Hiraizumi',    country: 'Japan', country_code: 'JP' },
  { name: 'Yoshiko Sato',      country: 'Japan', country_code: 'JP' },
  // AIN – Authorized Individual Neutral (3)
  { name: 'Diana Isakova',       country: 'AIN', country_code: null },
  { name: 'Valentina Riasova',   country: 'AIN', country_code: null },
  { name: 'Iana Chenskaia',      country: 'AIN', country_code: null },
  // Portugal (1)
  { name: 'Maria Tome',          country: 'Portugal',       country_code: 'PT' },
  // Spain (2)
  { name: 'Miriam Casillas Garcia',      country: 'Spain', country_code: 'ES' },
  { name: 'Cecilia Santamaria Surroca',  country: 'Spain', country_code: 'ES' },
  // Czech Republic (2)
  { name: 'Tereza Zimovjanova',  country: 'Czech Republic', country_code: 'CZ' },
  { name: 'Heidi Jurankova',     country: 'Czech Republic', country_code: 'CZ' },
  // Hungary (1)
  { name: 'Marta Kropko',        country: 'Hungary',  country_code: 'HU' },
  // Brazil (1)
  { name: 'Djenyfer Arnold',     country: 'Brazil',   country_code: 'BR' },
].map(a => ({ ...a, gender: 'F', type: 'pro' }))

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
    }, 'resolution=merge-duplicates,return=representation')
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
