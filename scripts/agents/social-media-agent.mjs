#!/usr/bin/env node
/**
 * Trixer Social Media Agent — Especialista em Canal Instagram
 *
 * Especialidade: engajamento, timing, formato de conteúdo e publicação.
 * Sabe DECIDIR o que postar, QUANDO postar e COMO escrever para o público de triathlon.
 * Trabalha em parceria com o marketing-agent, que gera os briefs estratégicos.
 *
 * Parceria:
 *   marketing-agent → analisa o negócio, identifica oportunidades, salva brief
 *   social-media-agent → decide o que engaja, cria o conteúdo, publica
 *
 * Usage:
 *   node scripts/agents/social-media-agent.mjs --action=auto              # decide e posta autonomamente
 *   node scripts/agents/social-media-agent.mjs --action=execute-brief --brief=.agent-reports/brief-YYYY-MM-DD.json
 *   node scripts/agents/social-media-agent.mjs --action=post-upcoming-race [--race-id=<uuid>]
 *   node scripts/agents/social-media-agent.mjs --action=post-market-update
 *   node scripts/agents/social-media-agent.mjs --action=post-race-recap --race-id=<uuid>
 *   node scripts/agents/social-media-agent.mjs --action=post-league-standings --league-id=<uuid>
 *   node scripts/agents/social-media-agent.mjs --action=engagement-report
 *   node scripts/agents/social-media-agent.mjs --action=content-calendar
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   MAKE_WEBHOOK_URL
 *   ANTHROPIC_API_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { TRIATHLON_KNOWLEDGE } from './lib/triathlon-knowledge.mjs'
import { resolveImage } from './designer-agent.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '../..')
const REPORTS   = path.join(ROOT, '.agent-reports')
const POST_LOG  = path.join(REPORTS, 'post-log.json')

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY
const MAKE_WEBHOOK   = process.env.MAKE_WEBHOOK_URL
const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY

const args    = process.argv.slice(2)
const getArg  = (name) => { const a = args.find(a => a.startsWith(`--${name}=`)); return a ? a.split('=').slice(1).join('=') : null }

const ACTION    = getArg('action') ?? 'auto'
const RACE_ID   = getArg('race-id')
const LEAGUE_ID = getArg('league-id')
const BRIEF_PATH = getArg('brief')
const DRY_RUN   = args.includes('--dry-run')

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env vars'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

// ── Helpers ───────────────────────────────────────────────────────────────────

const log  = (...a) => console.log('[social]', ...a)
const warn = (...a) => console.warn('[social]', ...a)

function today() { return new Date().toISOString().slice(0, 10) }
function ensureReports() { mkdirSync(REPORTS, { recursive: true }) }

function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Post Log (tracks what was posted for engagement analysis) ─────────────────

function readPostLog() {
  if (!existsSync(POST_LOG)) return []
  try { return JSON.parse(readFileSync(POST_LOG, 'utf8')) } catch { return [] }
}

function writePostLog(entry) {
  ensureReports()
  const log = readPostLog()
  log.push({ ...entry, timestamp: new Date().toISOString() })
  writeFileSync(POST_LOG, JSON.stringify(log, null, 2))
}

// ── Claude API ────────────────────────────────────────────────────────────────

async function callClaude(systemPrompt, userPrompt, maxTokens = 1024) {
  if (!ANTHROPIC_KEY) throw new Error('Missing ANTHROPIC_API_KEY')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: maxTokens, system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] }),
  })
  if (!res.ok) throw new Error(`Claude API error: ${res.status} ${await res.text()}`)
  return (await res.json()).content[0].text
}

// ── Instagram Voice & Caption Engine ─────────────────────────────────────────
// Full system prompt — tone, vocabulary, rules, hashtags

const POST_PLANNER_SYSTEM = `You are a senior Instagram strategist for Trixer — the fantasy game for professional triathlon. You have 8+ years managing high-performance sports accounts. You plan every post with surgical precision: the right hook, the right format, the right visual, the right timing.

Your job: plan the ENTIRE post — caption + visual brief. The designer only executes. You own the strategy.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCT CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Trixer is a fantasy game where users build a T$100 roster of PRO triathlon athletes. Athletes gain/lose T$ value based on real IRONMAN, T100, and WTCS race results. Users compete in leagues, score points from real podiums.

Audience: competitive triathletes, fans of Lucy Charles, Jan Frodeno, Chelsea Sodaro. They train at 5am, know what a brick session is, debate Kona course records. They are NOT casual fitness followers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INSTAGRAM ALGORITHM — WHAT ACTUALLY WORKS IN 2024–25
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SAVES > SHARES > COMMENTS > LIKES. Optimize in that order.
- Posts that get saved: bold predictions, data tables, "who to pick" lists, hot takes with reasoning
- Posts that get shared: results people want to brag about, controversial takes, athlete rankings
- Comments trigger: open-ended questions, "who do you have?", polarizing picks
- Reach boost: post when audience is active (6–8am, 12–1pm, 6–8pm local time)
- Carousel > single image for saves and reach (algorithm shows multiple frames)
- Strong first frame = hook that forces a tap or swipe

CAPTION ANATOMY (proven structure):
1. HOOK (line 1–2): Bold statement, hot take, surprising data point, or question. Under 125 chars — this is what shows before "more". No emojis on the first word unless it adds energy.
2. BODY (3–8 lines): Context, insight, data. Short paragraphs. White space between ideas. Lists beat prose for scannability.
3. OPINION / ANGLE: Take a position. "Lucy is the pick" beats "Lucy could win". Confidence = credibility.
4. CTA (1 line): Specific action. "Lock your squad → trixer.app" or "Who are you starting? Drop it below 👇"
5. HASHTAGS (8–10, after line break): Mix broad + niche. Don't pad.

HOOK FORMULAS THAT WORK:
- Contrarian: "Everyone is picking [X]. They're wrong."
- Data drop: "[Athlete] just ran 2:51 off a 4:45 swim. That's a T$7 jump waiting to happen."
- Urgency: "Market closes in 6 hours. Here's the only move that matters."
- List tease: "5 athletes worth T$30+ who are flying under the radar right now 👇"
- Question: "Who wins when Lucy, Chelsea, and Anne all start on form?"
- Announcement: "[Race] is 48 hours away. Here's the lineup that matters."

WHAT KILLS ENGAGEMENT:
- Starting with the brand name
- Adjective-heavy copy ("incredible", "amazing", "awesome")
- Generic CTAs ("check the link in bio")
- Passive voice
- Long paragraphs — walls of text get scrolled past
- More than 3 emojis in the body
- Hashtags inside the body text (always at the end)
- Posting the same visual concept twice in a row

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT FORMATS & WHEN TO USE THEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RACE PREVIEW (2–3 days before race):
- Lead with the market angle: who is mispriced, who is the obvious pick, who is the hidden value
- Name 3–5 athletes with T$ values and a one-line take on each
- End with urgency: market closes before gun fires
- Best engagement window: Thursday/Friday for Sunday races

RACE RECAP (within 24h of results):
- Lead with the winner and the upset (if any)
- Show market impact: who gained T$, who tanked
- One sentence on the decisive moment (run split, penalty, mechanical)
- Quick question for engagement: "Did you have them in your squad?"

MARKET UPDATE (weekly):
- "Movers" format: biggest gainers and losers with reason
- Context: is this a trend or a one-race spike?
- Forward-looking: who is set up well for next race?

ATHLETE SPOTLIGHT:
- One athlete, one narrative arc (comeback, dominance, underdog)
- Specific data: career PBs, recent split, price trajectory
- Make the Trixer angle clear: current T$ value and whether it's fair

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VOICE & TONE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Insider, not broadcaster. You talk to triathletes, not about them.
- Opinionated. Make picks, defend them. Hedge = boring.
- Data-first. "She ran 2:51 off the bike" beats "she had an amazing run"
- Punchy. Fragments are fine. Long sentences are not.
- First names for known athletes: Lucy, Jan, Chelsea, Daniela, Blu, Anne, Patrick, Sam, Gustav, Alistair
- Respectful but never sycophantic — no "incredible athlete" fluff
- CRITICAL: T$ is fictional in-game currency only. Never imply financial advice.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VISUAL BRIEF — YOUR CREATIVE DIRECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Choose one mode:

CARD_ART — branded data card (race lineup, market movers, podium recap)
Use when: you have structured race/market data to show. Looks professional, builds brand.
→ Specify card_type: race-preview | market-update | race-recap

PHOTO — editorial image (emotion, story, context)
Use when: narrative > data. Athlete focus, motivational, community angle.
→ Specify: gender, phase, AND a cinematographic photo_description

PHOTO DESCRIPTION — think like a sports photographer:
- ALWAYS: "professional triathlete" or "elite triathlete" — never amateur
- Describe the shot: subject, moment, environment, emotion
- Good: "elite male triathlete powering through the final km of a run course, race number visible, crowd lining both sides, golden hour light"
- Bad: "triathlon run photo"
- Vary the moment: podium, bike descent, pre-race focus, transition chaos, finish-line collapse, pack swim
- Match caption emotion: urgency → sprint finish; reflection → lone athlete at dawn; rivalry → two athletes side by side
- NEVER use swim exit / ocean exit — most overused shot in triathlon photography

MODE DECISION:
- Race preview + athlete data → CARD_ART (race-preview)
- Market update → CARD_ART (market-update)
- Race recap + results → CARD_ART (race-recap)
- Race preview with NO data / editorial / athlete story → PHOTO
- Never repeat the same visual concept as the last post

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HASHTAG STRATEGY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Always pick 8–10. Mix tiers for max reach:
Tier 1 (broad reach): #triathlon #ironman #swimbikerun #triathlete
Tier 2 (mid-niche): #t100triathlon #ptotriathlon #ironmantri #triathlonlife #endurancesports #70point3 #ironmanworld
Tier 3 (brand/niche): #triathlonfantasy #trixer #fantasygame #collinscup #ptorankings #konadream #triathlonpro
Race-specific when applicable: #ironman703 #kona #collinscut #t100london

LANGUAGE: English only.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return ONLY valid JSON — no markdown, no explanation, no preamble:
{
  "caption": "the full Instagram caption including hashtags",
  "visual": {
    "mode": "CARD_ART | PHOTO",
    "card_type": "race-preview | market-update | race-recap | null",
    "race_id": "uuid or null",
    "photo_gender": "women | men | mixed | null",
    "photo_phase": "swim | bike | run | finish | transition | null",
    "photo_description": "cinematographic description of exact image needed, or null",
    "rationale": "one sentence: why this visual serves this caption"
  }
}

${TRIATHLON_KNOWLEDGE}`

async function planPost(context) {
  const rejectionReason = process.env._REJECTION_REASON ?? ''
  const hooks = recentHooks(6)
  const hooksContext = hooks.length > 0
    ? `\n\nRECENT HOOKS USED (DO NOT REPEAT these opening lines — vary your approach):\n${hooks.map((h, i) => `${i+1}. "${h}"`).join('\n')}`
    : ''
  const fullContext = rejectionReason
    ? `${context}${hooksContext}\n\n⚠️ PREVIOUS ATTEMPT REJECTED BY EDITOR: "${rejectionReason}"\nYou MUST fix this issue in your new plan. Pay special attention to the visual brief — correct the exact problem described above.`
    : `${context}${hooksContext}`
  const raw = await callClaude(POST_PLANNER_SYSTEM, fullContext, 1500)
  try {
    const m = raw.match(/\{[\s\S]*\}/)
    if (m) return JSON.parse(m[0])
  } catch {}
  // Fallback: try to extract caption at minimum
  log('⚠️  Post planner returned invalid JSON — using raw as caption')
  return { caption: raw, visual: { mode: 'CARD_ART', card_type: 'market-update', race_id: null } }
}

// ── Image: social executes its own visual brief via designer ─────────────────

function recentlyUsedUrls(n = 8) {
  return readPostLog().slice(-n).map(p => p.image_url).filter(Boolean)
}

function recentHooks(n = 6) {
  return readPostLog().slice(-n).map(p => p.hook).filter(Boolean)
}

async function executeVisualBrief(visual) {
  // Explicit --image-url always wins
  const manual = getArg('image-url')
  if (manual) { log(`Using manual image-url`); return manual }

  const excludeUrls = recentlyUsedUrls(8)
  log(`Visual brief: mode=${visual.mode} ${visual.card_type ?? ''} ${visual.photo_gender ?? ''} ${visual.photo_phase ?? ''}`)
  log(`Rationale: ${visual.rationale}`)

  // CARD ART: social decided it wants a branded card
  if (visual.mode === 'CARD_ART') {
    const result = await resolveImage({
      action: cardTypeToAction(visual.card_type),
      raceId: visual.race_id,
      // Fallback phase if card art fails — avoid swim by default
      phaseOverride: cardTypeToFallbackPhase(visual.card_type),
      context: visual.photo_description ?? '',
      excludeUrls,
    })
    log(`Designer → ${result.description}`)
    return result.url
  }

  // PHOTO: social described exactly what it wants — designer searches for it
  if (visual.mode === 'PHOTO') {
    const result = await resolveImage({
      context: visual.photo_description ?? '',
      action: '',
      genderOverride: visual.photo_gender,
      phaseOverride: visual.photo_phase,
      excludeUrls,
    })
    log(`Designer → ${result.description}`)
    return result.url
  }

  // Fallback
  const result = await resolveImage({ excludeUrls })
  return result.url
}

function cardTypeToAction(cardType) {
  const map = {
    'race-preview':   'post-upcoming-race',
    'market-update':  'post-market-update',
    'race-recap':     'post-race-recap',
  }
  return map[cardType] ?? 'post-market-update'
}

// Fallback photo phase when card art fails — never default to swim
function cardTypeToFallbackPhase(cardType) {
  const map = {
    'race-preview':  'run',    // anticipation = athletes running hard
    'race-recap':    'finish', // recap = finish line celebration
    'market-update': 'bike',   // market = power/momentum
  }
  return map[cardType] ?? 'run'
}

// ── Make.com → Instagram ──────────────────────────────────────────────────────

async function igPost({ imageUrl, caption, context }) {
  if (!MAKE_WEBHOOK) throw new Error('Missing MAKE_WEBHOOK_URL env var')

  log('Sending to Make.com...')
  const res = await fetch(MAKE_WEBHOOK, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ caption, image_url: imageUrl }),
  })

  const rawBody = await res.text()
  if (!res.ok) throw new Error(`Make.com error ${res.status}: ${rawBody}`)

  let data = {}
  try { data = JSON.parse(rawBody) } catch {}

  log(`Make.com response: ${res.status} — ${rawBody.slice(0, 200)}`)

  // Make.com instant webhooks return {"status":"accepted"} (async processing)
  // Make.com response webhooks return the actual scenario result synchronously.
  // If we get "accepted", we can't confirm Instagram publication — log a warning.
  const accepted = rawBody.includes('accepted') || rawBody === '1' || rawBody === 'Accepted'
  if (accepted) {
    log('⚠️  Make.com accepted webhook (async) — Instagram result not confirmed')
  } else {
    log('✓ Make.com returned synchronous response — post likely published')
  }
  console.log(`MAKE_STATUS=${accepted ? 'async' : 'sync'} MAKE_BODY=${rawBody.slice(0, 100)}`)

  // Log the post for engagement analysis
  const hook = caption.split('\n').find(l => l.trim().length > 0)?.trim() ?? ''
  writePostLog({
    action: context.action,
    race_id: context.race_id ?? null,
    image_url: imageUrl,
    caption_preview: caption.slice(0, 100),
    hook,
    day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    hour: new Date().getHours(),
  })

  return data
}

// ── Supabase data fetchers ────────────────────────────────────────────────────

async function fetchRaceData(raceId) {
  const { data: race } = await supabase.from('races').select('*').eq('id', raceId).single()
  if (!race) throw new Error(`Race not found: ${raceId}`)

  const { data: results } = await supabase
    .from('results')
    .select('pro_pos, finish_time, athlete:athletes(name, country, gender, current_price, price_change, photo_url)')
    .eq('race_id', raceId).not('pro_pos', 'is', null).lte('pro_pos', 5).order('pro_pos')

  return { race, results: results ?? [] }
}

async function fetchMarketData() {
  const [{ data: rising }, { data: falling }] = await Promise.all([
    supabase.from('athletes').select('name, country, gender, current_price, price_change')
      .gt('price_change', 0).order('price_change', { ascending: false }).limit(5),
    supabase.from('athletes').select('name, country, gender, current_price, price_change')
      .lt('price_change', 0).order('price_change', { ascending: true }).limit(5),
  ])
  return { rising: rising ?? [], falling: falling ?? [] }
}

/** Deriva gênero dominante de uma lista de atletas com campo gender ('M'/'F') */
function dominantGender(athletes = []) {
  const f = athletes.filter(a => a.gender === 'F').length
  const m = athletes.filter(a => a.gender === 'M').length
  if (f > m) return 'women'
  if (m > f) return 'men'
  return 'mixed'
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function fetchUpcomingRace(raceId) {
  // Only query by ID if it looks like a real UUID — avoid slug lookups that always fail
  if (raceId && UUID_RE.test(raceId)) {
    const { data } = await supabase
      .from('races').select('id, name, date, location, distance, race_athletes(athlete:athletes(name, country, gender, current_price, pto_rank))').eq('id', raceId).single()
    if (data) return data
    warn(`Race ${raceId} not found, falling back to next upcoming race`)
  }
  // Fallback: next upcoming race by date
  const { data } = await supabase
    .from('races').select('id, name, date, location, distance, race_athletes(athlete:athletes(name, country, gender, current_price, pto_rank))')
    .in('status', ['upcoming', 'open']).order('date').limit(1).maybeSingle()
  return data
}

async function fetchLeagueStandings(leagueId) {
  const { data: league } = await supabase.from('leagues').select('*').eq('id', leagueId).single()
  if (!league) throw new Error(`League not found: ${leagueId}`)

  const { data: members } = await supabase.from('league_members').select('user_id').eq('league_id', leagueId)
  const ids = (members ?? []).map(m => m.user_id)
  if (!ids.length) return { league, standings: [] }

  const [{ data: profiles }, { data: portfolios }] = await Promise.all([
    supabase.from('profiles').select('id, name').in('id', ids),
    supabase.from('portfolio').select('user_id, athlete:athletes(current_price)').in('user_id', ids),
  ])

  const totals = {}
  for (const p of portfolios ?? []) {
    totals[p.user_id] = (totals[p.user_id] ?? 0) + Number(p.athlete?.current_price ?? 0)
  }

  const standings = (profiles ?? [])
    .map(p => ({ name: p.name ?? 'Trixer', total: Math.round(totals[p.id] ?? 0) }))
    .sort((a, b) => b.total - a.total)
    .map((s, i) => ({ ...s, position: i + 1 }))

  return { league, standings }
}

async function fetchAllUpcomingRaces(limit = 5) {
  const { data } = await supabase
    .from('races').select('id, name, date, location, distance, status')
    .in('status', ['upcoming', 'open']).order('date').limit(limit)
  return data ?? []
}

// ── Engagement intelligence ───────────────────────────────────────────────────
// Research-backed best practices for the triathlon niche on Instagram

const ENGAGEMENT_KNOWLEDGE = `
TRIATHLON INSTAGRAM ENGAGEMENT — RESEARCH INSIGHTS:

BEST CONTENT TYPES (by engagement rate, triathlon niche):
1. Race day / race week content — highest urgency, top saves and shares
2. "Pick your squad" / fantasy decision posts — drives comments
3. Athlete breakdown / analysis — high saves (people bookmark for reference)
4. Race results recap — shares spike in first 2h post-race
5. Market movement / "who's rising" — curiosity-driven, high reach
6. Behind the scenes (training, T1/T2 chaos) — strongest authentic connection
7. League standings / competitive — drives DMs from members

BEST DAYS TO POST (triathlon audience):
- Tuesday–Thursday: peak engagement (athletes doing lighter training days, more phone time)
- Sunday: post-long-run recovery browsing spike — second highest reach
- Monday: poor (race fatigue + work stress)
- Friday: moderate (pre-weekend training focus)
- Race week: any day performs above average

BEST TIMES (UTC-3, Brazil + global tri audience):
- 7:00–8:00: pre-swim/morning routine scroll
- 12:00–13:00: lunch break
- 18:00–19:30: post-workout, peak engagement window
- 21:00–22:00: recovery scroll before sleep

CONTENT MIX FOR FANTASY SPORTS ACCOUNTS (weekly):
- 40% race/athlete content (builds credibility with non-players)
- 30% game mechanics / market moves (engages active players)
- 20% community / league (retention + social proof)
- 10% educational / triathlon culture (top-of-funnel)

FORMAT RULES:
- Carousel posts (2–10 slides): +3x saves vs single image
- First line = hook — appears in feed without "more" tap
- 8–12 hashtags optimal for discovery in niche sports
- Emojis sparingly — triathlon community skews serious
- Tag athletes when mentioning them (drives organic reach)
- Stories + post combo within 24h amplifies reach significantly
`

// ── AUTO: decides what to post based on context ───────────────────────────────

async function actionAuto() {
  log('Analyzing context to decide best post...')

  // Gather context
  const now       = new Date()
  const hour      = now.getHours()
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' })
  const recentLog = readPostLog().slice(-5) // last 5 posts

  const [market, upcoming] = await Promise.all([fetchMarketData(), fetchAllUpcomingRaces(3)])

  const daysToNextRace = upcoming.length > 0
    ? Math.round((new Date(upcoming[0].date) - now) / 86400000)
    : null

  const recentActions = recentLog.map(p => p.action)
  const lastPostedToday = recentLog.some(p => p.timestamp?.startsWith(today()))

  const decisionContext = `${TRIATHLON_KNOWLEDGE}

Today: ${dayOfWeek}, ${now.toISOString().slice(0,10)}, hour: ${hour}:00 (UTC-3)
Last 5 posts: ${recentActions.join(', ') || 'none yet'}
Posted today already: ${lastPostedToday}
Upcoming races: ${upcoming.map(r => `${r.name} in ${Math.round((new Date(r.date) - now)/86400000)} days`).join('; ') || 'none'}
Market movers: ${market.rising.length} rising, ${market.falling.length} falling (biggest: ${market.rising[0]?.name ?? 'none'} +T$${market.rising[0]?.price_change ?? 0})

${ENGAGEMENT_KNOWLEDGE}

Based on the triathlon engagement research above, decide:
1. Should we post right now? (consider day, time, and whether we already posted today)
2. What action is best for this moment?
3. What specific angle/hook to use?

Return ONLY valid JSON:
{
  "should_post": true,
  "action": "post-upcoming-race|post-market-update|post-race-recap|post-league-standings",
  "race_id": null,
  "reasoning": "one sentence",
  "angle": "specific hook or angle to use in caption",
  "optimal_time": "if should_post is false, when should we post? (e.g. today at 18:00)"
}`

  const raw = await callClaude(
    'You are a social media strategist specializing in niche sports communities. Return only valid JSON.',
    decisionContext,
    512
  )

  let decision
  try {
    decision = JSON.parse(raw)
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) { try { decision = JSON.parse(match[0]) } catch { decision = null } }
  }

  if (!decision) { log('Could not parse decision. Raw:', raw); process.exit(1) }

  log(`\nDecision: ${decision.should_post ? '✅ Post now' : '⏳ Hold'}`)
  log(`Action: ${decision.action}`)
  log(`Reasoning: ${decision.reasoning}`)
  if (!decision.should_post) {
    log(`Best time: ${decision.optimal_time}`)
    return
  }

  // Override RACE_ID if decision provided one
  if (decision.race_id) process.env._AUTO_RACE_ID = decision.race_id

  log(`Angle: ${decision.angle}`)
  log('')

  // Execute the chosen action, passing the angle as extra context
  process.env._AUTO_ANGLE = decision.angle
  switch (decision.action) {
    case 'post-upcoming-race':    return actionPostUpcomingRace(decision.race_id)
    case 'post-market-update':    return actionPostMarketUpdate()
    case 'post-race-recap':       return actionPostRaceRecap(decision.race_id)
    case 'post-league-standings': return actionPostLeagueStandings()
    default:                      return actionPostMarketUpdate()
  }
}

