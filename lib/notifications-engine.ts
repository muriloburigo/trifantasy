import { createAdminClient } from '~/lib/supabase/server'
import { sendToUser, alreadySent } from '~/lib/push'

export async function processNotifications() {
  const admin = createAdminClient()
  const results: string[] = []

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const in7d = new Date(today); in7d.setDate(today.getDate() + 7)
  const in7dStr = in7d.toISOString().slice(0, 10)

  // Fetch all users with at least one push subscription
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('user_id')
  
  const userIds = [...new Set((subs ?? []).map((s: any) => s.user_id))]
  if (!userIds.length) return { ok: true, sent: 0, results: ['No subscribers found'] }

  // ── 1. Race Approaching (7d, 1d, Today) ────────────────────────────────────
  const { data: races7d } = await admin
    .from('races')
    .select('id, name, slug, date, race_athletes(athlete_id)')
    .in('status', ['upcoming', 'open'])
    .gte('date', todayStr)
    .lte('date', in7dStr)

  const racesWithStartlist = (races7d ?? []).filter(
    (r: any) => (r.race_athletes?.length ?? 0) > 0
  )

  for (const race of racesWithStartlist) {
    const raceDate = new Date(race.date).getTime()
    const midnightToday = new Date(todayStr).getTime()
    const diffDays = Math.round((raceDate - midnightToday) / 86400000)

    if (diffDays < 0) continue

    let type = ''
    let title = '🏁 Prova se aproximando!'
    let body = ''

    if (diffDays === 0) {
      type = 'race_today'
      body = `É dia de prova! ${race.name} acontece hoje. Boa sorte com seu elenco!`
    } else if (diffDays === 1) {
      type = 'race_1d'
      body = `${race.name} acontece amanhã. O mercado vai fechar em breve — revise seu elenco!`
    } else if (diffDays <= 7) {
      type = 'race_7d'
      body = `${race.name} acontece em ${diffDays} dias. A lista de inscritos já está disponível!`
    }

    if (type) {
      for (const uid of userIds) {
        if (await alreadySent(uid, type, race.id)) continue
        await sendToUser(uid, { title, body, url: `/provas/${race.slug}`, tag: `race_${race.id}_${type}` })
        results.push(`${type} → ${uid} → ${race.name}`)
      }
    }
  }

  // ── 2. Market Open / Locked ────────────────────────────────────────────────
  const { data: statusRaces } = await admin
    .from('races')
    .select('id, name, slug, status, race_athletes(athlete_id)')
    .in('status', ['open', 'locked'])

  for (const race of statusRaces ?? []) {
    if ((race.race_athletes?.length ?? 0) === 0) continue

    const type = race.status === 'open' ? 'market_open' : 'market_locked'
    const title = race.status === 'open' ? '📈 Mercado aberto!' : '🔒 Mercado fechado!'
    const body = race.status === 'open'
      ? `A lista de inscritos para ${race.name} está disponível. Hora de montar seu elenco!`
      : `O mercado para ${race.name} está fechado. Agora é torcer pelos seus atletas!`
    
    for (const uid of userIds) {
      if (await alreadySent(uid, type, race.id)) continue
      await sendToUser(uid, { title, body, url: `/atletas`, tag: `${type}_${race.id}` })
      results.push(`${type} → ${uid} → ${race.name}`)
    }
  }

  // ── 3. Athlete missing from startlist ──────────────────────────────────────
  const nextRace = racesWithStartlist[0]
  if (nextRace) {
    const startlistIds = new Set((nextRace as any).race_athletes.map((ra: any) => ra.athlete_id))
    const { data: portfolios } = await admin.from('portfolio').select('user_id, athlete_id, athlete:athletes(name)').in('user_id', userIds)
    
    const byUser: Record<string, any[]> = {}
    portfolios?.forEach(p => {
      if (!byUser[p.user_id]) byUser[p.user_id] = []
      byUser[p.user_id].push({ id: p.athlete_id, name: (p.athlete as any).name })
    })

    for (const uid of userIds) {
      const missing = (byUser[uid] ?? []).filter(a => !startlistIds.has(a.id))
      if (missing.length > 0) {
        const refId = `${nextRace.id}:${missing.map(a => a.id).sort().join(',')}`
        if (await alreadySent(uid, 'missing_startlist', refId)) continue
        const names = missing.map(a => a.name).join(', ')
        await sendToUser(uid, {
          title: '⚠️ Atleta fora da lista!',
          body: `${names} não ${missing.length === 1 ? 'está' : 'estão'} na startlist de ${nextRace.name}. Considere trocar!`,
          url: '/elenco',
          tag: `missing_${nextRace.id}`
        })
        results.push(`missing → ${uid} → ${names}`)
      }
    }
  }

  return { ok: true, sent: results.length, results }
}
