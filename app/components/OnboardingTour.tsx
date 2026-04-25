'use client'
import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, Wallet, ShoppingBag, Trophy, Play, TrendingUp } from 'lucide-react'
import { createClient } from '~/lib/supabase/client'
import { useTranslations } from 'next-intl'

interface Step {
  title: string
  content: string
  icon: React.ReactNode
}

export default function OnboardingTour({ userName }: { userName: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState(0)
  const supabase = createClient()
  const t = useTranslations('tour')

  useEffect(() => {
    // Show tour if it's the first time
    const hasSeen = localStorage.getItem('trixer_tour_seen')
    if (!hasSeen) {
      setIsOpen(true)
    }
  }, [])

  const steps: Step[] = [
    {
      title: t('step0Title', { name: userName }),
      content: t('step0Content'),
      icon: <Play className="text-[var(--color-orange)]" size={32} />,
    },
    {
      title: t('step1Title'),
      content: t('step1Content'),
      icon: <Wallet className="text-yellow-400" size={32} />,
    },
    {
      title: t('step2Title'),
      content: t('step2Content'),
      icon: <ShoppingBag className="text-[var(--color-purple)]" size={32} />,
    },
    {
      title: t('step3Title'),
      content: t('step3Content'),
      icon: <TrendingUp className="text-green-400" size={32} />,
    },
    {
      title: t('step4Title'),
      content: t('step4Content'),
      icon: <Trophy className="text-amber-500" size={32} />,
    },
  ]

  async function handleFinish() {
    localStorage.setItem('trixer_tour_seen', 'true')
    setIsOpen(false)

    // Update DB flag
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ has_seen_tour: true }).eq('id', user.id)
    }
  }

  if (!isOpen) return null

  const currentStep = steps[step]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Progress bar */}
        <div className="flex h-1.5 w-full bg-[var(--color-navy-elevated)]">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`flex-1 transition-all duration-500 ${i <= step ? 'bg-gradient-to-r from-[var(--color-orange)] to-[var(--color-purple)]' : ''}`}
            />
          ))}
        </div>

        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-[var(--color-navy-elevated)] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-[var(--color-navy-border)]">
            {currentStep.icon}
          </div>

          <h2 className="text-2xl font-black mb-3" style={{ fontFamily: 'var(--font-sora)' }}>
            {currentStep.title}
          </h2>

          <p className="text-[var(--color-muted)] leading-relaxed mb-8">
            {currentStep.content}
          </p>

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => step > 0 && setStep(step - 1)}
              className={`text-xs font-bold uppercase tracking-widest text-[var(--color-muted)] hover:text-white transition-colors ${step === 0 ? 'invisible' : ''}`}
            >
              <ChevronLeft size={16} className="inline mr-1" /> {t('back')}
            </button>

            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-[var(--color-orange)] hover:text-white transition-all flex items-center gap-2"
              >
                {t('next')} <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="bg-[var(--color-orange)] text-white px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-[var(--color-orange-light)] transition-all animate-bounce"
              >
                {t('start')}
              </button>
            )}
          </div>
        </div>

        <button
          onClick={handleFinish}
          className="absolute top-6 right-6 text-[var(--color-muted)] hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  )
}
