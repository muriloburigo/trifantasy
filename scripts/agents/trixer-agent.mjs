#!/usr/bin/env node
/**
 * Trixer Agent — Orquestrador Central
 *
 * Lidera e coordena todos os agentes especializados:
 *   marketing-agent  → analisa negócio, KPIs, oportunidades
 *   social-media-agent → decide conteúdo, timing, publica
 *   designer-agent   → escolhe imagem coerente com o post
 *   growth-agent     → funil, retenção, push notifications
 *
 * O orquestrador entende o momento do negócio e delega as tarefas certas
 * para os agentes certos, na ordem certa.
 *
 * Usage:
 *   node scripts/agents/trixer-agent.mjs --action=run          # pipeline completo diário
 *   node scripts/agents/trixer-agent.mjs --action=post         # só gera + publica 1 post
 *   node scripts/agents/trixer-agent.mjs --action=weekly       # planejamento semanal completo
 *   node scripts/agents/trixer-agent.mjs --action=status       # diagnóstico rápido do app
 *   node scripts/agents/trixer-agent.mjs --action=race-week --race-id=<uuid>  # modo prova
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
 *   MAKE_WEBHOOK_URL, PEXELS_API_KEY (optional)
 */

import { createClient } from '@supabase/supabase-js'
import { spawnSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '../..')
const REPORTS   = path.join(ROOT, '.agent-reports')

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

const args   = process.argv.slice(2)
const getArg = (name) => { const a = args.find(a => a.startsWith(`--${name}=`)); return a ? a.split('=').slice(1).join('=') : null }

const ACTION   = getArg('action') ?? 'run'
const RACE_ID  = getArg('race-id')
const DRY_RUN  = args.includes('--dry-run')

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env vars'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

// ── Helpers ───────────────────────────────────────────────────────────────────

const log  = (...a) => console.log('\n[trixer]', ...a)
const sep  = ()     => console.log('\n' + '─'.repeat(52))
const today = ()    => new Date().toISOString().slice(0, 10)

function ensureReports() { mkdirSync(REPORTS, { recursive: true }) }

// ── Agent runner ──────────────────────────────────────────────────────────────
// Spawns a sub-agent and returns { success, output }

function runAgent(script, agentArgs = []) {
  const agentPath = path.join(__dirname, `${script}.mjs`)
  const nodeArgs  = ['--env-file=.env.local', agentPath, ...agentArgs]
  if (DRY_RUN && !agentArgs.includes('--dry-run')) nodeArgs.push('--dry-run')

  log(`→ ${script} ${agentArgs.join(' ')}`)

  const result = spawnSync(
    process.execPath,
    nodeArgs,
    { cwd: ROOT, encoding: 'utf8', timeout: 120_000 }
  )

  const output = (result.stdout ?? '') + (result.stderr ?? '')
  const success = result.status === 0

  // Print output inline
  output.split('\n').filter(Boolean).forEach(line => console.log('  ' + line))

  return { success, output, status: result.status }
}

async function callClaude(system, user, maxTokens = 1024) {
  if (!ANTHROPIC_KEY) throw new Error('Missing ANTHROPIC_API_KEY')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
  })
  if (!res.ok) throw new Error(`Claude error: ${res.status}`)
  return (await res.json()).content[0].text
}

// ── Context gathering ─────────────────────────────────────────────────────────

async function gatherContext() {
  const now = new Date()
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' })
  const hour = now.getHours()

  const [
    { count: totalUsers },
    { count: activeLast7d },
    { data: upcomingRaces },
    { data: recentFinished },
    { data: topMarketMovers },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('market_transactions').select('user_id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase.from('races').select('id, name, date, status').in('status', ['upcoming', 'open']).order('date').limit(3),
    supabase.from('races').select('id, name, date').eq('status', 'finished').order('date', { ascending: false }).limit(2),
    supabase.from('athletes').select('name, price_change').gt('price_change', 0).order('price_change', { ascending: false }).limit(3),
  ])

  const nextRace = upcomingRaces?.[0]
  const daysToRace = nextRace
    ? Math.round((new Date(nextRace.date).getTime() - now.getTime()) / 86400000)
    : null

  const briefExists = existsSync(path.join(REPORTS, `brief-${today()}.json`))

  return {
    now, dayOfWeek, hour,
    totalUsers: totalUsers ?? 0,
    activeLast7d: activeLast7d ?? 0,
    upcomingRaces: upcomingRaces ?? [],
    nextRace, daysToRace,
    recentFinished: recentFinished ?? [],
    topMarketMovers: topMarketMovers ?? [],
    briefExists,
  }
}

