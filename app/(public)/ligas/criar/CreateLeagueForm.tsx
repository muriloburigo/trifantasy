'use client'
import { useState, useTransition } from 'react'
import { createLeague } from './actions'
import { Globe, Lock } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function CreateLeagueForm() {
  const t = useTranslations('leagues')
  const [error, setError] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const formData = new FormData(e.currentTarget)
    formData.set('is_public', String(isPublic))
    startTransition(async () => {
      const result = await createLeague(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handle} className="space-y-5">
      {error && (
        <p className="text-[var(--color-danger)] text-sm bg-red-950/30 rounded-lg p-2">{error}</p>
      )}

      <div>
        <label className="block text-sm text-[var(--color-muted)] mb-1">{t('nameLabel')}</label>
        <input
          name="name" required
          placeholder={t('namePlaceholder')}
          className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]"
        />
      </div>

      {/* Public / Private toggle */}
      <div>
        <label className="block text-sm text-[var(--color-muted)] mb-2">{t('visibilityLabel')}</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIsPublic(false)}
            className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-all ${
              !isPublic
                ? 'bg-[var(--color-orange-dim)] border-[var(--color-orange)]/60 text-white'
                : 'bg-[var(--color-navy-elevated)] border-[var(--color-navy-border)] text-[var(--color-muted)] hover:border-[var(--color-navy-elevated)]'
            }`}
          >
            <Lock size={15} className={!isPublic ? 'text-[var(--color-orange)]' : ''} />
            <div className="text-left">
              <p className="font-semibold leading-tight">{t('privateLabel')}</p>
              <p className="text-[11px] opacity-70 leading-tight">{t('privateDesc')}</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setIsPublic(true)}
            className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-all ${
              isPublic
                ? 'bg-[var(--color-orange-dim)] border-[var(--color-orange)]/60 text-white'
                : 'bg-[var(--color-navy-elevated)] border-[var(--color-navy-border)] text-[var(--color-muted)] hover:border-[var(--color-navy-elevated)]'
            }`}
          >
            <Globe size={15} className={isPublic ? 'text-[var(--color-orange)]' : ''} />
            <div className="text-left">
              <p className="font-semibold leading-tight">{t('publicLabel')}</p>
              <p className="text-[11px] opacity-70 leading-tight">{t('publicDesc')}</p>
            </div>
          </button>
        </div>
      </div>

      <button
        type="submit" disabled={isPending}
        className="w-full bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
      >
        {isPending ? t('creating') : t('createSubmit')}
      </button>
    </form>
  )
}
