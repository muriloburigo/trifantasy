#!/usr/bin/env node
/**
 * Trixer Growth Agent
 *
 * Executa análises e ações de crescimento de forma autônoma:
 * 1. Analisa funil (cadastro → portfolio → liga → retenção)
 * 2. Identifica usuários inativos e dispara push de reativação
 * 3. Detecta provas com mercado aberto mas sem engajamento e notifica
 * 4. Gera relatório de growth com sugestões priorizadas
 * 5. Analisa ligas para identificar virais (alta densidade de convites)
 *
 * Usage:
 *   node scripts/agents/growth-agent.mjs --action=report
 *   node scripts/agents/growth-agent.mjs --action=reactivate-push [--dry-run]
 *   node scripts/agents/growth-agent.mjs --action=race-engagement-push --race-id=<uuid> [--dry-run]
 *   node scripts/agents/growth-agent.mjs --action=funnel
 *   node scripts/agents/growth-agent.mjs --action=league-virality
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ANTHROPIC_API_KEY
 *   GA4_PROPERTY_ID               (optional — enriches report)
 *   GA4_SERVICE_ACCOUNT_KEY_JSON  (optional — JSON string of service account)
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY
 *   VAPID_PRIVATE_KEY
 *   VAPID_EMAIL
 */

import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'
import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL    = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_KEY   = process.env.ANTHROPIC_API_KEY
const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID
const GA4_KEY_JSON    = process.env.GA4_SERVICE_ACCOUNT_KEY_JSON

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env vars'); process.exit(1) }

const args = process.argv.slice(2)
const getArg = (name) => { const a = args.find(a => a.startsWith(`--${name}=`)); return a ? a.split('=')[1] : null }

const ACTION  = getArg('action') ?? 'report'
const RACE_ID = getArg('race-id')
const DRY_RUN = args.includes('--dry-run')
const LIMIT   = parseInt(getArg('limit') ?? '50', 10)

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

// Configure web push if vars available
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? 'contato@trixer.app'}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const log  = (...a) => console.log('[growth]', ...a)
const warn = (...a) => console.warn('[growth]', ...a)

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

function daysAgo(n) {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString()
}

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
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
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`)
  return (await res.json()).content[0].text
}

// ── Google Analytics 4 ────────────────────────────────────────────────────────

async function fetchGA4() {
  if (!GA4_PROPERTY_ID || !GA4_KEY_JSON) return null
  let sa
  try { sa = JSON.parse(GA4_KEY_JSON) } catch { return null }

  const { createSign } = await import('crypto')
  const now = Math.floor(Date.now() / 1000)
  const hdr = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const pay = Buffer.from(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600, iat: now,
  })).toString('base64url')
  const sign = createSign('RSA-SHA256')
  sign.write(`${hdr}.${pay}`); sign.end()
  const jwt = `${hdr}.${pay}.${sign.sign(sa.private_key, 'base64url')}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  })
  if (!tokenRes.ok) return null
  const { access_token } = await tokenRes.json()

  const [overviewRes, pageRes, acquisitionRes] = await Promise.all([
    // Overview: 30d vs prev 30d
    fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${access_token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [
          { startDate: '30daysAgo', endDate: 'today', name: 'current' },
          { startDate: '60daysAgo', endDate: '31daysAgo', name: 'previous' },
        ],
        metrics: [
          { name: 'activeUsers' }, { name: 'newUsers' }, { name: 'sessions' },
          { name: 'engagementRate' }, { name: 'bounceRate' }, { name: 'averageSessionDuration' },
        ],
      }),
    }),
    // Top pages
    fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${access_token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'averageSessionDuration' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      }),
    }),
    // Acquisition channels
    fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${access_token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }, { name: 'newUsers' }, { name: 'engagementRate' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 8,
      }),
    }),
  ])

  const overview     = await overviewRes.json()
  const pages        = await pageRes.json()
  const acquisition  = await acquisitionRes.json()

  const cur  = overview.rows?.[0]?.metricValues ?? []
  const prev = overview.rows?.[1]?.metricValues ?? []
  const pct  = (c, p) => p && parseFloat(p.value) > 0
    ? `${((parseFloat(c.value) - parseFloat(p.value)) / parseFloat(p.value) * 100).toFixed(1)}%`
    : 'N/A'

  return {
    overview: {
      activeUsers:   { current: Math.round(cur[0]?.value ?? 0), growth: pct(cur[0] ?? {}, prev[0] ?? {}) },
      newUsers:      { current: Math.round(cur[1]?.value ?? 0), growth: pct(cur[1] ?? {}, prev[1] ?? {}) },
      sessions:      { current: Math.round(cur[2]?.value ?? 0), growth: pct(cur[2] ?? {}, prev[2] ?? {}) },
      engagementRate: `${(parseFloat(cur[3]?.value ?? 0) * 100).toFixed(1)}%`,
      bounceRate:     `${(parseFloat(cur[4]?.value ?? 0) * 100).toFixed(1)}%`,
      avgSession:     `${Math.round(parseFloat(cur[5]?.value ?? 0))}s`,
    },
    topPages: (pages.rows ?? []).map(r => ({
      page: r.dimensionValues[0].value,
      views: parseInt(r.metricValues[0].value),
      users: parseInt(r.metricValues[1].value),
    })),
    acquisition: (acquisition.rows ?? []).map(r => ({
      channel: r.dimensionValues[0].value,
      sessions: parseInt(r.metricValues[0].value),
      newUsers: parseInt(r.metricValues[1].value),
      engagement: `${(parseFloat(r.metricValues[2].value) * 100).toFixed(1)}%`,
    })),
  }
}