// ── Orchestration logic ───────────────────────────────────────────────────────

async function actionStatus() {
  sep()
  log('STATUS — Trixer Business Snapshot')
  sep()
  const ctx = await gatherContext()

  console.log(`\n  📅  ${ctx.dayOfWeek}, ${today()}, ${ctx.hour}:00h`)
  console.log(`  👥  Users: ${ctx.totalUsers} total | ${ctx.activeLast7d} active last 7d`)
  console.log(`  🏁  Next race: ${ctx.nextRace ? `${ctx.nextRace.name} in ${ctx.daysToRace}d` : 'none scheduled'}`)
  console.log(`  📈  Top mover: ${ctx.topMarketMovers[0]?.name ?? 'none'} (+T$${ctx.topMarketMovers[0]?.price_change ?? 0})`)
  console.log(`  📋  Brief today: ${ctx.briefExists ? '✓ exists' : '✗ not generated'}`)

  if (ctx.daysToRace !== null && ctx.daysToRace <= 3) {
    console.log(`\n  ⚡  RACE WEEK — ${ctx.nextRace.name} in ${ctx.daysToRace} days!`)
    console.log(`      → Run: npm run trixer -- --action=race-week --race-id=${ctx.nextRace.id}`)
  }
}

// ── Post output parser ────────────────────────────────────────────────────────

function parsePostOutput(output) {
  // Caption ends at the IMAGE marker line — use a greedy match up to the exact marker
  const captionMatch = output.match(/── CAPTION ──+[\r\n]+([\s\S]*?)[\r\n]── IMAGE/)
  const imageMatch   = output.match(/TRIXER_IMAGE_URL=(.+)/)
  const actionMatch  = output.match(/TRIXER_ACTION=(.*)/)
  const raceMatch    = output.match(/TRIXER_RACE_ID=(.*)/)
  return {
    caption:  captionMatch?.[1]?.trim() ?? '',
    imageUrl: imageMatch?.[1]?.trim() ?? '',
    action:   actionMatch?.[1]?.trim() ?? '',
    raceId:   raceMatch?.[1]?.trim() ?? '',
  }
}

// ── Instagram publish (called by orchestrator after validation) ───────────────

const MAKE_WEBHOOK = process.env.MAKE_WEBHOOK_URL

async function publishToInstagram(caption, imageUrl, action, raceId) {
  if (!MAKE_WEBHOOK) { log('⚠️  MAKE_WEBHOOK_URL not set — skipping publish'); return }
  if (DRY_RUN) { log('[dry-run] Would publish to Instagram'); return }

  log('Publishing to Instagram via Make.com...')
  const res = await fetch(MAKE_WEBHOOK, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ caption, image_url: imageUrl }),
  })
  const body = await res.text()
  if (!res.ok) throw new Error(`Make.com error ${res.status}: ${body}`)
  log(`✓ Published! Make.com: ${body.slice(0, 100)}`)

  // Write to post-log
  const logPath = path.join(REPORTS, 'post-log.json')
  let posts = []
  try { posts = JSON.parse(readFileSync(logPath, 'utf8')) } catch {}
  const hook = caption.split('\n').find(l => l.trim().length > 0)?.trim() ?? ''
  posts.push({
    action, race_id: raceId || null, image_url: imageUrl,
    caption_preview: caption.slice(0, 100),
    hook,
    day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    hour: new Date().getHours(),
    timestamp: new Date().toISOString(),
  })
  writeFileSync(logPath, JSON.stringify(posts, null, 2))
}

// ── Orchestrator validation ───────────────────────────────────────────────────

