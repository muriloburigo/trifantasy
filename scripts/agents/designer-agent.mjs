#!/usr/bin/env node
/**
 * Trixer Designer Agent — Especialista em Imagens
 *
 * Decide entre dois modos para cada post:
 *
 * MODO ARTE (preferencial para posts com dados):
 *   Chama /api/card/render — gera arte Instagram 1080×1350 com identidade Trixer
 *   (navy + azul #1E90FF + roxo #7B3FE4, logo, dados reais, CTA).
 *   Usado para: race-preview, race-recap, market-update.
 *
 * MODO FOTO (para posts onde a imagem contextual importa mais):
 *   Busca Pexels API com query inteligente baseada no gênero/fase detectados.
 *   Usado para: posts sem race_id, conteúdo editorial, posts de atleta específico.
 *
 * Regra de decisão:
 *   - Tem race_id + ação de prova → arte gerada
 *   - market-update sem contexto específico → arte gerada
 *   - race-recap com resultados → arte gerada
 *   - Conteúdo editorial / atleta específico / sem dados estruturados → foto Pexels
 *
 * Parceria:
 *   marketing-agent → identifica oportunidade + race_id
 *   social-media-agent → cria legenda, chama designer com contexto
 *   designer-agent → decide modo, entrega URL pronta para o Instagram
 *
 * Usage standalone:
 *   node scripts/agents/designer-agent.mjs --action=post-upcoming-race --race-id=<uuid>
 *   node scripts/agents/designer-agent.mjs --action=post-market-update
 *   node scripts/agents/designer-agent.mjs --context="Lucy Charles women triathlon run"
 *
 * Required env vars:
 *   PEXELS_API_KEY          (foto Pexels — gratuito)
 *   NEXT_PUBLIC_SITE_URL    (para chamadas à /api/card/render)
 */

import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PEXELS_API_KEY      = process.env.PEXELS_API_KEY
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.trixer.app').replace(/\n/g, '').trim()

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\n/g, '').trim()
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/\n/g, '').trim()
const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
  : null

const STORAGE_BUCKET = 'card-art'

const args   = process.argv.slice(2)
const getArg = (name) => { const a = args.find(a => a.startsWith(`--${name}=`)); return a ? a.split('=').slice(1).join('=') : null }

const ACTION  = getArg('action')
const CONTEXT = getArg('context')   // free-text description of the post
const GENDER  = getArg('gender')    // men | women | mixed (optional override)
const PHASE   = getArg('phase')     // swim | bike | run | finish | transition (optional override)

const log = (...a) => console.log('[designer]', ...a)

// ── Fallback images (Pexels, verified triathlon content) ───────────────────────
// Used when API key is missing or search returns no results

const FALLBACKS = {
  // Women — verified female athletes in triathlon
  'women-swim':     'https://images.pexels.com/photos/19299065/pexels-photo-19299065.jpeg?auto=compress&cs=tinysrgb&w=1080',  // woman exiting water in wetsuit
  'women-bike':     'https://images.pexels.com/photos/15076376/pexels-photo-15076376.jpeg?auto=compress&cs=tinysrgb&w=1080',  // woman cycling in triathlon race
  'women-run':      'https://images.pexels.com/photos/29723753/pexels-photo-29723753.jpeg?auto=compress&cs=tinysrgb&w=1080',  // woman running in triathlon race bib
  'women-finish':   'https://images.pexels.com/photos/21317464/pexels-photo-21317464.jpeg?auto=compress&cs=tinysrgb&w=1080',  // woman running triathlon Florianópolis

  // Men — verified male athletes in triathlon
  'men-swim':       'https://images.pexels.com/photos/5687547/pexels-photo-5687547.jpeg?auto=compress&cs=tinysrgb&w=1080',   // men entering ocean (swim start)
  'men-bike':       'https://images.pexels.com/photos/5687398/pexels-photo-5687398.jpeg?auto=compress&cs=tinysrgb&w=1080',   // men cyclists on closed course
  'men-run':        'https://images.pexels.com/photos/5687491/pexels-photo-5687491.jpeg?auto=compress&cs=tinysrgb&w=1080',   // men sprinting in triathlon
  'men-finish':     'https://images.pexels.com/photos/35245649/pexels-photo-35245649.jpeg?auto=compress&cs=tinysrgb&w=1080', // man crossing finish line (Triatlo de Oeiras)

  // Mixed / default
  'mixed-swim':     'https://images.pexels.com/photos/5687547/pexels-photo-5687547.jpeg?auto=compress&cs=tinysrgb&w=1080',  // athletes entering ocean
  'mixed-bike':     'https://images.pexels.com/photos/5687398/pexels-photo-5687398.jpeg?auto=compress&cs=tinysrgb&w=1080',  // cyclists in race
  'mixed-run':      'https://images.pexels.com/photos/5687491/pexels-photo-5687491.jpeg?auto=compress&cs=tinysrgb&w=1080',  // athletes sprinting
  'mixed-finish':   'https://images.pexels.com/photos/35245649/pexels-photo-35245649.jpeg?auto=compress&cs=tinysrgb&w=1080', // finish line
  'default':        'https://images.pexels.com/photos/33912009/pexels-photo-33912009.jpeg?auto=compress&cs=tinysrgb&w=1080', // triathlon swim competition
}

