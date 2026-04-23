import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
const get = (k) => env.match(new RegExp(`^${k}=(.+)$`, 'm'))?.[1]?.trim()
const sb = createClient(get('NEXT_PUBLIC_SUPABASE_URL'), get('SUPABASE_SERVICE_ROLE_KEY'))

const WTCS_MEN = [
  { name: 'Matthew Hauser', rank: 1 }, { name: 'Miguel Hidalgo', rank: 2 },
  { name: 'Vasco Vilaça', rank: 3 }, { name: 'Léo Bergere', rank: 4 },
  { name: 'David Cantero Del Campo', rank: 5 }, { name: 'Csongor Lehmann', rank: 6 },
  { name: 'Luke Willian', rank: 7 }, { name: 'Roberto Sánchez Mantecón', rank: 8 },
  { name: 'Alessio Crociani', rank: 9 }, { name: 'Max Studer', rank: 10 },
  { name: 'Antonio Serrat Seoane', rank: 15 }, { name: 'Alex Yee', rank: 1 },
  { name: 'Manoel Messias', rank: 33 }, { name: 'Vittoria Lopes', rank: 42 },
]

const WTCS_WOMEN = [
  { name: 'Lisa Tertsch', rank: 1 }, { name: 'Léonie Périault', rank: 2 },
  { name: 'Beth Potter', rank: 3 }, { name: 'Taylor Spivey', rank: 4 },
  { name: 'Bianca Seregni', rank: 5 }, { name: 'Jeanne Lehair', rank: 6 },
  { name: 'Emma Lombardi', rank: 7 }, { name: 'Rosa Maria Tapia Vidal', rank: 8 },
  { name: 'Tanja Neubert', rank: 9 }, { name: 'Diana Isakova', rank: 10 },
  { name: 'Cassandre Beaugrand', rank: 1 }, { name: 'Georgia Taylor-Brown', rank: 5 },
  { name: 'Djenyfer Arnold', rank: 35 },
]

function priceFromRank(rank) {
  if (!rank || rank > 500) return 10
  if (rank <= 7) return 35
  if (rank <= 15) return 28
  if (rank <= 25) return 22
  if (rank <= 40) return 18
  if (rank <= 60) return 15
  if (rank <= 100) return 11
  return 10
}

async function fetchPtoRankings(gender) {
  const url = `https://stats.protriathletes.org/api/rankings/${gender === 'M' ? 'men' : 'women'}?limit=250`
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } })
  const data = await res.json()
  return data.rankings ?? []
}

function normalize(name) {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
}

async function run() {
  const [ptoMen, ptoWomen] = await Promise.all([ fetchPtoRankings('M'), fetchPtoRankings('F') ])
  const wtcsMap = new Map()
  WTCS_MEN.forEach(a => wtcsMap.set(normalize(a.name), a.rank))
  WTCS_WOMEN.forEach(a => wtcsMap.set(normalize(a.name), a.rank))
  const ptoMap = new Map()
  ptoMen.forEach(a => ptoMap.set(normalize(a.name), a.rank))
  ptoWomen.forEach(a => ptoMap.set(normalize(a.name), a.rank))

  const { data: dbAthletes } = await sb.from('athletes').select('*')
  console.log(`→ Updating ${dbAthletes.length} athletes with separate ranks...\n`)

  for (const dbA of dbAthletes) {
    const key = normalize(dbA.name)
    const ptoRank = ptoMap.get(key) || null
    const wtcsRank = wtcsMap.get(key) || null
    
    const bestRankForPrice = Math.min(ptoRank || 999, wtcsRank || 999)
    const newPrice = priceFromRank(bestRankForPrice === 999 ? null : bestRankForPrice)

    if (dbA.pto_rank !== ptoRank || dbA.wtcs_rank !== wtcsRank || Number(dbA.current_price) !== newPrice) {
      await sb.from('athletes').update({ 
        pto_rank: ptoRank,
        wtcs_rank: wtcsRank,
        current_price: newPrice,
        price_change: 0
      }).eq('id', dbA.id)
      console.log(`  ✓ ${dbA.name.padEnd(25)} | PTO: ${ptoRank ?? '—'} | WTCS: ${wtcsRank ?? '—'} | T$${newPrice}`)
    }
  }
  console.log('\nDone!')
}
run()
