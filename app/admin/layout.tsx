import Link from 'next/link'
import { createClient } from '~/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LayoutDashboard, Flag, Users, FileText, BarChart2, LogOut } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) redirect('/')

  const nav = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/provas', label: 'Provas', icon: Flag },
    { href: '/admin/atletas', label: 'Atletas', icon: Users },
    { href: '/admin/resultados', label: 'Resultados', icon: FileText },
    { href: '/admin/pontuacao', label: 'Pontuação', icon: BarChart2 },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-52 border-r border-[var(--color-navy-border)] bg-[var(--color-navy-card)] flex flex-col">
        <div className="px-4 py-4 border-b border-[var(--color-navy-border)]">
          <Link href="/" className="font-bold text-base">
            <span className="text-[var(--color-orange)]">TRIX</span>ER
            <span className="text-xs text-[var(--color-muted)] block">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 py-4 space-y-0.5">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--color-muted)] hover:text-white hover:bg-[var(--color-navy-elevated)] transition-colors"
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-[var(--color-navy-border)]">
          <form action="/api/auth/logout" method="POST">
            <button className="flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-white transition-colors">
              <LogOut size={14} />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
