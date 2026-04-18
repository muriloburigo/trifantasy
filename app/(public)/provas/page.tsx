import Link from 'next/link'
import { createPublicClient } from '~/lib/supabase/server'
import { formatDate, daysUntil } from '~/lib/utils'
import type { Race } from '~/lib/types'
import { MapPin, Calendar, ChevronRight, Users } from 'lucide-react'
import PublicShell from '../PublicShell'

export const revalidate = 900

const STATUS: Record<string, { label: string; color: string }> = {
  open:     { label: '● Aberto',    color: 'text-[var(--color-success)]' },
  upcoming: { label: 'Em breve',    color: 'text-[var(--color-muted)]' },
  locked:   { label: 'Encerrado',   color: 'text-yellow-400' },
  finished: { label: 'Finalizado',  color: 'text-[var(--color-muted)]' },
}

function RaceCard({ race }: { race: Race }) {
  const days = daysUntil(race.date)
  const st = STATUS[race.status]
  const isOpen = race.status === 'open'

  return (
    <Link
      href={`/provas/${race.slug}`}
      className="group bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] hover:border-[var(--color-orange)]/50 rounded-2xl p-5 flex flex-col gap-3 transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-xs font-semibold text-[var(--color-orange)] uppercase tracking-wider">
            {race.distance === 'full' ? 'Full Triathlon' : 'Middle Distance 70.3'}
          </span>
          <h3 className="font-bold text-base mt-0.5 leading-tight group-hover:text-[var(--color-orange)] transition-colors">
            {race.name}
          </h3>
        </div>
        <span className={`text-xs font-semibold shrink-0 ${st.color}`}>{st.label}</span>
      </div>

      <div className="flex flex-col gap-1.5 text-sm text-[var(--color-muted)]">
        <div className="flex items-center gap-1.5"><MapPin size={12} />{race.location}, {race.country}</div>
        <div className="flex items-center gap-1.5">
          <Calendar size={12} />{formatDate(race.date)}
          {days > 0 && days <= 60 && <span className="text-[var(--color-orange)] text-xs font-semibold ml-1">{days}d</span>}
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--color-navy-border)]">
        <span className={`text-xs font-semibold ${isOpen ? 'text-[var(--color-orange)]' : 'text-[var(--color-muted)]'}`}>
          {isOpen ? 'Monte seu time →' : 'Ver detalhes →'}
        </span>
        <ChevronRight size={14} className="text-[var(--color-muted)] group-hover:text-[var(--color-orange)] transition-colors" />
      </div>
    </Link>
  )
}

export default async function ProvasPage() {
  const pub = createPublicClient()

  const { data: races } = await pub
    .from('races')
    .select('*')
    .order('date', { ascending: true })

  const open     = (races ?? []).filter(r => r.status === 'open') as Race[]
  const upcoming = (races ?? []).filter(r => r.status === 'upcoming') as Race[]
  const finished = (races ?? []).filter(r => r.status === 'finished') as Race[]

  return (
    <PublicShell>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Calendário de Provas</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {open.length > 0 && <span className="text-[var(--color-success)] font-semibold">{open.length} aberta{open.length > 1 ? 's' : ''} para escalação · </span>}
            {upcoming.length} em breve · {finished.length} encerradas
          </p>
        </div>

        {open.length > 0 && (
          <section className="mb-10">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-success)] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse inline-block" />
              Abertas para escalação
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {open.map(r => <RaceCard key={r.id} race={r} />)}
            </div>
          </section>
        )}

        {upcoming.length > 0 && (
          <section className="mb-10">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-muted)] mb-4">Em breve</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcoming.map(r => <RaceCard key={r.id} race={r} />)}
            </div>
          </section>
        )}

        {finished.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-muted)] mb-4">Encerradas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
              {finished.map(r => <RaceCard key={r.id} race={r} />)}
            </div>
          </section>
        )}
      </div>
    </PublicShell>
  )
}
