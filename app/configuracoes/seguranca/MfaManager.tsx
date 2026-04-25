'use client'
import { useState, useEffect } from 'react'
import { createClient } from '~/lib/supabase/client'
import { ShieldCheck, ShieldOff, Loader2, CheckCircle2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'

type Factor = { id: string; status: string; factor_type: string }

export default function MfaManager() {
  const t = useTranslations('auth')
  const [factors, setFactors] = useState<Factor[]>([])
  const [loading, setLoading] = useState(true)

  // Enrollment flow
  const [enrolling, setEnrolling] = useState(false)
  const [qrCode, setQrCode] = useState('')
  const [factorId, setFactorId] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [enrollLoading, setEnrollLoading] = useState(false)
  const [enrollSuccess, setEnrollSuccess] = useState(false)
  const [enrollError, setEnrollError] = useState('')

  // Disable flow
  const [disabling, setDisabling] = useState(false)
  const [disableCode, setDisableCode] = useState('')
  const [disableLoading, setDisableLoading] = useState(false)
  const [disableError, setDisableError] = useState('')

  async function loadFactors() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.auth.mfa.listFactors()
    setFactors((data?.totp ?? []) as Factor[])
    setLoading(false)
  }

  useEffect(() => { loadFactors() }, [])

  async function startEnroll() {
    setEnrollError('')
    setEnrolling(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'Trixer', friendlyName: 'Authenticator' })
    if (error || !data) {
      setEnrollError(error?.message ?? 'Erro ao iniciar 2FA')
      setEnrolling(false)
      return
    }
    setQrCode(data.totp.qr_code)
    setFactorId(data.id)
  }

  async function confirmEnroll(e: React.FormEvent) {
    e.preventDefault()
    setEnrollLoading(true)
    setEnrollError('')
    const supabase = createClient()
    const { data: challenge } = await supabase.auth.mfa.challenge({ factorId })
    if (!challenge) { setEnrollError(t('mfaError')); setEnrollLoading(false); return }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: totpCode })
    if (error) {
      setEnrollError(t('mfaError'))
      setEnrollLoading(false)
    } else {
      setEnrollSuccess(true)
      setEnrolling(false)
      setQrCode('')
      await loadFactors()
    }
  }

  async function confirmDisable(e: React.FormEvent) {
    e.preventDefault()
    setDisableLoading(true)
    setDisableError('')
    const supabase = createClient()
    const factor = factors[0]
    if (!factor) return
    const { data: challenge } = await supabase.auth.mfa.challenge({ factorId: factor.id })
    if (!challenge) { setDisableError(t('mfaError')); setDisableLoading(false); return }
    const { error: verifyErr } = await supabase.auth.mfa.verify({ factorId: factor.id, challengeId: challenge.id, code: disableCode })
    if (verifyErr) { setDisableError(t('mfaError')); setDisableLoading(false); return }
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
    if (error) {
      setDisableError(error.message)
      setDisableLoading(false)
    } else {
      setDisabling(false)
      setDisableCode('')
      await loadFactors()
    }
  }

  const activeFactor = factors.find(f => f.status === 'verified')

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 size={24} className="animate-spin text-[var(--color-muted)]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${
        activeFactor
          ? 'bg-green-900/20 border-green-800/30'
          : 'bg-[var(--color-navy-elevated)] border-[var(--color-navy-border)]'
      }`}>
        {activeFactor
          ? <ShieldCheck size={20} className="text-green-400 shrink-0" />
          : <ShieldOff size={20} className="text-[var(--color-muted)] shrink-0" />
        }
        <div>
          <p className="font-semibold text-sm">
            {activeFactor ? t('mfaEnabled') : t('mfaNotEnabled')}
          </p>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">{t('mfaEnrollDesc')}</p>
        </div>
      </div>

      {enrollSuccess && (
        <div className="flex items-center gap-2 text-green-400 text-sm bg-green-900/20 border border-green-800/30 rounded-xl p-3">
          <CheckCircle2 size={16} />
          {t('mfaEnrollSuccess')}
        </div>
      )}

      {/* Enroll flow */}
      {!activeFactor && !enrolling && (
        <button
          onClick={startEnroll}
          className="flex items-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          <ShieldCheck size={15} />
          {t('mfaEnrollConfirm')}
        </button>
      )}

      {enrolling && qrCode && (
        <div className="bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-xl p-5 space-y-5">
          <div>
            <p className="font-semibold text-sm mb-3">1. {t('mfaEnrollStep1')}</p>
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="QR Code 2FA" width={180} height={180} className="rounded-lg bg-white p-2" />
            </div>
          </div>
          <form onSubmit={confirmEnroll} className="space-y-3">
            <p className="font-semibold text-sm">2. {t('mfaEnrollStep2')}</p>
            {enrollError && (
              <p className="text-[var(--color-danger)] text-xs bg-red-950/20 border border-red-900/30 rounded-lg p-2">{enrollError}</p>
            )}
            <input
              type="text" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
              value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:border-[var(--color-orange)]"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit" disabled={enrollLoading || totpCode.length !== 6}
                className="flex items-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
              >
                {enrollLoading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                {enrollLoading ? t('mfaEnrollConfirming') : t('mfaEnrollConfirm')}
              </button>
              <button
                type="button" onClick={() => { setEnrolling(false); setQrCode('') }}
                className="px-4 py-2 rounded-lg text-sm text-[var(--color-muted)] hover:text-white border border-[var(--color-navy-border)] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Disable flow */}
      {activeFactor && !disabling && (
        <button
          onClick={() => setDisabling(true)}
          className="flex items-center gap-2 border border-red-800/40 text-red-400 hover:bg-red-950/20 font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          <ShieldOff size={15} />
          {t('mfaDisable')}
        </button>
      )}

      {activeFactor && disabling && (
        <div className="bg-[var(--color-navy-elevated)] border border-red-900/30 rounded-xl p-5 space-y-3">
          <p className="text-sm text-[var(--color-danger)] font-semibold">{t('mfaDisableConfirm')}</p>
          <form onSubmit={confirmDisable} className="space-y-3">
            {disableError && (
              <p className="text-[var(--color-danger)] text-xs bg-red-950/20 border border-red-900/30 rounded-lg p-2">{disableError}</p>
            )}
            <input
              type="text" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
              value={disableCode} onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))}
              placeholder="Código TOTP para confirmar"
              className="w-full bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm text-center tracking-[0.5em] font-mono focus:outline-none focus:border-[var(--color-orange)]"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit" disabled={disableLoading || disableCode.length !== 6}
                className="flex items-center gap-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
              >
                {disableLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                {disableLoading ? t('mfaDisabling') : t('mfaDisable')}
              </button>
              <button
                type="button" onClick={() => { setDisabling(false); setDisableCode('') }}
                className="px-4 py-2 rounded-lg text-sm text-[var(--color-muted)] hover:text-white border border-[var(--color-navy-border)] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
