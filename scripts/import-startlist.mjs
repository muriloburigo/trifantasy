#!/usr/bin/env node
/**
 * Import startlist from a URL into the Trixer database.
 *
 * Usage:
 *   node scripts/import-startlist.mjs <url> <race_id> [--all]
 *
 * Options:
 *   --all    Import all divisions (default: PRO only)
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const [,, url, raceId, ...flags] = process.argv
if (!url || !raceId) {
  console.error('Usage: node scripts/import-startlist.mjs <url> <race_id> [--all]')
  process.exit(1)
}

const onlyPro = !flags.includes('--all')
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// ── Helpers (duplicated from lib/scrapers to keep script self-contained) ──

const ISO3_TO_2 = {
  BRA:'BR',USA:'US',DEU:'DE',GER:'DE',GBR:'GB',AUS:'AU',CHE:'CH',SUI:'CH',
  NZL:'NZ',CAN:'CA',FRA:'FR',ESP:'ES',ITA:'IT',NLD:'NL',NED:'NL',NOR:'NO',
  SWE:'SE',DNK:'DK',DEN:'DK',JPN:'JP',CHN:'CN',ZAF:'ZA',RSA:'ZA',MEX:'MX',
  ARG:'AR',PRT:'PT',POR:'PT',BEL:'BE',AUT:'AT',POL:'PL',LUX:'LU',
  SVN:'SI',SLO:'SI',CZE:'CZ',SVK:'SK',HUN:'HU',ROU:'RO',BGR:'BG',
  HRV:'HR',CRO:'HR',GRC:'GR',GRE:'GR',TUR:'TR',UKR:'UA',COL:'CO',CHL:'CL',
}

function normalizeCountryCode(code) {
  if (!code) return null
  const u = code.trim().toUpperCase()
  if (u.length === 2) return u
  if (u.length === 3) return ISO3_TO_2[u] ?? null
  return null
}

function normalizeGender(val) {
  const s = String(val ?? '').toUpperCase().trim()
  if (['M','MALE','MEN','MPRO','MASCULINO'].some(v => s === v || s.startsWith(v + '_'))) return 'M'
  if (['F','FEMALE','FPRO','WOMEN','W','FEMININO'].some(v => s === v || s.startsWith(v + '_'))) return 'F'
  return null
}

function normalizeName(raw) {
  return raw.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ')
}

function extractName(obj) {
  for (const key of ['fullName','full_name','name','athleteName','athlete_name']) {
    if (typeof obj?.[key] === 'string' && obj[key].trim().length > 1) return obj[key].trim()
  }
  const first = obj?.firstName ?? obj?.first_name ?? obj?.givenName ?? ''
  const last  = obj?.lastName  ?? obj?.last_name  ?? obj?.familyName ?? obj?.surname ?? ''
  if (first || last) return `${first} ${last}`.trim()
  if (obj?.athlete) return extractName(obj.athlete)
  return ''
}

function isAthleteObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false
  return extractName(obj).length > 2
}

function collectArrays(obj, seen = new Set(), depth = 0) {
  if (depth > 9 || !obj || typeof obj !== 'object') return []
  if (seen.has(obj)) return []
  seen.add(obj)
  if (Array.isArray(obj)) {
    const nested = [obj]
    for (const item of obj.slice(0, 3)) nested.push(...collectArrays(item, seen, depth + 1))
    return nested
  }
  const results = []
  for (const val of Object.values(obj)) results.push(...collectArrays(val, seen, depth + 1))
  return results
}

function parseHtmlTables(html) {
  const rows = []
  for (const tableMatch of html.matchAll(/<table[\s\S]*?<\/table>/gi)) {
    const table = tableMatch[0]
    const headers = []
    for (const th of table.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi))
      headers.push(th[1].replace(/<[^>]+>/g, '').trim().toLowerCase())
    if (!headers.some(h => h.includes('name') || h.includes('athlete'))) continue
    for (const tr of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = []
      for (const td of tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi))
        cells.push(td[1].replace(/<[^>]+>/g, '').trim())
      if (cells.length < 2) continue
      const obj = {}
      headers.forEach((h, i) => { if (cells[i] !== undefined) obj[h] = cells[i] })
      if (Object.keys(obj).length > 0) rows.push(obj)
    }
  }
  return rows
}

function normalizeAthletes(raw) {
  return raw.map(obj => {
    const nested = obj?.athlete ?? obj
    const name = extractName(obj)
    if (!name) return null
    const genderRaw = obj?.gender ?? obj?.sex ?? obj?.division ?? nested?.gender
    const gender = normalizeGender(genderRaw)
    const division = String(obj?.division ?? obj?.category ?? obj?.class ?? '').trim() || null
    const countryRaw = nested?.countryCode ?? nested?.country_code ?? obj?.countryCode ?? obj?.country_code ?? nested?.country ?? obj?.country
    const country_code = normalizeCountryCode(typeof countryRaw === 'string' ? countryRaw : null)
    const country = typeof (nested?.country ?? obj?.country) === 'string' ? (nested?.country ?? obj?.country) : null
    const bibRaw = obj?.bib ?? obj?.bibNumber
    const bib = bibRaw != null && !isNaN(Number(bibRaw)) ? Number(bibRaw) : null
    const rankRaw = nested?.ptoWorldRanking ?? nested?.pto_rank ?? nested?.ptoRank ?? nested?.worldRanking ?? obj?.pto_rank
    const pto_rank = rankRaw != null && Number(rankRaw) > 0 ? Number(rankRaw) : null
    return { name: normalizeName(name), gender, country, country_code, bib, division, pto_rank }
  }).filter(a => a && a.name.length > 2)
}

function isPro(a) {
  if (!a.division) return true
  const d = a.division.toUpperCase()
  return d.includes('PRO') || d === 'MPRO' || d === 'FPRO'
}

function priceFromPtoRank(rank) {
  if (!rank) return 10
  if (rank <= 7)   return 35
  if (rank <= 15)  return 28
  if (rank <= 25)  return 22
  if (rank <= 40)  return 18
  if (rank <= 60)  return 15
  if (rank <= 80)  return 12
  if (rank <= 120) return 11
  return 10
}

// ── Fetch & scrape ─────────────────────────────────────────────────────────

async function scrapeStartlist(url) {
  console.log(`\n🔍  Fetching: ${url}`)
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/json,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.7',
    },
    signal: AbortSignal.timeout(20000),
  })

  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)

  const ct = res.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) {
    const data = await res.json()
    const raw = Array.isArray(data) ? data : (Object.values(data).find(v => Array.isArray(v)) ?? [])
    const athletes = normalizeAthletes(raw)
    return { athletes, source: 'JSON direto' }
  }

  const html = await res.text()
  let source = 'desconhecido'
  if (url.includes('protriathletes.org') || url.includes('ptoworld.com')) source = 'PTO'
  else if (url.includes('ironman.com')) source = 'Ironman'

  // Strategy 1: __NEXT_DATA__
  const nextMatch = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/)
  if (nextMatch) {
    try {
      const nd = JSON.parse(nextMatch[1])
      const arrays = collectArrays(nd).filter(arr => arr.length > 0 && isAthleteObject(arr[0])).sort((a, b) => b.length - a.length)
      if (arrays.length > 0) {
        const athletes = normalizeAthletes(arrays[0])
        if (athletes.length > 0) return { athletes, source: source || 'Next.js (__NEXT_DATA__)' }
      }
    } catch {}
  }

  // Strategy 2: JSON script tags
  for (const m of html.matchAll(/<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1])
      const arrays = collectArrays(data).filter(arr => arr.length > 0 && isAthleteObject(arr[0])).sort((a, b) => b.length - a.length)
      if (arrays.length > 0) {
        const athletes = normalizeAthletes(arrays[0])
        if (athletes.length > 0) return { athletes, source: 'JSON embutido' }
      }
    } catch {}
  }

  // Strategy 3: HTML tables
  const rows = parseHtmlTables(html)
  if (rows.length > 0) {
    const athletes = normalizeAthletes(rows)
    if (athletes.length > 0) return { athletes, source: 'Tabela HTML' }
  }

  return { athletes: [], source: 'não encontrado' }
}

// ── Main ───────────────────────────────────────────────────────────────────

;(async () => {
  // Validate race
  const { data: race, error: raceErr } = await supabase.from('races').select('id, name').eq('id', raceId).single()
  if (raceErr || !race) { console.error('❌  Race not found:', raceId); process.exit(1) }
  console.log(`🏁  Prova: ${race.name}`)

  const { athletes: all, source } = await scrapeStartlist(url)
  if (all.length === 0) { console.error('❌  Nenhum atleta encontrado. Tente a importação JSON manual.'); process.exit(1) }

  console.log(`📡  Fonte: ${source}`)
  const athletes = onlyPro ? all.filter(isPro) : all
  console.log(`👤  ${athletes.length} atletas${onlyPro ? ' PRO' : ''} (${all.length} no total)`)

  let inserted = 0
  const errors = []

  for (const a of athletes) {
    // Upsert athlete
    const { data: athlete, error: aErr } = await supabase
      .from('athletes')
      .upsert(
        {
          name: a.name,
          gender: a.gender ?? 'M',
          type: isPro(a) ? 'pro' : 'age_grouper',
          country: a.country,
          country_code: a.country_code,
          pto_rank: a.pto_rank,
        },
        { onConflict: 'name,gender,type' }
      )
      .select('id')
      .single()

    if (aErr || !athlete) { errors.push(`${a.name}: ${aErr?.message}`); continue }

    // Link to race
    const price = priceFromPtoRank(a.pto_rank)
    await supabase
      .from('race_athletes')
      .upsert(
        { race_id: raceId, athlete_id: athlete.id, price, bib: a.bib },
        { onConflict: 'race_id,athlete_id' }
      )
    inserted++
  }

  console.log(`\n✅  ${inserted} atleta(s) importado(s) com sucesso.`)
  if (errors.length > 0) {
    console.log(`⚠️   ${errors.length} erro(s):`)
    errors.forEach(e => console.log(`    - ${e}`))
  }
})()
