import { createAdminClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/auth/require-admin'
import { formatDate } from '~/lib/utils'
import TriggerScoring from './TriggerScoring'
import { BarChart2, TrendingUp, TrendingDown } from 'lucide-react'

export default async function AdminPontuacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ race_id?: string }>
}) {
  await requireAdmin()
  const supabase = createAdminClient()
  const { race_id } = await searchParams

  const { data: races } = await supabase
    .from('races')
    .select('id, name, date, status, distance')
    .in('status', ['locked', 'finished', 'open'])
    .order('date', { ascending: false })

  const selectedRaceId = race_id ?? races?.[0]?.id ?? ''

  // Price history for selected race
  const { data: priceHistoryRows } = selectedRaceId
    ? await supabase
        .from('athlete_price_history')
        .select('athlete_id, old_price, new_price, change, recorded_at, athlete:athletes(name)')
        .eq('race_id', selectedRaceId)
        .eq('reason', 'race_result')
        .order('change', { ascending: false })
    : { data: [] }

  const sorted = (priceHistoryRows ?? []).sort((a: any, b: any) => Number(b.change) - Number(a.change))

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Atualização de Mercado</h1>

      {/* Race selector */}
      <form method="GET" className="mb-6">
        <div className="flex gap-2">
          <select name="race_id" defaultValue={selectedRaceId}
            className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]">
            {(races ?? []).map((r: any) => (
              <option key={r.id} value={r.id}>
                {r.name} — {formatDate(r.date)} ({r.status})
              </option>
            ))}
          </select>
          <button type="submit"
            className="bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] px-4 py-2 rounded-lg text-sm hover:border-[var(--color-orange)] transition-colors">
            Selecionar
          </button>
        </div>
      </form>

      {selectedRaceId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trigger */}
          <div className="lg:col-span-1">
            <TriggerScoring raceId={selectedRaceId} />
          </div>

          {/* Price history preview */}
          <div className="lg:col-span-2">
            <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--color-navy-border)] flex items-center gap-2">
                <BarChart2 size={15} className="text-[var(--color-orange)]" />
                <span className="font-bold text-sm">Variação de Preços</span>
                <span className="ml-auto text-xs text-[var(--color-muted)]">{sorted.length} atletas</span>
              </div>
              <div className="divide-y divide-[var(--color-navy-border)] max-h-[600px] overflow-y-auto">
                {sorted.map((row: any, i: number) => {
                  const change = Number(row.change)
                  const isUp = change > 0
                  return (
                    <div key={row.athlete_id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="text-sm text-[var(--color-muted)] w-6 text-center">{i + 1}</span>
                      <span className="flex-1 text-sm truncate">{(row.athlete as any)?.name ?? row.athlete_id.slice(0, 8)}</span>
                      <span className="text-xs text-[var(--color-muted)]">
                        T${Number(row.old_price).toFixed(0)} → T${Number(row.new_price).toFixed(0)}
                      </span>
                      <span className={`font-bold text-sm flex items-center gap-1 ${isUp ? 'text-[var(--color-success)]' : change < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-muted)]'}`}>
                        {isUp ? <TrendingUp size={13} /> : change < 0 ? <TrendingDown size={13} /> : null}
                        {isUp ? '+' : ''}{change.toFixed(0)}
                      </span>
                    </div>
                  )
                })}
                {sorted.length === 0 && (
                  <div className="text-center py-10 text-sm text-[var(--color-muted)]">
                    Nenhuma variação de preço registrada para esta prova.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
