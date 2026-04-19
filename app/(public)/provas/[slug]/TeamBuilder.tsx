'use client'
import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, X, Check, AlertCircle, Info, ShoppingBag, Wallet } from 'lucide-react'
import type { Race, RaceAthlete, Team } from '~/lib/types'
import { TEAM_SIZE } from '~/lib/types'
import { saveTeam } from './actions'

type Filter = { search: string }

function PriceTrend({ change }: { change: number | null }) {
  if (!change || change === 0) return <span className="text-[var(--color-muted)] text-xs">—</span>
  if (change > 0) return <span className="text-[var(--color-success)] text-xs font-semibold">↑{change.toFixed(1)}</span>
  return <span className="text-[var(--color-danger)] text-xs font-semibold">↓{Math.abs(change).toFixed(1)}</span>
}

function AthleteCard({
  ra, selected, onToggle, canAdd, owned,
}: {
  ra: RaceAthlete; selected: boolean; onToggle: () => void; canAdd: boolean; owned: boolean
}) {
  const a = ra.athlete!

  if (!owned) {
    return (
      <div className="w-full text-left p-3 rounded-xl border bg-[var(--color-navy-card)] border-[var(--color-navy-border)] opacity-40 select-none">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{a.name}</p>
            {a.pto_rank && <p className="text-xs text-[var(--color-muted)]">PTO #{a.pto_rank}</p>}
          </div>
          <div className="text-right shrink-0">
            <span className="font-bold text-sm text-[var(--color-orange)]">T${ra.price}</span>
            <p className="text-[10px] text-[var(--color-muted)] mt-0.5">Não possui</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={onToggle}
      disabled={!selected && !canAdd}
      className={`w-full text-left p-3 rounded-xl border transition-all ${
        selected
          ? 'bg-[var(--color-orange-dim)] border-[var(--color-orange)]/60'
          : canAdd
          ? 'bg-[var(--color-navy-card)] border-[var(--color-navy-border)] hover:border-[var(--color-navy-elevated)]'
          : 'bg-[var(--color-navy-card)] border-[var(--color-navy-border)] opacity-50 cursor-not-allowed'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm mt-0.5 truncate">{a.name}</p>
          {a.pto_rank && <p className="text-xs text-[var(--color-muted)]">PTO #{a.pto_rank}</p>}
          {a.club && <p className="text-xs text-[var(--color-muted)] truncate">{a.club}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="font-bold text-sm text-[var(--color-orange)]">T${ra.price}</span>
          <PriceTrend change={(a as any).price_change ?? null} />
          {selected && <Check size={14} className="text-[var(--color-orange)]" />}
        </div>
      </div>
    </button>
  )
}

export default function TeamBuilder({
  race, raceAthletes, myTeam, userId, isOpen, ownedAthleteIds, wallet,
}: {
  race: Race
  raceAthletes: RaceAthlete[]
  myTeam: Team | null
  userId: string | null
  isOpen: boolean
  ownedAthleteIds: string[]
  wallet: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const ownedSet = useMemo(() => new Set(ownedAthleteIds), [ownedAthleteIds])

  const savedIds = useMemo(() => {
    if (!myTeam) return new Set<string>()
    const ids = (myTeam as any).team_athletes?.map((ta: any) => ta.athlete_id) ?? []
    return new Set<string>(ids)
  }, [myTeam])

  const [selected, setSelected] = useState<Set<string>>(savedIds)
  const [filter, setFilter] = useState<Filter>({ search: '' })
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Filter to owned athletes in this race
  const ownedInRace = useMemo(() => raceAthletes.filter(ra => ownedSet.has(ra.athlete_id)), [raceAthletes, ownedSet])
  const notOwned    = useMemo(() => raceAthletes.filter(ra => !ownedSet.has(ra.athlete_id)), [raceAthletes, ownedSet])

  const allRaceAthletes = useMemo(() => [...ownedInRace, ...notOwned], [ownedInRace, notOwned])

  const filtered = useMemo(() => allRaceAthletes.filter(ra => {
    if (filter.search && !ra.athlete!.name.toLowerCase().includes(filter.search.toLowerCase())) return false
    return true
  }), [allRaceAthletes, filter])

  const selectedAthletes = useMemo(() =>
    raceAthletes.filter(ra => selected.has(ra.athlete_id)),
  [raceAthletes, selected])

  function canAddAthlete(ra: RaceAthlete): boolean {
    if (!ownedSet.has(ra.athlete_id)) return false
    if (selected.size >= TEAM_SIZE) return false
    return true
  }

  function toggleAthlete(ra: RaceAthlete) {
    if (!ownedSet.has(ra.athlete_id)) return
    setSelected(prev => {
      const next = new Set(prev)
      next.has(ra.athlete_id) ? next.delete(ra.athlete_id) : next.add(ra.athlete_id)
      return next
    })
    setSaveSuccess(false)
    setSaveError('')
  }

  async function handleSave() {
    if (!userId) { router.push('/login'); return }
    setSaveError('')
    startTransition(async () => {
      const result = await saveTeam(race.id, Array.from(selected))
      if (result.error) { setSaveError(result.error) }
      else { setSaveSuccess(true); router.refresh() }
    })
  }

  if (!isOpen) {
    return (
      <div className="text-center py-20 text-[var(--color-muted)]">
        <p className="text-4xl mb-4">🔒</p>
        <p className="text-lg font-medium">Montagem de time ainda não está aberta</p>
        <p className="text-sm mt-1">Volte quando a prova estiver com status &quot;Aberto&quot;.</p>
      </div>
    )
  }

  // Not logged in
  if (!userId) {
    return (
      <div className="text-center py-20 text-[var(--color-muted)]">
        <p className="text-4xl mb-4">🔑</p>
        <p className="text-lg font-medium">Entre para escalar seu time</p>
        <Link href="/login" className="inline-block mt-4 bg-[var(--color-orange)] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[var(--color-orange-light)] transition-colors">
          Fazer login
        </Link>
      </div>
    )
  }

  // Has no athletes in this race
  if (ownedInRace.length === 0) {
    return (
      <div className="text-center py-20 text-[var(--color-muted)]">
        <p className="text-4xl mb-4">🛒</p>
        <p className="text-lg font-medium text-white">Você não tem atletas desta prova no elenco</p>
        <p className="text-sm mt-1 mb-6">Carteira: <span className="font-bold text-white">T${wallet}</span> · Vá ao mercado e compre atletas para escalar.</p>
        <Link
          href="/atletas"
          className="inline-flex items-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          <ShoppingBag size={15} />
          Ir ao Mercado
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Athletes list */}
      <div className="flex-1 min-w-0">
        {/* Wallet info */}
        <div className="flex items-center gap-3 mb-4 text-sm text-[var(--color-muted)]">
          <Wallet size={13} />
          <span>Carteira: <span className="font-bold text-white">T${wallet}</span></span>
          <span>·</span>
          <span>{ownedInRace.length} atleta{ownedInRace.length !== 1 ? 's' : ''} desta prova no elenco</span>
          <Link href="/atletas" className="ml-auto text-[var(--color-orange)] hover:underline text-xs">+ Comprar mais</Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
            <input
              placeholder="Buscar atleta..."
              value={filter.search}
              onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
              className="w-full pl-8 pr-3 py-2 bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-orange)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[600px] overflow-y-auto pr-1">
          {filtered.map(ra => (
            <AthleteCard
              key={ra.id}
              ra={ra}
              selected={selected.has(ra.athlete_id)}
              onToggle={() => toggleAthlete(ra)}
              canAdd={canAddAthlete(ra)}
              owned={ownedSet.has(ra.athlete_id)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-12 text-[var(--color-muted)] text-sm">
              Nenhum atleta encontrado.
            </div>
          )}
        </div>
      </div>

      {/* Team sidebar */}
      <div className="lg:w-72 shrink-0">
        <div className="sticky top-20 bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-4">
          <h2 className="font-bold mb-3">Meu Time</h2>

          <div className="space-y-1.5 mb-4 min-h-[120px]">
            {selectedAthletes.length === 0 && (
              <p className="text-xs text-[var(--color-muted)] text-center py-4">
                Clique nos seus atletas para adicionar ao time.
              </p>
            )}
            {selectedAthletes.map(ra => (
              <div key={ra.athlete_id} className="flex items-center justify-between bg-[var(--color-navy-elevated)] rounded-lg px-2.5 py-1.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{ra.athlete?.name}</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    PRO · T${ra.price}
                  </p>
                </div>
                <button
                  onClick={() => toggleAthlete(ra)}
                  className="text-[var(--color-muted)] hover:text-[var(--color-danger)] ml-2 shrink-0"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-1.5 text-xs text-[var(--color-muted)] mb-4">
            <Info size={11} className="mt-0.5 shrink-0" />
            <span>Selecione {TEAM_SIZE} atletas do seu elenco para escalar.</span>
          </div>

          {saveError && (
            <div className="flex items-start gap-2 text-xs text-[var(--color-danger)] bg-red-950/30 rounded-lg p-2 mb-3">
              <AlertCircle size={12} className="shrink-0 mt-0.5" />
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="flex items-center gap-2 text-xs text-[var(--color-success)] bg-green-950/30 rounded-lg p-2 mb-3">
              <Check size={12} />
              Time salvo com sucesso!
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={selected.size !== TEAM_SIZE || isPending}
            className="w-full bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] disabled:opacity-40 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
          >
            {isPending ? 'Salvando...' : myTeam ? 'Atualizar Time' : `Escalar Time (${selected.size}/${TEAM_SIZE})`}
          </button>
        </div>
      </div>
    </div>
  )
}
