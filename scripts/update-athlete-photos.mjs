/**
 * update-athlete-photos.mjs
 *
 * Atualiza fotos dos atletas em duas fases:
 *   Phase 1 – Harvest em bulk das páginas de ranking:
 *     • PTO (stats.protriathletes.org/rankings)
 *     • World Triathlon WTCS (triathlon.org/world-rankings)
 *     • ProTriNews (protrinews.com/rankings)
 *
 *   Phase 2 – Fallback por atleta:
 *     • Página individual PTO (stats.protriathletes.org/athlete/{slug})
 *     • Busca na API do World Triathlon (triathlon.org/api/v1/athletes)
 *
 * Flags:
 *   --gender=M|F|all   (padrão: all)
 *   --type=pro|age_grouper|all  (padrão: pro)
 *   --force            Refaz mesmo quem já tem foto
 *   --dry-run          Mostra o que faria, sem salvar
 *   --limit=N          Limita a N atletas (útil para testar)
 *
 * Uso:
 *   node scripts/update-athlete-photos.mjs
 *   node scripts/update-athlete-photos.mjs --gender=M --type=pro
 *   node scripts/update-athlete-photos.mjs --force --dry-run
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── Config ──────────────────────────────────────────────────────────────────

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const opt  = (name, def) => args.find(a => a.startsWith(`--${name}=`))?.split('=')[1] ?? def

const GENDER   = opt('gender', 'all')   // M | F | all
const TYPE     = opt('type',   'pro')   // pro | age_grouper | all
const FORCE    = flag('force')
const DRY_RUN  = flag('dry-run')
const LIMIT    = parseInt(opt('limit', '9999'), 10)
const DELAY_MS = 350  // delay entre requests externos

// Known placeholder UUIDs to skip (site-wide CDN banners/defaults on PTO pages).
// At startup, detectPlaceholderUuids() adds any new ones found on a known-invalid slug.
const SKIP_UUIDS = new Set([
  // PTO site-wide placeholders (detected by fetching a non-existent athlete slug)
  '027aaf17-2108-4a10-b182-06a7e5b91745',
  '769ab444-6988-4ffe-ac18-b22246706278',
  '88be2f0a-2dbe-4139-8d3f-3640e7348529',
  '267e201f-fc85-410f-82ff-eb755c4cabd9',
  '26221c53-4107-4fe0-aa68-88332af6b168',
  'b7e5317c-b1f8-4502-9e63-de49b0196dbf',
])

/**
 * Fetches a known-invalid PTO athlete slug and adds every CDN UUID found there
 * to SKIP_UUIDS — so future new placeholders are auto-detected at runtime.
 */
async function detectPlaceholderUuids() {
  const res = await safeFetch(
    'https://stats.protriathletes.org/athlete/definitely-not-an-athlete-xyz99999',
  )
  if (!res) return
  const html = await res.text()
  const uuids = [...html.matchAll(/[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}/gi)]
  let added = 0
  for (const [uuid] of uuids) {
    if (!SKIP_UUIDS.has(uuid.toLowerCase())) {
      SKIP_UUIDS.add(uuid.toLowerCase())
      added++
    }
  }
  if (added > 0) console.log(`  [placeholder] +${added} novos UUIDs detectados automaticamente`)
}

// ── Utilities ────────────────────────────────────────────────────────────────

function nameToSlug(name) {
  return name.toLowerCase()
    .replace(/ø/g, 'o').replace(/æ/g, 'ae').replace(/å/g, 'a')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ä/g, 'a')
    .replace(/é/g, 'e').replace(/è/g, 'e').replace(/ê/g, 'e').replace(/ë/g, 'e')
    .replace(/ã/g, 'a').replace(/â/g, 'a').replace(/á/g, 'a').replace(/à/g, 'a')
    .replace(/ô/g, 'o').replace(/õ/g, 'o').replace(/ó/g, 'o')
    .replace(/í/g, 'i').replace(/î/g, 'i').replace(/ì/g, 'i')
    .replace(/ú/g, 'u').replace(/û/g, 'u').replace(/ù/g, 'u')
    .replace(/ç/g, 'c').replace(/ñ/g, 'n')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function normalizeName(name) {
  return name.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isPlaceholder(url) {
  for (const uuid of SKIP_UUIDS) if (url.includes(uuid)) return true
  return false
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function safeFetch(url, opts = {}) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Trixer/1.0; +https://trixer.app)',
        'Accept': 'text/html,application/json,*/*',
        ...opts.headers,
      },
      signal: AbortSignal.timeout(10000),
      ...opts,
    })
    return res.ok ? res : null
  } catch {
    return null
  }
}

