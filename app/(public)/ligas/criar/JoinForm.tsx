'use client'
import { useState, useTransition } from 'react'
import { joinLeague } from './actions'
import { useTranslations } from 'next-intl'

export default function JoinForm() {
  const t = useTranslations('leagues')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  async function handle(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const result = await joinLeague(code)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handle} className="flex gap-2">
      <input
        value={code}
        onChange={e => setCode(e.target.value.toUpperCase())}
        placeholder={t('joinPlaceholder')}
        maxLength={8}
        required
        className="flex-1 bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--color-orange)] uppercase"
      />
      <button
        type="submit" disabled={isPending || code.length < 4}
        className="bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)] text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-40"
      >
        {isPending ? t('joining') : t('joinSubmit')}
      </button>
      {error && <p className="text-[var(--color-danger)] text-xs mt-2 col-span-2">{error}</p>}
    </form>
  )
}
