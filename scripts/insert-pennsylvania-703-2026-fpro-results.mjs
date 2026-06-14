/**
 * Insert IRONMAN 70.3 Pennsylvania Happy Valley 2026 — FPRO results
 * Run: node --env-file=.env.production.local scripts/insert-pennsylvania-703-2026-fpro-results.mjs
 *
 * Segmentos mais rápidos:
 *   Swim: Jenna Campbell (25:52)
 *   Bike: Paula Findlay (2:19:11)
 *   Run:  Lydia Russell (1:19:05)
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
// Swim em MM:SS → s | Bike em H:MM:SS → s | Run em H:MM:SS → s
const RESULTS = [
  { name: 'Paula Findlay',              pos:  1, swim: 1624, t1: 152, bike:  8351, t2:  92, run: 5025, total: 15242, dnf: false, dns: false },
  { name: 'Lydia Russell',              pos:  2, swim: 1680, t1: 170, bike:  8804, t2:  93, run: 4745, total: 15490, dnf: false, dns: false },
  { name: 'Grace Thek',                 pos:  3, swim: 1627, t1: 154, bike:  8833, t2:  79, run: 4946, total: 15636, dnf: false, dns: false },
  { name: 'Grace Alexander',            pos:  4, swim: 1563, t1: 165, bike:  8596, t2:  87, run: 5244, total: 15653, dnf: false, dns: false },
  { name: 'Hannah Berry',               pos:  5, swim: 1625, t1: 157, bike:  8684, t2: 104, run: 5105, total: 15673, dnf: false, dns: false },
  { name: 'Tamara Jewett',              pos:  6, swim: 1734, t1: 166, bike:  8923, t2: 108, run: 4790, total: 15719, dnf: false, dns: false },
  { name: 'Jackie Hering',              pos:  7, swim: 1733, t1: 172, bike:  8898, t2: 117, run: 4930, total: 15847, dnf: false, dns: false },
  { name: 'Danielle Lewis',             pos:  8, swim: 1900, t1: 158, bike:  8839, t2:  87, run: 5259, total: 16241, dnf: false, dns: false },
  { name: 'Adele Likin',               pos:  9, swim: 1803, t1: 156, bike:  9091, t2:  92, run: 5147, total: 16286, dnf: false, dns: false },
  { name: 'Caroline Kaplan',            pos: 10, swim: 1698, t1: 167, bike:  9388, t2: 104, run: 5094, total: 16450, dnf: false, dns: false },
  { name: 'Kristen Marchant',           pos: 11, swim: 1669, t1: 183, bike:  9192, t2: 109, run: 5500, total: 16650, dnf: false, dns: false },
  { name: 'Jenna Campbell',             pos: 12, swim: 1552, t1: 158, bike:  9096, t2:  85, run: 5802, total: 16690, dnf: false, dns: false },
  { name: 'Amber Ferreira',             pos: 13, swim: 1906, t1: 217, bike:  9411, t2: 167, run: 5236, total: 16935, dnf: false, dns: false },
  { name: 'Kelly Barton',               pos: 14, swim: 1806, t1: 184, bike:  9451, t2:  93, run: 5575, total: 17108, dnf: false, dns: false },
  { name: 'Rachael Tatko',              pos: 15, swim: 1902, t1: 183, bike:  9712, t2: 133, run: 5220, total: 17148, dnf: false, dns: false },
  { name: 'Emily Pincus',               pos: 16, swim: 1565, t1: 222, bike:  9914, t2: 123, run: 5608, total: 17430, dnf: false, dns: false },
  { name: 'Anne Basso',                 pos: 17, swim: 1902, t1: 178, bike:  9859, t2: 126, run: 5636, total: 17700, dnf: false, dns: false },
  { name: 'Annette Rogers',             pos: 18, swim: 1901, t1: 194, bike:  9973, t2:  76, run: 5711, total: 17852, dnf: false, dns: false },
  { name: 'Rebecca Yunginger',          pos: 19, swim: 1956, t1: 177, bike:  9368, t2: 103, run: 6308, total: 17910, dnf: false, dns: false },
  { name: 'Abbie Sullivan',             pos: 20, swim: 1958, t1: 223, bike: 10016, t2: 106, run: 5610, total: 17911, dnf: false, dns: false },
  { name: 'Corinne Mouw',               pos: 21, swim: 2012, t1: 181, bike: 10183, t2: 109, run: 5755, total: 18237, dnf: false, dns: false },
  { name: 'Shylah Andrews',             pos: 22, swim: 2180, t1: 173, bike: 10049, t2: 109, run: 5820, total: 18328, dnf: false, dns: false },
  { name: 'Katie Spoelman-Vanacker',    pos: 23, swim: 1816, t1: 191, bike: 10128, t2: 153, run: 6113, total: 18400, dnf: false, dns: false },
  { name: 'Sarah Karpinski',            pos: 24, swim: 2231, t1: 258, bike: 10790, t2: 153, run: 5608, total: 19037, dnf: false, dns: false },
]

// ── Load athletes ─────────────────────────────────────────────────────────────
const normalize = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim()

const { data: dbAthletes } = await sb.from('athletes').select('id, name, gender, type, current_price').eq('type', 'pro').eq('gender', 'F')
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
console.log('\n💹 Aplicando mercado FPRO...')
const log = await applyProMarketUpdates(sb, RACE_ID, 'F')
printMarketLog(log, 'IRONMAN 70.3 Pennsylvania 2026 — FPRO Market')

console.log('\n✅ FPRO concluído! Mercado aplicado.')
