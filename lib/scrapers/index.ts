/**
 * Web scraper for triathlon startlists and results.
 * Supports: PTO (protriathletes.org), Ironman (ironman.com),
 * and any site that renders HTML tables or embeds JSON.
 */

export interface ScrapedAthlete {
  name: string
  gender: 'M' | 'F' | null
  country: string | null
  country_code: string | null
  bib: number | null
  division: string | null
  pto_rank: number | null
}

export interface ScrapedResult {
  name: string
  bib: number | null
  pro_pos: number | null
  swim_time: number | null
  t1_time: number | null
  bike_time: number | null
  t2_time: number | null
  run_time: number | null
  finish_time: number | null
  dnf: boolean
  dns: boolean
}

export interface ScrapeResponse {
  athletes?: ScrapedAthlete[]
  results?: ScrapedResult[]
  source: string
  raw_count: number
  error?: string
}

// ── Pricing helper (based on PTO rank, matches admin regras rules) ─────────
export function priceFromPtoRank(rank: number | null): number {
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

// ── ISO 3166-1 alpha-3 → alpha-2 mapping ─────────────────────────────────
const ISO3_TO_2: Record<string, string> = {
  BRA: 'BR', USA: 'US', DEU: 'DE', GER: 'DE', GBR: 'GB', AUS: 'AU',
  CHE: 'CH', SUI: 'CH', NZL: 'NZ', CAN: 'CA', FRA: 'FR', ESP: 'ES',
  ITA: 'IT', NLD: 'NL', NED: 'NL', NOR: 'NO', SWE: 'SE', DNK: 'DK',
  DEN: 'DK', JPN: 'JP', CHN: 'CN', ZAF: 'ZA', RSA: 'ZA', MEX: 'MX',
  ARG: 'AR', PRT: 'PT', POR: 'PT', BEL: 'BE', AUT: 'AT', POL: 'PL',
  ISR: 'IL', AZE: 'AZ', SVN: 'SI', SLO: 'SI', CZE: 'CZ', SVK: 'SK',
  HUN: 'HU', ROU: 'RO', BGR: 'BG', HRV: 'HR', CRO: 'HR', SRB: 'RS',
  GRC: 'GR', GRE: 'GR', TUR: 'TR', UKR: 'UA', RUS: 'RU', KAZ: 'KZ',
  TPE: 'TW', COL: 'CO', CHL: 'CL', PER: 'PE', URY: 'UY', VEN: 'VE',
  LUX: 'LU', DNF: '', DNS: '',
}

function normalizeCountryCode(code: string | null | undefined): string | null {
  if (!code) return null
  const upper = code.trim().toUpperCase()
  if (upper.length === 2) return upper
  if (upper.length === 3) return ISO3_TO_2[upper] ?? null
  return null
}

function normalizeGender(val: any): 'M' | 'F' | null {
  const s = String(val ?? '').toUpperCase().trim()
  if (['M', 'MALE', 'MEN', 'MPRO', 'MASCULINO', 'HOMME'].some(v => s === v || s.startsWith(v + '_'))) return 'M'
  if (['F', 'FEMALE', 'FPRO', 'WOMEN', 'WOMAN', 'W', 'FEMININO', 'FEMME'].some(v => s === v || s.startsWith(v + '_'))) return 'F'
  return null
}

export function parseTime(val: any): number | null {
  if (val === null || val === undefined || val === '') return null
  if (typeof val === 'number') return val > 0 ? Math.round(val) : null
  const str = String(val).trim()
  if (!str || ['--', 'DNF', 'DNS', 'N/A', '-'].includes(str.toUpperCase())) return null
  // Strip any non time chars (keep digits and colon)
  const cleaned = str.replace(/[^0-9:]/g, '')
  if (!cleaned) return null
  const parts = cleaned.split(':').map(Number)
  if (parts.some(isNaN)) return null
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] > 0 ? parts[0] : null
}

