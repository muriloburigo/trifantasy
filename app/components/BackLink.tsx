'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function BackLink({ href, label }: { href: string; label?: string }) {
  const router = useRouter()
  const t = useTranslations('common')

  function handleBack() {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(href)
    }
  }

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-white transition-colors mb-6"
    >
      <ChevronLeft size={15} />
      {label ?? t('back')}
    </button>
  )
}