// ── Context analyzer ──────────────────────────────────────────────────────────
// Detects gender and race phase from post content

function analyzeContext(text = '', action = '') {
  const t = text.toLowerCase()

  // ── Gender detection ──────────────────────────────────────────────────────
  const femaleSignals = [
    'lucy', 'anne', 'chelsea', 'daniela', 'kat', 'solveig', 'taylor', 'julie',
    'georgia', 'laura', 'ashleigh', 'jessica', 'djenyfer', 'lea', 'maryannie',
    'women', 'woman', 'female', 'her ', 'she ', "she's", 'her trixer', 'her value',
  ]
  const maleSignals = [
    'patrick', 'sam', 'kristian', 'blu', 'gustav', 'leon', 'magnus', 'cameron',
    'hayden', 'alex yee', 'casper', 'morgan', 'vasco', 'miguel', 'jan',
    'men', 'man', 'male', 'his ', 'he ', "he's", 'his trixer',
  ]

  const femaleCount = femaleSignals.filter(s => t.includes(s)).length
  const maleCount   = maleSignals.filter(s => t.includes(s)).length

  let gender = 'mixed'
  if (femaleCount > maleCount) gender = 'women'
  else if (maleCount > femaleCount) gender = 'men'

  // ── Race phase detection ──────────────────────────────────────────────────
  let phase = 'run' // default — most iconic tri image

  if (t.includes('swim') || t.includes('ocean') || t.includes('wetsuit') || t.includes('t1'))
    phase = 'swim'
  else if (t.includes('bike') || t.includes('cycling') || t.includes('watts') || t.includes('t2') || t.includes('cycle'))
    phase = 'bike'
  else if (t.includes('finish') || t.includes('podium') || t.includes('won') || t.includes('winner') || t.includes('champion') || t.includes('result'))
    phase = 'finish'
  else if (t.includes('run') || t.includes('marathon') || t.includes('splits') || t.includes('pace'))
    phase = 'run'

  // Action-based overrides
  if (action === 'post-race-recap')     phase = 'finish'
  if (action === 'post-upcoming-race')  phase = 'run'    // run = speed/competition, avoid swim monotony
  if (action === 'post-market-update')  phase = 'bike'   // bike = power/momentum
  if (action === 'post-league-standings') phase = 'run'  // run = competition

  return { gender, phase }
}

// ── Normalised photo object ────────────────────────────────────────────────────
// Both APIs return different shapes — normalise to { id, alt, url, src, width, height, source }

function normalisePexels(photo) {
  return {
    id:     String(photo.id),
    alt:    photo.alt ?? '',
    url:    photo.url ?? '',
    src:    photo.src?.large2x ?? photo.src?.large ?? photo.src?.original ?? '',
    width:  photo.width,
    height: photo.height,
    source: 'pexels',
  }
}

