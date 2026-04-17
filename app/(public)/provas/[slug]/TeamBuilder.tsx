'use client'
import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Check, AlertCircle, Info } from 'lucide-react'
import type { Race, RaceAthlete, Team } from '~/lib/types'
import { TEAM_SIZE, TEAM_BUDGET, MAX_SAME_CLUB } from '~/lib/types'
import { saveTeam } from './actions'

type Filter = { type: 'all' | 'pro' | 'age_grouper'; gender: 'all' | 'M' | 'F'; search: string }

function AthleteCard({
  ra, selected, onToggle, canAdd,
}: {
  ra: RaceAthlete
  selected: boolean
  onToggle: () => void
  canAdd: boolean
}) {
  const a = ra.athlete!
  const isPro = a.type === 'pro'

  return (
    <button
      onClick={onToggle}
      disabled={!selected && !canAdd}
      className={`w-full text-left p-3 rounded-xl border transition-all ${
        selected
          ? 'bg-[var(--color-orange-dim)] border-[var(--color-orange)]/60'
          : canAdd
          ? 'bg-[var(--color-navy-card)] border-[var(--color-navy-border)] hover:border-[var(--color-navy-elevated)]'
          : 'bg-[var(--color-navy-card)] border-[var(--color-navy-border)] opacity-40 cursor-not-allowed'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
              isPro ? 'bg-[var(--color-orange)]/20 text-[var(--color-orange)]' : 'bg-[var(--color-navy-elevated)] text-[var(--color-muted)]'
            }`}>
              {isPro ? 'PRO' : a.age_group ?? 'AG'}
            </span>
            <span className="text-xs text-[var(--color-muted)]">{a.gender}</span>
            {a.pto_rank && <span className="text-xs text-[var(--color-muted)]">PTO #{a.pto_rank}</span>}
          </div>
          <p className="font-semibold text-sm mt-1 truncate">{a.name}</p>
          {a.club && <p className="text-xs text-[var(--color-muted)] truncate">{a.club}</p>}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="font-bold text-sm text-[var(--color-orange)]">T${ra.price}</span>
          {selected && <Check size={14} className="text-[var(--color-orange)]" />}
        </div>
      </div>
    </button>
  )
}

export default function TeamBuilder({
  race, raceAthletes, myTeam, userId, isOpen,
}: {
  race: Race
  raceAthletes: RaceAthlete[]
  myTeam: Team | null
  userId: string | null
  isOpen: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Initial selection from saved team
  const savedIds = useMemo(() => {
    if (!myTeam) return new Set<string>()
    const ids = (myTeam as any).team_athletes?.map((ta: any) => ta.athlete_id) ?? []
    return new Set<string>(ids)
  }, [myTeam])

  const [selected, setSelected] = useState<Set<string>>(savedIds)
  const [filter, setFilter] = useState<Filter>({ type: 'all', gender: 'all', search: '' })
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const filtered = useMemo(() => {
    return raceAthletes.filter(ra => {
      const a = ra.athlete!
      if (filter.type !== 'all' && a.type !== filter.type) return false
      if (filter.gender !== 'all' && a.gender !== filter.gender) return false
      if (filter.search && !a.name.toLowerCase().includes(filter.search.toLowerCase())) return false
      return true
    })
  }, [raceAthletes, filter])

  const selectedAthletes = useMemo(() =>
    raceAthletes.filter(ra => selected.has(ra.athlete_id)),
  [raceAthletes, selected])

  const totalCost = useMemo(() =>
    selectedAthletes.reduce((sum, ra) => sum + Number(ra.price), 0),
  [selectedAthletes])

  const remaining = TEAM_BUDGET - totalCost
  const clubCount = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const ra of selectedAthletes) {
      const club = ra.athlete?.club ?? '__noclub__'
      counts[club] = (counts[club] ?? 0) + 1
    }
    return counts
  }, [selectedAthletes])

  function canAddAthlete(ra: RaceAthlete): boolean {
    if (selected.size >= TEAM_SIZE) return false
    if (Number(ra.price) > remaining) return false
    const club = ra.athlete?.club ?? '__noclub__'
    if ((clubCount[club] ?? 0) >= MAX_SAME_CLUB) return false
    return true
  }

  function toggleAthlete(ra: RaceAthlete) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(ra.athlete_id)) {
        next.delete(ra.athlete_id)
      } else {
        next.add(ra.athlete_id)
      }
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
      if (result.error) {
        setSaveError(result.error)
      } else {
        setSaveSuccess(true)
        router.refresh()
      }
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

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Athletes list */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
            <input
              placeholder="Buscar atleta..."
              value={filter.search}
              onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
              className="w-full pl-8 pr-3 py-2 bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-lg text-sm focus:outline-none focus:border-[var(--color-orange)]"
            />
          </div>
          {/* Type filter */}
          <div className="flex gap-1">
            {(['all', 'pro', 'age_grouper'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilter(f => ({ ...f, type: t }))}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  filter.type === t
                    ? 'bg-[var(--color-orange)] text-white'
                    : 'bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] text-[var(--color-muted)] hover:text-white'
                }`}
              >
                {t === 'all' ? 'Todos' : t === 'pro' ? 'PRO' : 'Age Group'}
              </button>
            ))}
          </div>
          {/* Gender filter */}
          <div className="flex gap-1">
            {(['all', 'M', 'F'] as const).map(g => (
              <button
                key={g}
                onClick={() => setFilter(f => ({ ...f, gender: g }))}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  filter.gender === g
                    ? 'bg-[var(--color-navy-elevated)] text-white'
                    : 'bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] text-[var(--color-muted)] hover:text-white'
                }`}
              >
                {g === 'all' ? 'M+F' : g}
              </button>
            ))}
          </div>
        </div>

        {/* Athletes grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[600px] overflow-y-auto pr-1">
          {filtered.map(ra => (
            <AthleteCard
              key={ra.id}
              ra={ra}
              selected={selected.has(ra.athlete_id)}
              onToggle={() => toggleAthlete(ra)}
              canAdd={canAddAthlete(ra)}
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

          {/* Budget bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-[var(--color-muted)] mb-1">
              <span>Orçamento</span>
              <span className={remaining < 0 ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]'}>
                T${totalCost.toFixed(2)} / {TEAM_BUDGET}
              </span>
            </div>
            <div className="h-1.5 bg-[var(--color-navy-elevated)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  remaining < 0 ? 'bg-[var(--color-danger)]' : 'bg-[var(--color-orange)]'
                }`}
                style={{ width: `${Math.min(100, (totalCost / TEAM_BUDGET) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              {selected.size}/{TEAM_SIZE} atletas · T${remaining.toFixed(2)} restante
            </p>
          </div>

          {/* Selected athletes */}
          <div className="space-y-1.5 mb-4 min-h-[120px]">
            {selectedAthletes.length === 0 && (
              <p className="text-xs text-[var(--color-muted)] text-center py-4">
                Clique nos atletas para adicionar ao time.
              </p>
            )}
            {selectedAthletes.map(ra => (
              <div key={ra.athlete_id} className="flex items-center justify-between bg-[var(--color-navy-elevated)] rounded-lg px-2.5 py-1.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{ra.athlete?.name}</p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {ra.athlete?.type === 'pro' ? 'PRO' : ra.athlete?.age_group} · T${ra.price}
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

          {/* Rules hint */}
          <div className="flex items-start gap-1.5 text-xs text-[var(--color-muted)] mb-4">
            <Info size={11} className="mt-0.5 shrink-0" />
            <span>Máx. {MAX_SAME_CLUB} atletas do mesmo clube. Orçamento: T${TEAM_BUDGET}.</span>
          </div>

          {/* Errors / success */}
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

          {/* Save button */}
          {userId ? (
            <button
              onClick={handleSave}
              disabled={selected.size !== TEAM_SIZE || remaining < 0 || isPending}
              className="w-full bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] disabled:opacity-40 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
            >
              {isPending ? 'Salvando...' : myTeam ? 'Atualizar Time' : 'Salvar Time'}
            </button>
          ) : (
            <a
              href="/login"
              className="block w-full bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white font-semibold rounded-lg py-2.5 text-sm text-center transition-colors"
            >
              Entrar para salvar
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
