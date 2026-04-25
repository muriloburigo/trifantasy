'use client'
import { useState, useTransition } from 'react'
import { updateAthlete } from './actions'
import { X, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AthleteEditPanel({
  athlete,
  returnUrl,
}: {
  athlete: {
    id: string
    name: string
    gender: string
    type: string
    country: string | null
    country_code: string | null
    pto_rank: number | null
    current_price: number
    price_change: number | null
    photo_url: string | null
  }
  returnUrl: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ error?: string } | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await updateAthlete(athlete.id, fd)
      if (res.error) {
        setResult(res)
      } else {
        router.push(returnUrl)
      }
    })
  }

  return (
    <div className="bg-[var(--color-navy-card)] border border-[var(--color-orange)]/30 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-sm">Editar Atleta</h2>
        <button
          onClick={() => router.push(returnUrl)}
          className="text-[var(--color-muted)] hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-[var(--color-muted)] mb-1 block">Nome</label>
            <input
              name="name"
              defaultValue={athlete.name}
              required
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-muted)] mb-1 block">Gênero</label>
            <select
              name="gender"
              defaultValue={athlete.gender}
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]"
            >
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--color-muted)] mb-1 block">País</label>
            <input
              name="country"
              defaultValue={athlete.country ?? ''}
              placeholder="Brazil"
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-muted)] mb-1 block">Código país (2 letras)</label>
            <input
              name="country_code"
              defaultValue={athlete.country_code ?? ''}
              maxLength={2}
              placeholder="BR"
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:border-[var(--color-orange)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-muted)] mb-1 block">Rank PTO</label>
            <input
              name="pto_rank"
              type="number"
              min={1}
              defaultValue={athlete.pto_rank ?? ''}
              placeholder="ex: 12"
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-muted)] mb-1 block">Preço atual (T$)</label>
            <input
              name="current_price"
              type="number"
              min={1}
              max={35}
              step={0.5}
              defaultValue={athlete.current_price}
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-[var(--color-muted)] mb-1 block">URL da foto</label>
            <input
              name="photo_url"
              type="url"
              defaultValue={athlete.photo_url ?? ''}
              placeholder="https://..."
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]"
            />
          </div>
        </div>

        {result?.error && (
          <p className="text-xs text-[var(--color-danger)] bg-red-950/30 rounded p-2">{result.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors"
        >
          <Save size={14} />
          {isPending ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  )
}
