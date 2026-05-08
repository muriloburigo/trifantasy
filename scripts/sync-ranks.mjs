#!/usr/bin/env node
/**
 * Sync PTO and WTCS rankings for all athletes in the database.
 *
 * Updates ONLY: pto_rank, wtcs_rank
 * Does NOT change: current_price, price_change, race_athletes.price, or any T$ value.
 *
 * Informational output shows what T$ would be suggested based on the pricing table,
 * without applying any change.
 *
 * Usage: node scripts/sync-ranks.mjs
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 *
 * Ranking sources:
 *   PTO men:    https://stats.protriathletes.org/api/rankings/men?limit=500
 *   PTO women:  https://stats.protriathletes.org/api/rankings/women?limit=500
 *               (fallback: HTML scrape of /rankings/women if API returns male data)
 *   WTCS men:   https://triathlon.org/tri-api/v1/rankings/15  (position = array index)
 *   WTCS women: https://triathlon.org/tri-api/v1/rankings/16  (position = array index)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

function getEnv(k) {
  if (process.env[k]) return process.env[k]
  const envFile = resolve(process.cwd(), '.env.local')
  if (existsSync(envFile)) {
    const raw = readFileSync(envFile, 'utf8')
    const m = raw.match(new RegExp(`^${k}=["']?(.+?)["']?$`, 'm'))
    if (m) return m[1].trim()
  }
  return null
}

const SUPABASE_URL = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const SERVICE_KEY  = getEnv('SUPABASE_SERVICE_ROLE_KEY')
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const DRY_RUN = process.argv.includes('--dry-run')
if (DRY_RUN) console.log('🔍  DRY-RUN — nenhuma alteração será feita no banco\n')

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(name) {
  return (name ?? '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Same pricing table used for initial athlete registration (informational only here).
function suggestedPrice(rank) {
  if (!rank) return null
  if (rank <= 7)   return 35
  if (rank <= 15)  return 28
  if (rank <= 25)  return 22
  if (rank <= 40)  return 18
  if (rank <= 60)  return 15
  if (rank <= 80)  return 12
  if (rank <= 120) return 11
  return 10
}

async function get$(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': 'application/json', ...opts.headers },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.json()
}

async function getHtml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': 'text/html' },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.text()
}

// ── Ranking fetchers ──────────────────────────────────────────────────────────

async function fetchPtoMen() {
  const data = await get$('https://stats.protriathletes.org/api/rankings/men?limit=500')
  return (data.rankings ?? []).map(r => ({ rank: r.rank, name: normalize(r.name) })).filter(r => r.name)
}

// PTO women: the ?gender=female query-param API has a bug (returns MPRO data).
// The /rankings/women path API is used by reprice-athletes.mjs and appears to work.
// If it still returns MPRO data (detectable by large rank numbers on well-known women),
// fall back to HTML scraping of the page.
async function fetchPtoWomen() {
  try {
    const data = await get$('https://stats.protriathletes.org/api/rankings/women?limit=500')
    const list = (data.rankings ?? []).map(r => ({ rank: r.rank, name: normalize(r.name) })).filter(r => r.name)
    if (list.length > 50) return list
  } catch {}

  // Fallback: HTML scrape
  console.log('  ⚠️  PTO women API fallback → scraping HTML')
  const html = await getHtml('https://stats.protriathletes.org/rankings/women')
  const results = []

  // Each ranked athlete row has data-division="FPRO" on the trow element
  for (const m of html.matchAll(/<div[^>]+data-division="FPRO"[^>]*>([\s\S]*?)(?=<div[^>]+data-division=|<\/section|<footer|$)/g)) {
    const block = m[1]
    const rankM = block.match(/>\s*(\d+)\s*</)
    const nameM = block.match(/class="[^"]*(?:name|athlete-name)[^"]*"[^>]*>\s*([\wÀ-ž''\- ]{3,})\s*</)
    if (rankM && nameM) results.push({ rank: parseInt(rankM[1]), name: normalize(nameM[1]) })
  }

  if (results.length === 0) console.warn('  ⚠️  PTO women: 0 results from HTML scrape — check page structure')
  return results
}

// WTCS: rank field in API is unreliable/null — use 1-based array position instead.
async function fetchWtcs(rankingId) {
  const data = await get$(`https://triathlon.org/tri-api/v1/rankings/${rankingId}`)
  return (data.data?.rankings ?? [])
    .map((r, i) => ({ rank: i + 1, name: normalize(r.athlete_full_name ?? '') }))
    .filter(r => r.name.length > 2)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log('⏳  Fetching rankings...')

  const [ptoMen, ptoWomen, wtcsMen, wtcsWomen] = await Promise.all([
    fetchPtoMen(),
    fetchPtoWomen(),
    fetchWtcs(15),
    fetchWtcs(16),
  ])

  console.log(`  PTO men:    ${ptoMen.length}`)
  console.log(`  PTO women:  ${ptoWomen.length}`)
  console.log(`  WTCS men:   ${wtcsMen.length}`)
  console.log(`  WTCS women: ${wtcsWomen.length}`)

  const ptoMap = new Map()
  for (const r of ptoMen)   ptoMap.set(r.name, r.rank)
  for (const r of ptoWomen) ptoMap.set(r.name, r.rank)

  const wtcsMap = new Map()
  for (const r of wtcsMen)   wtcsMap.set(r.name, r.rank)
  for (const r of wtcsWomen) wtcsMap.set(r.name, r.rank)

  const { data: athletes, error } = await supabase
    .from('athletes')
    .select('id, name, gender, current_price, pto_rank, wtcs_rank')
    .order('name')

  if (error || !athletes?.length) { console.error('DB error:', error); process.exit(1) }

  console.log(`\n→  ${athletes.length} athletes to sync\n`)

  let updated = 0, unchanged = 0, failed = 0

  for (const a of athletes) {
    const key = normalize(a.name)
    const newPto  = ptoMap.get(key)  ?? null
    const newWtcs = wtcsMap.get(key) ?? null

    if (newPto === a.pto_rank && newWtcs === a.wtcs_rank) {
      unchanged++
      continue
    }

    if (!DRY_RUN) {
      const { error: upErr } = await supabase
        .from('athletes')
        .update({ pto_rank: newPto, wtcs_rank: newWtcs })
        .eq('id', a.id)

      if (upErr) {
        console.error(`  ✗ ${a.name}: ${upErr.message}`)
        failed++
        continue
      }
    }

    // Informational: best rank between PTO and WTCS → suggested T$ (not applied)
    const bestRank = Math.min(newPto ?? 9999, newWtcs ?? 9999)
    const suggested = bestRank < 9999 ? suggestedPrice(bestRank) : null
    const rankStr   = [newPto && `PTO#${newPto}`, newWtcs && `WTCS#${newWtcs}`].filter(Boolean).join(' / ') || 'unranked'
    const priceNote = suggested !== null && suggested !== Number(a.current_price)
      ? `  ← T$${a.current_price} atual / T$${suggested} seria sugerido`
      : ''

    console.log(`  ✓ ${a.name.padEnd(36)} ${rankStr}${priceNote}`)
    updated++
  }

  if (DRY_RUN) {
    console.log(`\n🔍  DRY-RUN: ${updated} seriam atualizados, ${unchanged} sem mudança${failed ? `, ${failed} falhariam` : ''}`)
    console.log('     Rode sem --dry-run para aplicar.')
  } else {
    console.log(`\n✅  ${updated} updated, ${unchanged} unchanged${failed ? `, ${failed} failed` : ''}`)
    console.log('ℹ️   Apenas pto_rank e wtcs_rank foram atualizados. Nenhum T$ foi alterado.')
    if (updated > 0) {
      console.log('     Para ajustar T$ de atletas novos manualmente: /admin/atletas')
    }
  }
}

run().catch(e => { console.error(e); process.exit(1) })
