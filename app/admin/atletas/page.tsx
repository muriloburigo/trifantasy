import { createAdminClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/auth/require-admin'
import { removeRaceAthlete } from './actions'
import BulkImport from './BulkImport'
import AddAthleteForm from './AddAthleteForm'
import AthleteEditPanel from './AthleteEditPanel'
import { Trash2, Pencil } from 'lucide-react'
import Link from 'next/link'

export default async function AdminAtletasPage({
  searchParams,
}: {
  searchParams: Promise<{ race_id?: string; edit?: string }>
}) {
  await requireAdmin()
  const supabase = createAdminClient()
  const { race_id, edit } = await searchParams

  const { data: races } = await supabase
    .from('races')
    .select('id, name, date')
    .order('date', { ascending: false })

  const isAll = race_id === 'all'
  const selectedRaceId = isAll ? 'all' : (race_id ?? races?.[0]?.id ?? '')

  // Fetch athletes list
  const athletesForEdit = edit
    ? await supabase.from('athletes').select('id,name,gender,type,country,country_code,pto_rank,current_price,price_change,photo_url').eq('id', edit).single()
    : null

  type RaceAthleteRow = {
    id: string
    bib: number | null
    price: number
    athlete: { id: string; name: string; gender: string; type: string; age_group: string | null; country: string | null; pto_rank: number | null } | null
  }
  type AllAthleteRow = {
    id: string
    name: string
    gender: string
    type: string
    country: string | null
    pto_rank: number | null
    current_price: number
    price_change: number | null
  }

  let raceAthletes: RaceAthleteRow[] = []
  let allAthletes: AllAthleteRow[] = []

  if (isAll) {
    const { data } = await supabase
      .from('athletes')
      .select('id, name, gender, type, country, pto_rank, current_price, price_change')
      .eq('type', 'pro')
      .order('pto_rank', { ascending: true, nullsFirst: false })
    allAthletes = (data ?? []) as AllAthleteRow[]
  } else if (selectedRaceId) {
    const { data } = await supabase
      .from('race_athletes')
      .select('id, bib, price, athlete:athletes(id, name, gender, type, age_group, country, pto_rank)')
      .eq('race_id', selectedRaceId)
      .order('price', { ascending: false })
    raceAthletes = (data ?? []) as any[]
  }

  const returnUrl = `/admin/atletas?race_id=${selectedRaceId}`

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Atletas</h1>

      {/* Race/view selector */}
      <form method="GET" className="mb-6">
        <label className="block text-sm text-[var(--color-muted)] mb-1">Filtro</label>
        <div className="flex gap-2">
          <select
            name="race_id"
            defaultValue={selectedRaceId}
            className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]"
          >
            <option value="all">— Todos os atletas PRO —</option>
            {(races ?? []).map((r: any) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] px-4 py-2 rounded-lg text-sm hover:border-[var(--color-orange)] transition-colors"
          >
            Filtrar
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: add/import (only for specific race view) + edit panel */}
        <div className="lg:col-span-1 space-y-4">
          {edit && athletesForEdit?.data && (
            <AthleteEditPanel
              athlete={athletesForEdit.data as any}
              returnUrl={returnUrl}
            />
          )}
          {!isAll && selectedRaceId && !edit && (
            <>
              <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4">
                <h2 className="font-bold mb-4 text-sm">Adicionar Atleta</h2>
                <AddAthleteForm raceId={selectedRaceId} />
              </div>
              <BulkImport raceId={selectedRaceId} />
            </>
          )}
          {isAll && !edit && (
            <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4 text-sm text-[var(--color-muted)]">
              <p className="font-semibold text-white mb-1">Vista global</p>
              <p>Exibe todos os atletas PRO cadastrados. Para adicionar atletas a uma prova, selecione a prova no filtro acima.</p>
              <p className="mt-2">Clique em <strong className="text-white">✏️</strong> para editar nome, país, rank PTO ou preço.</p>
            </div>
          )}
        </div>

        {/* Right: athletes list */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-navy-border)] text-sm text-[var(--color-muted)]">
              {isAll ? `${allAthletes.length} atletas PRO` : `${raceAthletes.length} atletas nesta prova`}
            </div>

            <div className="divide-y divide-[var(--color-navy-border)] max-h-[600px] overflow-y-auto">
              {isAll && allAthletes.map((a) => (
                <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--color-navy-elevated)]/30">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-[var(--color-orange)]/20 text-[var(--color-orange)] shrink-0">
                    PRO
                  </span>
                  <span className={`text-xs px-1 rounded shrink-0 ${a.gender === 'M' ? 'text-blue-400' : 'text-pink-400'}`}>
                    {a.gender}
                  </span>
                  <span className="text-sm flex-1 truncate">{a.name}</span>
                  <span className="text-xs text-[var(--color-muted)] shrink-0">{a.country ?? '—'}</span>
                  {a.pto_rank && <span className="text-xs text-[var(--color-muted)] shrink-0">#{a.pto_rank}</span>}
                  <span className="text-xs font-bold text-[var(--color-orange)] shrink-0">T${a.current_price}</span>
                  <Link
                    href={`/admin/atletas?race_id=all&edit=${a.id}`}
                    className="p-1 text-[var(--color-muted)] hover:text-white transition-colors"
                  >
                    <Pencil size={12} />
                  </Link>
                </div>
              ))}

              {!isAll && raceAthletes.map((ra) => (
                <div key={ra.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--color-navy-elevated)]/30">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${
                    ra.athlete?.type === 'pro'
                      ? 'bg-[var(--color-orange)]/20 text-[var(--color-orange)]'
                      : 'bg-[var(--color-navy-elevated)] text-[var(--color-muted)]'
                  }`}>
                    {ra.athlete?.type === 'pro' ? 'PRO' : 'AG'}
                  </span>
                  <span className="text-sm flex-1 truncate">{ra.athlete?.name}</span>
                  <span className="text-xs text-[var(--color-muted)] shrink-0">{ra.athlete?.gender} · {ra.athlete?.country}</span>
                  {ra.bib && <span className="text-xs text-[var(--color-muted)] shrink-0">#{ra.bib}</span>}
                  <span className="text-xs font-bold text-[var(--color-orange)] shrink-0">T${ra.price}</span>
                  {ra.athlete?.id && (
                    <Link
                      href={`/admin/atletas?race_id=${selectedRaceId}&edit=${ra.athlete.id}`}
                      className="p-1 text-[var(--color-muted)] hover:text-white transition-colors"
                    >
                      <Pencil size={12} />
                    </Link>
                  )}
                  <form action={removeRaceAthlete.bind(null, ra.id)}>
                    <button type="submit" className="p-1 text-[var(--color-muted)] hover:text-[var(--color-danger)] transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </form>
                </div>
              ))}

              {isAll && allAthletes.length === 0 && (
                <div className="text-center py-12 text-sm text-[var(--color-muted)]">Nenhum atleta PRO cadastrado.</div>
              )}
              {!isAll && raceAthletes.length === 0 && (
                <div className="text-center py-12 text-sm text-[var(--color-muted)]">Nenhum atleta nesta prova.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
