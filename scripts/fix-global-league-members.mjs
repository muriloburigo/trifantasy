import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const { data: league } = await sb.from('leagues').select('id').eq('is_global', true).single()
const { data: profiles } = await sb.from('profiles').select('id, name')
const { data: existing } = await sb.from('league_members').select('user_id').eq('league_id', league.id)
const memberSet = new Set(existing?.map(m => m.user_id))
const missing = profiles?.filter(p => !memberSet.has(p.id)) ?? []

if (missing.length === 0) { console.log('All profiles already in global league'); process.exit(0) }

console.log(`Adding ${missing.length} missing profiles:`, missing.map(p => p.name))
const { error } = await sb.from('league_members').insert(missing.map(p => ({ league_id: league.id, user_id: p.id })))
if (error) console.error(error)
else console.log('✅ Done')
