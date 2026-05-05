import { requireAdmin } from '~/lib/auth/require-admin'
import { createAdminClient } from '~/lib/supabase/server'
import Link from 'next/link'
import { Trophy } from 'lucide-react'
import { DeleteButton } from './_components/DeleteButton'

export default async function AdminLigasPage() {
  await requireAdmin()
  const sb = createAdminClient()

  const { data: leagues } = await sb
    .from('leagues')
    .select('*, league_members(count)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 text-white px-4 sm:px-0 py-2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="text-[var(--color-orange)]" />
          Gerenciar Ligas
        </h1>
        <Link
          href="/admin/ligas/criar"
          className="px-4 py-2 bg-[var(--color-orange)] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          + Nova Liga
        </Link>
      </div>

      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-navy-border)]">
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase">Código</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase">Membros</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase">Criada em</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-muted)] uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-navy-border)]">
            {leagues?.map((league) => (
              <tr key={league.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 font-medium">{league.name}</td>
                <td className="px-4 py-3">
                  <code className="bg-white/10 px-2 py-0.5 rounded text-xs font-mono">
                    {league.invite_code}
                  </code>
                </td>
                <td className="px-4 py-3 text-[var(--color-muted)]">
                  {league.league_members?.[0]?.count ?? 0}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {league.is_global && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full font-medium">
                        Global
                      </span>
                    )}
                    {league.is_public ? (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded-full font-medium">
                        Pública
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-white/10 text-[var(--color-muted)] text-xs rounded-full font-medium">
                        Privada
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--color-muted)]">
                  {new Date(league.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-4">
                    <Link
                      href={`/admin/ligas/${league.id}`}
                      className="text-[var(--color-orange)] hover:underline text-xs font-medium"
                    >
                      Editar
                    </Link>
                    <DeleteButton leagueId={league.id} leagueName={league.name} />
                  </div>
                </td>
              </tr>
            ))}
            {!leagues?.length && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--color-muted)] text-sm">
                  Nenhuma liga cadastrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