// ── Shared post publisher ─────────────────────────────────────────────────────
// --prepare-only: resolve image + print markers but DO NOT call igPost.
// The orchestrator (trixer-agent) reads the markers, validates, then publishes itself.

const PREPARE_ONLY = args.includes('--prepare-only')

async function publishPost(plan, igContext) {
  const { caption, visual } = plan
  const imageUrl = await executeVisualBrief(visual)

  console.log('\n── CAPTION ──────────────────────────────────────')
  console.log(caption)
  console.log('── IMAGE ─────────────────────────────────────────')
  console.log('TRIXER_IMAGE_URL=' + imageUrl)
  console.log('TRIXER_ACTION=' + (igContext.action ?? ''))
  console.log('TRIXER_RACE_ID=' + (igContext.race_id ?? ''))

  if (PREPARE_ONLY) {
    log('prepare-only: skipping Instagram publish (orchestrator will publish after review)')
    return
  }

  if (!DRY_RUN) await igPost({ imageUrl, caption, context: igContext })
  else log('[dry-run] Would post to Instagram')
}

// ── Post Actions ──────────────────────────────────────────────────────────────

async function actionPostRaceRecap(raceId = RACE_ID) {
  if (!raceId) { console.error('--race-id required'); process.exit(1) }
  const { race, results } = await fetchRaceData(raceId)
  const podium   = results.slice(0, 3).map((r, i) => `${i+1}. ${r.athlete?.name} (${r.athlete?.country?.toUpperCase()})`)
  const winner   = results[0]?.athlete
  const angle    = process.env._AUTO_ANGLE ?? ''

  const context = `POST TYPE: race-recap
Race: ${race.name} — ${fmtDate(race.date)}, ${race.location}
Distance: ${race.distance}
Podium:
${podium.join('\n')}
${winner?.price_change ? `Winner Trixer value change: ${winner.price_change > 0 ? '+' : ''}T$${winner.price_change}` : ''}
Race ID for card art: ${raceId}
${angle ? `Editorial angle: ${angle}` : ''}
Context: Trixer fantasy game — users score points when their picked athletes podium.`

  const plan = await planPost(context)
  // Inject real race_id into visual if card art
  if (plan.visual?.mode === 'CARD_ART') plan.visual.race_id = plan.visual.race_id || raceId
  await publishPost(plan, { action: 'post-race-recap', race_id: raceId })
}