function normaliseUnsplash(photo) {
  // Force JPEG — Instagram rejects WebP (error 9004).
  // Unsplash serves WebP when the fetcher sends Accept: image/webp (which Instagram's crawler does).
  const rawSrc = photo.urls?.regular ?? photo.urls?.full ?? ''
  const src = rawSrc
    ? rawSrc.replace(/[?&]fm=[^&]*/g, '') + (rawSrc.includes('?') ? '&' : '?') + 'fm=jpg&cs=tinysrgb'
    : ''
  return {
    id:     photo.id,
    alt:    photo.alt_description ?? photo.description ?? '',
    url:    photo.links?.html ?? '',
    src,
    width:  photo.width,
    height: photo.height,
    source: 'unsplash',
  }
}

// ── Pexels search ─────────────────────────────────────────────────────────────

async function searchPexels(query) {
  if (!PEXELS_API_KEY) return []

  const url = new URL('https://api.pexels.com/v1/search')
  url.searchParams.set('query', query)
  url.searchParams.set('per_page', '8')
  url.searchParams.set('orientation', 'landscape')

  const res = await fetch(url.toString(), { headers: { Authorization: PEXELS_API_KEY } })
  if (!res.ok) { log(`Pexels error: ${res.status}`); return [] }

  const data = await res.json()
  return (data.photos ?? []).map(normalisePexels)
}

// ── Unsplash search ────────────────────────────────────────────────────────────

async function searchUnsplash(query) {
  if (!UNSPLASH_ACCESS_KEY) return []

  const url = new URL('https://api.unsplash.com/search/photos')
  url.searchParams.set('query', query)
  url.searchParams.set('per_page', '8')
  url.searchParams.set('orientation', 'landscape')
  url.searchParams.set('content_filter', 'high')

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
  })
  if (!res.ok) { log(`Unsplash error: ${res.status}`); return [] }

  const data = await res.json()
  return (data.results ?? []).map(normaliseUnsplash)
}

// ── Search both sources in parallel ───────────────────────────────────────────

async function searchAll(query) {
  const [pexels, unsplash] = await Promise.all([
    searchPexels(query),
    searchUnsplash(query),
  ])
  return [...pexels, ...unsplash]
}

// ── Score photos for triathlon relevance ──────────────────────────────────────
// Pexels returns mixed results — score each by title/description keywords

function scorePhoto(photo, gender, phase) {
  const text = [
    photo.alt?.toLowerCase() ?? '',
    photo.url?.toLowerCase() ?? '',
    photo.source ?? '',
  ].join(' ')

  let score = 0

  // Core triathlon signals
  const triSignals = ['triathlon', 'triathlete', 'ironman', 't100', 'swim-bike-run']
  triSignals.forEach(s => { if (text.includes(s)) score += 3 })

  // Professional / elite signals — bonus
  const proSignals = ['professional', 'pro triath', 'elite', 'championship', 'world championship', 'circuit', 'race number', 'race bib', 'kona', 'collins cup', 'pto', 'wtcs', 'race kit', 'aero helmet']
  proSignals.forEach(s => { if (text.includes(s)) score += 4 })

  // Amateur signals — penalize
  const amateurSignals = ['amateur', 'beginner', 'first triathlon', 'sprint triathlon hobby', 'local race', 'community race', 'charity run', 'fun run', 'recreational']
  amateurSignals.forEach(s => { if (text.includes(s)) score -= 6 })

  // Phase match — reward exact phase hits
  const phaseSignals = {
    swim:       ['swim', 'ocean', 'water', 'wetsuit', 'dive', 'open water'],
    bike:       ['bike', 'cycling', 'bicycle', 'cycle', 'cyclist', 'cycling race'],
    run:        ['run', 'running', 'runner', 'sprint', 'marathon', 'race bib', 'finish line'],
    finish:     ['finish', 'finisher', 'medal', 'tape', 'podium', 'winner', 'champion', 'crossing'],
    transition: ['transition', 't1', 't2', 'transition zone'],
  }
  ;(phaseSignals[phase] ?? []).forEach(s => { if (text.includes(s)) score += 3 })

  // HARD PENALTY: swim signals on non-swim phases — this is the main cause of monotony
  if (phase !== 'swim') {
    const swimWords = ['wetsuit', 'ocean', 'swim', 'exiting water', 'emerging', 'wading', 'open water', 'swim cap']
    swimWords.forEach(s => { if (text.includes(s)) score -= 8 })
  }

  // Gender match bonus
  if (gender === 'women') {
    const femaleWords = ['woman', 'women', 'female', 'girl', 'her']
    femaleWords.forEach(s => { if (text.includes(s)) score += 2 })
    const maleWords = ['man ', 'men ', 'male ', 'his ']
    maleWords.forEach(s => { if (text.includes(s)) score -= 3 })
  } else if (gender === 'men') {
    const maleWords = ['man ', 'men ', 'male ']
    maleWords.forEach(s => { if (text.includes(s)) score += 2 })
  }

  // Penalize off-sport content
  const penalize = ['yoga', 'gym', 'weights', 'soccer', 'football', 'basketball', 'fitness model', 'workout', 'weightlift', 'crossfit']
  penalize.forEach(s => { if (text.includes(s)) score -= 6 })

  // Prefer landscape + HD for Instagram
  if (photo.width > photo.height) score += 1
  if (photo.width >= 1080) score += 1

  return score
}

