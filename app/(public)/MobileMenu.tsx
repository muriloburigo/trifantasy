'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function MobileMenu() {
  const [open, setOpen] = useState(false)
  const t = useTranslations('nav')

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 text-[var(--color-muted)] hover:text-white transition-colors"
        aria-label="Menu"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-14 z-50 bg-[var(--color-navy-card)] border-b border-[var(--color-navy-border)] shadow-xl">
            <nav className="flex flex-col py-2">
              <Link href="/"        onClick={() => setOpen(false)} className="px-6 py-3 text-sm text-[var(--color-muted)] hover:text-white hover:bg-[var(--color-navy-elevated)] transition-colors">{t('home')}</Link>
              <Link href="/provas"  onClick={() => setOpen(false)} className="px-6 py-3 text-sm text-[var(--color-muted)] hover:text-white hover:bg-[var(--color-navy-elevated)] transition-colors">{t('races')}</Link>
              <Link href="/atletas" onClick={() => setOpen(false)} className="px-6 py-3 text-sm text-[var(--color-muted)] hover:text-white hover:bg-[var(--color-navy-elevated)] transition-colors">{t('athletes')}</Link>
              <Link href="/ligas"   onClick={() => setOpen(false)} className="px-6 py-3 text-sm text-[var(--color-muted)] hover:text-white hover:bg-[var(--color-navy-elevated)] transition-colors">Trix Leagues</Link>
              <Link href="/regras"  onClick={() => setOpen(false)} className="px-6 py-3 text-sm text-[var(--color-muted)] hover:text-white hover:bg-[var(--color-navy-elevated)] transition-colors">{t('rules')}</Link>
            </nav>
          </div>
        </>
      )}
    </div>
  )
}
