'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addMember, removeMember } from '../actions'

type Profile = { id: string; name: string; photo_url: string | null }
type Member = { user_id: string; joined_at: string; profile: Profile | null }

export function MembersManager({
  leagueId,
  members,
  nonMembers,
}: {
  leagueId: string
  members: Member[]
  nonMembers: Profile[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleAdd() {
    if (!selected) return
    setError(null)
    startTransition(async () => {
      try {
        await addMember(leagueId, selected)
        setSelected('')
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao adicionar')
      }
    })
  }

  function handleRemove(userId: string, name: string) {
    if (!confirm(`Remover ${name} da liga?`)) return
    startTransition(async () => {
      await removeMember(leagueId, userId)
      router.refresh()
    })
  }

  return (
    <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold">
          Membros <span className="text-[var(--color-muted)] font-normal">({members.length})</span>
        </h2>
        {nonMembers.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={isPending}
              className="px-3 py-1.5 bg-white/5 border border-[var(--color-navy-border)] rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-orange)] disabled:opacity-50"
            >
              <option value="" className="text-black">Adicionar usuário...</option>
              {nonMembers.map((u) => (
                <option key={u.id} value={u.id} className="text-black">{u.name}</option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={!selected || isPending}
              className="px-3 py-1.5 bg-[var(--color-orange)] text-white rounded-lg text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              Adicionar
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

      <div className="space-y-0.5">
        {members.map((m) => (
          <div
            key={m.user_id}
            className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-white/5 group transition-colors"
          >
            <div className="flex items-center gap-3">
              {m.profile?.photo_url ? (
                <img src={m.profile.photo_url} alt={m.profile.name} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">
                  {m.profile?.name?.charAt(0).toUpperCase() ?? '?'}
                </div>
              )}
              <div>
                <p className="text-xs font-medium">{m.profile?.name ?? 'Usuário'}</p>
                <p className="text-[10px] text-[var(--color-muted)]">
                  desde {new Date(m.joined_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleRemove(m.user_id, m.profile?.name ?? 'usuário')}
              disabled={isPending}
              className="text-[10px] text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30 font-medium"
            >
              Remover
            </button>
          </div>
        ))}
        {!members.length && (
          <p className="text-xs text-[var(--color-muted)] py-4 text-center">Nenhum membro</p>
        )}
      </div>
    </div>
  )
}
