'use client'
import { useState, useTransition, useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus, Pencil, Check, X } from 'lucide-react'
import { updateAthletePrice } from './actions'

interface Athlete {
  id: string
  name: string
  gender: string
  country: string | null
  pto_rank: number | null
  current_price: number
  price_change: number | null
  owners: number
}

export default function MercadoManager({ athletes }: { athletes: Athlete[] }) {
  const [search, setSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState<'all' | 'M' | 'F'>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [editChange, setEditChange] = useState('')
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ id: string; ok: boolean; text: string } | null>(null)

  const filtered = useMemo(() => {
    return athletes.filter(a => {
      const matchSearch = a.name.toLowerCase().includes(search.toLowerCase())
      const matchGender = genderFilter === 'all' || a.gender === genderFilter
      return matchSearch && matchGender
    })
  }, [athletes, search, genderFilter])

  function startEdit(a: Athlete) {
    setEditingId(a.id)
    setEditPrice(String(a.current_price))
    setEditChange(String(a.price_change ?? 0))
    setMsg(null)
  }

  function saveEdit(id: string) {
    const price = parseFloat(editPrice)
    const change = parseFloat(editChange)
    if (isNaN(price) || price < 1) {
      setMsg({ id, ok: false, text: 'Preço inválido.' })
      return
    }
    startTransition(async () => {
      const res = await updateAthletePrice(id, price, isNaN(change) ? 0 : change)
      if (res.error) {
        setMsg({ id, ok: false, text: res.error })
      } else {
        setEditingId(null)
        setMsg({ id, ok: true, text: '✓' })
        setTimeout(() => setMsg(null), 2000)
      }
    })
  }

  function Trend({ change }: { change: number | null }) {
    const c = Number(change ?? 0)
    if (c > 0) return <span className="flex items-center gap-0.5 text-[var(--color-success)] text-xs font-bold"><TrendingUp size={11} />+{c}</span>
    if (c < 0) return <span className="flex items-center gap-0.5 text-[var(--color-danger)] text-xs font-bold"><TrendingDown size={11} />{c}</span>
    return <span className="flex items-center gap-0.5 text-[var(--color-muted)] text-xs"><Minus size={11} />0</span>
  }

  const rising  = athletes.filter(a => Number(a.price_change) > 0).length
  const falling = athletes.filter(a => Number(a.price_change) < 0).length
  const stable  = athletes.filter(a => !a.price_change || Number(a.price_change) === 0).length

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-[var(--color-success)]">{rising}</p>
          <p className="text-xs text-[var(--color-muted)] mt-1">Em alta ↑</p>
        </div>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-[var(--color-danger)]">{falling}</p>
          <p className="text-xs text-[var(--color-muted)] mt-1">Em queda ↓</p>
        </div>
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-[var(--color-muted)]">{stable}</p>
          <p className="text-xs text-[var(--color-muted)] mt-1">Estável —</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="search"
          placeholder="Buscar atleta..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] max-w-xs bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]"
        />
        <div className="flex gap-1">
          {(['all','M','F'] as const).map(g => (
            <button key={g} onClick={() => setGenderFilter(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${genderFilter === g ? 'bg-[var(--color-orange)] text-white' : 'bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] text-[var(--color-muted)] hover:border-[var(--color-orange)]'}`}>
              {g === 'all' ? 'Todos' : g === 'M' ? 'Masculino' : 'Feminino'}
            </button>
          ))}
        </div>
        <span className="text-xs text-[var(--color-muted)] ml-auto">{filtered.length} atletas</span>
      </div>

      {/* Table */}
      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-navy-border)] text-[var(--color-muted)] text-xs">
                <th className="text-left px-4 py-2.5 font-medium">Atleta</th>
                <th className="px-3 py-2.5 font-medium">País</th>
                <th className="px-3 py-2.5 font-medium">Rank PTO</th>
                <th className="px-3 py-2.5 font-medium">Donos</th>
                <th className="px-3 py-2.5 font-medium">Variação</th>
                <th className="px-3 py-2.5 font-medium">Preço</th>
                <th className="px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-navy-border)]">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-[var(--color-navy-elevated)]/20">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${a.gender === 'M' ? 'text-blue-400' : 'text-pink-400'}`}>{a.gender}</span>
                      <span className="font-medium">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-center text-xs text-[var(--color-muted)]">{a.country ?? '—'}</td>
                  <td className="px-3 py-2.5 text-center text-xs text-[var(--color-muted)]">
                    {a.pto_rank ? `#${a.pto_rank}` : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-xs font-bold ${a.owners > 0 ? 'text-white' : 'text-[var(--color-muted)]'}`}>
                      {a.owners}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {editingId === a.id ? (
                      <input
                        type="number" step="0.5"
                        value={editChange}
                        onChange={e => setEditChange(e.target.value)}
                        className="w-16 bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded px-1.5 py-0.5 text-xs text-center focus:outline-none focus:border-[var(--color-orange)]"
                      />
                    ) : (
                      <Trend change={a.price_change} />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {editingId === a.id ? (
                      <input
                        type="number" min={1} max={35} step={0.5}
                        value={editPrice}
                        onChange={e => setEditPrice(e.target.value)}
                        className="w-16 bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded px-1.5 py-0.5 text-xs text-center font-bold focus:outline-none focus:border-[var(--color-orange)]"
                      />
                    ) : (
                      <span className="font-bold text-[var(--color-orange)]">
                        T${Number(a.current_price).toFixed(1)}
                        {msg?.id === a.id && msg.ok && <span className="ml-1 text-[var(--color-success)] text-[10px]">{msg.text}</span>}
                      </span>
                    )}
                    {msg?.id === a.id && !msg.ok && (
                      <p className="text-[var(--color-danger)] text-[10px] mt-0.5">{msg.text}</p>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {editingId === a.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => saveEdit(a.id)} disabled={isPending}
                          className="p-1 text-[var(--color-success)] hover:bg-[var(--color-navy-border)]/40 rounded transition-colors">
                          <Check size={13} />
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="p-1 text-[var(--color-muted)] hover:bg-[var(--color-navy-border)]/40 rounded transition-colors">
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(a)}
                        className="p-1 text-[var(--color-muted)] hover:text-white hover:bg-[var(--color-navy-border)]/40 rounded transition-colors">
                        <Pencil size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-sm text-[var(--color-muted)]">
                    Nenhum atleta encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs text-[var(--color-muted)]">
        Clique em ✏️ para ajustar preço e variação manualmente. Os preços são atualizados automaticamente ao calcular a pontuação.
      </p>
    </div>
  )
}
