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

// 2. Remove apenas os times/scores/ligas fake ligados a usuários demo
//    A prova de Florianópolis é real — não deve ser removida.
const demoEmails = demoUsers.map(u => u.id)
if (demoEmails.length > 0) {
  // Remove league memberships de usuários demo
  for (const uid of demoEmails) {
    await sb.from('league_members').delete().eq('user_id', uid)
    const { data: teams } = await sb.from('teams').select('id').eq('user_id', uid)
    for (const t of (teams ?? [])) {
      await sb.from('scores').delete().eq('team_id', t.id)
      await sb.from('team_athletes').delete().eq('team_id', t.id)
    }
    await sb.from('teams').delete().eq('user_id', uid)
  }
  console.log('✓ Times, scores e ligas dos usuários demo removidos')
}

console.log('✅ Cleanup concluído')
