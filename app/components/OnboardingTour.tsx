'use client'
import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, Wallet, ShoppingBag, Trophy, Play } from 'lucide-react'
import { createClient } from '~/lib/supabase/client'

interface Step {
  title: string
  content: string
  icon: React.ReactNode
}

export default function OnboardingTour({ userName }: { userName: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const hasSeen = localStorage.getItem('trixer_tour_seen')
    if (!hasSeen) {
      setIsOpen(true)
    }
  }, [])

  const steps: Step[] = [
    {
      title: `Bem-vindo, ${userName}!`,
      content: 'O fantasy game definitivo para amantes de Triathlon. Vamos te mostrar como começar sua jornada.',
      icon: <Play className="text-[var(--color-orange)]" size={32} />,
    },
    {
      title: 'Sua Carteira',
      content: 'Você começa com T$100. Use esse saldo para comprar seus primeiros atletas PRO no mercado.',
      icon: <Wallet className="text-yellow-400" size={32} />,
    },
    {
      title: 'Monte seu Elenco',
      content: 'Você deve ter exatamente 5 atletas. Seu elenco atual é seu time para todas as provas.',
      icon: <ShoppingBag className="text-[var(--color-purple)]" size={32} />,
    },
    {
      title: 'Ligas e Ranking',
      content: 'Você já está na Liga Global! Pontue nas provas reais e dispute com outros Trixers.',
      icon: <Trophy className="text-amber-500" size={32} />,
    },
  ]

  async function handleFinish() {
    localStorage.setItem('trixer_tour_seen', 'true')
    setIsOpen(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ has_seen_tour: true }).eq('id', user.id)
    }
  }

  if (!isOpen) return null
  const currentStep = steps[step]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm sm:max-w-md bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-[2rem] sm:rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 relative">
        <div className="flex h-1 w-full bg-[var(--color-navy-elevated)]">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 transition-all duration-500 ${i <= step ? 'bg-gradient-to-r from-[var(--color-orange)] to-[var(--color-purple)]' : ''}`} />
          ))}
        </div>

        <div className="p-6 sm:p-8 text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[var(--color-navy-elevated)] rounded-2xl flex items-center justify-center mx-auto mb-5 sm:mb-6 border border-[var(--color-navy-border)]">
            {currentStep.icon}
          </div>
          <h2 className="text-xl sm:text-2xl font-black mb-3 leading-tight" style={{ fontFamily: 'var(--font-sora)' }}>{currentStep.title}</h2>
          <p className="text-sm sm:text-base text-[var(--color-muted)] leading-relaxed mb-6 sm:mb-8">{currentStep.content}</p>

          <div className="flex items-center justify-between gap-4">
            <button onClick={() => step > 0 && setStep(step - 1)} className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] hover:text-white transition-colors ${step === 0 ? 'invisible' : ''}`}>
              <ChevronLeft size={14} className="inline mr-1" /> Voltar
            </button>
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(step + 1)} className="bg-white text-black px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-[var(--color-orange)] hover:text-white transition-all flex items-center gap-2">
                Próximo <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={handleFinish} className="bg-[var(--color-orange)] text-white px-6 sm:px-8 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-[var(--color-orange-light)] transition-all">
                Começar a Jogar!
              </button>
            )}
          </div>
        </div>

        <button onClick={handleFinish} className="absolute top-4 right-4 sm:top-6 sm:right-6 text-[var(--color-muted)] hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
