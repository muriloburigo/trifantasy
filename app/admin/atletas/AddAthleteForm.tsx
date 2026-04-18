'use client'
import { useState, useTransition, useRef } from 'react'
import { upsertAthlete } from './actions'
import { CheckCircle, AlertCircle } from 'lucide-react'

export default function AddAthleteForm({ raceId }: { raceId: string }) {
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await upsertAthlete(formData)
      setResult(res ?? null)
      if (res?.success) formRef.current?.reset()
    })
  }

  return (
    <form ref={formRef} onSubmit={handle} className="space-y-3">
      <input type="hidden" name="race_id" value={raceId} />

      <input name="name" required placeholder="Nome completo"
        className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]" />

      <div className="grid grid-cols-2 gap-2">
        <select name="type" required
          className="bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]">
          <option value="age_grouper">Age Group</option>
          <option value="pro">PRO</option>
        </select>
        <select name="gender" required
          className="bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]">
          <option value="M">Masculino</option>
          <option value="F">Feminino</option>
        </select>
      </div>

      <input name="age_group" placeholder="Age Group (ex: M35-39)"
        className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]" />
      <input name="club" placeholder="Clube / Equipe"
        className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]" />
      <input name="country" placeholder="País"
        className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]" />

      <div className="grid grid-cols-2 gap-2">
        <input name="price" type="number" step="0.5" min="1" max="35" placeholder="Preço Trix Coin (T$)" defaultValue="10"
          className="bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]" />
        <input name="bib" type="number" placeholder="Bib #"
          className="bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]" />
      </div>

      {result?.error && (
        <div className="flex items-center gap-2 text-xs text-[var(--color-danger)]">
          <AlertCircle size={12} />{result.error}
        </div>
      )}
      {result?.success && (
        <div className="flex items-center gap-2 text-xs text-[var(--color-success)]">
          <CheckCircle size={12} />Atleta adicionado!
        </div>
      )}

      <button type="submit" disabled={isPending}
        className="w-full bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2 transition-colors">
        {isPending ? 'Salvando...' : 'Adicionar'}
      </button>
    </form>
  )
}