// ── Push notifications ────────────────────────────────────────────────────────

async function sendPush(userId, payload) {
  // Check dedup
  const type   = payload.type ?? 'growth_reactivation'
  const ref_id = payload.ref_id ?? 'none'
  const { error: dedupErr } = await supabase
    .from('push_notification_log')
    .insert({ user_id: userId, type, ref_id })
  if (dedupErr?.code === '23505') { return { skipped: true } }

  // Get subscriptions
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (!subs?.length) return { skipped: true }

  let sent = 0
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title: payload.title, body: payload.body, url: payload.url ?? '/' })
      )
      sent++
    } catch (err) {
      if (err.statusCode === 410) {
        // Subscription expired — clean up
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      }
    }
  }
  return { sent }
}

// ── Funnel analysis ───────────────────────────────────────────────────────────

async function fetchFunnel() {
  const [
    { count: totalRegistered },
    { count: withPortfolio },
    { count: withTrade },
    { count: inLeague },
    { count: withPush },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('portfolio').select('user_id', { count: 'exact', head: true }),
    supabase.from('market_transactions').select('user_id', { count: 'exact', head: true }),
    supabase.from('league_members').select('user_id', { count: 'exact', head: true }),
    supabase.from('push_subscriptions').select('user_id', { count: 'exact', head: true }),
  ])

  // Retention: users who logged in (had transactions) in last 7/14/30 days
  const [{ count: active7d }, { count: active30d }] = await Promise.all([
    supabase.from('market_transactions').select('user_id', { count: 'exact', head: true }).gte('created_at', daysAgo(7)),
    supabase.from('market_transactions').select('user_id', { count: 'exact', head: true }).gte('created_at', daysAgo(30)),
  ])

  const r = totalRegistered ?? 0
  const pct = (n) => r > 0 ? `${((n ?? 0) / r * 100).toFixed(1)}%` : '0%'

  return {
    registered:    r,
    withPortfolio: { count: withPortfolio, pct: pct(withPortfolio) },
    withTrade:     { count: withTrade,     pct: pct(withTrade) },
    inLeague:      { count: inLeague,      pct: pct(inLeague) },
    withPush:      { count: withPush,      pct: pct(withPush) },
    active7d:      { count: active7d,      pct: pct(active7d) },
    active30d:     { count: active30d,     pct: pct(active30d) },
  }
}

// ── Actions ───────────────────────────────────────────────────────────────────

async function actionFunnel() {
  log('Fetching funnel data...')
  const funnel = await fetchFunnel()

  log('\n── CONVERSION FUNNEL ────────────────────────────')
  log(`Registered:         ${funnel.registered}`)
  log(`With portfolio:     ${funnel.withPortfolio.count} (${funnel.withPortfolio.pct})`)
  log(`Made a trade:       ${funnel.withTrade.count} (${funnel.withTrade.pct})`)
  log(`In a league:        ${funnel.inLeague.count} (${funnel.inLeague.pct})`)
  log(`Push enabled:       ${funnel.withPush.count} (${funnel.withPush.pct})`)
  log(`Active last 7d:     ${funnel.active7d.count} (${funnel.active7d.pct})`)
  log(`Active last 30d:    ${funnel.active30d.count} (${funnel.active30d.pct})`)

  // Identify biggest drop-off
  const steps = [
    ['Registered → Portfolio', funnel.registered, funnel.withPortfolio.count],
    ['Portfolio → Trade',      funnel.withPortfolio.count, funnel.withTrade.count],
    ['Trade → League',         funnel.withTrade.count, funnel.inLeague.count],
  ]
  log('\n── DROP-OFFS ────────────────────────────────────')
  for (const [label, from, to] of steps) {
    const drop = from > 0 ? (((from - to) / from) * 100).toFixed(1) : '0'
    log(`${label}: -${drop}% drop`)
  }
}

