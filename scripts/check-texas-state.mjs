import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const { data: race } = await sb.from('races').select('id, status').eq('slug', 'ironman-texas-2026').single()
console.log('Texas race status:', race?.status, '| id:', race?.id)

const { data: results } = await sb.from('results').select('pro_pos, dnf, dns, finish_time, swim_time, athlete:athletes(name, gender)').eq('race_id', race.id).order('pro_pos')
console.log('Results in DB:', results?.length)
for (const r of results ?? []) {
  const status = r.dnf ? 'DNF' : r.dns ? 'DNS' : `pos ${r.pro_pos}`
  console.log(`  ${status.padEnd(6)} ${r.athlete?.gender} ${r.athlete?.name} finish=${r.finish_time} swim=${r.swim_time}`)
}

// Check if market was already run for Texas
const { data: hist } = await sb.from('athlete_price_history').select('athlete_id, reason').eq('race_id', race.id).limit(10)
console.log('\nPrice history entries for Texas:', hist?.length)
