#!/usr/bin/env node
/**
 * Fetch and import race results from a URL.
 * Always fetches BOTH male (MPRO) and female (FPRO) results.
 *
 * Usage:
 *   node scripts/fetch-results.mjs <url> <race_id> [--dry-run]
 *
 * Options:
 *   --dry-run   Preview extracted results without writing to the database
 *
 * Supported sites:
 *   - protrinews.com  (curl + RSC JSON extraction — site blocks bots)
 *   - protriathletes.org / ptoworld.com
 *   - ironman.com
 *   - Any Next.js site with __NEXT_DATA__
 *   - Any page with embedded JSON or HTML tables
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'
import { writeFileSync, existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

// ── Env ───────────────────────────────────────────────────────────────────────

function getEnv(k) {
  if (process.env[k]) return process.env[k]
  const f = resolve(process.cwd(), '.env.local')
  if (existsSync(f)) {
    const m = readFileSync(f, 'utf8').match(new RegExp(`^${k}=["']?(.+?)["']?$`, 'm'))
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

const [,, url, raceId, ...flags] = process.argv
if (!url || !raceId) {
  console.error('Usage: node scripts/fetch-results.mjs <url> <race_id> [--dry-run]')
  process.exit(1)
}

const DRY_RUN = flags.includes('--dry-run')
if (DRY_RUN) console.log('🔍  DRY-RUN — nenhum dado será gravado no banco\n')

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalize(name) {
  return (name ?? '').trim().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ')
}

function normKey(name) {
  return normalize(name).toLowerCase().replace(/-/g, ' ')
}

function extractName(obj) {
  for (const k of ['athlete_full_name','fullName','full_name','name','athleteName','athlete_name']) {
    if (typeof obj?.[k] === 'string' && obj[k].trim().length > 1) return obj[k].trim()
  }
  const first = obj?.firstName ?? obj?.first_name ?? obj?.givenName ?? ''
  const last  = obj?.lastName  ?? obj?.last_name  ?? obj?.familyName ?? obj?.surname ?? ''
  if (first || last) return `${first} ${last}`.trim()
  if (obj?.athlete) return extractName(obj.athlete)
  return ''
}

function parseTime(val) {
  if (val == null || val === '') return null
  if (typeof val === 'number') return val > 0 ? Math.round(val) : null
  const str = String(val).trim()
  if (!str || /^(--|DNF|DNS|N\/A|-)$/i.test(str)) return null
  const cleaned = str.replace(/[^0-9:]/g, '')
  if (!cleaned) return null
  const parts = cleaned.split(':').map(Number)
  if (parts.some(isNaN)) return null
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] > 0 ? parts[0] : null
}

function fmtTime(secs) {
  if (!secs) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
}

function isDnf(obj) {
  const s = String(obj?.status ?? obj?.raceStatus ?? obj?.finishStatus ?? obj?.result ?? '').toUpperCase()
  return !!(obj?.dnf || obj?.DNF || s === 'DNF' || s.includes('NOT FINISH') || s === 'DQ')
}

function isDns(obj) {
  const s = String(obj?.status ?? obj?.raceStatus ?? obj?.finishStatus ?? obj?.result ?? '').toUpperCase()
  return !!(obj?.dns || obj?.DNS || s === 'DNS' || s.includes('NOT START'))
}

function normalizeResult(obj) {
  const name = extractName(obj)
  if (!name || name.length < 2) return null
  const posRaw = obj?.position ?? obj?.rank ?? obj?.pos ?? obj?.pro_pos ??
                 obj?.finishPosition ?? obj?.overallPosition ?? obj?.proPos ?? obj?.place
  const pro_pos = posRaw != null && Number(posRaw) > 0 ? Number(posRaw) : null
  const bibRaw  = obj?.bib ?? obj?.bibNumber ?? obj?.bib_number
  const bib     = bibRaw != null && !isNaN(Number(bibRaw)) ? Number(bibRaw) : null
  return {
    name: normalize(name), bib, pro_pos,
    swim_time:   parseTime(obj?.swimTime   ?? obj?.swim_time   ?? obj?.swim   ?? obj?.split_swim),
    t1_time:     parseTime(obj?.t1Time     ?? obj?.t1_time     ?? obj?.t1),
    bike_time:   parseTime(obj?.bikeTime   ?? obj?.bike_time   ?? obj?.bike   ?? obj?.split_bike ?? obj?.cycleTime),
    t2_time:     parseTime(obj?.t2Time     ?? obj?.t2_time     ?? obj?.t2),
    run_time:    parseTime(obj?.runTime    ?? obj?.run_time    ?? obj?.run    ?? obj?.split_run),
    finish_time: parseTime(obj?.finishTime ?? obj?.finish_time ?? obj?.totalTime ?? obj?.total_time ?? obj?.elapsed),
    dnf: isDnf(obj),
    dns: isDns(obj),
  }
}

function looksLikeResult(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false
  const hasName = extractName(obj).length > 2
  const hasData = obj.position != null || obj.rank != null || obj.finishTime != null ||
                  obj.finish_time != null || obj.totalTime != null || obj.swimTime != null ||
                  obj.dnf != null || obj.status != null
  return hasName && hasData
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
  const out = []
  for (const v of Object.values(obj)) out.push(...collectArrays(v, seen, depth + 1))
  return out
}

function parseHtmlTables(html) {
  const rows = []
  for (const tm of html.matchAll(/<table[\s\S]*?<\/table>/gi)) {
    const tbl = tm[0]
    const headers = []
    for (const th of tbl.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi))
      headers.push(th[1].replace(/<[^>]+>/g, '').trim().toLowerCase())
    if (!headers.some(h => h.includes('name') || h.includes('athlete') || h.includes('pos'))) continue
    for (const tr of tbl.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
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

// ── Fetch strategies ──────────────────────────────────────────────────────────

async function fetchDirect(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': 'text/html,application/json,*/*;q=0.8' },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const ct = res.headers.get('content-type') ?? ''
  const body = ct.includes('application/json') ? await res.json() : await res.text()
  return { body, isJson: ct.includes('application/json') }
}

