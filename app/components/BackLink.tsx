'use client'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function BackLink({ href, label }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-white transition-colors mb-6"
    >
      <ChevronLeft size={15} />
      {label ?? 'Voltar'}
    </Link>
  )
}
