'use client'
import { useState, useTransition } from 'react'
import { addMemberByUsername } from '../criar/actions'
import { UserPlus, Check } from 'lucide-react'

export default function AddMemberForm({ leagueId }: { leagueId: string }) {
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isPending, startTransition] = useTransition()

  function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')
    const username = (new FormData(e.currentTarget).get('username') as string)?.trim()
    if (!username) return
    ;(e.currentTarget as HTMLFormElement).reset()
    startTransition(async () => {
      const result = await addMemberByUsername(leagueId, username)
      if (result?.error) setError(result.error)
      else if (result?.success) setSuccess(result.success)
    })
  }

  return (
    <form onSubmit={handle} className="flex gap-2">
      <input
        name="username"
        placeholder="Nome do usuário"
        required
        className="flex-1 bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]"
      />
      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-1.5 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] disabled:opacity-50 text-white font-semibold rounded-lg px-3 py-2 text-sm transition-colors shrink-0"
      >
        <UserPlus size={14} />
        {isPending ? '...' : 'Adicionar'}
      </button>
      {error && <p className="absolute mt-10 text-xs text-[var(--color-danger)]">{error}</p>}
      {success && <p className="absolute mt-10 text-xs text-[var(--color-success)] flex items-center gap-1"><Check size={11} />{success}</p>}
    </form>
  )
}
