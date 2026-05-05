'use client'
import { useState } from 'react'
import { updateLeague } from '../../actions'

type League = { id: string; name: string; invite_code: string; is_public: boolean; is_global: boolean }

export function EditLeagueForm({ league }: { league: League }) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true); setSaved(false); setError(null)
    try {
      await updateLeague(league.id, new FormData(e.currentTarget))
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5">
      <h2 className="text-sm font-bold mb-4">Dados da Liga</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">Nome</label>
            <input
              name="name"
              defaultValue={league.name}
              required
              className="w-full px-3 py-2 bg-white/5 border border-[var(--color-navy-border)] rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-orange)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">Código de Convite</label>
            <input
              name="invite_code"
              defaultValue={league.invite_code}
              required
              maxLength={10}
              className="w-full px-3 py-2 bg-white/5 border border-[var(--color-navy-border)] rounded-lg text-sm text-white font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[var(--color-orange)]"
            />
          </div>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="is_public" defaultChecked={league.is_public} className="w-4 h-4 rounded" />
            <span className="text-sm text-[var(--color-muted)]">Pública</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="is_global" defaultChecked={league.is_global} className="w-4 h-4 rounded" />
            <span className="text-sm text-[var(--color-muted)]">Global</span>
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[var(--color-orange)] text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          {saved && <span className="text-xs text-green-400 font-medium">✓ Salvo!</span>}
          {error && <span className="text-xs text-red-400">{error}</span>}
        </div>
      </form>
    </div>
  )
}