// ── Trixer Card Art (via /api/card/render) ────────────────────────────────────

async function generateCardArt(action, raceId) {
  const typeMap = {
    'post-upcoming-race':    'race-preview',
    'post-race-recap':       'race-recap',
    'post-market-update':    'market-update',
    'post-league-standings': 'market-update',
  }
  const type = typeMap[action] ?? 'market-update'
  const params = new URLSearchParams({ type })
  if (raceId) params.set('race_id', raceId)

  const renderUrl = `${SITE_URL}/api/card/render?${params.toString()}`
  log(`Requesting card art: ${renderUrl}`)

  try {
    const res = await fetch(renderUrl)
    if (!res.ok) { log(`Card render failed: ${res.status}`); return null }

    const ct = res.headers.get('content-type') ?? ''
    if (!ct.startsWith('image/')) {
      log(`Card render returned non-image content-type: ${ct} — falling back`)
      return null
    }

    // Upload to Supabase Storage as JPEG — Instagram Graph API only accepts JPEG (not PNG)
    if (supabase) {
      const pngBuf = Buffer.from(await res.arrayBuffer())
      // Convert PNG→JPEG (quality 92) — Instagram rejects PNG with error 9004
      const jpegBuf = await sharp(pngBuf).jpeg({ quality: 92 }).toBuffer()
      const filename = `${type}-${raceId ?? 'latest'}-${Date.now()}.jpg`
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filename, jpegBuf, { contentType: 'image/jpeg', upsert: true })

      if (error) {
        log(`Storage upload failed: ${error.message} — using render URL directly`)
        return renderUrl
      }

      const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename)
      log(`✓ Card art uploaded as JPEG: ${publicUrl}`)
      return publicUrl
    }

    log(`✓ Card art ready (no storage — using render URL)`)
    return renderUrl
  } catch (e) {
    log(`Card render error: ${e.message}`)
    return null
  }
}

// ── Decision: card art vs photo ───────────────────────────────────────────────
// Card art: structured data posts (race-preview, recap, market-update)
// Pexels photo: editorial / athlete-specific / no structured data available

function shouldUseCardArt(action, raceId) {
  const cardActions = ['post-upcoming-race', 'post-race-recap', 'post-market-update']
  if (!cardActions.includes(action)) return false
  // race-preview and recap: only if we have a race_id (otherwise no data to render)
  if ((action === 'post-upcoming-race' || action === 'post-race-recap') && !raceId) return false
  return true
}

// ── Main resolution function ──────────────────────────────────────────────────
// Returns { url, description } — description helps the social agent validate coherence.

