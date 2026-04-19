import { Lock, Unlock } from 'lucide-react'
import { formatHoursUntil } from '~/lib/market'

export default function MarketBanner({
  locked, reason, lockRace,
}: {
  locked: boolean
  reason?: string
  lockRace?: { name: string; date: string }
}) {
  if (!locked) {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--color-success)] bg-green-950/20 border border-green-900/40 rounded-lg px-3 py-2 mb-6">
        <Unlock size={12} />
        <span>Mercado aberto — você pode comprar e vender atletas livremente.</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-950/20 border border-yellow-900/40 rounded-lg px-3 py-2 mb-6">
      <Lock size={12} className="shrink-0" />
      <span>
        <strong>Mercado fechado.</strong>{' '}
        {reason}
        {lockRace && (
          <span className="text-[var(--color-muted)] ml-1">
            — reabre após o resultado da prova ser publicado.
          </span>
        )}
      </span>
    </div>
  )
}
