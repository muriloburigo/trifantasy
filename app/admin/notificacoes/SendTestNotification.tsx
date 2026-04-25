'use client'
import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'

export default function SendTestNotification() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; sent: number; results: string[] } | null>(null)
  const [error, setError] = useState('')

  async function trigger() {
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const res = await fetch('/api/admin/notifications/trigger', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro desconhecido')
      setResult(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-5">
      <p className="text-sm text-[var(--color-muted)] mb-4">
        Dispara o cron de notificações agora, sem aguardar o agendamento. Útil para testar se as regras estão funcionando.
      </p>

      <button
        onClick={trigger}
        disabled={loading}
        className="flex items-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        {loading ? 'Executando...' : 'Disparar agora'}
      </button>

      {error && (
        <p className="mt-3 text-xs text-[var(--color-danger)] bg-red-950/20 border border-red-900/30 rounded-lg p-3">{error}</p>
      )}

      {result && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold">
            {result.sent === 0
              ? '✓ Cron executado — nenhuma notificação nova a enviar.'
              : `✓ ${result.sent} notificação${result.sent !== 1 ? 'ões' : ''} enviada${result.sent !== 1 ? 's' : ''}.`}
          </p>
          {result.results.length > 0 && (
            <div className="bg-[var(--color-navy-elevated)] rounded-lg p-3 max-h-48 overflow-y-auto">
              {result.results.map((r, i) => (
                <p key={i} className="text-xs font-mono text-[var(--color-muted)]">{r}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
