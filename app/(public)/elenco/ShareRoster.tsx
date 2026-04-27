'use client'
import { useRef, useState, useEffect } from 'react'
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
      // Small delay to ensure browser has processed all elements
      await new Promise(resolve => setTimeout(resolve, 600))

      const dataUrl = await toPng(rosterRef.current, {
        cacheBust: true,
        backgroundColor: '#050414',
        pixelRatio: 3, 
        style: {
          visibility: 'visible',
        }
      })

      const link = document.createElement('a')
      link.download = `meu-elenco-trixer.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (err) {
      console.error('Export error:', err)
      alert('Erro ao gerar imagem. Tente recarregar a página.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleShare}
        disabled={loading || portfolio.length === 0}
        className="flex items-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-2 rounded-lg transition-all active:scale-95 disabled:opacity-30 shadow-lg shadow-[var(--color-orange)]/20"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
        {t('shareRoster') || 'Compartilhar'}
      </button>

      {/* ── Export Card (9:16 Proportions) ── */}
      <div style={{ position: 'fixed', left: '-9999px', top: '0', pointerEvents: 'none', visibility: 'visible' }}>
        <div 
          ref={rosterRef}
          className="w-[450px] h-[800px] bg-[#050414] flex flex-col px-10 py-16 font-sans text-white relative overflow-hidden"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 20% 10%, rgba(255, 92, 0, 0.15), transparent), radial-gradient(circle at 80% 90%, rgba(107, 33, 168, 0.12), transparent)',
          }}
        >
          {/* Background Branding Logo */}
          <div className="absolute top-[15%] left-1/2 -translate-x-1/2 opacity-[0.03] pointer-events-none w-full text-center">
            <span className="text-[140px] font-black tracking-tighter">TRIXER</span>
          </div>

          {/* ── Header ── */}
          <div className="mb-8 relative z-10">
            <div className="flex justify-between items-center border-b-2 border-[var(--color-orange)] pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[var(--color-orange)] font-black text-3xl tracking-tighter">TRIXER</span>
                  <div className="flex flex-col">
                    <span className="text-white/40 text-[8px] font-bold uppercase tracking-[0.2em] leading-none">The Triathlon</span>
                    <span className="text-white/40 text-[8px] font-bold uppercase tracking-[0.2em] leading-none mt-0.5">Game</span>
                  </div>
                </div>
                <p className="text-[11px] text-white/60 uppercase font-bold tracking-wider">Trixer: <span className="text-white">{userName}</span></p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase text-white/40 mb-1 tracking-widest">Patrimônio</p>
                <p className="text-3xl font-black text-[var(--color-orange)] tracking-tight">T${netWorth.toFixed(0)}</p>
              </div>
            </div>
          </div>

          <div className="text-center mb-6">
             <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 italic">Meu Elenco Oficial</h2>
          </div>

          {/* ── Athletes ── */}
          <div className="space-y-3 flex-1 relative z-10">
            {portfolio.map((p, i) => {
              const ath = p.athlete as any
              // Add a cache bust query param to the photo URL to help with CORS issues
              const photoUrl = ath?.photo_url ? `${ath.photo_url}${ath.photo_url.includes('?') ? '&' : '?'}t=${Date.now()}` : null

              return (
                <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
                  <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-[var(--color-orange)]/40 p-0.5 bg-[#050414]">
                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[var(--color-orange)]/20 to-[var(--color-purple)]/20">
                      {photoUrl ? (
                        <img 
                          src={photoUrl} 
                          alt={ath.name} 
                          className="w-full h-full object-cover" 
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="text-xl font-black text-white/80">
                          {ath?.name?.split(' ').slice(0,2).map((w: string) => w[0]).join('').toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-black truncate leading-none mb-2 tracking-tight">{ath.name.toUpperCase()}</p>
                    <div className="flex gap-2">
                      <div className="bg-white/5 px-2 py-0.5 rounded text-[10px] font-bold text-white/40 border border-white/5 uppercase">PTO #{ath.pto_rank || '—'}</div>
                      <div className="bg-white/5 px-2 py-0.5 rounded text-[10px] font-bold text-white/40 border border-white/5 uppercase">WTCS #{ath.wtcs_rank || '—'}</div>
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

          {/* ── Footer ── */}
          <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center relative z-10">
            <div>
              <p className="text-[10px] font-medium text-white/40 mb-1">Crie seu elenco em</p>
              <p className="text-xl font-black tracking-tighter text-white">www.trixer.app</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)] rounded-2xl flex items-center justify-center shadow-xl rotate-6">
               <span className="text-white font-black text-lg -rotate-6">TRX</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
