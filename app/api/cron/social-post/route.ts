/**
 * Cron: Social Media Auto-Post
 *
 * Roda diariamente às 09:00 UTC (06:00 BRT).
 * Pipeline completo: dados do Supabase → Claude (knowledge base de triathlon) → Make.com → Instagram.
 *
 * Protegido por CRON_SECRET. Chamado pelo Vercel Cron.
 * Para testar manualmente: GET /api/cron/social-post com header Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '~/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function auth(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  return secret === process.env.CRON_SECRET
}

// ── Triathlon Knowledge Base ──────────────────────────────────────────────────
// Compiled from PTO, T100, WTCS, Ironman, Challenge, K226 — PRO only

const TRIATHLON_KNOWLEDGE = `
TOP PRO ATHLETES 2025-2026:
MEN: Patrick Lange (GER, Kona CR 7:35:53), Sam Laidlow (FRA), Casper Stornes (NOR, Kona 2025 champion), Kristian Blummenfelt (NOR, Olympic gold Tokyo), Gustav Iden (NOR), Magnus Ditlev (DEN, Roth CR), Leon Chevalier (FRA), Hayden Wilde (NZL, PTO #1), Cameron Wurf (AUS, fastest bike).
WOMEN: Lucy Charles-Barclay (GBR, 70.3 WC 2025), Solveig Løvseth (NOR, Kona 2025 champion), Chelsea Sodaro (USA, Kona 2022), Anne Haug (GER, Kona 2019), Daniela Ryf (SUI, 5x Kona), Kat Matthews (GBR), Laura Philipp (GER), Taylor Knibb (USA, PTO #2), Julie Derron (SUI, PTO #1).
BRAZILIANS: Djenyfer Arnold (70.3 Brasília 2025 champion), Miguel Hidalgo (WTCS top-3).

KEY CIRCUITS:
- T100: 2km swim + 80km bike + 18km run. $275k/race. 2026: men and women race alternating events.
- IRONMAN full: 3.8km + 180km + 42.2km. Kona 2026: men+women same day Oct 10 (first time since 2019).
- IRONMAN 70.3: half distance. 70.3 WC: Nice, Sep 2026.
- WTCS: Olympic distance (1.5+40+10), draft-legal.
- Challenge: indie circuit. Roth (€160k prize, Jul) is the crown jewel.

TRIATHLON TERMS: T1/T2, pain cave, bonk, watts, sub-8/sub-9, course record (CR), Kona slot, Ali'i Drive, run off the bike, brick, splits, PTO score, drafting (legal WTCS/T100, illegal IRONMAN).

KEY NARRATIVES 2026: Kona reunites men+women; Norwegian dominance wave; Lucy's Kona (4x runner-up); T100 splits genders per race; Alex Yee comeback after sabbatical; Brazilian pros rising.
`

// ── Caption System Prompt ─────────────────────────────────────────────────────

const CAPTION_SYSTEM_PROMPT = `You are the Instagram voice of Trixer — the fantasy game for professional triathlon.

VOICE: Sharp triathlon insider. Data over adjectives. First names for known athletes (Lucy, Jan, Blu, Daniela, Anne, Chelsea, Patrick, Sam). Punchy sentences. Opinionated.

CAPTION STRUCTURE:
1. Hook — bold claim or stat. Never start with brand name.
2. Context — 2-3 lines max.
3. Insight — makes reader feel like an insider.
4. CTA — one action (build squad at trixer.app).
5. Hashtags — 8-10.

CRITICAL RULE: T$ is fictional in-game currency. Always clarify it's the Trixer game market.
✅ "up T$7 on the Trixer market"  ❌ "gained $7"

HASHTAGS: #triathlon #swimbikerun #triathlete #triathlonlife #t100triathlon #ptotriathlon #ironmantri #triathlonfantasy #trixer #fantasygame

LANGUAGE: English only. Return ONLY the caption. No preamble.

${TRIATHLON_KNOWLEDGE}`

// ── Data fetchers ─────────────────────────────────────────────────────────────

async function getMarketData() {
  const supabase = createAdminClient()
  const [{ data: rising }, { data: falling }] = await Promise.all([
    supabase.from('athletes').select('name, country, current_price, price_change')
      .gt('price_change', 0).order('price_change', { ascending: false }).limit(5),
    supabase.from('athletes').select('name, country, current_price, price_change')
      .lt('price_change', 0).order('price_change', { ascending: true }).limit(5),
  ])
  return { rising: rising ?? [], falling: falling ?? [] }
}

async function getUpcomingRace() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('races')
    .select('id, name, date, location, distance, race_athletes(athlete:athletes(name, country, current_price, pto_rank))')
    .in('status', ['upcoming', 'open'])
    .order('date')
    .limit(1)
    .maybeSingle()
  return data
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Claude API ────────────────────────────────────────────────────────────────

async function callClaude(userPrompt: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: CAPTION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  })
  if (!res.ok) throw new Error(`Claude error: ${res.status}`)
  const data = await res.json()
  return data.content[0].text
}

// ── Make.com → Instagram ──────────────────────────────────────────────────────

const IMAGES = {
  market:   'https://images.pexels.com/photos/5687398/pexels-photo-5687398.jpeg?auto=compress&cs=tinysrgb&w=1080',
  upcoming: 'https://images.pexels.com/photos/5687547/pexels-photo-5687547.jpeg?auto=compress&cs=tinysrgb&w=1080',
  recap:    'https://images.pexels.com/photos/35245649/pexels-photo-35245649.jpeg?auto=compress&cs=tinysrgb&w=1080',
}

async function igPost(caption: string, imageUrl: string) {
  const res = await fetch(process.env.MAKE_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ caption, imageUrl }),
  })
  if (!res.ok) throw new Error(`Make.com error: ${res.status}`)
  return res.json().catch(() => ({}))
}

// ── Decision logic ────────────────────────────────────────────────────────────
// Picks the best post type for today based on race calendar

async function decideAndPost() {
  const [market, race] = await Promise.all([getMarketData(), getUpcomingRace()])

  const now = new Date()
  const daysToRace = race
    ? Math.round((new Date(race.date).getTime() - now.getTime()) / 86400000)
    : null

  let caption: string
  let imageUrl: string
  let postType: string

  if (daysToRace !== null && daysToRace <= 7 && daysToRace >= 0) {
    // Race week — preview post
    postType = 'race-preview'
    const [y, m, d] = race!.date.split('-').map(Number)
    const favorites = (race!.race_athletes ?? [])
      .map((ra: any) => ra.athlete).filter((a: any) => a?.name)
      .sort((a: any, b: any) => (a.pto_rank ?? 999) - (b.pto_rank ?? 999))
      .slice(0, 4).map((a: any) => `${a.name} — T$${a.current_price} in-game`)

    caption = await callClaude(`Upcoming race: ${race!.name}
Date: ${fmtDate(race!.date)} (${daysToRace} days away)
Location: ${race!.location}, Distance: ${race!.distance}
Top Trixer market picks (in-game T$ values, fictional currency):
${favorites.join('\n')}
Market closes 24h before race. CTA: lock squad at trixer.app`)
    imageUrl = IMAGES.upcoming

  } else if (market.rising.length > 0) {
    // Default — market update
    postType = 'market-update'
    const risingStr = market.rising
      .map((a: any) => `${a.name} (${a.country?.toUpperCase()}) +T$${a.price_change} → T$${a.current_price}`)
      .join('\n')
    const fallingStr = market.falling.slice(0, 3)
      .map((a: any) => `${a.name} T$${a.price_change} → T$${a.current_price}`)
      .join('\n')

    caption = await callClaude(`Trixer in-game market movements (T$ = fictional game currency):
Rising this week:
${risingStr}
Falling:
${fallingStr}
Clarify these are in-game values on the Trixer fantasy platform. CTA: build squad at trixer.app`)
    imageUrl = IMAGES.market

  } else {
    return { skipped: true, reason: 'No market movements and no upcoming races' }
  }

  await igPost(caption, imageUrl)
  return { posted: true, type: postType, caption: caption.slice(0, 100) + '...' }
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await decideAndPost()
    console.log('[cron/social-post]', result)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[cron/social-post] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
