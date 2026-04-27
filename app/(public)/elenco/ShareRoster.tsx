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
      // 1. Give time for rendering and potential image loads
      await new Promise(resolve => setTimeout(resolve, 600))

      // 2. Generate PNG with robust settings
      const dataUrl = await toPng(rosterRef.current, {
        cacheBust: true,
        backgroundColor: '#050414',
        pixelRatio: 2,
        // If an image fails to load (CORS), it won't crash the whole process
        skipFonts: false,
      })

      // 3. Trigger Download
      const link = document.createElement('a')
      link.download = `trixer-roster-${userName.toLowerCase()}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (err) {
      console.error('Share generation error:', err)
      alert('Houve um problema ao gerar a imagem. Tente recarregar a página ou usar outro navegador.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleShare}
        disabled={loading || portfolio.length === 0}
        className="flex items-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white text-[10px] sm:text-xs font-black px-3 sm:px-4 py-2 rounded-lg transition-all active:scale-95 disabled:opacity-30 shadow-lg shadow-[var(--color-orange)]/20"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
        {t('shareRoster') || 'Compartilhar'}
      </button>

      {/* ── Story Card (1080x1920) ── */}
      {/* Positioned far away but still rendered with opacity 0 to ensure browser processes it */}
      <div style={{ position: 'absolute', top: '-10000px', left: '0', pointerEvents: 'none', zIndex: -100 }}>
        <div 
          ref={rosterRef}
          className="w-[1080px] h-[1920px] bg-[#050414] flex flex-col justify-center px-20 py-[350px] font-sans text-white relative overflow-hidden"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 20% 10%, rgba(255, 92, 0, 0.15), transparent), radial-gradient(circle at 80% 90%, rgba(107, 33, 168, 0.15), transparent)'
          }}
        >
          {/* Logo Branding */}
          <div className="absolute top-[12%] left-1/2 -translate-x-1/2 opacity-[0.04] pointer-events-none w-full text-center">
            <span className="text-[280px] font-black tracking-tighter">TRIXER</span>
          </div>

          {/* ── Header ── */}
          <div className="mb-28 relative z-10">
            <div className="flex justify-between items-end border-b-8 border-[var(--color-orange)] pb-12">
              <div>
                <div className="flex items-center gap-6 mb-5">
                  <span className="text-[var(--color-orange)] font-black text-[100px] tracking-tighter leading-none">TRIXER</span>
                  <div className="flex flex-col mt-4">
                    <span className="text-white/40 text-2xl font-bold uppercase tracking-[0.4em] leading-none">The Triathlon</span>
                    <span className="text-white/40 text-2xl font-bold uppercase tracking-[0.4em] leading-none mt-2">Game</span>
                  </div>
                </div>
                <p className="text-5xl text-white/60">Trixer: <span className="text-white font-black">{userName}</span></p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold uppercase text-white/40 mb-4 tracking-[0.2em]">Patrimônio</p>
                <p className="text-[130px] font-black text-[var(--color-orange)] tracking-tight leading-none">T${netWorth.toFixed(0)}</p>
              </div>
            </div>
          </div>

          {/* ── Content (Concentrado) ── */}
          <div className="space-y-12 flex-1 relative z-10">
            <div className="text-center mb-16">
               <h2 className="text-4xl font-black uppercase tracking-[0.6em] text-white/10 italic">Meu Elenco Oficial</h2>
            </div>

            {portfolio.map((p, i) => {
              const ath = p.athlete as any
              return (
                <div key={i} className="bg-white/[0.04] border-4 border-white/5 rounded-[70px] p-16 flex items-center gap-16 shadow-2xl">
                  <div className="w-52 h-52 rounded-full overflow-hidden shrink-0 border-[8px] border-[var(--color-orange)]/40 p-2 bg-[#050414]">
                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[var(--color-orange)]/20 to-[var(--color-purple)]/20">
                      {ath?.photo_url ? (
                        <img 
                          src={ath.photo_url} 
                          alt={ath.name} 
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="text-7xl font-black text-white/80">
                          {ath?.name?.split(' ').slice(0,2).map((w: string) => w[0]).join('').toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-7xl font-black truncate leading-tight mb-8 tracking-tighter">{ath.name.toUpperCase()}</p>
                    <div className="flex gap-10">
                      <div className="bg-white/10 px-10 py-4 rounded-full text-4xl font-bold text-white/60 border-2 border-white/10">PTO #{ath.pto_rank || '—'}</div>
                      <div className="bg-white/10 px-10 py-4 rounded-full text-4xl font-bold text-white/60 border-2 border-white/10">WTCS #{ath.wtcs_rank || '—'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[90px] font-black text-white tracking-tight">T${Number(ath.current_price).toFixed(0)}</p>
                    <p className="text-3xl font-bold text-white/20 uppercase tracking-widest mt-4">Preço</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Footer ── */}
          <div className="mt-28 pt-20 border-t-4 border-white/10 flex justify-between items-center relative z-10">
            <div>
              <p className="text-4xl font-medium text-white/40 mb-4">Crie seu elenco em</p>
              <p className="text-[80px] font-black tracking-tighter text-white">www.trixer.app</p>
            </div>
            <div className="w-52 h-52 bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)] rounded-[60px] flex items-center justify-center shadow-2xl rotate-6">
               <span className="text-white font-black text-7xl -rotate-6">TRX</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
