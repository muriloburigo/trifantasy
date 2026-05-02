#!/usr/bin/env node
/**
 * Trixer Marketing Agent — Estrategista de Negócio
 *
 * Especialidade: dados do app, funil de aquisição, performance de mercado.
 * NÃO publica no Instagram — gera briefs estratégicos para o social-media-agent executar.
 *
 * Parceria:
 *   marketing-agent → analisa dados e gera briefs
 *   social-media-agent → lê os briefs e publica
 *
 * Usage:
 *   node scripts/agents/marketing-agent.mjs --action=analyze [--report]
 *   node scripts/agents/marketing-agent.mjs --action=briefing
 *   node scripts/agents/marketing-agent.mjs --action=market-pulse
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ANTHROPIC_API_KEY
 *   GA4_PROPERTY_ID               (optional)
 *   GA4_SERVICE_ACCOUNT_KEY_JSON  (optional)
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { TRIATHLON_KNOWLEDGE } from './lib/triathlon-knowledge.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '../..')
const REPORTS   = path.join(ROOT, '.agent-reports')

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL    = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_KEY   = process.env.ANTHROPIC_API_KEY
const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID
const GA4_KEY_JSON    = process.env.GA4_SERVICE_ACCOUNT_KEY_JSON

const args    = process.argv.slice(2)
const getArg  = (name) => { const a = args.find(a => a.startsWith(`--${name}=`)); return a ? a.split('=').slice(1).join('=') : null }

const ACTION  = getArg('action') ?? 'analyze'
const DRY_RUN = args.includes('--dry-run')
const REPORT  = args.includes('--report')

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env vars'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

// ── Helpers ───────────────────────────────────────────────────────────────────

const log  = (...a) => console.log('[marketing]', ...a)
const warn = (...a) => console.warn('[marketing]', ...a)

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

function today() { return new Date().toISOString().slice(0, 10) }

function ensureReports() { mkdirSync(REPORTS, { recursive: true }) }

// ── Claude API ────────────────────────────────────────────────────────────────

async function callClaude(systemPrompt, userPrompt, maxTokens = 2048) {
  if (!ANTHROPIC_KEY) throw new Error('Missing ANTHROPIC_API_KEY')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: maxTokens, system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] }),
  })
  if (!res.ok) throw new Error(`Claude API error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.content[0].text
}

// ── Google Analytics 4 ────────────────────────────────────────────────────────

async function fetchGA4Metrics() {
  if (!GA4_PROPERTY_ID || !GA4_KEY_JSON) {
    warn('GA4 env vars not set — skipping analytics data')
    return null
  }

  let serviceAccount
  try { serviceAccount = JSON.parse(GA4_KEY_JSON) } catch {
    warn('Invalid GA4_SERVICE_ACCOUNT_KEY_JSON — skipping')
    return null
  }

  const jwtHeader  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const now        = Math.floor(Date.now() / 1000)
  const jwtPayload = Buffer.from(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600, iat: now,
  })).toString('base64url')

  const { createSign } = await import('crypto')
  const sign = createSign('RSA-SHA256')
  sign.write(`${jwtHeader}.${jwtPayload}`)
  sign.end()
  const jwt = `${jwtHeader}.${jwtPayload}.${sign.sign(serviceAccount.private_key, 'base64url')}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  })
  if (!tokenRes.ok) { warn('GA4 token error', await tokenRes.text()); return null }
  const { access_token } = await tokenRes.json()

  // Last 30d vs previous 30d (for trend)
  const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`
  const gaRes = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access_token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [
        { startDate: '30daysAgo', endDate: 'today' },
        { startDate: '60daysAgo', endDate: '31daysAgo' },
      ],
      metrics: [
        { name: 'activeUsers' }, { name: 'newUsers' }, { name: 'sessions' },
        { name: 'engagementRate' }, { name: 'averageSessionDuration' }, { name: 'screenPageViews' },
      ],
      dimensions: [{ name: 'dateRange' }],
    }),
  })
  if (!gaRes.ok) { warn('GA4 report error', await gaRes.text()); return null }
  const { rows } = await gaRes.json()

  const parse = (ri, mi) => Math.round(parseFloat(rows?.find(r => r.dimensionValues[0].value === `date_range_${ri}`)?.metricValues[mi]?.value ?? 0))
  const pct   = (now, prev) => prev > 0 ? `${((now - prev) / prev * 100).toFixed(1)}%` : 'N/A'

  const cur  = { users: parse(0,0), newUsers: parse(0,1), sessions: parse(0,2), engagement: parse(0,3), duration: parse(0,4), views: parse(0,5) }
  const prev = { users: parse(1,0), newUsers: parse(1,1), sessions: parse(1,2) }

  return { ...cur, trend: { users: pct(cur.users, prev.users), newUsers: pct(cur.newUsers, prev.newUsers), sessions: pct(cur.sessions, prev.sessions) } }
}

// ── Supabase data fetchers ────────────────────────────────────────────────────

async function fetchAppStats() {
  const [
    { count: totalUsers },
    { count: activePortfolios },
    { count: totalLeagues },
    { count: totalTrades },
    { count: activeLast7d },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('portfolio').select('user_id', { count: 'exact', head: true }),
    supabase.from('leagues').select('*', { count: 'exact', head: true }).eq('is_global', false),
    supabase.from('market_transactions').select('*', { count: 'exact', head: true }),
    supabase.from('market_transactions').select('user_id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
  ])

  return { totalUsers, activePortfolios, totalLeagues, totalTrades, activeLast7d }
}

async function fetchMarketData() {
  const { data: rising } = await supabase
    .from('athletes').select('name, country, current_price, price_change')
    .gt('price_change', 0).order('price_change', { ascending: false }).limit(5)

  const { data: falling } = await supabase
    .from('athletes').select('name, country, current_price, price_change')
    .lt('price_change', 0).order('price_change', { ascending: true }).limit(5)

  return { rising: rising ?? [], falling: falling ?? [] }
}

async function fetchUpcomingRaces(limit = 3) {
  const { data } = await supabase
    .from('races')
    .select('id, name, date, location, distance, status')
    .in('status', ['upcoming', 'open'])
    .order('date')
    .limit(limit)
  return data ?? []
}

async function fetchRecentResults(limit = 2) {
  const { data } = await supabase
    .from('races')
    .select('id, name, date, location, distance, results(pro_pos, athlete:athletes(name, country))')
    .eq('status', 'finished')
    .not('results', 'is', null)
    .order('date', { ascending: false })
    .limit(limit)
  return data ?? []
}

// ── Actions ───────────────────────────────────────────────────────────────────

async function actionAnalyze() {
  log('Fetching app stats + GA4 data...')
  const [stats, ga] = await Promise.all([fetchAppStats(), fetchGA4Metrics()])

  log('\n── APP STATS ─────────────────────────────────────')
  log(`Total users:       ${stats.totalUsers}`)
  log(`Active portfolios: ${stats.activePortfolios}`)
  log(`Private leagues:   ${stats.totalLeagues}`)
  log(`Total trades:      ${stats.totalTrades}`)
  log(`Active last 7d:    ${stats.activeLast7d} users`)

  const activationRate = stats.totalUsers > 0 ? ((stats.activePortfolios / stats.totalUsers) * 100).toFixed(1) : 0
  const engagementRate = stats.totalUsers > 0 ? ((stats.activeLast7d / stats.totalUsers) * 100).toFixed(1) : 0
  log(`Activation rate:   ${activationRate}% (registered → portfolio)`)
  log(`Engagement rate:   ${engagementRate}% (active last 7d)`)

  if (ga) {
    log('\n── GOOGLE ANALYTICS (last 30d vs prev 30d) ───────')
    log(`Active users:    ${ga.users} (${ga.trend.users})`)
    log(`New users:       ${ga.newUsers} (${ga.trend.newUsers})`)
    log(`Sessions:        ${ga.sessions} (${ga.trend.sessions})`)
    log(`Page views:      ${ga.views}`)
    log(`Avg. session:    ${ga.duration}s`)
  }

  if (REPORT) {
    const context = `Trixer — fantasy triathlon game — business metrics:

App (Supabase):
- Total registered users: ${stats.totalUsers}
- Users with active portfolio: ${stats.activePortfolios} (${activationRate}% activation)
- Private leagues: ${stats.totalLeagues}
- Total market trades: ${stats.totalTrades}
- Active last 7 days: ${stats.activeLast7d} users (${engagementRate}% engagement)
${ga ? `
Web Analytics (last 30d vs prior 30d):
- Active users: ${ga.users} (${ga.trend.users} vs prev)
- New users: ${ga.newUsers} (${ga.trend.newUsers} vs prev)
- Sessions: ${ga.sessions} (${ga.trend.sessions} vs prev)
- Page views: ${ga.views}
- Avg session duration: ${ga.duration}s
` : '(No GA4 data available)'}

Generate a strategic marketing analysis covering:
1. Business health diagnosis (strengths, risks, key bottleneck)
2. Top 3 content opportunities this week (data-backed, not generic)
3. One experiment recommendation to improve activation rate
4. KPIs to monitor over the next 30 days`

    const report = await callClaude(
      `You are a senior growth marketing analyst specializing in sports apps and fantasy games.
You have deep expertise in professional triathlon — the athletes, circuits, race calendar, and fan culture.
Be direct, data-driven, and specific. Respond in Brazilian Portuguese.

${TRIATHLON_KNOWLEDGE}`,
      context,
      2048
    )

    log('\n── REPORT ────────────────────────────────────────')
    console.log(report)

    if (!DRY_RUN) {
      ensureReports()
      const fname = `marketing-report-${today()}.md`
      writeFileSync(path.join(REPORTS, fname), `# Trixer Marketing Report — ${today()}\n\n${report}\n`)
      log(`\nSaved: .agent-reports/${fname}`)
    }
  }
}

async function actionMarketPulse() {
  log('Fetching market movements...')
  const { rising, falling } = await fetchMarketData()

  log('\n── MARKET PULSE ──────────────────────────────────')
  log('Rising:')
  rising.forEach(a => log(`  ${a.name} (${a.country?.toUpperCase()}) +T$${a.price_change} → T$${a.current_price}`))
  log('Falling:')
  falling.forEach(a => log(`  ${a.name} (${a.country?.toUpperCase()}) T$${a.price_change} → T$${a.current_price}`))
}

// ── Briefing — the handoff to social-media-agent ─────────────────────────────

async function actionBriefing() {
  log('Generating content briefing for social-media-agent...')

  const [stats, market, upcoming, recentRaces, ga] = await Promise.all([
    fetchAppStats(),
    fetchMarketData(),
    fetchUpcomingRaces(3),
    fetchRecentResults(2),
    fetchGA4Metrics(),
  ])

  const businessContext = `
Trixer app stats: ${stats.totalUsers} users, ${stats.activePortfolios} portfolios, ${stats.totalLeagues} leagues, ${stats.activeLast7d} active last 7d.
${ga ? `Web traffic: ${ga.users} active users in 30d (${ga.trend.users} trend), ${ga.sessions} sessions.` : ''}
Market leaders (rising): ${market.rising.slice(0,3).map(a => `${a.name} +T$${a.price_change}`).join(', ')}.
Market movers (falling): ${market.falling.slice(0,3).map(a => `${a.name} T$${a.price_change}`).join(', ')}.
Upcoming races: ${upcoming.map(r => `${r.name} on ${r.date}`).join('; ') || 'none scheduled'}.
Recent finished races: ${recentRaces.map(r => r.name).join(', ') || 'none'}.
`

  const briefPrompt = `Based on these Trixer business metrics, generate a content briefing JSON for the social media team.

${businessContext}

Return ONLY a valid JSON object (no markdown, no explanation) following this exact schema:
{
  "week_strategy": "1-2 sentences on the overall strategic angle this week",
  "opportunities": [
    {
      "id": "unique-slug",
      "action": "post-upcoming-race|post-market-update|post-race-recap|post-league-standings",
      "priority": "high|medium|low",
      "race_id": null,
      "angle": "the specific editorial angle / hook the social team should use",
      "data_highlight": "the single most important data point to feature",
      "recommended_day": "Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday",
      "recommended_time": "HH:MM",
      "why": "one sentence explaining the strategic reasoning"
    }
  ]
}

Include 3-5 opportunities, ranked by priority. Use race IDs from the real data when applicable (write null if unknown).

PRIORITY RULES (apply in this order):
1. CRITICAL (always high): Any upcoming race within 7 days — race week content is the highest-value content in triathlon fantasy. Post 4-7 days out, 2-3 days out, and race eve. Never skip this.
2. HIGH: Significant market movements (athlete up/down T$5+) tied to a real-world race result.
3. MEDIUM: General market update (weekly pulse, no specific race context).
4. LOW: League standings, unless there's a dramatic lead change.

ANTI-PATTERN: Do NOT prioritize past race recaps over upcoming race previews. What is coming always outweighs what already happened — this drives app opens and portfolio trades before the market closes.`

  const raw = await callClaude(
    `You are a senior marketing strategist with deep knowledge of professional triathlon — athletes, circuits, races, and fan culture. Return only valid JSON, no other text.

${TRIATHLON_KNOWLEDGE}`,
    briefPrompt,
    2048
  )

  let brief
  try {
    brief = JSON.parse(raw)
  } catch {
    // Try to extract JSON from the response if Claude added any surrounding text
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) { try { brief = JSON.parse(match[0]) } catch { brief = null } }
  }

  if (!brief) {
    log('Claude returned invalid JSON. Raw output:')
    console.log(raw)
    process.exit(1)
  }

  brief.generated_at = new Date().toISOString()
  brief.generated_by = 'marketing-agent'
  brief.date         = today()
  brief.executed     = false

  // Inject real race IDs — replace ANY non-UUID value (Claude sometimes generates slugs)
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const isRealUUID = (id) => id && UUID_RE.test(id)

  if (upcoming.length > 0 && brief.opportunities) {
    // Match each post-upcoming-race to the right upcoming race by name similarity
    brief.opportunities.forEach(op => {
      if (op.action !== 'post-upcoming-race') return
      if (isRealUUID(op.race_id)) return  // already a real UUID

      // Try to match by name keywords
      const angle = (op.angle + ' ' + op.data_highlight + ' ' + (op.race_id ?? '')).toLowerCase()
      const match = upcoming.find(r => {
        const words = r.name.toLowerCase().split(/\s+/)
        return words.some(w => w.length > 4 && angle.includes(w))
      })
      op.race_id = (match ?? upcoming[0]).id
    })
  }
  if (recentRaces.length > 0 && brief.opportunities) {
    brief.opportunities.forEach(op => {
      if (op.action !== 'post-race-recap') return
      if (isRealUUID(op.race_id)) return

      const angle = (op.angle + ' ' + op.data_highlight + ' ' + (op.race_id ?? '')).toLowerCase()
      const match = recentRaces.find(r => {
        const words = r.name.toLowerCase().split(/\s+/)
        return words.some(w => w.length > 4 && angle.includes(w))
      })
      op.race_id = (match ?? recentRaces[0]).id
    })
  }

  log('\n── BRIEFING ──────────────────────────────────────')
  log(`Week strategy: ${brief.week_strategy}`)
  log(`\nOpportunities (${brief.opportunities?.length ?? 0}):`)
  brief.opportunities?.forEach((op, i) => {
    log(`  ${i+1}. [${op.priority.toUpperCase()}] ${op.action} — "${op.angle}"`)
    log(`     Post: ${op.recommended_day} ${op.recommended_time} | Why: ${op.why}`)
  })

  if (!DRY_RUN) {
    ensureReports()
    const fname = `brief-${today()}.json`
    writeFileSync(path.join(REPORTS, fname), JSON.stringify(brief, null, 2))
    log(`\nBrief saved: .agent-reports/${fname}`)
    log(`Run: npm run social -- --action=execute-brief --brief=.agent-reports/${fname}`)
  } else {
    log('\n[dry-run] Brief not saved.')
    console.log(JSON.stringify(brief, null, 2))
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

const ACTIONS = {
  'analyze':      actionAnalyze,
  'market-pulse': actionMarketPulse,
  'briefing':     actionBriefing,
}

if (!ACTIONS[ACTION]) {
  console.error(`Unknown action: ${ACTION}`)
  console.error(`Available: ${Object.keys(ACTIONS).join(', ')}`)
  process.exit(1)
}

log(`Running action: ${ACTION}${DRY_RUN ? ' [dry-run]' : ''}`)
ACTIONS[ACTION]().catch(err => { console.error('[marketing] Fatal:', err.message); process.exit(1) })