function normalizeName(raw: string): string {
  return raw
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

function extractName(obj: any): string {
  // Direct name fields
  for (const key of ['fullName', 'full_name', 'name', 'athleteName', 'athlete_name']) {
    if (typeof obj?.[key] === 'string' && obj[key].trim().length > 1) return obj[key].trim()
  }
  // first + last
  const first = obj?.firstName ?? obj?.first_name ?? obj?.givenName ?? ''
  const last  = obj?.lastName  ?? obj?.last_name  ?? obj?.familyName ?? obj?.surname ?? ''
  if (first || last) return `${first} ${last}`.trim()
  // nested athlete object
  if (obj?.athlete) return extractName(obj.athlete)
  return ''
}

function isAthleteObject(obj: any): boolean {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false
  return extractName(obj).length > 2
}

function isResultObject(obj: any): boolean {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false
  const hasName = extractName(obj).length > 2
  const hasPos  = obj.position != null || obj.rank != null || obj.pos != null ||
                  obj.pro_pos != null || obj.finishPosition != null || obj.overallPosition != null
  const hasTime = obj.finishTime != null || obj.finish_time != null || obj.totalTime != null ||
                  obj.swimTime != null || obj.swim_time != null || obj.dnf != null
  return hasName && (hasPos || hasTime)
}

// Recursively collect all arrays in a JSON object, deduplicated by reference
function collectArrays(obj: any, seen = new Set<any>(), depth = 0): any[][] {
  if (depth > 9 || obj === null || obj === undefined) return []
  if (typeof obj !== 'object') return []
  if (seen.has(obj)) return []
  seen.add(obj)

  if (Array.isArray(obj)) {
    const nested: any[][] = [obj]
    for (const item of obj.slice(0, 3)) {
      nested.push(...collectArrays(item, seen, depth + 1))
    }
    return nested
  }

  const results: any[][] = []
  for (const val of Object.values(obj)) {
    results.push(...collectArrays(val, seen, depth + 1))
  }
  return results
}

function normalizeAthletes(raw: any[]): ScrapedAthlete[] {
  return raw
    .map(obj => {
      const nested = obj?.athlete ?? obj
      const name = extractName(obj)
      if (!name) return null

      const genderRaw = obj?.gender ?? obj?.sex ?? obj?.division ?? nested?.gender ?? nested?.sex
      const gender = normalizeGender(genderRaw)

      const division = String(
        obj?.division ?? obj?.category ?? obj?.class ?? obj?.divisionName ?? ''
      ).trim() || null

      const countryRaw = nested?.countryCode ?? nested?.country_code ?? obj?.countryCode ??
                         obj?.country_code ?? nested?.country ?? obj?.country ?? null

      const country_code = normalizeCountryCode(typeof countryRaw === 'string' ? countryRaw : null)
      const country = typeof (nested?.country ?? obj?.country) === 'string'
        ? (nested?.country ?? obj?.country)
        : null

      const bibRaw = obj?.bib ?? obj?.bibNumber ?? obj?.bib_number
      const bib = bibRaw != null && !isNaN(Number(bibRaw)) ? Number(bibRaw) : null

      const rankRaw = nested?.ptoWorldRanking ?? nested?.pto_rank ?? nested?.ptoRank ??
                      nested?.worldRanking ?? obj?.pto_rank ?? null
      const pto_rank = rankRaw != null && Number(rankRaw) > 0 ? Number(rankRaw) : null

      return { name: normalizeName(name), gender, country, country_code, bib, division, pto_rank }
    })
    .filter((a): a is ScrapedAthlete => !!a && a.name.length > 2)
}

function normalizeResults(raw: any[]): ScrapedResult[] {
  return raw
    .map(obj => {
      const name = extractName(obj)
      if (!name) return null

      const bibRaw = obj?.bib ?? obj?.bibNumber
      const bib = bibRaw != null && !isNaN(Number(bibRaw)) ? Number(bibRaw) : null

      const posRaw = obj?.position ?? obj?.rank ?? obj?.pos ?? obj?.pro_pos ??
                     obj?.finishPosition ?? obj?.overallPosition ?? obj?.proPos
      const pro_pos = posRaw != null && Number(posRaw) > 0 ? Number(posRaw) : null

      const status = String(obj?.status ?? obj?.raceStatus ?? obj?.finishStatus ?? '').toUpperCase()
      const dnf = !!(obj?.dnf || obj?.DNF || status === 'DNF' || status.includes('NOT FINISH'))
      const dns = !!(obj?.dns || obj?.DNS || status === 'DNS' || status.includes('NOT START'))

      return {
        name: normalizeName(name),
        bib,
        pro_pos,
        swim_time:   parseTime(obj?.swimTime   ?? obj?.swim_time   ?? obj?.swim),
        t1_time:     parseTime(obj?.t1Time      ?? obj?.t1_time     ?? obj?.t1),
        bike_time:   parseTime(obj?.bikeTime    ?? obj?.bike_time   ?? obj?.bike   ?? obj?.cycleTime),
        t2_time:     parseTime(obj?.t2Time      ?? obj?.t2_time     ?? obj?.t2),
        run_time:    parseTime(obj?.runTime     ?? obj?.run_time    ?? obj?.run),
        finish_time: parseTime(obj?.finishTime  ?? obj?.finish_time ?? obj?.totalTime ?? obj?.elapsed),
        dnf,
        dns,
      }
    })
    .filter((r): r is ScrapedResult => !!r && r.name.length > 2)
}

// Parse HTML tables into row objects keyed by column header
function parseHtmlTables(html: string): any[] {
  const tableRegex = /<table[\s\S]*?<\/table>/gi
  const rows: any[] = []

  for (const tableMatch of html.matchAll(tableRegex)) {
    const table = tableMatch[0]
    const headers: string[] = []
    for (const th of table.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)) {
      headers.push(th[1].replace(/<[^>]+>/g, '').trim().toLowerCase())
    }
    if (!headers.some(h => h.includes('name') || h.includes('athlete') || h.includes('atleta'))) continue

    for (const tr of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells: string[] = []
      for (const td of tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)) {
        cells.push(td[1].replace(/<[^>]+>/g, '').trim())
      }
      if (cells.length < 2) continue
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => { if (cells[i] !== undefined) obj[h] = cells[i] })
      if (Object.keys(obj).length > 0) rows.push(obj)
    }
  }
  return rows
}

