/**
 * Seed script: create a race with PRO and age-grouper athletes.
 * Usage: node scripts/seed-race.mjs
 *
 * Reads .env.local automatically.
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')

// Parse .env.local
const env = Object.fromEntries(
  readFileSync(envPath, 'utf-8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => l.split('=').map(s => s.trim()))
    .map(([k, ...v]) => [k, v.join('=')])
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

// ── Race ──────────────────────────────────────────────────────────────
const { data: race, error: raceErr } = await supabase
  .from('races')
  .upsert({
    name: 'Ironman Brasil 2025',
    slug: 'ironman-brasil-2025',
    date: '2025-05-25',
    location: 'Florianópolis',
    country: 'Brasil',
    country_code: 'BR',
    distance: 'full',
    has_pro_field: true,
    status: 'open',
  }, { onConflict: 'slug' })
  .select('id')
  .single()

if (raceErr) { console.error('Erro ao criar prova:', raceErr.message); process.exit(1) }
console.log('Prova criada:', race.id)

// ── Athletes ──────────────────────────────────────────────────────────
const athletes = [
  // PROs Masculino
  { name: 'Patrick Lange',          gender: 'M', type: 'pro', country: 'Germany',   country_code: 'DE', pto_rank: 1,  price: 30 },
  { name: 'Sam Laidlow',            gender: 'M', type: 'pro', country: 'France',    country_code: 'FR', pto_rank: 2,  price: 28 },
  { name: 'Magnus Ditlev',          gender: 'M', type: 'pro', country: 'Denmark',   country_code: 'DK', pto_rank: 3,  price: 26 },
  { name: 'Florian Angert',         gender: 'M', type: 'pro', country: 'Germany',   country_code: 'DE', pto_rank: 5,  price: 22 },
  { name: 'Fenella Langridge',      gender: 'M', type: 'pro', country: 'Great Britain', country_code: 'GB', pto_rank: 8, price: 18 },

  // PROs Feminino
  { name: 'Chelsea Sodaro',         gender: 'F', type: 'pro', country: 'USA',       country_code: 'US', pto_rank: 1,  price: 30 },
  { name: 'Taylor Knibb',           gender: 'F', type: 'pro', country: 'USA',       country_code: 'US', pto_rank: 2,  price: 28 },
  { name: 'Anne Haug',              gender: 'F', type: 'pro', country: 'Germany',   country_code: 'DE', pto_rank: 3,  price: 26 },
  { name: 'Laura Philipp',          gender: 'F', type: 'pro', country: 'Germany',   country_code: 'DE', pto_rank: 6,  price: 20 },
  { name: 'Daniela Ryf',            gender: 'F', type: 'pro', country: 'Switzerland', country_code: 'CH', pto_rank: 9, price: 18 },

  // Age groupers Masculino
  { name: 'João Silva',             gender: 'M', type: 'age_grouper', age_group: 'M35-39', club: 'Tri SP',   country: 'Brasil', country_code: 'BR', price: 12, bib: 101 },
  { name: 'Carlos Mendes',          gender: 'M', type: 'age_grouper', age_group: 'M40-44', club: 'Tri RJ',   country: 'Brasil', country_code: 'BR', price: 10, bib: 102 },
  { name: 'Eduardo Costa',          gender: 'M', type: 'age_grouper', age_group: 'M35-39', club: 'CPTC',     country: 'Brasil', country_code: 'BR', price: 14, bib: 103 },
  { name: 'Rafael Andrade',         gender: 'M', type: 'age_grouper', age_group: 'M45-49', club: 'Tri BH',   country: 'Brasil', country_code: 'BR', price: 8,  bib: 104 },
  { name: 'Lucas Ferreira',         gender: 'M', type: 'age_grouper', age_group: 'M30-34', club: 'Tri POA',  country: 'Brasil', country_code: 'BR', price: 9,  bib: 105 },
  { name: 'Felipe Rocha',           gender: 'M', type: 'age_grouper', age_group: 'M40-44', club: 'Tri Floripa', country: 'Brasil', country_code: 'BR', price: 11, bib: 106 },
  { name: 'Thiago Nunes',           gender: 'M', type: 'age_grouper', age_group: 'M25-29', club: 'TRI BS',   country: 'Brasil', country_code: 'BR', price: 7,  bib: 107 },
  { name: 'Bruno Almeida',          gender: 'M', type: 'age_grouper', age_group: 'M50-54', club: 'Tri SC',   country: 'Brasil', country_code: 'BR', price: 6,  bib: 108 },

  // Age groupers Feminino
  { name: 'Ana Beatriz Santos',     gender: 'F', type: 'age_grouper', age_group: 'F35-39', club: 'Tri SP',   country: 'Brasil', country_code: 'BR', price: 13, bib: 201 },
  { name: 'Mariana Lima',           gender: 'F', type: 'age_grouper', age_group: 'F40-44', club: 'Tri RJ',   country: 'Brasil', country_code: 'BR', price: 11, bib: 202 },
  { name: 'Fernanda Keller',        gender: 'F', type: 'age_grouper', age_group: 'F50-54', club: 'Tri SC',   country: 'Brasil', country_code: 'BR', price: 15, bib: 203 },
  { name: 'Camila Oliveira',        gender: 'F', type: 'age_grouper', age_group: 'F30-34', club: 'CPTC',     country: 'Brasil', country_code: 'BR', price: 9,  bib: 204 },
  { name: 'Priscila Rocha',         gender: 'F', type: 'age_grouper', age_group: 'F45-49', club: 'Tri POA',  country: 'Brasil', country_code: 'BR', price: 8,  bib: 205 },
]

let ok = 0
for (const a of athletes) {
  const { bib, price, ...athleteFields } = a

  const { data: athlete, error: aErr } = await supabase
    .from('athletes')
    .upsert(athleteFields, { onConflict: 'name,gender,type' })
    .select('id')
    .single()

  if (aErr || !athlete) { console.error(`  ✗ ${a.name}:`, aErr?.message); continue }

  const { error: raErr } = await supabase
    .from('race_athletes')
    .upsert({ race_id: race.id, athlete_id: athlete.id, price, bib: bib ?? null }, { onConflict: 'race_id,athlete_id' })

  if (raErr) { console.error(`  ✗ vincular ${a.name}:`, raErr.message); continue }
  ok++
}

console.log(`Atletas inseridos: ${ok}/${athletes.length}`)
console.log('\nDone! Acesse /admin/provas para verificar.')