function fetchCurl(url) {
  const tmp = '/tmp/fetch-results-page.html'
  execSync(`curl -s "${url}" -H "User-Agent: ${UA}" -H "Accept: text/html" -L -o "${tmp}"`, { timeout: 30000 })
  return readFileSync(tmp, 'utf8')
}

// ── RSC JSON parser (protrinews.com and similar Next.js RSC sites) ────────────
// Data is embedded as: self.__next_f.push([1,"<escaped JSON string>"])
// May contain a `results` object keyed by program_name (MPRO / FPRO)

function parseRscJson(html) {
  const byGender = { MPRO: [], FPRO: [] }

  for (const m of html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)) {
    let inner
    try { inner = JSON.parse('"' + m[1] + '"') } catch { continue }

    // Find a JSON object that contains results / startLists / MPRO
    const start = inner.indexOf('{"')
    if (start === -1) continue

    let depth = 0, end = -1
    for (let i = start; i < inner.length; i++) {
      if (inner[i] === '{') depth++
      else if (inner[i] === '}') { depth--; if (depth === 0) { end = i; break } }
    }
    if (end === -1) continue

    let parsed
    try { parsed = JSON.parse(inner.slice(start, end + 1)) } catch { continue }

    // Look for entries array anywhere in the object
    const json = JSON.stringify(parsed)
    if (!json.includes('MPRO') && !json.includes('FPRO') && !json.includes('position')) continue

    // Try to find result entries per gender
    function walk(node) {
      if (!node || typeof node !== 'object') return
      if (Array.isArray(node)) {
        // If this array looks like results, assign by gender
        if (node.length > 0 && looksLikeResult(node[0])) {
          // Determine gender from entries or surrounding context
          for (const entry of node) {
            const gender = detectGender(entry)
            if (gender) byGender[gender].push(entry)
          }
        }
        node.forEach(walk)
        return
      }
      // Check for startLists / results keyed by program_name
      if (node.program_name === 'MPRO' || node.program_name === 'FPRO') {
        const arr = node.results ?? node.entries ?? node.athletes ?? []
        if (Array.isArray(arr) && arr.length > 0) {
          byGender[node.program_name].push(...arr)
          return
        }
      }
      Object.values(node).forEach(walk)
    }

    walk(parsed)
  }

  return byGender
}

function detectGender(entry) {
  const prog = entry?.program_name ?? entry?.start_list?.program_name ?? entry?.division ?? entry?.gender ?? ''
  if (/MPRO|^M$/i.test(prog)) return 'MPRO'
  if (/FPRO|^F$/i.test(prog)) return 'FPRO'
  return null
}

// ── Generic parser (tries multiple strategies, returns {MPRO,FPRO}) ───────────