// ── Main entry point ────────────────────────────────────────────────────────
export async function scrapeUrl(url: string, type: 'startlist' | 'results'): Promise<ScrapeResponse> {
  let html: string
  let detectedSource = 'desconhecido'

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/json,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.7,pt;q=0.5',
      },
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok) {
      return { source: 'erro HTTP', raw_count: 0, error: `HTTP ${res.status} — ${res.statusText}` }
    }

    const ct = res.headers.get('content-type') ?? ''

    // Direct JSON response
    if (ct.includes('application/json') || ct.includes('text/json')) {
      const data = await res.json()
      const raw: any[] = Array.isArray(data)
        ? data
        : (Object.values(data).find(v => Array.isArray(v)) as any[] ?? [])
      if (type === 'startlist') {
        const athletes = normalizeAthletes(raw)
        return { athletes, source: 'JSON direto', raw_count: athletes.length }
      }
      const results = normalizeResults(raw)
      return { results, source: 'JSON direto', raw_count: results.length }
    }

    html = await res.text()
  } catch (err: any) {
    return { source: 'erro', raw_count: 0, error: err.message ?? 'Falha ao buscar URL' }
  }

  // Detect source from URL/HTML
  if (url.includes('protriathletes.org') || url.includes('ptoworld.com')) detectedSource = 'PTO'
  else if (url.includes('ironman.com') || url.includes('competitor.com')) detectedSource = 'Ironman'
  else if (url.includes('triathlon.org')) detectedSource = 'World Triathlon'

  // Strategy 1: __NEXT_DATA__ (Next.js SSR — PTO, many modern sites)
  const nextDataMatch = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/)
  if (nextDataMatch) {
    try {
      const nextData = JSON.parse(nextDataMatch[1])
      const allArrays = collectArrays(nextData)
      const checker = type === 'startlist' ? isAthleteObject : isResultObject
      const matching = allArrays
        .filter(arr => arr.length > 0 && checker(arr[0]))
        .sort((a, b) => b.length - a.length)

      if (matching.length > 0) {
        const raw = matching[0]
        if (type === 'startlist') {
          const athletes = normalizeAthletes(raw)
          if (athletes.length > 0) return { athletes, source: detectedSource || 'Next.js (__NEXT_DATA__)', raw_count: athletes.length }
        } else {
          const results = normalizeResults(raw)
          if (results.length > 0) return { results, source: detectedSource || 'Next.js (__NEXT_DATA__)', raw_count: results.length }
        }
      }
    } catch { /* continue */ }
  }

  // Strategy 2: scan all <script> tags for JSON arrays
  for (const scriptMatch of html.matchAll(/<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(scriptMatch[1])
      const allArrays = collectArrays(data)
      const checker = type === 'startlist' ? isAthleteObject : isResultObject
      const matching = allArrays.filter(arr => arr.length > 0 && checker(arr[0])).sort((a, b) => b.length - a.length)
      if (matching.length > 0) {
        const raw = matching[0]
        if (type === 'startlist') {
          const athletes = normalizeAthletes(raw)
          if (athletes.length > 0) return { athletes, source: 'JSON embutido', raw_count: athletes.length }
        } else {
          const results = normalizeResults(raw)
          if (results.length > 0) return { results, source: 'JSON embutido', raw_count: results.length }
        }
      }
    } catch { /* continue */ }
  }

  // Strategy 3: find JSON arrays inside regular script blocks
  for (const scriptMatch of html.matchAll(/<script(?!\s+type=["'](?:text\/css|application\/ld))[^>]*>([\s\S]*?)<\/script>/gi)) {
    const content = scriptMatch[1]
    if (!content.includes('"name"') && !content.includes('"firstName"') && !content.includes('"athlete"')) continue
    for (const arrMatch of content.matchAll(/(\[[\s\S]{50,10000}\])/g)) {
      try {
        const parsed = JSON.parse(arrMatch[1])
        if (!Array.isArray(parsed) || parsed.length < 2) continue
        const checker = type === 'startlist' ? isAthleteObject : isResultObject
        if (!checker(parsed[0])) continue
        if (type === 'startlist') {
          const athletes = normalizeAthletes(parsed)
          if (athletes.length > 0) return { athletes, source: 'JavaScript embutido', raw_count: athletes.length }
        } else {
          const results = normalizeResults(parsed)
          if (results.length > 0) return { results, source: 'JavaScript embutido', raw_count: results.length }
        }
      } catch { /* continue */ }
    }
  }

  // Strategy 4: HTML table parsing (timing sites, older sites)
  const tableRows = parseHtmlTables(html)
  if (tableRows.length > 0) {
    if (type === 'startlist') {
      const athletes = normalizeAthletes(tableRows)
      if (athletes.length > 0) return { athletes, source: 'Tabela HTML', raw_count: athletes.length }
    } else {
      const results = normalizeResults(tableRows)
      if (results.length > 0) return { results, source: 'Tabela HTML', raw_count: results.length }
    }
  }

  return {
    source: 'não encontrado',
    raw_count: 0,
    error: 'Não foi possível extrair dados desta URL. O site pode renderizar o conteúdo via JavaScript (SPA). Tente a importação JSON manual, ou verifique se a URL aponta para uma página de startlist/resultados.',
  }
}
