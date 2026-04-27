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
  const [base64Photos, setBase64Photos] = useState<Record<string, string>>({})
  const rosterRef = useRef<HTMLDivElement>(null)

  // Pre-load images as Base64 to bypass CORS during export
  useEffect(() => {
    const loadAsBase64 = async () => {
      const photos: Record<string, string> = {}
      for (const p of portfolio) {
        const url = p.athlete?.photo_url
        if (url && !photos[url]) {
          try {
            const res = await fetch(url)
            const blob = await res.blob()
            const reader = new FileReader()
            reader.onloadend = () => {
              setBase64Photos(prev => ({ ...prev, [url]: reader.result as string }))
            }
            reader.readAsDataURL(blob)
          } catch (e) {
            console.warn('[Share] Base64 load failed for:', url)
          }
        }
      }
    }
    if (portfolio.length > 0) loadAsBase64()
  }, [portfolio])

  const handleShare = async () => {
    if (!rosterRef.current) return
    setLoading(true)

    try {
      // Small delay to ensure any rendering updates are finished
      await new Promise(resolve => setTimeout(resolve, 500))

      const dataUrl = await toPng(rosterRef.current, {
        cacheBust: true,
        backgroundColor: '#050414',
        pixelRatio: 2, 
        skipFonts: false,
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
        className="flex items-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white text-[10px] sm:text-xs font-black px-3 sm:px-4 py-2 rounded-lg transition-all active:scale-95 disabled:opacity-30 shadow-lg shadow-[var(--color-orange)]/20"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
        {t('shareRoster') || 'Compartilhar'}
      </button>

      {/* ── Export Card (9:16 Story Format) ── */}
      <div style={{ position: 'fixed', left: '-9999px', top: '0', pointerEvents: 'none', visibility: 'visible' }}>
        <div 
          ref={rosterRef}
          className="w-[450px] h-[800px] bg-[#050414] flex flex-col px-10 py-20 font-sans text-white relative overflow-hidden"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 20% 10%, rgba(255, 92, 0, 0.15), transparent), radial-gradient(circle at 80% 90%, rgba(107, 33, 168, 0.12), transparent)',
          }}
        >
          {/* Logo Branding */}
          <div className="absolute top-[15%] left-1/2 -translate-x-1/2 opacity-[0.03] pointer-events-none w-full text-center">
            <span className="text-[140px] font-black tracking-tighter leading-none">TRIXER</span>
          </div>

          {/* ── Header Area ── */}
          <div className="mb-10 relative z-10">
            <div className="flex justify-between items-center border-b-2 border-[var(--color-orange)] pb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-[var(--color-orange)] font-black text-3xl tracking-tighter leading-none">TRIXER</span>
                  <div className="flex flex-col mt-0.5">
                    <span className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] leading-none">The Triathlon</span>
                    <span className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em] leading-none mt-0.5">Game</span>
                  </div>
                </div>
                <p className="text-[11px] text-white/60 font-bold uppercase tracking-wider">Trixer: <span className="text-white">{userName}</span></p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase text-white/40 mb-1 tracking-widest leading-none">Patrimônio</p>
                <p className="text-4xl font-black text-[var(--color-orange)] tracking-tight leading-none">T${netWorth.toFixed(0)}</p>
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
             <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Meu Elenco Oficial</h2>
          </div>

          {/* ── Athletes List ── */}
          <div className="space-y-3.5 flex-1 relative z-10">
            {portfolio.map((p, i) => {
              const ath = p.athlete as any
              const photoData = base64Photos[ath?.photo_url]

              return (
                <div key={i} className="bg-white/[0.04] border border-white/5 rounded-[24px] p-4 flex items-center gap-4 shadow-2xl">
                  <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-[var(--color-orange)]/40 p-0.5 bg-[#050414]">
                    <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[var(--color-orange)]/20 to-[var(--color-purple)]/20">
                      {photoData ? (
                        <img 
                          src={photoData} 
                          alt={ath.name} 
                          className="w-full h-full object-cover"
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
                      <div className="bg-white/10 px-2 py-0.5 rounded-full text-[9px] font-bold text-white/60 border border-white/10">PTO #{ath.pto_rank || '—'}</div>
                      <div className="bg-white/10 px-2 py-0.5 rounded-full text-[9px] font-bold text-white/60 border border-white/10">WTCS #{ath.wtcs_rank || '—'}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xl font-black text-white tracking-tight leading-none">T${Number(ath.current_price).toFixed(0)}</p>
                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-1">Preço Atual</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Footer Area ── */}
          <div className="mt-10 pt-10 border-t-2 border-white/10 flex justify-between items-center relative z-10">
            <div>
              <p className="text-[10px] font-medium text-white/40 mb-1">Crie seu elenco em</p>
              <p className="text-xl font-black tracking-tighter text-white">www.trixer.app</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)] rounded-2xl flex items-center justify-center shadow-2xl rotate-6">
               <span className="text-white font-black text-lg -rotate-6">TRX</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