function parseGeneric(html) {
  const byGender = { MPRO: [], FPRO: [] }

  // Strategy 1: __NEXT_DATA__
  const nd = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/)
  if (nd) {
    try {
      const data = JSON.parse(nd[1])
      const arrays = collectArrays(data)
        .filter(a => a.length > 0 && looksLikeResult(a[0]))
        .sort((a, b) => b.length - a.length)
      if (arrays.length > 0) {
        splitByGender(arrays[0], byGender)
        if (byGender.MPRO.length + byGender.FPRO.length > 0) return byGender
      }
    } catch {}
  }

  // Strategy 2: application/json script tags
  for (const m of html.matchAll(/<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1])
      const arrays = collectArrays(data)
        .filter(a => a.length > 0 && looksLikeResult(a[0]))
        .sort((a, b) => b.length - a.length)
      if (arrays.length > 0) {
        splitByGender(arrays[0], byGender)
        if (byGender.MPRO.length + byGender.FPRO.length > 0) return byGender
      }
    } catch {}
  }

  // Strategy 3: HTML tables
  const rows = parseHtmlTables(html)
  if (rows.length > 0) {
    splitByGender(rows, byGender)
  }

  return byGender
}

function splitByGender(entries, byGender) {
  // If entries already have gender info, split them
  const hasMpro = entries.some(e => /MPRO/i.test(JSON.stringify(e)))
  const hasFpro = entries.some(e => /FPRO/i.test(JSON.stringify(e)))

  if (hasMpro || hasFpro) {
    for (const e of entries) {
      const g = detectGender(e)
      if (g) { byGender[g].push(e); continue }
      // If no gender marker on entry, try to infer from context
      byGender.MPRO.push(e)
    }
  } else {
    // No gender info — put everything in MPRO (will warn user)
    byGender.MPRO.push(...entries)
  }
}

// ── Main scraper ──────────────────────────────────────────────────────────────

async function scrape(url) {
  // For protrinews.com, go straight to curl (site returns 403 to bots)
  if (url.includes('protrinews.com')) {
    console.log('  → protrinews.com detectado, usando curl...')
    const html = fetchCurl(url)
    const byGender = parseRscJson(html)
    if (byGender.MPRO.length + byGender.FPRO.length > 0) return { byGender, source: 'protrinews.com (RSC JSON)' }
    // Fallback to generic in case RSC format changed
    return { byGender: parseGeneric(html), source: 'protrinews.com (fallback genérico)' }
  }

  // Try direct fetch
  let html
  try {
    const { body, isJson } = await fetchDirect(url)
    if (isJson) {
      const byGender = { MPRO: [], FPRO: [] }
      const arr = Array.isArray(body) ? body : (Object.values(body).find(v => Array.isArray(v)) ?? [])
      splitByGender(arr, byGender)
      return { byGender, source: 'JSON direto' }
    }
    html = body
  } catch (e) {
    if (e.message?.includes('403') || e.message?.includes('forbidden')) {
      console.log('  → fetch bloqueado, tentando curl...')
      html = fetchCurl(url)
    } else throw e
  }

  // Try RSC first (other Next.js RSC sites)
  const rsc = parseRscJson(html)
  if (rsc.MPRO.length + rsc.FPRO.length > 0) return { byGender: rsc, source: 'RSC JSON' }

  return { byGender: parseGeneric(html), source: 'genérico' }
}

// ── DB import ─────────────────────────────────────────────────────────────────

async function importResults(raceId, results, athletesByName, athletesByBib) {
  let ok = 0
  const errors = []

  for (const r of results) {
    // Resolve athlete: bib first, then exact name, then last-name fuzzy
    let athleteId = r.bib ? athletesByBib.get(r.bib) : null
    if (!athleteId) {
      athleteId = athletesByName.get(normKey(r.name))
      if (!athleteId) {
        const last = normKey(r.name).split(' ').pop()
        if (last && last.length > 3) {
          for (const [k, id] of athletesByName) {
            if (k.endsWith(' ' + last) || k.startsWith(last + ' ')) { athleteId = id; break }
          }
        }
      }
    }

    if (!athleteId) { errors.push(`Atleta não encontrado na startlist: ${r.name}`); continue }

    if (DRY_RUN) { ok++; continue }

    const { error } = await supabase.from('results').upsert(
      {
        race_id: raceId, athlete_id: athleteId,
        pro_pos: r.pro_pos, overall_pos: r.pro_pos, ag_pos: null,
        swim_time: r.swim_time, t1_time: r.t1_time,
        bike_time: r.bike_time, t2_time: r.t2_time, run_time: r.run_time,
        finish_time: r.finish_time, dnf: r.dnf, dns: r.dns, kona_slot: false,
      },
      { onConflict: 'race_id,athlete_id' }
    )
    if (error) { errors.push(`${r.name}: ${error.message}`); continue }
    ok++
  }

  return { ok, errors }
}

