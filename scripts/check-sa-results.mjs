import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const { data: race } = await sb.from('races').select('id, status').eq('slug', 'ironman-south-africa-2026').single()
console.log('Race status:', race?.status)

const { data: resultsData, error } = await sb
  .from('results')
  .select('pro_pos, finish_time, dnf, dns, athlete:athletes(id, name, country, gender)')
  .eq('race_id', race.id)
  .not('pro_pos', 'is', null)
  .order('pro_pos', { ascending: true })

console.log('Query error:', error)
console.log('Total rows:', resultsData?.length)
const nullAth = resultsData?.filter(r => !r.athlete) ?? []
console.log('Rows with null athlete:', nullAth.length, nullAth.map(r => r.pro_pos))

const men = resultsData?.filter(r => r.athlete?.gender === 'M') ?? []
const women = resultsData?.filter(r => r.athlete?.gender === 'F') ?? []
console.log(`Men with athlete data: ${men.length}, Women: ${women.length}`)
