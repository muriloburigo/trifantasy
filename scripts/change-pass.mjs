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

const email = 'muriloburigo@gmail.com'
const newPassword = '160304Vi!'

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) { console.error('Erro ao listar:', listError.message); return }

  const user = users.find(u => u.email === email)
  if (!user) { console.error('Usuário não encontrado:', email); return }

  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword })
  if (updateError) {
    console.error('Erro ao atualizar senha:', updateError.message)
  } else {
    console.log(`✓ Senha de ${email} atualizada com sucesso!`)
  }
}
run()
