'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteLeague } from '../actions'

export function DeleteButton({ leagueId, leagueName }: { leagueId: string; leagueName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(`Excluir a liga "${leagueName}"?\n\nEsta ação não pode ser desfeita.`)) return
    setLoading(true)
    try {
      await deleteLeague(leagueId)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-red-400 hover:text-red-300 text-xs font-medium disabled:opacity-40 transition-colors"
    >
      {loading ? 'Excluindo...' : 'Excluir'}
    </button>
  )
}