async function actionPostMarketUpdate() {
  const { rising, falling } = await fetchMarketData()
  const risingList  = rising.map(a => `${a.name} (${a.country?.toUpperCase()}, gender:${a.gender}) +T$${a.price_change} → T$${a.current_price}`).join('\n')
  const fallingList = falling.map(a => `${a.name} (${a.country?.toUpperCase()}, gender:${a.gender}) T$${a.price_change} → T$${a.current_price}`).join('\n')
  const angle = process.env._AUTO_ANGLE ?? ''

  const context = `POST TYPE: market-update
Trixer in-game market movements this week (fictional T$ currency, reflects real race results):

Rising athletes:
${risingList}

Falling athletes:
${fallingList}

${angle ? `Editorial angle: ${angle}` : ''}
Note: T$ is purely in-game currency. Never imply financial advice.`

  const plan = await planPost(context)
  await publishPost(plan, { action: 'post-market-update' })
}

async function actionPostUpcomingRace(raceId = RACE_ID) {
  const race = await fetchUpcomingRace(raceId)
  if (!race) { console.error('No upcoming race found'); process.exit(1) }

  const [y, m, d] = race.date.split('-').map(Number)
  const daysUntil = Math.round((new Date(y, m-1, d) - new Date()) / 86400000)
  const athletes  = (race.race_athletes ?? []).map(ra => ra.athlete).filter(a => a?.name)
  const favorites = athletes
    .sort((a, b) => (a.pto_rank ?? 999) - (b.pto_rank ?? 999)).slice(0, 5)
    .map(a => `${a.name} (${a.country}, gender:${a.gender ?? 'unknown'}) — T$${a.current_price}`)
  const angle = process.env._AUTO_ANGLE ?? ''

  const context = `POST TYPE: race-preview
Race: ${race.name}
Date: ${fmtDate(race.date)} (${daysUntil} days away)
Location: ${race.location}
Distance: ${race.distance}
Race ID (for card art if available): ${race.id}
Top picks on Trixer (in-game prices): ${favorites.length ? favorites.join('; ') : 'field TBC'}
Market closes 24h before gun.
${angle ? `Editorial angle: ${angle}` : ''}
CTA: lock your squad at trixer.app`

  const plan = await planPost(context)
  // Inject real race_id into visual
  if (plan.visual?.mode === 'CARD_ART') plan.visual.race_id = plan.visual.race_id || race.id
  await publishPost(plan, { action: 'post-upcoming-race', race_id: race.id })
}

