import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '~/lib/supabase/server'
import { sendToUser, alreadySent } from '~/lib/push'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function auth(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  return secret === process.env.CRON_SECRET
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const results: string[] = []

  const today = new Date()
  const in1d = new Date(today); in1d.setDate(today.getDate() + 1)
  const in7d = new Date(today); in7d.setDate(today.getDate() + 7)
  const todayStr = today.toISOString().slice(0, 10)
  const in1dStr = in1d.toISOString().slice(0, 10)
  const in7dStr = in7d.toISOString().slice(0, 10)

  // Fetch all users with at least one push subscription
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('user_id')
  const userIds = [...new Set((subs ?? []).map((s: any) => s.user_id))]
  if (!userIds.length) return NextResponse.json({ ok: true, sent: 0 })

  // ── 1. Race in 7 days with startlist ────────────────────────────────────────
  const { data: races7d } = await admin
    .from('races')
    .select('id, name, slug, date, race_athletes(athlete_id)')
    .in('status', ['upcoming', 'open'])
    .gte('date', todayStr)
    .lte('date', in7dStr)
  const races7dWithStartlist = (races7d ?? []).filter(
    (r: any) => (r.race_athletes?.length ?? 0) > 0
  )
  for (const race of races7dWithStartlist) {
    const daysUntil = Math.round((new Date(race.date).getTime() - today.getTime()) / 86400000)
    const type = daysUntil <= 1 ? 'race_1d' : 'race_7d'
    for (const uid of userIds) {
      const done = await alreadySent(uid, type, race.id)
      if (done) continue
      const label = daysUntil <= 1 ? 'amanhã' : `em ${daysUntil} dias`
      await sendToUser(uid, {
        title: '🏁 Prova se aproximando!',
        body: `${race.name} acontece ${label}. O mercado vai fechar em breve — revise seu elenco!`,
        url: `/provas/${race.slug}`,
        tag: `race_${race.id}`,
      })
      results.push(`race_upcoming → ${uid} → ${race.name}`)
    }
  }

  // ── 2. Market opens (race status changed to 'open') ──────────────────────────
  const { data: openRaces } = await admin
    .from('races')
    .select('id, name, slug, race_athletes(athlete_id)')
    .eq('status', 'open')
  const openWithStartlist = (openRaces ?? []).filter(
    (r: any) => (r.race_athletes?.length ?? 0) > 0
  )
  for (const race of openWithStartlist) {
    for (const uid of userIds) {
      const done = await alreadySent(uid, 'market_open', race.id)
      if (done) continue
      await sendToUser(uid, {
        title: '📈 Mercado aberto!',
        body: `A lista de inscritos para ${race.name} está disponível. Hora de montar seu elenco!`,
        url: `/atletas`,
        tag: `market_${race.id}`,
      })
      results.push(`market_open → ${uid} → ${race.name}`)
    }
  }

  // ── 3. Athlete from team NOT in startlist of next race ───────────────────────
  const nextRaceWithStartlist = (races7dWithStartlist ?? [])[0]
  if (nextRaceWithStartlist) {
    const startlistAthleteIds = new Set(
      (nextRaceWithStartlist as any).race_athletes.map((ra: any) => ra.athlete_id)
    )
    // Fetch portfolios for all subscribed users
    const { data: portfolios } = await admin
      .from('portfolio')
      .select('user_id, athlete_id, athlete:athletes(name)')
      .in('user_id', userIds)
    const byUser: Record<string, { athleteId: string; name: string }[]> = {}
    for (const p of portfolios ?? []) {
      if (!byUser[p.user_id]) byUser[p.user_id] = []
      byUser[p.user_id].push({ athleteId: p.athlete_id, name: (p.athlete as any)?.name ?? '?' })
    }
    for (const uid of userIds) {
      const athletes = byUser[uid] ?? []
      const missing = athletes.filter(a => !startlistAthleteIds.has(a.athleteId))
      if (!missing.length) continue
      const refId = `${nextRaceWithStartlist.id}:${missing.map(a => a.athleteId).sort().join(',')}`
      const done = await alreadySent(uid, 'missing_startlist', refId)
      if (done) continue
      const names = missing.map(a => a.name).join(', ')
      await sendToUser(uid, {
        title: '⚠️ Atleta fora da lista!',
        body: `${names} não ${missing.length === 1 ? 'está' : 'estão'} na startlist de ${nextRaceWithStartlist.name}. Considere fazer uma troca!`,
        url: `/elenco`,
        tag: `missing_${nextRaceWithStartlist.id}`,
      })
      results.push(`missing_startlist → ${uid} → ${names}`)
    }
  }

  // ── 4. Significant price change (≥10%) for owned athletes in last 24h ────────
  const since24h = new Date(today.getTime() - 86400000).toISOString()
  const { data: priceChanges } = await admin
    .from('athlete_price_history')
    .select('athlete_id, old_price, new_price, changed_at, athlete:athletes(name)')
    .gte('changed_at', since24h)
  for (const change of priceChanges ?? []) {
    const oldP = Number(change.old_price)
    const newP = Number(change.new_price)
    if (oldP === 0) continue
    const pct = Math.abs((newP - oldP) / oldP) * 100
    if (pct < 10) continue
    const rising = newP > oldP
    const athleteId = change.athlete_id
    const athleteName = (change.athlete as any)?.name ?? 'Atleta'
    // Find users who own this athlete
    const { data: owners } = await admin
      .from('portfolio')
      .select('user_id')
      .eq('athlete_id', athleteId)
      .in('user_id', userIds)
    for (const owner of owners ?? []) {
      const refId = `${athleteId}:${change.changed_at}`
      const done = await alreadySent(owner.user_id, 'price_change', refId)
      if (done) continue
      await sendToUser(owner.user_id, {
        title: rising ? `📈 ${athleteName} valorizou!` : `📉 ${athleteName} desvalorizou!`,
        body: `${athleteName} ${rising ? 'subiu' : 'caiu'} ${pct.toFixed(0)}%: T$${oldP.toFixed(0)} → T$${newP.toFixed(0)}`,
        url: `/atletas/${athleteId}`,
        tag: `price_${athleteId}`,
      })
      results.push(`price_change → ${owner.user_id} → ${athleteName} ${rising ? '+' : '-'}${pct.toFixed(0)}%`)
    }
  }

  // ── 5. Rank changed in global league (top 10 milestone) ─────────────────────
  const { data: globalLeague } = await admin
    .from('leagues')
    .select('id')
    .eq('is_global', true)
    .single()
  if (globalLeague) {
    const { data: members } = await admin
      .from('league_members')
      .select('user_id')
      .eq('league_id', globalLeague.id)
      .in('user_id', userIds)
    const memberIds = (members ?? []).map((m: any) => m.user_id)
    if (memberIds.length) {
      const { data: teams } = await admin
        .from('teams')
        .select('user_id, scores(total_points)')
        .in('user_id', memberIds)
      const ranked = (teams ?? [])
        .map((t: any) => ({
          userId: t.user_id,
          total: (t.scores ?? []).reduce((s: number, sc: any) => s + Number(sc.total_points ?? 0), 0),
        }))
        .sort((a: any, b: any) => b.total - a.total)
      for (let i = 0; i < ranked.length; i++) {
        const { userId, total } = ranked[i]
        const pos = i + 1
        if (total === 0) continue
        // Notify on top-10 entry (store last known rank to detect change)
        if (pos <= 10) {
          const refId = `pos${pos}_${todayStr}`
          const done = await alreadySent(userId, 'top10', refId)
          if (done) continue
          await sendToUser(userId, {
            title: '🏆 Você está no Top 10!',
            body: `Você ocupa a ${pos}ª posição na Liga Global com ${total} pontos. Continue escalando!`,
            url: `/ligas`,
            tag: 'rank_global',
          })
          results.push(`top10 → ${userId} → pos ${pos}`)
        }
      }
    }
  }

  return NextResponse.json({ ok: true, sent: results.length, results })
}
