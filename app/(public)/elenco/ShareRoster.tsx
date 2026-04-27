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
      // Small delay for rendering
      await new Promise(resolve => setTimeout(resolve, 500))

      const dataUrl = await toPng(rosterRef.current, {
        cacheBust: true,
        backgroundColor: '#050414',
        pixelRatio: 2,
      })

      const link = document.createElement('a')
      link.download = `trixer-roster.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (err) {
      console.error('Share error:', err)
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

      {/* ── Story Card (1080x1920) ── */}
      <div style={{ position: 'fixed', left: '-9999px', top: '0', visibility: 'visible' }}>
        <div 
          ref={rosterRef}
          className="w-[1080px] h-[1920px] bg-[#050414] flex flex-col justify-center px-16 py-64 font-sans text-white relative overflow-hidden"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 20% 10%, rgba(255, 92, 0, 0.1), transparent), radial-gradient(circle at 80% 90%, rgba(107, 33, 168, 0.15), transparent)'
          }}
        >
          {/* Background Branding Large */}
          <div className="absolute top-[10%] left-1/2 -translate-x-1/2 opacity-[0.03] pointer-events-none w-full text-center">
            <span className="text-[250px] font-black tracking-tighter leading-none">TRIXER</span>
          </div>

          {/* ── Header Area ── */}
          <div className="mb-24 relative z-10">
            <div className="flex justify-between items-end border-b-4 border-[var(--color-orange)] pb-10">
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-[var(--color-orange)] font-black text-7xl tracking-tighter">TRIXER</span>
                  <div className="flex flex-col mt-2">
                    <span className="text-white/40 text-xl font-bold uppercase tracking-[0.3em] leading-none">The Triathlon</span>
                    <span className="text-white/40 text-xl font-bold uppercase tracking-[0.3em] leading-none mt-1">Game</span>
                  </div>
                </div>
                <p className="text-4xl text-white/60">Trixer: <span className="text-white font-black">{userName}</span></p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold uppercase text-white/40 mb-2 tracking-[0.2em]">Patrimônio Total</p>
                <p className="text-9xl font-black text-[var(--color-orange)] tracking-tight">T${netWorth.toFixed(0)}</p>
              </div>
            </div>
          </div>

          {/* ── Content ── */}
          <div className="space-y-10 flex-1 relative z-10">
            <div className="text-center mb-16">
               <h2 className="text-3xl font-black uppercase tracking-[0.6em] text-white/20 italic">Meu Elenco Oficial</h2>
            </div>

            {portfolio.map((p, i) => {
              const ath = p.athlete as any
              return (
                <div key={i} className="bg-white/[0.04] border-2 border-white/5 rounded-[50px] p-12 flex items-center gap-12 shadow-2xl">
                  <div className="w-40 h-40 rounded-full overflow-hidden shrink-0 border-4 border-[var(--color-orange)]/40 p-1 bg-[#050414]">
                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[var(--color-orange)]/20 to-[var(--color-purple)]/20">
                      {ath?.photo_url ? (
                        <img 
                          src={ath.photo_url} 
                          alt={ath.name} 
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="text-5xl font-black text-white/80">
                          {ath?.name?.split(' ').slice(0,2).map((w: string) => w[0]).join('').toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-6xl font-black truncate leading-tight mb-5 tracking-tighter">{ath.name.toUpperCase()}</p>
                    <div className="flex gap-8">
                      <div className="bg-white/10 px-6 py-2 rounded-full text-2xl font-bold text-white/60 border border-white/10">PTO #{ath.pto_rank || '—'}</div>
                      <div className="bg-white/10 px-6 py-2 rounded-full text-2xl font-bold text-white/60 border border-white/10">WTCS #{ath.wtcs_rank || '—'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-6xl font-black text-white tracking-tight">T${Number(ath.current_price).toFixed(0)}</p>
                    <p className="text-xl font-bold text-white/20 uppercase tracking-widest mt-2">Valor</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Footer Area ── */}
          <div className="mt-24 pt-14 border-t-2 border-white/10 flex justify-between items-center relative z-10">
            <div>
              <p className="text-3xl font-medium text-white/40 mb-3">Crie seu elenco em</p>
              <p className="text-6xl font-black tracking-tighter text-white">www.trixer.app</p>
            </div>
            <div className="w-40 h-40 bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)] rounded-[45px] flex items-center justify-center shadow-2xl rotate-6">
               <span className="text-white font-black text-5xl -rotate-6">TRX</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
