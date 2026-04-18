'use client'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

export default function BackLink({ href, label }: { href: string; label?: string }) {
  const router = useRouter()

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
      {label ?? 'Voltar'}
    </button>
  )
}
