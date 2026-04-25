#!/usr/bin/env node
/**
 * Import results from a URL into the Trixer database.
 *
 * Usage:
 *   node scripts/import-results.mjs <url> <race_id>
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Note: athletes must already be linked to the race (import startlist first).
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const [,, url, raceId] = process.argv
if (!url || !raceId) {
  console.error('Usage: node scripts/import-results.mjs <url> <race_id>')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// ── Helpers ─────────────────────────────────────────────────────────────────

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

function parseTime(val) {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'number') return val > 0 ? Math.round(val) : null
  const str = String(val).trim()
  if (!str || ['--','DNF','DNS','N/A','-'].includes(str.toUpperCase())) return null
  const cleaned = str.replace(/[^0-9:]/g, '')
  if (!cleaned) return null
  const parts = cleaned.split(':').map(Number)
  if (parts.some(isNaN)) return null
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] > 0 ? parts[0] : null
}

function isResultObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false
  const hasName = extractName(obj).length > 2
  const hasPos  = obj.position != null || obj.rank != null || obj.pro_pos != null || obj.finishPosition != null
  const hasTime = obj.finishTime != null || obj.finish_time != null || obj.totalTime != null || obj.swimTime != null || obj.dnf != null
  return hasName && (hasPos || hasTime)
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
    if (!headers.some(h => h.includes('name') || h.includes('athlete') || h.includes('pos'))) continue
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

function normalizeResults(raw) {
  return raw.map(obj => {
    const name = extractName(obj)
    if (!name) return null
    const bibRaw = obj?.bib ?? obj?.bibNumber
    const bib = bibRaw != null && !isNaN(Number(bibRaw)) ? Number(bibRaw) : null
    const posRaw = obj?.position ?? obj?.rank ?? obj?.pos ?? obj?.pro_pos ?? obj?.finishPosition ?? obj?.overallPosition ?? obj?.proPos
    const pro_pos = posRaw != null && Number(posRaw) > 0 ? Number(posRaw) : null
    const status = String(obj?.status ?? obj?.raceStatus ?? obj?.finishStatus ?? '').toUpperCase()
    const dnf = !!(obj?.dnf || obj?.DNF || status === 'DNF' || status.includes('NOT FINISH'))
    const dns = !!(obj?.dns || obj?.DNS || status === 'DNS' || status.includes('NOT START'))
    return {
      name: normalizeName(name), bib, pro_pos,
      swim_time:   parseTime(obj?.swimTime   ?? obj?.swim_time   ?? obj?.swim),
      t1_time:     parseTime(obj?.t1Time      ?? obj?.t1_time     ?? obj?.t1),
      bike_time:   parseTime(obj?.bikeTime    ?? obj?.bike_time   ?? obj?.bike ?? obj?.cycleTime),
      t2_time:     parseTime(obj?.t2Time      ?? obj?.t2_time     ?? obj?.t2),
      run_time:    parseTime(obj?.runTime     ?? obj?.run_time    ?? obj?.run),
      finish_time: parseTime(obj?.finishTime  ?? obj?.finish_time ?? obj?.totalTime ?? obj?.elapsed),
      dnf, dns,
    }
  }).filter(r => r && r.name.length > 2)
}

function formatTime(secs) {
  if (!secs) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

// ── Scrape ──────────────────────────────────────────────────────────────────

async function scrapeResults(url) {
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
    return { results: normalizeResults(raw), source: 'JSON direto' }
  }

  const html = await res.text()
  let source = 'desconhecido'
  if (url.includes('protriathletes.org') || url.includes('ptoworld.com')) source = 'PTO'
  else if (url.includes('ironman.com')) source = 'Ironman'

  // __NEXT_DATA__
  const nextMatch = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/)
  if (nextMatch) {
    try {
      const nd = JSON.parse(nextMatch[1])
      const arrays = collectArrays(nd).filter(arr => arr.length > 0 && isResultObject(arr[0])).sort((a, b) => b.length - a.length)
      if (arrays.length > 0) {
        const results = normalizeResults(arrays[0])
        if (results.length > 0) return { results, source: source || 'Next.js (__NEXT_DATA__)' }
      }
    } catch {}
  }

  // JSON script tags
  for (const m of html.matchAll(/<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1])
      const arrays = collectArrays(data).filter(arr => arr.length > 0 && isResultObject(arr[0])).sort((a, b) => b.length - a.length)
      if (arrays.length > 0) {
        const results = normalizeResults(arrays[0])
        if (results.length > 0) return { results, source: 'JSON embutido' }
      }
    } catch {}
  }

  // HTML tables
  const rows = parseHtmlTables(html)
  if (rows.length > 0) {
    const results = normalizeResults(rows)
    if (results.length > 0) return { results, source: 'Tabela HTML' }
  }

  return { results: [], source: 'não encontrado' }
}

// ── Main ────────────────────────────────────────────────────────────────────

;(async () => {
  const { data: race, error: raceErr } = await supabase.from('races').select('id, name').eq('id', raceId).single()
  if (raceErr || !race) { console.error('❌  Race not found:', raceId); process.exit(1) }
  console.log(`🏁  Prova: ${race.name}`)

  // Load race athletes for name matching
  const { data: raceAthletes } = await supabase
    .from('race_athletes')
    .select('athlete_id, bib, athlete:athletes(name)')
    .eq('race_id', raceId)
  const athletesByName = new Map()
  const athletesByBib  = new Map()
  for (const ra of raceAthletes ?? []) {
    if (ra.athlete?.name) athletesByName.set(ra.athlete.name.toLowerCase(), ra.athlete_id)
    if (ra.bib) athletesByBib.set(ra.bib, ra.athlete_id)
  }
  console.log(`👤  ${raceAthletes?.length ?? 0} atletas na startlist desta prova`)

  const { results, source } = await scrapeResults(url)
  if (results.length === 0) { console.error('❌  Nenhum resultado encontrado.'); process.exit(1) }
  console.log(`📡  Fonte: ${source}`)
  console.log(`📊  ${results.length} resultados extraídos\n`)

  // Preview top 5
  console.log('Top 5 extraídos:')
  results.slice(0, 5).forEach((r, i) => {
    console.log(`  ${i+1}. ${r.name.padEnd(30)} pos=${r.pro_pos ?? '?'} total=${formatTime(r.finish_time)} dnf=${r.dnf} dns=${r.dns}`)
  })
  console.log()

  let inserted = 0
  const errors = []

  for (const r of results) {
    // Resolve athlete by bib first, then by name (fuzzy)
    let athleteId = r.bib ? athletesByBib.get(r.bib) : null
    if (!athleteId) {
      const nameLower = r.name.toLowerCase()
      // Exact match
      athleteId = athletesByName.get(nameLower)
      // Partial match — last name
      if (!athleteId) {
        const lastName = nameLower.split(' ').pop()
        if (lastName && lastName.length > 3) {
          for (const [key, id] of athletesByName) {
            if (key.includes(lastName)) { athleteId = id; break }
          }
        }
      }
    }

    if (!athleteId) { errors.push(`Atleta não encontrado: ${r.name}`); continue }

    const { error } = await supabase.from('results').upsert(
      {
        race_id: raceId, athlete_id: athleteId,
        pro_pos: r.pro_pos, swim_time: r.swim_time, t1_time: r.t1_time,
        bike_time: r.bike_time, t2_time: r.t2_time, run_time: r.run_time,
        finish_time: r.finish_time, overall_pos: null, ag_pos: null,
        dnf: r.dnf, dns: r.dns, kona_slot: false,
      },
      { onConflict: 'race_id,athlete_id' }
    )
    if (error) { errors.push(`${r.name}: ${error.message}`); continue }
    inserted++
  }

  console.log(`✅  ${inserted} resultado(s) importado(s) com sucesso.`)
  if (errors.length > 0) {
    console.log(`⚠️   ${errors.length} erro(s):`)
    errors.forEach(e => console.log(`    - ${e}`))
    console.log('\n💡  Erros de "Atleta não encontrado" indicam que o atleta não está na startlist.')
    console.log('    Execute import-startlist.mjs primeiro, depois tente novamente.')
  }
})()