export async function resolveImage({ context = '', action = '', raceId = null, genderOverride = null, phaseOverride = null, excludeUrls = [] } = {}) {

  // ── Mode 1: Trixer Card Art ───────────────────────────────────────────────
  if (shouldUseCardArt(action, raceId)) {
    log(`Mode: CARD ART (${action}${raceId ? ` race=${raceId}` : ''})`)
    const cardUrl = await generateCardArt(action, raceId)
    if (cardUrl) return { url: cardUrl, description: 'Trixer branded card art with real athlete data' }
    log('Card art unavailable — falling back to Pexels photo')
  }

  // ── Mode 2: Pexels Photo ──────────────────────────────────────────────────
  log('Mode: PEXELS PHOTO')
  const { gender, phase } = analyzeContext(context, action)
  const finalGender = genderOverride ?? gender
  const finalPhase  = phaseOverride ?? phase

  log(`Context analysis → gender: ${finalGender}, phase: ${finalPhase}`)
  if (excludeUrls.length) log(`Excluding ${excludeUrls.length} recently used URL(s)`)

  // If the social gave a specific description, use it as primary query
  const hasDescription = context.length > 25 && !context.startsWith('Upcoming race:') && !context.startsWith('POST TYPE:')
  const g = finalGender === 'mixed' ? '' : finalGender + ' '

  // Phase-specific queries: avoid "triathlon" tag for run/bike/finish because
  // Pexels' triathlon corpus is dominated by swim-exit shots.
  // For those phases, go directly to sport-specific terms with better diversity.
  const phaseQueries = {
    swim:       [`${g}professional triathlete swim`, `${g}pro triathlon swim start`, `${g}elite triathlete open water`],
    bike:       [`${g}professional triathlete cycling`, `${g}elite triathlete bike`, `${g}pro triathlon cycling race`],
    run:        [`${g}professional triathlete running`, `${g}elite triathlete run race`, `${g}pro triathlon run`],
    finish:     [`${g}professional triathlete finish line`, `${g}elite triathlon finish`, `${g}pro triathlete crossing finish`],
    transition: [`professional triathlon transition`, `elite triathlete transition zone`, `ironman pro transition`],
  }

  const queries = hasDescription
    ? [
        context,                                        // social's creative description — always first
        ...(phaseQueries[finalPhase] ?? [`${g}triathlon ${finalPhase}`]),
      ]
    : [
        ...(phaseQueries[finalPhase] ?? [`${g}triathlon ${finalPhase}`, `${g}triathlete ${finalPhase}`]),
      ]

  // Search both Pexels + Unsplash in parallel for each query until we have enough candidates
  const allPhotos = []
  const seenIds   = new Set()

  for (const query of queries) {
    log(`Searching: "${query}"`)
    const photos = await searchAll(query)
    for (const p of photos) {
      if (!seenIds.has(p.id)) { seenIds.add(p.id); allPhotos.push(p) }
    }
    if (allPhotos.length >= 24) break
  }

  log(`Candidates: ${allPhotos.length} (Pexels + Unsplash)`)

  // Score all, filter excluded, pick best
  const scored = allPhotos
    .map(p => ({ photo: p, score: scorePhoto(p, finalGender, finalPhase) }))
    .filter(({ photo }) => !excludeUrls.some(ex => photo.src.includes(ex) || ex.includes(photo.id)))
    .sort((a, b) => b.score - a.score)

  const best = scored[0]
  if (best && best.score >= 0) {
    log(`✓ [${best.photo.source}] "${best.photo.alt}" (score: ${best.score})`)
    return { url: best.photo.src, description: best.photo.alt }
  }

  // Fall back to curated set — pick one not in excludeUrls
  const fallbackKey = `${finalGender}-${finalPhase}`
  const candidates = [
    FALLBACKS[fallbackKey],
    FALLBACKS[`mixed-${finalPhase}`],
    FALLBACKS['default'],
  ].filter(u => u && !excludeUrls.some(ex => u.includes(ex)))

  const fallback = candidates[0] ?? FALLBACKS['default']
  log(`Using fallback: ${fallbackKey} → ${fallback}`)
  return { url: fallback, description: `Curated triathlon ${finalGender} ${finalPhase} photo` }
}

// ── Standalone CLI ────────────────────────────────────────────────────────────
// Only run when invoked directly (not when imported by social-media-agent)

import { pathToFileURL } from 'url'
const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url

if (isMain && (CONTEXT || ACTION)) {
  log(`Running${!PEXELS_API_KEY ? ' (no API key — will use fallbacks)' : ''}`)

  resolveImage({
    context: CONTEXT ?? '',
    action: ACTION ?? '',
    genderOverride: GENDER,
    phaseOverride: PHASE,
  }).then(url => {
    log('\n── IMAGE URL ─────────────────────────────────────')
    console.log(url)
  }).catch(err => {
    console.error('[designer] Fatal:', err.message)
    process.exit(1)
  })
}
