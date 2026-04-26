import { createAdminClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/auth/require-admin'
import Link from 'next/link'
import PageHeader from '../_components/PageHeader'
import StatCard from '../_components/StatCard'
import AdminBadge from '../_components/AdminBadge'
import { Flag, Users, Trophy, Globe, ArrowRight, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatDate } from '~/lib/utils'

export default async function AdminDashboard() {
  await requireAdmin()
  const supabase = createAdminClient()

  const [
    racesRes, athletesRes, teamsRes, usersRes,
    upcomingRes, recentScoresRes, openTicketsRes,
  ] = await Promise.all([
    supabase.from('races').select('id', { count: 'exact', head: true }),
    supabase.from('athletes').select('id', { count: 'exact', head: true }).eq('type', 'pro'),
    supabase.from('teams').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('races').select('id, name, date, status').in('status', ['upcoming', 'open', 'locked']).order('date', { ascending: true }).limit(5),
    supabase.from('scores').select('team_id, total_points, calculated_at, teams!inner(user_id, profile:profiles(name))').order('calculated_at', { ascending: false }).limit(8),
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
  ])

  const stats = [
    { label: 'Provas cadastradas', value: racesRes.count ?? 0, icon: Flag, href: '/admin/provas' },
    { label: 'Atletas PRO', value: athletesRes.count ?? 0, icon: Users, href: '/admin/atletas?race_id=all' },
    { label: 'Trixers', value: usersRes.count ?? 0, icon: Globe, href: '/admin/usuarios' },
    { label: 'Times montados', value: teamsRes.count ?? 0, icon: Trophy },
  ]

  const upcoming = upcomingRes.data ?? []
  const recentScores = recentScoresRes.data ?? []
  const openTickets = openTicketsRes.count ?? 0

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Dashboard"
        description="Visão operacional do Trixer"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Alerts */}
      {openTickets > 0 && (
        <Link href="/admin/suporte" className="flex items-center gap-3 bg-yellow-900/20 border border-yellow-700/40 rounded-xl px-4 py-3 mb-6 hover:border-yellow-600/60 transition-colors">
          <AlertCircle size={16} className="text-yellow-400 shrink-0" />
          <span className="text-sm text-yellow-300 font-medium">
            {openTickets} ticket{openTickets !== 1 ? 's' : ''} de suporte aberto{openTickets !== 1 ? 's' : ''} aguardando resposta
          </span>
          <ArrowRight size={14} className="text-yellow-400 ml-auto" />
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming races */}
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-navy-border)]">
            <span className="font-semibold text-sm">Próximas Provas</span>
            <Link href="/admin/provas" className="text-xs text-[var(--color-muted)] hover:text-white transition-colors flex items-center gap-1">
              Ver todas <ArrowRight size={11} />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-[var(--color-muted)]">Nenhuma prova ativa.</div>
          ) : (
            <div className="divide-y divide-[var(--color-navy-border)]">
              {upcoming.map((r: any) => (
                <Link key={r.id} href={`/admin/provas/${r.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.03] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.name}</p>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5 flex items-center gap-1">
                      <Clock size={10} /> {formatDate(r.date)}
                    </p>
                  </div>
                  <AdminBadge status={r.status} />
                  <ArrowRight size={13} className="text-[var(--color-muted)] shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--color-navy-border)]">
            <span className="font-semibold text-sm">Ações Rápidas</span>
          </div>
          <div className="p-4 space-y-2">
            {[
              { href: '/admin/importar',   label: 'Importar dados via URL', icon: Flag,         desc: 'Startlist e Resultados (Scraping)' },
              { href: '/admin/resultados', label: 'Gerenciar resultados',    icon: CheckCircle2, desc: 'Adicionar / editar / deletar' },
              { href: '/admin/pontuacao',  label: 'Calcular pontuação',      icon: Trophy,       desc: 'Após importar resultados' },
              { href: '/admin/mercado',    label: 'Ajustar preços',          icon: Users,        desc: 'Editar preços manualmente' },
            ].map(({ href, label, icon: Icon, desc }) => (
              <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--color-navy-elevated)] transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-orange)]/10 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-[var(--color-orange)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-[var(--color-muted)]">{desc}</p>
                </div>
                <ArrowRight size={13} className="text-[var(--color-muted)] group-hover:text-white transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent scores */}
        {recentScores.length > 0 && (
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl overflow-hidden lg:col-span-2">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-navy-border)]">
              <span className="font-semibold text-sm">Pontuações Recentes</span>
              <Link href="/admin/pontuacao" className="text-xs text-[var(--color-muted)] hover:text-white transition-colors flex items-center gap-1">
                Gerenciar <ArrowRight size={11} />
              </Link>
            </div>
            <div className="divide-y divide-[var(--color-navy-border)]">
              {recentScores.map((s: any) => (
                <div key={s.team_id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="text-sm flex-1 text-[var(--color-muted)]">
                    {(s.teams as any)?.profile?.name ?? 'Usuário'}
                  </span>
                  <span className="text-xs text-[var(--color-muted)]">
                    {new Date(s.calculated_at).toLocaleDateString('pt-BR')}
                  </span>
                  <span className="font-bold text-[var(--color-orange)] text-sm w-16 text-right">
                    {s.total_points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
