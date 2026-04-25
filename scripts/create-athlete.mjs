#!/usr/bin/env node
/**
 * Create a new PRO athlete (not yet in the system) and optionally link to a race.
 *
 * Usage (interactive):
 *   node scripts/create-athlete.mjs
 *
 * Usage (non-interactive):
 *   node scripts/create-athlete.mjs \
 *     --name "Kristian Blummenfelt" \
 *     --gender M \
 *     --country Norway \
 *     --country-code NO \
 *     --pto-rank 1 \
 *     --race-id <uuid>          # optional, links to race
 *     --bib 1                   # optional
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { createInterface } from 'readline'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

function normalizeName(raw) {
  return raw.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ')
}

function priceFromPtoRank(rank) {
  if (!rank) return 10
  if (rank <= 7)   return 35
  if (rank <= 15)  return 28
  if (rank <= 25)  return 22
  if (rank <= 40)  return 18
  if (rank <= 60)  return 15
  if (rank <= 80)  return 12
  if (rank <= 120) return 11
  return 10
}

function parseArgs() {
  const args = process.argv.slice(2)
  const result = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2)
      result[key] = args[i + 1] ?? ''
      i++
    }
  }
  return result
}

async function prompt(rl, question, defaultVal) {
  return new Promise(resolve => {
    const suffix = defaultVal !== undefined && defaultVal !== '' ? ` [${defaultVal}]: ` : ': '
    rl.question(`${question}${suffix}`, answer => {
      resolve(answer.trim() || defaultVal || '')
    })
  })
}

async function promptChoice(rl, question, choices, defaultVal) {
  const opts = choices.map((c, i) => `  ${i + 1}. ${c}`).join('\n')
  const defaultIdx = choices.indexOf(defaultVal) + 1
  return new Promise(resolve => {
    rl.question(`${question}\n${opts}\nEscolha [${defaultIdx}]: `, answer => {
      const idx = parseInt(answer.trim(), 10)
      if (idx >= 1 && idx <= choices.length) resolve(choices[idx - 1])
      else resolve(defaultVal || choices[0])
    })
  })
}

;(async () => {
  const flags = parseArgs()
  const rl = createInterface({ input: process.stdin, output: process.stdout })

  console.log('\n👤  Cadastrar novo atleta PRO no Trixer\n')

  // Check for existing athlete by name if provided
  const rawName = flags.name || await prompt(rl, 'Nome completo do atleta', '')
  if (!rawName) { console.error('❌  Nome é obrigatório'); rl.close(); process.exit(1) }
  const name = normalizeName(rawName)

  // Check if already exists
  const { data: existing } = await supabase
    .from('athletes')
    .select('id, name, gender, type, country, pto_rank, current_price')
    .ilike('name', `%${name.split(' ').pop()}%`)
    .eq('type', 'pro')

  if (existing && existing.length > 0) {
    console.log(`\n⚠️   Atleta(s) PRO com nome similar já cadastrado(s):`)
    existing.forEach(a => console.log(`    - ${a.name} (${a.gender}) ${a.country ?? ''} rank #${a.pto_rank ?? '?'} T$${a.current_price} — ID: ${a.id}`))
    const rl2 = createInterface({ input: process.stdin, output: process.stdout })
    const cont = await new Promise(resolve => rl2.question('\nContinuar e criar novo atleta? (s/n) [n]: ', a => { rl2.close(); resolve(a.trim().toLowerCase()) }))
    if (cont !== 's' && cont !== 'sim') { rl.close(); process.exit(0) }
  }

  const genderRaw = flags.gender || await promptChoice(rl, 'Gênero', ['M', 'F'], 'M')
  const gender = genderRaw.toUpperCase() === 'F' ? 'F' : 'M'

  const country    = flags.country      || await prompt(rl, 'País (ex: Brazil)', '')
  const cc         = flags['country-code'] || await prompt(rl, 'Código do país (2 letras, ex: BR)', '')
  const country_code = cc.toUpperCase() || null

  const rankRaw  = flags['pto-rank'] || await prompt(rl, 'Rank PTO (deixe em branco se não tem)', '')
  const pto_rank = rankRaw && !isNaN(Number(rankRaw)) ? Number(rankRaw) : null

  const suggestedPrice = priceFromPtoRank(pto_rank)
  const priceRaw = flags.price || await prompt(rl, `Preço inicial (T$)`, String(suggestedPrice))
  const current_price = Number(priceRaw) || suggestedPrice

  const photoUrl = flags['photo-url'] || await prompt(rl, 'URL da foto (opcional)', '')

  // Optional: link to race
  const raceIdFlag = flags['race-id']
  let raceId = null
  let bib = null
  if (raceIdFlag) {
    raceId = raceIdFlag
    bib = flags.bib ? Number(flags.bib) : null
  } else {
    const linkRaw = await prompt(rl, 'Vincular a uma prova agora? (s/n)', 'n')
    if (linkRaw.toLowerCase() === 's' || linkRaw.toLowerCase() === 'sim') {
      // List upcoming/open races
      const { data: races } = await supabase
        .from('races')
        .select('id, name, date, status')
        .in('status', ['upcoming', 'open'])
        .order('date', { ascending: true })

      if (!races?.length) {
        console.log('   (Nenhuma prova upcoming/open encontrada)')
      } else {
        console.log('\nProvas disponíveis:')
        races.forEach((r, i) => console.log(`  ${i + 1}. ${r.name} (${r.date}) — ${r.status} — ${r.id}`))
        const idxRaw = await prompt(rl, 'Número da prova (0 para pular)', '0')
        const idx = parseInt(idxRaw, 10) - 1
        if (idx >= 0 && idx < races.length) {
          raceId = races[idx].id
          const bibRaw = await prompt(rl, 'Bib number (opcional)', '')
          bib = bibRaw && !isNaN(Number(bibRaw)) ? Number(bibRaw) : null
        }
      }
    }
  }

  rl.close()

  console.log('\n📋  Resumo:')
  console.log(`   Nome:        ${name}`)
  console.log(`   Gênero:      ${gender}`)
  console.log(`   País:        ${country} (${country_code ?? '—'})`)
  console.log(`   Rank PTO:    ${pto_rank ? `#${pto_rank}` : '—'}`)
  console.log(`   Preço:       T$${current_price}`)
  if (photoUrl) console.log(`   Foto:        ${photoUrl}`)
  if (raceId) console.log(`   Prova:       ${raceId}${bib ? ` (bib #${bib})` : ''}`)

  // Insert athlete
  const { data: athlete, error: aErr } = await supabase
    .from('athletes')
    .upsert(
      {
        name,
        gender,
        type: 'pro',
        country: country || null,
        country_code: country_code || null,
        pto_rank,
        current_price,
        price_change: 0,
        photo_url: photoUrl || null,
      },
      { onConflict: 'name,gender,type' }
    )
    .select('id, name')
    .single()

  if (aErr || !athlete) {
    console.error('\n❌  Erro ao criar atleta:', aErr?.message)
    process.exit(1)
  }

  console.log(`\n✅  Atleta criado/atualizado com sucesso!`)
  console.log(`   ID:   ${athlete.id}`)

  // Link to race if requested
  if (raceId) {
    const price = priceFromPtoRank(pto_rank)
    const { error: raErr } = await supabase
      .from('race_athletes')
      .upsert(
        { race_id: raceId, athlete_id: athlete.id, price, bib },
        { onConflict: 'race_id,athlete_id' }
      )

    if (raErr) {
      console.error(`⚠️   Atleta criado, mas erro ao vincular à prova: ${raErr.message}`)
    } else {
      console.log(`✅  Vinculado à prova com sucesso. (T$${price}${bib ? `, bib #${bib}` : ''})`)
    }
  }

  console.log(`\n💡  Ver em: /admin/atletas?race_id=all&edit=${athlete.id}`)
})()
