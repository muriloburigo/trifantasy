import { NextResponse } from 'next/server'
import { createAdminClient } from '~/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * CRON: Sincronização semanal de Rankings (PTO e WTCS)
 * Agenda: Toda segunda-feira às 07:00 GMT-3 (10:00 UTC)
 */

const COUNTRY_MAP: Record<string, string> = {
  'NZ': 'New Zealand', 'BE': 'Belgium', 'DE': 'Germany', 'US': 'United States',
  'FR': 'France', 'GB': 'Great Britain', 'NL': 'Netherlands', 'CH': 'Switzerland',
  'AU': 'Australia', 'NO': 'Norway', 'DK': 'Denmark', 'CA': 'Canada', 'SE': 'Sweden',
  'AT': 'Austria', 'ES': 'Spain', 'ZA': 'South Africa', 'PL': 'Poland', 'IT': 'Italy',
  'PT': 'Portugal', 'MX': 'Mexico', 'AR': 'Argentina', 'CL': 'Chile', 'BR': 'Brazil',
  'EC': 'Ecuador', 'CO': 'Colombia', 'TR': 'Turkey', 'HU': 'Hungary', 'FI': 'Finland',
}

async function fetchPtoRankings(gender: 'M' | 'F') {
  const url = `https://stats.protriathletes.org/api/rankings/${gender === 'M' ? 'men' : 'women'}?limit=250`
  const res = await fetch(url, { headers: { 'Accept': 'application/json' }, next: { revalidate: 0 } })
  if (!res.ok) return []
  const data = await res.json()
  return data.rankings ?? []
}

function normalize(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()
}

export async function GET(req: Request) {
  // Verificação de segurança (Secret Key do Vercel Cron)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const admin = createAdminClient()
  
  try {
    console.log('[Cron] Iniciando sincronização de rankings...')
    
    // 1. Buscar Rankings PTO (API pública estável)
    const [ptoMen, ptoWomen] = await Promise.all([ fetchPtoRankings('M'), fetchPtoRankings('F') ])
    const ptoMap = new Map()
    ptoMen.forEach((a: any) => ptoMap.set(normalize(a.name), a.rank))
    ptoWomen.forEach((a: any) => ptoMap.set(normalize(a.name), a.rank))

    // 2. Buscar Atletas do Banco
    const { data: athletes } = await admin.from('athletes').select('id, name, gender, pto_rank, wtcs_rank')
    if (!athletes) throw new Error('Could not fetch athletes')

    let updated = 0
    for (const ath of athletes) {
      const key = normalize(ath.name)
      const newPto = ptoMap.get(key) || null
      
      // Nota: WTCS rank requer automação via scraper ou API restrita. 
      // Por ora, mantemos o pto_rank automatizado e o wtcs_rank preservado ou via seed manual.
      
      if (ath.pto_rank !== newPto) {
        await admin.from('athletes')
          .update({ pto_rank: newPto })
          .eq('id', ath.id)
        updated++
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: athletes.length,
      updated_pto: updated,
      message: 'Rankings sincronizados com sucesso.' 
    })

  } catch (error: any) {
    console.error('[Cron Error]:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
