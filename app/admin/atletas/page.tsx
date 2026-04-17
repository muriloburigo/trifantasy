import { createAdminClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/auth/require-admin'
import { removeRaceAthlete } from './actions'
import BulkImport from './BulkImport'
import AddAthleteForm from './AddAthleteForm'
import { Trash2 } from 'lucide-react'

export default async function AdminAtletasPage({
  searchParams,
}: {
  searchParams: Promise<{ race_id?: string }>
}) {
  await requireAdmin()
  const supabase = createAdminClient()
  const { race_id } = await searchParams

  const { data: races } = await supabase.from('races').select('id, name').order('date', { ascending: true })

  const selectedRaceId = race_id ?? races?.[0]?.id ?? ''

  const { data: raceAthletes } = selectedRaceId
    ? await supabase
        .from('race_athletes')
        .select('id, bib, price, athlete:athletes(id, name, gender, type, age_group, club, country, pto_rank)')
        .eq('race_id', selectedRaceId)
        .order('price', { ascending: false })
    : { data: [] }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Atletas</h1>

      {/* Race selector */}
      <form method="GET" className="mb-6">
        <label className="block text-sm text-[var(--color-muted)] mb-1">Prova</label>
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
        {/* Add single athlete */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4">
            <h2 className="font-bold mb-4 text-sm">Adicionar Atleta</h2>
            <AddAthleteForm raceId={selectedRaceId} />
          </div>

          {/* Bulk import */}
          <BulkImport raceId={selectedRaceId} />
        </div>

        {/* Athletes list */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-navy-border)] text-sm text-[var(--color-muted)]">
              {raceAthletes?.length ?? 0} atletas nesta prova
            </div>
            <div className="divide-y divide-[var(--color-navy-border)] max-h-[600px] overflow-y-auto">
              {(raceAthletes ?? []).map((ra: any) => (
                <div key={ra.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--color-navy-elevated)]/30">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${
                    ra.athlete?.type === 'pro' ? 'bg-[var(--color-orange)]/20 text-[var(--color-orange)]' : 'bg-[var(--color-navy-elevated)] text-[var(--color-muted)]'
                  }`}>
                    {ra.athlete?.type === 'pro' ? 'PRO' : ra.athlete?.age_group ?? 'AG'}
                  </span>
                  <span className="text-sm flex-1 truncate">{ra.athlete?.name}</span>
                  <span className="text-xs text-[var(--color-muted)] shrink-0">{ra.athlete?.gender} · {ra.athlete?.country}</span>
                  <span className="text-xs font-bold text-[var(--color-orange)] shrink-0">T${ra.price}</span>
                  <form action={removeRaceAthlete.bind(null, ra.id)}>
                    <button type="submit" className="p-1 text-[var(--color-muted)] hover:text-[var(--color-danger)] transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </form>
                </div>
              ))}
              {(!raceAthletes || raceAthletes.length === 0) && (
                <div className="text-center py-12 text-sm text-[var(--color-muted)]">
                  Nenhum atleta nesta prova.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