async function actionPostLeagueStandings() {
  const effectiveLeagueId = LEAGUE_ID || process.env._AUTO_LEAGUE_ID
  if (!effectiveLeagueId) { console.error('--league-id required'); process.exit(1) }
  const { league, standings } = await fetchLeagueStandings(effectiveLeagueId)
  const top3  = standings.slice(0, 3).map(s => `${s.position}. ${s.name} — T$${s.total}`)
  const angle = process.env._AUTO_ANGLE ?? ''

  const context = `POST TYPE: league-standings
League: "${league.name}" on Trixer
Top 3:
${top3.join('\n')}
Total players: ${standings.length}
${angle ? `Editorial angle: ${angle}` : ''}
CTA: challenge friends at trixer.app`

  const plan = await planPost(context)
  await publishPost(plan, { action: 'post-league-standings', league_id: effectiveLeagueId })

  log('\n── CAPTION ──────────────────────────────────────')
  console.log(plan.caption)
}

// ── Execute brief from marketing agent ───────────────────────────────────────

async function actionExecuteBrief() {
  const briefFile = BRIEF_PATH ?? path.join(REPORTS, `brief-${today()}.json`)
  if (!existsSync(briefFile)) { console.error(`Brief not found: ${briefFile}\nRun: npm run marketing -- --action=briefing`); process.exit(1) }

  const brief = JSON.parse(readFileSync(briefFile, 'utf8'))
  log(`\nExecuting brief from ${brief.date} (generated by ${brief.generated_by})`)
  log(`Strategy: ${brief.week_strategy}`)

  const opportunities = (brief.opportunities ?? [])
    .filter(op => !op.executed)
    .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]))

  if (!opportunities.length) { log('All opportunities already executed.'); return }

  // Execute highest-priority opportunity
  const op = opportunities[0]
  log(`\nExecuting [${op.priority.toUpperCase()}]: ${op.action}`)
  log(`Angle: ${op.angle}`)
  log(`Why now: ${op.why}`)

  process.env._AUTO_ANGLE = op.angle

  switch (op.action) {
    case 'post-upcoming-race':
      await actionPostUpcomingRace(op.race_id)
      break
    case 'post-market-update':
      await actionPostMarketUpdate()
      break
    case 'post-race-recap':
      if (!op.race_id) { log('⚠️  race_id missing in brief — skipping'); break }
      await actionPostRaceRecap(op.race_id)
      break
    case 'post-league-standings': {
      let leagueId = op.league_id
      if (!leagueId) {
        // Brief didn't include a league_id — pick the most active public league
        const { data: leagues } = await supabase
          .from('leagues').select('id, name').eq('is_public', true).order('created_at', { ascending: false }).limit(1)
        leagueId = leagues?.[0]?.id ?? null
        if (!leagueId) { log('⚠️  No public league found — skipping'); break }
        log(`Using fallback league: ${leagues[0].name} (${leagueId})`)
      }
      process.env._AUTO_LEAGUE_ID = leagueId
      await actionPostLeagueStandings()
      break
    }
  }

  // Mark as executed in brief file — skip when --prepare-only (orchestrator will mark after approval)
  if (!DRY_RUN && !PREPARE_ONLY) {
    op.executed = true
    op.executed_at = new Date().toISOString()
    const remaining = opportunities.length - 1
    log(`\n${remaining} opportunity(ies) remaining in this brief.`)
    if (remaining > 0) log(`Next: npm run social -- --action=execute-brief --brief=${briefFile}`)
    writeFileSync(briefFile, JSON.stringify(brief, null, 2))
  }
}

