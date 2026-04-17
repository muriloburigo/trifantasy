/**
 * Seed script: simulate race results for Ironman Brasil 2025.
 * Usage: node scripts/seed-results.mjs
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = Object.fromEntries(
  readFileSync(resolve(__dirname, '../.env.local'), 'utf-8')
    .split('\n').filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
    .map(([k, ...v]) => [k, v.join('=')])
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data: race } = await supabase
  .from('races').select('id').eq('slug', 'ironman-brasil-2025').single()

if (!race) { console.error('Prova não encontrada. Rode seed-race.mjs primeiro.'); process.exit(1) }

const { data: raceAthletes } = await supabase
  .from('race_athletes')
  .select('athlete_id, bib, price, athlete:athletes(name, type, age_group, gender)')
  .eq('race_id', race.id)

// Simulate results by bib
const resultsByBib = [
  // PROs Masculino (by name lookup)
  { name: 'Patrick Lange',   pro_pos: 1,  overall_pos: 1,  swim_time: 2820, t1_time: 150, bike_time: 15840, t2_time: 90,  run_time: 9720,  finish_time: 28620 },
  { name: 'Sam Laidlow',     pro_pos: 2,  overall_pos: 2,  swim_time: 2760, t1_time: 165, bike_time: 15600, t2_time: 105, run_time: 10320, finish_time: 28950 },
  { name: 'Magnus Ditlev',   pro_pos: 3,  overall_pos: 3,  swim_time: 2880, t1_time: 180, bike_time: 15480, t2_time: 120, run_time: 10800, finish_time: 29460 },
  { name: 'Florian Angert',  pro_pos: 4,  overall_pos: 4,  swim_time: 2940, t1_time: 160, bike_time: 15960, t2_time: 110, run_time: 10560, finish_time: 29730 },
  { name: 'Fenella Langridge',pro_pos: 8, overall_pos: 12, swim_time: 3060, t1_time: 195, bike_time: 16920, t2_time: 135, run_time: 11400, finish_time: 31710 },

  // PROs Feminino
  { name: 'Chelsea Sodaro',  pro_pos: 1,  overall_pos: 6,  swim_time: 3060, t1_time: 165, bike_time: 17280, t2_time: 105, run_time: 10800, finish_time: 31410 },
  { name: 'Taylor Knibb',    pro_pos: 2,  overall_pos: 7,  swim_time: 2940, t1_time: 180, bike_time: 17640, t2_time: 120, run_time: 10980, finish_time: 31860 },
  { name: 'Anne Haug',       pro_pos: 3,  overall_pos: 9,  swim_time: 3120, t1_time: 195, bike_time: 17820, t2_time: 135, run_time: 11160, finish_time: 32430 },
  { name: 'Laura Philipp',   pro_pos: 5,  overall_pos: 14, swim_time: 3240, t1_time: 200, bike_time: 18360, t2_time: 140, run_time: 11520, finish_time: 33460 },
  { name: 'Daniela Ryf',     pro_pos: 7,  overall_pos: 18, swim_time: 3360, t1_time: 210, bike_time: 18900, t2_time: 145, run_time: 11700, finish_time: 34315 },

  // Age groupers
  { name: 'Eduardo Costa',    ag_pos: 1,  overall_pos: 20,  swim_time: 3600, t1_time: 240, bike_time: 18720, t2_time: 180, run_time: 12600, finish_time: 35340, kona_slot: true },
  { name: 'João Silva',       ag_pos: 2,  overall_pos: 28,  swim_time: 3780, t1_time: 270, bike_time: 19440, t2_time: 210, run_time: 13200, finish_time: 36900 },
  { name: 'Carlos Mendes',    ag_pos: 1,  overall_pos: 22,  swim_time: 3660, t1_time: 255, bike_time: 19080, t2_time: 195, run_time: 12780, finish_time: 35970, kona_slot: true },
  { name: 'Rafael Andrade',   ag_pos: 3,  overall_pos: 45,  swim_time: 4200, t1_time: 300, bike_time: 21600, t2_time: 240, run_time: 14400, finish_time: 40740 },
  { name: 'Lucas Ferreira',   ag_pos: 4,  overall_pos: 52,  swim_time: 4500, t1_time: 330, bike_time: 22200, t2_time: 255, run_time: 14760, finish_time: 42045 },
  { name: 'Felipe Rocha',     ag_pos: 2,  overall_pos: 38,  swim_time: 3960, t1_time: 285, bike_time: 20520, t2_time: 225, run_time: 13680, finish_time: 38670 },
  { name: 'Thiago Nunes',     ag_pos: 6,  overall_pos: 70,  swim_time: 4800, t1_time: 360, bike_time: 23400, t2_time: 270, run_time: 15600, finish_time: 44430 },
  { name: 'Bruno Almeida',    ag_pos: 5,  overall_pos: 65,  swim_time: 4680, t1_time: 345, bike_time: 23100, t2_time: 265, run_time: 15300, finish_time: 43690 },

  // Age groupers Feminino
  { name: 'Fernanda Keller',  ag_pos: 1,  overall_pos: 55,  swim_time: 4140, t1_time: 300, bike_time: 21240, t2_time: 240, run_time: 14040, finish_time: 39960, kona_slot: true },
  { name: 'Ana Beatriz Santos',ag_pos: 2, overall_pos: 62,  swim_time: 4260, t1_time: 315, bike_time: 21960, t2_time: 255, run_time: 14340, finish_time: 41130 },
  { name: 'Mariana Lima',     ag_pos: 1,  overall_pos: 58,  swim_time: 4200, t1_time: 310, bike_time: 21480, t2_time: 248, run_time: 14160, finish_time: 40398, kona_slot: true },
  { name: 'Camila Oliveira',  ag_pos: 3,  overall_pos: 75,  swim_time: 4680, t1_time: 345, bike_time: 23700, t2_time: 270, run_time: 15420, finish_time: 44415 },
  { name: 'Priscila Rocha',   ag_pos: 2,  overall_pos: 68,  swim_time: 4380, t1_time: 330, bike_time: 22680, t2_time: 260, run_time: 14820, finish_time: 42470 },
]

// Look up athlete_id by name
const athleteMap = Object.fromEntries(
  (raceAthletes ?? []).map((ra) => [ra.athlete?.name, ra.athlete_id])
)

let ok = 0
for (const r of resultsByBib) {
  const athleteId = athleteMap[r.name]
  if (!athleteId) { console.log(`  ✗ Atleta não encontrado: ${r.name}`); continue }

  const { name, ...payload } = r
  const { error } = await supabase.from('results').upsert(
    { race_id: race.id, athlete_id: athleteId, dnf: false, dns: false, kona_slot: false, ...payload },
    { onConflict: 'race_id,athlete_id' }
  )
  if (error) { console.error(`  ✗ ${r.name}:`, error.message); continue }
  ok++
}

console.log(`Resultados inseridos: ${ok}/${resultsByBib.length}`)
console.log('Agora acesse /admin/pontuacao para calcular as pontuações.')