async function validatePostResult(caption, imageUrl) {
  if (!caption || !imageUrl) return { ok: false, reason: 'Missing caption or image URL' }
  if (!ANTHROPIC_KEY) return { ok: true, reason: 'no API key' }

  const raw = await callClaude(
    `You are the editorial director of Trixer, a fantasy game for professional triathlon.
You review Instagram posts BEFORE publishing. Be a practical editor — approve good posts, reject only genuinely broken ones.

APPROVE if:
- Caption is complete, well-written, triathlon-specific
- Image is any endurance sport (running, cycling, swimming, triathlon, marathon) — does NOT need to be 100% triathlon
- Gender in image roughly matches athletes mentioned (if detectable from URL)

REJECT only if:
- Caption is clearly cut off or broken
- Image is completely off-sport (yoga, gym, soccer, fitness model posing, etc.)
- Obvious gender mismatch: caption exclusively about women + image URL signals men-only (or vice versa)
- Image URL is a Vercel/API endpoint that likely failed (e.g. contains "undefined", returns HTML)

IMPORTANT: A running race photo is ACCEPTABLE for a triathlon race preview. Triathlon IS running. Do not reject endurance sport photos.

Reply ONLY with JSON: {"ok": true/false, "reason": "one sentence"}`,
    `Caption:\n${caption}\n\nImage URL: ${imageUrl}`
  )

  try {
    const m = raw.match(/\{[\s\S]*\}/)
    return m ? JSON.parse(m[0]) : { ok: true, reason: 'parse failed' }
  } catch {
    return { ok: true, reason: 'parse failed' }
  }
}

async function runSocialPost(briefFile, attempt = 1, rejectionReason = '', lockedAction = null, lockedRaceId = null) {
  // --prepare-only: social resolves image + caption but does NOT publish to Instagram.
  // Trixer validates first, then publishes only once if approved.
  const extraArgs = ['--prepare-only']
  if (attempt > 1) extraArgs.push('--force-redo-image')

  let agentArgs
  if (attempt > 1 && lockedAction) {
    // Retry: force the SAME action/race as attempt 1 — avoids executing a different opportunity
    agentArgs = [`--action=${lockedAction}`, ...extraArgs]
    if (lockedRaceId) agentArgs.push(`--race-id=${lockedRaceId}`)
  } else {
    agentArgs = briefFile
      ? ['--action=execute-brief', `--brief=${briefFile}`, ...extraArgs]
      : ['--action=auto', ...extraArgs]
  }

  const env = { ...process.env }
  if (rejectionReason) {
    env._REJECTION_REASON = rejectionReason
    log(`Rejection passed to social: "${rejectionReason.slice(0, 100)}"`)
  }

  log(`Social: ${attempt > 1 ? `retry #${attempt - 1} (${lockedAction})` : briefFile ? 'executing brief' : 'auto mode'}...`)

  const agentPath = path.join(__dirname, 'social-media-agent.mjs')
  const nodeArgs  = ['--env-file=.env.local', agentPath, ...agentArgs]
  const result = spawnSync(process.execPath, nodeArgs, { cwd: ROOT, encoding: 'utf8', timeout: 120_000, env })
  const output = (result.stdout ?? '') + (result.stderr ?? '')
  output.split('\n').filter(Boolean).forEach(line => console.log('  ' + line))
  return { success: result.status === 0, output, status: result.status }
}

async function actionPost() {
  sep()
  log('POST — Single post pipeline')
  sep()

  const ctx = await gatherContext()

  // Step 1: Marketing generates brief — regenerate if today's brief has no pending opportunities
  const todayBriefPath = path.join(REPORTS, `brief-${today()}.json`)
  let briefFile = null

  if (ctx.briefExists) {
    try {
      const existing = JSON.parse(readFileSync(todayBriefPath, 'utf8'))
      const pending = (existing.opportunities ?? []).filter(op => !op.executed)
      if (pending.length > 0) {
        log(`Step 1/3 — Marketing: brief already exists for today (${pending.length} pending) ✓`)
        briefFile = todayBriefPath
      } else {
        log('Step 1/3 — Marketing: today\'s brief fully executed — generating fresh brief...')
        const r = runAgent('marketing-agent', ['--action=briefing'])
        if (!r.success) log('⚠️  Brief generation failed — proceeding with auto mode')
        briefFile = existsSync(todayBriefPath) ? todayBriefPath : null
      }
    } catch {
      log('Step 1/3 — Marketing: brief unreadable — regenerating...')
      const r = runAgent('marketing-agent', ['--action=briefing'])
      if (!r.success) log('⚠️  Brief generation failed — proceeding with auto mode')
      briefFile = existsSync(todayBriefPath) ? todayBriefPath : null
    }
  } else {
    log('Step 1/3 — Marketing: generating strategic brief...')
    const r = runAgent('marketing-agent', ['--action=briefing'])
    if (!r.success) log('⚠️  Brief generation failed — proceeding with auto mode')
    briefFile = existsSync(todayBriefPath) ? todayBriefPath : null
  }

  // Step 2: Social posts — with orchestrator review loop
  sep()

  const MAX_ATTEMPTS = 4
  let approved = false
  let lastRejectionReason = ''
  let lockedAction = null
  let lockedRaceId = null

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    log(`Step 2 — Social (attempt ${attempt}/${MAX_ATTEMPTS})`)
    const result = await runSocialPost(briefFile, attempt, lastRejectionReason, lockedAction, lockedRaceId)

    if (!result.success) {
      log(`⚠️  Social agent exited with error — skipping validation`)
      break
    }

    // Step 3: Orchestrator reviews the output
    const { caption, imageUrl, action: postAction, raceId: postRaceId } = parsePostOutput(result.output)

    // Lock action/raceId from attempt 1 so retries redo the same opportunity
    if (attempt === 1 && postAction) {
      lockedAction = postAction
      lockedRaceId = postRaceId || null
    }

    sep()
    log(`Step 3 — Review: validating post quality...`)

    if (!caption && !imageUrl) {
      const skipped = result.output.includes('skipping') || result.output.includes('already executed') || result.output.includes('No public league')
      if (skipped) {
        log('⚠️  Social agent skipped — no publishable opportunity found')
        log('→ Hint: reset the brief or check that league/race data exists in DB')
      } else {
        log('⚠️  Could not parse post output — no post will be published')
      }
      break
    }

    const validation = await validatePostResult(caption, imageUrl)
    if (validation.ok) {
      log(`✓ APPROVED: ${validation.reason}`)
      // Publish ONCE — social skipped igPost via --prepare-only
      await publishToInstagram(caption, imageUrl, postAction, postRaceId)
      // Mark opportunity as executed in brief now that post is confirmed
      if (briefFile) {
        try {
          const brief = JSON.parse(readFileSync(briefFile, 'utf8'))
          const op = (brief.opportunities ?? []).find(o => !o.executed)
          if (op) {
            op.executed = true
            op.executed_at = new Date().toISOString()
            writeFileSync(briefFile, JSON.stringify(brief, null, 2))
          }
        } catch {}
      }
      approved = true
      break
    }

    log(`✗ REJECTED: ${validation.reason}`)
    lastRejectionReason = validation.reason
    if (attempt < MAX_ATTEMPTS) {
      log(`→ Requesting redo (attempt ${attempt + 1}/${MAX_ATTEMPTS})...`)
    }
  }

  sep()
  if (approved) {
    log('Pipeline complete ✓')
  } else {
    log('⚠️  Post not published — quality gate not passed')
  }
  if (DRY_RUN) log('(dry-run: nothing was posted to Instagram)')
}

