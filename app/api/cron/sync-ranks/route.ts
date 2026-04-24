import { NextResponse } from 'next/server'
import { createAdminClient } from '~/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * CRON: Sincronização semanal de Rankings (PTO e WTCS)
 * Agenda: Toda segunda-feira às 07:00 GMT-3 (10:00 UTC)
 */

// Dados de elite WTCS (Baseline estável para atletas olímpicos)
const WTCS_DATA = [
  // Men
  { name: 'Alex Yee', rank: 1 }, { name: 'Matthew Hauser', rank: 2 },
  { name: 'Miguel Hidalgo', rank: 3 }, { name: 'Vasco Vilaça', rank: 4 },
  { name: 'Léo Bergere', rank: 5 }, { name: 'Roberto Sánchez Mantecón', rank: 6 },
  { name: 'David Cantero Del Campo', rank: 7 }, { name: 'Luke Willian', rank: 8 },
  { name: 'Csongor Lehmann', rank: 9 }, { name: 'Kenji Nener', rank: 10 },
  { name: 'Tim Hellwig', rank: 11 }, { name: 'Vincent Luis', rank: 12 },
  { name: 'Pierre Le Corre', rank: 13 }, { name: 'Manoel Messias', rank: 14 },
  { name: 'Hayden Wilde', rank: 23 }, { name: 'Kristian Blummenfelt', rank: 45 },
  { name: 'Marten Van Riel', rank: 52 }, { name: 'Jelle Geens', rank: 31 },
  { name: 'Morgan Pearson', rank: 28 }, { name: 'Seth Rider', rank: 29 },
  { name: 'Hugo Milner', rank: 16 }, { name: 'Charles Paquet', rank: 17 },
  { name: 'Lasse Lührs', rank: 20 }, { name: 'Antonio Serrat Seoane', rank: 15 },
  { name: 'Vittorio Lopes', rank: 40 }, { name: 'Kauê Willy', rank: 80 },

  // Women
  { name: 'Cassandre Beaugrand', rank: 1 }, { name: 'Beth Potter', rank: 2 },
  { name: 'Georgia Taylor-Brown', rank: 3 }, { name: 'Lisa Tertsch', rank: 4 },
  { name: 'Taylor Knibb', rank: 5 }, { name: 'Jeanne Lehair', rank: 6 },
  { name: 'Emma Lombardi', rank: 7 }, { name: 'Flora Duffy', rank: 8 },
  { name: 'Taylor Spivey', rank: 9 }, { name: 'Léonie Périault', rank: 10 },
  { name: 'Laura Lindemann', rank: 11 }, { name: 'Kate Waugh', rank: 12 },
  { name: 'Djenyfer Arnold', rank: 13 }, { name: 'Vittoria Lopes', rank: 14 },
  { name: 'Alice Betto', rank: 15 }, { name: 'Rosa Maria Tapia Vidal', rank: 16 },
  { name: 'Tanja Neubert', rank: 17 }, { name: 'Diana Isakova', rank: 18 },
  { name: 'Tilda Månsson', rank: 19 }, { name: 'Annika Koch', rank: 20 },
  { name: 'Julie Derron', rank: 21 }, { name: 'Solveig Løvseth', rank: 22 },
  { name: 'Luma Guillen', rank: 90 }, { name: 'Bianca Seregni', rank: 25 },
]

async function fetchPtoRankings(gender: 'M' | 'F') {
  const url = `https://stats.protriathletes.org/api/rankings/${gender === 'M' ? 'men' : 'women'}?limit=250`
  const res = await fetch(url, { headers: { 'Accept': 'application/json' }, next: { revalidate: 0 } })
  if (!res.ok) return []
  const data = await res.json()
  return data.rankings ?? []
}

function normalize(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[-]/g, " ").trim()
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const admin = createAdminClient()
  
  try {
    const [ptoMen, ptoWomen] = await Promise.all([ fetchPtoRankings('M'), fetchPtoRankings('F') ])
    
    const wtcsMap = new Map()
    WTCS_DATA.forEach(a => wtcsMap.set(normalize(a.name), a.rank))

    const ptoMap = new Map()
    ptoMen.forEach((a: any) => ptoMap.set(normalize(a.name), a.rank))
    ptoWomen.forEach((a: any) => ptoMap.set(normalize(a.name), a.rank))

    const { data: athletes } = await admin.from('athletes').select('id, name, pto_rank, wtcs_rank')
    if (!athletes) throw new Error('Could not fetch athletes')

    let updatedCount = 0
    for (const ath of athletes) {
      const key = normalize(ath.name)
      const newPto = ptoMap.get(key) || null
      const newWtcs = wtcsMap.get(key) || null
      
      if (ath.pto_rank !== newPto || ath.wtcs_rank !== newWtcs) {
        await admin.from('athletes')
          .update({ pto_rank: newPto, wtcs_rank: newWtcs })
          .eq('id', ath.id)
        updatedCount++
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: athletes.length,
      updated_athletes: updatedCount,
      message: 'Rankings PTO e WTCS sincronizados.' 
    })

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
