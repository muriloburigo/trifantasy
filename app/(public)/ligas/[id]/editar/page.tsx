import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createAdminClient } from '~/lib/supabase/server'
import { updateLeagueAsOwner } from '../../actions'

export default async function EditarLigaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: league } = await admin.from('leagues').select('*').eq('id', id).single()

  if (!league) notFound()
  if (league.owner_id !== user.id) redirect(`/ligas/${id}`)

  const action = updateLeagueAsOwner.bind(null, id)

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2 text-sm text-[var(--color-muted)] mb-6">
        <Link href={`/ligas/${id}`} className="hover:text-white transition-colors">
          ← {league.name}
        </Link>
        <span>/</span>
        <span className="text-white font-medium">Editar</span>
      </div>

      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5 text-white">
        <h1 className="text-base font-bold mb-5">Editar Liga</h1>
        <form action={action} className="space-y-4">
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
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_public"
              defaultChecked={league.is_public}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-[var(--color-muted)]">Liga Pública (visível para todos)</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--color-orange)] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Salvar Alterações
            </button>
            <Link
              href={`/ligas/${id}`}
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
