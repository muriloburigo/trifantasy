import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const { data: league } = await sb.from('leagues').select('id, name').eq('is_global', true).single()
console.log('Global league id:', league?.id)

// Check member count
const { count } = await sb.from('league_members').select('*', { count: 'exact', head: true }).eq('league_id', league.id)
console.log('Members:', count)

// Check profiles NOT in global league
const { data: allProfiles } = await sb.from('profiles').select('id, name, is_admin')
const { data: members } = await sb.from('league_members').select('user_id').eq('league_id', league.id)
const memberSet = new Set(members?.map(m => m.user_id))

const missing = allProfiles?.filter(p => !memberSet.has(p.id)) ?? []
console.log('Profiles NOT in global league:', missing.length)
missing.forEach(p => console.log(`  - ${p.name} (${p.id}) admin=${p.is_admin}`))

// Verify the league_members join to profiles works
const { data: membersWithProfile, error } = await sb
  .from('league_members')
  .select('user_id, joined_at, profile:profiles(name)')
  .eq('league_id', league.id)
  .limit(5)
console.log('\nJoin test error:', error)
console.log('Sample members with profiles:', membersWithProfile?.map(m => ({ name: m.profile?.name, joined: m.joined_at })))
