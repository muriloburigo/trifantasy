/**
 * Fetch athlete photo URLs from PTO rankings and update athletes table.
 * Source: https://stats.protriathletes.org/rankings/men (and /women)
 * CDN:    https://content.protriathletes.org/content/images/{YYYY}/{MM}/{UUID}-w300.webp
 *
 * Run: node scripts/fetch-athlete-photos.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

// ─── Known UUIDs (from agent research + scraped rankings) ────────────────────
// CDN base: https://content.protriathletes.org/content/images/
const PTO_PHOTOS = {
  // PRO M
  'Kristian Blummenfelt':      '2023/05/de470021-5e6d-4dc6-a008-7060dc46650b',
  'Gustav Iden':               '2023/03/91dc01ce-696c-4840-b54c-67c0186924f6',
  'Casper Stornes':            null, // scrape below
  'Patrick Lange':             null,
  'Jelle Geens':               null,
  'Marten Van Riel':           null,
  'Jonas Schomburg':           null,
  'Leon Chevalier':            null,
  'Kristian Høgenhaug':        null,
  'Sam Long':                  null,
  'Magnus Ditlev':             null,
  'Lionel Sanders':            null,
  'Cameron Wurf':              null,
  'Florian Angert':            null,
  'Bradley Weiss':             null,
  'Matthew Marquardt':         null,
  'Gregory Barnaby':           null,
  'Joe Skipper':               null,
  'Frederic Funk':             null,
  'Jamie Riddle':              null,
  // PRO F
  'Taylor Knibb':              '2026/03/267e201f-fc85-410f-82ff-eb755c4cabd9',
  'Kat Matthews':              null,
  'Pamella Oliveira':          '2024/05/505466f3-1ee4-494e-bcf6-6c67cf403317',
  'Fernando Toldi':            '2021/05/a6e2c3f7-3786-43e9-ba0a-913cb11d943b',
  'Solveig Løvseth':           null,
  'Lucy Charles-Barclay':      '2025/04/c5946e0a-7833-4b14-aee8-dd3488d74d0f',
  'Hayden Wilde':              '2025/04/1450267a-3a96-42c0-8e44-6f41aabc65ce',
  'Daniela Bleymehl':          null,
  'Penny Slater':              null,
  'Daisy Davies':              null,
  'Katrine Græsbøll Christensen': null,
  // Brazilian PROs from Brasília
  'Reinaldo Colucci':          null,
  'Igor Amorelli':             null,
  'Enzo Krauss':               null,
  'Danilo Pimentel':           null,
  'Gabriel Klein':             null,
  'Yago Rodrigues':            null,
  'Pietra Picolo Meneghini':   null,
  'Fernanda Penkal':           null,
}

const CDN = 'https://content.protriathletes.org/content/images'

function photoUrl(uuid) {
  // Some newer photos don't have -w300, use plain URL
  return `${CDN}/${uuid}-w300.webp`
}

// ─── Scrape PTO rankings to fill in missing UUIDs ────────────────────────────

async function scrapePtoRankings(gender) {
  const url = `https://stats.protriathletes.org/rankings/${gender === 'M' ? 'men' : 'women'}`
  console.log(`  Scraping ${url}...`)
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Trixer/1.0)' }
  })
  if (!res.ok) { console.warn(`  Failed: ${res.status}`); return {} }
  const html = await res.text()

  const map = {}
  // Match: athlete name + image src with UUID
  // Pattern: "w300.webp" or similar in srcset/src near athlete names
  // The rankings page has JSON embedded in __NEXT_DATA__
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (!nextDataMatch) { console.warn('  No __NEXT_DATA__ found'); return {} }

  const nextData = JSON.parse(nextDataMatch[1])
  // Navigate the Next.js page props to find athlete data
  const props = nextData?.props?.pageProps
  const athletes = props?.athletes ?? props?.rankingAthletes ?? props?.data?.athletes ?? []

  if (!Array.isArray(athletes) || athletes.length === 0) {
    // Try to find it deeper in the data structure
    const str = JSON.stringify(nextData)
    // Extract all content.protriathletes.org image paths
    const imgMatches = str.matchAll(/"(https:\/\/content\.protriathletes\.org\/content\/images\/[^"]+)"/g)
    const nameMatches = str.matchAll(/"(fullName|name|athleteName)":"([^"]+)"/g)
    console.log(`  Found image refs in JSON data`)
    // Try to extract athlete+image pairs
    const allAthletes = str.matchAll(/"slug":"([^"]+)"[^}]*?"image(?:Url)?":"(https:\/\/content\.protriathletes\.org[^"]+)"/g)
    for (const m of allAthletes) {
      const slug = m[1]
      const imgUrl = m[2]
      map[slug] = imgUrl
    }
    return map
  }

  for (const a of athletes) {
    const name = a.fullName ?? a.name ?? a.athleteName ?? ''
    const img = a.imageUrl ?? a.image ?? a.photo ?? a.profilePhoto ?? ''
    if (name && img) map[name] = img
  }
  return map
}

// Placeholder UUIDs used by PTO when athlete has no photo — skip these
const PTO_PLACEHOLDERS = new Set([
  '1450267a-3a96-42c0-8e44-6f41aabc65ce', // generic silhouette
  '8e5f3d2a-1234-5678-abcd-placeholder000', // add more if found
])

function isPlaceholder(uuid) {
  for (const p of PTO_PLACEHOLDERS) if (uuid.includes(p)) return true
  return false
}

// ─── Also scrape individual athlete pages for missing ones ────────────────────

async function scrapePtoAthlete(slug) {
  const url = `https://stats.protriathletes.org/athlete/${slug}`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Trixer/1.0)' }
  })
  if (!res.ok) return null
  const html = await res.text()
  // Find all UUIDs on the page — take the one most likely to be a profile photo
  // Profile photos tend to appear first and have the athlete's own UUID
  const matches = [...html.matchAll(/content\.protriathletes\.org\/content\/images\/(\d{4}\/\d{2}\/([a-f0-9-]{36}))/g)]
  for (const m of matches) {
    if (!isPlaceholder(m[2])) return m[1]
  }
  return null
}

function nameToSlug(name) {
  return name.toLowerCase()
    .replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/å/g, 'a')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ä/g, 'a')
    .replace(/é/g, 'e').replace(/è/g, 'e').replace(/ê/g, 'e')
    .replace(/ã/g, 'a').replace(/â/g, 'a').replace(/á/g, 'a').replace(/à/g, 'a')
    .replace(/ô/g, 'o').replace(/õ/g, 'o').replace(/ó/g, 'o')
    .replace(/ú/g, 'u').replace(/ç/g, 'c').replace(/ñ/g, 'n')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('→ Scraping PTO rankings...')
const [menMap, womenMap] = await Promise.all([
  scrapePtoRankings('M'),
  scrapePtoRankings('F'),
])
const rankingsMap = { ...menMap, ...womenMap }
console.log(`  Found ${Object.keys(rankingsMap).length} athletes in rankings`)

// Merge rankings data into PTO_PHOTOS
for (const [name, uuid] of Object.entries(PTO_PHOTOS)) {
  if (uuid) continue // already known
  // Try by name in rankings map
  if (rankingsMap[name]) {
    PTO_PHOTOS[name] = rankingsMap[name]
    continue
  }
  // Try by slug on individual athlete page
  const slug = nameToSlug(name)
  console.log(`  Fetching individual page for ${name} (${slug})...`)
  const found = await scrapePtoAthlete(slug)
  if (found) {
    PTO_PHOTOS[name] = found
    console.log(`    ✓ ${name}: ${found}`)
  }
  // Rate limit
  await new Promise(r => setTimeout(r, 300))
}

// ─── Update athletes in DB ────────────────────────────────────────────────────

const { data: athletes } = await sb.from('athletes').select('id, name, gender, photo_url')
if (!athletes?.length) { console.error('No athletes found'); process.exit(1) }

let updated = 0, skipped = 0, notFound = 0

for (const athlete of athletes) {
  const rawUuid = PTO_PHOTOS[athlete.name]
  if (!rawUuid) { notFound++; continue }

  // Could be full URL (from rankings scrape) or just UUID path
  const url = rawUuid.startsWith('http') ? rawUuid : photoUrl(rawUuid)

  if (athlete.photo_url === url) { skipped++; continue }

  const { error } = await sb.from('athletes').update({ photo_url: url }).eq('id', athlete.id)
  if (!error) { updated++; console.log(`  ✓ ${athlete.name}`) }
  else console.warn(`  ✗ ${athlete.name}: ${error.message}`)
}

console.log(`\n📸 Fotos atualizadas: ${updated}`)
console.log(`   Sem foto no mapa:  ${notFound}`)
console.log(`   Já atualizadas:    ${skipped}`)

// Show which athletes still need photos
const missing = athletes.filter(a => !PTO_PHOTOS[a.name] && !a.photo_url)
if (missing.length > 0) {
  console.log(`\n⚠ Sem foto (${missing.length} atletas):`)
  missing.slice(0, 20).forEach(a => console.log(`  - ${a.name} (${a.gender})`))
}

console.log('\n✅ Concluído!')
