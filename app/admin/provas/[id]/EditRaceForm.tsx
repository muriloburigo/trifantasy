'use client'
import { upsertRace } from '../actions'

export default function EditRaceForm({ race }: { race: any }) {
  return (
    <form action={upsertRace} className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-6 space-y-4">
      <input type="hidden" name="id" value={race.id} />
      <input type="hidden" name="slug" value={race.slug} />

      <div>
        <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">Nome da Prova</label>
        <input
          type="text" name="name" required
          defaultValue={race.name}
          className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-orange)] transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">Data</label>
          <input
            type="date" name="date" required
            defaultValue={race.date}
            className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-orange)] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">Distância</label>
          <select
            name="distance" defaultValue={race.distance}
            className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-orange)] transition-colors"
          >
            <option value="full">Full Ironman</option>
            <option value="70.3">Ironman 70.3</option>
            <option value="T100">T100 Series</option>
            <option value="ows">OWS / Open Water</option>
            <option value="other">Outra</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">Local (Cidade)</label>
          <input
            type="text" name="location" required
            defaultValue={race.location}
            className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-orange)] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">País</label>
          <input
            type="text" name="country" required
            defaultValue={race.country}
            className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-orange)] transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">Código País (ISO)</label>
          <input
            type="text" name="country_code" maxLength={3}
            defaultValue={race.country_code}
            placeholder="Ex: BRA"
            className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-orange)] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1.5">Status</label>
          <select
            name="status" defaultValue={race.status}
            className="w-full bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--color-orange)] transition-colors"
          >
            <option value="upcoming">Em breve</option>
            <option value="open">Aberto (Escalação)</option>
            <option value="locked">Bloqueado (Em prova)</option>
            <option value="finished">Finalizado</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input 
          type="checkbox" name="has_pro_field" id="has_pro_field" 
          defaultChecked={race.has_pro_field}
          className="w-4 h-4 rounded border-[var(--color-navy-border)] bg-[var(--color-navy-elevated)] text-[var(--color-orange)]"
        />
        <label htmlFor="has_pro_field" className="text-sm font-medium text-white">Possui Field PRO</label>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="w-full bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white font-bold rounded-xl py-3 text-sm transition-all"
        >
          Salvar Alterações
        </button>
      </div>
    </form>
  )
}
