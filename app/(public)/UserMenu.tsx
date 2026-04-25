'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '~/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { ChevronDown, LogOut, User as UserIcon, Wallet, Users, ShieldCheck, PlayCircle } from 'lucide-react'
import LocaleSwitcher from '~/app/components/LocaleSwitcher'
import { useTranslations } from 'next-intl'

export default function UserMenu({ user, wallet }: { user: User | null; wallet?: number | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const t = useTranslations('nav')

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <LocaleSwitcher />
        <Link href="/login" className="text-sm text-[var(--color-muted)] hover:text-white transition-colors">{t('login')}</Link>
        <Link
          href="/register"
          className="text-sm bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
        >
          {t('createAccount')}
        </Link>
      </div>
    )
  }

  const name = user.user_metadata?.name ?? user.email?.split('@')[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm hover:text-[var(--color-orange)] transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-[var(--color-orange-dim)] border border-[var(--color-orange)]/30 flex items-center justify-center">
          <UserIcon size={14} className="text-[var(--color-orange)]" />
        </div>
        <div className="hidden md:flex flex-col items-start leading-none">
          <span className="max-w-[100px] truncate text-xs">{name}</span>
          {wallet != null && <span className="text-[10px] text-[var(--color-orange)] font-bold">T${wallet.toFixed(0)}</span>}
        </div>
        <ChevronDown size={14} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-20 w-44 bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-xl shadow-xl py-1">
            <div className="px-4 py-2 border-b border-[var(--color-navy-border)]">
              <LocaleSwitcher />
            </div>
            <Link
              href="/elenco"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--color-navy-border)]/40 transition-colors"
            >
              <Wallet size={14} className="text-[var(--color-orange)]" />
              <span>{t('team')}</span>
              {wallet != null && <span className="ml-auto text-xs text-[var(--color-orange)] font-bold">T${wallet.toFixed(0)}</span>}
            </Link>
            <Link
              href="/ligas"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--color-navy-border)]/40 transition-colors"
            >
              <Users size={14} className="text-[var(--color-muted)]" />
              {t('myLeagues')}
            </Link>
            <Link
              href="/configuracoes/seguranca"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--color-navy-border)]/40 transition-colors"
            >
              <ShieldCheck size={14} className="text-[var(--color-muted)]" />
              {t('security')}
            </Link>
            <button
              onClick={async () => {
                setOpen(false)
                const res = await fetch('/api/tour/reset', { method: 'POST' })
                if (res.ok) {
                  localStorage.removeItem('trixer_tour_seen')
                  window.location.replace('/')
                }
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-[var(--color-navy-border)]/40 transition-colors cursor-pointer"
            >
              <PlayCircle size={14} className="text-[var(--color-muted)]" />
              {t('tour')}
            </button>
            <hr className="border-[var(--color-navy-border)] my-1" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-navy-border)]/40 transition-colors"
            >
              <LogOut size={14} />
              {t('logout')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