// ── Phase 1 Sources ──────────────────────────────────────────────────────────

/**
 * PTO Rankings harvest.
 * Tenta a API JSON do PTO e, como fallback, faz scraping da página HTML de ranking.
 * Retorna: Map<normalizedName, photoUrl>
 */
async function harvestPtoRankings() {
  const map = new Map()
  const CDN = 'https://content.protriathletes.org/content/images'

  for (const gender of ['men', 'women']) {
    console.log(`  [PTO] Buscando ranking ${gender}…`)

    // Tentativa 1: API interna (Next.js data endpoint pattern)
    const apiUrls = [
      `https://stats.protriathletes.org/api/rankings?gender=${gender}&limit=300`,
      `https://stats.protriathletes.org/api/athletes/rankings?gender=${gender}`,
    ]
    let harvested = 0

    for (const apiUrl of apiUrls) {
      const res = await safeFetch(apiUrl, { headers: { Accept: 'application/json' } })
      if (!res) continue
      try {
        const data = await res.json()
        const list = data?.data ?? data?.athletes ?? data?.rankings ?? (Array.isArray(data) ? data : [])
        for (const a of list) {
          const name = a.athlete_name ?? a.name ?? a.full_name ?? ''
          const photo = a.profile_image ?? a.photo ?? a.image ?? a.profileImage ?? ''
          if (name && photo && photo.startsWith('http') && !isPlaceholder(photo)) {
            map.set(normalizeName(name), photo)
            harvested++
          }
        }
        if (harvested > 0) break
      } catch { /* not JSON */ }
    }

    // Tentativa 2: HTML scraping da página de ranking
    if (harvested === 0) {
      const res = await safeFetch(`https://stats.protriathletes.org/rankings/${gender}`)
      if (res) {
        const html = await res.text()
        // Extract all PTO CDN images and nearby names from the ranking page
        const imgMatches = [...html.matchAll(/content\.protriathletes\.org\/content\/images\/([\d]{4}\/[\d]{2}\/([a-f0-9-]{36}))/g)]
        for (const m of imgMatches) {
          const photoUrl = `${CDN}/${m[1]}-w300.webp`
          if (!isPlaceholder(photoUrl)) {
            // Try to extract nearby athlete name (before/after the image URL in the HTML)
            const idx = html.indexOf(m[0])
            const context = html.slice(Math.max(0, idx - 300), idx + 100)
            // Look for name patterns in nearby JSON data
            const nameMatch = context.match(/"(?:athlete_name|name|full_name)"\s*:\s*"([^"]+)"/)
            if (nameMatch) {
              map.set(normalizeName(nameMatch[1]), photoUrl)
              harvested++
            }
          }
        }
        // Also try JSON blocks embedded in Next.js page data
        const jsonBlocks = [...html.matchAll(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/g)]
        for (const block of jsonBlocks) {
          try {
            const pageData = JSON.parse(block[1])
            const pageProps = pageData?.props?.pageProps ?? {}
            const list = pageProps?.rankings ?? pageProps?.athletes ?? pageProps?.data ?? []
            for (const a of (Array.isArray(list) ? list : [])) {
              const name = a.athlete_name ?? a.name ?? a.full_name ?? ''
              const photo = a.profile_image ?? a.photo ?? a.image ?? ''
              if (name && photo && photo.startsWith('http') && !isPlaceholder(photo)) {
                map.set(normalizeName(name), photo)
                harvested++
              }
            }
          } catch { /* ignore */ }
        }
      }
    }

    console.log(`  [PTO] ${gender}: ${harvested} fotos encontradas`)
    await sleep(DELAY_MS)
  }

  return map
}

/**
 * World Triathlon Rankings harvest.
 * Usa a API pública do triathlon.org.
 * Retorna: Map<normalizedName, photoUrl>
 */
