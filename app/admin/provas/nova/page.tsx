import Link from 'next/link'
import { requireAdmin } from '~/lib/auth/require-admin'
import { upsertRace } from '../actions'

export default async function NovaProvaPage() {
  await requireAdmin()

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/provas" className="text-sm text-[var(--color-muted)] hover:text-white transition-colors">← Provas</Link>
      </div>
      <h1 className="text-2xl font-bold mb-6">Nova Prova</h1>

      <form action={upsertRace} className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm text-[var(--color-muted)] mb-1">Nome da prova</label>
            <input name="name" required placeholder="Ironman Brasil"
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]" />
          </div>

          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-1">Data</label>
            <input name="date" type="date" required
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]" />
          </div>

          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-1">Distância</label>
            <select name="distance" required
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]">
              <option value="full">Full (Ironman)</option>
              <option value="70.3">70.3 (Half)</option>
              <option value="T100">T100 Series</option>
              <option value="olympic">Olympic / WTCS</option>
              <option value="ows">OWS / Open Water</option>
              <option value="other">Outra</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-1">Cidade / Local</label>
            <input name="location" required placeholder="Florianópolis"
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]" />
          </div>

          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-1">País</label>
            <input name="country" required placeholder="Brasil"
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]" />
          </div>

          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-1">Código do país (ISO 2)</label>
            <input name="country_code" maxLength={2} placeholder="BR"
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:border-[var(--color-orange)]" />
          </div>

          <div>
            <label className="block text-sm text-[var(--color-muted)] mb-1">Status</label>
            <select name="status" required defaultValue="upcoming"
              className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange)]">
              <option value="upcoming">Em breve</option>
              <option value="open">Aberto</option>
              <option value="locked">Encerrado</option>
              <option value="finished">Finalizado</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" name="has_pro_field" id="pro" className="accent-[var(--color-orange)]" />
          <label htmlFor="pro" className="text-sm">Tem campo PRO</label>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit"
            className="bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white font-semibold rounded-lg px-6 py-2.5 text-sm transition-colors">
            Criar Prova
          </button>
          <Link href="/admin/provas"
            className="bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)] rounded-lg px-6 py-2.5 text-sm transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
