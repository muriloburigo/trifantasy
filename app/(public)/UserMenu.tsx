'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '~/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { ChevronDown, LogOut, User as UserIcon, Wallet, Users, ShieldCheck, PlayCircle } from 'lucide-react'
import LocaleSwitcher from '~/app/components/LocaleSwitcher'
import { useTranslations } from 'next-intl'

export default function UserMenu({ 
  user, wallet, name: propName, photoUrl 
}: { 
  user: User | null; 
  wallet?: number | null;
  name?: string | null;
  photoUrl?: string | null;
}) {
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

  const displayName = propName || user.user_metadata?.name || user.email?.split('@')[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm hover:text-[var(--color-orange)] transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-[var(--color-orange-dim)] border border-[var(--color-orange)]/30 flex items-center justify-center overflow-hidden shrink-0">
          {photoUrl ? (
            <img src={photoUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <UserIcon size={15} className="text-[var(--color-orange)]" />
          )}
        </div>
        <div className="hidden md:flex flex-col items-start leading-none">
          <span className="max-w-[100px] truncate text-xs font-bold">{displayName}</span>
          {wallet != null && <span className="text-[10px] text-[var(--color-orange)] font-bold">T${wallet.toFixed(0)}</span>}
        </div>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-20 w-48 bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-2xl shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-4 py-2 border-b border-[var(--color-navy-border)]">
              <LocaleSwitcher />
            </div>
            
            <Link
              href="/perfil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
            >
              <UserIcon size={14} className="text-[var(--color-muted)]" />
              <span>{t('myProfile')}</span>
            </Link>

            <Link
              href="/elenco"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
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
