'use client'
import { useState, useTransition } from 'react'
import { setMarketOverride } from './actions'

interface Props {
  override: boolean | null
  locked: boolean
  reasonKey?: string
}

export default function MarketOverridePanel({ override, locked, reasonKey }: Props) {
  const [pending, startTransition] = useTransition()
  const [current, setCurrent] = useState<boolean | null>(override)

  function apply(value: boolean | null) {
    startTransition(async () => {
      const res = await setMarketOverride(value)
      if (!res?.error) setCurrent(value)
    })
  }

  const statusLabel = locked
    ? reasonKey === 'admin' ? 'Fechado (admin)' : 'Fechado (automático)'
    : current === true ? 'Aberto (admin)' : 'Aberto (automático)'

  const statusColor = locked ? 'text-red-400' : 'text-green-400'

  return (
    <div className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wide mb-1">
            Status do Mercado
          </h2>
          <p className={`text-xl font-bold ${statusColor}`}>{statusLabel}</p>
          {current === null && (
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              Controlado pelo calendário — fecha 24h antes de cada prova
            </p>
          )}
          {current === true && (
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              Override ativo — mercado aberto independente do calendário
            </p>
          )}
          {current === false && (
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              Override ativo — mercado fechado independente do calendário
            </p>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => apply(true)}
            disabled={pending || current === true}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              current === true
                ? 'bg-green-500/20 text-green-400 border border-green-500/40 cursor-default'
                : 'bg-[var(--color-surface-alt)] hover:bg-green-500/10 hover:text-green-400 border border-[var(--color-border)] text-[var(--color-muted)]'
            } disabled:opacity-50`}
          >
            {current === true ? '✓ Aberto (forçado)' : 'Abrir agora'}
          </button>

          <button
            onClick={() => apply(false)}
            disabled={pending || current === false}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              current === false
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 cursor-default'
                : 'bg-[var(--color-surface-alt)] hover:bg-red-500/10 hover:text-red-400 border border-[var(--color-border)] text-[var(--color-muted)]'
            } disabled:opacity-50`}
          >
            {current === false ? '✓ Fechado (forçado)' : 'Fechar agora'}
          </button>

          <button
            onClick={() => apply(null)}
            disabled={pending || current === null}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              current === null
                ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/40 cursor-default'
                : 'bg-[var(--color-surface-alt)] hover:bg-[var(--color-primary)]/10 hover:text-[var(--color-primary)] border border-[var(--color-border)] text-[var(--color-muted)]'
            } disabled:opacity-50`}
          >
            {current === null ? '✓ Automático' : 'Automático'}
          </button>
        </div>
      </div>
    </div>
  )
}
