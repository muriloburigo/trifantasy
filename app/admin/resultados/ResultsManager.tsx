'use client'
import { useState, useTransition } from 'react'
import { Pencil, Trash2, X, Check, Plus } from 'lucide-react'
import { upsertResultData, deleteResult } from './actions'
import { formatTime } from '~/lib/utils'

function secsToHMS(secs: number | null | undefined): string {
  if (!secs) return ''
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function hmsToSecs(hms: string): number | null {
  const str = hms.trim()
  if (!str) return null
  const parts = str.split(':').map(p => parseInt(p, 10))
  if (parts.some(isNaN)) return null
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] || null
}

interface Result {
  athlete_id: string
  pro_pos: number | null
  swim_time: number | null
  bike_time: number | null
  run_time: number | null
  finish_time: number | null
  dnf: boolean
  dns: boolean
  athlete: { name: string; type: string; gender: string } | null
}

interface RaceAthlete {
  athlete_id: string
  athlete: { name: string; gender: string } | null
}

type FormState = Record<string, string>

const TIME_FIELDS = [
  { key: 'swim_time', label: 'Nado' },
  { key: 'bike_time', label: 'Bike' },
  { key: 'run_time', label: 'Corrida' },
  { key: 'finish_time', label: 'Total' },
] as const

export default function ResultsManager({
  results: initialResults,
  raceAthletes,
  raceId,
}: {
  results: Result[]
  raceAthletes: RaceAthlete[]
  raceId: string
}) {
  const [results, setResults] = useState(initialResults)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormState>({})
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState<FormState>({})
  const [newAthleteId, setNewAthleteId] = useState('')
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const existingIds = new Set(results.map(r => r.athlete_id))
  const available = raceAthletes.filter(ra => !existingIds.has(ra.athlete_id))

  function startEdit(r: Result) {
    setEditingId(r.athlete_id)
    setEditForm({
      pro_pos: r.pro_pos?.toString() ?? '',
      swim_time: secsToHMS(r.swim_time),
      bike_time: secsToHMS(r.bike_time),
      run_time: secsToHMS(r.run_time),
      finish_time: secsToHMS(r.finish_time),
      dnf: r.dnf ? 'on' : '',
      dns: r.dns ? 'on' : '',
    })
    setMsg(null)
  }

  function saveEdit(athleteId: string) {
    startTransition(async () => {
      const res = await upsertResultData({
        raceId,
        athleteId,
        proPos: editForm.pro_pos ? parseInt(editForm.pro_pos) : null,
        swimTime: hmsToSecs(editForm.swim_time ?? ''),
        bikeTime: hmsToSecs(editForm.bike_time ?? ''),
        runTime: hmsToSecs(editForm.run_time ?? ''),
        finishTime: hmsToSecs(editForm.finish_time ?? ''),
        dnf: editForm.dnf === 'on',
        dns: editForm.dns === 'on',
      })
      if (res.error) {
        setMsg({ ok: false, text: res.error })
      } else {
        setEditingId(null)
        setMsg({ ok: true, text: 'Resultado salvo!' })
      }
    })
  }

  function handleDelete(athleteId: string, name: string) {
    if (!confirm(`Remover resultado de ${name}?`)) return
    startTransition(async () => {
      await deleteResult(raceId, athleteId)
      setResults(prev => prev.filter(r => r.athlete_id !== athleteId))
      setMsg({ ok: true, text: 'Resultado removido.' })
    })
  }

  function saveAdd() {
    if (!newAthleteId) return
    startTransition(async () => {
      const res = await upsertResultData({
        raceId,
        athleteId: newAthleteId,
        proPos: addForm.pro_pos ? parseInt(addForm.pro_pos) : null,
        swimTime: hmsToSecs(addForm.swim_time ?? ''),
        bikeTime: hmsToSecs(addForm.bike_time ?? ''),
        runTime: hmsToSecs(addForm.run_time ?? ''),
        finishTime: hmsToSecs(addForm.finish_time ?? ''),
        dnf: addForm.dnf === 'on',
        dns: addForm.dns === 'on',
      })
      if (res.error) {
        setMsg({ ok: false, text: res.error })
      } else {
        // Add optimistic row
        const ra = raceAthletes.find(r => r.athlete_id === newAthleteId)
        const newRow: Result = {
          athlete_id: newAthleteId,
          pro_pos: addForm.pro_pos ? parseInt(addForm.pro_pos) : null,
          swim_time: hmsToSecs(addForm.swim_time ?? ''),
          bike_time: hmsToSecs(addForm.bike_time ?? ''),
          run_time: hmsToSecs(addForm.run_time ?? ''),
          finish_time: hmsToSecs(addForm.finish_time ?? ''),
          dnf: addForm.dnf === 'on',
          dns: addForm.dns === 'on',
          athlete: ra?.athlete ? { name: ra.athlete.name, type: 'pro', gender: ra.athlete.gender } : null,
        }
        setResults(prev => [...prev, newRow].sort((a, b) => (a.pro_pos ?? 999) - (b.pro_pos ?? 999)))
        setShowAdd(false)
        setAddForm({})
        setNewAthleteId('')
        setMsg({ ok: true, text: 'Resultado adicionado!' })
      }
    })
  }

  function TimeInput({ fieldKey, form, onChange }: { fieldKey: string; form: FormState; onChange: (k: string, v: string) => void }) {
    return (
      <input
        type="text"
        placeholder="H:MM:SS"
        value={form[fieldKey] ?? ''}
        onChange={e => onChange(fieldKey, e.target.value)}
        className="w-20 bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded px-1.5 py-1 text-xs text-center font-mono focus:outline-none focus:border-[var(--color-orange)]"
      />
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[var(--color-muted)]">{results.length} resultados</span>
        <button
          onClick={() => { setShowAdd(!showAdd); setMsg(null) }}
          className="flex items-center gap-1.5 text-sm bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus size={13} /> Adicionar resultado
        </button>
      </div>

      {/* Feedback */}
      {msg && (
        <div className={`mb-3 px-3 py-2 rounded-lg text-xs ${msg.ok ? 'bg-green-950/40 text-[var(--color-success)]' : 'bg-red-950/40 text-[var(--color-danger)]'}`}>
          {msg.text}
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-orange)]/30 rounded-xl p-4 mb-4">
          <p className="text-sm font-bold mb-3">Novo Resultado</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            <div className="col-span-2">
              <label className="text-xs text-[var(--color-muted)] mb-1 block">Atleta</label>
              <select
                value={newAthleteId}
                onChange={e => setNewAthleteId(e.target.value)}
                className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[var(--color-orange)]"
              >
                <option value="">Selecionar atleta...</option>
                {available.map(ra => (
                  <option key={ra.athlete_id} value={ra.athlete_id}>
                    {ra.athlete?.name} ({ra.athlete?.gender})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--color-muted)] mb-1 block">Posição PRO</label>
              <input
                type="number" min={1} placeholder="1"
                value={addForm.pro_pos ?? ''}
                onChange={e => setAddForm(p => ({ ...p, pro_pos: e.target.value }))}
                className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[var(--color-orange)]"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3 mb-3">
            {TIME_FIELDS.map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-[var(--color-muted)] mb-1 block">{label}</label>
                <TimeInput fieldKey={key} form={addForm} onChange={(k, v) => setAddForm(p => ({ ...p, [k]: v }))} />
              </div>
            ))}
            <label className="flex items-center gap-1 text-xs cursor-pointer pb-1">
              <input type="checkbox" checked={addForm.dnf === 'on'} onChange={e => setAddForm(p => ({ ...p, dnf: e.target.checked ? 'on' : '' }))} />
              DNF
            </label>
            <label className="flex items-center gap-1 text-xs cursor-pointer pb-1">
              <input type="checkbox" checked={addForm.dns === 'on'} onChange={e => setAddForm(p => ({ ...p, dns: e.target.checked ? 'on' : '' }))} />
              DNS
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={saveAdd} disabled={!newAthleteId || isPending}
              className="bg-[var(--color-orange)] text-white px-4 py-1.5 rounded-lg text-sm disabled:opacity-50 transition-colors">
              Salvar
            </button>
            <button onClick={() => { setShowAdd(false); setAddForm({}); setNewAthleteId('') }}
              className="bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] px-4 py-1.5 rounded-lg text-sm hover:border-[var(--color-orange)] transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-navy-border)] text-[var(--color-muted)]">
                <th className="text-left px-3 py-2 font-medium">Atleta</th>
                <th className="px-2 py-2 font-medium">Pos</th>
                <th className="px-2 py-2 font-medium">Nado</th>
                <th className="px-2 py-2 font-medium">Bike</th>
                <th className="px-2 py-2 font-medium">Corrida</th>
                <th className="px-2 py-2 font-medium">Total</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-navy-border)]">
              {results.map(r =>
                editingId === r.athlete_id ? (
                  <tr key={r.athlete_id} className="bg-[var(--color-navy-elevated)]/50">
                    <td className="px-3 py-2 font-medium">{r.athlete?.name}</td>
                    <td className="px-2 py-1.5">
                      <input type="number" min={1}
                        value={editForm.pro_pos ?? ''}
                        onChange={e => setEditForm(p => ({ ...p, pro_pos: e.target.value }))}
                        className="w-12 bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded px-1 py-0.5 text-center font-mono focus:outline-none focus:border-[var(--color-orange)]" />
                    </td>
                    {TIME_FIELDS.map(({ key }) => (
                      <td key={key} className="px-2 py-1.5">
                        <TimeInput fieldKey={key} form={editForm} onChange={(k, v) => setEditForm(p => ({ ...p, [k]: v }))} />
                      </td>
                    ))}
                    <td className="px-2 py-1.5">
                      <div className="flex flex-col gap-0.5">
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={editForm.dnf === 'on'} onChange={e => setEditForm(p => ({ ...p, dnf: e.target.checked ? 'on' : '' }))} />
                          DNF
                        </label>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input type="checkbox" checked={editForm.dns === 'on'} onChange={e => setEditForm(p => ({ ...p, dns: e.target.checked ? 'on' : '' }))} />
                          DNS
                        </label>
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex gap-1">
                        <button onClick={() => saveEdit(r.athlete_id)} disabled={isPending}
                          className="p-1 text-[var(--color-success)] hover:bg-[var(--color-navy-border)]/40 rounded transition-colors">
                          <Check size={13} />
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="p-1 text-[var(--color-muted)] hover:bg-[var(--color-navy-border)]/40 rounded transition-colors">
                          <X size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={r.athlete_id} className="hover:bg-[var(--color-navy-elevated)]/20">
                    <td className="px-3 py-2">
                      <span className={`text-xs font-bold mr-1.5 ${r.athlete?.type === 'pro' ? 'text-[var(--color-orange)]' : 'text-[var(--color-muted)]'}`}>
                        {r.athlete?.type === 'pro' ? 'PRO' : 'AG'}
                      </span>
                      {r.athlete?.name}
                    </td>
                    <td className="px-2 py-2 text-center text-[var(--color-muted)]">{r.pro_pos ?? '—'}</td>
                    <td className="px-2 py-2 text-center font-mono text-[var(--color-muted)]">{formatTime(r.swim_time)}</td>
                    <td className="px-2 py-2 text-center font-mono text-[var(--color-muted)]">{formatTime(r.bike_time)}</td>
                    <td className="px-2 py-2 text-center font-mono text-[var(--color-muted)]">{formatTime(r.run_time)}</td>
                    <td className="px-2 py-2 text-center font-mono">{formatTime(r.finish_time)}</td>
                    <td className="px-2 py-2 text-center">
                      {r.dnf && <span className="text-[var(--color-danger)] font-bold">DNF</span>}
                      {r.dns && <span className="text-[var(--color-muted)] font-bold">DNS</span>}
                      {!r.dnf && !r.dns && <span className="text-[var(--color-success)]">OK</span>}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(r)}
                          className="p-1 text-[var(--color-muted)] hover:text-white hover:bg-[var(--color-navy-border)]/40 rounded transition-colors">
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => handleDelete(r.athlete_id, r.athlete?.name ?? '')}
                          className="p-1 text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-navy-border)]/40 rounded transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
              {results.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-[var(--color-muted)]">
                    Nenhum resultado. Clique em "Adicionar resultado" ou use o importador JSON.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
