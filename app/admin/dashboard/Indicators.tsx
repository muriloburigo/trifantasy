'use client'
import { TrendingUp, Users, ShoppingBag, Star, Zap } from 'lucide-react'

export default function Indicators({ topPicked, marketInsights }: { topPicked: any[], marketInsights: any }) {
  return (
    <div className="space-y-6">
      <h2 className="text-sm font-bold text-[var(--color-muted)] uppercase tracking-[0.2em]">Inteligência e Conteúdo</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Atletas mais escalados (Popularidade) */}
        <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--color-navy-border)] bg-white/5 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag size={14} className="text-[var(--color-orange)]" />
              Favoritos dos Trixers
            </span>
            <span className="text-[10px] text-[var(--color-muted)]">Portfólios Atuais</span>
          </div>
          <div className="divide-y divide-[var(--color-navy-border)]">
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
                  <p className="text-[9px] uppercase font-bold text-[var(--color-muted)]">Dono{item.count !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights de Mercado */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="text-blue-400" size={20} />
              <h3 className="font-bold text-sm">Liquidez e Economia</h3>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] uppercase font-bold text-[var(--color-muted)] mb-1">
                  <span>T$ em Circulação</span>
                  <span className="text-white">T${marketInsights.totalCoins.toLocaleString()}</span>
                </div>
                <div className="h-1.5 bg-[var(--color-navy-elevated)] rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--color-navy-card)] p-3 rounded-xl border border-white/5">
                  <p className="text-[9px] uppercase font-bold text-[var(--color-muted)] mb-1 text-center">Nas Carteiras</p>
                  <p className="text-lg font-black text-center text-white">T${marketInsights.inWallets.toLocaleString()}</p>
                </div>
                <div className="bg-[var(--color-navy-card)] p-3 rounded-xl border border-white/5">
                  <p className="text-[9px] uppercase font-bold text-[var(--color-muted)] mb-1 text-center">Em Atletas</p>
                  <p className="text-lg font-black text-center text-[var(--color-orange)]">T${marketInsights.inAthletes.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-[10px] text-[var(--color-muted)] leading-relaxed italic border-t border-white/5 pt-3">
                Dica de Conteúdo: O patrimônio médio de um Trixer hoje é de <strong>T${(marketInsights.totalCoins / marketInsights.userCount).toFixed(0)}</strong>.
              </p>
            </div>
          </div>

          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5 flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
               <Star size={24} className="text-amber-500" />
             </div>
             <div>
               <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Aposta de Valor</p>
               <p className="text-sm text-white font-medium mt-0.5">Atletas com Rank &lt; 20 e posse &lt; 5%</p>
               <p className="text-[10px] text-amber-500 font-bold mt-1 uppercase">Ótimo para posts de "Dicas Pro"</p>
             </div>
          </div>
        </div>

      </div>
    </div>
  )
}
