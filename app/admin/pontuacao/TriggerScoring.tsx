'use client'
import { useState, useTransition } from 'react'
import { calculateScores } from './actions'
import { Zap, CheckCircle, AlertCircle } from 'lucide-react'

export default function TriggerScoring({ raceId }: { raceId: string }) {
  const [result, setResult] = useState<{ teamsScored?: number; error?: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handle() {
    setResult(null)
    startTransition(async () => {
      const res = await calculateScores(raceId)
      setResult(res)
    })
  }

  return (
    <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-5">
      <h2 className="font-bold mb-2">Calcular Pontuação</h2>
      <p className="text-xs text-[var(--color-muted)] mb-4">
        Processa todos os resultados importados e calcula os pontos para cada time.
        A prova será marcada como &quot;Finalizada&quot; automaticamente.
      </p>

      <button
        onClick={handle}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
      >
        <Zap size={14} />
        {isPending ? 'Calculando...' : 'Calcular Agora'}
      </button>

      {result && (
        <div className="mt-4">
          {result.error ? (
            <div className="flex items-start gap-2 text-sm text-[var(--color-danger)] bg-red-950/30 rounded-lg p-3">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              {result.error}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-[var(--color-success)] bg-green-950/30 rounded-lg p-3">
              <CheckCircle size={14} />
              {result.teamsScored} times pontuados com sucesso!
            </div>
          )}
        </div>
      )}
    </div>
  )
}
