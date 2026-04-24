import Link from 'next/link'
import { createAdminClient } from '~/lib/supabase/server'
import { requireAdmin } from '~/lib/auth/require-admin'
import { formatDate } from '~/lib/utils'
import { deleteRace } from './actions'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default async function AdminProvasPage() {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data: races } = await supabase
    .from('races')
    .select('*')
    .order('date', { ascending: true })

  const STATUS_LABEL: Record<string, string> = {
    upcoming: 'Em breve', open: 'Aberto', locked: 'Encerrado', finished: 'Finalizado',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Provas</h1>
        <Link
          href="/admin/provas/nova"
          className="flex items-center gap-2 bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} />
          Nova Prova
        </Link>
      </div>

      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-navy-border)] text-[var(--color-muted)] text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3">Prova</th>
              <th className="text-left px-4 py-3">Local</th>
              <th className="text-left px-4 py-3">Data</th>
              <th className="text-left px-4 py-3">Distância</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-navy-border)]">
            {(races ?? []).map((race: any) => (
              <tr key={race.id} className="hover:bg-[var(--color-navy-elevated)]/30 transition-colors">
                <td className="px-4 py-3 font-medium">{race.name}</td>
                <td className="px-4 py-3 text-[var(--color-muted)]">{race.location}, {race.country}</td>
                <td className="px-4 py-3 text-[var(--color-muted)]">{formatDate(race.date)}</td>
                <td className="px-4 py-3">
                  <span className="text-xs border border-[var(--color-navy-border)] rounded-full px-2 py-0.5">
                    {race.distance === 'full' ? 'Full' : '70.3'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs ${race.status === 'open' ? 'text-[var(--color-success)]' : 'text-[var(--color-muted)]'}`}>
                    {STATUS_LABEL[race.status] ?? race.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link 
                      href={`/admin/provas/${race.id}/startlist`}
                      className="text-[10px] font-bold px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors uppercase tracking-wider"
                    >
                      Field PRO
                    </Link>
                    <Link href={`/admin/provas/${race.id}`} className="p-1.5 hover:text-[var(--color-orange)] transition-colors">
                      <Pencil size={14} />
                    </Link>
                    <form action={deleteRace.bind(null, race.id)}>
                      <button type="submit" className="p-1.5 hover:text-[var(--color-danger)] transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {(!races || races.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-muted)]">
                  Nenhuma prova cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