async function harvestWtRankings() {
  const map = new Map()

  for (const gender of ['men', 'women']) {
    let harvested = 0
    console.log(`  [WT]  Buscando ranking WTCS ${gender}…`)

    // Tentativa 1: WT Rankings API
    const rankingUrls = [
      `https://www.triathlon.org/api/v1/rankings?gender=${gender}&category=elite&limit=200`,
      `https://api.triathlon.org/v1/rankings?gender=${gender}&category_id=351&limit=200`, // WTCS
    ]
    for (const url of rankingUrls) {
      const res = await safeFetch(url, { headers: { Accept: 'application/json' } })
      if (!res) continue
      try {
        const data = await res.json()
        const list = data?.data ?? data?.rankings ?? data?.athletes ?? (Array.isArray(data) ? data : [])
        for (const a of list) {
          const name = a.athlete_full_name ?? a.athlete_name ?? a.name ?? ''
          const photo = a.athlete_profile_image ?? a.profile_image ?? a.image ?? a.photo ?? ''
          if (name && photo && photo.startsWith('http')) {
            map.set(normalizeName(name), photo)
            harvested++
          }
        }
        if (harvested > 0) break
      } catch { /* not JSON */ }
      await sleep(DELAY_MS)
    }

    // Tentativa 2: Scraping da página de ranking WT com paginação
    if (harvested === 0) {
      for (let page = 1; page <= 5; page++) {
        const startIndex = (page - 1) * 30
        const url = `https://triathlon.org/world-rankings/world-triathlon-championship-series/${gender}?page=${page}&startIndex=${startIndex}&endIndex=${startIndex + 30}&rowsPerPage=30`
        const res = await safeFetch(url)
        if (!res) break
        const html = await res.text()
        // Parse NEXT_DATA
        const nextData = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
        if (nextData) {
          try {
            const parsed = JSON.parse(nextData[1])
            const athletes = findAllAthletes(parsed)
            for (const a of athletes) {
              const name = a.athlete_full_name ?? a.name ?? a.full_name ?? ''
              const photo = a.athlete_profile_image ?? a.profile_image ?? a.photo ?? a.image ?? ''
              if (name && photo && photo.startsWith('http')) {
                map.set(normalizeName(name), photo)
                harvested++
              }
            }
          } catch { /* ignore */ }
        }
        if (html.includes('No results') || html.includes('noResults')) break
        await sleep(DELAY_MS)
      }
    }

    console.log(`  [WT]  ${gender}: ${harvested} fotos encontradas`)
  }

  return map
}

/**
 * ProTriNews Rankings harvest.
 * Retorna: Map<normalizedName, photoUrl>
 */
async function harvestProTriNewsRankings() {
  const map = new Map()
  let harvested = 0
  console.log(`  [PTN] Buscando ProTriNews rankings…`)

  for (const gender of ['male', 'female']) {
    const url = `https://protrinews.com/rankings?source=openrank&gender=${gender}`
    const res = await safeFetch(url)
    if (!res) continue
    const html = await res.text()

    // Try NEXT_DATA embedded JSON
    const nextData = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (nextData) {
      try {
        const parsed = JSON.parse(nextData[1])
        const athletes = findAllAthletes(parsed)
        for (const a of athletes) {
          const name = a.name ?? a.full_name ?? a.athlete_name ?? ''
          const photo = a.photo ?? a.image ?? a.profile_image ?? a.avatar ?? ''
          if (name && photo && photo.startsWith('http')) {
            map.set(normalizeName(name), photo)
            harvested++
          }
        }
      } catch { /* ignore */ }
    }

    // Try JSON-LD or structured data
    const jsonLdBlocks = [...html.matchAll(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g)]
    for (const block of jsonLdBlocks) {
      try {
        const data = JSON.parse(block[1])
        const athletes = findAllAthletes(data)
        for (const a of athletes) {
          const name = a.name ?? a.full_name ?? ''
          const photo = a.photo ?? a.image ?? a.profile_image ?? ''
          if (name && photo && photo.startsWith('http')) {
            map.set(normalizeName(name), photo)
            harvested++
          }
        }
      } catch { /* ignore */ }
    }

    await sleep(DELAY_MS)
  }

  console.log(`  [PTN] ${harvested} fotos encontradas`)
  return map
}

