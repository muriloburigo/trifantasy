'use client'
import { useState, useTransition } from 'react'
import { bulkImportResults } from './actions'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'

const EXAMPLE = JSON.stringify([
  { bib: 1, overall_pos: 1, pro_pos: 1, swim_time: 2820, t1_time: 180, bike_time: 15480, t2_time: 120, run_time: 9840, finish_time: 28440 },
  { bib: 42, overall_pos: 15, ag_pos: 2, swim_time: 3600, t1_time: 240, bike_time: 18000, t2_time: 150, run_time: 12600, finish_time: 34590, kona_slot: true },
], null, 2)

export default function BulkResultImport({ raceId }: { raceId: string }) {
  const [json, setJson] = useState('')
  const [result, setResult] = useState<{ inserted?: number; errors?: string[]; error?: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handle(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    startTransition(async () => {
      const res = await bulkImportResults(raceId, json)
      setResult(res)
    })
  }

  return (
    <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4">
      <h2 className="font-bold mb-1 text-sm">Importar Resultados (JSON)</h2>
      <p className="text-xs text-[var(--color-muted)] mb-1">
        Identificação por <code className="text-[var(--color-orange)]">bib</code> ou <code className="text-[var(--color-orange)]">athlete_name</code>.
        Tempos em segundos.
      </p>
      <p className="text-xs text-[var(--color-muted)] mb-3">
        Campos: bib, athlete_name, overall_pos, ag_pos, pro_pos, swim/t1/bike/t2/run/finish_time, dnf, dns, kona_slot
      </p>

      <form onSubmit={handle} className="space-y-3">
        <textarea
          value={json}
          onChange={e => setJson(e.target.value)}
          placeholder={EXAMPLE}
          rows={10}
          className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-[var(--color-orange)] resize-none"
        />
        <button
          type="submit"
          disabled={isPending || !json.trim()}
          className="w-full flex items-center justify-center gap-2 bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)] text-sm py-2 rounded-lg transition-colors disabled:opacity-40"
        >
          <Upload size={13} />
          {isPending ? 'Importando...' : 'Importar Resultados'}
        </button>
      </form>

      {result && (
        <div className="mt-3 space-y-2">
          {result.error && (
            <div className="flex items-center gap-2 text-xs text-[var(--color-danger)]">
              <AlertCircle size={12} />{result.error}
            </div>
          )}
          {result.inserted !== undefined && (
            <div className="flex items-center gap-2 text-xs text-[var(--color-success)]">
              <CheckCircle size={12} />{result.inserted} resultados importados
            </div>
          )}
          {result.errors?.map((e, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-[var(--color-danger)]">
              <AlertCircle size={12} className="shrink-0 mt-0.5" />{e}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
