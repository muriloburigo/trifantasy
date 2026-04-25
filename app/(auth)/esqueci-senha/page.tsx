'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '~/lib/supabase/client'
import { useTranslations } from 'next-intl'
import { Mail, Loader2, CheckCircle2 } from 'lucide-react'

export default function EsqueciSenhaPage() {
  const t = useTranslations('auth')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/nova-senha`,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-[var(--color-success)]" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t('checkEmailReset')}</h1>
          <p className="text-[var(--color-muted)] text-sm mb-8 leading-relaxed">
            {t('resetPasswordDesc')} <strong>{email}</strong>
          </p>
          <Link href="/login" className="text-[var(--color-orange)] font-semibold hover:underline">
            {t('signIn')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold" style={{ fontFamily: 'var(--font-sora)' }}>
            <span className="text-[var(--color-orange)]">TRIX</span><span className="text-white">ER</span>
          </Link>
          <p className="text-[var(--color-muted)] mt-2 text-sm">{t('resetPasswordTitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--color-navy-card)] rounded-2xl p-6 space-y-4 border border-[var(--color-navy-border)]">
          {error && (
            <p className="text-[var(--color-danger)] text-sm text-center bg-red-950/30 rounded-lg p-3">{error}</p>
          )}
          <p className="text-sm text-[var(--color-muted)]">{t('resetPasswordDesc')}</p>
          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-1">{t('emailLabel')}</label>
            <input
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
            {loading ? t('loggingIn') : t('sendResetLink')}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--color-muted)] mt-4">
          <Link href="/login" className="text-[var(--color-orange)] hover:underline">{t('signIn')}</Link>
        </p>
      </div>
    </div>
  )
}
