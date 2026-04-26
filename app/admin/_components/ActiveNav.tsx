'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, BarChart2, Flag, Users, FileText, Download,
  TrendingUp, Trophy, BookOpen, Bell, MessageCircle, Zap, LogOut, User
} from 'lucide-react'

const groups = [
  {
    label: 'Visão Geral',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
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

export default function ActiveNav() {
  const pathname = usePathname()

  return (
    <aside className="w-52 shrink-0 border-r border-[var(--color-navy-border)] bg-[var(--color-navy-card)] flex flex-col sticky top-0 h-screen">
      <div className="px-4 py-4 border-b border-[var(--color-navy-border)]">
        <Link href="/" className="font-black text-base tracking-tight" style={{ fontFamily: 'var(--font-sora)' }}>
          <span className="text-[var(--color-orange)]">TRIX</span><span className="text-white">ER</span>
          <span className="block text-[10px] text-[var(--color-muted)] font-normal mt-0.5">Admin Panel</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        {groups.map(group => (
          <div key={group.label} className="mb-4">
            <p className="px-4 text-[9px] font-black uppercase tracking-[0.12em] text-[var(--color-muted)]/60 mb-1">
              {group.label}
            </p>
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
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
    </aside>
  )
}
