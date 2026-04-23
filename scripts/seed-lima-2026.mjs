/**
 * Seed script: create IRONMAN 70.3 Lima Peru 2026 and insert PRO athletes.
 * Usage: node scripts/seed-lima-2026.mjs
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
    name: 'IRONMAN 70.3 Peru',
    slug: 'ironman-703-lima-peru-2026',
    date: '2026-04-26',
    location: 'Lima',
    country: 'Peru',
    country_code: 'PE',
    distance: '70.3',
    has_pro_field: true,
    status: 'open',
  }, { onConflict: 'slug' })
  .select('id')
  .single()

if (raceErr) { console.error('Erro ao criar prova:', raceErr.message); process.exit(1) }
console.log('Prova criada/atualizada:', race.id)

// ── Country Map ───────────────────────────────────────────────────────
const COUNTRIES = {
  'MEX': { country: 'Mexico', code: 'MX' },
  'ECU': { country: 'Ecuador', code: 'EC' },
  'ARG': { country: 'Argentina', code: 'AR' },
  'CHL': { country: 'Chile', code: 'CL' },
  'FRA': { country: 'France', code: 'FR' },
  'CAN': { country: 'Canada', code: 'CA' },
  'BRA': { country: 'Brazil', code: 'BR' },
  'USA': { country: 'United States', code: 'US' },
  'ESP': { country: 'Spain', code: 'ES' },
  'PRT': { country: 'Portugal', code: 'PT' },
  'COL': { country: 'Colombia', code: 'CO' },
  'PRY': { country: 'Paraguay', code: 'PY' },
  'PER': { country: 'Peru', code: 'PE' },
}

// ── Athletes ──────────────────────────────────────────────────────────
const athletes = [
  // FPRO
  { name: 'Cecilia Perez', country_key: 'MEX', gender: 'F', price: 35 },
  { name: 'Elizabeth Bravo', country_key: 'ECU', gender: 'F', price: 35 },
  { name: 'Romina Biagioli', country_key: 'ARG', gender: 'F', price: 30 },
  { name: 'Romina Palacio Balena', country_key: 'ARG', gender: 'F', price: 32 },
  { name: 'Francisca Garrido', country_key: 'CHL', gender: 'F', price: 28 },
  { name: 'Lea Riccoboni', country_key: 'FRA', gender: 'F', price: 28 },
  { name: 'Deborah Eckhouse', country_key: 'CAN', gender: 'F', price: 25 },
  { name: 'Bruna Stolf', country_key: 'BRA', gender: 'F', price: 28 },
  { name: 'Laura Mathews', country_key: 'USA', gender: 'F', price: 25 },
  { name: 'Sofia Aguayo Mauri', country_key: 'ESP', gender: 'F', price: 22 },
  { name: 'Kerry Girona', country_key: 'USA', gender: 'F', price: 20 },
  { name: 'Carolyn Olsen', country_key: 'USA', gender: 'F', price: 20 },
  { name: 'Raquel Rocha', country_key: 'PRT', gender: 'F', price: 18 },
  { name: 'Florencia Vasquez', country_key: 'CHL', gender: 'F', price: 18 },
  { name: 'Alice Cote-allard', country_key: 'CAN', gender: 'F', price: 15 },
  { name: 'Chloe Nicolas', country_key: 'FRA', gender: 'F', price: 15 },
  { name: 'Luisa Zapata', country_key: 'COL', gender: 'F', price: 15 },
  { name: 'Astrid Peregord', country_key: 'CAN', gender: 'F', price: 15 },
  { name: 'Michelle Stratton', country_key: 'USA', gender: 'F', price: 15 },

  // MPRO
  { name: 'Justin Riele', country_key: 'USA', gender: 'M', price: 35 },
  { name: 'Armando Matute', country_key: 'ECU', gender: 'M', price: 32 },
  { name: 'Luciano Taccone', country_key: 'ARG', gender: 'M', price: 35 },
  { name: 'Martin Baeza', country_key: 'CHL', gender: 'M', price: 30 },
  { name: 'Andy Krueger', country_key: 'USA', gender: 'M', price: 28 },
  { name: 'Vicente Trewhela', country_key: 'CHL', gender: 'M', price: 32 },
  { name: 'Nicolas Saez', country_key: 'CHL', gender: 'M', price: 25 },
  { name: 'Jorge Orrego', country_key: 'CHL', gender: 'M', price: 22 },
  { name: 'Casimir Moine', country_key: 'FRA', gender: 'M', price: 30 },
  { name: 'Victor Alvarez De La Cruz', country_key: 'ESP', gender: 'M', price: 20 },
  { name: 'Leonel Lucas', country_key: 'ECU', gender: 'M', price: 18 },
  { name: 'Gaetan Fetaud', country_key: 'PRY', gender: 'M', price: 15 },
  { name: 'Cenzino Lebot', country_key: 'FRA', gender: 'M', price: 15 },
  { name: 'Rodrigo Alvarez Manzo', country_key: 'MEX', gender: 'M', price: 15 },
  { name: 'Arturo Salinas', country_key: 'PER', gender: 'M', price: 15 },
]

let ok = 0
for (const a of athletes) {
  const c = COUNTRIES[a.country_key] || { country: 'International', code: 'UN' }
  
  const { data: athlete, error: aErr } = await supabase
    .from('athletes')
    .upsert({ 
      name: a.name, 
      gender: a.gender, 
      type: 'pro',
      country: c.country,
      country_code: c.code
    }, { onConflict: 'name,gender,type' })
    .select('id')
    .single()

  if (aErr || !athlete) { console.error(`  ✗ ${a.name}:`, aErr?.message); continue }

  const { error: raErr } = await supabase
    .from('race_athletes')
    .upsert({ 
      race_id: race.id, 
      athlete_id: athlete.id, 
      price: a.price,
    }, { onConflict: 'race_id,athlete_id' })

  if (raErr) { console.error(`  ✗ vincular ${a.name}:`, raErr.message); continue }
  ok++
}

console.log(`Atletas PRO inseridos para Lima 2026: ${ok}/${athletes.length}`)
console.log('\nDone!')
