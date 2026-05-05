import { requireAdmin } from '~/lib/auth/require-admin'
import { createAdminClient } from '~/lib/supabase/server'
import Link from 'next/link'
import { createLeague } from '../actions'

export default async function CriarLigaAdminPage() {
  await requireAdmin()
  const sb = createAdminClient()
  const { data: users } = await sb.from('profiles').select('id, name').order('name')

  return (
    <div className="space-y-5 text-white px-4 sm:px-0 py-2 max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <Link href="/admin/ligas" className="hover:text-white transition-colors">← Ligas</Link>
        <span>/</span>
        <span className="text-white font-medium">Nova Liga</span>
      </div>

      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5">
        <h1 className="text-sm font-bold mb-5">Criar Liga</h1>
        <form action={createLeague} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">Nome</label>
              <input
                name="name"
                required
                placeholder="Nome da liga"
                className="w-full px-3 py-2 bg-white/5 border border-[var(--color-navy-border)] rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-orange)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">Código de Convite</label>
              <input
                name="invite_code"
                required
                placeholder="Ex: ABCD12"
                maxLength={10}
                className="w-full px-3 py-2 bg-white/5 border border-[var(--color-navy-border)] rounded-lg text-sm text-white font-mono uppercase focus:outline-none focus:ring-1 focus:ring-[var(--color-orange)]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">Dono</label>
            <select
              name="owner_id"
              required
              className="w-full px-3 py-2 bg-white/5 border border-[var(--color-navy-border)] rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--color-orange)]"
            >
              <option value="" className="text-black">Selecionar usuário...</option>
              {users?.map((u) => (
                <option key={u.id} value={u.id} className="text-black">{u.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_public" className="w-4 h-4 rounded" />
              <span className="text-sm text-[var(--color-muted)]">Pública</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="is_global" className="w-4 h-4 rounded" />
              <span className="text-sm text-[var(--color-muted)]">Global</span>
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--color-orange)] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Criar Liga
            </button>
            <Link
              href="/admin/ligas"
              className="px-4 py-2 border border-[var(--color-navy-border)] text-[var(--color-muted)] rounded-lg text-sm font-medium hover:bg-white/5 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
