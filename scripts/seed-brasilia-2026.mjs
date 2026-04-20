/**
 * Seed script: create IRONMAN 70.3 Brasília 2026 and insert PRO athletes.
 * Usage: node scripts/seed-brasilia-2026.mjs
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
    name: 'IRONMAN 70.3 Brasília 2026',
    slug: 'ironman-70-3-brasilia-2026',
    date: '2026-04-26',
    location: 'Brasília',
    country: 'Brasil',
    country_code: 'BR',
    distance: '70.3',
    has_pro_field: true,
    status: 'open',
  }, { onConflict: 'slug' })
  .select('id')
  .single()

if (raceErr) { console.error('Erro ao criar prova:', raceErr.message); process.exit(1) }
console.log('Prova criada:', race.id)

// ── Athletes ──────────────────────────────────────────────────────────
const athletes = [
  // MPRO
  { name: 'Luciano Taccone', category: 'MPRO', nationality: 'ARG', country: 'Argentina', country_code: 'AR', price: 35 },
  { name: 'Reinaldo Colucci', category: 'MPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 35 },
  { name: 'Filipe Azevedo', category: 'MPRO', nationality: 'PRT', country: 'Portugal', country_code: 'PT', price: 35 },
  { name: 'Enzo Krauss', category: 'MPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 30 },
  { name: 'Andre Lopes', category: 'MPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 30 },
  { name: 'Danilo Pimental', category: 'MPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 25 },
  { name: 'Yago Alves', category: 'MPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 28 },
  { name: 'Igor Amorelli', category: 'MPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 35 },
  { name: 'Joao Teixeira Alvares Neto', category: 'MPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 22 },
  { name: 'Alexandre Stocco', category: 'MPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 18 },
  { name: 'Felipe Bianchi', category: 'MPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 15 },
  { name: 'Danilo Melo', category: 'MPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 18 },
  { name: 'Vicente Saraiva', category: 'MPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 20 },
  { name: 'Eduardo Siroto', category: 'MPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 15 },
  { name: 'Joao Victor Maldonado Lima', category: 'MPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 15 },
  { name: 'Pedro Leal', category: 'MPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 15 },
  { name: 'Lucas Cabral', category: 'MPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 15 },
  { name: 'Matheus Diniz', category: 'MPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 20 },
  { name: 'Sasha Caterina', category: 'MPRO', nationality: 'SUI', country: 'Switzerland', country_code: 'CH', price: 28 },
  { name: 'Jonathan Guisolan', category: 'MPRO', nationality: 'SUI', country: 'Switzerland', country_code: 'CH', price: 25 },

  // FPRO
  { name: 'Pamella Oliveira', category: 'FPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 35 },
  { name: 'Mariana Borges De Andrade', category: 'FPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 30 },
  { name: 'Bruna Stolf', category: 'FPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 28 },
  { name: 'Luma Guillen', category: 'FPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 22 },
  { name: 'Julia Kruger Romariz', category: 'FPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 20 },
  { name: 'Ana Laura Canil De Almeida', category: 'FPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 18 },
  { name: 'Carolina Bilato', category: 'FPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 18 },
  { name: 'Patricia Mendes Franco', category: 'FPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 15 },
  { name: 'Fernanda Palma', category: 'FPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 15 },
  { name: 'Mary Ortega', category: 'FPRO', nationality: 'USA', country: 'United States', country_code: 'US', price: 28 },
  { name: 'Florencia Vasquez', category: 'FPRO', nationality: 'CHL', country: 'Chile', country_code: 'CL', price: 20 },
  { name: 'Romina Palacio Balena', category: 'FPRO', nationality: 'ARG', country: 'Argentina', country_code: 'AR', price: 28 },
  { name: 'Gisele Bertucci', category: 'FPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 15 },
  { name: 'Heloisa Pimentel', category: 'FPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 15 },
  { name: 'Luiza Cravo', category: 'FPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 15 },
  { name: 'Natalia Kanayama', category: 'FPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 15 },
  { name: 'Paula Rovani', category: 'FPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 15 },
  { name: 'Thais Sant Ana', category: 'FPRO', nationality: 'BRA', country: 'Brazil', country_code: 'BR', price: 15 },
]

let ok = 0
for (const a of athletes) {
  const { price, category, nationality, ...fields } = a
  
  // gender and type
  const gender = category.startsWith('M') ? 'M' : 'F'
  const type = 'pro'

  const { data: athlete, error: aErr } = await supabase
    .from('athletes')
    .upsert({ ...fields, gender, type }, { onConflict: 'name,gender,type' })
    .select('id')
    .single()

  if (aErr || !athlete) { console.error(`  ✗ ${a.name}:`, aErr?.message); continue }

  const { error: raErr } = await supabase
    .from('race_athletes')
    .upsert({ 
      race_id: race.id, 
      athlete_id: athlete.id, 
      price,
    }, { onConflict: 'race_id,athlete_id' })

  if (raErr) { console.error(`  ✗ vincular ${a.name}:`, raErr.message); continue }
  ok++
}

console.log(`Atletas PRO inseridos para Brasília 2026: ${ok}/${athletes.length}`)
console.log('\nDone!')
