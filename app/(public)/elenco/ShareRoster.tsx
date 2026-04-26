'use client'
import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Share2, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function ShareRoster({ 
  userName, 
  portfolio, 
  netWorth 
}: { 
  userName: string, 
  portfolio: any[], 
  netWorth: number 
}) {
  const t = useTranslations('home')
  const [loading, setLoading] = useState(false)
  const rosterRef = useRef<HTMLDivElement>(null)

  const handleShare = async () => {
    if (!rosterRef.current) return
    setLoading(true)

    try {
      // Create image
      const dataUrl = await toPng(rosterRef.current, {
        cacheBust: true,
        backgroundColor: '#050414',
        pixelRatio: 2, // Higher quality
      })

      // Download
      const link = document.createElement('a')
      link.download = `meu-elenco-trixer.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Erro ao gerar imagem:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleShare}
        disabled={loading || portfolio.length === 0}
        className="flex items-center gap-2 bg-[var(--color-navy-elevated)] hover:bg-white/10 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all border border-white/10 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} className="text-[var(--color-orange)]" />}
        {t('shareRoster')}
      </button>

      {/* Hidden Roster Card for Image Generation (Off-screen) */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <div 
          ref={rosterRef}
          className="w-[450px] bg-[#050414] p-10 flex flex-col gap-8 font-sans text-white"
          style={{ 
            backgroundImage: 'radial-gradient(circle at top right, rgba(255, 92, 0, 0.15), transparent), radial-gradient(circle at bottom left, rgba(107, 33, 168, 0.15), transparent)',
            minHeight: '800px'
          }}
        >
          {/* Logo & Header */}
          <div className="flex justify-between items-center border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[var(--color-orange)] font-black text-2xl tracking-tighter">TRIXER</span>
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Fantasy</span>
              </div>
              <p className="text-sm text-white/60">Trixer: <span className="text-white font-bold">{userName}</span></p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-white/40 mb-1 tracking-widest">Patrimônio Total</p>
              <p className="text-3xl font-black text-[var(--color-orange)] tracking-tight">T${netWorth.toFixed(0)}</p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center py-2">
             <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white/30 italic">Meu Elenco Oficial</h2>
          </div>

          {/* Athletes List */}
          <div className="flex-1 space-y-4">
            {portfolio.map((p, i) => {
              const ath = p.athlete as any
              return (
                <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center gap-5 shadow-2xl">
                  <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-[var(--color-orange)]/40 p-0.5 bg-[#050414]">
                    <div className="w-full h-full rounded-full overflow-hidden">
                      {ath?.photo_url ? (
                        <img src={ath.photo_url} alt={ath.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)] flex items-center justify-center text-xl font-black">
                          {ath?.name?.split(' ').slice(0,2).map((w: string) => w[0]).join('').toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-black truncate leading-none mb-2 tracking-tight">{ath.name.toUpperCase()}</p>
                    <div className="flex gap-3">
                      <div className="bg-white/5 px-2 py-0.5 rounded text-[10px] font-bold text-white/50 border border-white/5">PTO #{ath.pto_rank || '—'}</div>
                      <div className="bg-white/5 px-2 py-0.5 rounded text-[10px] font-bold text-white/50 border border-white/5">WTCS #{ath.wtcs_rank || '—'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-white tracking-tight">T${Number(ath.current_price).toFixed(0)}</p>
                    <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Valor</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-center">
            <div>
              <p className="text-[11px] font-medium text-white/40 mb-1">Crie seu elenco em</p>
              <p className="text-xl font-black tracking-tighter text-white">www.trixer.app</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)] rounded-2xl flex items-center justify-center shadow-xl rotate-3">
               <span className="text-white font-black text-lg -rotate-3">TRX</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
