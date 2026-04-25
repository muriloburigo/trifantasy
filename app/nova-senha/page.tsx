'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '~/lib/supabase/client'
import { useTranslations } from 'next-intl'
import { Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react'

function isStrongPassword(p: string) {
  return p.length >= 8 && /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)
}

export default function NovaSenhaPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase sends tokens in the URL hash — exchange them for a session
    const supabase = createClient()
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    // Also handle the hash directly
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      setReady(true)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError(t('passwordMinLength')); return }
    if (!isStrongPassword(password)) { setError(t('passwordWeak')); return }
    if (password !== confirm) { setError(t('passwordMismatch')); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/'), 2000)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-[var(--color-success)]" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{t('passwordUpdated')}</h1>
          <p className="text-[var(--color-muted)] text-sm">Redirecionando...</p>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <Loader2 size={32} className="animate-spin text-[var(--color-muted)] mx-auto mb-4" />
          <p className="text-[var(--color-muted)] text-sm">Verificando link...</p>
          <p className="text-xs text-[var(--color-muted)] mt-4">
            Se esta página não carregar, o link pode ter expirado.{' '}
            <Link href="/esqueci-senha" className="text-[var(--color-orange)] hover:underline">
              Solicitar novo link
            </Link>
          </p>
        </div>
      </div>
    )
  }

  const passwordsMatch = confirm.length > 0 && password === confirm

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold" style={{ fontFamily: 'var(--font-sora)' }}>
            <span className="text-[var(--color-orange)]">TRIX</span><span className="text-white">ER</span>
          </Link>
          <p className="text-[var(--color-muted)] mt-2 text-sm">{t('newPasswordLabel')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[var(--color-navy-card)] rounded-2xl p-6 space-y-4 border border-[var(--color-navy-border)]">
          {error && (
            <p className="text-[var(--color-danger)] text-sm text-center bg-red-950/30 rounded-lg p-3">{error}</p>
          )}

          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-1">{t('newPasswordLabel')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} required minLength={8}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres + número/símbolo"
                className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:border-[var(--color-orange)]"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-white">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-1">{t('confirmNewPassword')}</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'} required minLength={8}
                value={confirm} onChange={e => setConfirm(e.target.value)}
                placeholder={t('confirmPasswordPlaceholder')}
                className={`w-full bg-[var(--color-navy-elevated)] border rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none transition-colors ${
                  confirm.length > 0
                    ? passwordsMatch ? 'border-green-600' : 'border-red-700'
                    : 'border-[var(--color-navy-border)] focus:border-[var(--color-orange)]'
                }`}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-white">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirm.length > 0 && !passwordsMatch && (
              <p className="text-[11px] text-[var(--color-danger)] mt-1">{t('passwordMismatch')}</p>
            )}
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
            {loading ? t('loggingIn') : t('updatePasswordButton')}
          </button>
        </form>
      </div>
    </div>
  )
}
