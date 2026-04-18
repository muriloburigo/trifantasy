/**
 * Fetch athlete photos for ALL athletes missing photo_url.
 * Sources (in order):
 *   1. PTO individual athlete page: https://stats.protriathletes.org/athlete/{slug}
 *   2. World Triathlon athlete search (for non-PTO athletes)
 *
 * Run: node scripts/fetch-photos-v2.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

// Known placeholder UUIDs to skip
const SKIP_UUIDS = new Set([
  '1450267a-3a96-42c0-8e44-6f41aabc65ce',
  '8e5f3d2a-1234-5678-abcd-placeholder000',
])

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

function isPlaceholder(url) {
  for (const uuid of SKIP_UUIDS) if (url.includes(uuid)) return true
  return false
}

async function fetchPtoPhoto(name) {
  const slug = nameToSlug(name)
  const url = `https://stats.protriathletes.org/athlete/${slug}`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Trixer/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const html = await res.text()
    const CDN = 'https://content.protriathletes.org/content/images'
    const matches = [...html.matchAll(/content\.protriathletes\.org\/content\/images\/(\d{4}\/\d{2}\/([a-f0-9-]{36}))/g)]
    for (const m of matches) {
      const photoUrl = `${CDN}/${m[1]}-w300.webp`
      if (!isPlaceholder(photoUrl)) return photoUrl
    }
    return null
  } catch {
    return null
  }
}

async function fetchWorldTriathlonPhoto(name) {
  try {
    const q = encodeURIComponent(name)
    const res = await fetch(`https://www.triathlon.org/api/v1/athletes?q=${q}&limit=5`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Trixer/1.0)', 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const athletes = data?.data ?? data?.athletes ?? data ?? []
    if (!Array.isArray(athletes) || athletes.length === 0) return null
    // Find best match by name
    const nameLower = name.toLowerCase()
    for (const a of athletes) {
      const aName = (a.athlete_full_name ?? a.name ?? '').toLowerCase()
      if (aName.includes(nameLower.split(' ')[0]) && aName.includes(nameLower.split(' ').pop())) {
        const photo = a.athlete_profile_image ?? a.image ?? a.photo ?? null
        if (photo && photo.startsWith('http')) return photo
      }
    }
    return null
  } catch {
    return null
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

const { data: athletes, error } = await sb
  .from('athletes')
  .select('id, name, gender, type, photo_url')
  .is('photo_url', null)
  .order('type')  // pros first
  .order('name')

if (error || !athletes?.length) {
  console.error('Error fetching athletes:', error?.message ?? 'none found')
  process.exit(1)
}

console.log(`Found ${athletes.length} athletes without photos. Starting fetch...\n`)

let updated = 0, notFound = 0

for (const athlete of athletes) {
  const isPro = athlete.type === 'pro'
  let photoUrl = null

  // Source 1: PTO (best for PROs, sometimes works for AGers too)
  photoUrl = await fetchPtoPhoto(athlete.name)
  if (photoUrl) {
    console.log(`  [PTO] ✓ ${athlete.name}`)
  }

  // Source 2: World Triathlon (mainly for Olympic-distance athletes)
  if (!photoUrl) {
    photoUrl = await fetchWorldTriathlonPhoto(athlete.name)
    if (photoUrl) {
      console.log(`  [WT]  ✓ ${athlete.name}`)
    }
  }

  if (photoUrl) {
    const { error: upErr } = await sb.from('athletes').update({ photo_url: photoUrl }).eq('id', athlete.id)
    if (!upErr) updated++
    else console.warn(`  ✗ DB error for ${athlete.name}: ${upErr.message}`)
  } else {
    notFound++
    if (isPro) console.log(`  ✗ no photo: ${athlete.name}`)
  }

  // Rate limit: 400ms between requests to be polite
  await new Promise(r => setTimeout(r, 400))
}

console.log(`\n📸 Fotos atualizadas: ${updated}`)
console.log(`   Sem foto:          ${notFound}`)
console.log('\n✅ Concluído!')
