'use client'
import { useTransition } from 'react'
import { useLocale } from 'next-intl'
import { setLocale } from '~/app/actions/setLocale'
import { Globe } from 'lucide-react'

const LOCALES = [
  { code: 'pt', label: 'PT' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
] as const

export default function LocaleSwitcher() {
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-1">
      <Globe size={12} className="text-[var(--color-muted)]" />
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          disabled={isPending || locale === code}
          onClick={() => startTransition(async () => {
            await setLocale(code)
            window.location.reload()
          })}
          className={`text-xs px-1.5 py-0.5 rounded transition-colors ${
            locale === code
              ? 'text-[var(--color-orange)] font-bold'
              : 'text-[var(--color-muted)] hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
