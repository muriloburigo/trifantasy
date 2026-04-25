'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '~/lib/supabase/client'
import { useTranslations } from 'next-intl'
import LocaleSwitcher from '~/app/components/LocaleSwitcher'
import { ShieldCheck } from 'lucide-react'

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const turnstileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !turnstileRef.current) return
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.onload = () => {
      ;(window as any).turnstile?.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => setCaptchaToken(token),
        'expired-callback': () => setCaptchaToken(''),
        'error-callback': () => setCaptchaToken(''),
      })
    }
    document.head.appendChild(script)
    return () => { document.head.removeChild(script) }
  }, [])

  // MFA challenge state
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [mfaLoading, setMfaLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (TURNSTILE_SITE_KEY && !captchaToken) { setError(t('captchaRequired')); return }
    setLoading(true)
    setError('')

    if (TURNSTILE_SITE_KEY && captchaToken) {
      const v = await fetch('/api/auth/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captchaToken }),
      })
      const vd = await v.json()
      if (!vd.success) { setError(t('captchaRequired')); setLoading(false); return }
    }

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(t('loginError'))
      setLoading(false)
      return
    }

    // Check if MFA is required
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aal?.nextLevel === 'aal2' && aal.nextLevel !== aal.currentLevel) {
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totp = factors?.totp?.[0]
      if (totp) {
        setMfaFactorId(totp.id)
        setMfaRequired(true)
        setLoading(false)
        return
      }
    }

    router.push('/')
    router.refresh()
  }

  async function handleMfa(e: React.FormEvent) {
    e.preventDefault()
    setMfaLoading(true)
    setError('')
    const supabase = createClient()
    const { data: challenge } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId })
    if (!challenge) { setError(t('mfaError')); setMfaLoading(false); return }
    const { error } = await supabase.auth.mfa.verify({
      factorId: mfaFactorId,
      challengeId: challenge.id,
      code: totpCode,
    })
    if (error) {
      setError(t('mfaError'))
      setMfaLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  if (mfaRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[var(--color-orange)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} className="text-[var(--color-orange)]" />
            </div>
            <h1 className="text-xl font-bold">{t('mfaTitle')}</h1>
            <p className="text-[var(--color-muted)] text-sm mt-1">{t('mfaDesc')}</p>
          </div>

          <form onSubmit={handleMfa} className="bg-[var(--color-navy-card)] rounded-2xl p-6 space-y-4 border border-[var(--color-navy-border)]">
            {error && (
              <p className="text-[var(--color-danger)] text-sm text-center bg-red-950/30 rounded-lg p-3">{error}</p>
            )}
            <div>
              <label className="block text-sm text-[var(--color-muted)] mb-1">{t('mfaCodeLabel')}</label>
              <input
                type="text" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:border-[var(--color-orange)]"
                autoFocus
              />
            </div>
            <button
              type="submit" disabled={mfaLoading || totpCode.length !== 6}
              className="w-full bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
            >
              {mfaLoading ? t('mfaVerifying') : t('mfaVerify')}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <LocaleSwitcher />
      </div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold" style={{ fontFamily: 'var(--font-sora)' }}>
            <span className="text-[var(--color-orange)]">TRIX</span><span className="text-white">ER</span>
          </Link>
          <p className="text-[var(--color-muted)] mt-2 text-sm">{t('loginTitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--color-navy-card)] rounded-2xl p-6 space-y-4 border border-[var(--color-navy-border)]">
          {error && (
            <p className="text-[var(--color-danger)] text-sm text-center bg-red-950/30 rounded-lg p-3">{error}</p>
          )}

          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-1">{t('emailLabel')}</label>
            <input
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm text-[var(--color-muted)]">{t('passwordLabel')}</label>
              <Link href="/esqueci-senha" className="text-xs text-[var(--color-orange)] hover:underline">{t('forgotPassword')}</Link>
            </div>
            <input
              type="password" required
              value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]"
            />
          </div>

          {TURNSTILE_SITE_KEY && (
            <div className="flex justify-center">
              <div ref={turnstileRef} />
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? t('loggingIn') : t('loginButton')}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--color-muted)] mt-4">
          {t('noAccount')}
          <Link href="/register" className="text-[var(--color-orange)] hover:underline">{t('createAccount')}</Link>
        </p>
      </div>
    </div>
  )
}
