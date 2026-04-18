/**
 * Demo: 26 usuários brasileiros simulando o
 * IRONMAN 70.3 Curitiba 2026 — 08/03/2026 (finalizado).
 *
 * PROs reais com resultados reais da prova.
 * AGs brasileiros simulados com tempos realistas.
 *
 * Run: node scripts/seed-demo-curitiba.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)
const inviteCode = () => Math.random().toString(36).substring(2, 8).toUpperCase()

// ── 1. Prova ──────────────────────────────────────────────────────────────────
const { data: race, error: raceErr } = await sb.from('races')
  .upsert({
    slug: 'ironman-703-curitiba-2026',
    name: 'IRONMAN 70.3 Curitiba',
    location: 'Curitiba',
    country: 'Brazil',
    date: '2026-03-08',
    distance: '70.3',
    status: 'finished',
    has_pro_field: true,
  }, { onConflict: 'slug' })
  .select('id').single()

if (raceErr) { console.error(raceErr); process.exit(1) }
const raceId = race.id
console.log('✓ Prova: IRONMAN 70.3 Curitiba 2026 | ID:', raceId)

// ── 2. Atletas ────────────────────────────────────────────────────────────────
// PROs reais (resultados reais da prova)
const PRO_M = [
  { name: 'Fernando Toldi',            gender: 'M', country: 'Brazil',  finish: '3:53:05', swim: 1298, bike: 7812, run: 4615 },
  { name: 'Reinaldo Colucci',          gender: 'M', country: 'Brazil',  finish: '3:55:27', swim: 1310, bike: 7860, run: 4657 },
  { name: 'Enzo Krauss',               gender: 'M', country: 'Brazil',  finish: '3:57:49', swim: 1320, bike: 7950, run: 4679 },
  { name: 'Danilo Pimentel',           gender: 'M', country: 'Brazil',  finish: '4:01:11', swim: 1350, bike: 8020, run: 4741 },
  { name: 'Gabriel Klein',             gender: 'M', country: 'Brazil',  finish: '4:01:54', swim: 1345, bike: 8040, run: 4769 },
  { name: 'Yago Rodrigues',            gender: 'M', country: 'Brazil',  finish: '4:08:36', swim: 1380, bike: 8220, run: 4836 },
  { name: 'Alexandre Stocco',          gender: 'M', country: 'Brazil',  finish: '4:11:44', swim: 1395, bike: 8310, run: 4859 },
  { name: 'Miguel Hidalgo',            gender: 'M', country: 'Mexico',  finish: '4:14:16', swim: 1400, bike: 8390, run: 4866 },
  { name: 'Vicente Saraiva Junior',    gender: 'M', country: 'Brazil',  finish: '4:18:15', swim: 1420, bike: 8460, run: 4935 },
  { name: 'Danilo Melo',               gender: 'M', country: 'Brazil',  finish: '4:20:11', swim: 1430, bike: 8500, run: 4981 },
]
const PRO_F = [
  { name: 'Pamella Oliveira',          gender: 'F', country: 'Brazil',  finish: '4:31:28', swim: 1510, bike: 9200, run: 5178 },
  { name: 'Pietra Picolo Meneghini',   gender: 'F', country: 'Brazil',  finish: '4:40:22', swim: 1560, bike: 9420, run: 5282 },
  { name: 'Giovanna Alves Opipari',    gender: 'F', country: 'Brazil',  finish: '4:48:41', swim: 1590, bike: 9590, run: 5381 },
  { name: 'Mariana Andrade',           gender: 'F', country: 'Brazil',  finish: '4:49:09', swim: 1595, bike: 9600, run: 5374 },
  { name: 'Fernanda Penkal',           gender: 'F', country: 'Brazil',  finish: '4:58:42', swim: 1650, bike: 9820, run: 5512 },
  { name: 'Aurelia Boulanger',         gender: 'F', country: 'France',  finish: null,      swim: null, bike: null, run: null, dnf: true },
]

// AGs brasileiros — times realistas para 70.3 (4h30 a 7h30)
const AG_M = [
  { name: 'Ricardo Alencar',    gender: 'M', age_group: 'M35-39', country: 'Brazil', club: 'Treino Total SP',   swim: 2100, bike: 10800, run: 6300 },
  { name: 'Felipe Mendonça',    gender: 'M', age_group: 'M40-44', country: 'Brazil', club: 'Treino Total SP',   swim: 2250, bike: 11400, run: 6600 },
  { name: 'André Queiroz',      gender: 'M', age_group: 'M30-34', country: 'Brazil', club: 'Equipe Cervejinha', swim: 1980, bike: 10200, run: 6000 },
  { name: 'Gustavo Borges Jr',  gender: 'M', age_group: 'M45-49', country: 'Brazil', club: 'Equipe Cervejinha', swim: 2400, bike: 11800, run: 7200 },
  { name: 'Thiago Drummond',    gender: 'M', age_group: 'M35-39', country: 'Brazil', club: 'Tribe Curitiba',    swim: 2050, bike: 10600, run: 6150 },
  { name: 'Marcelo Tavares',    gender: 'M', age_group: 'M50-54', country: 'Brazil', club: 'Tribe Curitiba',    swim: 2550, bike: 12200, run: 7500 },
  { name: 'Lucas Becker',       gender: 'M', age_group: 'M25-29', country: 'Brazil', club: 'Iron Sul',          swim: 1850, bike: 9900,  run: 5850 },
  { name: 'Pedro Cavalcante',   gender: 'M', age_group: 'M40-44', country: 'Brazil', club: 'Iron Sul',          swim: 2300, bike: 11600, run: 6900 },
  { name: 'Bruno Salles',       gender: 'M', age_group: 'M30-34', country: 'Brazil', club: null,                swim: 2080, bike: 10500, run: 6200 },
  { name: 'Rodrigo Fontes',     gender: 'M', age_group: 'M35-39', country: 'Brazil', club: null,                swim: 2200, bike: 11000, run: 6450 },
]
const AG_F = [
  { name: 'Camila Borges',      gender: 'F', age_group: 'F35-39', country: 'Brazil', club: 'Treino Total SP',   swim: 2200, bike: 11800, run: 6900 },
  { name: 'Aline Figueira',     gender: 'F', age_group: 'F30-34', country: 'Brazil', club: 'Equipe Cervejinha', swim: 2100, bike: 11400, run: 6600 },
  { name: 'Marina Braga',       gender: 'F', age_group: 'F40-44', country: 'Brazil', club: 'Tribe Curitiba',    swim: 2350, bike: 12200, run: 7200 },
  { name: 'Juliana Lemos',      gender: 'F', age_group: 'F25-29', country: 'Brazil', club: 'Iron Sul',          swim: 1980, bike: 11000, run: 6400 },
  { name: 'Fernanda Couto',     gender: 'F', age_group: 'F45-49', country: 'Brazil', club: null,                swim: 2500, bike: 12600, run: 7500 },
  { name: 'Beatriz Almada',     gender: 'F', age_group: 'F30-34', country: 'Brazil', club: null,                swim: 2050, bike: 11200, run: 6500 },
]

const allAthletes = [
  ...PRO_M.map(a => ({ ...a, type: 'pro', age_group: null, club: null, pto_rank: null })),
  ...PRO_F.map(a => ({ ...a, type: 'pro', age_group: null, club: null, pto_rank: null })),
  ...AG_M.map(a => ({ ...a, type: 'age_grouper', pto_rank: null })),
  ...AG_F.map(a => ({ ...a, type: 'age_grouper', pto_rank: null })),
]

const { data: athleteRows, error: athErr } = await sb.from('athletes')
  .upsert(allAthletes.map(({ swim, bike, run, finish, dnf, ...a }) => ({
    ...a, club: a.club ?? null, age_group: a.age_group ?? null,
  })), { onConflict: 'name,gender,type' })
  .select('id, name, type, gender, age_group, club, current_price')
if (athErr) { console.error(athErr); process.exit(1) }
console.log('✓ Atletas:', athleteRows.length)

// Preços dos race_athletes
function price(name) {
  const proMPrices = { 'Fernando Toldi': 22, 'Reinaldo Colucci': 18, 'Enzo Krauss': 16, 'Danilo Pimentel': 14, 'Gabriel Klein': 13,
    'Yago Rodrigues': 11, 'Alexandre Stocco': 10, 'Miguel Hidalgo': 10, 'Vicente Saraiva Junior': 9, 'Danilo Melo': 8 }
  const proFPrices = { 'Pamella Oliveira': 20, 'Pietra Picolo Meneghini': 15, 'Giovanna Alves Opipari': 13,
    'Mariana Andrade': 12, 'Fernanda Penkal': 10, 'Aurelia Boulanger': 14 }
  return proMPrices[name] ?? proFPrices[name] ?? rnd(6, 10)
}

const raRows = athleteRows.map((a, i) => ({
  race_id: raceId, athlete_id: a.id, bib: i + 1, price: price(a.name),
}))
const { data: raceAthletes, error: raErr } = await sb.from('race_athletes')
  .upsert(raRows, { onConflict: 'race_id,athlete_id' })
  .select('id, athlete_id, price')
if (raErr) { console.error(raErr); process.exit(1) }
console.log('✓ Race athletes:', raceAthletes.length)

// ── 3. Resultados ─────────────────────────────────────────────────────────────
// Helper: converte string "H:MM:SS" → segundos totais
function hms(s) {
  if (!s) return null
  const [h, m, sec] = s.split(':').map(Number)
  return h * 3600 + m * 60 + sec
}

// PRO M — resultados reais
const proMResults = PRO_M.map((a, i) => {
  const athlete = athleteRows.find(x => x.name === a.name)
  const t1 = 120, t2 = 90
  return {
    race_id: raceId, athlete_id: athlete.id,
    swim_time: a.swim, bike_time: a.bike, run_time: a.run,
    t1_time: t1, t2_time: t2,
    finish_time: hms(a.finish),
    pro_pos: i + 1, overall_pos: i + 1, ag_pos: null,
    kona_slot: false, dnf: false, dns: false,
  }
})

// PRO F — resultados reais (Aurelia DNF)
const proFResults = PRO_F.map((a, i) => {
  const athlete = athleteRows.find(x => x.name === a.name)
  const t1 = 130, t2 = 100
  if (a.dnf) {
    return { race_id: raceId, athlete_id: athlete.id, dnf: true, dns: false, swim_time: null, bike_time: null, run_time: null, t1_time: null, t2_time: null, finish_time: null, pro_pos: null, overall_pos: null, ag_pos: null, kona_slot: false }
  }
  return {
    race_id: raceId, athlete_id: athlete.id,
    swim_time: a.swim, bike_time: a.bike, run_time: a.run,
    t1_time: t1, t2_time: t2,
    finish_time: hms(a.finish),
    pro_pos: i + 1, overall_pos: i + 1, ag_pos: null,
    kona_slot: i === 0, // Pamella ganhou slot
    dnf: false, dns: false,
  }
})

// AGs — grupos separados, posição dentro do AG
const agGroups = {}
for (const a of [...AG_M, ...AG_F]) {
  const key = `${a.gender}-${a.age_group}`
  agGroups[key] = agGroups[key] ?? []
  agGroups[key].push(a)
}

const agResults = []
for (const [, group] of Object.entries(agGroups)) {
  // Pequena variação nos tempos
  const sorted = group.map(a => ({
    ...a,
    swimT: a.swim + rnd(-60, 60),
    bikeT: a.bike + rnd(-180, 180),
    runT:  a.run  + rnd(-120, 120),
  })).sort((a, b) => (a.swimT + a.bikeT + a.runT) - (b.swimT + b.bikeT + b.runT))

  sorted.forEach((a, i) => {
    const athlete = athleteRows.find(x => x.name === a.name)
    const t1 = 150, t2 = 110
    const finish = a.swimT + t1 + a.bikeT + t2 + a.runT
    const konaSlot = i === 0 && a.gender === 'M' && Math.random() > 0.5
    agResults.push({
      race_id: raceId, athlete_id: athlete.id,
      swim_time: a.swimT, bike_time: a.bikeT, run_time: a.runT,
      t1_time: t1, t2_time: t2, finish_time: finish,
      ag_pos: i + 1, pro_pos: null, overall_pos: null,
      kona_slot: konaSlot, dnf: false, dns: false,
    })
  })
}

const allResults = [...proMResults, ...proFResults, ...agResults]
const { error: resErr } = await sb.from('results').upsert(allResults, { onConflict: 'race_id,athlete_id' })
if (resErr) { console.error(resErr); process.exit(1) }
console.log('✓ Resultados:', allResults.length, '(PROs reais + AGs simulados)')

// ── 4. Usuários brasileiros ───────────────────────────────────────────────────
const NOMES = [
  ['Joao','Silva'],['Pedro','Santos'],['Lucas','Oliveira'],['Gabriel','Souza'],['Matheus','Costa'],
  ['Rafael','Ferreira'],['Bruno','Lima'],['Diego','Alves'],['Thiago','Rodrigues'],['Felipe','Nascimento'],
  ['Andre','Carvalho'],['Guilherme','Melo'],['Henrique','Barbosa'],['Eduardo','Rocha'],['Caio','Gomes'],
  ['Victor','Martins'],['Igor','Araujo'],['Leandro','Mendes'],['Renato','Freitas'],['Fabio','Cardoso'],
  ['Ana','Silva'],['Juliana','Santos'],['Mariana','Lima'],['Fernanda','Costa'],['Camila','Oliveira'],
  ['Beatriz','Souza'],
]

console.log('→ Criando usuários...')
const userIds = []
for (const [first, last] of NOMES) {
  const email = `${first.toLowerCase()}.${last.toLowerCase()}@trixer-demo.com`
  const { data: existing } = await sb.auth.admin.listUsers()
  const found = existing?.users?.find(u => u.email === email)
  if (found) {
    userIds.push(found.id)
    await sb.from('profiles').upsert({ id: found.id, display_name: `${first} ${last}`, is_admin: false }, { onConflict: 'id' })
    continue
  }
  const { data, error } = await sb.auth.admin.createUser({
    email, password: 'Demo@2026', email_confirm: true, user_metadata: { name: `${first} ${last}` },
  })
  if (error) { console.error('Erro user:', email, error.message); continue }
  userIds.push(data.user.id)
  await sb.from('profiles').upsert({ id: data.user.id, display_name: `${first} ${last}`, is_admin: false }, { onConflict: 'id' })
}
console.log('✓ Usuários:', userIds.length)

// ── 5. Times ──────────────────────────────────────────────────────────────────
const pros = raceAthletes.filter(ra => athleteRows.find(x => x.id === ra.athlete_id)?.type === 'pro')
const ags  = raceAthletes.filter(ra => athleteRows.find(x => x.id === ra.athlete_id)?.type === 'age_grouper')

function buildTeam() {
  const BUDGET = 100, SIZE = 5, MAX_CLUB = 2
  const picked = []
  const clubs = {}
  let budget = BUDGET
  const numPros = rnd(0, 2)

  for (const ra of shuffle(pros)) {
    if (picked.length >= numPros) break
    if (ra.price > budget) continue
    const a = athleteRows.find(x => x.id === ra.athlete_id)
    const club = a?.club ?? '__solo__'
    if ((clubs[club] ?? 0) >= MAX_CLUB) continue
    picked.push(ra); clubs[club] = (clubs[club] ?? 0) + 1; budget -= ra.price
  }
  for (const ra of shuffle(ags)) {
    if (picked.length >= SIZE) break
    if (ra.price > budget) continue
    const a = athleteRows.find(x => x.id === ra.athlete_id)
    const club = a?.club ?? '__solo__'
    if ((clubs[club] ?? 0) >= MAX_CLUB) continue
    picked.push(ra); clubs[club] = (clubs[club] ?? 0) + 1; budget -= ra.price
  }
  return picked.slice(0, SIZE).map(ra => ra.athlete_id)
}

for (const userId of userIds) {
  const athleteIds = buildTeam()
  if (athleteIds.length < 5) { console.log('Time incompleto para', userId); continue }
  const { data: team, error: tErr } = await sb.from('teams')
    .upsert({ user_id: userId, race_id: raceId }, { onConflict: 'user_id,race_id' })
    .select('id').single()
  if (tErr) { console.error(tErr); continue }
  await sb.from('team_athletes').delete().eq('team_id', team.id)
  await sb.from('team_athletes').insert(athleteIds.map(aid => ({ team_id: team.id, athlete_id: aid })))
}
console.log('✓ Times:', userIds.length)

// ── 6. Trix Score ─────────────────────────────────────────────────────────────
const PRO_PTS = { 1:50,2:40,3:33,4:27,5:22,6:15,7:15,8:15,9:15,10:15 }
const getProPts = (pos) => PRO_PTS[pos] ?? (pos <= 20 ? 8 : 3)
function getAgPts(pos, total) {
  if (pos===1) return 30; if (pos===2) return 24; if (pos===3) return 19
  if (pos<=10) return 13
  const p = pos/total
  if (p<=0.25) return 8; if (p<=0.50) return 5; if (p<=0.75) return 2
  return 1
}

const agGroupSizes = {}
for (const r of agResults) {
  const a = athleteRows.find(x => x.id === r.athlete_id)
  const key = `${a.gender}-${a.age_group}`
  agGroupSizes[key] = (agGroupSizes[key] ?? 0) + 1
}

const finishers = allResults.filter(r => !r.dnf && !r.dns)
const proFinishers = finishers.filter(r => athleteRows.find(x=>x.id===r.athlete_id)?.type==='pro')
const agFinishers  = finishers.filter(r => athleteRows.find(x=>x.id===r.athlete_id)?.type==='age_grouper')
const bestSwimPro = Math.min(...proFinishers.map(r=>r.swim_time))
const bestBikePro = Math.min(...proFinishers.map(r=>r.bike_time))
const bestRunPro  = Math.min(...proFinishers.map(r=>r.run_time))
const bestSwimAg  = Math.min(...agFinishers.map(r=>r.swim_time))
const bestBikeAg  = Math.min(...agFinishers.map(r=>r.bike_time))
const bestRunAg   = Math.min(...agFinishers.map(r=>r.run_time))

function scoreAthlete(athleteId) {
  const r = allResults.find(x => x.athlete_id === athleteId)
  if (!r || r.dnf || r.dns) return 0
  const a = athleteRows.find(x => x.id === athleteId)
  let pts = 0
  if (a.type === 'pro') {
    pts = getProPts(r.pro_pos ?? 99)
    if (r.swim_time === bestSwimPro) pts += 6
    if (r.bike_time === bestBikePro) pts += 6
    if (r.run_time  === bestRunPro)  pts += 6
    if (r.kona_slot) pts += 10
  } else {
    const key = `${a.gender}-${a.age_group}`
    pts = getAgPts(r.ag_pos ?? 99, agGroupSizes[key] ?? 1)
    if (r.swim_time === bestSwimAg) pts += 4
    if (r.bike_time === bestBikeAg) pts += 4
    if (r.run_time  === bestRunAg)  pts += 4
    if (r.kona_slot) pts += 8
  }
  return pts
}

const { data: teams } = await sb.from('teams').select('id, user_id, team_athletes(athlete_id)').eq('race_id', raceId)
const scoreRows = []
for (const team of (teams ?? [])) {
  const aids = team.team_athletes.map(ta => ta.athlete_id)
  let total = 0
  const breakdown = {}
  for (const aid of aids) {
    const pts = scoreAthlete(aid)
    breakdown[aid] = pts
    total += pts
  }
  scoreRows.push({ team_id: team.id, total_points: total, breakdown, _uid: team.user_id })
}
const { error: scoreErr } = await sb.from('scores')
  .upsert(scoreRows.map(({_uid,...r})=>r), { onConflict: 'team_id' })
if (scoreErr) { console.error(scoreErr); process.exit(1) }
console.log('✓ Trix Scores:', scoreRows.length)

const sorted = [...scoreRows].sort((a,b) => b.total_points - a.total_points)
console.log('\n🏆 Trix Rank — Top 5:')
sorted.slice(0,5).forEach((s, i) => {
  const user = NOMES[userIds.indexOf(s._uid)]
  console.log(`  ${i+1}. ${user?.[0]} ${user?.[1]} — ${s.total_points} pts`)
})

// ── 7. Trix League demo ───────────────────────────────────────────────────────
const { data: league } = await sb.from('leagues')
  .upsert({ name: 'Trix League — Brasil Curitiba 2026', race_id: raceId, invite_code: inviteCode(), created_by: userIds[0] }, { onConflict: 'invite_code' })
  .select('id').single()
if (league) {
  await sb.from('league_members').upsert(
    userIds.map(uid => ({ league_id: league.id, user_id: uid })),
    { onConflict: 'league_id,user_id' }
  )
  console.log(`\n✓ Trix League criada com ${userIds.length} Trixers`)
}

console.log('\n✅ Demo Curitiba concluído!')
