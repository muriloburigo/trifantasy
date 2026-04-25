import { createAdminClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/auth/require-admin'
import { Shield, User, Trash2, Mail } from 'lucide-react'
import { revalidatePath } from 'next/cache'

async function toggleAdmin(userId: string, currentStatus: boolean) {
  'use server'
  await requireAdmin()
  const supabase = createAdminClient()
  await supabase.from('profiles').update({ is_admin: !currentStatus }).eq('id', userId)
  revalidatePath('/admin/usuarios')
}

async function deleteUser(userId: string) {
  'use server'
  await requireAdmin()
  const supabase = createAdminClient()
  // No Supabase, deletar do auth.users requer a admin API
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) console.error(error.message)
  revalidatePath('/admin/usuarios')
}

export default async function AdminUsersPage() {
  await requireAdmin()
  const supabase = createAdminClient()

  // Buscamos perfis
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="text-[var(--color-orange)]" />
          Gerenciar Usuários
        </h1>
      </div>

      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm text-[var(--color-muted)]">
          <thead className="bg-[var(--color-navy-elevated)] text-[10px] uppercase font-bold tracking-widest border-b border-[var(--color-navy-border)]">
            <tr>
              <th className="px-6 py-4">Usuário</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Criado em</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-navy-border)]">
            {profiles?.map((u) => (
              <tr key={u.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-black text-white shrink-0 border border-white/5 ${
                      !u.photo_url ? 'bg-gradient-to-br from-[var(--color-orange)] to-[var(--color-purple)]' : ''
                    }`}>
                      {u.photo_url ? (
                        <img src={u.photo_url} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        u.name?.charAt(0).toUpperCase() || '?'
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-white leading-tight">{u.name || 'Sem nome'}</p>
                      <p className="text-[10px] opacity-60">ID: {u.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {u.is_admin ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-900/30 text-[var(--color-orange)] text-[10px] font-bold">
                      <Shield size={10} /> ADMIN
                    </span>
                  ) : (
                    <span className="text-[10px]">Jogador</span>
                  )}
                </td>
                <td className="px-6 py-4 text-[10px]">
                  {new Date(u.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <form action={toggleAdmin.bind(null, u.id, u.is_admin)}>
                      <button className="text-[10px] font-bold px-3 py-1.5 rounded-lg border border-[var(--color-navy-border)] hover:bg-white/10 transition-all">
                        {u.is_admin ? 'Remover Admin' : 'Tornar Admin'}
                      </button>
                    </form>
                    <form action={deleteUser.bind(null, u.id)}>
                      <button className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all" title="Deletar permanentemente">
                        <Trash2 size={14} />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
