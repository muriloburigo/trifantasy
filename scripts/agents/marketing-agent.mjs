#!/usr/bin/env node
/**
 * Trixer Marketing Agent
 *
 * Executa ações de marketing de forma autônoma:
 * 1. Busca dados reais do Supabase (atletas, provas, mercado)
 * 2. Busca métricas do Google Analytics (usuários, sessões, engagement)
 * 3. Gera copy + legenda para Instagram usando Claude API
 * 4. Publica no Instagram via Graph API (imagem + legenda)
 *
 * Usage:
 *   node scripts/agents/marketing-agent.mjs --action=post-race-recap --race-id=<uuid>
 *   node scripts/agents/marketing-agent.mjs --action=post-market-update
 *   node scripts/agents/marketing-agent.mjs --action=post-upcoming-race --race-id=<uuid>
 *   node scripts/agents/marketing-agent.mjs --action=post-league-standings --league-id=<uuid>
 *   node scripts/agents/marketing-agent.mjs --action=analyze --report
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   INSTAGRAM_BUSINESS_ACCOUNT_ID
 *   INSTAGRAM_ACCESS_TOKEN
 *   ANTHROPIC_API_KEY
 *   GA4_PROPERTY_ID               (ex: 123456789)
 *   GA4_SERVICE_ACCOUNT_KEY_JSON  (JSON string of service account credentials)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY
const IG_ACCOUNT_ID     = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
const IG_TOKEN          = process.env.INSTAGRAM_ACCESS_TOKEN
const ANTHROPIC_KEY     = process.env.ANTHROPIC_API_KEY
const GA4_PROPERTY_ID   = process.env.GA4_PROPERTY_ID
const GA4_KEY_JSON      = process.env.GA4_SERVICE_ACCOUNT_KEY_JSON

const args = process.argv.slice(2)
const getArg = (name) => { const a = args.find(a => a.startsWith(`--${name}=`)); return a ? a.split('=')[1] : null }

const ACTION    = getArg('action')   ?? 'analyze'
const RACE_ID   = getArg('race-id')
const LEAGUE_ID = getArg('league-id')
const DRY_RUN   = args.includes('--dry-run')
const REPORT    = args.includes('--report')
const LANG      = getArg('lang') ?? 'pt'   // pt | en | es

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env vars'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

// ── Helpers ───────────────────────────────────────────────────────────────────

const log  = (...a) => console.log('[marketing]', ...a)
const warn = (...a) => console.warn('[marketing]', ...a)

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Claude API ────────────────────────────────────────────────────────────────

async function callClaude(systemPrompt, userPrompt) {
  if (!ANTHROPIC_KEY) throw new Error('Missing ANTHROPIC_API_KEY')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })
  if (!res.ok) throw new Error(`Claude API error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.content[0].text
}

// ── Google Analytics 4 ────────────────────────────────────────────────────────

async function fetchGA4Metrics() {
  if (!GA4_PROPERTY_ID || !GA4_KEY_JSON) {
    warn('GA4 env vars not set, skipping analytics data')
    return null
  }

  // Use Google Analytics Data API via REST with service account JWT
  // The service account must have "Viewer" role on the GA4 property
  let serviceAccount
  try { serviceAccount = JSON.parse(GA4_KEY_JSON) } catch {
    warn('Invalid GA4_SERVICE_ACCOUNT_KEY_JSON — skipping')
    return null
  }

  // Build JWT for service account auth
  const jwtHeader  = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const now        = Math.floor(Date.now() / 1000)
  const jwtPayload = Buffer.from(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  })).toString('base64url')

  // Sign with RS256 — requires Node.js crypto (built-in)
  const { createSign } = await import('crypto')
  const sign = createSign('RSA-SHA256')
  sign.write(`${jwtHeader}.${jwtPayload}`)
  sign.end()
  const signature = sign.sign(serviceAccount.private_key, 'base64url')
  const jwt = `${jwtHeader}.${jwtPayload}.${signature}`

  // Exchange JWT for access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!tokenRes.ok) { warn('GA4 token error', await tokenRes.text()); return null }
  const { access_token } = await tokenRes.json()

  // Query GA4 — last 30 days
  const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`
  const gaRes = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access_token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'sessions' },
        { name: 'engagementRate' },
        { name: 'averageSessionDuration' },
        { name: 'screenPageViews' },
      ],
      dimensions: [{ name: 'date' }],
      orderBys: [{ dimension: { orderType: 'ALPHANUMERIC', dimensionName: 'date' } }],
    }),
  })
  if (!gaRes.ok) { warn('GA4 report error', await gaRes.text()); return null }
  const gaData = await gaRes.json()

  // Summarize: totals + last 7 days trend
  const rows = gaData.rows ?? []
  const totals = rows.reduce((acc, row) => {
    row.metricValues.forEach((v, i) => { acc[i] = (acc[i] ?? 0) + parseFloat(v.value) })
    return acc
  }, {})
  const last7  = rows.slice(-7)
  const avgEngagement = last7.length
    ? (last7.reduce((s, r) => s + parseFloat(r.metricValues[3].value), 0) / last7.length * 100).toFixed(1)
    : null

  return {
    activeUsers30d:    Math.round(totals[0] ?? 0),
    newUsers30d:       Math.round(totals[1] ?? 0),
    sessions30d:       Math.round(totals[2] ?? 0),
    avgEngagement7d:   avgEngagement ? `${avgEngagement}%` : 'N/A',
    avgSessionDuration: totals[4] ? `${Math.round(totals[4] / (rows.length || 1))}s` : 'N/A',
    pageViews30d:      Math.round(totals[5] ?? 0),
  }
}

// ── Supabase data fetchers ────────────────────────────────────────────────────

async function fetchRaceData(raceId) {
  const { data: race } = await supabase.from('races').select('*').eq('id', raceId).single()
  if (!race) throw new Error(`Race not found: ${raceId}`)

  const { data: results } = await supabase
    .from('results')
    .select('pro_pos, finish_time, athlete:athletes(name, country, current_price, price_change, photo_url)')
    .eq('race_id', raceId)
    .not('pro_pos', 'is', null)
    .lte('pro_pos', 5)
    .order('pro_pos')

  return { race, results: results ?? [] }
}

async function fetchMarketData() {
  const { data: rising } = await supabase
    .from('athletes')
    .select('name, country, current_price, price_change')
    .gt('price_change', 0)
    .order('price_change', { ascending: false })
    .limit(5)

  const { data: falling } = await supabase
    .from('athletes')
    .select('name, country, current_price, price_change')
    .lt('price_change', 0)
    .order('price_change', { ascending: true })
    .limit(5)

  return { rising: rising ?? [], falling: falling ?? [] }
}

async function fetchUpcomingRace(raceId) {
  const query = supabase
    .from('races')
    .select('id, name, date, location, distance, race_athletes(athlete:athletes(name, country, current_price, pto_rank))')
    .in('status', ['upcoming', 'open'])

  if (raceId) { query.eq('id', raceId) } else { query.order('date').limit(1) }
  const { data } = await raceId
    ? supabase.from('races').select('id, name, date, location, distance, race_athletes(athlete:athletes(name, country, current_price, pto_rank))').eq('id', raceId).single()
    : supabase.from('races').select('id, name, date, location, distance, race_athletes(athlete:athletes(name, country, current_price, pto_rank))').in('status', ['upcoming', 'open']).order('date').limit(1).maybeSingle()

  return data
}

async function fetchLeagueStandings(leagueId) {
  const { data: league } = await supabase.from('leagues').select('*').eq('id', leagueId).single()
  if (!league) throw new Error(`League not found: ${leagueId}`)

  const { data: members } = await supabase.from('league_members').select('user_id').eq('league_id', leagueId)
  const memberIds = (members ?? []).map(m => m.user_id)
  if (!memberIds.length) return { league, standings: [] }

  const [{ data: profiles }, { data: portfolios }] = await Promise.all([
    supabase.from('profiles').select('id, name').in('id', memberIds),
    supabase.from('portfolio').select('user_id, athlete:athletes(current_price)').in('user_id', memberIds),
  ])

  const athletesByUser = {}
  for (const p of portfolios ?? []) {
    athletesByUser[p.user_id] = (athletesByUser[p.user_id] ?? 0) + Number(p.athlete?.current_price ?? 0)
  }

  const standings = (profiles ?? [])
    .map(p => ({ name: p.name ?? 'Trixer', total: Math.round((p.wallet ?? 0) + (athletesByUser[p.id] ?? 0)) }))
    .sort((a, b) => b.total - a.total)
    .map((s, i) => ({ ...s, position: i + 1 }))

  return { league, standings }
}

async function fetchAppStats() {
  const [
    { count: totalUsers },
    { count: activePortfolios },
    { count: totalLeagues },
    { count: totalTrades },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('portfolio').select('user_id', { count: 'exact', head: true }),
    supabase.from('leagues').select('*', { count: 'exact', head: true }).eq('is_global', false),
    supabase.from('market_transactions').select('*', { count: 'exact', head: true }),
  ])

  return { totalUsers, activePortfolios, totalLeagues, totalTrades }
}

// ── Instagram Graph API ───────────────────────────────────────────────────────

async function igPost({ imageUrl, caption }) {
  if (!IG_ACCOUNT_ID || !IG_TOKEN) throw new Error('Missing Instagram env vars')

  log('Creating IG media container...')
  const createRes = await fetch(
    `https://graph.facebook.com/v20.0/${IG_ACCOUNT_ID}/media`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: IG_TOKEN,
      }),
    }
  )
  if (!createRes.ok) throw new Error(`IG create container error: ${await createRes.text()}`)
  const { id: containerId } = await createRes.json()
  log(`Container created: ${containerId}`)

  // Wait for container to be ready
  let status = 'IN_PROGRESS'
  let attempts = 0
  while (status === 'IN_PROGRESS' && attempts < 15) {
    await sleep(3000)
    const statusRes = await fetch(
      `https://graph.facebook.com/v20.0/${containerId}?fields=status_code&access_token=${IG_TOKEN}`
    )
    const s = await statusRes.json()
    status = s.status_code ?? 'ERROR'
    attempts++
    log(`Container status: ${status} (attempt ${attempts})`)
  }

  if (status !== 'FINISHED') throw new Error(`IG container not ready: ${status}`)

  log('Publishing post...')
  const publishRes = await fetch(
    `https://graph.facebook.com/v20.0/${IG_ACCOUNT_ID}/media_publish`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ creation_id: containerId, access_token: IG_TOKEN }),
    }
  )
  if (!publishRes.ok) throw new Error(`IG publish error: ${await publishRes.text()}`)
  const { id: postId } = await publishRes.json()
  log(`✓ Posted to Instagram: https://www.instagram.com/p/${postId}`)
  return postId
}

// The Instagram Graph API requires a publicly accessible image URL.
// We generate a card image via the /api/og or by hosting on Supabase Storage.
// For now we accept an explicit --image-url flag or a hosted card URL.
async function resolveImageUrl(action, data) {
  const imageUrl = getArg('image-url')
  if (imageUrl) return imageUrl

  // Fallback: use the app's OG image as a shareable image
  // In production, you'd call the /share page, screenshot it, upload to Supabase Storage
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.trixer.app'
  return `${siteUrl}/opengraph-image`
}

// ── Copy generation ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Você é o social media manager do Trixer, o fantasy game do triathlon profissional mundial.
Escreve legendas para Instagram que são:
- Curtas, diretas, com energia de esporte de alto rendimento
- Em português brasileiro informal, sem ser gírias forçadas
- Sempre incluem 1-2 emojis relevantes no início
- Terminam com um CTA claro (ex: "Monta seu elenco em trixer.app")
- Incluem 5-8 hashtags relevantes no final (triathlon, triatlon, ironman, t100, fantasygame, trixer, etc)
- Tom: apaixonado por triathlon, insider do esporte, não corporativo
Retorne APENAS a legenda, sem explicações.`

async function generateCaption(context) {
  return callClaude(SYSTEM_PROMPT, context)
}

// ── Actions ───────────────────────────────────────────────────────────────────

async function actionPostRaceRecap() {
  if (!RACE_ID) { console.error('--race-id required'); process.exit(1) }
  const { race, results } = await fetchRaceData(RACE_ID)
  const podium = results.slice(0, 3).map((r, i) => `${i + 1}º ${r.athlete?.name} (${r.athlete?.country?.toUpperCase()})`)

  const context = `Resultado da prova: ${race.name} (${fmtDate(race.date)})
Local: ${race.location}
Distância: ${race.distance}
Pódio:
${podium.join('\n')}
Contexto: o Trixer é um fantasy game onde usuários montam elencos de atletas PRO do triathlon e ganham pontos com os resultados reais das provas.`

  const caption = await generateCaption(context)
  const imageUrl = await resolveImageUrl('race-recap', { race, results })

  log('\n── CAPTION ──────────────────────────────────────')
  console.log(caption)
  log('── IMAGE URL ────────────────────────────────────')
  log(imageUrl)

  if (!DRY_RUN) {
    const postId = await igPost({ imageUrl, caption })
    log('Done:', postId)
  } else {
    log('[dry-run] Would post to Instagram')
  }
}

async function actionPostMarketUpdate() {
  const { rising, falling } = await fetchMarketData()
  const risingList  = rising.map(a => `${a.name} +T$${a.price_change}`).join(', ')
  const fallingList = falling.map(a => `${a.name} ${a.price_change}`).join(', ')

  const context = `Movimentação do mercado Trixer:
Em alta: ${risingList}
Em queda: ${fallingList}
O mercado Trixer reflete o desempenho real dos atletas PRO de triathlon. Preços sobem ou caem após cada prova.`

  const caption = await generateCaption(context)
  const imageUrl = await resolveImageUrl('market', { rising, falling })

  log('\n── CAPTION ──────────────────────────────────────')
  console.log(caption)
  if (!DRY_RUN) await igPost({ imageUrl, caption })
  else log('[dry-run] Would post to Instagram')
}

async function actionPostUpcomingRace() {
  const race = await fetchUpcomingRace(RACE_ID)
  if (!race) { console.error('No upcoming race found'); process.exit(1) }

  const today = new Date()
  const raceDate = new Date(race.date)
  const daysUntil = Math.round((raceDate - today) / 86400000)
  const favorites = (race.race_athletes ?? [])
    .map(ra => ra.athlete)
    .filter(a => a?.name)
    .sort((a, b) => (a.pto_rank ?? 999) - (b.pto_rank ?? 999))
    .slice(0, 5)
    .map(a => `${a.name} (T$${a.current_price})`)

  const context = `Próxima prova: ${race.name}
Data: ${fmtDate(race.date)} (${daysUntil} dias)
Local: ${race.location}
Distância: ${race.distance}
Favoritos do mercado Trixer: ${favorites.join(', ')}
Monte seu elenco antes do mercado fechar (24h antes da prova)!`

  const caption = await generateCaption(context)
  const imageUrl = await resolveImageUrl('race-preview', { race })

  log('\n── CAPTION ──────────────────────────────────────')
  console.log(caption)
  if (!DRY_RUN) await igPost({ imageUrl, caption })
  else log('[dry-run] Would post to Instagram')
}

async function actionPostLeagueStandings() {
  if (!LEAGUE_ID) { console.error('--league-id required'); process.exit(1) }
  const { league, standings } = await fetchLeagueStandings(LEAGUE_ID)
  const top3 = standings.slice(0, 3).map(s => `${s.position}º ${s.name} — T$${s.total}`)

  const context = `Classificação da liga "${league.name}" no Trixer:
${top3.join('\n')}
${standings.length} participantes disputando o título.`

  const caption = await generateCaption(context)
  const imageUrl = await resolveImageUrl('league-standings', { league, standings })

  log('\n── CAPTION ──────────────────────────────────────')
  console.log(caption)
  if (!DRY_RUN) await igPost({ imageUrl, caption })
  else log('[dry-run] Would post to Instagram')
}

async function actionAnalyze() {
  log('Fetching app stats + GA4 data...')
  const [stats, ga] = await Promise.all([fetchAppStats(), fetchGA4Metrics()])

  log('\n── APP STATS ────────────────────────────────────')
  log(`Total users:       ${stats.totalUsers}`)
  log(`Active portfolios: ${stats.activePortfolios}`)
  log(`Private leagues:   ${stats.totalLeagues}`)
  log(`Total trades:      ${stats.totalTrades}`)

  if (ga) {
    log('\n── GOOGLE ANALYTICS (last 30 days) ──────────────')
    log(`Active users:    ${ga.activeUsers30d}`)
    log(`New users:       ${ga.newUsers30d}`)
    log(`Sessions:        ${ga.sessions30d}`)
    log(`Engagement rate: ${ga.avgEngagement7d}`)
    log(`Avg. session:    ${ga.avgSessionDuration}`)
    log(`Page views:      ${ga.pageViews30d}`)
  }

  if (REPORT) {
    const context = `Dados do Trixer — fantasy game de triathlon:
App:
- Usuários cadastrados: ${stats.totalUsers}
- Portfolios ativos: ${stats.activePortfolios}
- Ligas privadas: ${stats.totalLeagues}
- Total de trades: ${stats.totalTrades}
${ga ? `
Google Analytics (30 dias):
- Usuários ativos: ${ga.activeUsers30d}
- Novos usuários: ${ga.newUsers30d}
- Sessões: ${ga.sessions30d}
- Taxa de engajamento: ${ga.avgEngagement7d}
- Duração média de sessão: ${ga.avgSessionDuration}
- Page views: ${ga.pageViews30d}
` : ''}

Com base nesses dados, gere um relatório de marketing com:
1. Avaliação do estado atual (pontos fortes e fracos)
2. 3 conteúdos prioritários para Instagram esta semana (tema + ângulo)
3. 2 sugestões de melhorias para aumentar engajamento orgânico
4. Calendário editorial para os próximos 7 dias alinhado ao calendário de provas`

    const report = await callClaude(
      'Você é um analista de marketing especializado em apps esportivos e fantasy games. Responda em português brasileiro.',
      context
    )
    log('\n── RELATÓRIO ─────────────────────────────────────')
    console.log(report)

    if (!DRY_RUN) {
      const outPath = path.join(ROOT, '.agent-reports')
      mkdirSync(outPath, { recursive: true })
      const fname = `marketing-report-${new Date().toISOString().slice(0, 10)}.md`
      writeFileSync(path.join(outPath, fname), report)
      log(`\nReport saved: .agent-reports/${fname}`)
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

const ACTIONS = {
  'post-race-recap':       actionPostRaceRecap,
  'post-market-update':    actionPostMarketUpdate,
  'post-upcoming-race':    actionPostUpcomingRace,
  'post-league-standings': actionPostLeagueStandings,
  'analyze':               actionAnalyze,
}

if (!ACTIONS[ACTION]) {
  console.error(`Unknown action: ${ACTION}`)
  console.error(`Available: ${Object.keys(ACTIONS).join(', ')}`)
  process.exit(1)
}

log(`Running action: ${ACTION}${DRY_RUN ? ' [dry-run]' : ''}`)
ACTIONS[ACTION]().catch(err => { console.error('[marketing] Fatal:', err.message); process.exit(1) })
