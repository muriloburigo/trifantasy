import { notFound } from 'next/navigation'
import { createPublicClient } from '~/lib/supabase/server'
import { Trophy, Timer, Star, CheckCircle2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import BackLink from '~/app/components/BackLink'

export const revalidate = 0

export default async function ScoreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createPublicClient()

  // Fetch score with team and user info
  const { data: score, error } = await supabase
    .from('scores')
    .select(`
      id,
      total_points,
      breakdown,
      created_at,
      race:races(id, name, location, date),
      team:teams(
        id,
        user_id,
        profile:profiles(name)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !score) notFound()

  const breakdown = (score.breakdown as any[]) || []
  const race = score.race as any
  const profile = (score.team as any)?.profile

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <BackLink href="/ligas" />
      
      {/* Header Card */}
      <div className="bg-gradient-to-br from-[var(--color-navy-card)] to-[var(--color-navy)] border border-[var(--color-navy-border)] rounded-3xl p-8 mb-8 text-center relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-orange)] to-[var(--color-purple)]" />
        
        <p className="text-[var(--color-orange)] text-xs font-black uppercase tracking-[0.2em] mb-2">Resultado Oficial</p>
        <h1 className="text-3xl font-black mb-1 leading-tight">{race.name}</h1>
        <p className="text-[var(--color-muted)] text-sm mb-6">{race.location} · {new Date(race.date).toLocaleDateString()}</p>
        
        <div className="inline-flex flex-col items-center">
          <div className="text-6xl font-black text-white mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            {score.total_points}
          </div>
          <div className="bg-white/10 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/80">
            Pontos Totais
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3 pt-6 border-t border-white/5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)] flex items-center justify-center text-xs font-black">
            {profile?.name?.charAt(0).toUpperCase()}
          </div>
          <span className="font-bold text-sm">Escalado por {profile?.name}</span>
        </div>
      </div>

      {/* Breakdown List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[var(--color-muted)] uppercase tracking-widest ml-1">Desempenho por Atleta</h2>
        
        {breakdown.map((item: any, i: number) => (
          <div key={i} className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden hover:border-[var(--color-orange)]/30 transition-colors">
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[var(--color-navy-elevated)] flex items-center justify-center shrink-0 border border-white/5">
                  <Star className={item.total > 0 ? "text-yellow-400" : "text-[var(--color-muted)]"} size={18} fill={item.total > 0 ? "currentColor" : "none"} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm truncate">{item.athlete_name}</h3>
                  <p className="text-[10px] font-bold text-[var(--color-muted)] uppercase tracking-tighter">
                    {item.type === 'pro' ? 'Categoria PRO' : 'Age Grouper'}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xl font-black text-[var(--color-orange)]">+{item.total}</div>
                <p className="text-[9px] text-[var(--color-muted)] font-bold uppercase">Pontos</p>
              </div>
            </div>
            
            {/* Detail pills */}
            {item.detail && item.detail.length > 0 && (
              <div className="px-4 pb-4 flex flex-wrap gap-1.5">
                {item.detail.map((d: string, j: number) => (
                  <span key={j} className="text-[10px] bg-white/5 text-[var(--color-muted)] px-2 py-0.5 rounded-md border border-white/5">
                    {d}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link href="/" className="text-xs font-bold text-[var(--color-muted)] hover:text-white transition-colors flex items-center justify-center gap-2">
          <ArrowLeft size={14} /> Voltar para a Home
        </Link>
      </div>
    </div>
  )
}
