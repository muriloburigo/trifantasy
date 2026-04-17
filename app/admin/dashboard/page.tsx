import { createAdminClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/auth/require-admin'
import Link from 'next/link'
import { Flag, Users, Trophy, BarChart2 } from 'lucide-react'

export default async function AdminDashboard() {
  await requireAdmin()
  const supabase = createAdminClient()

  const [races, athletes, teams, leagues] = await Promise.all([
    supabase.from('races').select('id', { count: 'exact' }),
    supabase.from('athletes').select('id', { count: 'exact' }),
    supabase.from('teams').select('id', { count: 'exact' }),
    supabase.from('leagues').select('id', { count: 'exact' }),
  ])

  const stats = [
    { label: 'Provas', value: races.count ?? 0, icon: Flag, href: '/admin/provas' },
    { label: 'Atletas', value: athletes.count ?? 0, icon: Users, href: '/admin/atletas' },
    { label: 'Times', value: teams.count ?? 0, icon: Trophy, href: '#' },
    { label: 'Ligas', value: leagues.count ?? 0, icon: BarChart2, href: '#' },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4 hover:border-[var(--color-orange)]/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[var(--color-muted)]">{label}</span>
              <Icon size={16} className="text-[var(--color-orange)]" />
            </div>
            <p className="text-3xl font-black">{value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/provas/nova" className="bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white rounded-xl p-4 font-semibold transition-colors">
          + Nova Prova
        </Link>
        <Link href="/admin/atletas" className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)]/50 rounded-xl p-4 font-semibold transition-colors">
          Importar Atletas →
        </Link>
        <Link href="/admin/resultados" className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)]/50 rounded-xl p-4 font-semibold transition-colors">
          Importar Resultados →
        </Link>
        <Link href="/admin/pontuacao" className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)]/50 rounded-xl p-4 font-semibold transition-colors">
          Calcular Pontuação →
        </Link>
      </div>
    </div>
  )
}
