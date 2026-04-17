'use client'
import { useState, useTransition } from 'react'
import { createLeague } from './actions'

export default function CreateLeagueForm({ races }: { races: { id: string; name: string; date: string }[] }) {
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createLeague(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handle} className="space-y-4">
      {error && (
        <p className="text-[var(--color-danger)] text-sm bg-red-950/30 rounded-lg p-2">{error}</p>
      )}
      <div>
        <label className="block text-sm text-[var(--color-muted)] mb-1">Nome da liga</label>
        <input
          name="name" required
          placeholder="Ex: Amigos do Grupo MT"
          className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]"
        />
      </div>
      <div>
        <label className="block text-sm text-[var(--color-muted)] mb-1">Prova</label>
        <select
          name="race_id" required
          className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]"
        >
          <option value="">Selecione uma prova</option>
          {races.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>
      <button
        type="submit" disabled={isPending}
        className="w-full bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
      >
        {isPending ? 'Criando...' : 'Criar Liga'}
      </button>
    </form>
  )
}
