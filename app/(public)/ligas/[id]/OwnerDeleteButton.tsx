'use client'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteLeagueAsOwner } from '../actions'

export default function OwnerDeleteButton({ leagueId, leagueName }: { leagueId: string; leagueName: string }) {
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(`Excluir a liga "${leagueName}"?\n\nEsta ação não pode ser desfeita.`)) return
    setLoading(true)
    try {
      await deleteLeagueAsOwner(leagueId)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 border border-red-500/30 text-red-400 hover:text-red-300 hover:border-red-400/50 rounded-lg text-xs font-medium disabled:opacity-40 transition-colors"
    >
      <Trash2 size={12} />
      {loading ? 'Excluindo...' : 'Excluir Liga'}
    </button>
  )
}
