import { createAdminClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/auth/require-admin'
import { formatTime } from '~/lib/utils'
import BulkResultImport from './BulkResultImport'
import { CheckCircle, XCircle } from 'lucide-react'

export default async function AdminResultadosPage({
  searchParams,
}: {
  searchParams: Promise<{ race_id?: string }>
}) {
  await requireAdmin()
  const supabase = createAdminClient()
  const { race_id } = await searchParams

  const { data: races } = await supabase.from('races').select('id, name').order('date', { ascending: false })
  const selectedRaceId = race_id ?? races?.[0]?.id ?? ''

  const { data: results } = selectedRaceId
    ? await supabase
        .from('results')
        .select('*, athlete:athletes(name, type, age_group, gender)')
        .eq('race_id', selectedRaceId)
        .order('finish_time', { ascending: true, nullsFirst: false })
    : { data: [] }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Resultados</h1>

      {/* Race selector */}
      <form method="GET" className="mb-6">
        <div className="flex gap-2">
          <select name="race_id" defaultValue={selectedRaceId}
            className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]">
            {(races ?? []).map((r: any) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <button type="submit"
            className="bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] px-4 py-2 rounded-lg text-sm hover:border-[var(--color-orange)] transition-colors">
            Filtrar
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bulk import */}
        <div className="lg:col-span-1">
          <BulkResultImport raceId={selectedRaceId} />
        </div>

        {/* Results table */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-navy-border)] text-sm text-[var(--color-muted)]">
              {results?.length ?? 0} resultados
            </div>
            <div className="overflow-auto max-h-[600px]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-navy-border)] text-[var(--color-muted)]">
                    <th className="text-left px-3 py-2">Atleta</th>
                    <th className="px-3 py-2">Pos.</th>
                    <th className="px-3 py-2">Natação</th>
                    <th className="px-3 py-2">Bike</th>
                    <th className="px-3 py-2">Corrida</th>
                    <th className="px-3 py-2">Total</th>
                    <th className="px-3 py-2">Flags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-navy-border)]">
                  {(results ?? []).map((r: any) => (
                    <tr key={r.id} className="hover:bg-[var(--color-navy-elevated)]/20">
                      <td className="px-3 py-2">
                        <span className={`text-xs mr-1 ${r.athlete?.type === 'pro' ? 'text-[var(--color-orange)]' : 'text-[var(--color-muted)]'}`}>
                          {r.athlete?.type === 'pro' ? 'PRO' : r.athlete?.age_group ?? 'AG'}
                        </span>
                        {r.athlete?.name}
                      </td>
                      <td className="px-3 py-2 text-center text-[var(--color-muted)]">
                        {r.athlete?.type === 'pro' ? r.pro_pos : r.ag_pos}
                      </td>
                      <td className="px-3 py-2 text-center text-[var(--color-muted)]">{formatTime(r.swim_time)}</td>
                      <td className="px-3 py-2 text-center text-[var(--color-muted)]">{formatTime(r.bike_time)}</td>
                      <td className="px-3 py-2 text-center text-[var(--color-muted)]">{formatTime(r.run_time)}</td>
                      <td className="px-3 py-2 text-center font-mono">{formatTime(r.finish_time)}</td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {r.dnf && <span className="text-[var(--color-danger)] text-xs">DNF</span>}
                          {r.dns && <span className="text-[var(--color-muted)] text-xs">DNS</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!results || results.length === 0) && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-[var(--color-muted)]">
                        Nenhum resultado importado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
