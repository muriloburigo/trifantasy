'use client'
import { useState, useTransition } from 'react'
import { bulkImportAthletes } from './actions'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'

const EXAMPLE = JSON.stringify([
  { name: 'Patrick Lange', gender: 'M', type: 'pro', country: 'Germany', country_code: 'DE', pto_rank: 1, price: 30 },
  { name: 'Fernanda Keller', gender: 'F', type: 'age_grouper', age_group: 'F50-54', club: 'TRI RJ', country: 'Brasil', price: 8, bib: 42 },
], null, 2)

export default function BulkImport({ raceId }: { raceId: string }) {
  const [json, setJson] = useState('')
  const [result, setResult] = useState<{ inserted?: number; errors?: string[] } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handle(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    startTransition(async () => {
      const res = await bulkImportAthletes(raceId, json)
      setResult(res)
    })
  }

  return (
    <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4">
      <h2 className="font-bold mb-1 text-sm">Importação em Lote (JSON)</h2>
      <p className="text-xs text-[var(--color-muted)] mb-3">
        Array de atletas. Campos: name, gender, type, age_group, club, country, country_code, pto_rank, price, bib
      </p>

      <form onSubmit={handle} className="space-y-3">
        <textarea
          value={json}
          onChange={e => setJson(e.target.value)}
          placeholder={EXAMPLE}
          rows={8}
          className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-[var(--color-orange)] resize-none"
        />
        <button
          type="submit"
          disabled={isPending || !json.trim()}
          className="w-full flex items-center justify-center gap-2 bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)] text-sm py-2 rounded-lg transition-colors disabled:opacity-40"
        >
          <Upload size={13} />
          {isPending ? 'Importando...' : 'Importar JSON'}
        </button>
      </form>

      {result && (
        <div className="mt-3 space-y-2">
          {result.inserted !== undefined && (
            <div className="flex items-center gap-2 text-xs text-[var(--color-success)]">
              <CheckCircle size={12} />
              {result.inserted} atletas importados
            </div>
          )}
          {result.errors?.map((e, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-[var(--color-danger)]">
              <AlertCircle size={12} className="shrink-0 mt-0.5" />
              {e}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