/** Recursively find arrays that look like athlete lists in any nested JSON */
function findAllAthletes(obj, depth = 0) {
  if (depth > 8 || !obj || typeof obj !== 'object') return []
  if (Array.isArray(obj)) {
    if (obj.length > 0 && (obj[0]?.name || obj[0]?.athlete_name || obj[0]?.full_name)) return obj
    return obj.flatMap(item => findAllAthletes(item, depth + 1))
  }
  return Object.values(obj).flatMap(v => findAllAthletes(v, depth + 1))
}

// ── Phase 2 Fallbacks ────────────────────────────────────────────────────────

async function fetchPtoPhotoByName(name) {
  const slug = nameToSlug(name)
  const res = await safeFetch(`https://stats.protriathletes.org/athlete/${slug}`)
  if (!res) return null
  const html = await res.text()

  // Require that the page title contains BOTH first and last name — generic/redirect pages
  // use a site-wide title like "PTO Statistics, Results and Rankings" that won't match.
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const pageTitle = (titleMatch?.[1] ?? '').toLowerCase()
  const nameParts = name.toLowerCase().split(' ').filter(p => p.length > 1)
  const firstPart = nameParts[0] ?? ''
  const lastPart  = nameParts[nameParts.length - 1] ?? ''
  if (!firstPart || !lastPart || !pageTitle.includes(firstPart) || !pageTitle.includes(lastPart)) return null

  // Use og:image exclusively — it's always the athlete's specific profile photo on PTO pages.
  // Scanning all CDN img tags picks up site-wide banners, sponsor logos and other athletes' photos.
  const ogMatch = html.match(/property="og:image"\s+content="(https:\/\/content\.protriathletes\.org\/[^"]+)"/)
              ?? html.match(/content="(https:\/\/content\.protriathletes\.org\/[^"]+)"\s+property="og:image"/)
  if (!ogMatch) return null
  const photoUrl = ogMatch[1].replace(/\.png$/, '-w300.webp').replace(/-w\d+\.webp$/, '-w300.webp')
  return isPlaceholder(photoUrl) ? null : photoUrl
}

