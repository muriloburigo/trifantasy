/**
 * Insert IRONMAN 70.3 Pennsylvania Happy Valley 2026 — MPRO results
 * Run: node --env-file=.env.production.local scripts/insert-pennsylvania-703-2026-mpro-results.mjs
 *
 * Segmentos mais rápidos:
 *   Swim: Morgan Pearson (23:15)
 *   Bike: Sam Long (2:02:57)
 *   Run:  Ben Randall (1:08:10)
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { applyProMarketUpdates, printMarketLog } from './lib/market-utils.mjs'

function getEnv(k) {
  if (process.env[k]) return process.env[k]
  for (const f of ['.env.production.local', '.env.local']) {
    const path = resolve(process.cwd(), f)
    if (existsSync(path)) {
      const m = readFileSync(path, 'utf8').match(new RegExp(`^${k}="?([^"\\n]+)`, 'm'))
      if (m) return m[1].replace(/\\n$/, '').trim()
    }
  }
  return null
}

const sb = createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'))

// ── Race ──────────────────────────────────────────────────────────────────────
const RACE_ID = 'd65468d9-4b1b-42b2-88e0-eca19a1bb6b8'
const { data: race, error: raceErr } = await sb
  .from('races').select('id, name, status').eq('id', RACE_ID).single()
if (raceErr || !race) { console.error('❌ Race não encontrada:', raceErr); process.exit(1) }
console.log(`🏁 Race: ${race.name} (${race.id}) — status: ${race.status}`)

// ── Results (tempos em segundos) ──────────────────────────────────────────────
// Swim e Run em MM:SS → segundos | Bike em H:MM:SS → segundos
const RESULTS = [
  // Finishers
  { name: 'Trevor Foley',              pos:  1, swim: 1542, t1: 141, bike: 7406, t2:  68, run: 4190, total: 13345, dnf: false, dns: false },
  { name: 'Sam Long',                  pos:  2, swim: 1583, t1: 125, bike: 7377, t2:  58, run: 4274, total: 13415, dnf: false, dns: false },
  { name: 'Jason West',                pos:  3, swim: 1460, t1: 129, bike: 7617, t2:  62, run: 4211, total: 13478, dnf: false, dns: false },
  { name: 'Matthew Marquardt',         pos:  4, swim: 1454, t1: 133, bike: 7468, t2:  74, run: 4434, total: 13562, dnf: false, dns: false },
  { name: 'Marc Dubrick',              pos:  5, swim: 1399, t1: 122, bike: 7572, t2:  75, run: 4455, total: 13622, dnf: false, dns: false },
  { name: 'Rasmus Svenningsson',       pos:  6, swim: 1547, t1: 139, bike: 7392, t2:  91, run: 4545, total: 13712, dnf: false, dns: false },
  { name: 'Blake Harris',              pos:  7, swim: 1499, t1: 127, bike: 7768, t2:  84, run: 4257, total: 13732, dnf: false, dns: false },
  { name: 'Luke Jones',                pos:  8, swim: 1491, t1: 145, bike: 7657, t2:  83, run: 4414, total: 13789, dnf: false, dns: false },
  { name: 'Justin Riele',              pos:  9, swim: 1497, t1: 137, bike: 7447, t2:  92, run: 4638, total: 13810, dnf: false, dns: false },
  { name: 'Ben Kanute',                pos: 10, swim: 1397, t1: 129, bike: 7626, t2:  68, run: 4705, total: 13923, dnf: false, dns: false },
  { name: 'Morgan Pearson',            pos: 11, swim: 1395, t1: 126, bike: 8127, t2:  74, run: 4267, total: 13987, dnf: false, dns: false },
  { name: 'Matt Hanson',               pos: 12, swim: 1549, t1: 139, bike: 7969, t2:  67, run: 4299, total: 14020, dnf: false, dns: false },
  { name: 'Nicholas Holmes',           pos: 13, swim: 1541, t1: 125, bike: 7947, t2:  80, run: 4435, total: 14125, dnf: false, dns: false },
  { name: 'Ben Randall',               pos: 14, swim: 1777, t1: 164, bike: 8118, t2:  97, run: 4090, total: 14244, dnf: false, dns: false },
  { name: 'Sam Osborne',               pos: 15, swim: 1498, t1: 129, bike: 8037, t2:  77, run: 4510, total: 14250, dnf: false, dns: false },
  { name: 'Matthew McGoey',            pos: 16, swim: 1488, t1: 164, bike: 7885, t2:  63, run: 4657, total: 14255, dnf: false, dns: false },
  { name: 'Hunter Lussi',              pos: 17, swim: 1516, t1: 138, bike: 7934, t2:  85, run: 4658, total: 14330, dnf: false, dns: false },
  { name: 'Andy Krueger',              pos: 18, swim: 1582, t1: 132, bike: 7959, t2:  80, run: 4613, total: 14365, dnf: false, dns: false },
  { name: 'Mark Romano',               pos: 19, swim: 1492, t1: 138, bike: 8107, t2:  82, run: 4679, total: 14496, dnf: false, dns: false },
  { name: 'Brad Bischoff',             pos: 20, swim: 1546, t1: 139, bike: 7975, t2:  82, run: 4785, total: 14525, dnf: false, dns: false },
  { name: 'Blake Selm',                pos: 21, swim: 1666, t1: 188, bike: 8054, t2:  73, run: 4556, total: 14536, dnf: false, dns: false },
  { name: 'Mitchell Ott',              pos: 22, swim: 1588, t1: 155, bike: 8005, t2:  81, run: 4721, total: 14549, dnf: false, dns: false },
  { name: 'Reed Legg',                 pos: 23, swim: 1502, t1: 133, bike: 7819, t2:  81, run: 5027, total: 14560, dnf: false, dns: false },
  { name: 'Matthew Guenter',           pos: 24, swim: 1467, t1: 145, bike: 8152, t2:  84, run: 4759, total: 14604, dnf: false, dns: false },
  { name: 'Adam Feigh',                pos: 25, swim: 1653, t1: 163, bike: 8087, t2: 101, run: 4693, total: 14696, dnf: false, dns: false },
  { name: 'Tommy Doubleday',           pos: 26, swim: 1504, t1: 145, bike: 8360, t2:  75, run: 4636, total: 14718, dnf: false, dns: false },
  { name: 'John Reed',                 pos: 27, swim: 1551, t1: 144, bike: 8275, t2:  80, run: 4715, total: 14763, dnf: false, dns: false },
  { name: 'Thomas Gordon',             pos: 28, swim: 1444, t1: 166, bike: 8164, t2:  89, run: 4920, total: 14781, dnf: false, dns: false },
  { name: 'Thomas Inigo',              pos: 29, swim: 1637, t1: 189, bike: 8349, t2:  95, run: 4553, total: 14821, dnf: false, dns: false },
  { name: 'Matt Kerr',                 pos: 30, swim: 1584, t1: 157, bike: 8267, t2:  98, run: 4770, total: 14874, dnf: false, dns: false },
  { name: 'Cole Kynoch',               pos: 31, swim: 1579, t1: 167, bike: 8236, t2:  93, run: 4890, total: 14962, dnf: false, dns: false },
  { name: 'Matt Schafer',              pos: 32, swim: 1458, t1: 151, bike: 8382, t2: 103, run: 4926, total: 15018, dnf: false, dns: false },
  { name: 'Ethan Sunseri',             pos: 33, swim: 1769, t1: 127, bike: 8658, t2:  76, run: 4514, total: 15141, dnf: false, dns: false },
  { name: 'Avraham Mana',              pos: 34, swim: 1580, t1: 167, bike: 8461, t2: 132, run: 4828, total: 15166, dnf: false, dns: false },
  { name: 'James Hayes',               pos: 35, swim: 1549, t1: 145, bike: 8075, t2: 121, run: 5319, total: 15207, dnf: false, dns: false },
  { name: 'Yang Pan',                  pos: 36, swim: 1887, t1: 213, bike: 8338, t2: 103, run: 4720, total: 15258, dnf: false, dns: false },
  { name: 'Matthew Dochnal',           pos: 37, swim: 1672, t1: 178, bike: 8555, t2:  86, run: 4823, total: 15311, dnf: false, dns: false },
  { name: 'Matthew Richard',           pos: 38, swim: 1803, t1: 231, bike: 8507, t2:  75, run: 4753, total: 15368, dnf: false, dns: false },
  { name: 'Max Kohll',                 pos: 39, swim: 1643, t1: 209, bike: 8347, t2:  78, run: 5207, total: 15482, dnf: false, dns: false },
  { name: 'Jordan Bendura',            pos: 40, swim: 2149, t1: 164, bike: 8673, t2: 141, run: 4374, total: 15499, dnf: false, dns: false },
  { name: 'Vant Lammers',              pos: 41, swim: 1671, t1: 189, bike: 8554, t2:  86, run: 5192, total: 15689, dnf: false, dns: false },
  { name: 'Alec Shields',              pos: 42, swim: 1867, t1: 185, bike: 8662, t2:  93, run: 4913, total: 15719, dnf: false, dns: false },
  { name: 'Robby Webster',             pos: 43, swim: 1776, t1: 154, bike: 8610, t2: 126, run: 5068, total: 15733, dnf: false, dns: false },
  { name: 'Brian Reynolds',            pos: 44, swim: 1962, t1: 155, bike: 8731, t2: 109, run: 5036, total: 15990, dnf: false, dns: false },
  { name: 'Luke Davis',                pos: 45, swim: 1874, t1: 166, bike: 8915, t2:  91, run: 5260, total: 16304, dnf: false, dns: false },
  { name: 'Alejandro Garcia Sanchez',  pos: 46, swim: 2070, t1: 141, bike: 8750, t2:  90, run: 5477, total: 16526, dnf: false, dns: false },
  // DNF — swim+t1 disponíveis para Levi Lukacs; só swim para Miguel Mattox
  { name: 'Levi Lukacs',               pos: null, swim: 1507, t1: 164, bike: null, t2: null, run: null, total: null, dnf: true,  dns: false },
  { name: 'Miguel Mattox',             pos: null, swim: 1557, t1: null, bike: null, t2: null, run: null, total: null, dnf: true,  dns: false },
]

// ── Load athletes ─────────────────────────────────────────────────────────────
const normalize = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim()

const { data: dbAthletes } = await sb.from('athletes').select('id, name, gender, type, current_price').eq('type', 'pro').eq('gender', 'M')
const dbMap = new Map()
for (const a of (dbAthletes ?? [])) dbMap.set(normalize(a.name), a)

function findAthlete(name) {
  const exact = dbMap.get(normalize(name))
  if (exact) return exact
  const words = normalize(name).split(' ')
  for (const [, a] of dbMap) {
    if (words.every(w => normalize(a.name).includes(w))) return a
    if (normalize(a.name).split(' ').every(w => normalize(name).includes(w))) return a
  }
  return null
}

// Resolve — sem criação de novos atletas
console.log('\n🔍 Resolvendo atletas...')
const resolved = []
const notFound = []
for (const r of RESULTS) {
  const athlete = findAthlete(r.name)
  if (!athlete) {
    notFound.push(r.name)
  } else {
    if (normalize(athlete.name) !== normalize(r.name))
      console.log(`  ↪  "${r.name}" → "${athlete.name}" (fuzzy match)`)
    resolved.push({ ...r, athleteId: athlete.id })
  }
}

if (notFound.length > 0) {
  console.error(`\n❌ Atletas NÃO encontrados no banco (não foram criados):`)
  notFound.forEach(n => console.error(`   - ${n}`))
  console.error('\nCrie os atletas manualmente e re-execute o script.')
  process.exit(1)
}

console.log(`→ ${resolved.length}/${RESULTS.length} atletas resolvidos\n`)

// ── Insert results ────────────────────────────────────────────────────────────
console.log('📥 Inserindo resultados...')
for (const r of resolved) {
  const row = {
    race_id:     RACE_ID,
    athlete_id:  r.athleteId,
    pro_pos:     r.pos,
    swim_time:   r.swim,
    t1_time:     r.t1,
    bike_time:   r.bike,
    t2_time:     r.t2,
    run_time:    r.run,
    finish_time: r.total,
    dnf:         r.dnf,
    dns:         r.dns,
  }
  const { error } = await sb.from('results').upsert(row, { onConflict: 'race_id,athlete_id' })
  if (error) console.error(`  ❌ ${r.name}: ${error.message}`)
  else {
    const status = r.dnf ? 'DNF' : r.dns ? 'DNS' : `${r.pos}º`
    console.log(`  ✅ ${r.name.padEnd(38)} [${status}]`)
  }
}

// ── Market update ─────────────────────────────────────────────────────────────
console.log('\n💹 Aplicando mercado MPRO...')
const log = await applyProMarketUpdates(sb, RACE_ID, 'M')
printMarketLog(log, 'IRONMAN 70.3 Pennsylvania 2026 — MPRO Market')

console.log('\n✅ MPRO concluído! Mercado aplicado.')
