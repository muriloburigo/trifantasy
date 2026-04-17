/**
 * Torna um usuário admin pelo email.
 * Usage: node scripts/set-admin.mjs email@exemplo.com
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

const email = process.argv[2]
if (!email) { console.error('Uso: node scripts/set-admin.mjs email@exemplo.com'); process.exit(1) }

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const { data: users, error } = await supabase.auth.admin.listUsers()
if (error) { console.error(error.message); process.exit(1) }

const user = users.users.find(u => u.email === email)
if (!user) { console.error(`Usuário não encontrado: ${email}`); process.exit(1) }

const { error: pErr } = await supabase
  .from('profiles')
  .update({ is_admin: true })
  .eq('id', user.id)

if (pErr) { console.error(pErr.message); process.exit(1) }
console.log(`✓ ${email} agora é admin.`)