async function actionReactivatePush() {
  log('Finding inactive users with push subscriptions...')

  // Users inactive for >14 days but have push subscriptions
  const { data: recentActive } = await supabase
    .from('market_transactions')
    .select('user_id')
    .gte('created_at', daysAgo(14))
  const recentIds = new Set((recentActive ?? []).map(r => r.user_id))

  const { data: pushUsers } = await supabase
    .from('push_subscriptions')
    .select('user_id')
    .limit(LIMIT * 3)  // over-fetch to account for recently active
  const candidates = [...new Set((pushUsers ?? []).map(r => r.user_id))]
    .filter(id => !recentIds.has(id))
    .slice(0, LIMIT)

  log(`Found ${candidates.length} inactive users with push`)

  // Find next upcoming race for CTA
  const { data: nextRace } = await supabase
    .from('races')
    .select('name, date')
    .in('status', ['upcoming', 'open'])
    .order('date')
    .limit(1)
    .maybeSingle()

  const raceCta = nextRace
    ? `${nextRace.name} (${fmtDate(nextRace.date)}) está chegando — monte seu elenco!`
    : 'O mercado está movimentado — veja os atletas em alta!'

  let sent = 0, skipped = 0
  for (const userId of candidates) {
    if (DRY_RUN) { log(`[dry-run] Would push to user ${userId.slice(0, 8)}...`); skipped++; continue }
    const result = await sendPush(userId, {
      type: 'growth_reactivation',
      ref_id: new Date().toISOString().slice(0, 10),
      title: '⚡ Trixer te espera!',
      body: raceCta,
      url: '/home',
    })
    if (result.skipped) skipped++
    else sent += result.sent ?? 0
    await sleep(100) // rate limit
  }

  log(`\nDone: ${sent} push sent, ${skipped} skipped (dedup or no sub)`)
}

async function actionRaceEngagementPush() {
  if (!RACE_ID) { console.error('--race-id required'); process.exit(1) }

  const { data: race } = await supabase.from('races').select('name, date, status').eq('id', RACE_ID).single()
  if (!race) { console.error('Race not found'); process.exit(1) }

  // Users with push but no portfolio interaction for this race window
  const { data: raceAthletes } = await supabase
    .from('race_athletes')
    .select('athlete_id')
    .eq('race_id', RACE_ID)
  const athleteIds = (raceAthletes ?? []).map(r => r.athlete_id)

  // Who already has a race athlete in their portfolio?
  const { data: engaged } = await supabase
    .from('portfolio')
    .select('user_id')
    .in('athlete_id', athleteIds)
  const engagedIds = new Set((engaged ?? []).map(r => r.user_id))

  // Push users not yet engaged
  const { data: allPush } = await supabase.from('push_subscriptions').select('user_id').limit(500)
  const targets = [...new Set((allPush ?? []).map(r => r.user_id))]
    .filter(id => !engagedIds.has(id))
    .slice(0, LIMIT)

  log(`Race: ${race.name} | ${targets.length} users to notify (not yet engaged)`)

  let sent = 0, skipped = 0
  for (const userId of targets) {
    if (DRY_RUN) { log(`[dry-run] Would push to ${userId.slice(0, 8)}...`); skipped++; continue }
    const result = await sendPush(userId, {
      type: 'race_engagement',
      ref_id: RACE_ID,
      title: `🏁 ${race.name} está chegando!`,
      body: `Mercado aberto — monte seu elenco PRO antes de fechar. Faltam ${Math.max(0, Math.round((new Date(race.date) - new Date()) / 86400000))} dias!`,
      url: '/home',
    })
    if (result.skipped) skipped++
    else sent += result.sent ?? 0
    await sleep(100)
  }

  log(`Done: ${sent} push sent, ${skipped} skipped`)
}

async function actionLeagueVirality() {
  log('Analyzing league virality...')

  const { data: leagues } = await supabase
    .from('leagues')
    .select('id, name, owner_id, created_at')
    .eq('is_global', false)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!leagues?.length) { log('No private leagues found'); return }

  const results = []
  for (const league of leagues) {
    const { count: memberCount } = await supabase
      .from('league_members')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', league.id)

    results.push({ name: league.name, members: memberCount ?? 0, created: league.created_at.slice(0, 10) })
  }

  results.sort((a, b) => b.members - a.members)

  log('\n── LEAGUE VIRALITY ──────────────────────────────')
  log(`Total private leagues: ${results.length}`)
  log(`Avg members/league: ${(results.reduce((s, l) => s + l.members, 0) / results.length).toFixed(1)}`)
  log(`\nTop leagues by size:`)
  results.slice(0, 10).forEach((l, i) => log(`  ${i + 1}. ${l.name} — ${l.members} members (created ${l.created})`))

  const viral = results.filter(l => l.members >= 5)
  log(`\nViral leagues (≥5 members): ${viral.length} (${(viral.length / results.length * 100).toFixed(1)}% of total)`)
}

