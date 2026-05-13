/**
 * Sync race_athletes.price for the Yokohama 2026 race from athletes.current_price.
 * Run: node scripts/sync-yokohama-ra-prices.mjs
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envContent = readFileSync(resolve(__dirname, '../.env.local'), 'utf8')
const env = {}
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^#=\s][^=]*)=(.*)$/)
  if (m) env[m[1].trim()] = m[2].trim().replace(/^"(.*)"$/, '$1').replace(/\\n$/, '').trim()
}

const BASE = env.NEXT_PUBLIC_SUPABASE_URL
const KEY  = env.SUPABASE_SERVICE_ROLE_KEY
const hdrs = { Authorization: `Bearer ${KEY}`, apikey: KEY, 'Content-Type': 'application/json' }
const RACE = 'b8440cdb-ede8-4274-8939-941c6a754f22'

async function get(path) {
  const r = await fetch(`${BASE}/rest/v1/${path}`, { headers: hdrs })
  const t = await r.text()
  if (!r.ok) throw new Error(`GET ${path} → ${r.status}: ${t}`)
  return JSON.parse(t)
}
async function patch(path, body) {
  const r = await fetch(`${BASE}/rest/v1/${path}`, {
    method: 'PATCH', headers: { ...hdrs, Prefer: 'return=minimal' }, body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(`PATCH ${path} → ${r.status}: ${await r.text()}`)
}

// 1. Fetch all race_athletes for Yokohama
const ras = await get(`race_athletes?race_id=eq.${RACE}&select=id,athlete_id,price`)
console.log(`Yokohama race_athletes: ${ras.length} entries`)

// 2. Fetch athletes in batches of 20 to avoid URL length issues
const BATCH = 20
let synced = 0

for (let i = 0; i < ras.length; i += BATCH) {
  const chunk = ras.slice(i, i + BATCH)
  const ids = chunk.map(r => r.athlete_id).join(',')
  const athletes = await get(`athletes?id=in.(${ids})&select=id,name,current_price`)
  const priceMap = new Map(athletes.map(a => [a.id, { name: a.name, price: Number(a.current_price) }]))

  for (const ra of chunk) {
    const entry = priceMap.get(ra.athlete_id)
    if (!entry) continue
    if (entry.price !== Number(ra.price)) {
      await patch(`race_athletes?id=eq.${ra.id}`, { price: entry.price })
      console.log(`  ✅ ${entry.name.padEnd(35)} T$${ra.price} → T$${entry.price}`)
      synced++
    }
  }
}

console.log(`\n✅ Done — ${synced} race_athletes prices synced`)
