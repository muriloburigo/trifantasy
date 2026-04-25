import { createAdminClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/auth/require-admin'
import BulkResultImport from './BulkResultImport'
import ResultsManager from './ResultsManager'
import { formatDate } from '~/lib/utils'

export default async function AdminResultadosPage({
  searchParams,
}: {
  searchParams: Promise<{ race_id?: string }>
}) {
  await requireAdmin()
  const supabase = createAdminClient()
  const { race_id } = await searchParams

  const { data: races } = await supabase
    .from('races')
    .select('id, name, date, status')
    .order('date', { ascending: false })

  const selectedRaceId = race_id ?? races?.[0]?.id ?? ''

  const [resultsRes, raceAthletesRes] = await Promise.all([
    selectedRaceId
      ? supabase
          .from('results')
          .select('athlete_id, pro_pos, swim_time, bike_time, run_time, finish_time, dnf, dns, athlete:athletes(name, type, gender)')
          .eq('race_id', selectedRaceId)
          .order('pro_pos', { ascending: true, nullsFirst: false })
      : Promise.resolve({ data: [] }),
    selectedRaceId
      ? supabase
          .from('race_athletes')
          .select('athlete_id, athlete:athletes(name, gender)')
          .eq('race_id', selectedRaceId)
          .order('price', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  const statusLabel: Record<string, string> = {
    upcoming: 'Prevista',
    open: 'Aberta',
    locked: 'Fechada',
    finished: 'Finalizada',
  }

  return (
    <div className="p-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Resultados</h1>

      {/* Race selector */}
      <form method="GET" className="mb-6">
        <label className="block text-sm text-[var(--color-muted)] mb-1">Prova</label>
        <div className="flex gap-2">
          <select
            name="race_id"
            defaultValue={selectedRaceId}
            className="flex-1 max-w-sm bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]"
          >
            {(races ?? []).map((r: any) => (
              <option key={r.id} value={r.id}>
                {r.name} · {formatDate(r.date)} · {statusLabel[r.status] ?? r.status}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] px-4 py-2 rounded-lg text-sm hover:border-[var(--color-orange)] transition-colors"
          >
            Selecionar
          </button>
        </div>
      </form>

      {selectedRaceId && (
        <div className="space-y-6">
          {/* Results table with inline management */}
          <ResultsManager
            results={(resultsRes.data ?? []) as any}
            raceAthletes={(raceAthletesRes.data ?? []) as any}
            raceId={selectedRaceId}
          />

          {/* Bulk import (collapsed by default) */}
          <details className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl overflow-hidden">
            <summary className="px-4 py-3 text-sm font-semibold cursor-pointer hover:bg-[var(--color-navy-elevated)]/30 select-none">
              Importação em massa (JSON)
            </summary>
            <div className="p-4 border-t border-[var(--color-navy-border)]">
              <BulkResultImport raceId={selectedRaceId} />
            </div>
          </details>
        </div>
      )}
    </div>
  )
}
