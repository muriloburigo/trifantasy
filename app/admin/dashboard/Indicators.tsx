'use client'
import { TrendingUp, Users, ShoppingBag, Star, Zap, Trophy, ArrowUpRight } from 'lucide-react'

export default function Indicators({ 
  topPicked, 
  sleepers, 
  topPerformers,
  marketInsights 
}: { 
  topPicked: any[], 
  sleepers: any[],
  topPerformers: any[],
  marketInsights: any 
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-sm font-bold text-[var(--color-muted)] uppercase tracking-[0.2em]">Inteligência e Conteúdo</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Atletas mais escalados (Popularidade) */}
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-[var(--color-navy-border)] bg-white/5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-white">
              <ShoppingBag size={14} className="text-[var(--color-orange)]" />
              Favoritos dos Trixers
            </span>
          </div>
          <div className="divide-y divide-[var(--color-navy-border)] flex-1">
            {topPicked.map((item, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-[var(--color-muted)] w-4">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-[var(--color-muted)]">Preço: T${item.price}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[var(--color-orange)]">{item.count}</p>
                  <p className="text-[9px] uppercase font-bold text-[var(--color-muted)]">Donos</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Apostas de Valor (Sleepers) */}
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden flex flex-col">
          <div className="px-5 py-3 border-b border-[var(--color-navy-border)] bg-amber-500/5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-amber-500">
              <Star size={14} fill="currentColor" />
              Apostas de Valor (Sleepers)
            </span>
          </div>
          <div className="divide-y divide-[var(--color-navy-border)] flex-1">
            {sleepers.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--color-muted)] italic">Nenhum sleeper óbvio no momento.</div>
            ) : sleepers.map((item, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-[10px] font-black text-amber-500 shrink-0">
                    #{item.bestRank}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-[var(--color-muted)]">Rank Mundial</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white">{item.ownership}</p>
                  <p className="text-[9px] uppercase font-bold text-[var(--color-muted)]">Posse</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-amber-500/10 border-t border-[var(--color-navy-border)]">
             <p className="text-[9px] text-amber-200/70 leading-tight italic">
               <strong>Dica PRO:</strong> Atletas com rank alto e baixa posse são ótimos diferenciais para "subir o morro" no ranking global.
             </p>
          </div>
        </div>

        {/* Insights de Mercado e Melhores da Rodada */}
        <div className="space-y-6">
          {/* Top da Última Rodada */}
          <div className="bg-gradient-to-br from-[var(--color-orange)]/20 to-amber-900/20 border border-[var(--color-orange)]/30 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-[var(--color-orange)]">
                <Trophy size={14} />
                Líderes da Rodada
              </span>
            </div>
            <div className="p-4 space-y-3">
              {topPerformers.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-xs text-white/80 truncate pr-2">{i+1}. {p.name}</span>
                  <span className="text-xs font-bold text-white shrink-0">{p.points} pts</span>
                </div>
              ))}
              {topPerformers.length === 0 && (
                <p className="text-[10px] text-[var(--color-muted)] text-center italic py-2">Nenhuma prova finalizada recentemente.</p>
              )}
            </div>
          </div>

          {/* Economia e Ligas */}
          <div className="bg-[var(--color-navy-card)] border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-blue-400">
              <TrendingUp size={18} />
              <h3 className="font-bold text-xs uppercase tracking-wider">Saúde do Ecossistema</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-3 rounded-xl">
                <p className="text-[9px] uppercase font-bold text-[var(--color-muted)] mb-1">Patrimônio Médio</p>
                <p className="text-lg font-black text-white">T${(marketInsights.totalCoins / marketInsights.userCount).toFixed(1)}</p>
              </div>
              <div className="bg-white/5 p-3 rounded-xl">
                <p className="text-[9px] uppercase font-bold text-[var(--color-muted)] mb-1">Liquidez</p>
                <p className="text-lg font-black text-blue-400">{((marketInsights.inWallets / marketInsights.totalCoins) * 100).toFixed(0)}%</p>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5">
              <div className="flex items-center gap-2 mb-3 text-purple-400">
                <Users size={14} />
                <h4 className="text-[10px] font-bold uppercase tracking-widest">Engajamento Social</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[18px] font-black text-white">{marketInsights.leagueStats.count}</p>
                  <p className="text-[9px] uppercase font-bold text-[var(--color-muted)]">Ligas Privadas</p>
                </div>
                <div>
                  <p className="text-[18px] font-black text-white">{marketInsights.leagueStats.avgMembers.toFixed(1)}</p>
                  <p className="text-[9px] uppercase font-bold text-[var(--color-muted)]">Média de Membros</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
