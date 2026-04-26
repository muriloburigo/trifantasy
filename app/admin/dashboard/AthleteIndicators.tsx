'use client'
import { ShoppingBag, TrendingUp, TrendingDown, Star, Trophy } from 'lucide-react'

function AthleteRow({ rank, name, value, valueLabel, sub, valueColor = 'text-white' }: {
  rank?: number; name: string; value: string | number; valueLabel: string; sub?: string; valueColor?: string
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
      {rank !== undefined && (
        <span className="text-[10px] font-bold text-[var(--color-muted)] w-4 shrink-0">{rank}</span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white truncate">{name}</p>
        {sub && <p className="text-[9px] text-[var(--color-muted)]">{sub}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-black ${valueColor}`}>{value}</p>
        <p className="text-[9px] uppercase font-bold text-[var(--color-muted)]">{valueLabel}</p>
      </div>
    </div>
  )
}

function CardHeader({ icon: Icon, label, color }: { icon: any; label: string; color: string }) {
  return (
    <div className={`px-4 py-3 border-b border-[var(--color-navy-border)] flex items-center gap-2`}>
      <Icon size={13} className={color} />
      <p className={`text-[10px] font-bold uppercase tracking-wider ${color}`}>{label}</p>
    </div>
  )
}

export default function AthleteIndicators({
  topPicked, rising, falling, sleepers, topPerformers, lastRaceName,
}: {
  topPicked: { name: string; count: number; price: number; ownershipPct: number }[]
  rising: { id: string; name: string; current_price: number; price_change: number }[]
  falling: { id: string; name: string; current_price: number; price_change: number }[]
  sleepers: { name: string; current_price: number; bestRank: number; ownership: number; ownershipPct: number }[]
  topPerformers: { name: string; points: number }[]
  lastRaceName: string | null
}) {
  return (
    <div className="mb-10">
      <p className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-[0.2em] mb-4">
        Linha 2 — Dinâmicas de Atletas & Provas
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Mais escalados */}
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden flex flex-col">
          <CardHeader icon={ShoppingBag} label="Mais Escalados" color="text-[var(--color-orange)]" />
          <div className="divide-y divide-[var(--color-navy-border)] flex-1">
            {topPicked.length === 0
              ? <p className="text-xs text-[var(--color-muted)] text-center p-6 italic">Sem dados</p>
              : topPicked.map((a, i) => (
                <AthleteRow
                  key={i}
                  rank={i + 1}
                  name={a.name}
                  value={`${a.ownershipPct}%`}
                  valueLabel={`${a.count} donos`}
                  sub={`T$${a.price}`}
                  valueColor="text-[var(--color-orange)]"
                />
              ))
            }
          </div>
        </div>

        {/* Maiores altas */}
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden flex flex-col">
          <CardHeader icon={TrendingUp} label="Maiores Altas" color="text-[var(--color-success)]" />
          <div className="divide-y divide-[var(--color-navy-border)] flex-1">
            {rising.length === 0
              ? <p className="text-xs text-[var(--color-muted)] text-center p-6 italic">Sem valorizações recentes</p>
              : rising.map((a, i) => (
                <AthleteRow
                  key={a.id}
                  rank={i + 1}
                  name={a.name}
                  value={`+T$${Number(a.price_change).toFixed(1)}`}
                  valueLabel={`T$${Number(a.current_price)}`}
                  valueColor="text-[var(--color-success)]"
                />
              ))
            }
          </div>
        </div>

        {/* Maiores baixas */}
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden flex flex-col">
          <CardHeader icon={TrendingDown} label="Maiores Baixas" color="text-[var(--color-danger)]" />
          <div className="divide-y divide-[var(--color-navy-border)] flex-1">
            {falling.length === 0
              ? <p className="text-xs text-[var(--color-muted)] text-center p-6 italic">Sem desvalorizações recentes</p>
              : falling.map((a, i) => (
                <AthleteRow
                  key={a.id}
                  rank={i + 1}
                  name={a.name}
                  value={`T$${Number(a.price_change).toFixed(1)}`}
                  valueLabel={`T$${Number(a.current_price)}`}
                  valueColor="text-[var(--color-danger)]"
                />
              ))
            }
          </div>
        </div>

        {/* Sleepers + Líderes da Rodada */}
        <div className="space-y-4">
          {/* Sleepers */}
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden">
            <CardHeader icon={Star} label="Sleepers (subescalados)" color="text-amber-400" />
            <div className="divide-y divide-[var(--color-navy-border)]">
              {sleepers.length === 0
                ? <p className="text-xs text-[var(--color-muted)] text-center p-4 italic">Nenhum sleeper óbvio</p>
                : sleepers.slice(0, 3).map((a, i) => (
                  <AthleteRow
                    key={i}
                    name={a.name}
                    value={`${a.ownershipPct}%`}
                    valueLabel={`rank #${a.bestRank}`}
                    sub={`T$${Number(a.current_price)}`}
                    valueColor="text-amber-400"
                  />
                ))
              }
            </div>
          </div>

          {/* Líderes da rodada */}
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-navy-border)] flex items-center gap-2">
              <Trophy size={13} className="text-yellow-400" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">Líderes da Rodada</p>
                {lastRaceName && <p className="text-[9px] text-[var(--color-muted)] truncate">{lastRaceName}</p>}
              </div>
            </div>
            <div className="divide-y divide-[var(--color-navy-border)]">
              {topPerformers.length === 0
                ? <p className="text-xs text-[var(--color-muted)] text-center p-4 italic">Nenhuma prova finalizada</p>
                : topPerformers.slice(0, 3).map((p, i) => (
                  <AthleteRow
                    key={i}
                    rank={i + 1}
                    name={p.name}
                    value={`${p.points}`}
                    valueLabel="pts"
                    valueColor={i === 0 ? 'text-yellow-400' : 'text-white'}
                  />
                ))
              }
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