async function actionRun() {
  sep()
  log('RUN — Daily pipeline')
  sep()

  const ctx = await gatherContext()

  log(`Context: ${ctx.dayOfWeek} ${ctx.hour}h | ${ctx.totalUsers} users | next race: ${ctx.nextRace ? ctx.nextRace.name + ' in ' + ctx.daysToRace + 'd' : 'none'}`)

  // Decide what to run based on context
  const tasks = []

  // Always: marketing brief
  tasks.push({ label: 'Marketing brief', agent: 'marketing-agent', args: ['--action=briefing'] })

  // Race week: prioritize race post
  if (ctx.daysToRace !== null && ctx.daysToRace <= 7) {
    tasks.push({ label: `Race preview (${ctx.nextRace.name}, ${ctx.daysToRace}d)`, agent: 'social-media-agent', args: ['--action=post-upcoming-race', `--race-id=${ctx.nextRace.id}`] })
  } else {
    // Non-race week: execute brief
    tasks.push({ label: 'Social post (from brief)', agent: 'social-media-agent', args: ['--action=execute-brief'] })
  }

  // Run tasks in sequence
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]
    sep()
    log(`Task ${i + 1}/${tasks.length}: ${task.label}`)
    const result = runAgent(task.agent, task.args)
    if (!result.success) log(`⚠️  Task failed (exit ${result.status}) — continuing`)
  }

  sep()
  log('Daily pipeline complete ✓')
}

