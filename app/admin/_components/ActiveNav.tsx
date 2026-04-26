'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, BarChart2, Flag, Users, FileText, Download,
  TrendingUp, Trophy, BookOpen, Bell, MessageCircle, Zap, LogOut, User, Menu, X
} from 'lucide-react'

const groups = [
  {
    label: 'Visão Geral',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin',           label: 'Insights',  icon: BarChart2 },
    ],
    },
  {
    label: 'Conteúdo',
    items: [
      { href: '/admin/provas',  label: 'Provas',  icon: Flag },
      { href: '/admin/atletas', label: 'Atletas', icon: User },
      { href: '/admin/mercado', label: 'Mercado', icon: TrendingUp },
    ],
  },
  {
    label: 'Operações',
    items: [
      { href: '/admin/importar',   label: 'Importar',   icon: Download },
      { href: '/admin/resultados', label: 'Resultados', icon: FileText },
      { href: '/admin/pontuacao',  label: 'Pontuação',  icon: Trophy },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/admin/usuarios',     label: 'Usuários',     icon: Users },
      { href: '/admin/suporte',      label: 'Suporte',      icon: MessageCircle },
      { href: '/admin/notificacoes', label: 'Notificações', icon: Bell },
      { href: '/admin/skills',       label: 'Skills',       icon: Zap },
      { href: '/admin/regras',       label: 'Regras',       icon: BookOpen },
    ],
  },
]

function NavContent({ pathname, onLinkClick }: { pathname: string; onLinkClick?: () => void }) {
  return (
    <>
      <nav className="flex-1 overflow-y-auto py-3 custom-scrollbar">
        {groups.map(group => (
          <div key={group.label} className="mb-4">
            <p className="px-4 text-[9px] font-black uppercase tracking-[0.12em] text-[var(--color-muted)]/60 mb-1">
              {group.label}
            </p>
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = href === '/admin' 
                ? pathname === '/admin' 
                : pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onLinkClick}
                  className={`flex items-center gap-2.5 mx-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    active
                      ? 'bg-[var(--color-orange)]/10 text-[var(--color-orange)] font-semibold'
                      : 'text-[var(--color-muted)] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon size={14} className={active ? 'text-[var(--color-orange)]' : ''} />
                  {label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-[var(--color-navy-border)]">
        <form action="/api/auth/logout" method="POST">
          <button className="flex items-center gap-2 text-xs text-[var(--color-muted)] hover:text-white transition-colors w-full">
            <LogOut size={13} />
            Sair
          </button>
        </form>
      </div>
    </>
  )
}

export default function ActiveNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close drawer on path change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      {/* ── Desktop Sidebar (Permanent) ── */}
      <aside className="hidden lg:flex w-56 shrink-0 border-r border-[var(--color-navy-border)] bg-[var(--color-navy-card)] flex-col sticky top-0 h-screen">
        <div className="px-4 py-4 border-b border-[var(--color-navy-border)]">
          <Link href="/" className="font-black text-base tracking-tight" style={{ fontFamily: 'var(--font-sora)' }}>
            <span className="text-[var(--color-orange)]">TRIX</span><span className="text-white">ER</span>
            <span className="block text-[10px] text-[var(--color-muted)] font-normal mt-0.5">Admin Panel</span>
          </Link>
        </div>
        <NavContent pathname={pathname} />
      </aside>

      {/* ── Mobile Header (Compact) ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[60] h-14 flex items-center justify-between px-4 bg-[var(--color-navy-card)] border-b border-[var(--color-navy-border)]">
        <Link href="/" className="font-black text-sm tracking-tight" style={{ fontFamily: 'var(--font-sora)' }}>
          <span className="text-[var(--color-orange)]">TRIX</span><span className="text-white">ER</span>
          <span className="text-[var(--color-muted)] font-normal text-xs ml-2">Admin</span>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white transition-all active:scale-95"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ── Mobile Drawer (Slide-in Overlay) ── */}
      <div className={`
        lg:hidden fixed inset-0 z-[50] transition-visibility duration-300
        ${open ? 'visible' : 'invisible'}
      `}>
        {/* Overlay backdrop */}
        <div 
          className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} 
          onClick={() => setOpen(false)}
        />
        
        {/* Sidebar content */}
        <div className={`
          absolute top-0 left-0 bottom-0 w-[280px] bg-[var(--color-navy-card)] border-r border-[var(--color-navy-border)] 
          flex flex-col pt-14 transform transition-transform duration-300 ease-out shadow-2xl
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <NavContent pathname={pathname} onLinkClick={() => setOpen(false)} />
        </div>
      </div>

      {/* Spacer for fixed header on mobile */}
      <div className="lg:hidden h-14 shrink-0" />
    </>
  )
}
