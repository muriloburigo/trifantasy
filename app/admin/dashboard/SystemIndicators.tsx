'use client'
import Link from 'next/link'
import { Users, TrendingUp, Wallet, AlertTriangle, Trophy, ChevronRight } from 'lucide-react'

function Metric({ label, value, sub, color = 'text-white' }: {
  label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div>
      <p className={`text-xl font-black leading-none ${color}`}>{value}</p>
      <p className="text-[9px] uppercase font-bold text-[var(--color-muted)] tracking-wider mt-1">{label}</p>
      {sub && <p className="text-[9px] text-[var(--color-muted)] mt-0.5">{sub}</p>}
    </div>
  )
}

function FunnelStep({ label, value, total, color }: {
  label: string; value: number; total: number; color: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-end justify-between mb-1">
        <p className="text-[9px] uppercase font-bold text-[var(--color-muted)] tracking-wider truncate">{label}</p>
        <p className="text-[9px] font-bold text-[var(--color-muted)] ml-1 shrink-0">{pct}%</p>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className={`text-lg font-black mt-1.5 leading-none ${color.replace('bg-', 'text-')}`}>{value}</p>
    </div>
  )
}

export default function SystemIndicators({
  funnel, economy, concentration, leagues, alerts,
}: {
  funnel: { usersTotal: number; usersWithTeam: number; usersWhoPlayed: number }
  economy: { avgNetWorth: number; liquidityPct: number; inWallets: number; inAthletes: number }
  concentration: { top1Pct: number; top3Combined: number; totalUsers: number }
  leagues: { activeLeagues: number; avgMembers: number; totalLeagues: number }
  alerts: { racesWithoutStartlist: any[]; pendingScoreRaces: any[]; openTickets: number }
}) {
  const totalAlerts = alerts.racesWithoutStartlist.length + alerts.pendingScoreRaces.length
  const concentrationRisk = concentration.top1Pct > 60 ? 'high' : concentration.top1Pct > 40 ? 'medium' : 'low'

  return (
    <div className="mb-10">
      <p className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-[0.2em] mb-4">
        Linha 1 — Saúde do Sistema
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Funil de Conversão */}
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={13} className="text-[var(--color-purple)]" />
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-purple)]">Funil de Conversão</p>
          </div>
          <div className="space-y-4">
            <FunnelStep
              label="Cadastrados"
              value={funnel.usersTotal}
              total={funnel.usersTotal}
              color="bg-[var(--color-purple)]"
            />
            <FunnelStep
              label="Criou time"
              value={funnel.usersWithTeam}
              total={funnel.usersTotal}
              color="bg-[var(--color-orange)]"
            />
            <FunnelStep
              label="Jogou prova"
              value={funnel.usersWhoPlayed}
              total={funnel.usersTotal}
              color="bg-[var(--color-success)]"
            />
          </div>
          <p className="text-[9px] text-[var(--color-muted)] mt-4 italic leading-tight">
            {funnel.usersTotal - funnel.usersWithTeam} usuários nunca montaram elenco.
          </p>
        </div>

        {/* Economia do Jogo */}
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={13} className="text-blue-400" />
            <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Economia</p>
          </div>
          <div className="space-y-4">
            <Metric
              label="Patrimônio médio"
              value={`T$${economy.avgNetWorth.toFixed(1)}`}
              sub="carteira + atletas por jogador"
              color="text-white"
            />
            <div>
              <div className="flex items-end justify-between mb-1">
                <p className="text-[9px] uppercase font-bold text-[var(--color-muted)] tracking-wider">Liquidez</p>
                <p className="text-[9px] font-bold text-blue-400">{economy.liquidityPct.toFixed(0)}%</p>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${economy.liquidityPct}%` }} />
              </div>
              <div className="flex justify-between mt-1.5">
                <p className="text-[9px] text-[var(--color-muted)]">T${Math.round(economy.inWallets)} em carteiras</p>
                <p className="text-[9px] text-[var(--color-muted)]">T${Math.round(economy.inAthletes)} em atletas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Concentração de Mercado */}
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={13} className="text-amber-400" />
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Concentração</p>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-end gap-2 mb-1">
                <p className={`text-2xl font-black leading-none ${
                  concentrationRisk === 'high' ? 'text-red-400' :
                  concentrationRisk === 'medium' ? 'text-amber-400' : 'text-[var(--color-success)]'
                }`}>{concentration.top1Pct}%</p>
                <p className={`text-[9px] font-bold pb-0.5 ${
                  concentrationRisk === 'high' ? 'text-red-400' :
                  concentrationRisk === 'medium' ? 'text-amber-400' : 'text-[var(--color-success)]'
                }`}>{concentrationRisk === 'high' ? '⚠ Alto' : concentrationRisk === 'medium' ? '~ Médio' : '✓ Saudável'}</p>
              </div>
              <p className="text-[9px] uppercase font-bold text-[var(--color-muted)] tracking-wider">times com o atleta #1</p>
            </div>
            <div>
              <p className="text-lg font-black text-white leading-none">{concentration.top3Combined}</p>
              <p className="text-[9px] uppercase font-bold text-[var(--color-muted)] tracking-wider mt-1">escalações dos top 3 atletas</p>
              <p className="text-[9px] text-[var(--color-muted)] mt-0.5">de {concentration.totalUsers} jogadores</p>
            </div>
          </div>
          <p className="text-[9px] text-[var(--color-muted)] mt-4 italic leading-tight">
            &gt;60% de posse num atleta indica mercado pouco diverso.
          </p>
        </div>

        {/* Ligas + Alertas Operacionais */}
        <div className="space-y-4">
          {/* Ligas */}
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={13} className="text-yellow-400" />
              <p className="text-xs font-bold uppercase tracking-wider text-yellow-400">Ligas</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Ativas (2+ membros)" value={leagues.activeLeagues} color="text-white" />
              <Metric label="Total criadas" value={leagues.totalLeagues} color="text-[var(--color-muted)]" />
              <Metric label="Média membros" value={leagues.avgMembers.toFixed(1)} color="text-white" />
              <Metric
                label="Taxa ativação"
                value={leagues.totalLeagues > 0 ? `${Math.round((leagues.activeLeagues / leagues.totalLeagues) * 100)}%` : '—'}
                color="text-yellow-400"
              />
            </div>
          </div>

          {/* Alertas Operacionais */}
          <div className={`rounded-2xl p-4 border ${
            totalAlerts > 0
              ? 'bg-red-950/20 border-red-800/40'
              : 'bg-[var(--color-navy-card)] border-[var(--color-navy-border)]'
          }`}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={13} className={totalAlerts > 0 ? 'text-red-400' : 'text-[var(--color-muted)]'} />
              <p className={`text-xs font-bold uppercase tracking-wider ${totalAlerts > 0 ? 'text-red-400' : 'text-[var(--color-muted)]'}`}>
                Alertas Operacionais
              </p>
            </div>
            {totalAlerts === 0 ? (
              <p className="text-xs text-[var(--color-success)]">✓ Tudo em ordem</p>
            ) : (
              <div className="space-y-2">
                {alerts.racesWithoutStartlist.length > 0 && (
                  <Link href="/admin/provas" className="flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    <p className="text-xs text-red-300">
                      {alerts.racesWithoutStartlist.length} prova{alerts.racesWithoutStartlist.length > 1 ? 's' : ''} sem startlist
                    </p>
                    <ChevronRight size={10} className="text-red-400 ml-auto opacity-0 group-hover:opacity-100" />
                  </Link>
                )}
                {alerts.pendingScoreRaces.length > 0 && (
                  <Link href="/admin/pontuacao" className="flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <p className="text-xs text-amber-300">
                      {alerts.pendingScoreRaces.length} prova{alerts.pendingScoreRaces.length > 1 ? 's' : ''} aguardando pontuação
                    </p>
                    <ChevronRight size={10} className="text-amber-400 ml-auto opacity-0 group-hover:opacity-100" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
