import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()

// Use ANON key (same as public page)
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('NEXT_PUBLIC_SUPABASE_ANON_KEY'))

const { data: race } = await sb.from('races').select('id, status').eq('slug', 'ironman-south-africa-2026').single()

const { data: resultsData, error } = await sb
  .from('results')
  .select('pro_pos, finish_time, dnf, dns, athlete:athletes(id, name, country, gender)')
  .eq('race_id', race.id)
  .not('pro_pos', 'is', null)
  .order('pro_pos', { ascending: true })

console.log('Error:', error)
console.log('Total rows (anon):', resultsData?.length)
const nullAth = resultsData?.filter(r => !r.athlete) ?? []
console.log('Null athlete rows:', nullAth.length)
const men = resultsData?.filter(r => r.athlete?.gender === 'M') ?? []
const women = resultsData?.filter(r => r.athlete?.gender === 'F') ?? []
console.log(`Men: ${men.length}, Women: ${women.length}`)