// ── Engagement Report ─────────────────────────────────────────────────────────

async function actionEngagementReport() {
  const posts = readPostLog()
  if (posts.length < 3) {
    log('Not enough post history yet (minimum 3 posts needed).')
    log('Post history is built automatically each time the agent publishes.')
    return
  }

  // Analyze by action type, day, hour
  const byAction = {}
  const byDay    = {}
  const byHour   = {}

  for (const p of posts) {
    byAction[p.action] = (byAction[p.action] ?? 0) + 1
    byDay[p.day_of_week] = (byDay[p.day_of_week] ?? 0) + 1
    const bucket = `${p.hour}:00`
    byHour[bucket] = (byHour[bucket] ?? 0) + 1
  }

  const actionRanking = Object.entries(byAction).sort((a,b) => b[1]-a[1]).map(([k,v]) => `${k}: ${v}x`).join(', ')
  const dayRanking    = Object.entries(byDay).sort((a,b) => b[1]-a[1]).map(([k,v]) => `${k}: ${v}x`).join(', ')
  const hourRanking   = Object.entries(byHour).sort((a,b) => b[1]-a[1]).map(([k,v]) => `${k}: ${v}x`).join(', ')

  log('\n── POST HISTORY ──────────────────────────────────')
  log(`Total posts: ${posts.length}`)
  log(`By type:     ${actionRanking}`)
  log(`By day:      ${dayRanking}`)
  log(`By time:     ${hourRanking}`)
  log(`Last post:   ${posts[posts.length-1]?.timestamp?.slice(0,10) ?? 'N/A'}`)

  const context = `Post history for Trixer Instagram (@trixer.app):
Total posts published: ${posts.length}
Distribution by type: ${actionRanking}
Distribution by day: ${dayRanking}
Distribution by time: ${hourRanking}
Recent posts: ${posts.slice(-5).map(p => `${p.action} on ${p.day_of_week} at ${p.hour}:00`).join(', ')}

${ENGAGEMENT_KNOWLEDGE}

Based on our post history and triathlon niche engagement research:
1. What content types are we over/under-indexing on?
2. Are we posting at optimal times?
3. What's missing from our content mix?
4. Top 3 concrete recommendations for the next 2 weeks.`

  const report = await callClaude(
    'You are a social media analyst. Be specific and data-driven. Respond in Brazilian Portuguese.',
    context,
    1500
  )

  log('\n── ENGAGEMENT ANALYSIS ───────────────────────────')
  console.log(report)

  ensureReports()
  const fname = `engagement-report-${today()}.md`
  writeFileSync(path.join(REPORTS, fname), `# Engagement Report — ${today()}\n\n${report}\n`)
  log(`\nSaved: .agent-reports/${fname}`)
}