async function actionWeekly() {
  sep()
  log('WEEKLY — Full planning cycle')
  sep()

  const ctx = await gatherContext()

  // Step 1: Marketing deep analysis
  log('Step 1/4 — Marketing: full business analysis...')
  runAgent('marketing-agent', ['--action=analyze', '--report'])

  sep()
  // Step 2: Growth funnel
  log('Step 2/4 — Growth: funnel + virality analysis...')
  runAgent('growth-agent', ['--action=funnel'])
  runAgent('growth-agent', ['--action=league-virality'])

  sep()
  // Step 3: Content calendar
  log('Step 3/4 — Social: 7-day content calendar...')
  runAgent('social-media-agent', ['--action=content-calendar'])

  sep()
  // Step 4: Engagement review
  log('Step 4/4 — Social: engagement report...')
  runAgent('social-media-agent', ['--action=engagement-report'])

  sep()
  // Orchestrator summary via Claude
  log('Generating weekly summary...')

  const reportsDir = REPORTS
  const files = ['marketing-report', 'content-calendar', 'engagement-report']
    .map(f => path.join(reportsDir, `${f}-${today()}.md`))
    .filter(existsSync)
    .map(f => readFileSync(f, 'utf8').slice(0, 800))
    .join('\n\n---\n\n')

  if (files) {
    const summary = await callClaude(
      'You are the Trixer business orchestrator. Generate a concise executive summary in Brazilian Portuguese.',
      `Based on these reports generated today for Trixer (fantasy triathlon game):\n\n${files}\n\nWrite a 5-bullet executive summary: top insight, top risk, top content opportunity, top growth action, and one thing to ignore this week.`
    )

    sep()
    log('EXECUTIVE SUMMARY')
    console.log('\n' + summary)

    ensureReports()
    writeFileSync(path.join(REPORTS, `weekly-summary-${today()}.md`), `# Trixer Weekly Summary — ${today()}\n\n${summary}\n`)
    log(`\nSaved: .agent-reports/weekly-summary-${today()}.md`)
  }

  sep()
  log('Weekly cycle complete ✓')
}

async function actionRaceWeek() {
  const raceId = RACE_ID
  if (!raceId) { console.error('--race-id required'); process.exit(1) }

  const { data: race } = await supabase.from('races').select('name, date, location, distance').eq('id', raceId).single()
  if (!race) { console.error(`Race not found: ${raceId}`); process.exit(1) }

  const daysUntil = Math.round((new Date(race.date).getTime() - Date.now()) / 86400000)

  sep()
  log(`RACE WEEK — ${race.name} (${daysUntil}d away)`)
  sep()

  // Step 1: Race preview post
  log('Step 1/3 — Social: race preview post...')
  runAgent('social-media-agent', ['--action=post-upcoming-race', `--race-id=${raceId}`])

  // Step 2: Push engagement notification (if >1 day out)
  if (daysUntil >= 2) {
    sep()
    log('Step 2/3 — Growth: race engagement push...')
    runAgent('growth-agent', ['--action=race-engagement-push', `--race-id=${raceId}`, '--limit=100'])
  } else {
    log('Step 2/3 — Growth: skipping push (race is tomorrow or today)')
  }

  // Step 3: Market pulse
  sep()
  log('Step 3/3 — Marketing: market pulse...')
  runAgent('marketing-agent', ['--action=market-pulse'])

  sep()
  log(`Race week pipeline complete ✓ — ${race.name}`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

const ACTIONS = {
  'run':       actionRun,
  'post':      actionPost,
  'weekly':    actionWeekly,
  'race-week': actionRaceWeek,
  'status':    actionStatus,
}

if (!ACTIONS[ACTION]) {
  console.error(`Unknown action: ${ACTION}`)
  console.error(`Available: ${Object.keys(ACTIONS).join(', ')}`)
  process.exit(1)
}

sep()
console.log('  TRIXER AGENT — Orchestrator')
console.log(`  Action: ${ACTION}${DRY_RUN ? ' [dry-run]' : ''}`)
sep()

ACTIONS[ACTION]().catch(err => { console.error('[trixer] Fatal:', err.message); process.exit(1) })
