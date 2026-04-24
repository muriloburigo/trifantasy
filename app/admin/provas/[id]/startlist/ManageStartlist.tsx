'use client'
import { useState, useMemo } from 'react'
import { Search, Plus, Trash2, Hash } from 'lucide-react'
import { addAthleteToRace, removeAthleteFromRace, updateBib } from './actions'

export default function ManageStartlist({ race, initialStartlist, allAthletes }: { race: any, initialStartlist: any[], allAthletes: any[] }) {
  const [search, setSearch] = useState('')
  const startlistIds = new Set(initialStartlist.map(s => s.athlete_id))

  const filteredAthletes = useMemo(() => {
    return allAthletes.filter(a => 
      !startlistIds.has(a.id) && 
      (!search || a.name.toLowerCase().includes(search.toLowerCase()))
    ).slice(0, 10)
  }, [allAthletes, startlistIds, search])

  async function handleAdd(athleteId: string) {
    await addAthleteToRace(race.id, athleteId)
  }

  async function handleRemove(athleteId: string) {
    if (confirm('Remover este atleta da prova?')) {
      await removeAthleteFromRace(race.id, athleteId)
    }
  }

  async function handleBib(athleteId: string, currentBib: any) {
    const newBib = prompt('Digite o novo BIB:', currentBib || '')
    if (newBib !== null) {
      await updateBib(race.id, athleteId, newBib)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-white">
      {/* Coluna 1: Startlist Atual */}
      <div className="space-y-4">
        <h2 className="font-bold flex items-center gap-2">Atletas Inscritos ({initialStartlist.length})</h2>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden divide-y divide-[var(--color-navy-border)]">
          {initialStartlist.map(s => (
            <div key={s.id} className="p-3 flex items-center justify-between gap-3 group">
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{s.athlete?.name}</p>
                <p className="text-[10px] text-[var(--color-muted)]">BIB: {s.bib || '—'} · T${s.price}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleBib(s.athlete_id, s.bib)} className="p-2 hover:bg-white/5 rounded-lg text-blue-400">
                  <Hash size={14} />
                </button>
                <button onClick={() => handleRemove(s.athlete_id)} className="p-2 hover:bg-white/5 rounded-lg text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {initialStartlist.length === 0 && <p className="p-8 text-center text-xs text-[var(--color-muted)]">Nenhum atleta inscrito.</p>}
        </div>
      </div>

      {/* Coluna 2: Adicionar Atletas */}
      <div className="space-y-4">
        <h2 className="font-bold">Adicionar ao Field</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
          <input
            placeholder="Buscar atleta pelo nome..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl text-sm focus:outline-none focus:border-[var(--color-orange)]"
          />
        </div>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden divide-y divide-[var(--color-navy-border)]">
          {filteredAthletes.map(a => (
            <div key={a.id} className="p-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-sm">{a.name}</p>
                <p className="text-[10px] text-[var(--color-muted)]">T${a.current_price}</p>
              </div>
              <button onClick={() => handleAdd(a.id)} className="p-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] rounded-lg text-white">
                <Plus size={14} />
              </button>
            </div>
          ))}
          {search && filteredAthletes.length === 0 && <p className="p-8 text-center text-xs text-[var(--color-muted)]">Nenhum resultado.</p>}
          {!search && <p className="p-4 text-center text-[10px] text-[var(--color-muted)] italic leading-tight px-8">Digite o nome para buscar atletas no banco global do Trixer e adicioná-los a esta prova.</p>}
        </div>
      </div>
    </div>
  )
}
