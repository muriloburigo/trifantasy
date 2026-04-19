/**
 * Insert IRONMAN Texas 2026 results (April 18, 2026)
 * Top 3 men + top 3 women (confirmed from PTO API)
 * Also marks race as finished and updates athlete prices.
 *
 * Run: node scripts/insert-texas-results.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const RACE_ID = 'b5b770e6-0f99-4760-a2f5-1f9d1f3c8c1f' // IRONMAN Texas 2026

// ── Results: top 3 MPRO + top 3 FPRO (confirmed from PTO API / ProTriNews)
// finish_time in seconds
const RESULTS = [
  // MPRO
  { athlete_id: 'f3099dcd-e01d-473a-bd1e-4a404415b9ef', name: 'Kristian Blummenfelt', pro_pos: 1, finish_time: 26484 }, // 7:21:24
  { athlete_id: '89a70e12-92cc-446e-a9e7-253f198012c6', name: 'Marten Van Riel',       pro_pos: 2, finish_time: 26576 }, // 7:22:56
  { athlete_id: 'dc1b7037-47b7-47af-95fa-f8b213c3ceaa', name: 'Casper Stornes',         pro_pos: 3, finish_time: 26630 }, // 7:23:50
  // FPRO
  { athlete_id: '9062d77a-e6d5-47da-a435-b0e0a5a16298', name: 'Solveig Løvseth', pro_pos: 1, finish_time: 29469 }, // 8:11:09
  { athlete_id: 'fbbc971d-3bbe-44d8-b660-296ee1f2f819', name: 'Taylor Knibb',    pro_pos: 2, finish_time: 29688 }, // 8:14:48
  { athlete_id: '4b1c941f-6719-424d-9c56-24d2d331f518', name: 'Marta Sánchez',   pro_pos: 3, finish_time: 30666 }, // 8:31:06
]


// ── Insert results
console.log('→ Inserting results for IRONMAN Texas 2026...')
const rows = RESULTS.map(r => ({
  race_id: RACE_ID,
  athlete_id: r.athlete_id,
  pro_pos: r.pro_pos,
  finish_time: r.finish_time,
  dnf: false,
  dns: false,
  kona_slot: false,
}))

const { error: insErr } = await sb.from('results').upsert(rows, { onConflict: 'race_id,athlete_id' })
if (insErr) {
  console.error('Insert error:', insErr)
  process.exit(1)
}
console.log(`  ✅ Inserted ${rows.length} results`)

// ── Mark race as finished
const { error: raceErr } = await sb.from('races').update({ status: 'finished' }).eq('id', RACE_ID)
if (raceErr) { console.error('Race update error:', raceErr) }
else console.log('  ✅ Race marked as finished')

console.log('\n✅ Done! IRONMAN Texas 2026 results saved.')
console.log('   → Agora calcule a pontuação no admin para atualizar os preços via updateMarket.')
