#!/usr/bin/env node
/**
 * Update race startlist from a URL.
 *
 * Full workflow in a single command:
 *   1. Fetch startlist (MPRO + FPRO) from URL — supports protrinews.com and generic sites
 *   2. Cross-reference with existing athletes (robust duplicate detection)
 *   3. Create new athletes (with initial T$ from best PTO or WTCS rank)
 *   4. Upsert race_athletes for the race
 *   5. Trigger photo update for athletes without photos
 *
 * Rules:
 *   - NEVER changes current_price of existing athletes
 *   - NEVER creates duplicates (strict normalized-name + gender dedup)
 *   - Reports ambiguous name matches for manual review
 *
 * Usage:
 *   node scripts/update-startlist.mjs <url> <race_id> [--dry-run]
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient }  from '@supabase/supabase-js'
import { execSync }      from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

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
  console.error('Usage: node scripts/update-startlist.mjs <url> <race_id> [--dry-run]')
  process.exit(1)
}

const DRY_RUN = flags.includes('--dry-run')
if (DRY_RUN) console.log('🔍  DRY-RUN — nenhum dado será gravado\n')

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// ── Name normalisation ────────────────────────────────────────────────────────

function normKey(name) {
  return (name ?? '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Returns true when two names resolve to the same key after normalisation
function sameNorm(a, b) { return normKey(a) === normKey(b) }

// Looser check: same first + last word (handles missing middle names / initials)
function similarName(a, b) {
  if (sameNorm(a, b)) return true
  const pa = normKey(a).split(' '), pb = normKey(b).split(' ')
  return pa[0] === pb[0] && pa[pa.length - 1] === pb[pb.length - 1]
}

// ── Pricing (same table used everywhere in the system) ────────────────────────

function priceFromRank(rank) {
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

function bestPrice(ptoRank, wtcsRank) {
  const prices = [ptoRank, wtcsRank].filter(Boolean).map(priceFromRank)
  return prices.length ? Math.max(...prices) : 10
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.json()
}

function curlHtml(url) {
  const tmp = '/tmp/update-startlist-page.html'
  execSync(`curl -s "${url}" -H "User-Agent: ${UA}" -H "Accept: text/html" -L -o "${tmp}"`, { timeout: 30000 })
  return readFileSync(tmp, 'utf8')
}

async function fetchHtml(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'text/html' },
      signal: AbortSignal.timeout(20000),
    })
    if (res.status === 403) return curlHtml(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.text()
  } catch (e) {
    if (e.message?.includes('403')) return curlHtml(url)
    throw e
  }
}

// ── Ranking fetchers ──────────────────────────────────────────────────────────

async function fetchPtoMen() {
  const data = await fetchJson('https://stats.protriathletes.org/api/rankings/men?limit=500')
  return (data.rankings ?? []).map(r => ({ rank: r.rank, name: normKey(r.name) })).filter(r => r.name)
}

async function fetchPtoWomen() {
  try {
    const data = await fetchJson('https://stats.protriathletes.org/api/rankings/women?limit=500')
    const list = (data.rankings ?? []).map(r => ({ rank: r.rank, name: normKey(r.name) })).filter(r => r.name)
    if (list.length > 50) return list
  } catch {}
  // Fallback: HTML scraping (API ?gender=female has a bug returning MPRO data)
  const html = await fetchHtml('https://stats.protriathletes.org/rankings/women')
  const results = []
  for (const m of html.matchAll(/<div[^>]+data-division="FPRO"[^>]*>([\s\S]*?)(?=<div[^>]+data-division=|<\/section|<footer|$)/g)) {
    const rankM = m[1].match(/>\s*(\d+)\s*</)
    const nameM = m[1].match(/class="[^"]*(?:name|athlete-name)[^"]*"[^>]*>\s*([\wÀ-ž''\- ]{3,})\s*</)
    if (rankM && nameM) results.push({ rank: parseInt(rankM[1]), name: normKey(nameM[1]) })
  }
  return results
}

async function fetchWtcs(id) {
  const data = await fetchJson(`https://triathlon.org/tri-api/v1/rankings/${id}`)
  return (data.data?.rankings ?? [])
    .map((r, i) => ({ rank: i + 1, name: normKey(r.athlete_full_name ?? '') }))
    .filter(r => r.name.length > 2)
}

// ── Startlist scraper ─────────────────────────────────────────────────────────

const ISO3_TO_2 = {
  BRA:'BR',USA:'US',DEU:'DE',GER:'DE',GBR:'GB',AUS:'AU',CHE:'CH',SUI:'CH',
  NZL:'NZ',CAN:'CA',FRA:'FR',ESP:'ES',ITA:'IT',NLD:'NL',NED:'NL',NOR:'NO',
  SWE:'SE',DNK:'DK',DEN:'DK',JPN:'JP',CHN:'CN',ZAF:'ZA',RSA:'ZA',MEX:'MX',
  ARG:'AR',PRT:'PT',POR:'PT',BEL:'BE',AUT:'AT',POL:'PL',LUX:'LU',
  SVN:'SI',SLO:'SI',CZE:'CZ',SVK:'SK',HUN:'HU',ROU:'RO',BGR:'BG',
  HRV:'HR',CRO:'HR',GRC:'GR',GRE:'GR',TUR:'TR',UKR:'UA',COL:'CO',CHL:'CL',
  PER:'PE',VEN:'VE',ECU:'EC',PRY:'PY',URY:'UY',BOL:'BO',ISL:'IS',
}

function normalizeCountryCode(code) {
  if (!code) return null
  const u = code.trim().toUpperCase()
  if (u.length === 2) return u
  return ISO3_TO_2[u] ?? null
}

function normalizeGender(val) {
  const s = String(val ?? '').toUpperCase().trim()
  if (['M','MALE','MEN','MPRO'].some(v => s.startsWith(v))) return 'M'
  if (['F','FEMALE','FPRO','WOMEN','W'].some(v => s.startsWith(v))) return 'F'
  return null
}

function extractName(obj) {
  for (const k of ['athlete_full_name','fullName','full_name','name','athleteName','athlete_name']) {
    if (typeof obj?.[k] === 'string' && obj[k].trim().length > 1) return obj[k].trim()
  }
  const first = obj?.firstName ?? obj?.first_name ?? ''
  const last  = obj?.lastName  ?? obj?.last_name  ?? obj?.surname ?? ''
  if (first || last) return `${first} ${last}`.trim()
  if (obj?.athlete) return extractName(obj.athlete)
  return ''
}

// Parse protrinews.com RSC JSON (self.__next_f.push pattern)
function parseProtriNews(html) {
  const byGender = { MPRO: [], FPRO: [] }

  for (const m of html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)) {
    let inner
    try { inner = JSON.parse('"' + m[1] + '"') } catch { continue }

    const idx = inner.indexOf('{"startLists"')
    if (idx === -1) continue

    let depth = 0, end = -1
    for (let i = idx; i < inner.length; i++) {
      if (inner[i] === '{') depth++
      else if (inner[i] === '}') { if (--depth === 0) { end = i; break } }
    }
    if (end === -1) continue

    let parsed
    try { parsed = JSON.parse(inner.slice(idx, end + 1)) } catch { continue }

    const slMap = {}
    for (const sl of parsed.startLists ?? []) slMap[sl.id] = sl.program_name

    for (const entry of parsed.entries ?? parsed.athletes ?? []) {
      const prog = slMap[entry.start_list_id] ?? entry.program_name ?? ''
      const gender = /^FPRO/i.test(prog) ? 'FPRO' : 'MPRO'
      byGender[gender].push(entry)
    }

    if (byGender.MPRO.length + byGender.FPRO.length > 0) return byGender
  }
  return byGender
}

// Generic scraper: __NEXT_DATA__, JSON tags, HTML tables
function isAthleteObj(obj) {
  return obj && typeof obj === 'object' && !Array.isArray(obj) && extractName(obj).length > 2
}

function collectArrays(obj, seen = new Set(), depth = 0) {
  if (depth > 9 || !obj || typeof obj !== 'object') return []
  if (seen.has(obj)) return []; seen.add(obj)
  if (Array.isArray(obj)) {
    const n = [obj]
    for (const item of obj.slice(0, 3)) n.push(...collectArrays(item, seen, depth + 1))
    return n
  }
  const r = []
  for (const v of Object.values(obj)) r.push(...collectArrays(v, seen, depth + 1))
  return r
}

function parseGeneric(html) {
  const nd = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/)
  if (nd) {
    try {
      const data = JSON.parse(nd[1])
      const arr = collectArrays(data).filter(a => a.length > 0 && isAthleteObj(a[0])).sort((a,b) => b.length - a.length)
      if (arr.length > 0) return arr[0]
    } catch {}
  }
  for (const m of html.matchAll(/<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1])
      const arr = collectArrays(data).filter(a => a.length > 0 && isAthleteObj(a[0])).sort((a,b) => b.length - a.length)
      if (arr.length > 0) return arr[0]
    } catch {}
  }
  return []
}

function normalizeEntry(obj, forcedGender) {
  const name = extractName(obj)
  if (!name || name.length < 2) return null
  const genderRaw = forcedGender ?? obj?.gender ?? obj?.sex ?? obj?.division ?? obj?.program_name
  const gender = normalizeGender(genderRaw)
  const cc = obj?.athlete_country_iso2 ?? obj?.countryCode ?? obj?.country_code ?? obj?.country
  const country_code = normalizeCountryCode(typeof cc === 'string' ? cc : null)
  const country = typeof (obj?.country ?? obj?.athlete?.country) === 'string' ? (obj.country ?? obj.athlete?.country) : null
  const bib = obj?.bib != null && !isNaN(Number(obj.bib)) ? Number(obj.bib) : null
  return { name: name.trim(), gender, country, country_code, bib }
}

async function scrapeStartlist(url) {
  const isProtri = url.includes('protrinews.com')
  const html = isProtri ? curlHtml(url) : await fetchHtml(url)

  if (isProtri) {
    const byGender = parseProtriNews(html)
    const men   = byGender.MPRO.map(e => normalizeEntry(e, 'M')).filter(Boolean)
    const women = byGender.FPRO.map(e => normalizeEntry(e, 'F')).filter(Boolean)
    return { men, women, source: 'protrinews.com RSC JSON' }
  }

  // Generic
  const raw = parseGeneric(html)
  if (Array.isArray(raw) && raw.length > 0) {
    const men   = raw.map(e => normalizeEntry(e)).filter(e => e?.gender === 'M')
    const women = raw.map(e => normalizeEntry(e)).filter(e => e?.gender === 'F')
    const unsorted = raw.map(e => normalizeEntry(e)).filter(e => e && !e.gender)
    return { men, women, unsorted, source: 'genérico' }
  }

  return { men: [], women: [], source: 'não encontrado' }
}

// ── Main ──────────────────────────────────────────────────────────────────────

;(async () => {
  // Validate race
  const { data: race } = await supabase.from('races').select('id, name').eq('id', raceId).single()
  if (!race) { console.error('❌  Prova não encontrada:', raceId); process.exit(1) }
  console.log(`🏁  Prova: ${race.name}\n`)

  // ── Step 1: Fetch rankings upfront ──────────────────────────────────────────
  console.log('⏳  Buscando rankings PTO + WTCS ao vivo...')
  const [ptoMen, ptoWomen, wtcsMen, wtcsWomen] = await Promise.all([
    fetchPtoMen(), fetchPtoWomen(), fetchWtcs(15), fetchWtcs(16),
  ])
  console.log(`  PTO: ${ptoMen.length}H / ${ptoWomen.length}M  |  WTCS: ${wtcsMen.length}H / ${wtcsWomen.length}M`)

  const ptoMap = new Map()
  ptoMen.forEach(r => ptoMap.set(r.name, r.rank))
  ptoWomen.forEach(r => ptoMap.set(r.name, r.rank))
  const wtcsMap = new Map()
  wtcsMen.forEach(r => wtcsMap.set(r.name, r.rank))
  wtcsWomen.forEach(r => wtcsMap.set(r.name, r.rank))

  // ── Step 2: Load all existing athletes ──────────────────────────────────────
  const { data: dbAthletes } = await supabase.from('athletes').select('id, name, gender, type, current_price, photo_url')
  const dbByKey = new Map() // normKey(name+gender) → athlete row
  const dbById  = new Map()
  for (const a of dbAthletes ?? []) {
    dbByKey.set(`${normKey(a.name)}|${a.gender}`, a)
    dbById.set(a.id, a)
  }

  // ── Step 3: Fetch startlist ──────────────────────────────────────────────────
  console.log(`\n🔍  Buscando startlist em: ${url}`)
  const { men, women, unsorted = [], source } = await scrapeStartlist(url)
  console.log(`📡  Fonte: ${source}`)
  console.log(`👤  ${men.length} masculinos + ${women.length} femininos extraídos`)
  if (unsorted.length > 0) console.log(`⚠️   ${unsorted.length} sem gênero detectado — serão ignorados`)

  const allEntries = [...men, ...women]
  if (allEntries.length === 0) {
    console.error('\n❌  Nenhum atleta encontrado. Verifique a URL ou tente o processo manual do CLAUDE.md.')
    process.exit(1)
  }

  // ── Step 4: Cross-reference & plan actions ───────────────────────────────────
  console.log('\n🔎  Verificando atletas no banco...\n')

  const toLink    = []  // { entry, athleteId, isNew }
  const toCreate  = []  // entries for new athletes
  const ambiguous = []  // entries with fuzzy-only match (needs human review)
  const skipped   = []  // entries without gender — can't safely upsert

  for (const entry of allEntries) {
    if (!entry.gender) { skipped.push(entry); continue }

    const key = `${normKey(entry.name)}|${entry.gender}`

    // Exact normalized match
    if (dbByKey.has(key)) {
      toLink.push({ entry, athleteId: dbByKey.get(key).id, isNew: false })
      continue
    }

    // Fuzzy match: same first+last word, same gender
    const genderChar = entry.gender // 'M' or 'F'
    let fuzzyMatch = null
    for (const [dbKey, dbA] of dbByKey) {
      if (!dbKey.endsWith(`|${genderChar}`)) continue
      const dbName = dbKey.slice(0, -(genderChar.length + 1))
      if (similarName(entry.name, dbName.replace(normKey(''), ''))) {
        // Re-check using original names
        const partsIn = normKey(entry.name).split(' ')
        const partsDb = dbName.split(' ')
        if (partsIn[0] === partsDb[0] && partsIn[partsIn.length-1] === partsDb[partsDb.length-1]) {
          fuzzyMatch = dbA
          break
        }
      }
    }

    if (fuzzyMatch) {
      ambiguous.push({ entry, candidate: fuzzyMatch })
      // Conservative: treat as existing (link but flag)
      toLink.push({ entry, athleteId: fuzzyMatch.id, isNew: false })
      continue
    }

    // Not found → create
    toCreate.push(entry)
  }

  console.log(`  ✅ Já no sistema: ${toLink.filter(x => !x.isNew).length}`)
  console.log(`  🆕 Novos a criar: ${toCreate.length}`)
  if (ambiguous.length > 0)
    console.log(`  ⚠️  Matches fuzzy (verifique): ${ambiguous.length}`)

  if (ambiguous.length > 0) {
    console.log('\n  Matches fuzzy (nome no CSV → nome no banco):')
    ambiguous.forEach(({ entry, candidate }) =>
      console.log(`    "${entry.name}" → "${candidate.name}" (${candidate.id}) — T$${candidate.current_price}`)
    )
  }

  if (DRY_RUN) {
    console.log('\n🆕  Seriam criados:')
    toCreate.forEach(e => {
      const k = normKey(e.name)
      const pto = ptoMap.get(k) ?? null
      const wtcs = wtcsMap.get(k) ?? null
      const price = bestPrice(pto, wtcs)
      const ranks = [pto && `PTO#${pto}`, wtcs && `WTCS#${wtcs}`].filter(Boolean).join(' / ') || 'sem rank → T$10'
      console.log(`    ${e.gender} ${e.name} (${e.country_code ?? '??'}) ${ranks} → T$${price}`)
    })
    console.log('\n🔍  DRY-RUN concluído. Rode sem --dry-run para aplicar.')
    return
  }

  // ── Step 5: Create new athletes ──────────────────────────────────────────────
  if (toCreate.length > 0) {
    console.log('\n🆕  Criando novos atletas...')
    for (const entry of toCreate) {
      const k = normKey(entry.name)
      const ptoRank  = ptoMap.get(k)  ?? null
      const wtcsRank = wtcsMap.get(k) ?? null
      const price = bestPrice(ptoRank, wtcsRank)
      const ranks = [ptoRank && `PTO#${ptoRank}`, wtcsRank && `WTCS#${wtcsRank}`].filter(Boolean).join(' / ') || 'sem rank'

      const { data: created, error } = await supabase
        .from('athletes')
        .upsert(
          {
            name: entry.name,
            gender: entry.gender,
            type: 'pro',
            country: entry.country,
            country_code: entry.country_code,
            current_price: price,
            pto_rank: ptoRank,
            wtcs_rank: wtcsRank,
          },
          { onConflict: 'name,gender,type' }
        )
        .select('id')
        .single()

      if (error || !created) {
        console.error(`  ✗ ${entry.name}: ${error?.message}`)
        continue
      }

      console.log(`  ✓ ${entry.gender} ${entry.name} (${entry.country_code ?? '??'}) ${ranks} → T$${price}`)
      toLink.push({ entry, athleteId: created.id, isNew: true })

      // Update dbByKey so duplicate entries within the same startlist don't re-create
      dbByKey.set(`${normKey(entry.name)}|${entry.gender}`, { id: created.id, current_price: price })
    }
  }

  // ── Step 6: Upsert race_athletes ─────────────────────────────────────────────
  console.log('\n🔗  Vinculando atletas à prova...')
  let linked = 0
  for (const { entry, athleteId } of toLink) {
    // For existing athletes: keep their current_price in race_athletes
    const dbA = dbById.get(athleteId)
    const price = dbA?.current_price ?? 10

    const { error } = await supabase
      .from('race_athletes')
      .upsert(
        { race_id: raceId, athlete_id: athleteId, price, bib: entry.bib ?? null },
        { onConflict: 'race_id,athlete_id' }
      )
    if (!error) linked++
  }
  console.log(`  ✅ ${linked} atletas vinculados à prova`)

  // ── Step 7: Photos for athletes without photo_url ────────────────────────────
  const needPhoto = toLink
    .map(({ athleteId }) => dbById.get(athleteId) ?? { id: athleteId, photo_url: null })
    .filter(a => !a.photo_url).length

  if (needPhoto > 0) {
    console.log(`\n📸  ${needPhoto} atleta(s) sem foto — rodando update-athlete-photos.mjs...`)
    try {
      execSync(
        `node "${resolve(__dir, 'update-athlete-photos.mjs')}"`,
        {
          env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY },
          stdio: 'inherit',
          timeout: 120000,
        }
      )
    } catch (e) {
      console.warn('  ⚠️  Busca de fotos retornou erro (não crítico). Tente manualmente:')
      console.warn('      node scripts/update-athlete-photos.mjs')
    }
  } else {
    console.log('\n📸  Todos os atletas já têm foto.')
  }

  // ── Summary ───────────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────')
  console.log(`✅  Startlist atualizada para: ${race.name}`)
  console.log(`    Existentes: ${toLink.filter(x => !x.isNew).length}`)
  console.log(`    Criados:    ${toCreate.length}`)
  console.log(`    Vinculados: ${linked}`)
  if (ambiguous.length > 0)
    console.log(`    ⚠️  Verifique os ${ambiguous.length} matches fuzzy acima — confirme que não são duplicatas`)
  console.log('\n→  Próximo passo: /admin/provas/<id>/startlist para revisar preços')
})()