async function fetchPtnPhotoByName(name) {
  const slug = nameToSlug(name)
  const res = await safeFetch(`https://protrinews.com/athletes/${slug}`)
  if (!res) return null
  const html = await res.text()
  // Require page title to contain both first and last name
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const pageTitle = (titleMatch?.[1] ?? '').toLowerCase()
  const nameParts = name.toLowerCase().split(' ').filter(p => p.length > 1)
  const firstPart = nameParts[0] ?? ''
  const lastPart  = nameParts[nameParts.length - 1] ?? ''
  if (!firstPart || !lastPart || !pageTitle.includes(firstPart) || !pageTitle.includes(lastPart)) return null
  // Extract the trinews storage URL — each athlete has a unique UUID-based photo
  const m = html.match(/https:\/\/api\.trinews\.app\/storage\/v1\/object\/public\/athlete-photos\/[a-f0-9-]{36}\/photo\.webp[^"'\s\\]*/i)
  return m ? m[0] : null
}

async function fetchWtPhotoByName(name) {
  const q = encodeURIComponent(name)
  const res = await safeFetch(
    `https://www.triathlon.org/api/v1/athletes?q=${q}&limit=5`,
    { headers: { Accept: 'application/json' } }
  )
  if (!res) return null
  try {
    const data = await res.json()
    const athletes = data?.data ?? data?.athletes ?? data ?? []
    if (!Array.isArray(athletes)) return null
    const nameLower = normalizeName(name)
    const parts = nameLower.split(' ')
    for (const a of athletes) {
      const aName = normalizeName(a.athlete_full_name ?? a.name ?? '')
      if (parts.every(p => aName.includes(p))) {
        const photo = a.athlete_profile_image ?? a.image ?? a.photo ?? null
        if (photo && photo.startsWith('http')) return photo
      }
    }
  } catch { /* ignore */ }
  return null
}

// ── Main ─────────────────────────────────────────────────────────────────────

console.log('📸 Trixer — Atualização de Fotos de Atletas')
console.log(`   Gênero: ${GENDER} | Tipo: ${TYPE} | Force: ${FORCE} | Dry-run: ${DRY_RUN}\n`)

// 1. Fetch athletes from DB
let query = sb.from('athletes').select('id, name, gender, type, photo_url')
if (GENDER !== 'all') query = query.eq('gender', GENDER)
if (TYPE   !== 'all') query = query.eq('type',   TYPE)
if (!FORCE) query = query.is('photo_url', null)
query = query.order('type').order('name').limit(LIMIT)

const { data: athletes, error } = await query
if (error) { console.error('Erro ao buscar atletas:', error.message); process.exit(1) }
if (!athletes?.length) { console.log('Nenhum atleta encontrado com os filtros informados.'); process.exit(0) }

console.log(`Atletas a processar: ${athletes.length}\n`)

// 1b. Auto-detect any new PTO placeholder UUIDs before fetching anything
console.log('── Detectando placeholders da PTO ──────────────────────────────────')
await detectPlaceholderUuids()

// 2. Phase 1 — Bulk harvest from ranking pages
console.log('── Phase 1: Harvest em bulk das páginas de ranking ─────────────────')
const [ptoMap, wtMap, ptnMap] = await Promise.all([
  harvestPtoRankings(),
  harvestWtRankings(),
  harvestProTriNewsRankings(),
])

// Merge all sources (PTO takes precedence, then WT, then PTN)
const bulkMap = new Map([...ptnMap, ...wtMap, ...ptoMap])
console.log(`\n   Total harvest: ${bulkMap.size} atletas com foto\n`)

// 3. Phase 2 — Match DB athletes to bulk map, then fallback per-athlete
console.log('── Phase 2: Match + fallback por atleta ────────────────────────────')
let updated = 0, notFound = 0, skipped = 0, errors = 0

for (const athlete of athletes) {
  const key = normalizeName(athlete.name)

  // Try bulk map first
  let photoUrl = bulkMap.get(key) ?? null

  // Fuzzy match: try first+last name in case of middle name differences
  if (!photoUrl) {
    const parts = key.split(' ')
    if (parts.length >= 2) {
      const firstLast = `${parts[0]} ${parts[parts.length - 1]}`
      photoUrl = bulkMap.get(firstLast) ?? null
      if (!photoUrl) {
        for (const [mapKey, mapPhoto] of bulkMap) {
          if (mapKey.includes(parts[0]) && mapKey.includes(parts[parts.length - 1])) {
            photoUrl = mapPhoto
            break
          }
        }
      }
    }
  }

  const source = photoUrl ? 'bulk' : null

  // Fallback: PTO individual page (og:image only)
  if (!photoUrl && athlete.type === 'pro') {
    photoUrl = await fetchPtoPhotoByName(athlete.name)
    await sleep(DELAY_MS)
  }

  // Fallback: ProTriNews individual page (trinews CDN)
  if (!photoUrl) {
    photoUrl = await fetchPtnPhotoByName(athlete.name)
    await sleep(DELAY_MS)
  }

  // Fallback: WT search
  if (!photoUrl) {
    photoUrl = await fetchWtPhotoByName(athlete.name)
    await sleep(DELAY_MS)
  }

  if (photoUrl && isPlaceholder(photoUrl)) photoUrl = null

  if (photoUrl) {
    const tag = source === 'bulk' ? '★' : '↳'
    console.log(`  ${tag} ✓ ${athlete.name}`)
    if (!DRY_RUN) {
      const { error: upErr } = await sb.from('athletes').update({ photo_url: photoUrl }).eq('id', athlete.id)
      if (upErr) {
        console.warn(`    ✗ DB error: ${upErr.message}`)
        errors++
      } else {
        updated++
      }
    } else {
      updated++
    }
  } else {
    notFound++
    if (athlete.type === 'pro') console.log(`  ✗ sem foto: ${athlete.name}`)
  }
}

// 4. Summary
console.log('\n' + '─'.repeat(60))
console.log(`📸 Fotos ${DRY_RUN ? '(dry-run) ' : ''}atualizadas: ${updated}`)
console.log(`   Sem foto encontrada:     ${notFound}`)
if (errors) console.log(`   Erros de banco:          ${errors}`)
console.log('\n✅ Concluído!')
