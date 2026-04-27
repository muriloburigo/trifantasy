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
      // Small delay to ensure images are loaded and DOM is ready
      await new Promise(resolve => setTimeout(resolve, 500))

      const dataUrl = await toPng(rosterRef.current, {
        cacheBust: true,
        backgroundColor: '#050414',
        pixelRatio: 2, // High quality for 1080px width
      })

      const link = document.createElement('a')
      link.download = `trixer-elenco-${userName.toLowerCase().replace(/\s+/g, '-')}.png`
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (err) {
      console.error('Erro ao gerar imagem:', err)
      alert('Erro ao gerar imagem. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleShare}
        disabled={loading || portfolio.length === 0}
        className="flex items-center gap-2 bg-[var(--color-navy-elevated)] hover:bg-white/10 text-white text-[10px] sm:text-xs font-bold px-3 sm:px-4 py-2 rounded-lg transition-all border border-white/10 active:scale-95 disabled:opacity-30 shadow-lg"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} className="text-[var(--color-orange)]" />}
        {t('shareRoster') || 'Compartilhar'}
      </button>

      {/* ── Hidden Story Card (1080x1920 equivalent) ── */}
      <div style={{ position: 'fixed', left: '-5000px', top: '0', visibility: 'visible' }}>
        <div 
          ref={rosterRef}
          className="w-[1080px] h-[1920px] bg-[#050414] flex flex-col justify-center px-16 py-32 font-sans text-white relative overflow-hidden"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 20% 10%, rgba(255, 92, 0, 0.1), transparent), radial-gradient(circle at 80% 90%, rgba(107, 33, 168, 0.15), transparent)'
          }}
        >
          {/* Background Branding */}
          <div className="absolute top-[5%] left-1/2 -translate-x-1/2 opacity-5 pointer-events-none">
            <span className="text-[200px] font-black tracking-tighter">TRIXER</span>
          </div>

          {/* ── Header Area (Margem de segurança do topo) ── */}
          <div className="mb-20">
            <div className="flex justify-between items-end border-b-4 border-[var(--color-orange)] pb-8">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-[var(--color-orange)] font-black text-6xl tracking-tighter">TRIXER</span>
                  <span className="text-white/40 text-xl font-bold uppercase tracking-[0.4em] mt-2">Fantasy</span>
                </div>
                <p className="text-3xl text-white/60">Trixer: <span className="text-white font-black">{userName}</span></p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold uppercase text-white/40 mb-2 tracking-[0.2em]">Patrimônio Total</p>
                <p className="text-8xl font-black text-[var(--color-orange)] tracking-tight">T${netWorth.toFixed(0)}</p>
              </div>
            </div>
          </div>

          {/* ── Content (Concentrado no meio) ── */}
          <div className="space-y-8 flex-1">
            <div className="text-center mb-12">
               <h2 className="text-2xl font-black uppercase tracking-[0.5em] text-white/20 italic">Meu Elenco Oficial</h2>
            </div>

            {portfolio.map((p, i) => {
              const ath = p.athlete as any
              return (
                <div key={i} className="bg-white/[0.04] border-2 border-white/5 rounded-[40px] p-10 flex items-center gap-10 shadow-2xl">
                  <div className="w-32 h-32 rounded-full overflow-hidden shrink-0 border-4 border-[var(--color-orange)]/40 p-1 bg-[#050414]">
                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[var(--color-orange)]/20 to-[var(--color-purple)]/20">
                      {ath?.photo_url ? (
                        <img 
                          src={ath.photo_url} 
                          alt={ath.name} 
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="text-4xl font-black text-white/80">
                          {ath?.name?.split(' ').slice(0,2).map((w: string) => w[0]).join('').toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-5xl font-black truncate leading-tight mb-4 tracking-tighter">{ath.name.toUpperCase()}</p>
                    <div className="flex gap-6">
                      <div className="bg-white/10 px-4 py-1.5 rounded-full text-lg font-bold text-white/60 border border-white/10">PTO #{ath.pto_rank || '—'}</div>
                      <div className="bg-white/10 px-4 py-1.5 rounded-full text-lg font-bold text-white/60 border border-white/10">WTCS #{ath.wtcs_rank || '—'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-black text-white tracking-tighter">T${Number(ath.current_price).toFixed(0)}</p>
                    <p className="text-base font-bold text-white/20 uppercase tracking-widest mt-2">Market Value</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Footer Area (Margem de segurança da base) ── */}
          <div className="mt-20 pt-12 border-t-2 border-white/10 flex justify-between items-center">
            <div>
              <p className="text-2xl font-medium text-white/40 mb-2">Monte seu time em</p>
              <p className="text-5xl font-black tracking-tighter text-white">www.trixer.app</p>
            </div>
            <div className="w-32 h-32 bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)] rounded-[32px] flex items-center justify-center shadow-2xl rotate-6">
               <span className="text-white font-black text-4xl -rotate-6">TRX</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
