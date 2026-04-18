/**
 * Seed demo: 27 usuários brasileiros simulando rodadas no
 * IRONMAN 70.3 Florianópolis 2026 (finalizado em 13/04/2026).
 *
 * O que este script faz:
 *  1. Garante a prova IRONMAN 70.3 Florianópolis 2026 no banco (finished)
 *  2. Insere 30 atletas realistas (PRO e AG)
 *  3. Cria 27 usuários brasileiros fake
 *  4. Cada usuário monta um time de 5 atletas dentro do orçamento
 *  5. Insere resultados simulados para todos os atletas
 *  6. Calcula Trix Scores para cada time
 *  7. Cria uma "Trix League — Demo Brasil" com todos os usuários
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

// ── helpers ─────────────────────────────────────────────────────────────────
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = (arr) => arr[rnd(0, arr.length - 1)]
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)
const inviteCode = () => Math.random().toString(36).substring(2, 8).toUpperCase()

// ── 1. Prova ─────────────────────────────────────────────────────────────────
const RACE = {
  slug: 'ironman-703-florianopolis-2026',
  name: 'IRONMAN 70.3 Florianópolis',
  location: 'Florianópolis',
  country: 'Brazil',
  date: '2026-04-13',
  distance: '70.3',
  status: 'finished',
  has_pro_field: true,
}
const { data: raceRow, error: raceErr } = await sb.from('races')
  .upsert(RACE, { onConflict: 'slug' })
  .select('id').single()
if (raceErr) { console.error(raceErr); process.exit(1) }
const raceId = raceRow.id
console.log('✓ Prova:', RACE.name, '| ID:', raceId)

// ── 2. Atletas ───────────────────────────────────────────────────────────────
const ATHLETES = [
  // PRO Masculino
  { name: 'Sam Laidlow',         gender: 'M', type: 'pro', country: 'France',        club: 'France Triathlon',   pto_rank: 3  },
  { name: 'Magnus Ditlev',       gender: 'M', type: 'pro', country: 'Denmark',       club: 'Denmark Tri',        pto_rank: 5  },
  { name: 'Kristian Blummenfelt',gender: 'M', type: 'pro', country: 'Norway',        club: 'BTK',                pto_rank: 8  },
  { name: 'Patrick Lange',       gender: 'M', type: 'pro', country: 'Germany',       club: 'Team Patrick Lange', pto_rank: 12 },
  { name: 'Braden Currie',       gender: 'M', type: 'pro', country: 'New Zealand',   club: null,                 pto_rank: 15 },
  // PRO Feminino
  { name: 'Chelsea Sodaro',      gender: 'F', type: 'pro', country: 'United States', club: null,                 pto_rank: 2  },
  { name: 'Laura Philipp',       gender: 'F', type: 'pro', country: 'Germany',       club: null,                 pto_rank: 6  },
  { name: 'Anne Haug',           gender: 'F', type: 'pro', country: 'Germany',       club: null,                 pto_rank: 9  },
  { name: 'Emma Pallant-Browne', gender: 'F', type: 'pro', country: 'United Kingdom',club: null,                 pto_rank: 11 },
  { name: 'Fenella Langridge',   gender: 'F', type: 'pro', country: 'United Kingdom',club: null,                 pto_rank: 18 },
  // AG Masculino
  { name: 'Ricardo Alencar',     gender: 'M', type: 'age_grouper', age_group: 'M35-39', country: 'Brazil', club: 'Treino Total SP'    },
  { name: 'Felipe Mendonça',     gender: 'M', type: 'age_grouper', age_group: 'M40-44', country: 'Brazil', club: 'Treino Total SP'    },
  { name: 'André Queiroz',       gender: 'M', type: 'age_grouper', age_group: 'M30-34', country: 'Brazil', club: 'Equipe Cervejinha'  },
  { name: 'Gustavo Borges Jr',   gender: 'M', type: 'age_grouper', age_group: 'M45-49', country: 'Brazil', club: 'Equipe Cervejinha'  },
  { name: 'Thiago Drummond',     gender: 'M', type: 'age_grouper', age_group: 'M35-39', country: 'Brazil', club: 'Tribe Floripa'      },
  { name: 'Marcelo Tavares',     gender: 'M', type: 'age_grouper', age_group: 'M50-54', country: 'Brazil', club: 'Tribe Floripa'      },
  { name: 'Lucas Becker',        gender: 'M', type: 'age_grouper', age_group: 'M25-29', country: 'Brazil', club: 'Iron Sul'           },
  { name: 'Pedro Cavalcante',    gender: 'M', type: 'age_grouper', age_group: 'M40-44', country: 'Brazil', club: 'Iron Sul'           },
  { name: 'Bruno Salles',        gender: 'M', type: 'age_grouper', age_group: 'M30-34', country: 'Brazil', club: null                 },
  { name: 'Rodrigo Fontes',      gender: 'M', type: 'age_grouper', age_group: 'M35-39', country: 'Brazil', club: null                 },
  // AG Feminino
  { name: 'Camila Borges',       gender: 'F', type: 'age_grouper', age_group: 'F35-39', country: 'Brazil', club: 'Treino Total SP'    },
  { name: 'Aline Figueira',      gender: 'F', type: 'age_grouper', age_group: 'F30-34', country: 'Brazil', club: 'Equipe Cervejinha'  },
  { name: 'Marina Braga',        gender: 'F', type: 'age_grouper', age_group: 'F40-44', country: 'Brazil', club: 'Tribe Floripa'      },
  { name: 'Juliana Lemos',       gender: 'F', type: 'age_grouper', age_group: 'F25-29', country: 'Brazil', club: 'Iron Sul'           },
  { name: 'Fernanda Couto',      gender: 'F', type: 'age_grouper', age_group: 'F45-49', country: 'Brazil', club: null                 },
  { name: 'Beatriz Almada',      gender: 'F', type: 'age_grouper', age_group: 'F30-34', country: 'Brazil', club: null                 },
  // AG Internacional
  { name: 'James Whitfield',     gender: 'M', type: 'age_grouper', age_group: 'M35-39', country: 'United States', club: 'Chicago Tri Club' },
  { name: 'Pierre Moreau',       gender: 'M', type: 'age_grouper', age_group: 'M40-44', country: 'France',         club: 'Paris Triathlon'  },
  { name: 'Sophie Müller',       gender: 'F', type: 'age_grouper', age_group: 'F35-39', country: 'Germany',        club: 'München Tri'      },
  { name: 'Carlos Ramírez',      gender: 'M', type: 'age_grouper', age_group: 'M30-34', country: 'Colombia',       club: null               },
]

// Upsert athletes
const { data: athleteRows, error: athErr } = await sb.from('athletes')
  .upsert(ATHLETES.map(a => ({ ...a, age_group: a.age_group ?? null, pto_rank: a.pto_rank ?? null, club: a.club ?? null })), { onConflict: 'name,gender,type' })
  .select('id, name, type, gender, age_group, club')
if (athErr) { console.error(athErr); process.exit(1) }
console.log('✓ Atletas:', athleteRows.length)

// Preços por tipo
const priceMap = { 'Sam Laidlow': 22, 'Magnus Ditlev': 20, 'Kristian Blummenfelt': 18, 'Patrick Lange': 16, 'Braden Currie': 14,
  'Chelsea Sodaro': 20, 'Laura Philipp': 18, 'Anne Haug': 16, 'Emma Pallant-Browne': 14, 'Fenella Langridge': 12 }
const agPrice = (ag) => {
  const bracket = ag?.match(/\d+/)?.[0]
  if (!bracket) return 8
  const age = parseInt(bracket)
  if (age <= 29) return 10
  if (age <= 34) return 9
  if (age <= 39) return 8
  if (age <= 44) return 7
  return 6
}
const getPrice = (a) => priceMap[a.name] ?? agPrice(a.age_group)

// Upsert race_athletes
const raRows = athleteRows.map(a => ({ race_id: raceId, athlete_id: a.id, bib: rnd(1, 999), price: getPrice(a) }))
const { data: raceAthletes, error: raErr } = await sb.from('race_athletes')
  .upsert(raRows, { onConflict: 'race_id,athlete_id' })
  .select('id, athlete_id, price')
if (raErr) { console.error(raErr); process.exit(1) }
console.log('✓ Race athletes:', raceAthletes.length)

// ── 3. Resultados simulados ───────────────────────────────────────────────────
// Tempos base para 70.3 (em segundos): swim ~30min, bike ~2h30, run ~1h30
const baseSwim = 1800, baseBike = 9000, baseRun = 5400

// PRO times (mais rápidos)
const proMResults = ['Sam Laidlow','Magnus Ditlev','Kristian Blummenfelt','Patrick Lange','Braden Currie']
  .map((name, i) => {
    const a = athleteRows.find(x => x.name === name)
    const swim = baseSwim * 0.62 + rnd(0, 120) + i * 30
    const bike  = baseBike * 0.68 + rnd(0, 300) + i * 60
    const run   = baseRun  * 0.72 + rnd(0, 180) + i * 45
    return { race_id: raceId, athlete_id: a.id, swim_time: Math.round(swim), bike_time: Math.round(bike), run_time: Math.round(run), finish_time: Math.round(swim+bike+run+300), overall_pos: i+1, pro_pos: i+1, ag_pos: null, kona_slot: false, dnf: false }
  })

const proFResults = ['Chelsea Sodaro','Laura Philipp','Anne Haug','Emma Pallant-Browne','Fenella Langridge']
  .map((name, i) => {
    const a = athleteRows.find(x => x.name === name)
    const swim = baseSwim * 0.68 + rnd(0, 120) + i * 30
    const bike  = baseBike * 0.78 + rnd(0, 300) + i * 60
    const run   = baseRun  * 0.80 + rnd(0, 180) + i * 45
    return { race_id: raceId, athlete_id: a.id, swim_time: Math.round(swim), bike_time: Math.round(bike), run_time: Math.round(run), finish_time: Math.round(swim+bike+run+300), overall_pos: i+1, pro_pos: i+1, ag_pos: null, kona_slot: false, dnf: false }
  })

// AG times — cada AG separado
const agAthletes = athleteRows.filter(a => a.type === 'age_grouper')
const agGroups = {}
for (const a of agAthletes) {
  const key = `${a.gender}-${a.age_group}`
  agGroups[key] = agGroups[key] ?? []
  agGroups[key].push(a)
}

const agResults = []
for (const [, group] of Object.entries(agGroups)) {
  const shuffled = shuffle(group)
  shuffled.forEach((a, i) => {
    const swim = baseSwim * (1 + rnd(10, 40) / 100) + i * 60
    const bike  = baseBike * (1 + rnd(10, 40) / 100) + i * 120
    const run   = baseRun  * (1 + rnd(10, 40) / 100) + i * 90
    const kona_slot = i === 0 && Math.random() > 0.4
    agResults.push({ race_id: raceId, athlete_id: a.id, swim_time: Math.round(swim), bike_time: Math.round(bike), run_time: Math.round(run), finish_time: Math.round(swim+bike+run+300), overall_pos: null, pro_pos: null, ag_pos: i+1, kona_slot, dnf: false })
  })
}

const allResults = [...proMResults, ...proFResults, ...agResults]
const { error: resErr } = await sb.from('results').upsert(allResults, { onConflict: 'race_id,athlete_id' })
if (resErr) { console.error(resErr); process.exit(1) }
console.log('✓ Resultados:', allResults.length)

// ── 4. Usuários brasileiros ───────────────────────────────────────────────────
const NOMES = [
  ['João','Silva'],['Pedro','Santos'],['Lucas','Oliveira'],['Gabriel','Souza'],['Matheus','Costa'],
  ['Rafael','Ferreira'],['Bruno','Lima'],['Diego','Alves'],['Thiago','Rodrigues'],['Felipe','Nascimento'],
  ['André','Carvalho'],['Guilherme','Melo'],['Henrique','Barbosa'],['Eduardo','Rocha'],['Caio','Gomes'],
  ['Victor','Martins'],['Igor','Araújo'],['Leandro','Mendes'],['Renato','Freitas'],['Fábio','Cardoso'],
  ['Ana','Silva'],['Juliana','Santos'],['Mariana','Lima'],['Fernanda','Costa'],['Camila','Oliveira'],
  ['Beatriz','Souza'],['Larissa','Ferreira'],
]

console.log('→ Criando usuários...')
const userIds = []
for (const [first, last] of NOMES) {
  const email = `${first.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'')}.${last.toLowerCase()}@trixer-demo.com`
  const { data: existing } = await sb.auth.admin.listUsers()
  const found = existing?.users?.find(u => u.email === email)
  if (found) {
    userIds.push(found.id)
    continue
  }
  const { data, error } = await sb.auth.admin.createUser({ email, password: 'Demo@2026', email_confirm: true, user_metadata: { name: `${first} ${last}` } })
  if (error) { console.error('User error:', email, error.message); continue }
  userIds.push(data.user.id)

  // Perfil
  await sb.from('profiles').upsert({ id: data.user.id, display_name: `${first} ${last}`, is_admin: false }, { onConflict: 'id' })
}
console.log('✓ Usuários criados:', userIds.length)

// ── 5. Times ─────────────────────────────────────────────────────────────────
// Separa atletas por tipo para facilitar seleção
const pros = raceAthletes.filter(ra => {
  const a = athleteRows.find(x => x.id === ra.athlete_id)
  return a?.type === 'pro'
})
const ags = raceAthletes.filter(ra => {
  const a = athleteRows.find(x => x.id === ra.athlete_id)
  return a?.type === 'age_grouper'
})

function buildTeam() {
  const BUDGET = 100, SIZE = 5, MAX_CLUB = 2
  const picked = []
  const clubCount = {}
  let budget = BUDGET

  // Estratégia aleatória: 0-2 PROs + resto AG
  const numPros = rnd(0, 2)
  const proPool = shuffle(pros)
  const agPool = shuffle(ags)

  for (const ra of proPool) {
    if (picked.length >= numPros) break
    if (ra.price > budget) continue
    const a = athleteRows.find(x => x.id === ra.athlete_id)
    const club = a?.club ?? '__solo__'
    if ((clubCount[club] ?? 0) >= MAX_CLUB) continue
    picked.push(ra)
    clubCount[club] = (clubCount[club] ?? 0) + 1
    budget -= ra.price
  }

  for (const ra of agPool) {
    if (picked.length >= SIZE) break
    if (ra.price > budget) continue
    const a = athleteRows.find(x => x.id === ra.athlete_id)
    const club = a?.club ?? '__solo__'
    if ((clubCount[club] ?? 0) >= MAX_CLUB) continue
    picked.push(ra)
    clubCount[club] = (clubCount[club] ?? 0) + 1
    budget -= ra.price
  }

  return picked.slice(0, SIZE).map(ra => ra.athlete_id)
}

for (const userId of userIds) {
  const athleteIds = buildTeam()
  if (athleteIds.length < 5) continue

  const { data: team, error: tErr } = await sb.from('teams')
    .upsert({ user_id: userId, race_id: raceId }, { onConflict: 'user_id,race_id' })
    .select('id').single()
  if (tErr) continue

  await sb.from('team_athletes').delete().eq('team_id', team.id)
  await sb.from('team_athletes').insert(athleteIds.map(aid => ({ team_id: team.id, athlete_id: aid })))
}
console.log('✓ Times criados:', userIds.length)

// ── 6. Calcula Trix Scores ─────────────────────────────────────────────────────
const PRO_POINTS = { 1:50,2:40,3:33,4:27,5:22,6:15,7:15,8:15,9:15,10:15 }
const getProPoints = (pos) => pos <= 10 ? PRO_POINTS[pos] : pos <= 15 ? 10 : pos <= 20 ? 6 : 3

function getAgPoints(pos, total) {
  if (pos === 1) return 30
  if (pos === 2) return 24
  if (pos === 3) return 19
  if (pos <= 10) return 13
  if (pos <= total * 0.25) return 8
  if (pos <= total * 0.50) return 5
  if (pos <= total * 0.75) return 2
  return 1
}

// Segmentos mais rápidos
const swimFastestPro = Math.min(...proMResults.map(r=>r.swim_time), ...proFResults.map(r=>r.swim_time))
const bikeFastestPro = Math.min(...proMResults.map(r=>r.bike_time), ...proFResults.map(r=>r.bike_time))
const runFastestPro  = Math.min(...proMResults.map(r=>r.run_time),  ...proFResults.map(r=>r.run_time))
const swimFastestAG  = Math.min(...agResults.map(r=>r.swim_time))
const bikeFastestAG  = Math.min(...agResults.map(r=>r.bike_time))
const runFastestAG   = Math.min(...agResults.map(r=>r.run_time))

const agGroupSizes = {}
for (const a of agAthletes) {
  const key = `${a.gender}-${a.age_group}`
  agGroupSizes[key] = (agGroupSizes[key] ?? 0) + 1
}

function scoreAthlete(athleteId) {
  const result = allResults.find(r => r.athlete_id === athleteId)
  if (!result || result.dnf) return 0
  const a = athleteRows.find(x => x.id === athleteId)
  let pts = 0

  if (a.type === 'pro') {
    pts = getProPoints(result.overall_pos ?? 99)
    if (result.swim_time === swimFastestPro) pts += 6
    if (result.bike_time === bikeFastestPro) pts += 6
    if (result.run_time  === runFastestPro)  pts += 6
  } else {
    const key = `${a.gender}-${a.age_group}`
    pts = getAgPoints(result.ag_pos ?? 99, agGroupSizes[key] ?? 1)
    if (result.swim_time === swimFastestAG) pts += 4
    if (result.bike_time === bikeFastestAG) pts += 4
    if (result.run_time  === runFastestAG)  pts += 4
    if (result.kona_slot) pts += 8
  }
  return pts
}

const { data: teams } = await sb.from('teams').select('id, user_id, team_athletes(athlete_id)').eq('race_id', raceId)
const scoreRows = []
for (const team of (teams ?? [])) {
  const athleteIds = (team.team_athletes).map(ta => ta.athlete_id)
  const breakdown = {}
  let total = 0
  for (const aid of athleteIds) {
    const pts = scoreAthlete(aid)
    breakdown[aid] = pts
    total += pts
  }
  scoreRows.push({ team_id: team.id, total_points: total, breakdown, _user_id: team.user_id })
}

const dbRows = scoreRows.map(({_user_id, ...r}) => r)
const { error: scoreErr } = await sb.from('scores').upsert(dbRows, { onConflict: 'team_id' })
if (scoreErr) { console.error(scoreErr); process.exit(1) }
console.log('✓ Trix Scores calculados:', scoreRows.length)

// Exibe top 5
const sorted = scoreRows.sort((a, b) => b.total_points - a.total_points)
console.log('\n🏆 Top 5 Trix Rank:')
for (const s of sorted.slice(0, 5)) {
  const user = NOMES[userIds.indexOf(s._user_id)]
  console.log(`  ${user?.[0]} ${user?.[1]} — ${s.total_points} pts`)
}

// ── 7. Liga demo ────────────────────────────────────────────────────────────────
const { data: league, error: ligaErr } = await sb.from('leagues')
  .upsert({ name: 'Liga Demo Brasil 2026', race_id: raceId, invite_code: inviteCode(), created_by: userIds[0] }, { onConflict: 'invite_code' })
  .select('id').single()
if (!ligaErr && league) {
  await sb.from('league_members').upsert(
    userIds.map(uid => ({ league_id: league.id, user_id: uid })),
    { onConflict: 'league_id,user_id' }
  )
  console.log('\n✓ Liga Demo Brasil 2026 criada com', userIds.length, 'participantes')
}

console.log('\n✅ Demo concluído!')
console.log('   Prova:', RACE.name)
console.log('   Atletas:', athleteRows.length)
console.log('   Usuários:', userIds.length)
console.log('   Times:', scoreRows.length)
