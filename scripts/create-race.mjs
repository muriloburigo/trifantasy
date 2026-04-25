#!/usr/bin/env node
/**
 * Create or update a race in the Trixer database.
 *
 * Usage (interactive):
 *   node scripts/create-race.mjs
 *
 * Usage (non-interactive, all args via flags):
 *   node scripts/create-race.mjs \
 *     --name "IRONMAN 70.3 Florianópolis" \
 *     --date "2026-05-31" \
 *     --location "Florianópolis" \
 *     --country "Brazil" \
 *     --country-code "BR" \
 *     --distance "70.3" \
 *     --status "upcoming" \
 *     --pro
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

function toSlug(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// Parse --flag value args
function parseArgs() {
  const args = process.argv.slice(2)
  const result = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2)
      if (key === 'pro') { result.has_pro_field = true; continue }
      result[key] = args[i + 1] ?? ''
      i++
    }
  }
  return result
}

async function prompt(rl, question, defaultVal) {
  return new Promise(resolve => {
    const suffix = defaultVal ? ` [${defaultVal}]: ` : ': '
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

  console.log('\n🏁  Cadastrar nova prova no Trixer\n')

  const name = flags.name || await prompt(rl, 'Nome da prova', '')
  if (!name) { console.error('❌  Nome é obrigatório'); rl.close(); process.exit(1) }

  const date = flags.date || await prompt(rl, 'Data (YYYY-MM-DD)', '')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.error('❌  Data inválida. Use o formato YYYY-MM-DD (ex: 2026-05-31)')
    rl.close(); process.exit(1)
  }

  const location = flags.location || await prompt(rl, 'Local / cidade', '')
  const country  = flags.country  || await prompt(rl, 'País', '')
  const country_code = (flags['country-code'] || await prompt(rl, 'Código do país (2 letras, ex: BR)', '')).toUpperCase()

  const distance = flags.distance || await promptChoice(rl, 'Distância', ['full', '70.3', 'ows', 'other'], 'full')

  const statusChoices = ['upcoming', 'open', 'locked', 'finished']
  const status = flags.status || await promptChoice(rl, 'Status inicial', statusChoices, 'upcoming')

  const hasProRaw = flags.has_pro_field !== undefined
    ? flags.has_pro_field
    : (await prompt(rl, 'Tem campo PRO? (s/n)', 's')).toLowerCase()
  const has_pro_field = hasProRaw === true || hasProRaw === 's' || hasProRaw === 'sim' || hasProRaw === 'yes'

  rl.close()

  const slug = toSlug(name)

  console.log('\n📋  Resumo:')
  console.log(`   Nome:        ${name}`)
  console.log(`   Slug:        ${slug}`)
  console.log(`   Data:        ${date}`)
  console.log(`   Local:       ${location}, ${country} (${country_code})`)
  console.log(`   Distância:   ${distance}`)
  console.log(`   Status:      ${status}`)
  console.log(`   Campo PRO:   ${has_pro_field ? 'Sim' : 'Não'}`)

  const { data, error } = await supabase
    .from('races')
    .insert({ name, slug, date, location, country, country_code: country_code || null, distance, has_pro_field, status })
    .select('id, name, slug')
    .single()

  if (error) {
    if (error.code === '23505') {
      console.error('\n❌  Já existe uma prova com este slug:', slug)
      console.error('    Altere o nome ou atualize a prova existente em /admin/provas')
    } else {
      console.error('\n❌  Erro ao criar prova:', error.message)
    }
    process.exit(1)
  }

  console.log(`\n✅  Prova criada com sucesso!`)
  console.log(`   ID:   ${data.id}`)
  console.log(`   URL:  /provas/${data.slug}`)
  console.log(`\n💡  Próximos passos:`)
  console.log(`   1. Importe a startlist:  /import-startlist`)
  console.log(`   2. Quando pronto, mude o status para "open" em /admin/provas/${data.id}`)
})()
