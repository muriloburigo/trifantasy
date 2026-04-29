import { createAdminClient } from '~/lib/supabase/server'
import { sendToUser, alreadySent } from '~/lib/push'

type Locale = 'pt' | 'en' | 'es'

// ── i18n strings ─────────────────────────────────────────────────────────────

const T = {
  race_approaching_title: {
    pt: '🏁 Prova se aproximando!',
    en: '🏁 Race coming up!',
    es: '🏁 ¡Carrera próxima!',
  },
  race_today: {
    pt: (race: string) => `É dia de prova! ${race} acontece hoje. Boa sorte com seu elenco!`,
    en: (race: string) => `Race day! ${race} is today. Good luck with your roster!`,
    es: (race: string) => `¡Día de carrera! ${race} es hoy. ¡Buena suerte con tu plantilla!`,
  },
  race_1d: {
    pt: (race: string) => `${race} acontece amanhã. O mercado vai fechar em breve — revise seu elenco!`,
    en: (race: string) => `${race} is tomorrow. The market will close soon — check your roster!`,
    es: (race: string) => `${race} es mañana. El mercado cerrará pronto — ¡revisa tu plantilla!`,
  },
  race_7d: {
    pt: (race: string, days: number) => `${race} acontece em ${days} dias. A lista de inscritos já está disponível!`,
    en: (race: string, days: number) => `${race} is in ${days} days. The startlist is already available!`,
    es: (race: string, days: number) => `${race} es en ${days} días. ¡La lista de participantes ya está disponible!`,
  },
  market_open_title: {
    pt: '📈 Mercado aberto!',
    en: '📈 Market open!',
    es: '📈 ¡Mercado abierto!',
  },
  market_open_body: {
    pt: (race: string) => `A lista de inscritos para ${race} está disponível. Hora de montar seu elenco!`,
    en: (race: string) => `The startlist for ${race} is available. Time to build your roster!`,
    es: (race: string) => `La lista de participantes para ${race} está disponible. ¡Hora de armar tu plantilla!`,
  },
  market_locked_title: {
    pt: '🔒 Mercado fechado!',
    en: '🔒 Market closed!',
    es: '🔒 ¡Mercado cerrado!',
  },
  market_locked_body: {
    pt: (race: string) => `O mercado para ${race} está fechado. Agora é torcer pelos seus atletas!`,
    en: (race: string) => `The market for ${race} is closed. Time to cheer for your athletes!`,
    es: (race: string) => `El mercado para ${race} está cerrado. ¡Ahora a apoyar a tus atletas!`,
  },
  missing_title: {
    pt: '⚠️ Atleta fora da lista!',
    en: '⚠️ Athlete not in startlist!',
    es: '⚠️ ¡Atleta fuera de la lista!',
  },
  missing_body: {
    pt: (names: string, race: string, count: number) =>
      `${names} não ${count === 1 ? 'está' : 'estão'} na startlist de ${race}. Considere trocar!`,
    en: (names: string, race: string, count: number) =>
      `${names} ${count === 1 ? 'is' : 'are'} not in the startlist for ${race}. Consider swapping!`,
    es: (names: string, race: string, count: number) =>
      `${names} no ${count === 1 ? 'está' : 'están'} en la lista de ${race}. ¡Considera hacer un cambio!`,
  },
}

// ── engine ────────────────────────────────────────────────────────────────────

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

  // Fetch locale per user
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, locale')
    .in('id', userIds)

  const localeByUser: Record<string, Locale> = {}
  for (const p of profiles ?? []) {
    localeByUser[p.id] = (p.locale as Locale) ?? 'pt'
  }
  const locale = (uid: string): Locale => localeByUser[uid] ?? 'pt'

  // ── 1. Race Approaching (7d, 1d, Today) ──────────────────────────────────
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
    if (diffDays === 0) type = 'race_today'
    else if (diffDays === 1) type = 'race_1d'
    else if (diffDays <= 7) type = 'race_7d'
    if (!type) continue

    for (const uid of userIds) {
      if (await alreadySent(uid, type, race.id)) continue
      const l = locale(uid)
      const title = T.race_approaching_title[l]
      const body = type === 'race_today'
        ? T.race_today[l](race.name)
        : type === 'race_1d'
          ? T.race_1d[l](race.name)
          : T.race_7d[l](race.name, diffDays)
      await sendToUser(uid, { title, body, url: `/provas/${race.slug}`, tag: `race_${race.id}_${type}` })
      results.push(`${type} → ${uid} → ${race.name}`)
    }
  }

  // ── 2. Market Open / Locked ───────────────────────────────────────────────
  const { data: statusRaces } = await admin
    .from('races')
    .select('id, name, slug, status, race_athletes(athlete_id)')
    .in('status', ['open', 'locked'])

  for (const race of statusRaces ?? []) {
    if ((race.race_athletes?.length ?? 0) === 0) continue
    const type = race.status === 'open' ? 'market_open' : 'market_locked'

    for (const uid of userIds) {
      if (await alreadySent(uid, type, race.id)) continue
      const l = locale(uid)
      const title = race.status === 'open' ? T.market_open_title[l] : T.market_locked_title[l]
      const body = race.status === 'open'
        ? T.market_open_body[l](race.name)
        : T.market_locked_body[l](race.name)
      await sendToUser(uid, { title, body, url: `/atletas`, tag: `${type}_${race.id}` })
      results.push(`${type} → ${uid} → ${race.name}`)
    }
  }

  // ── 3. Athlete missing from startlist ─────────────────────────────────────
  const nextRace = racesWithStartlist[0]
  if (nextRace) {
    const startlistIds = new Set((nextRace as any).race_athletes.map((ra: any) => ra.athlete_id))
    const { data: portfolios } = await admin
      .from('portfolio')
      .select('user_id, athlete_id, athlete:athletes(name)')
      .in('user_id', userIds)

    const byUser: Record<string, any[]> = {}
    portfolios?.forEach(p => {
      if (!byUser[p.user_id]) byUser[p.user_id] = []
      byUser[p.user_id].push({ id: p.athlete_id, name: (p.athlete as any).name })
    })

    for (const uid of userIds) {
      const missing = (byUser[uid] ?? []).filter(a => !startlistIds.has(a.id))
      if (missing.length === 0) continue
      const refId = `${nextRace.id}:${missing.map(a => a.id).sort().join(',')}`
      if (await alreadySent(uid, 'missing_startlist', refId)) continue
      const l = locale(uid)
      const names = missing.map(a => a.name).join(', ')
      await sendToUser(uid, {
        title: T.missing_title[l],
        body: T.missing_body[l](names, nextRace.name, missing.length),
        url: '/elenco',
        tag: `missing_${nextRace.id}`,
      })
      results.push(`missing → ${uid} → ${names}`)
    }
  }

  return { ok: true, sent: results.length, results }
}
