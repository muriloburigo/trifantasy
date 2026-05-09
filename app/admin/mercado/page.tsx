import { createAdminClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/auth/require-admin'
import { getMarketStatus } from '~/lib/market'
import MercadoManager from './MercadoManager'
import MarketOverridePanel from './MarketOverridePanel'

export default async function MercadoPage() {
  await requireAdmin()
  const supabase = createAdminClient()

  const [athletesRes, portfolioRes, marketStatus] = await Promise.all([
    supabase
      .from('athletes')
      .select('id, name, gender, country, pto_rank, current_price, price_change')
      .eq('type', 'pro')
      .order('current_price', { ascending: false }),
    supabase
      .from('portfolio')
      .select('athlete_id'),
    getMarketStatus(supabase),
  ])

  // Count owners per athlete
  const ownerMap: Record<string, number> = {}
  for (const row of portfolioRes.data ?? []) {
    ownerMap[row.athlete_id] = (ownerMap[row.athlete_id] ?? 0) + 1
  }

  const athletes = (athletesRes.data ?? []).map(a => ({
    ...a,
    owners: ownerMap[a.id] ?? 0,
  }))

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-1">Mercado — Atletas PRO</h1>
      <p className="text-sm text-[var(--color-muted)] mb-6">
        Gerencie preços e variações. Donos = usuários com o atleta no portfolio agora.
      </p>

      <MarketOverridePanel
        override={marketStatus.override ?? null}
        locked={marketStatus.locked}
        reasonKey={marketStatus.reasonKey}
      />

      <MercadoManager athletes={athletes} />
    </div>
  )
}