async function actionReport() {
  log('Generating growth report...')
  const [funnel, ga] = await Promise.all([fetchFunnel(), fetchGA4()])

  // Print funnel
  await actionFunnel()

  if (!ANTHROPIC_KEY) { log('\nNo ANTHROPIC_API_KEY — skipping AI analysis'); return }

  const context = `Dados do Trixer — fantasy game de triathlon profissional:

FUNIL DE CONVERSÃO:
- Usuários registrados: ${funnel.registered}
- Com portfolio ativo: ${funnel.withPortfolio.count} (${funnel.withPortfolio.pct})
- Fizeram ao menos 1 trade: ${funnel.withTrade.count} (${funnel.withTrade.pct})
- Participam de liga: ${funnel.inLeague.count} (${funnel.inLeague.pct})
- Push notifications ativas: ${funnel.withPush.count} (${funnel.withPush.pct})
- Ativos últimos 7 dias: ${funnel.active7d.count} (${funnel.active7d.pct})
- Ativos últimos 30 dias: ${funnel.active30d.count} (${funnel.active30d.pct})

${ga ? `GOOGLE ANALYTICS (últimos 30 dias):
- Usuários ativos: ${ga.overview.activeUsers.current} (${ga.overview.activeUsers.growth} vs período anterior)
- Novos usuários: ${ga.overview.newUsers.current} (${ga.overview.newUsers.growth})
- Sessões: ${ga.overview.sessions.current} (${ga.overview.sessions.growth})
- Taxa de engajamento: ${ga.overview.engagementRate}
- Taxa de rejeição: ${ga.overview.bounceRate}
- Duração média de sessão: ${ga.overview.avgSession}

PÁGINAS MAIS VISITADAS:
${ga.topPages.slice(0, 5).map(p => `  ${p.page}: ${p.views} views (${p.users} usuários)`).join('\n')}

CANAIS DE AQUISIÇÃO:
${ga.acquisition.slice(0, 5).map(a => `  ${a.channel}: ${a.sessions} sessões, ${a.newUsers} novos (eng: ${a.engagement})`).join('\n')}
` : 'Google Analytics: não configurado\n'}

Produto: triathlon fantasy game, usuário monta elenco de atletas PRO com T$100, ganha pontos com resultados reais de provas Ironman/T100/WTCS.`

  const report = await callClaude(
    `Você é um analista de growth especializado em apps de games/esportes.
Responda em português brasileiro. Seja direto, prático e priorize quick wins.`,
    `${context}

Com base nesses dados, gere um relatório de growth com:

1. **Diagnóstico** (2-3 frases): qual é o maior gargalo agora?

2. **Top 3 experimentos prioritários** (ordenados por impacto/esforço):
   - O que testar
   - Hipótese de impacto
   - Como medir sucesso

3. **Ações imediatas** (podem ser executadas esta semana):
   - Push notifications: quando e para quem disparar
   - Mudanças de produto simples
   - Ações de comunidade/rede

4. **Métricas a acompanhar** (máximo 5 KPIs críticos):
   - Métrica
   - Benchmark atual
   - Meta em 30 dias

5. **Oportunidade de canal não explorada** baseada nos dados de aquisição`
  )

  log('\n── RELATÓRIO DE GROWTH ──────────────────────────')
  console.log(report)

  if (!DRY_RUN) {
    const outPath = path.join(ROOT, '.agent-reports')
    mkdirSync(outPath, { recursive: true })
    const fname = `growth-report-${new Date().toISOString().slice(0, 10)}.md`
    writeFileSync(path.join(outPath, fname), report)
    log(`\nReport saved: .agent-reports/${fname}`)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

const ACTIONS = {
  'report':                actionReport,
  'funnel':                actionFunnel,
  'reactivate-push':       actionReactivatePush,
  'race-engagement-push':  actionRaceEngagementPush,
  'league-virality':       actionLeagueVirality,
}

if (!ACTIONS[ACTION]) {
  console.error(`Unknown action: ${ACTION}`)
  console.error(`Available: ${Object.keys(ACTIONS).join(', ')}`)
  process.exit(1)
}

log(`Running action: ${ACTION}${DRY_RUN ? ' [dry-run]' : ''}`)
ACTIONS[ACTION]().catch(err => { console.error('[growth] Fatal:', err.message); process.exit(1) })
