'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '~/lib/supabase/client'
import { useTranslations } from 'next-intl'
import { Eye, EyeOff, ShieldCheck, Mail } from 'lucide-react'
import LocaleSwitcher from '~/app/components/LocaleSwitcher'
import { Turnstile } from '@marsidev/react-turnstile'

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

function isStrongPassword(p: string) {
  return p.length >= 8 && /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)
}

function hasFullName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.length >= 2 && parts.every(p => p.length >= 1)
}

export default function RegisterPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hasFullName(name)) { setError(t('nameMinWords')); return }
    if (password.length < 8) { setError(t('passwordMinLength')); return }
    if (!isStrongPassword(password)) { setError(t('passwordWeak')); return }
    if (password !== confirmPassword) { setError(t('passwordMismatch')); return }
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
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { name: name.trim() },
        emailRedirectTo: `${location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail size={40} className="text-[var(--color-success)]" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Verifique seu e-mail</h1>
          <p className="text-[var(--color-muted)] text-sm mb-8 leading-relaxed">
            Enviamos um link de confirmação para <strong>{email}</strong>. Clique no link para ativar sua conta e começar sua jornada no Trixer.
          </p>
          <Link href="/login" className="text-[var(--color-orange)] font-semibold hover:underline">
            Voltar para o login
          </Link>
        </div>
      </div>
    )
  }

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <LocaleSwitcher />
      </div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)] flex items-center justify-center font-black text-white text-xs group-hover:scale-110 transition-transform">
              T
            </div>
            <span className="text-2xl font-bold tracking-tighter" style={{ fontFamily: 'var(--font-sora)' }}>
              TRIX<span className="text-[var(--color-orange)]">ER</span>
            </span>
          </Link>
          <p className="text-[var(--color-muted)] text-sm">{t('registerTitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--color-navy-card)] rounded-2xl p-6 space-y-4 border border-[var(--color-navy-border)] shadow-xl">
          {error && (
            <p className="text-[var(--color-danger)] text-[11px] font-medium text-center bg-red-950/20 border border-red-900/30 rounded-lg p-3">{error}</p>
          )}

          {/* Full name */}
          <div>
            <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">{t('nameLabel')}</label>
            <input
              type="text" required
              value={name} onChange={e => setName(e.target.value)}
              placeholder={t('namePlaceholder')}
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-orange)] transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">{t('emailLabel')}</label>
            <input
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-orange)] transition-colors"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">{t('passwordLabel')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} required minLength={8}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres + número/símbolo"
                className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-[var(--color-orange)] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-white"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">{t('confirmPasswordLabel')}</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'} required minLength={8}
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPasswordPlaceholder')}
                className={`w-full bg-[var(--color-navy-elevated)] border rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none transition-colors ${
                  confirmPassword.length > 0
                    ? passwordsMatch
                      ? 'border-green-600 focus:border-green-500'
                      : 'border-red-700 focus:border-red-600'
                    : 'border-[var(--color-navy-border)] focus:border-[var(--color-orange)]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-white"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="text-[11px] text-[var(--color-danger)] mt-1">{t('passwordMismatch')}</p>
            )}
          </div>

          {TURNSTILE_SITE_KEY && (
            <div className="flex justify-center">
              <Turnstile
                siteKey={TURNSTILE_SITE_KEY}
                onSuccess={setCaptchaToken}
                onError={() => setCaptchaToken('')}
                onExpire={() => setCaptchaToken('')}
              />
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] disabled:opacity-50 text-white font-bold rounded-xl py-3 text-sm transition-all shadow-lg shadow-[var(--color-orange)]/10"
          >
            {loading ? t('registering') : t('registerButton')}
          </button>

          <div className="flex items-center gap-2 justify-center py-2 opacity-60">
            <ShieldCheck size={14} className="text-[var(--color-success)]" />
            <span className="text-[10px] text-[var(--color-muted)] uppercase font-bold tracking-widest">Conexão segura</span>
          </div>

          <p className="text-[10px] text-[var(--color-muted)] text-center leading-relaxed px-2">
            {t('privacyConsent')}{' '}
            <Link href="/privacidade" className="text-[var(--color-orange)] hover:underline">
              {t('privacyLink')}
            </Link>
            .
          </p>
        </form>

        <p className="text-center text-sm text-[var(--color-muted)] mt-6 font-medium">
          {t('hasAccount')}
          <Link href="/login" className="text-[var(--color-orange)] hover:underline font-bold ml-1">{t('signIn')}</Link>
        </p>
      </div>
    </div>
  )
}
