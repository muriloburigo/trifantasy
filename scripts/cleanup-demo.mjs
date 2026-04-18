/**
 * Remove dados de demo da Florianópolis e usuários fake.
 * Run: node scripts/cleanup-demo.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

// 1. Apaga usuários demo
const { data: users } = await sb.auth.admin.listUsers()
const demoUsers = (users?.users ?? []).filter(u => u.email?.endsWith('@trixer-demo.com'))
console.log(`→ Removendo ${demoUsers.length} usuários demo...`)
for (const u of demoUsers) {
  await sb.auth.admin.deleteUser(u.id)
}
console.log('✓ Usuários removidos')

// 2. Remove prova de Florianópolis 70.3 (e tudo em cascata via FK)
const { data: flo } = await sb.from('races').select('id').eq('slug', 'ironman-703-florianopolis-2026').single()
if (flo) {
  await sb.from('races').delete().eq('id', flo.id)
  console.log('✓ Prova Florianópolis 70.3 2026 removida')
} else {
  console.log('— Florianópolis não encontrada, nada a remover')
}

console.log('✅ Cleanup concluído')