// ── Run ───────────────────────────────────────────────────────────────────────

;(async () => {
  const { data: race, error: raceErr } = await supabase.from('races').select('id, name').eq('id', raceId).single()
  if (raceErr || !race) { console.error('❌  Prova não encontrada:', raceId); process.exit(1) }
  console.log(`🏁  Prova: ${race.name}\n`)

  // Load startlist for athlete resolution
  const { data: raceAthletes } = await supabase
    .from('race_athletes')
    .select('athlete_id, bib, athlete:athletes(name)')
    .eq('race_id', raceId)

  const athletesByName = new Map()
  const athletesByBib  = new Map()
  for (const ra of raceAthletes ?? []) {
    if (ra.athlete?.name) athletesByName.set(normKey(ra.athlete.name), ra.athlete_id)
    if (ra.bib) athletesByBib.set(ra.bib, ra.athlete_id)
  }
  console.log(`👤  ${raceAthletes?.length ?? 0} atletas na startlist\n`)

  console.log(`🔍  Buscando resultados em: ${url}`)
  const { byGender, source } = await scrape(url)
  console.log(`📡  Fonte: ${source}`)

  const menRaw   = byGender.MPRO.map(normalizeResult).filter(Boolean)
  const womenRaw = byGender.FPRO.map(normalizeResult).filter(Boolean)

  if (menRaw.length + womenRaw.length === 0) {
    console.error('\n❌  Nenhum resultado encontrado. Tente informar a URL de outra aba (masculino ou feminino) ou verifique se a prova já tem resultados publicados.')
    process.exit(1)
  }

  // Preview
  console.log(`\n📊  MASCULINO — ${menRaw.length} resultados`)
  menRaw.slice(0, 5).forEach(r =>
    console.log(`  ${String(r.pro_pos ?? '?').padStart(2)}. ${r.name.padEnd(32)} ${fmtTime(r.finish_time)}${r.dnf ? ' DNF' : r.dns ? ' DNS' : ''}`)
  )
  if (menRaw.length > 5) console.log(`  ... e mais ${menRaw.length - 5}`)

  console.log(`\n📊  FEMININO — ${womenRaw.length} resultados`)
  womenRaw.slice(0, 5).forEach(r =>
    console.log(`  ${String(r.pro_pos ?? '?').padStart(2)}. ${r.name.padEnd(32)} ${fmtTime(r.finish_time)}${r.dnf ? ' DNF' : r.dns ? ' DNS' : ''}`)
  )
  if (womenRaw.length > 5) console.log(`  ... e mais ${womenRaw.length - 5}`)

  if (menRaw.length > 0 && womenRaw.length === 0) {
    console.log('\n⚠️   Apenas resultados masculinos encontrados — o site pode usar URLs separadas por gênero.')
    console.log('    Rode novamente com a URL da aba feminina se necessário.')
  }
  if (womenRaw.length > 0 && menRaw.length === 0) {
    console.log('\n⚠️   Apenas resultados femininos encontrados — verifique a URL da aba masculina.')
  }

  if (DRY_RUN) {
    console.log('\n🔍  DRY-RUN concluído. Rode sem --dry-run para importar.')
    return
  }

  // Import
  console.log('\n⏳  Importando...')
  const allResults = [...menRaw, ...womenRaw]
  const { ok, errors } = await importResults(raceId, allResults, athletesByName, athletesByBib)

  console.log(`\n✅  ${ok} resultado(s) importado(s) com sucesso.`)
  if (errors.length > 0) {
    console.log(`⚠️   ${errors.length} não encontrado(s) na startlist:`)
    errors.slice(0, 20).forEach(e => console.log(`    - ${e}`))
    if (errors.length > 20) console.log(`    ... e mais ${errors.length - 20}`)
    console.log('\n💡  Execute /import-startlist primeiro para adicionar os atletas à prova.')
  }
  console.log('\n→  Próximo passo: /admin/pontuacao para calcular os Trix Scores.')
})()