// ── Content Calendar ──────────────────────────────────────────────────────────

async function actionContentCalendar() {
  log('Generating 7-day content calendar...')

  const upcoming = await fetchAllUpcomingRaces(5)
  const { rising } = await fetchMarketData()

  const racesCtx = upcoming.length > 0
    ? upcoming.map(r => {
        const days = Math.round((new Date(r.date) - new Date()) / 86400000)
        return `${r.name} — ${r.date} (${days}d away, ${r.distance})`
      }).join('\n')
    : 'No upcoming races found'

  const context = `${TRIATHLON_KNOWLEDGE}

Generate a 7-day Instagram content calendar for Trixer (@trixer.app).

Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}, ${today()}

Upcoming races in the game:
${racesCtx}

Biggest market movers (Trixer in-game, T$ fictional currency):
${rising.slice(0,3).map(a => `${a.name} +T$${a.price_change}`).join(', ')}

${ENGAGEMENT_KNOWLEDGE}

Create a 7-day calendar. For each day include:
- Date and day of week
- Whether to post (skip low-engagement days if nothing urgent)
- Content type (post-upcoming-race / post-market-update / post-race-recap / post-league-standings)
- Specific hook/angle for the caption
- Best posting time
- Rationale (1 line)

Format as a clean table. Prioritize race-adjacent content. Vary formats. Apply the engagement timing research.
Respond in Brazilian Portuguese.`

  const calendar = await callClaude(
    'You are a social media strategist for niche sports. Be specific and actionable.',
    context,
    2000
  )

  log('\n── 7-DAY CONTENT CALENDAR ───────────────────────')
  console.log(calendar)

  ensureReports()
  const fname = `content-calendar-${today()}.md`
  writeFileSync(path.join(REPORTS, fname), `# Content Calendar — ${today()}\n\n${calendar}\n`)
  log(`\nSaved: .agent-reports/${fname}`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

const ACTIONS = {
  'auto':                actionAuto,
  'execute-brief':       actionExecuteBrief,
  'post-race-recap':     actionPostRaceRecap,
  'post-market-update':  actionPostMarketUpdate,
  'post-upcoming-race':  actionPostUpcomingRace,
  'post-league-standings': actionPostLeagueStandings,
  'engagement-report':   actionEngagementReport,
  'content-calendar':    actionContentCalendar,
}

if (!ACTIONS[ACTION]) {
  console.error(`Unknown action: ${ACTION}`)
  console.error(`Available: ${Object.keys(ACTIONS).join(', ')}`)
  process.exit(1)
}

log(`Running action: ${ACTION}${DRY_RUN ? ' [dry-run]' : ''}`)
ACTIONS[ACTION]().catch(err => { console.error('[social] Fatal:', err.message); process.exit(1) })
